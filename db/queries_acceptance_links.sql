-- Acceptance / registration magic links (48h, single-use)
-- Created when admin approves an application. Link: /accept/{rawToken}

-- Verify recent acceptance links
SELECT
  ml.id,
  ml.type,
  a.email,
  a."fullName",
  ml."expiresAt",
  ml."usedAt",
  ml."revokedAt",
  ml."createdAt"
FROM magic_links ml
JOIN applications a ON a.id = ml."applicationId"
WHERE ml.type = 'ACCEPTANCE'
ORDER BY ml."createdAt" DESC
LIMIT 20;

-- Verify pending CBC receipt payments
SELECT
  p.id,
  a.email,
  a."fullName",
  p.status,
  p.reference,
  p.meta,
  p."createdAt"
FROM payments p
JOIN applications a ON a.id = p."applicationId"
WHERE p.status = 'PENDING'
ORDER BY p."createdAt" DESC;
