-- BOBO PostgreSQL schema (all SQL lives under db/)
-- Battle Of Baddies On
--
-- Safe to re-run: skips existing types/tables/indexes/columns,
-- never drops tables, and never overwrites existing rows.
-- Run: psql "$DATABASE_URL" -f db/schema.sql
--   or: bun scripts/run-sql.js db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums (skip if already present)
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'REGISTERED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE magic_link_type AS ENUM (
    'ACCEPTANCE',
    'REGISTRATION_REMINDER',
    'PASSWORD_RESET'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_kind AS ENUM (
    'BIRTH_CERTIFICATE',
    'ENTRY_VIDEO',
    'GALLERY',
    'SPONSOR',
    'HERO',
    'CBC_RECEIPT',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE email_template AS ENUM (
    'APPLICATION_RECEIVED',
    'APPLICATION_APPROVED',
    'APPLICATION_REJECTED',
    'REGISTRATION_REMINDER',
    'LINK_EXPIRED',
    'PAYMENT_CONFIRMATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Core tables (create only if missing — never drop / truncate)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          admin_role NOT NULL DEFAULT 'ADMIN',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name                TEXT NOT NULL,
  email                    TEXT NOT NULL,
  phone                    TEXT NOT NULL,
  age                      INT NOT NULL CHECK (age BETWEEN 18 AND 38),
  state_of_residence       TEXT NOT NULL,
  mother_maiden_name       TEXT NOT NULL,
  nin                      TEXT NOT NULL,
  tiktok_url               TEXT,
  instagram_url            TEXT,
  x_url                    TEXT,
  facebook_url             TEXT,
  blood_group              TEXT NOT NULL,
  genotype                 TEXT NOT NULL,
  history_of_ailments      TEXT,
  current_health_challenge TEXT,
  eligibility_ack          BOOLEAN NOT NULL DEFAULT FALSE,
  status                   application_status NOT NULL DEFAULT 'PENDING',
  reviewed_by_id           UUID REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at              TIMESTAMPTZ,
  rejection_reason         TEXT,
  notes                    TEXT,
  registered_at            TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS applications_email_idx ON applications(email);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications(created_at DESC);
EXCEPTION
  WHEN undefined_column THEN
    BEGIN
      CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications("createdAt" DESC);
    EXCEPTION WHEN others THEN NULL;
    END;
  WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            media_kind NOT NULL,
  cloudinary_id   TEXT NOT NULL,
  url             TEXT NOT NULL,
  secure_url      TEXT NOT NULL,
  format          TEXT,
  bytes           INT,
  duration_sec    FLOAT,
  width           INT,
  height          INT,
  original_name   TEXT,
  mime_type       TEXT,
  uploaded_by     UUID REFERENCES admins(id) ON DELETE SET NULL,
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  meta            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  media_id        UUID NOT NULL UNIQUE REFERENCES media(id) ON DELETE CASCADE,
  prompt_choice   TEXT NOT NULL CHECK (prompt_choice IN ('A','B','C','D')),
  duration_sec    FLOAT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  amount_cbc        NUMERIC(12, 4) NOT NULL DEFAULT 5,
  amount_ngn_approx INT NOT NULL DEFAULT 150000,
  status            payment_status NOT NULL DEFAULT 'PENDING',
  reference         TEXT UNIQUE,
  provider          TEXT NOT NULL DEFAULT 'CBC',
  paid_at           TIMESTAMPTZ,
  meta              JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS magic_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  type            magic_link_type NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS magic_links_token_hash_idx ON magic_links(token_hash);
EXCEPTION
  WHEN undefined_column THEN
    BEGIN
      CREATE INDEX IF NOT EXISTS magic_links_token_hash_idx ON magic_links("tokenHash");
    EXCEPTION WHEN others THEN NULL;
    END;
  WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS website_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key     TEXT NOT NULL UNIQUE,
  title           TEXT,
  subtitle        TEXT,
  body            TEXT,
  cta_label       TEXT,
  cta_href        TEXT,
  image_url       TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  meta            JSONB NOT NULL DEFAULT '{}',
  updated_by_id   UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  to_email        TEXT NOT NULL,
  template        email_template NOT NULL,
  subject         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'SENT',
  provider_id     TEXT,
  error           TEXT,
  meta            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID REFERENCES admins(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity          TEXT NOT NULL,
  entity_id       TEXT,
  ip              TEXT,
  user_agent      TEXT,
  meta            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT NOT NULL UNIQUE,
  value           JSONB NOT NULL DEFAULT '{}',
  updated_by_id   UUID REFERENCES admins(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Additive columns only when the column (snake or Prisma camelCase) is missing
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- applications.state of residence
  IF to_regclass('public.applications') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'applications'
         AND column_name IN ('state_of_residence', 'stateOfResidence')
     ) THEN
    ALTER TABLE applications ADD COLUMN state_of_residence TEXT;
  END IF;

  -- applications social URLs
  IF to_regclass('public.applications') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'tiktok_url'
    ) THEN
      ALTER TABLE applications ADD COLUMN tiktok_url TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'instagram_url'
    ) THEN
      ALTER TABLE applications ADD COLUMN instagram_url TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'x_url'
    ) THEN
      ALTER TABLE applications ADD COLUMN x_url TEXT;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'facebook_url'
    ) THEN
      ALTER TABLE applications ADD COLUMN facebook_url TEXT;
    END IF;
  END IF;

  -- website_content.meta
  IF to_regclass('public.website_content') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'website_content' AND column_name = 'meta'
     ) THEN
    ALTER TABLE website_content ADD COLUMN meta JSONB DEFAULT '{}';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Season winners (hero slideshow)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS season_winners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number     INTEGER NOT NULL,
  season_label      TEXT NOT NULL,
  winner_name       TEXT NOT NULL,
  state_of_origin   TEXT NOT NULL,
  image_url         TEXT NOT NULL,
  image_media_id    TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_published      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'season_winners_season_number_positive'
  ) THEN
    ALTER TABLE season_winners
      ADD CONSTRAINT season_winners_season_number_positive CHECK (season_number > 0);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.season_winners'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%season_number%'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE relname IN (
      'season_winners_season_number_unique',
      'season_winners_season_number_key'
    )
  ) THEN
    ALTER TABLE season_winners
      ADD CONSTRAINT season_winners_season_number_unique UNIQUE (season_number);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS season_winners_published_sort_idx
  ON season_winners (is_published, sort_order ASC, season_number DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS season_winners_admin_list_idx
  ON season_winners (deleted_at, season_number DESC);

DROP TRIGGER IF EXISTS season_winners_set_updated_at ON season_winners;
CREATE TRIGGER season_winners_set_updated_at
  BEFORE UPDATE ON season_winners
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

CREATE OR REPLACE VIEW v_season_winners_public AS
SELECT
  id,
  season_number,
  season_label,
  winner_name,
  state_of_origin,
  image_url,
  sort_order
FROM season_winners
WHERE is_published = TRUE
  AND deleted_at IS NULL
ORDER BY sort_order ASC, season_number DESC;

-- ---------------------------------------------------------------------------
-- Network partners (landing Partners cards)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS network_partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  href          TEXT,
  logo_url      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

ALTER TABLE network_partners ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE network_partners ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE network_partners ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE network_partners ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS network_partners_published_sort_idx
  ON network_partners (is_published, sort_order ASC, created_at ASC)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS network_partners_set_updated_at ON network_partners;
CREATE TRIGGER network_partners_set_updated_at
  BEFORE UPDATE ON network_partners
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

CREATE OR REPLACE VIEW v_network_partners_public AS
SELECT
  id,
  name,
  href,
  logo_url,
  sort_order
FROM network_partners
WHERE is_published = TRUE
  AND deleted_at IS NULL
ORDER BY sort_order ASC, created_at ASC;

-- ---------------------------------------------------------------------------
-- Seeds: insert missing defaults only — never overwrite existing CMS / partners
-- ---------------------------------------------------------------------------

-- Snake_case website_content (fresh schema.sql installs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'website_content'
      AND column_name = 'section_key'
  ) THEN
    INSERT INTO website_content (section_key, title, subtitle, body, cta_label, cta_href, sort_order, meta) VALUES
      ('hero', 'BOBO', 'Battle Of Baddies On', 'Redefining what a Baddie truly means.', 'Start Application', '/apply', 0,
       '{"support":"A Nigerian reality show for the intelligent, elegant, and purpose-driven, not merely the attractive.","secondaryCtaLabel":"Discover BOBO","secondaryCtaHref":"#about"}'::jsonb),
      ('about', 'The Standard', 'A Baddie is built on substance.', 'BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence. Attractiveness alone never enters the room first.', NULL, NULL, 1,
       '{"pillars":["Intelligent","Elegant","Purpose Driven","Classy","Stylish","Confident"],"statement":"20 baddies, 1 week, 1 crown, 1 winner. A stage for Nigerian excellence, filmed like fashion, judged like character."}'::jsonb),
      ('timeline', 'The Season', 'Mark the dates.', 'Portal opens August 3. Closes October 31. The show begins December 26.', NULL, NULL, 2,
       '{"items":[{"id":"opens","label":"Portal Opens","date":"August 3","detail":"Applications go live on August 3. Eligibility checklist first."},{"id":"closes","label":"Portal Closes","date":"October 31","detail":"Final day to submit your entry video and details (October 31)."},{"id":"begins","label":"Show Begins","date":"December 26","detail":"20 baddies, 1 week, 1 crown, 1 winner."}]}'::jsonb),
      ('how_to_apply', 'How To Apply', 'Four steps to the stage.', 'From eligibility to a secure registration link. The path is clear, intentional, and fair.', 'Begin Your Application', '/apply', 3,
       '{"steps":[{"step":"01","title":"Confirm eligibility","body":"CBrilliance account, 2,000+ followers, Nigerian, ages 18-38."},{"step":"02","title":"Submit your entry","body":"Profile details, birth certificate, and a 2-minute entry video."},{"step":"03","title":"Await review","body":"Our team reviews every application with care and intention."},{"step":"04","title":"Secure your place","body":"Approved applicants receive a private 48-hour registration link."}]}'::jsonb),
      ('eligibility', 'Eligibility', 'You must satisfy every requirement.', 'Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed.', NULL, NULL, 4,
       '{"items":["Have a CBrilliance Account","Have 2,000+ followers on at least one social platform (except Facebook)","Nigerian by nationality","Age between 18 and 38"],"note":"Need a CBrilliance account? Create one first. It is required for applications and for voting on Popin.","primaryCtaLabel":"Get CBrilliance","primaryCtaHref":"https://cbrilliance.io","secondaryCtaLabel":"Visit Popin","secondaryCtaHref":"https://popin.club"}'::jsonb),
      ('judging', 'Judging Process', 'Presence. Substance. Character. Style.', 'Every applicant is reviewed with the same lens: no shortcuts, no noise.', NULL, NULL, 5,
       '{"cards":[{"title":"Presence","body":"How you carry yourself on camera: composure, polish, and poise."},{"title":"Substance","body":"Clarity of thought. Purpose. The depth behind the presentation."},{"title":"Character","body":"Grace under pressure, integrity, and how you treat the room."},{"title":"Style","body":"Personal aesthetic that feels intentional, never try-hard."}]}'::jsonb),
      ('faq', 'FAQ', 'Answers, without the fluff.', 'Everything applicants ask before hitting submit.', NULL, NULL, 6,
       '{"items":[{"q":"Who can apply?","a":"Nigerian nationals aged 18-38 with a CBrilliance account and at least 2,000 followers on one social platform (excluding Facebook)."},{"q":"What should my entry video include?","a":"Introduce yourself (name and state), show a full-body recording, and answer one of the four prompt questions. Max 2 minutes, 100MB, MP4/MOV/AVI only."},{"q":"Is there a registration fee?","a":"Only approved applicants can register. The fee is 5 CBC (approx. ₦150,000). Payment is an investment into the CBC exchange ecosystem via cbcnets.com."},{"q":"Where does voting happen?","a":"Voting is not on this site. It takes place on popin.club. You need a CBrilliance account to vote."},{"q":"How many contestants make the show?","a":"20 baddies, 1 week, 1 crown, 1 winner."},{"q":"What happens after I apply?","a":"You will receive a confirmation. If approved, a secure single-use email link arrives (valid for 48 hours) to complete registration."}]}'::jsonb),
      ('sponsors', 'The Network', 'Powered by the ecosystem.', 'CBrilliance, Popin, and CBC Nets — identity, voting, and registration in one network.', NULL, NULL, 7, '{}'::jsonb)
    ON CONFLICT (section_key) DO NOTHING;
  END IF;
END $$;

-- Prisma camelCase website_content (live app DB) — missing keys only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'website_content'
      AND column_name = 'sectionKey'
  ) THEN
    INSERT INTO website_content (
      id, "sectionKey", title, subtitle, body, "ctaLabel", "ctaHref",
      "sortOrder", "isPublished", meta, "createdAt", "updatedAt"
    )
    SELECT
      gen_random_uuid()::text,
      v.section_key,
      v.title,
      v.subtitle,
      v.body,
      v.cta_label,
      v.cta_href,
      v.sort_order,
      TRUE,
      v.meta,
      NOW(),
      NOW()
    FROM (
      VALUES
        ('hero', 'BOBO', 'Battle Of Baddies On', 'Redefining what a Baddie truly means.', 'Start Application', '/apply', 0,
         '{"support":"A Nigerian reality show for the intelligent, elegant, and purpose-driven, not merely the attractive.","secondaryCtaLabel":"Discover BOBO","secondaryCtaHref":"#about"}'::jsonb),
        ('about', 'The Standard', 'A Baddie is built on substance.', 'BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence. Attractiveness alone never enters the room first.', NULL, NULL, 1,
         '{"pillars":["Intelligent","Elegant","Purpose Driven","Classy","Stylish","Confident"],"statement":"20 baddies, 1 week, 1 crown, 1 winner. A stage for Nigerian excellence, filmed like fashion, judged like character."}'::jsonb),
        ('timeline', 'The Season', 'Mark the dates.', 'Portal opens August 3. Closes October 31. The show begins December 26.', NULL, NULL, 2,
         '{"items":[{"id":"opens","label":"Portal Opens","date":"August 3","detail":"Applications go live on August 3. Eligibility checklist first."},{"id":"closes","label":"Portal Closes","date":"October 31","detail":"Final day to submit your entry video and details (October 31)."},{"id":"begins","label":"Show Begins","date":"December 26","detail":"20 baddies, 1 week, 1 crown, 1 winner."}]}'::jsonb),
        ('how_to_apply', 'How To Apply', 'Four steps to the stage.', 'From eligibility to a secure registration link. The path is clear, intentional, and fair.', 'Begin Your Application', '/apply', 3,
         '{"steps":[{"step":"01","title":"Confirm eligibility","body":"CBrilliance account, 2,000+ followers, Nigerian, ages 18-38."},{"step":"02","title":"Submit your entry","body":"Profile details, birth certificate, and a 2-minute entry video."},{"step":"03","title":"Await review","body":"Our team reviews every application with care and intention."},{"step":"04","title":"Secure your place","body":"Approved applicants receive a private 48-hour registration link."}]}'::jsonb),
        ('eligibility', 'Eligibility', 'You must satisfy every requirement.', 'Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed.', NULL, NULL, 4,
         '{"items":["Have a CBrilliance Account","Have 2,000+ followers on at least one social platform (except Facebook)","Nigerian by nationality","Age between 18 and 38"],"note":"Need a CBrilliance account? Create one first. It is required for applications and for voting on Popin.","primaryCtaLabel":"Get CBrilliance","primaryCtaHref":"https://cbrilliance.io","secondaryCtaLabel":"Visit Popin","secondaryCtaHref":"https://popin.club"}'::jsonb),
        ('judging', 'Judging Process', 'Presence. Substance. Character. Style.', 'Every applicant is reviewed with the same lens: no shortcuts, no noise.', NULL, NULL, 5,
         '{"cards":[{"title":"Presence","body":"How you carry yourself on camera: composure, polish, and poise."},{"title":"Substance","body":"Clarity of thought. Purpose. The depth behind the presentation."},{"title":"Character","body":"Grace under pressure, integrity, and how you treat the room."},{"title":"Style","body":"Personal aesthetic that feels intentional, never try-hard."}]}'::jsonb),
        ('faq', 'FAQ', 'Answers, without the fluff.', 'Everything applicants ask before hitting submit.', NULL, NULL, 6,
         '{"items":[{"q":"Who can apply?","a":"Nigerian nationals aged 18-38 with a CBrilliance account and at least 2,000 followers on one social platform (excluding Facebook)."},{"q":"What should my entry video include?","a":"Introduce yourself (name and state), show a full-body recording, and answer one of the four prompt questions. Max 2 minutes, 100MB, MP4/MOV/AVI only."},{"q":"Is there a registration fee?","a":"Only approved applicants can register. The fee is 5 CBC (approx. ₦150,000). Payment is an investment into the CBC exchange ecosystem via cbcnets.com."},{"q":"Where does voting happen?","a":"Voting is not on this site. It takes place on popin.club. You need a CBrilliance account to vote."},{"q":"How many contestants make the show?","a":"20 baddies, 1 week, 1 crown, 1 winner."},{"q":"What happens after I apply?","a":"You will receive a confirmation. If approved, a secure single-use email link arrives (valid for 48 hours) to complete registration."}]}'::jsonb),
        ('sponsors', 'The Network', 'Powered by the ecosystem.', 'CBrilliance, Popin, and CBC Nets — identity, voting, and registration in one network.', NULL, NULL, 7, '{}'::jsonb)
    ) AS v(section_key, title, subtitle, body, cta_label, cta_href, sort_order, meta)
    WHERE NOT EXISTS (
      SELECT 1 FROM website_content wc
      WHERE wc."sectionKey" = v.section_key
    );
  END IF;
END $$;

-- Network partners: add defaults only if name is missing (never overwrite)
INSERT INTO network_partners (name, href, logo_url, sort_order, is_published)
SELECT v.name, v.href, NULL, v.sort_order, TRUE
FROM (
  VALUES
    ('CBrilliance', 'https://cbrilliance.io', 0),
    ('Popin', 'https://popin.club', 1),
    ('CBC Nets', 'https://cbcnets.com', 2)
) AS v(name, href, sort_order)
WHERE to_regclass('public.network_partners') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM network_partners np
    WHERE np.name = v.name AND np.deleted_at IS NULL
  );
