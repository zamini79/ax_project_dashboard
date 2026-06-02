# 핸드오프: AX 과제 대시보드 — UI 리디자인 + 신규 화면

> 대상 개발자: 이 저장소(`ax_project_dashboard`, Next.js 16 / TypeScript / Tailwind v4 / shadcn/ui / Supabase)를 Claude Code로 작업하는 사람.
> 이 문서 하나만으로 구현 가능하도록 작성했습니다.

---

## 1. 개요 (Overview)

기존 와이어프레임 수준의 대시보드를 **데이터 밀도 높은 모던 엔터프라이즈 SaaS**로 리디자인하고, 화면 3개(성과 현황·투자비 현황 고도화, 마스터 관리)와 공통 기능(⌘K 검색, 과제 상세 슬라이드오버)을 추가합니다.

확정된 방향:
- **메인(`/`)** = "대시보드" — 비대칭 **벤토(Bento) 위젯 그리드**
- **과제 현황** = **분석 콘솔 표(인라인 간트)** ↔ **포트폴리오 맵(버블 플롯)** 뷰 토글
- **성과 현황** = 운영 적용 과제의 실제 효과(절감시간·비용 등) — 신규 데이터 모델 필요
- **투자비 현황** = CAPEX 규모·항목별/과제별 계획 대비 집행 — 신규 데이터 모델 필요
- **좌측 사이드바 없음** — 상단 **플로팅 필(pill) 내비** 채택

---

## 2. 디자인 파일에 대해 (About the Design Files)

`design_files/` 안의 파일은 **HTML/React(Babel)로 만든 디자인 레퍼런스**입니다. 의도한 모양·동작을 보여주는 프로토타입이며, **그대로 가져다 쓰는 프로덕션 코드가 아닙니다.**

할 일은 이 디자인을 **이 저장소의 기존 환경(Next.js App Router + Tailwind v4 + shadcn/ui)과 패턴으로 재현**하는 것입니다. 즉:
- 레이아웃·색·타입·간격·인터랙션은 **픽셀 단위로** 디자인을 따르되,
- 구현은 기존 서버/클라이언트 컴포넌트 구조, `lib/repositories` → `lib/domain` 분리(D-014), shadcn `ui/*` 컴포넌트를 **그대로 활용**합니다.

### 디자인 파일 구성
| 파일 | 대응 화면 | 비고 |
|---|---|---|
| `AX 대시보드 프로토타입.html` | 전체 앱 셸 (실행 엔트리) | 브라우저로 열면 전체 동작 확인 가능 |
| `data.js` | 목업 데이터 + **디자인 토큰** | 색/MPRS/헬스/성과/CAPEX 값의 단일 출처 |
| `proto-shared.jsx` | 공통 토큰(`T`)·아이콘·`Card`/`Stat` atom | 토큰 hex 값 확인용 |
| `ui.jsx` | `Donut`·`MiniBars`·`Bar`·`HealthDot`·`MprsBadge` | 차트 프리미티브 |
| `page-dashboard.jsx` | 대시보드(벤토) | |
| `page-projects.jsx` | 과제 현황(표 + 맵) | |
| `page-performance.jsx` | 성과 현황 | |
| `page-budget.jsx` | 투자비 현황(CAPEX) | |
| `page-form.jsx` | 과제 생성/편집 폼 | |
| `page-masters.jsx` | 마스터 관리 | |
| `drawer-detail.jsx` | 과제 상세 슬라이드오버 | |
| `command-palette.jsx` | ⌘K 검색 | |

> 프로토타입의 숫자/내용은 `supabase/migrations/012_dev_seed_sample.sql`의 시드(과제 12건)와 일치시켰습니다. 성과·CAPEX 항목 값은 현실적 예시이며 **추후 실데이터로 조정** 대상입니다.

---

## 3. 충실도 (Fidelity)

**High-fidelity.** 최종 색·타입·간격·radius·인터랙션까지 확정된 픽셀-퍼펙트 목업입니다. shadcn/Tailwind로 동일하게 재현하세요. 단, 색 토큰은 아래 4장대로 `globals.css`를 **업데이트**해야 합니다(현재 zinc 중립 + 무채색 primary → navy 크롬 + indigo 액센트).

---

## 4. 디자인 토큰 (Design Tokens)

현재 `src/app/globals.css`의 중립 팔레트를 아래로 교체/추가하세요. MPRS 색(D-022)과 헬스 의미색은 **유지**하되 일부 hex만 정리했습니다.

### 4.1 색 — `globals.css` `:root` 업데이트
```css
:root {
  --background: #EEF0F4;        /* 앱 배경 (기존 #f7f8fa → 약간 쿨그레이) */
  --foreground: #161A22;
  --card: #FFFFFF;
  --card-foreground: #161A22;

  --muted: #F4F5F7;
  --muted-foreground: #6B7280;  /* sub 텍스트 */
  --faint: #9AA0AB;             /* (추가) 가장 옅은 텍스트 */

  --border: #ECEEF1;            /* 카드/구분선 */
  --border-strong: #E4E7EB;     /* (추가) 입력 테두리 */
  --input: #E4E7EB;
  --ring: #534AB7;

  /* 크롬(헤더·다크 타일·드로어 그립)·강조 */
  --navy: #0F1830;              /* (추가) 다크 크롬·히어로 타일·내비 active */
  --primary: #534AB7;           /* indigo 액센트 (기존 #18181b → 변경) */
  --primary-foreground: #FFFFFF;

  --accent: #EEF0FB;            /* indigo soft (배지/선택칩 배경) */
  --accent-foreground: #534AB7;

  /* 헬스 (유지, hex 정리) */
  --health-green: #16A34A;
  --health-yellow: #E0A106;
  --health-red:   #DC2626;

  --radius: 1rem;               /* 카드 16px. (기존 .625rem → 확대) */
}
```
- `@theme inline` 블록에는 `--color-navy: var(--navy);`, `--color-faint: var(--faint);` 등 신규 토큰 매핑을 추가하세요.
- **폰트**: Pretendard 유지. (`font-sans`에 이미 포함). 프로토타입은 CDN을 썼지만, 프로덕션은 `next/font/local` 또는 패키지(`pretendard`)로 self-host 권장.

### 4.2 MPRS 색 (lib/domain/mprs.ts 유지 — bg만 더 옅게 조정)
| MPRS | main | bg(배지) | text |
|---|---|---|---|
| Marketing | `#1D9E75` | `#E2F4EC` | `#085041` |
| Production | `#534AB7` | `#ECEAFA` | `#3C3489` |
| Research | `#D4537E` | `#FBE6EE` | `#72243E` |
| Support | `#D85A30` | `#FBE9E0` | `#712B13` |

> 기존 `MPRS_COLORS`의 `bg`는 채도가 높았는데(예 `#9FE1CB`), 배지 가독성을 위해 위처럼 옅은 톤으로 교체 권장. `main`/`text`는 유지.

### 4.3 간격·radius·그림자
- 페이지 좌우 패딩 `24px`, 콘텐츠 max-width `1440px`, 섹션 간 `gap 16px`.
- 카드 radius: 일반 `16px`, 벤토 타일 `18px`, 칩/배지 `6~99px`, 입력 `9px`.
- 카드 그림자: `0 1px 2px rgba(16,24,40,.05)` / 다크 타일 `0 8px 28px rgba(15,24,48,.22)` / 호버 `0 14px 36px rgba(16,24,40,.14)`.
- 타입 스케일: 페이지 타이틀 `20px/800`, 카드 타이틀 `13~14px/700`, 본문 `12.5~13.5px`, 라벨/캡션 `11~12px`, 숫자 KPI `26~46px/800` + `font-variant-numeric: tabular-nums`.

---

## 5. 정보 구조 / 라우팅 변경 (IA & Routing)

현재 `/`가 과제 현황이었으나, **`/`를 새 "대시보드(벤토)"로 변경**하고 과제 목록을 분리합니다.

| 경로 | 화면 | 기존 → 변경 |
|---|---|---|
| `/` | **대시보드 (벤토)** | 신규 (기존 과제목록 홈을 대체) |
| `/projects` | **과제 현황** (표 ↔ 맵 토글) | 기존 `/`의 목록을 이동 |
| `/performance` | 성과 현황 | 리디자인 + 신규 데이터 |
| `/budget` | 투자비 현황(CAPEX) | 리디자인 + 신규 데이터 |
| `/projects/[id]` | 과제 상세 | **슬라이드오버 드로어**로 전환(라우트 유지 가능, 8.3 참고) |
| `/projects/new`, `/projects/[id]/edit` | 폼 | 리스타일 |
| `/masters` | 마스터 관리 | 리스타일 |

- `app/(main)/layout.tsx`의 헤더를 **플로팅 필 내비**로 교체(6장). `MainTabs`의 탭 목록에 "대시보드"를 추가하고 경로를 위 표대로 조정.
- 표/맵 토글, KPI 드릴다운 필터 등 **URL searchParams 기반 상태(D-019)** 패턴은 유지 권장.

---

## 6. 공통 셸 — 상단 플로팅 내비 (`app/(main)/layout.tsx` + `main-tabs.tsx`)

좌측 사이드바 없음. 상단 고정(`sticky top-0`) 바, 배경 `--background`(반투명/블러는 **쓰지 말 것** — 8.4 gotcha).

레이아웃(좌→우):
1. **로고 락업**: 32×32 navy 라운드(9px) 박스 "AX"(흰색 800) + "과제 대시보드 / AX추진실"(14.5/700, 10.5/sub).
2. **필 내비**: 흰 배경 + `1px --border` + radius 13 + padding 4. 탭 = 아이콘 15px + 라벨 13/600. **active = navy 배경 + 흰 텍스트**(radius 9), 비활성 = sub. 탭: 대시보드·과제 현황·성과 현황·투자비 현황.
3. **우측**: `과제 검색 [⌘K]` 버튼(클릭 시 팔레트), 마스터 관리(건물 아이콘 36×36 버튼), `+ 새 과제`(indigo, 흰 텍스트), 아바타(32 원형, accent 배경).

아이콘은 `proto-shared.jsx`의 인라인 SVG 세트를 참고하되, 저장소에 `lucide-react`가 있으면 그것으로 대체(매핑: dashboard→`LayoutDashboard`, projects→`List`, performance→`TrendingUp`, budget→`Coins`/`CircleDollarSign`, search→`Search`, masters→`Building2`, plus→`Plus`).

---

## 7. 화면별 상세 (Screens)

각 화면의 정확한 마크업·치수·색은 대응 `design_files/*.jsx`를 **1:1 참조**하세요. 아래는 핵심 스펙과 기존 코드 매핑입니다.

### 7.1 대시보드 (벤토) — `page-dashboard.jsx` → `app/(main)/page.tsx`(신규 홈)
4열 그리드, `grid-auto-rows: 162px`, `gap 14`, areas:
```
"hero hero donut week"
"hero hero risk risk"
"mprs mprs trend trend"
"perf perf trend trend"
```
- **hero**(2×2, navy 다크 타일): "포트폴리오 현황" + 2×2 KPI(전체/진행중/평균진행률/집행률, 숫자 40/800 흰색) + 하단 헬스 스택바 + 범례.
- **donut**: 라이프사이클 도넛(`ui.jsx`의 `Donut`, 중앙 총건수). 색 `["#C7CBD3","#E0A106","#534AB7","#16A34A"]`(진행전/검토중/진행중/완료).
- **week**: 금주 업데이트 큰 숫자(accent). 클릭 → `/projects`.
- **risk**: 위험·주의 과제 top 3(헬스닷·이름·본부·미니바·%). 행 클릭 → 상세 드로어. "전체 보기" → `/projects`.
- **mprs**: MPRS 투자 배분 스택바 + 범례. 클릭 → `/budget`.
- **trend**(2×2): 월별 집행 추이 막대(`MiniBars`, 마지막달 accent) + 누적 집행 숫자.
- **perf**(2×1, green 그라데이션 타일): 운영 성과 하이라이트(연간 절감비용/월 절감시간/적용 과제). 클릭 → `/performance`.

데이터: 기존 `computeKpis()`(lib/domain/dashboard.ts) 재사용 + 신규 `performanceSummary()` 확장(9장).

### 7.2 과제 현황 — `page-projects.jsx` → `app/(main)/projects/page.tsx`
- 헤더: 타이틀 + 우측 **표/맵 토글**(필 토글, active=accent).
- **KPI 스트립**(4 카드): 라이프사이클 도넛+범례 / 헬스 스택바+카운트+금주 / 평균 진행률 / 집행률 도넛. 기존 `KpiSection`을 이 레이아웃으로 리스타일.
- **표 뷰**: 기존 `project-table.tsx`의 인라인 간트 구조를 거의 그대로 사용하되 스타일만 토큰화. 컬럼: `# / MPRS / 본부 / 과제명 / AI기술 / 현황 / 진행(헬스닷) / 간트`. 간트 막대 색 = **MPRS main**(완료는 opacity .45), 오늘 세로선 red. 행 클릭 → 상세 드로어.
- **맵 뷰(신규 컴포넌트)**: 좌측 플롯 카드 + 우측 320 범례 패널.
  - 좌표: **X = 진행률(0~100%)**, **Y = 투자비(억, 1.5~12 범위)**, 버블 지름 `30 + fte*9`, 채움 = MPRS main, **테두리 3px = 헬스색**, 완료는 opacity↓.
  - 좌상단(큰 투자·낮은 진행) **주목 영역** red 음영.
  - 우측 패널: **MPRS 범례 칩 = 클릭 토글 필터**(전체↔단일↔다중), 헬스 범례.
  - 버블 hover → navy 툴팁(이름·진행률·투자비·FTE), 클릭 → 상세 드로어.
  - **client component** 필요(useState: active set, hover id).

### 7.3 성과 현황 — `page-performance.jsx` → `app/(main)/performance/page.tsx`
- KPI 4: 운영 적용 과제 / 연간 절감비용(green) / 월 업무시간 절감(accent) / 연간효과÷관련투자(%바).
- **과제별 운영 효과 카드**(2열): MPRS배지·과제명·`운영 적용`|`파일럿 운영` 배지 / 본부·적용월·PM / **지표 칩 3개**(아이콘+라벨+값) / 메모. 카드 클릭 → 상세 드로어.
  - 지표 아이콘색: 비용=green, 시간=accent, 정확도=`#0EA5E9`.
- 하단: 과제별 연간 절감비용 환산 막대(MPRS색) + "정량 효과지표 확장 예정" 안내 패널.
- 기존 `analytics.ts`의 `performanceSummary`를 효과 데이터까지 포함하도록 확장(9장).

### 7.4 투자비 현황(CAPEX) — `page-budget.jsx` → `app/(main)/budget/page.tsx`
- KPI 4: 총 CAPEX(계획) / 집행 누계(accent) / 집행률(%바) / 미집행 잔액.
- **CAPEX 항목별 계획 대비 집행**(신규): 항목별 한 줄 — `막대 길이 = 계획 규모(최대 계획 대비)`, `채움 = 집행`(accent), 우측 `집행/계획 (rate%)`. 항목: GPU·AI 인프라 / 외부 용역·컨설팅 / SW·라이선스 / 클라우드 운영 / 데이터 구축·라벨링 / 기타.
- **월별 집행 추이**: 기존 `project_budget_monthly` 합산(이미 `fetchMonthlyExecution` 존재). 막대.
- **과제별 계획 대비 집행 표**: MPRS·과제명·본부·계획·집행·집행률바(70%+ green / 30%+ accent / 그 외 yellow). 행 클릭 → 상세 드로어.

### 7.5 과제 상세 — 슬라이드오버 드로어 (`drawer-detail.jsx`)
우측에서 슬라이드(width 520, `translateX` 전환 .28s, 백드롭 `rgba(15,24,48,.42)`).
- 헤더(sticky): MPRS배지·라이프사이클 배지·헬스 / **편집 버튼** + 닫기 / 과제명 18/800 / 본부·PM·부서 / 진행률 바+%.
- 메타 카드: 본부·일정·투자비/집행·FTE·AI기술 칩·유관부서 (= 기존 `meta-panel.tsx` 내용).
- 운영 효과 카드(효과 있을 때, green 톤).
- **업데이트 타임라인**(= 기존 `update-timeline.tsx`): 수동/Atlassian 출처 배지 + 날짜 + 내용. "업데이트 작성" 액션(기존 `update-compose.tsx`).
- ESC/백드롭 클릭으로 닫기.
- **구현 선택**: 기존 `/projects/[id]` 라우트를 유지하고 목록에서는 드로어로, 직접 진입(딥링크)은 페이지로 — Next.js **Parallel/Intercepting Routes**(`@modal` + `(.)projects/[id]`)가 정석. 간단히 가려면 클라이언트 상태 드로어로.

### 7.6 과제 생성/편집 폼 — `page-form.jsx` (기존 `project-form.tsx` 리스타일)
- 2 카드: **기본 정보**(과제명/설명/MPRS/본부/라이프사이클/헬스/시작·종료일/투자비/FTE/**진행률 = range 슬라이더 5%**) + **담당/분류**.
- 담당/분류의 PM·유관부서·AI기술은 **토글 칩 멀티셀렉트**(선택=accent 보더+`#EEF0FB` 배경). 기존 `multi-select.tsx`를 칩 토글 형태로 교체.
- 하단 우측 취소/저장. 저장 성공 시 토스트.
- 검증은 기존 `projectFormSchema`(zod) + react-hook-form 유지.

### 7.7 마스터 관리 — `page-masters.jsx` (기존 `entity-manager.tsx` 리스타일)
- 탭 필(본부/부서/사람/AI기술, 카운트 뱃지, active=navy).
- 추가 바(이름 + 조건부 이메일/관계 select + `추가`) + 인라인 편집 행(저장/삭제). 기존 서버액션(`masters/actions.ts`) 그대로 연결.

### 7.8 ⌘K 커맨드 팔레트 — `command-palette.jsx` (신규 전역 컴포넌트)
- 트리거: 헤더 검색 버튼 또는 전역 `Cmd/Ctrl+K`.
- 중앙 상단 모달(width 580). 입력 + 결과: **이동·작업**(대시보드/과제/성과/투자비/새 과제/마스터) + **과제 검색**(이름·본부·PM·AI기술 부분일치). ↑↓ 이동, Enter 실행, ESC 닫기. 과제 선택 → 상세 드로어.
- 권장: `cmdk` 라이브러리 사용(접근성·키보드 무료). 디자인만 위처럼.

---

## 8. 인터랙션 & 동작 (Interactions)

- **호버**: 벤토 타일 `translateY(-3px)` + 그림자 강화(.18s). 카드/행 hover 배경 `#F5F6F8`.
- **드로어**: 진입 `opacity .2s` + `translateX(100%→0) .28s cubic-bezier(.2,.7,.3,1)`.
- **맵 버블**: hover `scale(1.12)` + 그림자, 다른 버블 dim(opacity .5), 비활성 MPRS dim(opacity .1).
- **토글/필터**: 필 토글·MPRS 범례·KPI 드릴다운 모두 즉시 반영. KPI 드릴다운은 기존 AND 교차 규칙(D-019) 유지.
- **저장/삭제**: 성공 토스트(하단 중앙, navy, 체크 아이콘, 2.4s). 삭제는 confirm.

### 8.4 ⚠️ 중요 gotcha — fixed 오버레이 + backdrop-filter
프로토타입에서 헤더에 `backdrop-filter: blur`를 주자 **드로어/팔레트(`position: fixed`)가 헤더 높이만큼만 보이는 버그**가 있었습니다. 원인: `backdrop-filter`(및 `transform`/`filter`)는 자식 `fixed` 요소의 컨테이닝 블록을 만들어 클리핑을 유발.
**해결책(둘 다 적용 권장):**
1. 드로어·커맨드 팔레트는 **`document.body`로 포털 렌더링**(`createPortal`, 또는 shadcn `Dialog`/`Sheet`가 기본 포털이므로 이를 쓰면 자동 해결).
2. 상단 헤더에 `backdrop-filter`를 쓰지 말 것(불투명 배경 사용).
> shadcn 사용 시: 드로어 = **`Sheet`**(side="right"), 팔레트 = **`Command` + `Dialog`(`CommandDialog`)** 컴포넌트를 쓰면 포털·포커스 트랩·접근성이 해결됩니다. 강력 권장.

---

## 9. 데이터 모델 / 상태 (신규 추가 필요)

기존: `projects`(total_budget, executed_budget, progress_pct, health, lifecycle, dates, fte …), `project_budget_monthly`, `project_updates`, 마스터 테이블. 정렬·KPI는 `lib/domain/dashboard.ts`·`analytics.ts`.

### 9.1 성과(효과) — 신규 테이블 `project_effects`
`docs/planning.md`에 "정량 효과지표는 데이터 모델 확장 후 고도화"라고 명시돼 있음. 새 마이그레이션(`013_project_effects.sql`)으로 추가:
```sql
create table project_effects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  applied_ym text,                 -- 적용 시점 'YYYY.MM'
  is_pilot boolean not null default false,
  save_cost_won numeric default 0, -- 연간 절감비용(원). 화면은 억 환산
  save_hours_month numeric default 0, -- 월 업무시간 절감(시간)
  note text,
  created_at timestamptz default now()
);
-- 표시용 지표(라벨/값 자유형): 정확도 등 비정형 지표
create table project_effect_metrics (
  id uuid primary key default gen_random_uuid(),
  effect_id uuid not null references project_effects(id) on delete cascade,
  kind text not null,   -- 'won' | 'time' | 'target'
  label text not null,
  value text not null,  -- "1,200시간/월", "+18%p" 등 표시 문자열
  sort int default 0
);
```
- RLS는 기존 패턴(`auth.role()='authenticated'`) 동일 적용.
- `lib/repositories/`에 `effects.ts`(조회), `lib/domain/analytics.ts`의 `performanceSummary`를 효과 합산(연 절감비용·월 절감시간·적용/파일럿 카운트·관련 투자합)까지 반환하도록 확장.
- 목업 값은 `data.js`의 `EFFECTS`/`PERF` 참고(예: 수요예측 4.2억·1,200h, HR 0.6억·320h 등).

### 9.2 CAPEX 항목 — 신규 테이블 `capex_items`
과제별 계획/집행은 기존 `projects`에서 나오지만, **항목(카테고리)별 집계**는 신규:
```sql
create table capex_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,     -- 'GPU·AI 인프라' 등
  plan_won numeric not null default 0,
  exec_won numeric not null default 0,
  sort int default 0
);
```
- 합계는 전체 `projects`의 예산/집행과 일치하도록 관리(검증 로직 권장).
- `lib/domain/analytics.ts`의 `budgetSummary`에 항목별 breakdown 추가.
- 목업 값은 `data.js`의 `CAPEX`(계획 합 58.5억 / 집행 21.45억) 참고.

### 9.3 통화/단위 규칙(기존 유지)
- DB는 원 단위 `numeric`, 화면은 **억 단위**(`formatBudgetEok`, lib/domain/format.ts). 성과 절감비용도 동일 규칙.

---

## 10. 컴포넌트 매핑 요약 (할 일 체크리스트)

| 작업 | 기존 파일 | 액션 |
|---|---|---|
| 토큰 교체 | `app/globals.css`, `lib/domain/mprs.ts` | 4장대로 수정 |
| 상단 내비 | `app/(main)/layout.tsx`, `components/layout/main-tabs.tsx` | 플로팅 필 + "대시보드" 탭 추가, 라우팅 5장 |
| 대시보드(벤토) | `app/(main)/page.tsx` | **신규 홈**(벤토). 기존 목록은 `/projects`로 이동 |
| 과제 현황 | `components/dashboard/{kpi-section,project-table,filter-controls}.tsx` | 리스타일 + **맵 뷰 신규** |
| 포트폴리오 맵 | (신규) `components/dashboard/portfolio-map.tsx` | client, 버블 플롯 |
| 성과 현황 | `app/(main)/performance/page.tsx`, `lib/domain/analytics.ts` | 리디자인 + 효과 데이터(9.1) |
| 투자비 현황 | `app/(main)/budget/page.tsx`, `lib/domain/analytics.ts` | 리디자인 + CAPEX(9.2) |
| 과제 상세 | `components/project-detail/*` | **Sheet 드로어**로 재배치 |
| 폼 | `components/project-form/{project-form,multi-select}.tsx` | 칩 멀티셀렉트 + 슬라이더 |
| 마스터 | `components/masters/entity-manager.tsx`, `app/masters/page.tsx` | 탭 필 리스타일 |
| ⌘K | (신규) `components/command/command-palette.tsx` | `cmdk` + `CommandDialog` |

---

## 11. 에셋 (Assets)

- **아이콘**: 전부 인라인 SVG(라인). 프로덕션은 `lucide-react` 권장(6장 매핑).
- **차트**: 외부 차트 라이브러리 없이 SVG/`div`로 구현(도넛=SVG stroke-dasharray, 막대/바=div). 재현은 `ui.jsx` 참조. 원하면 `recharts`로 대체 가능하나 디자인의 가벼운 톤 유지 권장.
- **폰트**: Pretendard (self-host 권장).
- **로고/이미지 없음** — "AX" 텍스트 마크만 사용.

---

## 12. 실행 / 확인

```sh
# 디자인 레퍼런스 확인 (정적)
design_files/AX 대시보드 프로토타입.html  # 브라우저로 열기

# 본 저장소
npm run dev   # http://localhost:3001
```
구현 순서 제안: (1) 토큰·내비 → (2) 대시보드/과제 현황(표·맵) → (3) 상세 드로어 → (4) 폼/마스터/⌘K → (5) 성과·CAPEX(마이그레이션 동반).
