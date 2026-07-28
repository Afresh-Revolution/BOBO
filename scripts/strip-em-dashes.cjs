const fs = require("fs");

const files = [
  "src/lib/admin-api.ts",
  "src/lib/serializers.ts",
  "src/app/admin/(dashboard)/payments/page.tsx",
  "src/app/admin/(dashboard)/contestants/page.tsx",
  "src/app/admin/(dashboard)/page.tsx",
  "src/app/admin/(dashboard)/applications/page.tsx",
  "src/app/admin/(dashboard)/analytics/page.tsx",
  "src/app/admin/(dashboard)/media/page.tsx",
  "src/app/admin/(dashboard)/admins/page.tsx",
  "src/app/admin/(dashboard)/emails/page.tsx",
  "src/app/(site)/apply/ApplyFlow.tsx",
  "src/app/(site)/apply/page.tsx",
  "src/app/accept/[token]/AcceptClient.tsx",
  "src/app/api/accept/[token]/route.ts",
  "src/app/api/accept/[token]/confirm-payment/route.ts",
  "src/lib/email.ts",
  "prisma/seed.ts",
];

const replacements = [
  // empty UI placeholders
  ['"—"', '"N/A"'],
  ["'—'", "'N/A'"],

  // prose / labels
  [
    "Season overview — applications, approvals, and payments.",
    "Season overview: applications, approvals, and payments.",
  ],
  [
    "Uploaded assets — videos, certificates, and site imagery.",
    "Uploaded assets: videos, certificates, and site imagery.",
  ],
  [
    "Transactional email log — approvals, rejections, reminders.",
    "Transactional email log: approvals, rejections, reminders.",
  ],
  [
    "Keep your registration link private — it is single-use and expires in 48 hours.",
    "Keep your registration link private. It is single-use and expires in 48 hours.",
  ],
  [
    "You're approved — complete BOBO registration",
    "You're approved: complete BOBO registration",
  ],
  [
    "You’re approved — complete BOBO registration",
    "You’re approved: complete BOBO registration",
  ],
  [
    "Congratulations — you’ve been approved for BOBO.",
    "Congratulations. You’ve been approved for BOBO.",
  ],
  [
    "Congratulations — you've been approved for BOBO.",
    "Congratulations. You've been approved for BOBO.",
  ],
  ['"Accepted — complete form"', '"Accepted: complete form"'],
  [
    "registration form within 48 hours — the link is single-use and cannot",
    "registration form within 48 hours. The link is single-use and cannot",
  ],
  [
    "Confirm eligibility and submit your BOBO contestant application — profile, birth certificate, and entry video.",
    "Confirm eligibility and submit your BOBO contestant application: profile, birth certificate, and entry video.",
  ],
  [
    "Portal open {siteConfig.show.portalOpens} –{\" \"}",
    "Portal open {siteConfig.show.portalOpens} to{\" \"}",
  ],
  [
    "directly — links are not accepted.",
    "directly. Links are not accepted.",
  ],
  [
    "Introduce yourself — <strong>name and state</strong>",
    "Introduce yourself (<strong>name and state</strong>)",
  ],
  [
    "Direct upload only — not a URL",
    "Direct upload only, not a URL",
  ],
  [
    "receive a private registration link by email — valid for 48 hours.",
    "receive a private registration link by email (valid for 48 hours).",
  ],
  [
    "BOBO is redefining what a Baddie truly means — intelligence, elegance, purpose, class, style, and confidence.",
    "BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence.",
  ],
  [
    "// Consume link — single-use, cannot be shared / reused",
    "// Consume link: single-use, cannot be shared / reused",
  ],
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.warn("missing", file);
    continue;
  }
  let source = fs.readFileSync(file, "utf8");
  const before = source;
  for (const [from, to] of replacements) {
    source = source.split(from).join(to);
  }
  // catch any remaining em/en dashes in these UI files
  source = source.replaceAll(" — ", ". ");
  source = source.replaceAll(" – ", " to ");
  source = source.replaceAll("—", "");
  source = source.replaceAll("–", "-");
  if (source !== before) {
    fs.writeFileSync(file, source);
    console.log("updated", file);
  } else {
    console.log("unchanged", file);
  }
}
