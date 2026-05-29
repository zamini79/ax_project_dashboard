# AX 과제 대시보드 — 기획 문서

> **상태**: v0.1 (데이터 모델 확정 / Source of Truth 논의 중)
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
| DB | Supabase (Postgres) | AWS RDS Postgres |
| Auth | Supabase Auth → **가능하면 사내 SSO부터** | 사내 IdP / Cognito |
| LLM | Claude API (Phase 3) | 동일 |

### 포터빌리티 원칙
1. **Repository 패턴 강제** — Supabase 클라이언트 호출을 코드 전체에 흩뿌리지 말 것
2. **Postgres 표준 SQL 위주** — Supabase 고유 기능(RLS, Realtime, Edge Functions)은 *격리된 곳에만*
3. **Next.js 권장** — Vercel ↔ AWS 양쪽에서 자연스러움
4. **Auth는 가능하면 처음부터 사내 SSO** — 나중에 Supabase Auth → SSO 마이그레이션은 비용이 큼

---

## 4. 의사결정 로그

### ✅ 결정됨

**D-001. 라이프사이클 단계 관리는 하지 않는다 (v1)**
- 이유: 추진실 통용 단계 용어가 아직 합의 안 됨. 라벨 놀이로 전락할 위험.
- 향후: 운영하면서 필요해지면 추가.

**D-002. 과제 하위 구조는 "업데이트 로그"만 둔다**
- 마일스톤 / 하위 태스크는 제외.
- 이유: Atlassian 연동의 6번 요구사항과 가장 자연스럽게 맞물림. 마일스톤은 운영하면서 필요해지면 추가.
- 하위 태스크는 *영구히 안 만듦* — Jira와 중복.

**D-003. 분류 체계는 MPRS (Marketing / Production / Research / Support)**
- 4개 고정 → enum으로 처리.
- 서브 분류로 AI기술 추가, *멀티값 허용* → 마스터 테이블 + join 테이블.

**D-004. PM은 공동 가능**
- `project_pms` join 테이블로 분리.

**D-005. 유관부서당 담당자 여러 명 가능**
- `project_stakeholders` 3-key join 테이블.
- 부서만 정해지고 담당자 미정인 경우도 수용 (person_id nullable).

**D-006. 진행률은 Phase A에서 수동 입력만, Phase C에서 자동+수동 오버라이드로 확장**

**D-007. 월별 집행 누계는 저장하지 않고 SUM 쿼리로 계산**
- 과거 월 수정 시 줄줄이 재계산 위험 회피.

### 🟡 논의 중

**Q-001. Atlassian 매핑 단위** — 과제 1개 ↔ Confluence 페이지 1개 vs N개?
**Q-002. 동기화 빈도** — cron / 수동 / webhook?
**Q-003. 동기화 중복 방지** — 페이지 lastModified 비교?
**Q-004. LLM 요약 실행 환경** — Vercel Edge / Supabase Edge Functions / 별도 워커?

### ⏭️ 미정 / 후순위

- 사용자 권한 모델 (RBAC 상세)
- 알림 (Teams 연계 가능성 — A.Biz 자산 활용?)
- 감사 로그
- AWS 이전 시점

---

## 5. 데이터 모델 v1

### 5.1 테이블 목록

| 테이블 | 역할 |
|---|---|
| `projects` | 과제 본체 |
| `people` | 사람 마스터 |
| `departments` | 부서 마스터 (AX추진실 포함) |
| `ai_techs` | AI기술 마스터 |
| `project_pms` | 과제 ↔ 공동 PM (M:N) |
| `project_stakeholders` | 과제 ↔ 유관부서 ↔ 담당자 |
| `project_ai_techs` | 과제 ↔ AI기술 (M:N) |
| `project_budget_monthly` | 월별 집행액 |
| `project_updates` | 업데이트 로그 (수동 / Atlassian 자동) |

### 5.2 의도적으로 *제외한* 것

- `priority` — 사용자 1차 정리에서 제외
- `actual_end_date` — `end_date` 하나로 통합 (실제 종료 시 수정)
- `tags` — MPRS + AI기술로 충분
- `attachments` — Confluence가 그 역할
- `audit_log` — Phase 4 이후

### 5.3 필드 분류 (Source of Truth 관점)

| 카테고리 | 필드 | 비고 |
|---|---|---|
| **Manual only** | 과제명, 설명, MPRS, AI기술, 일정, 예산, FTE, PM, 유관부서, 담당자, Confluence 페이지 ID | Atlassian에 없거나 신뢰 불가 |
| **Sync only** | `project_updates` (source='atlassian_sync'), `last_synced_at` | 자동만, 사람은 못 씀 |
| **Hybrid** | 진행률 (Phase C), health | Phase A에서는 수동만 |

→ **충돌이 안 생기는 이유**: 같은 필드를 두 출처가 동시에 쓰지 않음.

---

## 6. SQL DDL (PostgreSQL 15+ / Supabase)

```sql
-- ============================================
-- 0. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ============================================
-- 1. ENUMS
-- ============================================
CREATE TYPE mprs_category AS ENUM ('marketing', 'production', 'research', 'support');
CREATE TYPE project_health AS ENUM ('green', 'yellow', 'red');
CREATE TYPE update_source AS ENUM ('manual', 'atlassian_sync');

-- ============================================
-- 2. 마스터 테이블
-- ============================================

CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE people (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  email          TEXT UNIQUE,
  department_id  UUID REFERENCES departments(id) ON DELETE SET NULL,
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
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  mprs                mprs_category NOT NULL,
  start_date          DATE,
  end_date            DATE,
  total_budget        NUMERIC(15, 2),               -- 총 투자비 (원 단위)
  fte                 NUMERIC(5, 2),                -- 투입 FTE
  health              project_health NOT NULL DEFAULT 'green',
  progress_pct        INT NOT NULL DEFAULT 0
                      CHECK (progress_pct BETWEEN 0 AND 100),
  confluence_page_id  TEXT,                         -- Confluence 페이지 ID
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_projects_mprs    ON projects(mprs);
CREATE INDEX idx_projects_health  ON projects(health);

-- ============================================
-- 4. 과제 ↔ 사람 / 부서 / AI기술 (M:N)
-- ============================================

-- 공동 PM
CREATE TABLE project_pms (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES people(id)   ON DELETE RESTRICT,
  PRIMARY KEY (project_id, person_id)
);

CREATE INDEX idx_project_pms_person ON project_pms(person_id);

-- 유관부서 + 담당자 (부서당 N명 가능 / 담당자 미정 케이스도 수용)
CREATE TABLE project_stakeholders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  department_id  UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  person_id      UUID REFERENCES people(id) ON DELETE SET NULL,  -- nullable
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- PG 15+ : NULL도 동일하게 취급해서 (proj, dept, NULL) 중복 방지
  UNIQUE NULLS NOT DISTINCT (project_id, department_id, person_id)
);

CREATE INDEX idx_stake_project    ON project_stakeholders(project_id);
CREATE INDEX idx_stake_department ON project_stakeholders(department_id);
CREATE INDEX idx_stake_person     ON project_stakeholders(person_id);

-- AI기술 태깅
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
  year_month  CHAR(7) NOT NULL  CHECK (year_month ~ '^\d{4}-\d{2}$'),  -- 'YYYY-MM'
  amount      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, year_month)
);

-- 누계는 SUM window로 계산 (저장하지 않음)
-- 예시:
--   SELECT year_month,
--          amount,
--          SUM(amount) OVER (PARTITION BY project_id ORDER BY year_month) AS cumulative
--   FROM project_budget_monthly
--   WHERE project_id = $1;

-- ============================================
-- 6. 업데이트 로그
-- ============================================

CREATE TABLE project_updates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  update_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  content      TEXT NOT NULL,
  source       update_source NOT NULL DEFAULT 'manual',
  source_url   TEXT,                                            -- Confluence URL (sync 시)
  author_id    UUID REFERENCES people(id) ON DELETE SET NULL,   -- 수동 입력 작성자
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_updates_project_date ON project_updates(project_id, update_date DESC);
CREATE INDEX idx_updates_source       ON project_updates(source);

-- ============================================
-- 7. updated_at 자동 갱신 트리거
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
```

---

## 7. Phase 로드맵

| Phase | 범위 | 주요 결정 의존 |
|---|---|---|
| **0** | 데이터 모델 + 수동 입력 + 리스트/상세 뷰 | (현재 위치) |
| **1** | 필터·그룹핑·상태 시각화, 경영진 요약 뷰 | UI/UX 설계 |
| **2** | Atlassian 일방향 동기화 (단순 필드 매핑) | Q-001~003 |
| **3** | LLM 요약 (주간 진행현황 자동 생성) | Q-004 |
| **4** | 알림, 히스토리, 감사 로그 | Teams 연동 가능성 |
| **5** | AWS 이전 | 사내 환경 합의 |

---

## 8. 다음 작업

→ **#2 Source of Truth (Atlassian 연동 모델)** 의사결정 진행 중.
Q-001 ~ Q-004 답이 정해지면 v0.2로 갱신.
