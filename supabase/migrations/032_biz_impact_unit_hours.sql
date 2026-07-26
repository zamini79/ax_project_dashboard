-- ============================================
-- 032. Biz Impact 사용 1건당 절감시간
-- ============================================
-- 성과 현황 상단 KPI '월 업무시간 절감'에 사용성 지표를 반영하기 위한 값.
-- 산정기준이 "시간 × 시간당 인건비(3.37만원)"로 분해되는 과제만 값을 둔다.
--   Intelli RQA : 1.5h × 3.37 = 5.05만원
--   Intelli RA  : (6,396h ÷ 360건) × 3.37 = 59.8만원
--   Open call   : {(2.5h × 4명) − 5분} × 3.37 = 33.4만원
-- AI기반 Deep Research는 단가에 정보 구독비가 포함돼 시간으로 분해 불가 → NULL
-- JSA는 단가 자체가 미정 → NULL

ALTER TABLE project_biz_impacts ADD COLUMN unit_hours NUMERIC;

COMMENT ON COLUMN project_biz_impacts.unit_hours IS
  '사용 1건당 절감시간(h). 산정기준이 시간×인건비로 분해되는 경우만. NULL = 분해 불가';

UPDATE project_biz_impacts b SET unit_hours = 1.5
  FROM projects p WHERE p.id = b.project_id AND p.name = 'Intelli RQA';

UPDATE project_biz_impacts b SET unit_hours = 6396.0 / 360.0
  FROM projects p WHERE p.id = b.project_id AND p.name = 'Intelli RA';

UPDATE project_biz_impacts b SET unit_hours = 2.5 * 4 - 5.0 / 60.0
  FROM projects p WHERE p.id = b.project_id AND p.name = 'Open call Funding 정보 수집';
