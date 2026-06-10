# AX 과제 대시보드 — 기획 문서

> **상태**: v0.5 (마스터 데이터 즉석 추가 정책)
> **소유**: AX추진실
> **마지막 갱신**: 2026-05-27

---

## 1. 프로젝트 개요

AX추진실에서 진행 중인 AX 과제들의 진행현황을 한눈에 보고 관리하는 대시보드.

**주요 사용자**
- AX추진실 PM (1차 사용자, 일상 관리 목적)
- 경영진 (보고용)
- 유관부서 담당자 (조회 / 코멘트)

**핵심 가치**
- 실질적인 과제 현황을 한눈에 보고 관리
- Atlassian(Confluence) 게시판의 비정형 업데이트를 자동으로 끌어와 요점 정리
- 수동 입력과 자동 동기화를 *충돌 없이* 공존시킴

---

## 2. 요구사항 (원본)

1. 현재 진행중인 과제들 리스트
2. 과제 기본정보 (일정, 투자비, 인원, AX추진실 담당자, 유관부서, 유관부서 담당자)
3. 과제 진행현황 (매주 / 비정기 업데이트)
4. 주목적: 실무 관리 / 부차: 경영진 보고
5. 진행현황은 수동 입력 가능하되, *원천 시스템 연계가 목표*
6. Atlassian(팀별 게시판) → 분석 → 요점을 대시보드에 업데이트
7. 현재 git + Vercel + Supabase, 추후 사내 AWS 이전 가능성 고려

---

## 3. 기술 스택

| 구분 | 현재 | 향후 (사내 AWS 이전 시) |
|---|---|---|
| 코드 호스팅 | git | (사내 git) |
| 배포 | Vercel | AWS (ECS / Amplify 등) |
| DB | Supabase (Postgres 15+) | AWS RDS Postgres |
| Auth | Supabase Auth → **가능하면 사내 SSO부터** | 사내 IdP / Cognito |
| Cron | Vercel Cron Jobs | AWS EventBridge |
| LLM | Claude API (Phase 3) | 동일 |

### 포터빌리티 원칙
1. **Repository 패턴 강제** — Supabase 클라이언트 호출을 코드 전체에 흩뿌리지 말 것
2. **Postgres 표준 SQL 위주** — Supabase 고유 기능(RLS, Realtime, Edge Functions)은 *격리된 곳에만*
3. **Next.js 권장** — Vercel ↔ AWS 양쪽에서 자연스러움
4. **Auth는 가능하면 처음부터 사내 SSO** — 나중에 Supabase Auth → SSO 마이그레이션은 비용이 큼
5. **Cron 워커는 Next.js API route로** — Supabase Edge Functions에 격리하면 AWS 이전 시 따로 마이그레이션 필요

---

## 4. 의사결정 로그

### ✅ 결정됨 (데이터 모델)

**D-001 [번복됨]. 라이프사이클 단계 관리는 도입한다**
- 초기에는 제외했으나, 대시보드 KPI("과제 현황" 5개 카운트)가 사실상 라이프사이클이라 도입으로 번복.
- 4개 단계 enum (보류·취소는 일단 제외, 운영하면서 필요해지면 추가).

**D-002. 과제 하위 구조는 "업데이트 로그"만 둔다**
- 마일스톤 / 하위 태스크 제외. Jira와 중복 회피.

**D-003. 분류 체계는 MPRS (Marketing / Production / Research / Support)**
- 4개 고정 → enum. 서브 분류로 AI기술 (멀티값, 마스터 테이블).

**D-004. PM은 공동 가능**
- `project_pms` join 테이블.

**D-005. 유관부서당 담당자 여러 명 가능 / 담당자 미정 케이스 수용**

**D-006. 진행률은 Phase A에서 수동 입력만, Phase C에서 자동+수동 오버라이드로 확장**

**D-007. 월별 집행 누계는 저장하지 않고 SUM 쿼리로 계산**

**D-015. 본부(Headquarters) 마스터 도입**
- `headquarters` 테이블 신설.
- `projects.headquarter_id` (NOT NULL): 과제별 주관 본부 1개.
- `departments.headquarter_id` (nullable): 부서가 어느 본부 소속인지도 기록.
- 시드: MBD본부, Bio연구본부, 개발본부, L HOUSE 공장, Quality본부, 경영지원본부. 추후 "전사" 추가 가능.

**D-016. 라이프사이클 enum 영문 명명**
- `project_lifecycle` ENUM: `not_started`, `under_review`, `in_progress`, `completed`
- 의미 매핑:
  - `not_started` = 진행 전
  - `under_review` = 검토 중 (과제 진행 가능성 검토 시작 단계)
  - `in_progress` = 진행 중
  - `completed` = 완료
- **enum 정의 순서는 상태 전이 순서**, *표시 정렬은 쿼리에서 별도 처리* (enum 변경 비용 회피).

### ✅ 결정됨 (Atlassian 연동)

**D-008. 과제 ↔ Confluence 페이지는 1:N 매핑 + 페이지 역할 분류**

**D-009. 페이지 역할(`page_role`) enum 5개**
- `root`, `weekly_report`, `issue`, `meeting_note`, `other`

**D-010. 분류 전략은 B (어댑터 + LLM)**
- 팀별 규칙 기반 어댑터 → 못 잡히면 LLM 폴백 (Phase 3).

**D-011. 분류 검토 UI는 Phase 3에 LLM 분류기와 함께 도입**

**D-012. 동기화 빈도: Cron(하루 2회) + 수동 트리거**
- Vercel Cron Jobs, 09:00 / 18:00.

**D-013. 동기화 중복 방지: Confluence 페이지 버전 번호 비교**

**D-014. 운영 보조 결정**
- 동기화 실패 로그는 Vercel logs만.
- Confluence API 호출은 순차 + 100ms 지연.
- 새 과제 등록 시 첫 동기화 즉시 실행.

### ✅ 결정됨 (대시보드 UI/UX)

**D-017. 기준 해상도 1920×1080 (실무용 데스크탑)**

**D-018. 상단 KPI 4블록 (드릴다운 클릭 필터)**
- (1) 과제 현황: 전체 / 진행 전 / 검토 중 / 진행 중 / 완료 (5개 카운트)
- (2) 진행 현황: 위험 / 주의 / 정상 / 금주 업데이트 (4개 카운트)
- (3) 본부별 과제: 6개 본부 카운트 (3×2 그리드)
- (4) 투자비 집행: 전체 + MPRS별 4개 막대 (정보 표시용, Phase 1에서는 클릭 불가)

**D-019. KPI 드릴다운 인터랙션 룰**
- 같은 블록 안에서는 *단일 선택* (라디오)
- 다른 블록 간에는 *AND 교차 필터* (예: "진행 중 + 위험 + MBD본부")
- 선택된 KPI는 강조 (배경 + 테두리)
- 활성 필터는 KPI 아래 "필터 칩" 영역에 표시 (× 클릭으로 해제)

**D-020. 디폴트 상태**
- 페이지 로드 시 *필터 없음* (모든 과제 표시)
- 디폴트 정렬: `진행 중 → 검토 중 → 진행 전 → 완료`, 같은 단계 안에서는 *시작일 최신 순* (DESC, 시작일 없는 과제는 맨 뒤)
  - (2026-06-10 변경: 기존 "시작일 오래된 순 ASC" → 최신 순 DESC)

**D-021. 그룹 토글 2개**
- "전체" (그룹 해제 → 카드 평면 나열)
- "MPRS" (Marketing/Production/Research/Support 4개 그룹 헤더로 분류)
- 본부별 그룹은 두지 않음 (본부는 KPI 클릭 필터로 충분)

**D-022. MPRS 색상 매핑 (전역 일관)**
- Marketing → Teal (`#1D9E75` / bg `#9FE1CB` / text `#085041`)
- Production → Purple (`#534AB7` / bg `#CECBF6` / text `#3C3489`)
- Research → Pink (`#D4537E` / bg `#F4C0D1` / text `#72243E`)
- Support → Coral (`#D85A30` / bg `#F5C4B3` / text `#712B13`)

**D-023. 과제 카드 디자인 (5열 컴팩트)**
- 좌측 컬러바: 헬스 (빨강/노랑/녹색)
- 상단 배지: MPRS 1글자 (M/P/R/S) + 라이프사이클 단계 + 본부 텍스트
- 본문: 과제명 / PM·부서 / 진행률 막대 / 종료월·최근업데이트
- 그룹이 MPRS일 때는 카드의 MPRS 배지 제거 (중복 회피)

**D-024. 과제 상세 레이아웃**
- 좌우 2컬럼: 좌측 280px 메타 / 우측 업데이트 타임라인
- 좌측 순서: 진행률 → 주관 본부 → 일정 → 투자비/집행 → PM → 유관부서/담당자 → 연결된 페이지
- 우측: 수동 + Atlassian 업데이트를 시간순 혼합, 출처 아이콘·역할 배지·원본 링크 표시

**D-025. 경영진 뷰는 별도 페이지 (Phase 1)**
- 실무 뷰와 분리. KPI + MPRS별 도넛 + 위험 TOP 5 + 월별 예산 집행 차트 위주.
- 같은 페이지 토글 방식이 아닌 별도 라우트.

### ✅ 결정됨 (권한 / 안전 장치)

**D-026. Phase 0 권한 모델은 단일 역할 (`user`)**
- 인증된 모든 사용자가 동등 권한. 미세한 역할 분화 없음.
- `people.role` enum 컬럼은 *미래 확장 대비*로 추가. 디폴트값 `'user'`.
- RLS는 모든 테이블에 켜되, 정책은 `auth.role() = 'authenticated'` 통일.
- 미래에 역할 분화 필요 시:
  1. `ALTER TYPE user_role ADD VALUE 'admin'` 등으로 enum 확장
  2. 해당 사용자의 `people.role` 업데이트
  3. RLS 정책에 조건 추가
- 데이터 마이그레이션 없이 정책만 진화.

**D-027. 과제 삭제 대신 archive**
- `projects.is_archived` BOOLEAN 컬럼 추가.
- "삭제" 버튼은 archive 처리. 화면에서 숨김, DB엔 유지.
- 진짜 DELETE는 향후 admin 권한 분화 시점에만 허용.
- 권한 모델과 무관한 *데이터 안전 장치*.

**D-028. 인증은 Supabase Auth (매직링크/이메일) → 추후 사내 SSO 전환**
- `people.email`이 사내 이메일과 1:1 매칭되어야 SSO 전환 시 매끄러움.
- RLS에서 사용자 식별은 `auth.email()` 기반 (SSO 전환 시에도 그대로 동작).

**D-029. 마스터 데이터 (부서·사람·AI기술) 즉석 추가 허용**
- 과제 생성/편집 폼 안에서 *없는 부서·사람·AI기술을 그 자리에서 추가* 가능.
- autocomplete "+ 새로 만들기" 옵션.
- 본부는 *예외* — 사전 정의된 6개(+추후 전사)만 사용, 즉석 추가 불가.
- 미래에 권한 분화 시 admin만 즉석 추가 가능하도록 정책 변경 (현재 단일 역할이라 무관).

**D-030. 투자 유형(investment_type) 도입 + CAPEX 항목별 자동 집계**
- 신규 enum `investment_type`: `ai`(AI) / `dt`(DT) / `it`(IT) / `security`(보안) / `infra`(인프라).
- `projects.investment_type` **필수**(NOT NULL) 컬럼. 과제당 단일 값(MPRS와 동일 패턴). 기존 행은 `ai`로 백필 (마이그레이션 015).
- 투자비 현황의 "CAPEX 항목별 계획 대비 집행"은 더 이상 수동 테이블(`capex_items`)을 쓰지 않고, **과제 투자 유형별 자동 집계**(계획=Σtotal_budget, 집행=Σexecuted_budget)로 산출 → 과제 데이터와 항상 일치. `capex_items` 테이블 폐기(DROP, 015).
- 집계 순수함수 `capexByInvestmentType` (domain/investment.ts) — 5개 유형 항상 표시(0 포함).
- 마이그레이션: 015(스키마/백필/DROP), 016(dev 샘플 유형 배정, 과제명 매칭 prod-safe).

**D-031. 투자비 사업계획(별도 관리) 도입**
- 연도별 사업계획 라인 항목(`budget_plan_items`)을 별도 관리. 계획은 **수기 입력**(연간+월별), 집행은 **매핑 과제의 집행 자동 합산**.
- 항목 1개 ↔ 과제 1~N개 매핑(`budget_plan_item_projects`). 월별 계획은 `budget_plan_item_monthly`.
- 투자비 현황 KPI: "YY년 투자비 사업계획"(=계획총액, 클릭 시 팝업) · "집행 누계"(전체 집행 + 계획집행/계획이외 분해) · "계획대비 미집행"(=계획총액−계획집행).
- 기존 'CAPEX 항목별(투자유형 자동집계, D-030)' 카드는 **공존 유지**.
- 1차: 수기 CRUD + 과제 매핑 + 월별계획 + 팝업 조회. 2차: 엑셀 업로드(예정).
- 마이그레이션 017(스키마/RLS), 018(dev 샘플, 과제명 매칭 prod-safe).

### 🟡 논의 중 / 미정

- 사용자 권한 모델 (RBAC) — 다음 단계
- 알림 (Teams 연계 가능성 — A.Biz 자산 활용?)
- 감사 로그
- AWS 이전 시점
- LLM 요약 실행 환경 (Phase 3 시점에 결정)
- 보류 / 취소 상태 추가 필요 여부 (운영하면서 판단)
- 투자비 막대 클릭 인터랙션 (Phase 1에서는 정보 표시만)

---

## 5. 데이터 모델 v1.1

### 5.1 테이블 목록 (11개)

| 테이블 | 역할 |
|---|---|
| `projects` | 과제 본체 |
| `headquarters` | **본부 마스터 (신규)** |
| `people` | 사람 마스터 |
| `departments` | 부서 마스터 (본부 FK 포함) |
| `ai_techs` | AI기술 마스터 |
| `project_pms` | 과제 ↔ 공동 PM (M:N) |
| `project_stakeholders` | 과제 ↔ 유관부서 ↔ 담당자 |
| `project_ai_techs` | 과제 ↔ AI기술 (M:N) |
| `project_budget_monthly` | 월별 집행액 |
| `project_updates` | 업데이트 로그 (수동 / Atlassian 자동) |
| `project_confluence_pages` | 과제 ↔ Confluence 페이지 (1:N, 역할 분류) |
| `confluence_classification_rules` | 팀별 페이지 분류 규칙 (어댑터) |

### 5.2 필드 분류 (Source of Truth 관점)

| 카테고리 | 필드 |
|---|---|
| **Manual only** | 과제명, 설명, MPRS, AI기술, 일정, 예산, FTE, PM, 유관부서, 담당자, 주관 본부, 루트 페이지 등록, 라이프사이클 |
| **Sync only** | `project_updates` (source='atlassian_sync'), 페이지 메타데이터, `last_synced_at` |
| **Hybrid** | 진행률 (Phase C), health |

---

## 6. Atlassian 연동 흐름

### Phase 2 (규칙 기반 분류)
```
[Trigger]    Cron(09:00, 18:00) / 수동 클릭
     ↓
[Discovery]  과제 루트 페이지 → 자식 페이지 트리 탐색
     ↓
[Version]    page version 비교 → 변경된 페이지만 처리
     ↓
[Adapter]    classification_rules로 page_role 판정 시도
     ↓        못 잡으면 'other' + method='unclassified'
[Store]      project_confluence_pages 갱신
             각 페이지 본문을 project_updates에 INSERT
             projects.last_synced_at 갱신
```

### Phase 3 (LLM 분류 + 역할별 요약 + 검토 UI)
```
[Adapter]    규칙 우선
     ↓
[LLM 분류]   미분류 페이지 → Claude API로 page_role + 신뢰도
     ↓
[큐]         신뢰도 낮으면 needs_human_review=true → 검토 UI
     ↓
[역할별 요약] page_role별 다른 프롬프트로 요점 추출
     ↓
[Store]      요약된 content를 project_updates에 INSERT
```

---

## 7. 대시보드 UI/UX 사양

### 7.1 화면 목록

| 화면 | 목적 | Phase |
|---|---|---|
| 대시보드 홈 | 전체 과제 현황 / 드릴다운 필터 | 0 |
| 과제 상세 | 한 과제의 모든 정보 + 업데이트 타임라인 | 0 |
| 과제 생성/편집 | 메타데이터 입력 폼 | 0 |
| 업데이트 작성 | 수동 업데이트 입력 (모달) | 0 |
| 마스터 관리 | 부서/사람/AI기술/본부 CRUD | 0 |
| 경영진 요약 뷰 | KPI + 차트 중심 | 1 |
| Confluence 페이지 연결 | 과제에 루트 페이지 매핑 | 2 |
| 분류 규칙 관리 | 어댑터 규칙 CRUD | 2 |
| 분류 검토 큐 | needs_human_review 페이지 처리 | 3 |

### 7.2 대시보드 홈 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ 헤더 (제목 / 마지막 동기화 시각 / [지금 동기화] [새 과제])     │
├──────────┬──────────┬──────────────┬───────────────────────────┤
│ 과제현황 │ 진행현황 │ 본부별 과제  │ 투자비 집행                │
│ (5 카운트)│ (4 카운트)│ (6 본부 3×2)│ (전체 + MPRS별 4 막대)    │
│  클릭 ✓  │  클릭 ✓  │  클릭 ✓     │  표시만 (Phase 1)         │
├──────────┴──────────┴──────────────┴───────────────────────────┤
│ 필터 [진행 중 ×] [MBD본부 ×] → 18건  /  그룹: [전체] [MPRS]     │
├─────────────────────────────────────────────────────────────────┤
│ (그룹별 헤더 + 카드 5열 그리드, 디폴트 정렬: 진행→검토→진전→완료)│
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 과제 상세 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ Breadcrumb · 과제명 / 라이프사이클 / MPRS / AI기술 / [편집]      │
├──────────────┬──────────────────────────────────────────────────┤
│ 메타 (280px) │ 업데이트 타임라인                                  │
│ - 진행률     │  - 수동 + Atlassian 시간순 혼합                   │
│ - 주관 본부  │  - 출처 아이콘 + 역할 배지 + 원본 링크            │
│ - 일정       │  - [업데이트 작성] [출처 필터]                    │
│ - 투자비     │                                                    │
│ - PM         │                                                    │
│ - 유관부서   │                                                    │
│ - 연결 페이지│                                                    │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 8. SQL DDL (PostgreSQL 15+ / Supabase)

```sql
-- ============================================
-- 0. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ENUMS
-- ============================================
CREATE TYPE mprs_category AS ENUM ('marketing', 'production', 'research', 'support');
CREATE TYPE project_health AS ENUM ('green', 'yellow', 'red');
CREATE TYPE project_lifecycle AS ENUM ('not_started', 'under_review', 'in_progress', 'completed');
CREATE TYPE update_source AS ENUM ('manual', 'atlassian_sync');
CREATE TYPE confluence_page_role AS ENUM (
  'root', 'weekly_report', 'issue', 'meeting_note', 'other'
);
CREATE TYPE classification_method AS ENUM (
  'manual', 'rule', 'llm', 'unclassified'
);
CREATE TYPE rule_target_field AS ENUM ('title', 'parent_title', 'space_key');
CREATE TYPE user_role AS ENUM ('user');  -- 추후 'admin', 'ax_pm', 'stakeholder', 'viewer' 등 ADD VALUE 가능

-- ============================================
-- 2. 마스터 테이블
-- ============================================

CREATE TABLE headquarters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  headquarter_id  UUID REFERENCES headquarters(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_departments_hq ON departments(headquarter_id);

CREATE TABLE people (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  email          TEXT UNIQUE,
  department_id  UUID REFERENCES departments(id) ON DELETE SET NULL,
  role           user_role NOT NULL DEFAULT 'user',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_techs (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

-- ============================================
-- 3. 과제 본체
-- ============================================

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  mprs            mprs_category NOT NULL,
  headquarter_id  UUID NOT NULL REFERENCES headquarters(id) ON DELETE RESTRICT,
  lifecycle       project_lifecycle NOT NULL DEFAULT 'not_started',
  start_date      DATE,
  end_date        DATE,
  total_budget    NUMERIC(15, 2),
  fte             NUMERIC(5, 2),
  health          project_health NOT NULL DEFAULT 'green',
  progress_pct    INT NOT NULL DEFAULT 0
                  CHECK (progress_pct BETWEEN 0 AND 100),
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_projects_mprs       ON projects(mprs);
CREATE INDEX idx_projects_archived   ON projects(is_archived) WHERE is_archived = false;
CREATE INDEX idx_projects_health     ON projects(health);
CREATE INDEX idx_projects_lifecycle  ON projects(lifecycle);
CREATE INDEX idx_projects_hq         ON projects(headquarter_id);

-- 디폴트 정렬용 인덱스 (선택)
-- CREATE INDEX idx_projects_sort ON projects(
--   (CASE lifecycle
--     WHEN 'in_progress' THEN 1
--     WHEN 'under_review' THEN 2
--     WHEN 'not_started' THEN 3
--     WHEN 'completed' THEN 4
--    END), start_date ASC NULLS LAST);

-- ============================================
-- 4. 과제 ↔ 사람 / 부서 / AI기술 (M:N)
-- ============================================

CREATE TABLE project_pms (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES people(id)   ON DELETE RESTRICT,
  PRIMARY KEY (project_id, person_id)
);

CREATE INDEX idx_project_pms_person ON project_pms(person_id);

CREATE TABLE project_stakeholders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  department_id  UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  person_id      UUID REFERENCES people(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (project_id, department_id, person_id)
);

CREATE INDEX idx_stake_project    ON project_stakeholders(project_id);
CREATE INDEX idx_stake_department ON project_stakeholders(department_id);
CREATE INDEX idx_stake_person     ON project_stakeholders(person_id);

CREATE TABLE project_ai_techs (
  project_id  UUID NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  ai_tech_id  UUID NOT NULL REFERENCES ai_techs(id)  ON DELETE RESTRICT,
  PRIMARY KEY (project_id, ai_tech_id)
);

CREATE INDEX idx_project_ai_techs_tech ON project_ai_techs(ai_tech_id);

-- ============================================
-- 5. 월별 집행
-- ============================================

CREATE TABLE project_budget_monthly (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  year_month  CHAR(7) NOT NULL  CHECK (year_month ~ '^\d{4}-\d{2}$'),
  amount      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, year_month)
);

-- ============================================
-- 6. Confluence 페이지 매핑
-- ============================================

CREATE TABLE project_confluence_pages (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                 UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  confluence_page_id         TEXT NOT NULL UNIQUE,
  page_role                  confluence_page_role NOT NULL DEFAULT 'other',
  classification_method      classification_method NOT NULL DEFAULT 'unclassified',
  classification_confidence  NUMERIC(3, 2),
  needs_human_review         BOOLEAN NOT NULL DEFAULT false,
  title                      TEXT,
  parent_page_id             TEXT,
  last_modified_at           TIMESTAMPTZ,
  last_synced_at             TIMESTAMPTZ,
  last_classified_at         TIMESTAMPTZ,
  last_version               INT,
  is_active                  BOOLEAN NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pages_project ON project_confluence_pages(project_id);
CREATE INDEX idx_pages_role    ON project_confluence_pages(page_role);
CREATE INDEX idx_pages_review  ON project_confluence_pages(needs_human_review)
  WHERE needs_human_review = true;
CREATE INDEX idx_pages_active  ON project_confluence_pages(is_active)
  WHERE is_active = true;

-- ============================================
-- 7. 업데이트 로그 (project_confluence_pages 이후에 생성)
-- ============================================

CREATE TABLE project_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  update_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  content         TEXT NOT NULL,
  source          update_source NOT NULL DEFAULT 'manual',
  source_url      TEXT,
  source_page_id  UUID REFERENCES project_confluence_pages(id) ON DELETE SET NULL,
  author_id       UUID REFERENCES people(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_updates_project_date ON project_updates(project_id, update_date DESC);
CREATE INDEX idx_updates_source       ON project_updates(source);

-- ============================================
-- 8. 분류 규칙 (어댑터)
-- ============================================

CREATE TABLE confluence_classification_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id)    ON DELETE CASCADE,
  target_field    rule_target_field NOT NULL,
  pattern         TEXT NOT NULL,
  assigned_role   confluence_page_role NOT NULL,
  priority        INT NOT NULL DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES people(id)
);

CREATE INDEX idx_rules_department ON confluence_classification_rules(department_id);
CREATE INDEX idx_rules_project    ON confluence_classification_rules(project_id);
CREATE INDEX idx_rules_priority   ON confluence_classification_rules(priority);

-- ============================================
-- 9. updated_at 자동 갱신 트리거
-- ============================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 10. RLS 정책 (Phase 0 - 단일 역할)
-- ============================================
-- 모든 테이블에 RLS 켜고, "인증되면 모두 가능" 정책 적용.
-- 미래 권한 분화 시 정책 추가만 하면 됨.

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON projects FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_updates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_pms ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_pms FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_stakeholders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_ai_techs ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_ai_techs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_budget_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_budget_monthly FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_confluence_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_confluence_pages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE confluence_classification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON confluence_classification_rules FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE headquarters ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON headquarters FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON departments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON people FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE ai_techs ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON ai_techs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 향후 권한 분화 시 예시:
-- DROP POLICY auth_all ON projects;
-- CREATE POLICY projects_select ON projects FOR SELECT
--   USING (
--     (SELECT role FROM people WHERE email = auth.email()) IN ('admin', 'ax_pm', 'viewer')
--     OR ((SELECT role FROM people WHERE email = auth.email()) = 'stakeholder'
--         AND headquarter_id = (SELECT d.headquarter_id FROM people p
--                              JOIN departments d ON d.id = p.department_id
--                              WHERE p.email = auth.email()))
--   );

-- ============================================
-- 11. 마스터 데이터 시드
-- ============================================

INSERT INTO headquarters (name) VALUES
  ('MBD본부'),
  ('Bio연구본부'),
  ('개발본부'),
  ('L HOUSE 공장'),
  ('Quality본부'),
  ('경영지원본부');
-- 추후 ('전사') 추가 가능

-- AX추진실은 departments에 시드 (어느 본부 소속인지는 운영하면서 결정)
-- INSERT INTO departments (name, headquarter_id) VALUES ('AX추진실', NULL);
```

---

## 9. 대시보드 정렬·필터 쿼리 패턴

### 디폴트 정렬
```sql
SELECT *
FROM projects
ORDER BY
  CASE lifecycle
    WHEN 'in_progress' THEN 1
    WHEN 'under_review' THEN 2
    WHEN 'not_started' THEN 3
    WHEN 'completed'    THEN 4
  END,
  start_date ASC NULLS LAST;
```

### KPI 카운트
```sql
-- 과제 현황 (5개)
SELECT lifecycle, COUNT(*) FROM projects GROUP BY lifecycle;

-- 진행 현황 (헬스 3개 + 금주 업데이트)
SELECT health, COUNT(*) FROM projects GROUP BY health;
SELECT COUNT(DISTINCT project_id) FROM project_updates
  WHERE update_date >= date_trunc('week', CURRENT_DATE);

-- 본부별 과제
SELECT h.name, COUNT(p.id)
FROM headquarters h
LEFT JOIN projects p ON p.headquarter_id = h.id
GROUP BY h.id, h.name;

-- 투자비 집행 (MPRS별)
SELECT
  p.mprs,
  SUM(p.total_budget)                    AS budget,
  SUM(COALESCE(b.executed, 0))           AS executed
FROM projects p
LEFT JOIN (
  SELECT project_id, SUM(amount) AS executed
  FROM project_budget_monthly
  GROUP BY project_id
) b ON b.project_id = p.id
GROUP BY p.mprs;
```

### 교차 필터 (AND)
```sql
-- 예: 진행중 + 위험 + MBD본부
SELECT *
FROM projects
WHERE lifecycle = 'in_progress'
  AND health = 'red'
  AND headquarter_id = (SELECT id FROM headquarters WHERE name = 'MBD본부')
ORDER BY ...;
```

---

## 10. Phase 로드맵

| Phase | 범위 | 상태 |
|---|---|---|
| **0** | 데이터 모델 + 수동 입력 + 리스트/상세 뷰 + 드릴다운 인터랙션 | 기획 완료 |
| **1** | 경영진 요약 뷰 (별도 페이지) | 기획 일부 |
| **2** | Atlassian 동기화 + 규칙 기반 분류 + Cron + 수동 트리거 | 기획 완료 |
| **3** | LLM 분류 + 역할별 요약 + 검토 UI | 기획 골격만 |
| **4** | 알림(Teams 연계?), 히스토리, 감사 로그, Webhook 검토 | 미정 |
| **5** | AWS 이전 | 미정 |

---

## 11. 다음 작업

데이터 모델, Atlassian 연동, 대시보드 홈, 과제 상세 화면 모두 1차 확정됨.

다음 후보:
- **(가) 권한 모델 (RBAC)** — Supabase RLS와도 직결, 구현 전 결정 필수
- **(나) 과제 생성/편집 폼 와이어프레임** — 기본 CRUD 화면 설계
- **(다) 경영진 요약 뷰 와이어프레임** — Phase 1 화면 설계
- **(라) Phase 0 구현 착수** — Next.js + Supabase 프로젝트 세팅, DDL 마이그레이션 분리, 기본 CRUD
