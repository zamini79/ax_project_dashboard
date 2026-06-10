-- ============================================
-- 025. 라이프사이클 'operating'(운영) 단계 추가
-- ============================================
-- 진행 전 → 검토 중 → 진행 중 → 완료 → 운영.
-- '운영' = 개발 완료 후 실제 운영 중인 단계(성과 현황 등록 대상).
-- enum 정렬 위치는 앱에서 LIFECYCLE_KPI_ORDER / LIFECYCLE_SORT_RANK 로 제어하므로
-- 여기서는 값만 추가한다. (PG12+ 트랜잭션 내 ADD VALUE 허용)

ALTER TYPE project_lifecycle ADD VALUE IF NOT EXISTS 'operating';
