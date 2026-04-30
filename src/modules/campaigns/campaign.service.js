import crypto from 'crypto';
import { getTransporter } from '../emails/mailer.js';

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return 'http://localhost:3000';
  return baseUrl.replace(/\/+$/, '');
}

function buildOpenPixelUrl({ baseUrl, emailId }) {
  return `${baseUrl}/api/track/open?id=${encodeURIComponent(emailId)}`;
}

function buildClickUrl({ baseUrl, emailId, realUrl }) {
  return `${baseUrl}/api/track/click?id=${encodeURIComponent(emailId)}&url=${encodeURIComponent(
    realUrl
  )}`;
}

function wrapLinksWithTracking({ html, emailId, baseUrl }) {
  // Replace href targets in <a> tags with tracking URLs.
  return html.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
    if (!href) return match;
    if (href.startsWith(`${baseUrl}/api/track/click`)) return match;
    const trackedUrl = buildClickUrl({ baseUrl, emailId, realUrl: href });
    return match.replace(href, trackedUrl);
  });
}

function injectOpenPixel({ html, emailId, baseUrl }) {
  const pixelUrl = buildOpenPixelUrl({ baseUrl, emailId });
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
  return `${html}${pixelTag}`;
}

function applyEmailTracking({ html, emailId }) {
  const baseUrl = normalizeBaseUrl(
    process.env.TRACKING_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL
  );
  const withClicks = wrapLinksWithTracking({ html, emailId, baseUrl });
  return injectOpenPixel({ html: withClicks, emailId, baseUrl });
}

export async function sendEmail({ to, subject, html, jobId }) {
  const transporter = getTransporter();
  const emailId = jobId || crypto.randomUUID();
  const trackedHtml = applyEmailTracking({ html, emailId });

  const from = process.env.EMAIL_USER;
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html: trackedHtml,
  });

  console.log('[email] sent', { messageId: info.messageId, to, subject, emailId });
  return { info, emailId };
}
