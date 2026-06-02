-- ============================================
-- 010. RLS Policies (Phase 0 - 단일 역할)
-- ============================================
-- 모든 테이블에 RLS 켜고 "인증되면 모두 가능" 통일 정책.
-- 미래 권한 분화 시 정책만 교체.

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON projects FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_updates FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_pms ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_pms FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_stakeholders FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_ai_techs ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_ai_techs FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_budget_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_budget_monthly FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_confluence_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_confluence_pages FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE confluence_classification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON confluence_classification_rules FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE headquarters ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON headquarters FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON departments FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON people FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE ai_techs ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON ai_techs FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
