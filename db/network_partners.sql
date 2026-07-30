-- Network partners (landing "CBrilliance network" cards)
-- Run: psql "$DATABASE_URL" -f db/network_partners.sql

CREATE TABLE IF NOT EXISTS network_partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  href          TEXT,
  logo_url      TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS network_partners_sort_idx
  ON network_partners (sort_order ASC, created_at ASC)
  WHERE deleted_at IS NULL;

INSERT INTO network_partners (name, href, logo_url, sort_order, is_published)
SELECT v.name, v.href, NULL, v.sort_order, TRUE
FROM (
  VALUES
    ('CBrilliance', 'https://cbrilliance.io', 0),
    ('Popin', 'https://popin.club', 1),
    ('CBC Nets', 'https://cbcnets.com', 2)
) AS v(name, href, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM network_partners np
  WHERE np.name = v.name
    AND np.deleted_at IS NULL
);
