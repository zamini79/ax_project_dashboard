-- ============================================
-- 019. 사업계획 항목 속성 확장 (구분/본부/MPRS) + '전사' 본부 (D-031)
-- ============================================

-- 본부 마스터에 '전사' 추가 (없을 때만)
INSERT INTO headquarters (name)
SELECT '전사'
WHERE NOT EXISTS (SELECT 1 FROM headquarters WHERE name = '전사');

-- 사업계획 항목 속성 (모두 선택 — nullable)
ALTER TABLE budget_plan_items ADD COLUMN investment_type investment_type;
ALTER TABLE budget_plan_items ADD COLUMN headquarter_id UUID REFERENCES headquarters(id);
ALTER TABLE budget_plan_items ADD COLUMN mprs mprs_category;

-- 데모 샘플 백필 (있을 때만)
UPDATE budget_plan_items SET investment_type = 'ai', mprs = 'production',
  headquarter_id = (SELECT id FROM headquarters WHERE name = 'L HOUSE 공장' LIMIT 1)
  WHERE name = 'AI 비전검사 사업';
UPDATE budget_plan_items SET investment_type = 'ai', mprs = 'research',
  headquarter_id = (SELECT id FROM headquarters WHERE name = 'MBD본부' LIMIT 1)
  WHERE name = '수요예측 고도화';
UPDATE budget_plan_items SET investment_type = 'dt', mprs = 'support',
  headquarter_id = (SELECT id FROM headquarters WHERE name = '경영지원본부' LIMIT 1)
  WHERE name = '고객응대 자동화';
