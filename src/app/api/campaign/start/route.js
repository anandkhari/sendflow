import { NextResponse } from "next/server";
import { createEmailJobs } from "@/server/queue/email.queue";
import { getCampaignById, updateCampaignStatus } from "@/server/db/campaign.repository";

export async function POST(request) {
  try {
    const { campaignId, mailboxId } = await request.json();

    if (!campaignId || !mailboxId) {
      return NextResponse.json(
        { success: false, error: "Missing campaignId or mailboxId" },
        { status: 400 }
      );
    }

    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status === "active") {
      return NextResponse.json(
        { success: false, error: "Campaign already active" },
        { status: 400 }
      );
    }

    if (!campaign.hasSteps || !campaign.hasProspects) {
      return NextResponse.json(
        { success: false, error: "Campaign missing steps or prospects" },
        { status: 400 }
      );
    }

    await createEmailJobs({ campaignId, mailboxId });
    await updateCampaignStatus(campaignId, "active");

    return NextResponse.json({ success: true, message: "Campaign activated" });
  } catch (error) {
    console.error("[campaign/start]", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start campaign" },
      { status: 500 }
    );
  }
}
