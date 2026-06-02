# AX 과제 대시보드 — 작업 컨텍스트 (CLAUDE.md)

> 이 파일은 Claude Code가 매 세션 시작 시 자동으로 읽습니다.
> 작업 전 **반드시 `docs/planning.md`를 먼저 참고**하세요.

## 프로젝트 개요

AX추진실의 AX 과제 진행현황을 한눈에 보고 관리하는 대시보드.
- 주 사용자: AX추진실 PM (일상 관리)
- 부 사용자: 경영진 (보고), 유관부서 담당자 (조회)
- 핵심: 수동 입력 + Atlassian(Confluence) 자동 동기화를 충돌 없이 공존

## 기술 스택

- Next.js 16 (App Router, Turbopack) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (Postgres 15+ / Auth)
- 배포: Vercel (추후 사내 AWS 이전 고려)
- LLM: Claude API (Phase 3)

**⚠️ Next.js 16 주의**: `middleware.ts`가 아니라 `proxy.ts` 컨벤션을 사용.
루트 가드는 `src/proxy.ts`의 `proxy()` 함수. (구버전 문서가 middleware라고 해도 proxy로 읽을 것)

## 개발 환경

- macOS / zsh
- 로컬 dev 포트: **3001** (3000은 다른 과제가 사용 중)
  - `package.json`: `"dev": "next dev -p 3001"`
- Supabase Site URL / Redirect URL도 `http://localhost:3001` 기준

## 개발 명령어

```sh
npm run dev          # 로컬 개발 (http://localhost:3001)
npm run build        # 빌드
npm run lint         # 린팅
npm run typecheck    # tsc --noEmit (없으면 추가)
npm run format       # prettier

supabase db push     # 마이그레이션 클라우드 적용
supabase db reset    # 로컬 DB 초기화 + 시드 (Docker 필요)
supabase gen types typescript --linked > src/lib/supabase/types.ts  # 타입 재생성
```

스키마 변경 시 `gen types`를 반드시 재실행할 것.

## 폴더 구조 규칙 (포터빌리티 — D-014)

```
src/
├── app/                    # 라우트 (App Router)
├── components/             # UI 컴포넌트
│   ├── ui/                 # shadcn/ui
│   └── ...                 # 도메인별
├── lib/
│   ├── supabase/           # 클라이언트만 여기 (server/browser/middleware/types)
│   ├── repositories/       # ★ DB 접근은 반드시 여기 경유
│   ├── domain/             # 비즈니스 로직 (DB·UI 무관 순수 함수)
│   └── auth/               # 인증 액션
└── proxy.ts                # 루트 가드 (Next.js 16)
```

**철칙**:
1. UI 컴포넌트에서 Supabase 클라이언트 직접 호출 금지 → repositories 경유
2. 비즈니스 로직(정렬·필터 룰 등)은 domain/에 순수 함수로
3. Supabase 고유 기능(RLS·Realtime·Edge Function)은 격리된 곳에만
4. 이유: 추후 AWS(RDS) 이전 시 호출 지점이 흩어지지 않도록

## 도메인 용어

- **MPRS**: Marketing / Production / Research / Support (제조 4대 영역, enum 고정)
- **라이프사이클**: `not_started`(진행 전) → `under_review`(검토 중) → `in_progress`(진행 중) → `completed`(완료)
  - "검토 중" = 손 안 댄 게 아니라 *진행 가능성 검토를 시작한* 상태
- **헬스**: green / yellow / red (주관적 위험 신호, 진행률과 별개)
- **본부 마스터**: MBD본부, Bio연구본부, 개발본부, L HOUSE 공장, Quality본부, 경영지원본부 (추후 '전사' 추가 가능)
- **AX추진실**: 이 대시보드를 운영하는 조직 (departments에 1 row)

## MPRS 색상 매핑 (전역 일관 — D-022)

| MPRS | 메인 | 배경 | 텍스트 |
|---|---|---|---|
| Marketing | #1D9E75 | #9FE1CB | #085041 |
| Production | #534AB7 | #CECBF6 | #3C3489 |
| Research | #D4537E | #F4C0D1 | #72243E |
| Support | #D85A30 | #F5C4B3 | #712B13 |

## 코드 컨벤션

- 서버 컴포넌트 기본, 클라이언트 컴포넌트는 'use client' 명시 + 최소화
- 한국어 UI 텍스트 직접 작성 (i18n 미적용)
- 날짜: date-fns, ISO 문자열 저장
- 통화: DB는 원 단위(`NUMERIC`), 화면은 억 단위 표시
- 월별 집행 누계는 저장 안 함 → SUM window로 계산 (D-007)

## 핵심 UI 규칙 (상세는 docs/planning.md §7)

- **기준 해상도**: 1920×1080 데스크탑
- **대시보드 홈**: 상단 KPI 4블록(과제현황 / 진행현황 / 본부별 과제 / 투자비 집행) + 카드 5열 그리드
- **KPI 드릴다운**: 같은 블록 내 단일 선택, 블록 간 AND 교차 필터 (D-019)
- **디폴트**: 필터 없음(전체), 정렬 = 진행중→검토중→진행전→완료, 그 안에서 시작일 오래된 순 (D-020)
- **그룹 토글**: 전체 / MPRS 2개 (D-021)
- **카드**: 좌측 컬러바=헬스, 상단 배지=MPRS·라이프사이클·본부
- **과제 상세**: 좌측 280px 메타 + 우측 업데이트 타임라인(수동+Atlassian 시간순 혼합)

## 권한 모델 (Phase 0)

- 단일 역할 `user`. 인증된 모든 사용자 동등 권한 (D-026)
- `people.role` enum은 미래 확장 대비로만 존재
- RLS는 전 테이블 `auth.role() = 'authenticated'` 통일
- 인증: Supabase Auth 매직링크 → 추후 사내 SSO (D-028)
- 사용자 식별은 `auth.email()` ↔ `people.email` 매칭
- 삭제 대신 archive (`projects.is_archived`) (D-027)

## 민감 디렉토리 / 주의

- `.env.local` — 절대 커밋 금지
- `supabase/migrations/` — 이미 적용된 파일은 **수정 금지**, 새 마이그레이션(012_) 추가로만 변경

## 현재 진행 상태 (2026-05-29)

### ✅ 완료
- Supabase 마이그레이션 11개 적용 (12 테이블 + RLS + 본부/AX추진실/AI기술 시드)
- 매직링크 인증 (로그인 페이지 / 콜백 / proxy 가드 / 로그아웃·현재사용자 액션)
- 본인 people row 등록

### 구현된 파일
```
src/lib/supabase/server.ts, browser.ts, middleware.ts, types.ts
src/lib/auth/actions.ts          # signOut(), getCurrentUser()
src/proxy.ts                     # 루트 가드 (Next.js 16)
src/app/login/page.tsx
src/app/auth/callback/route.ts
src/app/auth/auth-code-error/page.tsx
```

### 🔜 다음 작업 (Phase 0)
1. **대시보드 홈** — KPI 4블록 + 카드 5열 그리드 (docs/planning.md §7.2)
   - 먼저 `src/lib/repositories/projects.ts` (목록 조회 + KPI 집계)
   - `src/lib/domain/lifecycle.ts` (디폴트 정렬 함수)
   - 서버 컴포넌트 홈 + 카드 컴포넌트
2. **과제 상세** — 좌측 메타 + 우측 타임라인
3. **과제 생성/편집 폼** — react-hook-form + zod, M:N 입력(PM/유관부서/AI기술), 마스터 즉석 추가 (D-029)
4. **마스터 관리** — 부서/사람/AI기술/본부 CRUD

### Phase 0에서 안 하는 것
Atlassian 연동(P2), LLM 요약(P3), 알림·감사로그(P4+), 권한 분화, 모바일 최적화, 다국어.

## 의사결정 로그

모든 "왜"는 `docs/planning.md §4`에 D-001 ~ D-029로 기록됨.
구현 중 설계 판단이 필요하면 먼저 그 로그를 확인하고, 새 결정은 거기 추가할 것.
