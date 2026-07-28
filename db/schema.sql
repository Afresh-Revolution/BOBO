-- BOBO PostgreSQL — season winners (hero slideshow, CMS-editable)
-- Note: `media` is owned by Prisma (see prisma/schema.prisma). Do not recreate it here.
-- image_media_id stores an optional Media.id (cuid text) without a hard FK.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS season_winners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number     INTEGER NOT NULL,
  season_label      TEXT NOT NULL,              -- e.g. "Season 1"
  winner_name       TEXT NOT NULL,
  state_of_origin   TEXT NOT NULL,              -- e.g. "Lagos"
  image_url         TEXT NOT NULL,              -- absolute or /public path
  image_media_id    TEXT,                       -- optional Prisma Media.id
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

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Landing Partners section cards (CBrilliance network)
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
