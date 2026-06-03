---
target: 대시보드
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-06-03T15-42-36Z
slug: src-app-main-page-tsx
---
# Critique — 대시보드 (벤토, /)

## Design Health Score: 31/40 (Good)
1 Visibility 3 (기준일 없음) · 2 Match 3 · 3 Control 3 · 4 Consistency 4 · 5 ErrorPrev 3 · 6 Recognition 4 · 7 Flexibility 3 · 8 Aesthetic 3 (1920 여백) · 9 ErrorRecovery 3 · 10 Help 2

## Anti-Patterns: PASS (detect.mjs []=0, navy/indigo 관제탑, 슬롭 없음). 브라우저 오버레이 fallback(자동화 불가).

## Priority Issues
- [P2] 데이터 기준일/최신성 표시 없음 → clarify/polish
- [P2] Help 부재(MPRS·헬스 의미, heuristic10=2) → onboard/clarify
- [P2] 차트 텍스트 대안 부재(도넛/스택바/미니바 aria 없음) → harden
- [P2] 1920 확장 후 타일 비율/여백(gridAutoRows 190 고정) → layout
- [P3] 위험 0건 빈 상태 미흡 → onboard

## Persona Red Flags
- Alex: ⌘K 있으나 대시보드 기간/필터·커스터마이즈 없음
- Sam: 대비·맵키보드 수정됨, 그러나 차트 aria 텍스트 대안 없음
- PM: risk top3 즉시 확인 좋음, 기준일 부재로 최신성 확신 어려움

## Strengths
- navy 히어로 위계 + KPI tabular-nums
- 타일별 단일목적 + 드릴 경로 일관, ⌘K 발견성
- 의미색 체계 + 비대칭 벤토 → 무슬롭 정체성
