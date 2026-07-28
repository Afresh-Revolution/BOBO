import { appUrl } from "@/lib/auth";

const PURPLE = "#4A148C";
const PURPLE_DEEP = "#2d0a56";
const GOLD = "#D4AF37";
const SMOKE = "#F5F5F5";
const INK = "#111111";
const MUTED = "#5c5c5c";
const WHITE = "#ffffff";
const LINE = "#e8e4ef";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type EmailLayoutOptions = {
  preheader?: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  secondaryNote?: string;
};

/** Table-based, inline-styled layout for major email clients. */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const {
    preheader = "",
    eyebrow = "BOBO",
    title,
    bodyHtml,
    cta,
    secondaryNote,
  } = options;

  const site = appUrl("/");
  const year = new Date().getFullYear();

  const ctaBlock = cta
    ? `
      <tr>
        <td align="center" style="padding:8px 0 28px;">
          <a href="${escapeHtml(cta.href)}"
             style="background:${GOLD};color:${INK};text-decoration:none;padding:16px 28px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;display:inline-block;font-family:Arial,Helvetica,sans-serif;">
            ${escapeHtml(cta.label)}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};word-break:break-all;">
          Button not working? Paste this link into your browser:<br/>
          <a href="${escapeHtml(cta.href)}" style="color:${PURPLE};text-decoration:underline;">${escapeHtml(cta.href)}</a>
        </td>
      </tr>`
    : "";

  const noteBlock = secondaryNote
    ? `
      <tr>
        <td style="padding:20px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SMOKE};border-radius:12px;border:1px solid ${LINE};">
            <tr>
              <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MUTED};">
                ${secondaryNote}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${SMOKE};color:${INK};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SMOKE};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${WHITE};border-radius:18px;overflow:hidden;border:1px solid ${LINE};box-shadow:0 18px 50px rgba(17,17,17,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg, ${PURPLE_DEEP} 0%, ${PURPLE} 70%);padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${GOLD};">
                    ${escapeHtml(eyebrow)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 10px;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;font-weight:700;color:${WHITE};">
                    ${escapeHtml(title)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 28px;">
                    <div style="width:56px;height:3px;background:${GOLD};border-radius:999px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${INK};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${INK};">
                    ${bodyHtml}
                  </td>
                </tr>
                ${ctaBlock}
                ${noteBlock}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${SMOKE};border-top:1px solid ${LINE};padding:22px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
                    <strong style="color:${PURPLE};letter-spacing:0.16em;">BOBO</strong>
                    &nbsp;·&nbsp;Battle Of Baddies On
                    <br/>
                    Official correspondence · Do not reply to this message
                    <br/>
                    <a href="${escapeHtml(site)}" style="color:${PURPLE};text-decoration:none;">${escapeHtml(site)}</a>
                    <br/><br/>
                    © ${year} Battle Of Baddies On. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td align="center" style="padding:18px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#999999;">
              Intelligent · Elegant · Purpose Driven · Classy · Stylish · Confident
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${INK};">${text}</p>`;
}

export function strong(text: string) {
  return `<strong style="color:${INK};">${text}</strong>`;
}

export function highlightCard(html: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;background:rgba(74,20,140,0.06);border:1px solid ${LINE};border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:${INK};border-left:4px solid ${GOLD};">
          ${html}
        </td>
      </tr>
    </table>`;
}

export function bulletList(items: string[]) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td valign="top" style="padding:0 10px 10px 0;color:${GOLD};font-size:16px;line-height:1.4;">●</td>
        <td style="padding:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${INK};">${item}</td>
      </tr>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;">
      ${rows}
    </table>`;
}

export function toPlainText(input: {
  title: string;
  greeting: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  footer?: string;
}) {
  const lines = [
    "BOBO · Battle Of Baddies On",
    "",
    input.title,
    "",
    input.greeting,
    "",
    ...input.paragraphs,
  ];

  if (input.cta) {
    lines.push("", `${input.cta.label}: ${input.cta.href}`);
  }

  lines.push(
    "",
    input.footer || "Official BOBO correspondence.",
    appUrl("/"),
  );

  return lines.join("\n");
}
