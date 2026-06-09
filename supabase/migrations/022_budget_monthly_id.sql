-- ============================================
-- 022. 과제 집행(지급) 다건 기록 지원
-- ============================================
-- 비정기 지급을 여러 건(같은 달 포함) 입력할 수 있도록 월 단위 PK를 행 id로 교체.
-- 집계(SUM by year_month)는 영향 없음.

ALTER TABLE project_budget_monthly DROP CONSTRAINT project_budget_monthly_pkey;
ALTER TABLE project_budget_monthly ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE project_budget_monthly ADD PRIMARY KEY (id);
CREATE INDEX idx_pbm_project ON project_budget_monthly(project_id);
