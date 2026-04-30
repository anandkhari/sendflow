import { createAdminClient } from "@/lib/supabase-admin";
import { sendEmail } from "@/modules/campaigns/campaign.service";

// Returns "HH:MM" for the current moment in the given IANA timezone.
function currentHHMM(timezone) {
  const now = new Date();
  const s = now.toLocaleString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace("24:", "00:"); // midnight edge case in some V8 builds
  return s.slice(0, 5);
}

// Returns true if current time in the campaign's timezone is within [sendStart, sendEnd).
function isWithinSendWindow(timezone, sendStart, sendEnd) {
  const hhmm = currentHHMM(timezone);
  return hhmm >= sendStart && hhmm < sendEnd;
}

export async function runSendWorker() {
  console.log("Worker started");

  const IS_SEND_ENABLED = process.env.SEND_ENABLED === "true";
  if (!IS_SEND_ENABLED) {
    console.log("Worker running in SAFE MODE — emails NOT sent");
    return;
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    // 1. Fetch active campaign IDs
    const { data: activeCampaigns } = await supabase
      .from("campaigns")
      .select("id")
      .eq("status", "active");

    if (!activeCampaigns || activeCampaigns.length === 0) {
      console.log("No active campaigns");
      return;
    }

    const activeCampaignIds = activeCampaigns.map((c) => c.id);

    // 2. Load send-window settings for all active campaigns
    const { data: settingsRows } = await supabase
      .from("campaign_settings")
      .select("campaign_id, timezone, send_start, send_end, delay_seconds")
      .in("campaign_id", activeCampaignIds);

    const settingsMap = {};
    for (const s of settingsRows || []) {
      settingsMap[s.campaign_id] = s;
    }

    // 3. Keep only campaigns whose current local time is within [send_start, send_end)
    const sendableCampaignIds = activeCampaignIds.filter((id) => {
      const s = settingsMap[id];
      if (!s) return true; // no settings row → always send
      const timezone  = s.timezone   || "UTC";
      const sendStart = (s.send_start || "09:00").slice(0, 5);
      const sendEnd   = (s.send_end   || "17:00").slice(0, 5);
      return isWithinSendWindow(timezone, sendStart, sendEnd);
    });

    if (sendableCampaignIds.length === 0) {
      console.log("All active campaigns are outside their send window");
      return;
    }

    // 4. Fetch due pending jobs for sendable campaigns, oldest first
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, email, campaign_id, step_id")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .in("campaign_id", sendableCampaignIds)
      .order("scheduled_at", { ascending: true })
      .limit(5);

    if (error) throw error;

    if (!jobs || jobs.length === 0) {
      console.log("No pending scheduled jobs");
      return;
    }

    // 5. Send each job, honouring per-campaign delay_seconds between sends
    for (const job of jobs) {
      try {
        const { data: step } = await supabase
          .from("steps")
          .select("subject, body")
          .eq("id", job.step_id)
          .single();

        await sendEmail({
          to: job.email,
          subject: step?.subject || "(no subject)",
          html: step?.body || "<p>Hello from SendFlow</p>",
          jobId: job.id,
        });

        await supabase
          .from("jobs")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", job.id);

        console.log("Sent:", job.email);

        // Throttle: wait delay_seconds before the next send
        const delaySec = settingsMap[job.campaign_id]?.delay_seconds ?? 0;
        if (delaySec > 0) {
          await new Promise((r) => setTimeout(r, delaySec * 1000));
        }
      } catch (err) {
        console.error("Failed sending job", job.id, err.message);
        await supabase
          .from("jobs")
          .update({ status: "failed", error: err.message })
          .eq("id", job.id);
      }
    }
  } catch (err) {
    console.error("Worker crashed:", err);
  }
}
