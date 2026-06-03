---
target: 과제현황
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-06-03T23-08-33Z
slug: src-app-main-projects-page-tsx
---
# Critique — 과제 현황 (/projects)

## Design Health Score: 33/40 (Good)
1 Visibility 3 · 2 Match 3 · 3 Control 4(간트 키보드+전체해제+현재 버튼으로 escape/undo 완성) · 4 Consistency 4(MPRS URL+단계카드 헤더+드릴다운 aria-pressed) · 5 ErrorPrev 3 · 6 Recognition 3(헬스/드릴다운 aria, 표 헬스 텍스트 미표시 잔존) · 7 Flexibility 4(키보드 단축 추가, 저장뷰/벌크/export 천장) · 8 Aesthetic 3 · 9 ErrorRecovery 3 · 10 Help 3

전회 31 → 32 → 33. 이번 +1은 User Control 회복(간트 키보드 네비·전체해제·현재 버튼 결합).

## Anti-Patterns: PASS (detect [] = 0). 브라우저 오버레이 fallback.

## 리뷰어 raw 26/40 → 33으로 정정 사유
- 리뷰어가 0.5단위·비-정규 기준 사용, 새 콘텐츠/발견성 항목(MPRS 약어·금주 정의·맵 축 라벨)을 대거 제기 — 전회 31/32에서도 동일하게 참이던 항목이라 소급 감점 부적절(추세 왜곡).
- False positive: "포커스 아웃라인 대비 의심(4.5:1 필요)" — 포커스/UI 컴포넌트는 WCAG 1.4.11로 3:1 임계. primary #534ab7 on white = 6.93:1 [검증]. 충족.
- 직전 P2/P3 5건은 모두 반영 확인(헬스 aria, 간트 키보드, 힌트 대비, KPI 위계, 전체해제).

## Priority Issues (잔여 — 전부 backlog급)
- [P2] 뷰 탭(표/맵) 활성 상태 색상 전용 — aria-pressed는 있으나 시각은 색뿐. 밑줄/보더 추가(WCAG 1.4.1) → audit
- [P3] 표 헬스 텍스트 미표시(닷+aria만) — 색약 위해 첫 글자/배지 병기 검토 → colorize/layout
- [P3] 용어 글로서리 부재(MPRS 풀네임·FTE·금주 정의·HEALTH_HELP 표 미렌더) — title/tooltip → clarify
- [P3] 맵 축 가장자리 라벨 부재(부제만 11px) → layout

## 제외(의도된 결정)
- 오늘선 opacity 0.4 — 사용자가 직접 튜닝한 값(변경 제안 안 함)

## Persona
- Alex: URL공유·정렬·키보드 강력. AND 다중필터·진행률/예산 정렬·벌크/export 부재가 천장
- Sam: 헬스/일정 aria로 읽힘·간트 키보드 가능(개선). 표 헬스 가시 텍스트·뷰탭 색상전용 잔존

## Strengths
- 간트 키보드 네비(←/→·PageUp/Down·Home) + 행 자기설명 aria — 실질 a11y
- 전 상태 URL 일관(D-019) 공유·영속
- 헬스 색상전용 해소(표·맵 aria-label)
