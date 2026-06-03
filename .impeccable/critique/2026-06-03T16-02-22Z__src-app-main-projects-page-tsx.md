---
target: 과제현황
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-06-03T16-02-22Z
slug: src-app-main-projects-page-tsx
---
# Critique — 과제 현황 (/projects)

## Design Health Score: 31/40 (Good 하단)
1 Visibility 3 · 2 Match 3 · 3 Control 3(간트 현재복귀 없음) · 4 Consistency 3(맵 MPRS 필터 client) · 5 ErrorPrev 3 · 6 Recognition 3(드래그 발견성) · 7 Flexibility 4 · 8 Aesthetic 3 · 9 ErrorRecovery 3 · 10 Help 3

## Anti-Patterns: PASS (detect [] = 0). 오버레이 fallback.

## Priority Issues
- [P2] 간트 "현재로" 복귀 버튼 부재 (ScheduleHomeButton 고아, scrollToYear 마운트1회) → harden/layout
- [P2] 드래그 패닝 발견성 약함(cursor-grab만, 스크롤바 숨김) → delight/clarify
- [P2] 표가 비-시맨틱(div 그리드), 간트 막대 aria 없음 → harden
- [P2] 맵 MPRS 필터가 URL 아님(client state, D-019 불일치) → layout/harden
- [P3] ScheduleHomeButton 고아 컴포넌트 → polish

## Persona
- Alex: 효율 좋으나 연도 점프/오늘 복귀 단축 없음
- Sam: KPI/맵 개선됨, 표 비시맨틱·간트 마우스 전용 패닝

## Strengths
- 표↔맵·정렬·드릴다운·드래그 간트(오늘선) — 강력한 분석 표면
- 최근 a11y(도넛·스택바·버블 aria, 헬스 툴팁)
- 무슬롭·토큰 일관
