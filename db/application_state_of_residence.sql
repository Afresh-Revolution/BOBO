-- Add state of residence to applications
-- Run: bun scripts/run-sql.js db/application_state_of_residence.sql
--   or: psql "$DATABASE_URL" -f db/application_state_of_residence.sql
--
-- Note: the live apps table uses Prisma camelCase column names for core fields.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS "stateOfResidence" TEXT;

UPDATE applications
SET "stateOfResidence" = 'Unknown'
WHERE "stateOfResidence" IS NULL OR btrim("stateOfResidence") = '';

ALTER TABLE applications
  ALTER COLUMN "stateOfResidence" SET NOT NULL;

-- Align payment defaults with current registration fee (5 CBC ≈ ₦150,000)
ALTER TABLE payments
  ALTER COLUMN "amountCbc" SET DEFAULT 5,
  ALTER COLUMN "amountNgnApprox" SET DEFAULT 150000;

-- Optionally update existing pending/completed rows that still have the old fee
UPDATE payments
SET "amountCbc" = 5,
    "amountNgnApprox" = 150000
WHERE "amountCbc" = 3 OR "amountNgnApprox" = 75000;
