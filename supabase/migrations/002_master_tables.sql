-- ============================================
-- 002. Master Tables
-- ============================================
-- headquarters → departments → people 순서 (FK 의존성).
-- ai_techs는 독립.

CREATE TABLE headquarters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  headquarter_id  UUID REFERENCES headquarters(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_departments_hq ON departments(headquarter_id);

CREATE TABLE people (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  email          TEXT UNIQUE,
  department_id  UUID REFERENCES departments(id) ON DELETE SET NULL,
  role           user_role NOT NULL DEFAULT 'user',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_people_department ON people(department_id);
CREATE INDEX idx_people_email      ON people(email);

CREATE TABLE ai_techs (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);
