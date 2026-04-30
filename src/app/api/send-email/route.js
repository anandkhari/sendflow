import { NextResponse } from 'next/server';
import { sendEmail } from '../../../modules/campaigns/campaign.service.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body || {};

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const { info, emailId } = await sendEmail({ to, subject, html });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      emailId,
    });
  } catch (err) {
    console.error('[email] error', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
