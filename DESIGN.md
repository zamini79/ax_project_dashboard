---
name: AX 과제 대시보드
description: AX추진실 AX 과제 포트폴리오 관제 대시보드 — navy 크롬 + indigo 신호
colors:
  navy: "#0F1830"
  primary: "#534AB7"
  primary-foreground: "#FFFFFF"
  accent-soft: "#EEF0FB"
  accent-foreground: "#534AB7"
  background: "#EEF0F4"
  ink: "#161A22"
  card: "#FFFFFF"
  muted: "#F4F5F7"
  muted-foreground: "#6B7280"
  faint: "#9AA0AB"
  border: "#ECEEF1"
  border-strong: "#E4E7EB"
  health-green: "#16A34A"
  health-yellow: "#E0A106"
  health-red: "#DC2626"
  mprs-marketing: "#1D9E75"
  mprs-production: "#534AB7"
  mprs-research: "#D4537E"
  mprs-support: "#D85A30"
typography:
  display:
    fontFamily: "Pretendard, ui-sans-serif, system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
    fontSize: "clamp(1.625rem, 2.4vw, 2.875rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Pretendard, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Pretendard, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Pretendard, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Pretendard, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  badge: "6px"
  input: "9px"
  card: "16px"
  tile: "18px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.input}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "16px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0 12px"
    height: "38px"
  nav-tab-active:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.input}"
    padding: "6px 12px"
  chip-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  badge-mprs:
    backgroundColor: "{colors.mprs-production}"
    textColor: "{colors.card}"
    rounded: "{rounded.badge}"
    padding: "2px 7px"
---

# Design System: AX 과제 대시보드

## 1. Overview

**Creative North Star: "관제탑 (The Control Tower)"**

이 대시보드는 AX추진실 PM이 수십 개 과제의 진행·헬스·일정·투자비를 한 자리에서 관제하는 공간이다. navy(`#0F1830`) 크롬이 화면의 뼈대를 잡고, cool 그레이 캔버스(`#EEF0F4`) 위에 흰 카드가 정보를 담으며, indigo(`#534AB7`) 액센트와 헬스 신호색이 "지금 무엇이 위험하고 무엇이 늦었는가"를 즉시 알린다. 색은 장식이 아니라 데이터다: MPRS·헬스·라이프사이클은 전 화면에서 같은 색·같은 의미를 갖는다.

분위기는 **차분한 관제실**이다. 데이터는 빽빽하되 타이포 위계·여백·정렬로 읽히게 한다. 요약(벤토·KPI)에서 시작해 드릴다운·필터·⌘K·드로어로 깊어지는, 절제된 자신감의 엔터프라이즈 톤. 큰 숫자는 `tabular-nums`로 정렬되어 스캔이 빠르다.

이 시스템이 명시적으로 거부하는 것: 크림·샌드 배경과 `background-clip:text` 그라데이션 헤딩, 똑같은 카드 그리드, 모든 섹션 위의 작은 대문자 eyebrow 같은 **전형적 SaaS 슬롭**. 회색 표와 위계 없는 폼의 **올드 행정 UI**. 과한 애니메이션·이모지의 **화려한 컨슈머 톤**.

**Key Characteristics:**
- navy 크롬 + indigo 신호 + cool 그레이 캔버스 (warm-neutral 크림 아님)
- 의미 기반 색 체계: MPRS 4색 / 헬스 3색 / 라이프사이클이 전역 일관
- 평면 기본, 상태(호버·드로어·히어로)에서만 부상
- 데이터 밀도 ↑, 위계·여백으로 가독 확보. 1920 데스크탑 기준 (max-w 1800 중앙 정렬)
- 단일 sans(Pretendard) + 굵기·크기 대비로 위계

## 2. Colors

cool 그레이 캔버스 위에 navy 크롬과 indigo 신호가 얹히고, 의미색(MPRS·헬스)이 데이터를 말하는 절제된 팔레트.

### Primary
- **Signal Indigo** (`#534AB7`): 주 액센트. 활성 탭/선택 칩/진행 바/주요 버튼/금주 강조. 화면당 비중을 낮게 유지해 "신호"로 작동.
- **Control Navy** (`#0F1830`): 다크 크롬. 상단 내비 active 칩, 벤토 히어로 타일, 드로어/팔레트 백드롭의 베이스. 신뢰의 뼈대.

### Secondary
- **Indigo Soft** (`#EEF0FB`): indigo의 옅은 배경. 선택 칩·드릴다운 활성 셀·아바타 배경. 강조의 "약한 버전".

### Tertiary (의미색 — 장식 아님)
- **MPRS Teal / Indigo / Pink / Coral** (`#1D9E75` / `#534AB7` / `#D4537E` / `#D85A30`): 분류(Marketing/Production/Research/Support). 배지·간트 막대·맵 버블·투자배분에 동일 적용. 각 색은 옅은 bg(`#E2F4EC` 등)와 진한 text(`#085041` 등) 짝을 가짐.
- **Health Green / Yellow / Red** (`#16A34A` / `#E0A106` / `#DC2626`): 진행 신호(정상/주의/위험). 신호 점·스택바·맵 버블 테두리·"오늘" 세로선(red 40%).

### Neutral
- **Ink** (`#161A22`): 본문·제목. cool 캔버스 대비 ≥4.5:1.
- **Muted** (`#6B7280`): 보조 텍스트·라벨. 본문 대비 충분.
- **Faint** (`#9AA0AB`): 캡션·플레이스홀더·비활성. 본문에는 쓰지 않음.
- **Canvas** (`#EEF0F4`) / **Card** (`#FFFFFF`): 앱 배경 / 표면.
- **Border** (`#ECEEF1`) / **Border-strong** (`#E4E7EB`): 카드 구분선 / 입력 테두리.

### Named Rules
**The Signal Rarity Rule.** indigo 액센트는 한 화면의 ≤10%에만 쓴다. 흔해지면 신호가 아니라 배경이 된다.
**The Color Means Data Rule.** MPRS·헬스 색은 임의로 바꾸지 않는다. 같은 색은 모든 화면에서 같은 뜻이어야 한다.
**The No-Cream Rule.** 배경은 cool 그레이(`#EEF0F4`)다. warm 크림/샌드/베이지(L 0.84–0.97, 따뜻한 hue)는 금지 — AI 기본값이다.

## 3. Typography

**Display/Body Font:** Pretendard (with ui-sans-serif, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic' fallbacks)

**Character:** 단일 한국어 친화 sans 하나를, 굵기(400–800)와 크기 대비로만 위계를 만든다. 경쟁하는 두 번째 서체 없음. 숫자는 항상 `tabular-nums`로 정렬해 스캔성을 높인다.

### Hierarchy
- **Display** (800, clamp 26–46px, lh 1, -0.02em): KPI 숫자·벤토 히어로 수치. 화면에서 가장 큰 요소이자 첫 시선.
- **Headline** (800, 20px, -0.01em): 페이지 타이틀("과제 현황", "투자비 현황").
- **Title** (700, 13–14px): 카드 제목·섹션 헤더·표 헤더.
- **Body** (400, 12.5–13.5px, lh 1.55): 본문·셀·설명. 긴 산문은 65–75ch.
- **Label** (600, 11–12px): 배지·캡션·KPI 라벨·메타.

### Named Rules
**The One Family Rule.** 서체 패밀리는 Pretendard 하나. 위계는 굵기·크기로만. 두 번째 sans를 더하지 않는다.
**The Tabular Numbers Rule.** 모든 수치(KPI·금액·%·날짜)는 `font-variant-numeric: tabular-nums`. 정렬되지 않은 숫자는 관제 도구에서 노이즈다.
**The No All-Caps Body Rule.** 대문자는 짧은 라벨(≤4단어)·`⌘K` 같은 키캡에만. 문장 대문자 금지.

## 4. Elevation

평면이 기본이다. 표면은 쉴 때 평평하고, 깊이는 상태(호버·드로어·히어로)에 대한 반응으로만 나타난다. 일반 카드는 거의 보이지 않는 미세 그림자(`0 1px 2px`)로 종이 한 장의 두께만 갖고, 위계는 그림자가 아니라 색(navy 히어로 vs 흰 카드)과 테두리로 만든다.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgba(16,24,40,.05)`): 모든 카드의 기본. 거의 평면.
- **Hover Lift** (`box-shadow: 0 14px 36px rgba(16,24,40,.14)`): 클릭 가능한 타일·카드 호버 시. 들리는 느낌.
- **Navy Tile** (`box-shadow: 0 8px 28px rgba(15,24,48,.22)`): 벤토 히어로 등 navy 다크 타일. 크롬의 무게.
- **Drawer** (`box-shadow: -12px 0 40px rgba(15,24,48,.2)`): 우측 상세 슬라이드오버.
- **Overlay** (`box-shadow: 0 24px 60px rgba(15,24,48,.35)`): ⌘K 커맨드 팔레트.

### Named Rules
**The Flat-By-Default Rule.** 표면은 쉴 때 평면. 그림자는 상태(호버·부상·포커스)의 반응으로만 등장한다.
**The Depth-Is-Navy Rule.** 시각적 무게는 그림자를 키워서가 아니라 navy 면으로 만든다. 히어로·active 내비가 그 예.

## 5. Components

### Buttons
- **Shape:** 둥근 모서리 (9px, `rounded.input`).
- **Primary:** indigo 면(`#534AB7`) + 흰 텍스트, 패딩 8×16px. 생성·저장·"+ 새 과제" 등 주행동.
- **Hover / Focus:** 호버 `opacity .9`(색 유지), 포커스 `ring-2 ring-ring`(indigo). 트랜지션은 색·투명도만.
- **Outline / Ghost:** 흰 면 + `border`(`#E4E7EB`), 호버 `bg-muted`. 보조 행동(마스터 관리·취소·로그아웃). Ghost는 테두리 없이 호버 배경만.

### Chips
- **Style:** 알약형(`rounded.pill`). 미선택 = 흰 면 + border-strong + muted 텍스트. 선택 = indigo 보더 + `#EEF0FB` 배경 + indigo 텍스트 + ✓.
- **State:** 폼의 PM·유관부서·AI기술 멀티셀렉트, 맵의 MPRS 범례 필터(클릭 토글). MPRS 배지는 옅은 의미색 bg + 진한 의미색 text의 사각 배지(`rounded.badge`).

### Cards / Containers
- **Corner Style:** 16px(`rounded.card`). 벤토 타일만 18px(`rounded.tile`).
- **Background:** 흰 면(`#FFFFFF`). 벤토 히어로/성과 타일은 navy/green 면.
- **Shadow Strategy:** Rest(거의 평면). 클릭 가능하면 Hover Lift. (Elevation 참조)
- **Border:** `1px solid #ECEEF1`. 카드는 절대 중첩하지 않는다.
- **Internal Padding:** 14–22px (`spacing` md 기준).

### Inputs / Fields
- **Style:** 흰 면 + `1px #E4E7EB`(border-strong), 9px radius, 높이 38px, 13.5px 텍스트.
- **Focus:** `ring-2 ring-ring`(indigo) — 테두리 글로우.
- **Error:** 빨강 텍스트(`#DC2626`) + 라벨 빨강. 진행률은 5% 스텝 range 슬라이더(accent indigo).

### Navigation
- **Style:** 상단 sticky 플로팅 필 내비(사이드바 없음). 흰 알약 컨테이너 + border, radius 13, 아이콘 15px + 라벨 13/600.
- **States:** active = navy 면 + 흰 텍스트(9px). 비활성 = muted, 호버 ink.
- **헤더 정렬:** 바 배경은 전체 폭, 내부 콘텐츠는 본문과 동일하게 `max-w-1800` 중앙 정렬.

### Signature Components
- **인라인 간트 표:** 좌측 고정 정보 컬럼 + 우측 드래그 패닝 타임라인. 막대 = MPRS main 색(완료 opacity .45), "오늘" 세로선 = red 40%, 월 구분선.
- **포트폴리오 맵:** 버블 플롯 — X=진행률, Y=투자비(억), 크기=FTE, 채움=MPRS main, 테두리 3px=헬스색. 좌상단 "주목" red 음영.
- **벤토 그리드:** 비대칭 4열(`grid-auto-rows`), navy 히어로 2×2 + 도넛/금주/위험/MPRS/추이/성과 타일.
- **상세 슬라이드오버 & ⌘K 팔레트:** 포털 렌더(고정 오버레이 클리핑 회피), navy 백드롭.

## 6. Do's and Don'ts

### Do:
- **Do** 배경에 cool 그레이(`#EEF0F4`)를 쓰고, 크롬·무게는 navy(`#0F1830`)로 잡는다.
- **Do** indigo 액센트를 화면의 ≤10%로 아껴 "신호"로 유지한다 (The Signal Rarity Rule).
- **Do** MPRS·헬스·라이프사이클 색을 전 화면에서 동일한 의미로 재사용한다.
- **Do** 모든 수치에 `tabular-nums`를 적용한다.
- **Do** 카드는 평면을 기본으로, 그림자는 호버·드로어·히어로 등 상태에서만 쓴다.
- **Do** 헬스 신호는 색 + 라벨/텍스트를 병기한다 (색맹 대비, WCAG AA).
- **Do** 본문 대비 ≥4.5:1을 지킨다. 옅은 회색 본문은 ink 쪽으로 끌어올린다.

### Don't:
- **Don't** warm 크림/샌드/베이지 배경을 쓰지 않는다 — `--paper`/`--cream`/`--linen` 류는 전형적 SaaS 슬롭이다 (The No-Cream Rule).
- **Don't** `background-clip:text` 그라데이션 헤딩을 쓰지 않는다. 강조는 굵기·크기·단색으로.
- **Don't** 똑같은 카드 그리드(아이콘+제목+텍스트의 무한 반복)와 히어로-메트릭 템플릿을 남발하지 않는다.
- **Don't** 모든 섹션 위에 작은 대문자 tracked eyebrow / `01 · 02 · 03` 번호 마커를 깔지 않는다.
- **Don't** 회색 표·위계 없는 폼의 올드 행정 UI로 흐르지 않는다.
- **Don't** 과한 애니메이션·이모지·장난스러운 톤(화려한 컨슈머 앱)을 쓰지 않는다.
- **Don't** 1px 초과 컬러 side-stripe 보더, 장식용 글래스모피즘, 카드 중첩을 쓰지 않는다.
- **Don't** 모션에 `prefers-reduced-motion` 대안 없이 출시하지 않는다.
