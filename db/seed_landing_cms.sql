-- Seed / refresh all landing-page CMS sections (editable from Admin → CMS).
-- Live website_content uses Prisma camelCase column names.
-- Run: bun scripts/run-sql.js db/seed_landing_cms.sql

INSERT INTO website_content (
  id,
  "sectionKey",
  title,
  subtitle,
  body,
  "ctaLabel",
  "ctaHref",
  "sortOrder",
  "isPublished",
  meta,
  "createdAt",
  "updatedAt"
)
VALUES
(
  gen_random_uuid()::text,
  'hero',
  'BOBO',
  'Battle Of Baddies On',
  'Redefining what a Baddie truly means.',
  'Start Application',
  '/apply',
  0,
  TRUE,
  '{
    "support": "A Nigerian reality show for the intelligent, elegant, and purpose-driven, not merely the attractive.",
    "secondaryCtaLabel": "Discover BOBO",
    "secondaryCtaHref": "#about"
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'about',
  'The Standard',
  'A Baddie is built on substance.',
  'BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence. Attractiveness alone never enters the room first.',
  NULL,
  NULL,
  1,
  TRUE,
  '{
    "pillars": ["Intelligent", "Elegant", "Purpose Driven", "Classy", "Stylish", "Confident"],
    "statement": "20 baddies, 1 week, 1 crown, 1 winner. A stage for Nigerian excellence, filmed like fashion, judged like character."
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'timeline',
  'The Season',
  'Mark the dates.',
  'Portal opens August 3. Closes October 31. The show begins December 26.',
  NULL,
  NULL,
  2,
  TRUE,
  '{
    "items": [
      {
        "id": "opens",
        "label": "Portal Opens",
        "date": "August 3",
        "detail": "Applications go live on August 3. Eligibility checklist first."
      },
      {
        "id": "closes",
        "label": "Portal Closes",
        "date": "October 31",
        "detail": "Final day to submit your entry video and details (October 31)."
      },
      {
        "id": "begins",
        "label": "Show Begins",
        "date": "December 26",
        "detail": "20 baddies, 1 week, 1 crown, 1 winner."
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'how_to_apply',
  'How To Apply',
  'Four steps to the stage.',
  'From eligibility to a secure registration link. The path is clear, intentional, and fair.',
  'Begin Your Application',
  '/apply',
  3,
  TRUE,
  '{
    "steps": [
      {
        "step": "01",
        "title": "Confirm eligibility",
        "body": "CBrilliance account, 2,000+ followers, Nigerian, ages 18-38."
      },
      {
        "step": "02",
        "title": "Submit your entry",
        "body": "Profile details, birth certificate, and a 2-minute entry video."
      },
      {
        "step": "03",
        "title": "Await review",
        "body": "Our team reviews every application with care and intention."
      },
      {
        "step": "04",
        "title": "Secure your place",
        "body": "Approved applicants receive a private 48-hour registration link."
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'eligibility',
  'Eligibility',
  'You must satisfy every requirement.',
  'Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed.',
  NULL,
  NULL,
  4,
  TRUE,
  '{
    "items": [
      "Have a CBrilliance Account",
      "Have 2,000+ followers on at least one social platform (except Facebook)",
      "Nigerian by nationality",
      "Age between 18 and 38"
    ],
    "note": "Need a CBrilliance account? Create one first. It is required for applications and for voting on Popin.",
    "primaryCtaLabel": "Get CBrilliance",
    "primaryCtaHref": "https://cbrilliance.io",
    "secondaryCtaLabel": "Visit Popin",
    "secondaryCtaHref": "https://popin.club"
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'judging',
  'Judging Process',
  'Presence. Substance. Character. Style.',
  'Every applicant is reviewed with the same lens: no shortcuts, no noise.',
  NULL,
  NULL,
  5,
  TRUE,
  '{
    "cards": [
      {
        "title": "Presence",
        "body": "How you carry yourself on camera: composure, polish, and poise."
      },
      {
        "title": "Substance",
        "body": "Clarity of thought. Purpose. The depth behind the presentation."
      },
      {
        "title": "Character",
        "body": "Grace under pressure, integrity, and how you treat the room."
      },
      {
        "title": "Style",
        "body": "Personal aesthetic that feels intentional, never try-hard."
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'faq',
  'FAQ',
  'Answers, without the fluff.',
  'Everything applicants ask before hitting submit.',
  NULL,
  NULL,
  6,
  TRUE,
  '{
    "items": [
      {
        "q": "Who can apply?",
        "a": "Nigerian nationals aged 18-38 with a CBrilliance account and at least 2,000 followers on one social platform (excluding Facebook)."
      },
      {
        "q": "What should my entry video include?",
        "a": "Introduce yourself (name and state), show a full-body recording, and answer one of the four prompt questions. Max 2 minutes, 100MB, MP4/MOV/AVI only."
      },
      {
        "q": "Is there a registration fee?",
        "a": "Only approved applicants can register. The fee is 5 CBC (approx. ₦150,000). Payment is an investment into the CBC exchange ecosystem via cbcnets.com."
      },
      {
        "q": "Where does voting happen?",
        "a": "Voting is not on this site. It takes place on popin.club. You need a CBrilliance account to vote."
      },
      {
        "q": "How many contestants make the show?",
        "a": "20 baddies, 1 week, 1 crown, 1 winner."
      },
      {
        "q": "What happens after I apply?",
        "a": "You will receive a confirmation. If approved, a secure single-use email link arrives (valid for 48 hours) to complete registration."
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'sponsors',
  'The Network',
  'Powered by the ecosystem.',
  'CBrilliance, Popin, and CBC Nets — identity, voting, and registration in one network.',
  NULL,
  NULL,
  7,
  TRUE,
  '{}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid()::text,
  'gallery',
  'Gallery',
  'Moments from the stage.',
  'Browse albums from seasons, casting, and behind the scenes.',
  'Open gallery',
  '/gallery',
  8,
  TRUE,
  '{"pageTitle":"The gallery","pageDescription":"Albums from the BOBO world — seasons, casting, and moments off-camera."}'::jsonb,
  NOW(),
  NOW()
)
-- Insert missing sections only — never overwrite CMS edits already in the DB
ON CONFLICT ("sectionKey") DO NOTHING;
