-- ============================================
-- 005. Project Budget (월별 집행)
-- ============================================
-- 누계는 저장하지 않고 SUM window로 계산.

CREATE TABLE project_budget_monthly (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  year_month  CHAR(7) NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),  -- 'YYYY-MM'
  amount      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, year_month)
);
