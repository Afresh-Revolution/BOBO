-- Add social media URL columns to applications
-- Run: psql "$DATABASE_URL" -f db/application_social_links.sql

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS x_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT;
