---
target: 과제현황
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-06-03T16-55-27Z
slug: src-app-main-projects-page-tsx
---
# Critique — 과제 현황 (/projects)

## Design Health Score: 32/40 (Good 하단)
1 Visibility 3 · 2 Match 3 · 3 Control 3(현재 버튼 추가로 간트복귀 해결, 단 전체필터해제·드래그 키보드 없음) · 4 Consistency 4(맵 MPRS 필터 URL화 → 전 상태 D-019 일관) · 5 ErrorPrev 3 · 6 Recognition 3(ARIA 표+드래그힌트 추가, 헬스닷 색상전용 잔존) · 7 Flexibility 4 · 8 Aesthetic 3 · 9 ErrorRecovery 3 · 10 Help 3

전회 31 → 32. 상승 1점은 맵 MPRS 필터 URL화로 Consistency 회복.

## Anti-Patterns: PASS (detect [] = 0). 브라우저 오버레이 fallback(자동화 불가).

## Priority Issues
- [P2] 헬스 닷 색상 전용 — title만 있고 aria-label 없음(WCAG 1.4.1). 표/맵 헬스에 aria-label 추가 → audit/harden
- [P2] 드래그 패닝 키보드 불가 + 패닝 시 월 위치 앵커 없음(스케줄 데이터는 행 aria-label에 이미 노출되어 블로커는 아님). Arrow←/→ 월 이동 + 위치표시 → harden
- [P2] 드래그 힌트 text-faint(#6e737d) on bg(#eef0f4) = 4.17:1, 11px AA 미달. text-muted-foreground(4.83:1)로 교체 → audit
- [P3] KPI 스트립 드릴다운 ~9개 타깃, 위계 약함(인지부하) → layout
- [P3] 필터 칩이 button 아닌 Link, "전체 해제" 버튼 부재 → clarify/polish

## 전회 P2 4건 처리 검증
- 표 비시맨틱 → ARIA table/row/columnheader/cell + 간트행 self-describing aria-label. 해결(좌우 분할 일관성은 라벨에 과제명 포함되어 대부분 완화)
- 맵 MPRS 필터 URL → 완전 해결(parseMprs, dashboardHref ?mprs=)
- 간트 현재복귀 → 현재 버튼(키보드 가능). 해결
- 드래그 발견성 → 힌트 추가(단 contrast 미달, 위 P2)

## Persona
- Alex: URL공유·정렬·드릴다운 강력. 저장뷰/벌크/export 부재가 천장
- Sam: 스케줄 데이터는 aria-label로 읽힘. 헬스 색상전용·드래그 시각 패닝 키보드 불가 잔존

## Strengths
- 전 상태(필터·정렬·뷰·연도·MPRS) URL 일관 — 공유·영속 (D-019 완성)
- ARIA 표 + 자기설명 간트 라벨 + 도넛/스택바/버블 aria
- 관제탑 마이크로모먼트(오늘선·드로어 이징·버블 호버)
