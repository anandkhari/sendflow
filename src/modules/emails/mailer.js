import nodemailer from 'nodemailer';

let transporter;

export function getTransporter() {
  if (!transporter) {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 0);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !port || !user || !pass) {
      throw new Error('Missing SMTP configuration. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS.');
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return transporter;
}
