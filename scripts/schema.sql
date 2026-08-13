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

-- "Kiểm tra kiến thức IELTS" — Reading exercises.
--
-- passage/questions/answer_key are JSONB rather than normalised child tables on
-- purpose: a reading paper is a document, questions are heterogeneous (MCQ,
-- TFNG, matching headings, gap-fill each need different fields), and the whole
-- paper is always read and written as one unit. Normalising it would buy joins
-- we never run and cost a schema migration every time a new question type is
-- added.
--
-- answer_key is a SEPARATE column so that public queries can simply not select
-- it. Leaking the answers to the browser then requires writing a new query, not
-- merely forgetting to strip a field.
CREATE TABLE IF NOT EXISTS reading_tests (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  collection        TEXT,
  topic             TEXT,
  level             TEXT NOT NULL DEFAULT 'medium' CHECK (level IN ('easy', 'medium', 'hard')),
  duration_seconds  INTEGER NOT NULL DEFAULT 1200,
  question_count    INTEGER NOT NULL DEFAULT 0,
  attempt_count     INTEGER NOT NULL DEFAULT 0,
  is_free           BOOLEAN NOT NULL DEFAULT true,
  cover_image_url   TEXT,
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order        INTEGER NOT NULL DEFAULT 0,
  published_at      DATE,
  passage           JSONB NOT NULL,
  questions         JSONB NOT NULL,
  answer_key        JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_date ON testimonials (date DESC);
CREATE INDEX IF NOT EXISTS idx_reading_tests_status ON reading_tests (status, sort_order, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_date ON feedbacks (date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts (status, published_at DESC);
