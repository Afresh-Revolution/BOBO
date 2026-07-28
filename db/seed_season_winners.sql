-- Seed: Season 1 winner (hero slideshow)
-- Run after db/schema.sql. Safe to re-run (upsert on season_number).

INSERT INTO season_winners (
  season_number,
  season_label,
  winner_name,
  state_of_origin,
  image_url,
  sort_order,
  is_published
)
VALUES (
  1,
  'Season 1',
  'OBIANUJU',
  'Abuja',
  '/winner.png',
  0,
  TRUE
)
ON CONFLICT (season_number) DO UPDATE SET
  season_label     = EXCLUDED.season_label,
  winner_name      = EXCLUDED.winner_name,
  state_of_origin  = EXCLUDED.state_of_origin,
  image_url        = EXCLUDED.image_url,
  sort_order       = EXCLUDED.sort_order,
  is_published     = EXCLUDED.is_published,
  deleted_at       = NULL,
  updated_at       = NOW();
