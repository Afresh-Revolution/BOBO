-- BOBO PostgreSQL schema (all SQL lives under db/)
-- Battle Of Baddies On
-- Run: psql "$DATABASE_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE application_status AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'REGISTERED',
  'EXPIRED'
);
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE magic_link_type AS ENUM (
  'ACCEPTANCE',
  'REGISTRATION_REMINDER',
  'PASSWORD_RESET'
);
CREATE TYPE media_kind AS ENUM (
  'BIRTH_CERTIFICATE',
  'ENTRY_VIDEO',
  'GALLERY',
  'SPONSOR',
  'HERO',
  'CBC_RECEIPT',
  'OTHER'
);
CREATE TYPE email_template AS ENUM (
  'APPLICATION_RECEIVED',
  'APPLICATION_APPROVED',
  'APPLICATION_REJECTED',
  'REGISTRATION_REMINDER',
  'LINK_EXPIRED',
  'PAYMENT_CONFIRMATION'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admins (
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

CREATE TABLE applications (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name               TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  age                     INT NOT NULL CHECK (age BETWEEN 18 AND 38),
  mother_maiden_name      TEXT NOT NULL,
  nin                     TEXT NOT NULL,
  tiktok_url              TEXT,
  instagram_url           TEXT,
  x_url                   TEXT,
  facebook_url            TEXT,
  blood_group             TEXT NOT NULL,
  genotype                TEXT NOT NULL,
  history_of_ailments     TEXT,
  current_health_challenge TEXT,
  eligibility_ack         BOOLEAN NOT NULL DEFAULT FALSE,
  status                  application_status NOT NULL DEFAULT 'PENDING',
  reviewed_by_id          UUID REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ,
  rejection_reason        TEXT,
  notes                   TEXT,
  registered_at           TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX applications_status_idx ON applications(status);
CREATE INDEX applications_email_idx ON applications(email);
CREATE INDEX applications_created_at_idx ON applications(created_at DESC);

CREATE TABLE media (
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

CREATE TABLE videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  media_id        UUID NOT NULL UNIQUE REFERENCES media(id) ON DELETE CASCADE,
  prompt_choice   TEXT NOT NULL CHECK (prompt_choice IN ('A','B','C','D')),
  duration_sec    FLOAT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  amount_cbc      NUMERIC(12, 4) NOT NULL DEFAULT 3,
  amount_ngn_approx INT NOT NULL DEFAULT 75000,
  status          payment_status NOT NULL DEFAULT 'PENDING',
  reference       TEXT UNIQUE,
  provider        TEXT NOT NULL DEFAULT 'CBC',
  paid_at         TIMESTAMPTZ,
  meta            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE magic_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  type            magic_link_type NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX magic_links_token_hash_idx ON magic_links(token_hash);

CREATE TABLE website_content (
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

CREATE TABLE email_logs (
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

CREATE TABLE audit_logs (
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

CREATE TABLE settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT NOT NULL UNIQUE,
  value           JSONB NOT NULL DEFAULT '{}',
  updated_by_id   UUID REFERENCES admins(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Season winners (hero slideshow)
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
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT season_winners_season_number_positive
    CHECK (season_number > 0),
  CONSTRAINT season_winners_season_number_unique
    UNIQUE (season_number)
);

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

-- Network partners (landing Partners cards)
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

-- Seed default CMS sections
INSERT INTO website_content (section_key, title, subtitle, body, cta_label, cta_href, sort_order) VALUES
  ('hero', 'BOBO', 'Battle Of Baddies On', 'Redefining what a Baddie truly means.', 'Start Application', '/apply', 0),
  ('about', 'The Standard', 'A Baddie is built on substance.', 'BOBO is redefining what a Baddie truly means — intelligence, elegance, purpose, class, style, and confidence.', NULL, NULL, 1),
  ('timeline', 'The Season', 'Mark the dates.', 'Portal opens August 1. Closes October 31. The show begins December 26.', NULL, NULL, 2),
  ('faq', 'FAQ', 'Answers, without the fluff.', NULL, NULL, NULL, 3),
  ('sponsors', 'Partners', 'Powered by the ecosystem.', 'Applications, voting, and registration live across the CBrilliance network.', NULL, NULL, 4);

INSERT INTO network_partners (name, href, logo_url, sort_order, is_published)
SELECT v.name, v.href, NULL, v.sort_order, TRUE
FROM (
  VALUES
    ('CBrilliance', 'https://cbrilliance.io', 0),
    ('Popin', 'https://popin.club', 1),
    ('CBC Nets', 'https://cbcnets.com', 2)
) AS v(name, href, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM network_partners np
  WHERE np.name = v.name AND np.deleted_at IS NULL
);
