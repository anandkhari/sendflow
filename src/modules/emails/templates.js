export function baseTemplate({ title, body }) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f6f7fb; margin: 0; padding: 24px; }
          .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 24px; }
          h1 { margin: 0 0 12px; font-size: 22px; }
          p { margin: 0 0 12px; line-height: 1.6; }
          .footer { margin-top: 24px; font-size: 12px; color: #667085; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${title}</h1>
          <div>${body}</div>
          <div class="footer">Sent by Email Marketing Engine</div>
        </div>
      </body>
    </html>
  `;
}

export function simpleMessage({ headline, message }) {
  return baseTemplate({
    title: headline,
    body: `<p>${message}</p>`,
  });
}
