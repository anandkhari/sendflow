import { createAdminClient } from "@/lib/supabase-admin";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Returns a Date set to send_start on the correct sending day, in the given IANA timezone.
// If the computed date falls on an excluded day, bumps forward to the next allowed day.
function scheduledDateFor({ baseDateUtc, delayDays, sendStartHHMM, timezone, sendingDays }) {
  // Advance by delay days
  const target = new Date(baseDateUtc);
  target.setUTCDate(target.getUTCDate() + delayDays);

  // Keep bumping forward until we land on an allowed sending day
  const activeDays = sendingDays && sendingDays.length > 0 ? sendingDays : DAY_NAMES;
  let attempts = 0;
  while (attempts < 7) {
    const dayName = target.toLocaleDateString("en-US", { timeZone: timezone, weekday: "short" });
    if (activeDays.includes(dayName)) break;
    target.setUTCDate(target.getUTCDate() + 1);
    attempts++;
  }

  // Build a date string like "2026-05-02" in the campaign's timezone
  const localDateStr = target.toLocaleDateString("en-CA", { timeZone: timezone }); // "YYYY-MM-DD"

  // Combine with the send window start time
  const [hours, minutes] = sendStartHHMM.split(":").map(Number);
  const localDt = new Date(`${localDateStr}T${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:00`);

  // Convert to UTC by computing the timezone offset at that moment
  const inTz = new Date(localDt.toLocaleString("en-US", { timeZone: timezone }));
  const offsetMs = localDt - inTz;
  return new Date(localDt.getTime() + offsetMs);
}

export async function createEmailJobs({ campaignId, mailboxId }) {
  if (!campaignId || !mailboxId) {
    throw new Error("Missing campaignId or mailboxId");
  }

  const supabase = createAdminClient();

  // 1. Load steps ordered by step_order
  const { data: steps, error: stepsError } = await supabase
    .from("steps")
    .select("id, step_order, delay_days")
    .eq("campaign_id", campaignId)
    .order("step_order");

  if (stepsError || !steps || steps.length === 0) {
    throw new Error("Campaign has no steps");
  }

  // 2. Load prospects
  const { data: prospects, error: prospectsError } = await supabase
    .from("prospects")
    .select("id, email")
    .eq("campaign_id", campaignId);

  if (prospectsError || !prospects || prospects.length === 0) {
    throw new Error("Campaign has no prospects");
  }

  // 3. Prevent duplicate job creation
  const { count } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  if (count > 0) {
    throw new Error("Jobs already exist for this campaign");
  }

  // 4. Load campaign settings for timezone + send window
  const { data: settings } = await supabase
    .from("campaign_settings")
    .select("timezone, send_start, sending_days")
    .eq("campaign_id", campaignId)
    .single();

  const timezone    = settings?.timezone     || "UTC";
  const sendStart   = (settings?.send_start  || "09:00").slice(0, 5);
  const sendingDays = settings?.sending_days || [];
  const now         = new Date();

  // 5. Build all jobs — schedule each step at send_start time in campaign timezone
  const jobs = [];
  for (const prospect of prospects) {
    let cumulativeDelay = 0;
    for (const step of steps) {
      cumulativeDelay += step.delay_days || 0;
      const scheduledAt = scheduledDateFor({
        baseDateUtc: now,
        delayDays: cumulativeDelay,
        sendStartHHMM: sendStart,
        timezone,
        sendingDays,
      });

      jobs.push({
        campaign_id: campaignId,
        prospect_id: prospect.id,
        step_id: step.id,
        email: prospect.email,
        scheduled_at: scheduledAt.toISOString(),
        status: "pending",
        attempt: 0,
      });
    }
  }

  // 6. Insert in batches of 500
  const BATCH = 500;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const { error } = await supabase.from("jobs").insert(jobs.slice(i, i + BATCH));
    if (error) throw error;
  }

  console.log(`[jobs] Created ${jobs.length} jobs for campaign ${campaignId} (tz: ${timezone}, start: ${sendStart})`);
}

// Creates jobs only for prospects who have no jobs yet — safe to call on an already-active campaign.
export async function createJobsForNewProspects({ campaignId }) {
  const supabase = createAdminClient();

  const [stepsRes, allProspectsRes, existingJobsRes, settingsRes] = await Promise.all([
    supabase.from("steps").select("id, step_order, delay_days").eq("campaign_id", campaignId).order("step_order"),
    supabase.from("prospects").select("id, email").eq("campaign_id", campaignId),
    supabase.from("jobs").select("prospect_id").eq("campaign_id", campaignId),
    supabase.from("campaign_settings").select("timezone, send_start, sending_days").eq("campaign_id", campaignId).single(),
  ]);

  const steps = stepsRes.data || [];
  if (steps.length === 0) throw new Error("Campaign has no steps");

  const allProspects = allProspectsRes.data || [];
  const alreadyQueued = new Set((existingJobsRes.data || []).map((j) => j.prospect_id));
  const newProspects = allProspects.filter((p) => !alreadyQueued.has(p.id));

  if (newProspects.length === 0) return { created: 0 };

  const settings    = settingsRes.data;
  const timezone    = settings?.timezone    || "UTC";
  const sendStart   = (settings?.send_start || "09:00").slice(0, 5);
  const sendingDays = settings?.sending_days || [];
  const now         = new Date();

  const jobs = [];
  for (const prospect of newProspects) {
    let cumulativeDelay = 0;
    for (const step of steps) {
      cumulativeDelay += step.delay_days || 0;
      const scheduledAt = scheduledDateFor({
        baseDateUtc: now,
        delayDays: cumulativeDelay,
        sendStartHHMM: sendStart,
        timezone,
        sendingDays,
      });
      jobs.push({
        campaign_id: campaignId,
        prospect_id: prospect.id,
        step_id:     step.id,
        email:       prospect.email,
        scheduled_at: scheduledAt.toISOString(),
        status:  "pending",
        attempt: 0,
      });
    }
  }

  const BATCH = 500;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const { error } = await supabase.from("jobs").insert(jobs.slice(i, i + BATCH));
    if (error) throw error;
  }

  console.log(`[jobs] Queued ${jobs.length} jobs for ${newProspects.length} new prospects in campaign ${campaignId}`);
  return { created: jobs.length };
}
