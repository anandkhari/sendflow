import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

function isSafeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('id');
  const url = searchParams.get('url');

  if (!jobId || !url) {
    return new NextResponse('Missing id or url', { status: 400 });
  }

  const decodedUrl = decodeURIComponent(url);
  if (!isSafeHttpUrl(decodedUrl)) {
    return new NextResponse('Invalid url', { status: 400 });
  }

  // Persist click event — don't block the redirect
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
        event_type: 'click',
        url: decodedUrl,
        ip: request.headers.get('x-forwarded-for') || null,
        user_agent: request.headers.get('user-agent') || null,
      });
    }
  } catch (err) {
    console.error('[track/click]', err.message);
  }

  return NextResponse.redirect(decodedUrl, 302);
}
