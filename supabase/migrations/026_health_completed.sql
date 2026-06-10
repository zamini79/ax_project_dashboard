-- ============================================
-- 026. 진행현황(헬스) 'completed'(완료) 값 추가
-- ============================================
-- 기존 green(정상)·yellow(주의)·red(위험)에 더해 '완료' 상태를 추가한다(회색 표시).
-- 표시 순서/색은 앱(HEALTH_KPI_ORDER / HEALTH_COLOR_VAR)에서 제어하므로 값만 추가.

ALTER TYPE project_health ADD VALUE IF NOT EXISTS 'completed';
