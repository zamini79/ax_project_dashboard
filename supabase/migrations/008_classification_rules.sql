-- ============================================
-- 008. Confluence Classification Rules (어댑터)
-- ============================================
-- departments, projects에 의존. Phase 2에서 본격 사용.

CREATE TABLE confluence_classification_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,  -- nullable: 전역
  project_id      UUID REFERENCES projects(id)    ON DELETE CASCADE,  -- nullable: 특정 과제
  target_field    rule_target_field NOT NULL,
  pattern         TEXT NOT NULL,                  -- 정규식
  assigned_role   confluence_page_role NOT NULL,
  priority        INT NOT NULL DEFAULT 100,       -- 낮을수록 먼저
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES people(id)
);

CREATE INDEX idx_rules_department ON confluence_classification_rules(department_id);
CREATE INDEX idx_rules_project    ON confluence_classification_rules(project_id);
CREATE INDEX idx_rules_priority   ON confluence_classification_rules(priority);
