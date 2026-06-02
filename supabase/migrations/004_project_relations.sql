-- ============================================
-- 004. Project M:N Relations
-- ============================================
-- projects, people, departments, ai_techs에 의존.

-- 공동 PM
CREATE TABLE project_pms (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES people(id)   ON DELETE RESTRICT,
  PRIMARY KEY (project_id, person_id)
);

CREATE INDEX idx_project_pms_person ON project_pms(person_id);

-- 유관부서 + 담당자 (부서당 N명, 담당자 미정 수용)
CREATE TABLE project_stakeholders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  department_id  UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  person_id      UUID REFERENCES people(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (project_id, department_id, person_id)
);

CREATE INDEX idx_stake_project    ON project_stakeholders(project_id);
CREATE INDEX idx_stake_department ON project_stakeholders(department_id);
CREATE INDEX idx_stake_person     ON project_stakeholders(person_id);

-- AI기술 태깅
CREATE TABLE project_ai_techs (
  project_id  UUID NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  ai_tech_id  UUID NOT NULL REFERENCES ai_techs(id)  ON DELETE RESTRICT,
  PRIMARY KEY (project_id, ai_tech_id)
);

CREATE INDEX idx_project_ai_techs_tech ON project_ai_techs(ai_tech_id);
