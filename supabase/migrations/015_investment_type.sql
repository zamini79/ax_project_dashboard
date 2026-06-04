-- ============================================
-- 015. 투자 유형(investment_type) — enum + projects 컬럼 + CAPEX 집계 전환 (D-030)
-- ============================================
-- CAPEX '항목별 계획 대비 집행'을 과제의 투자 유형별 자동 집계로 전환한다.
-- 수동 관리 테이블(capex_items)은 폐기.

CREATE TYPE investment_type AS ENUM ('ai', 'dt', 'it', 'security', 'infra');

-- projects.investment_type: 필수. 기존 행은 'ai'로 백필 후 NOT NULL.
ALTER TABLE projects ADD COLUMN investment_type investment_type;
UPDATE projects SET investment_type = 'ai' WHERE investment_type IS NULL;
ALTER TABLE projects ALTER COLUMN investment_type SET NOT NULL;

-- CAPEX 항목별 집행 = 과제 투자 유형별 합계로 대체 → 수동 테이블 폐기
DROP TABLE IF EXISTS capex_items;
