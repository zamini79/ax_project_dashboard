-- ============================================
-- 018. 개발용 사업계획 샘플 (DEV ONLY) — D-031
-- ============================================
-- 사업계획 항목 3개 + 과제 매핑(과제명 매칭, prod-safe). 멱등: 항목이 없을 때만.

DO $$
DECLARE
  y INT := 2026;
BEGIN
  IF (SELECT COUNT(*) FROM budget_plan_items) > 0 THEN
    RAISE NOTICE 'budget_plan_items 존재 — 사업계획 시드 건너뜀';
    RETURN;
  END IF;

  WITH ins AS (
    INSERT INTO budget_plan_items (fiscal_year, name, plan_amount, sort) VALUES
      (y, 'AI 비전검사 사업',  2500000000, 1),
      (y, '수요예측 고도화',    1800000000, 2),
      (y, '고객응대 자동화',    1200000000, 3)
    RETURNING id, name
  )
  INSERT INTO budget_plan_item_projects (item_id, project_id)
  SELECT ins.id, p.id
  FROM ins
  JOIN (VALUES
    ('AI 비전검사 사업', '비전 AI 기반 외관검사 정확도 향상'),
    ('AI 비전검사 사업', '스마트팩토리 비전검사 고도화'),
    ('수요예측 고도화',   '수요예측 시계열 모델'),
    ('수요예측 고도화',   '월간 수요 예측 정확도 개선'),
    ('고객응대 자동화',   '고객문의 자동응답 봇'),
    ('고객응대 자동화',   '상담 1차 응대 자동화')
  ) AS m(item_name, project_name) ON m.item_name = ins.name
  JOIN projects p ON p.name = m.project_name;
END $$;
