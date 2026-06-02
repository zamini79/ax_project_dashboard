-- ============================================
-- 003. Projects (과제 본체)
-- ============================================
-- headquarters에 의존.

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  mprs            mprs_category NOT NULL,
  headquarter_id  UUID NOT NULL REFERENCES headquarters(id) ON DELETE RESTRICT,
  lifecycle       project_lifecycle NOT NULL DEFAULT 'not_started',
  start_date      DATE,
  end_date        DATE,
  total_budget    NUMERIC(15, 2),     -- 원 단위
  fte             NUMERIC(5, 2),
  health          project_health NOT NULL DEFAULT 'green',
  progress_pct    INT NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_projects_mprs       ON projects(mprs);
CREATE INDEX idx_projects_health     ON projects(health);
CREATE INDEX idx_projects_lifecycle  ON projects(lifecycle);
CREATE INDEX idx_projects_hq         ON projects(headquarter_id);
CREATE INDEX idx_projects_archived   ON projects(is_archived) WHERE is_archived = false;
