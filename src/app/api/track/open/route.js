import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const ONE_BY_ONE_GIF = Buffer.from(
  'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');

  if (!jobId) {
    return new NextResponse('Missing id', { status: 400 });
  }

  // Persist open event — fire and forget, don't block the GIF response
  try {
    const supabase = createAdminClient();
    const { data: job } = await supabase
      .from('jobs')
      .select('campaign_id')
      .eq('id', jobId)
      .single();

    if (job) {
      await supabase.from('tracking_events').insert({
        job_id: jobId,
        campaign_id: job.campaign_id,
        event_type: 'open',
        ip: request.headers.get('x-forwarded-for') || null,
        user_agent: request.headers.get('user-agent') || null,
      });
    }
  } catch (err) {
    console.error('[track/open]', err.message);
  }

  return new NextResponse(ONE_BY_ONE_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
