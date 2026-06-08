-- ============================================
-- 017. 투자비 사업계획 (별도 관리) — D-031
-- ============================================
-- 연도별 사업계획 라인 항목. 계획은 수기/엑셀 입력, 집행은 매핑된 과제에서 자동 집계.
-- 항목 1개당 과제 1~N개 매핑(조인 테이블). 월별 계획도 별도 보관.

-- 사업계획 라인 항목
CREATE TABLE budget_plan_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year  INT NOT NULL,
  name         TEXT NOT NULL,
  plan_amount  NUMERIC NOT NULL DEFAULT 0,   -- 연간 계획(원). 화면은 억 환산
  sort         INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_budget_plan_items_year ON budget_plan_items(fiscal_year);

-- 항목별 월별 계획 (집행은 project_budget_monthly에서 자동 산출)
CREATE TABLE budget_plan_item_monthly (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES budget_plan_items(id) ON DELETE CASCADE,
  year_month   TEXT NOT NULL,                -- 'YYYY-MM'
  plan_amount  NUMERIC NOT NULL DEFAULT 0,
  UNIQUE (item_id, year_month)
);
CREATE INDEX idx_bpim_item ON budget_plan_item_monthly(item_id);

-- 항목 ↔ 과제 매핑 (1:N — 항목 1개에 과제 다수)
CREATE TABLE budget_plan_item_projects (
  item_id     UUID NOT NULL REFERENCES budget_plan_items(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, project_id)
);
CREATE INDEX idx_bpip_project ON budget_plan_item_projects(project_id);

-- RLS (기존 패턴 동일: 인증되면 모두 가능)
ALTER TABLE budget_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON budget_plan_items FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE budget_plan_item_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON budget_plan_item_monthly FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE budget_plan_item_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON budget_plan_item_projects FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
