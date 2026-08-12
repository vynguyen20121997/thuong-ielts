-- Schema for thuong-ielts admin data (testimonials, feedbacks, blog).
-- Run once via: npx tsx scripts/migrate.ts

CREATE TABLE IF NOT EXISTS testimonials (
  id             TEXT PRIMARY KEY,
  student_name   TEXT NOT NULL,
  score          TEXT NOT NULL,
  before_score   TEXT,
  after_score    TEXT,
  school_or_job  TEXT,
  course_id      TEXT,
  course_name    TEXT,
  comment        TEXT,
  avatar_url     TEXT,
  proof_urls     TEXT[] NOT NULL DEFAULT '{}',
  listening      TEXT,
  reading        TEXT,
  writing        TEXT,
  speaking       TEXT,
  rating         INTEGER,
  helpful_count  INTEGER DEFAULT 0,
  date           DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id                TEXT PRIMARY KEY,
  subject           TEXT NOT NULL,
  image_url         TEXT,
  date              DATE,
  is_class_summary  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  content           TEXT NOT NULL,
  excerpt           TEXT,
  cover_image_url   TEXT,
  meta_title        TEXT,
  meta_description  TEXT,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generic editable site content (single-row-per-section, JSON payload).
-- Currently used for the homepage Hero section (portrait image + text).
CREATE TABLE IF NOT EXISTS site_content (
  key         TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_date ON testimonials (date DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_date ON feedbacks (date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts (status, published_at DESC);
