# AX 과제 대시보드 — Phase 0 구현 셋업 가이드

> **목적**: 기획 문서 v0.5에서 정의된 Phase 0를 실제 코드로 옮기는 단계별 매뉴얼
> **대상 환경**: macOS / zsh / Claude Code
> **연관 문서**: `ax_dashboard_planning.md` (의사결정 / 데이터 모델 / UI 사양)

---

## 0. 사전 준비

### 필요한 계정 / 도구
- [ ] GitHub 계정 (저장소 호스팅)
- [ ] Vercel 계정 (Vercel CLI: `npm i -g vercel`)
- [ ] Supabase 계정 + 새 프로젝트 (Supabase CLI: `brew install supabase/tap/supabase`)
- [ ] Node.js 20 LTS 이상 (`node -v`로 확인)
- [ ] Atlassian Confluence 접근 토큰 (Phase 2 필요, Phase 0에는 아직 안 필요)

### 사내 프록시 환경 트러블슈팅

사내 망에서 SSL 인증서 이슈가 있으면 (이전에 겪었던 케이스), 다음을 시도:

```sh
# npm 설치 시 SSL 우회 (영구 설정은 비권장, 임시만)
npm config set strict-ssl false

# git clone 시 SSL 우회
git config --global http.sslVerify false

# 사내 CA 인증서가 있다면 그걸 등록하는 게 정공법
export NODE_EXTRA_CA_CERTS=/path/to/corp-ca.pem
```

`.zshrc`나 `.zshenv`에 프록시 환경변수 (`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`) 박혀 있는지 확인.

---

## 1. 프로젝트 초기화

### 1.1 Next.js 프로젝트 생성

```sh
cd ~/work
npx create-next-app@latest ax-dashboard \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint  # 나중에 직접 설치 (버전 통제용)

cd ax-dashboard
```

선택 사항 설명:
- `--app` — App Router (서버 컴포넌트 기본). Pages Router는 사용 안 함.
- `--src-dir` — 코드를 `src/` 아래로. 루트 깔끔.
- `--no-eslint` — Next.js 기본 설정 대신 직접 설정 (아래 1.4).

### 1.2 기본 의존성 설치

```sh
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI - shadcn/ui (Tailwind 기반 컴포넌트)
npx shadcn@latest init
# 설치 중 질문:
#   Style: Default
#   Base color: Slate
#   CSS variables: Yes
#   React Server Components: Yes
#   components.json 경로: 기본값

# 자주 쓸 컴포넌트 미리
npx shadcn@latest add button input textarea select badge card dialog \
  dropdown-menu form label table tabs toast separator

# 폼 / 검증
npm install react-hook-form @hookform/resolvers zod

# 날짜
npm install date-fns

# 차트 (대시보드용)
npm install recharts

# 아이콘
npm install lucide-react
```

### 1.3 개발 의존성

```sh
npm install -D \
  prettier prettier-plugin-tailwindcss \
  eslint eslint-config-next \
  @types/node
```

### 1.4 ESLint / Prettier 설정

`.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.eslintrc.json`:
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

`package.json` scripts에 추가:
```json
{
  "scripts": {
    "lint": "next lint",
    "format": "prettier --write \"src/**/*.{ts,tsx,md}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 2. 폴더 구조

```
ax-dashboard/
├── CLAUDE.md                   # Claude Code 작업 시 컨텍스트 (§7 참고)
├── README.md
├── docs/
│   ├── planning.md             # 기획 문서 (ax_dashboard_planning.md 복사)
│   └── setup-guide.md          # 이 문서
├── supabase/
│   └── migrations/             # SQL 마이그레이션 (§3)
├── src/
│   ├── app/                    # Next.js App Router (라우트)
│   │   ├── (auth)/             # 로그인 페이지 라우트 그룹
│   │   ├── (dashboard)/        # 인증 필요한 라우트 그룹
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # 대시보드 홈
│   │   │   ├── projects/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # 상세
│   │   │   │       └── edit/page.tsx
│   │   │   └── settings/       # 마스터 관리
│   │   ├── api/                # API 라우트 (sync cron 등)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/             # UI 컴포넌트
│   │   ├── ui/                 # shadcn/ui 생성물
│   │   ├── dashboard/          # 도메인별 컴포넌트
│   │   ├── projects/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/           # Supabase 클라이언트 (서버/브라우저)
│   │   │   ├── server.ts
│   │   │   ├── browser.ts
│   │   │   └── types.ts        # generated types
│   │   ├── repositories/       # ★ Repository 패턴 (D-014 포터빌리티)
│   │   │   ├── projects.ts
│   │   │   ├── people.ts
│   │   │   ├── departments.ts
│   │   │   ├── headquarters.ts
│   │   │   ├── ai-techs.ts
│   │   │   ├── budget.ts
│   │   │   └── updates.ts
│   │   ├── domain/             # 비즈니스 로직 (DB 무관)
│   │   │   ├── lifecycle.ts    # 정렬 룰 등
│   │   │   └── permissions.ts  # 권한 헬퍼 (Phase 0는 단순)
│   │   ├── confluence/         # Phase 2 추가
│   │   └── utils.ts
│   └── types/
│       └── index.ts            # 도메인 타입
├── .env.local                  # 비밀 (gitignore)
├── .env.example                # 템플릿 (git 포함)
└── ...
```

### 핵심 원칙 (D-014, 포터빌리티)

1. **Supabase 클라이언트는 `src/lib/supabase/`에만** — 다른 곳에서 직접 import 금지
2. **DB 접근은 `src/lib/repositories/`에서만** — UI 컴포넌트는 repository 함수만 호출
3. **비즈니스 로직은 `src/lib/domain/`** — DB와 UI 둘 다 모르는 순수 함수
4. **API 라우트도 repositories를 거침** — 직접 SQL 쿼리 금지

이 분리가 무너지면 AWS 이전 시 호출 지점을 찾아 다닐 일이 생겨.

---

## 3. Supabase 마이그레이션

### 3.1 Supabase 프로젝트 연결

```sh
# Supabase 대시보드에서 프로젝트 생성 후
supabase login
supabase link --project-ref <your-project-ref>
```

### 3.2 마이그레이션 파일 분리 (의존성 순서)

기획 문서의 통합 DDL을 *논리적 단위로* 나눠서 마이그레이션 파일로 만들기. Supabase CLI로:

```sh
supabase migration new 001_extensions_and_enums
supabase migration new 002_master_tables
supabase migration new 003_projects
supabase migration new 004_project_relations
supabase migration new 005_project_budget
supabase migration new 006_confluence_pages
supabase migration new 007_project_updates
supabase migration new 008_classification_rules
supabase migration new 009_triggers
supabase migration new 010_rls_policies
supabase migration new 011_seed_data
```

각 파일에 들어갈 내용은 *기획 문서 §8 SQL DDL을 의존성 순서로 자른 것*. 다음 턴에 파일별 SQL을 출력해줄게.

### 3.3 마이그레이션 적용

```sh
# 로컬 (개발용)
supabase db reset            # 깨끗이 처음부터

# 원격 (Supabase 클라우드)
supabase db push
```

### 3.4 TypeScript 타입 자동 생성

```sh
supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
```

스키마 변경할 때마다 재실행. CI에 넣어두면 좋음.

---

## 4. 환경 변수

`.env.example` (git 포함):
```sh
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # 서버 전용 (cron 등). 클라이언트로 누출되면 안 됨

# Phase 2 이후
CONFLUENCE_BASE_URL=
CONFLUENCE_API_TOKEN=
CONFLUENCE_USER_EMAIL=

# Phase 3 이후
ANTHROPIC_API_KEY=

# Cron 보호 (Vercel Cron이 호출하는 API route에 인증)
CRON_SECRET=
```

`.env.local` (gitignore):
실제 값 채워 넣음. `.gitignore`에 이미 포함되어 있어야 함.

---

## 5. Supabase 클라이언트 골격

`src/lib/supabase/server.ts` (서버 컴포넌트·API 라우트용):
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 무시 (정상)
          }
        },
      },
    }
  );
}
```

`src/lib/supabase/browser.ts` (클라이언트 컴포넌트용):
```ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

## 6. Repository 패턴 예시

`src/lib/repositories/projects.ts`:
```ts
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export async function listProjects(filters?: {
  lifecycle?: Project['lifecycle'][];
  health?: Project['health'][];
  headquarterIds?: string[];
  mprs?: Project['mprs'][];
  includeArchived?: boolean;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('projects')
    .select(`
      *,
      headquarters(name),
      project_pms(person_id, people(name)),
      project_ai_techs(ai_tech_id, ai_techs(name))
    `);

  if (!filters?.includeArchived) {
    query = query.eq('is_archived', false);
  }
  if (filters?.lifecycle?.length) {
    query = query.in('lifecycle', filters.lifecycle);
  }
  if (filters?.health?.length) {
    query = query.in('health', filters.health);
  }
  if (filters?.headquarterIds?.length) {
    query = query.in('headquarter_id', filters.headquarterIds);
  }
  if (filters?.mprs?.length) {
    query = query.in('mprs', filters.mprs);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createProject(input: ProjectInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 정렬은 도메인 로직 (D-020)
export function sortProjectsByDefault<T extends { lifecycle: Project['lifecycle']; start_date: string | null }>(
  projects: T[]
): T[] {
  const lifecycleOrder = { in_progress: 1, under_review: 2, not_started: 3, completed: 4 } as const;
  return [...projects].sort((a, b) => {
    const lo = lifecycleOrder[a.lifecycle] - lifecycleOrder[b.lifecycle];
    if (lo !== 0) return lo;
    const aDate = a.start_date ?? '9999-12-31';
    const bDate = b.start_date ?? '9999-12-31';
    return aDate.localeCompare(bDate);
  });
}
```

---

## 7. CLAUDE.md 초안

`CLAUDE.md` — Claude Code가 매 세션 시작 시 읽는 파일. 다음 내용 권장:

````markdown
# AX 과제 대시보드 — 작업 컨텍스트

## 프로젝트 개요
AX추진실의 AX 과제 진행현황 관리 대시보드.
**기획 문서: `docs/planning.md`를 항상 먼저 참고할 것.**

## 기술 스택
- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth)
- 배포: Vercel

## 폴더 구조 규칙 (포터빌리티)
- DB 접근은 **반드시 `src/lib/repositories/`를 거쳐서**. UI에서 Supabase 클라이언트 직접 호출 금지.
- 비즈니스 로직은 `src/lib/domain/` (DB/UI 무관).
- Supabase 고유 기능(RLS·Edge Function)은 격리된 곳에만.

## 개발 명령어
- `npm run dev` — 로컬 개발 (http://localhost:3000)
- `npm run lint` — 린팅
- `npm run typecheck` — 타입 체크
- `npm run format` — 포맷팅
- `supabase db reset` — 로컬 DB 초기화 + 시드
- `supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts` — 타입 재생성

## 코드 컨벤션
- 함수형 컴포넌트 + 서버 컴포넌트 기본
- 클라이언트 컴포넌트는 'use client' 명시, 최소화
- Tailwind 클래스는 의미 단위로 그룹핑
- 한국어 UI 텍스트는 컴포넌트 안에 직접 (i18n은 Phase 외)
- 날짜는 date-fns 사용, ISO 문자열로 저장
- 통화는 억 단위 표시 (DB에는 원 단위)

## 민감 디렉토리
- `.env.local` — 절대 커밋 금지
- `supabase/migrations/` — 작성된 파일은 *수정하지 말고* 새 마이그레이션 추가

## 도메인 용어
- MPRS: Marketing / Production / Research / Support
- 라이프사이클: not_started → under_review → in_progress → completed
- 헬스: green / yellow / red
- 본부 마스터: MBD본부, Bio연구본부, 개발본부, L HOUSE 공장, Quality본부, 경영지원본부
- AX추진실: 이 대시보드를 운영하는 조직 (departments에 1개 row로 존재)

## 핵심 설계 결정
모든 의사결정은 `docs/planning.md` §4 "의사결정 로그" 참조.
특히 자주 참조:
- D-014: Repository 패턴 강제
- D-018~D-024: 대시보드 UI 구조와 인터랙션
- D-026~D-028: 권한 모델 (Phase 0는 단일 역할)
````

---

## 8. 첫 실행 체크리스트

```
[ ] 1. GitHub에 빈 repo 생성, 로컬 git init + 첫 커밋 + push
[ ] 2. Supabase 프로젝트 생성, ref 메모
[ ] 3. .env.local에 Supabase URL/Key 채우기
[ ] 4. supabase link, migrations 폴더에 SQL 파일 채우기 (다음 턴에 출력 예정)
[ ] 5. supabase db push로 클라우드에 스키마 적용
[ ] 6. supabase gen types로 타입 생성
[ ] 7. npm run dev 후 http://localhost:3000 확인
[ ] 8. Supabase Auth 대시보드에서 본인 이메일로 첫 로그인 테스트
[ ] 9. people 테이블에 본인 row 추가 (email 일치, role='user')
[ ] 10. Vercel에 배포 (vercel CLI로 vercel --prod)
```

---

## 9. Phase 0에 *안 하는* 것 (분명히 해두기)

- Atlassian / Confluence 연동 (Phase 2)
- LLM 분류·요약 (Phase 3)
- 알림·감사로그 (Phase 4+)
- 권한 분화 (현재 단일 역할)
- 모바일 최적화 (1920 데스크탑 우선)
- 다국어 (한국어만)

운영해보면서 진짜 필요한 게 드러나면 추가. *예측해서 만들면 안 씀*.
