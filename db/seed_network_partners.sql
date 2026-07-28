-- Seed / reset default network partners for the landing Partners section.
-- Safe to re-run: soft-deletes nothing; only inserts missing names.

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
