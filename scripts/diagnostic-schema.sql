CREATE TABLE IF NOT EXISTS diagnostic_attempts (
  token_hash text PRIMARY KEY,
  version text NOT NULL,
  exam jsonb NOT NULL,
  profile jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  workspace jsonb NOT NULL DEFAULT '{}',
  plan_progress jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '45 minutes',
  submitted_at timestamptz,
  auto_submitted boolean NOT NULL DEFAULT false,
  result jsonb,
  editor text,
  editor_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
