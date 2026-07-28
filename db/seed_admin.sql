-- Admin login seed
-- Preferred: npm run db:seed
-- Reads ADMIN_EMAIL + ADMIN_PASSWORD from .env and upserts SUPER_ADMIN.
--
-- Current .env defaults:
--   email:    admin@boboreality.com
--   password: BoboAdmin2026!
--
-- Login URL: /admin/login
--
-- After seeding, verify:
SELECT id, email, role, "isActive", "createdAt"
FROM admins
ORDER BY "createdAt" DESC;
