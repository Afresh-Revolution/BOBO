-- Admin CMS queries for season_winners
-- Safe to run in the Supabase / Postgres SQL editor.
-- Mutating examples are commented — uncomment and edit values before running.

-- ---------------------------------------------------------------------------
-- List all (admin table)
-- Optional search: set search to a string, or leave NULL for all rows.
-- ---------------------------------------------------------------------------
WITH params AS (
  SELECT NULL::text AS search   -- e.g. SELECT 'Lagos'::text AS search
)
SELECT
  sw.id,
  sw.season_number,
  sw.season_label,
  sw.winner_name,
  sw.state_of_origin,
  sw.image_url,
  sw.sort_order,
  sw.is_published,
  sw.created_at,
  sw.updated_at
FROM season_winners sw
CROSS JOIN params p
WHERE sw.deleted_at IS NULL
  AND (
    p.search IS NULL
    OR sw.winner_name ILIKE '%' || p.search || '%'
    OR sw.state_of_origin ILIKE '%' || p.search || '%'
    OR sw.season_label ILIKE '%' || p.search || '%'
  )
ORDER BY sw.sort_order ASC, sw.season_number DESC;

-- ---------------------------------------------------------------------------
-- Public feed (landing hero)
-- ---------------------------------------------------------------------------
SELECT
  id,
  season_number,
  season_label,
  winner_name,
  state_of_origin,
  image_url,
  sort_order
FROM v_season_winners_public;

-- ---------------------------------------------------------------------------
-- Create (uncomment to run)
-- ---------------------------------------------------------------------------
-- INSERT INTO season_winners (
--   season_number,
--   season_label,
--   winner_name,
--   state_of_origin,
--   image_url,
--   image_media_id,
--   sort_order,
--   is_published
-- )
-- VALUES (
--   2,
--   'Season 2',
--   'Winner Name',
--   'Lagos',
--   '/winner.png',
--   NULL,
--   1,
--   TRUE
-- )
-- RETURNING *;

-- ---------------------------------------------------------------------------
-- Update (uncomment to run — replace the id)
-- ---------------------------------------------------------------------------
-- UPDATE season_winners
-- SET
--   season_label     = 'Season 1',
--   winner_name      = 'OBIANUJU',
--   state_of_origin  = 'Abuja',
--   image_url        = '/winner.png',
--   sort_order       = 0,
--   is_published     = TRUE
-- WHERE id = '00000000-0000-0000-0000-000000000000'
--   AND deleted_at IS NULL
-- RETURNING *;

-- ---------------------------------------------------------------------------
-- Soft delete (uncomment to run — replace the id)
-- ---------------------------------------------------------------------------
-- UPDATE season_winners
-- SET deleted_at = NOW(), is_published = FALSE
-- WHERE id = '00000000-0000-0000-0000-000000000000'
--   AND deleted_at IS NULL
-- RETURNING id;

-- ---------------------------------------------------------------------------
-- Toggle publish (uncomment to run — replace the id)
-- ---------------------------------------------------------------------------
-- UPDATE season_winners
-- SET is_published = NOT is_published
-- WHERE id = '00000000-0000-0000-0000-000000000000'
--   AND deleted_at IS NULL
-- RETURNING id, is_published;
