import { createAdminClient } from '@/lib/supabase-admin'

export async function getCampaignById(campaignId) {
  const supabase = createAdminClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, status, steps(count), prospects(count)')
    .eq('id', campaignId)
    .single()

  if (!campaign) return null

  return {
    ...campaign,
    hasSteps: (campaign.steps?.[0]?.count ?? 0) > 0,
    hasProspects: (campaign.prospects?.[0]?.count ?? 0) > 0,
  }
}

export async function updateCampaignStatus(campaignId, status) {
  const supabase = createAdminClient()

  await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', campaignId)
}
