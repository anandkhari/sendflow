import { NextResponse } from "next/server";
import { createJobsForNewProspects } from "@/server/queue/email.queue";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request) {
  try {
    const { campaignId } = await request.json();

    if (!campaignId) {
      return NextResponse.json({ success: false, error: "Missing campaignId" }, { status: 400 });
    }

    // Only queue jobs if the campaign is active
    const supabase = createAdminClient();
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();

    if (campaign?.status !== "active") {
      return NextResponse.json({ success: true, created: 0, reason: "Campaign not active" });
    }

    const { created } = await createJobsForNewProspects({ campaignId });
    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("[campaign/reschedule]", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
