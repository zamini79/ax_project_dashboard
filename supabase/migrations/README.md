# Supabase 마이그레이션

`ax_dashboard_planning.md` v0.5의 데이터 모델을 의존성 순서로 분리한 11개 파일.

## 적용 방법

### 방법 A: Supabase CLI (권장)
```sh
# 이 폴더의 .sql 파일들을 프로젝트의 supabase/migrations/ 로 복사
# 파일명 앞 번호가 실행 순서를 결정함 (사전순)

supabase db push          # 원격(클라우드)에 적용
# 또는
supabase db reset         # 로컬에 처음부터 재적용 (개발용)
```

> Supabase CLI는 파일명을 타임스탬프로 관리하기도 함.
> `supabase migration new <name>` 으로 빈 파일을 만든 뒤 내용을 붙여넣는 방식을 쓰면
> CLI의 마이그레이션 추적과 정확히 맞물림. (setup-guide.md §3.2 참조)

### 방법 B: SQL Editor 직접 실행
Supabase 대시보드 → SQL Editor → 001부터 011까지 *순서대로* 붙여넣고 실행.

## 파일 순서와 의존성

| 순서 | 파일 | 내용 | 의존 |
|---|---|---|---|
| 001 | extensions_and_enums | pgcrypto, 8개 enum | - |
| 002 | master_tables | headquarters, departments, people, ai_techs | 001 |
| 003 | projects | 과제 본체 | 002 (headquarters) |
| 004 | project_relations | pms, stakeholders, ai_techs 조인 | 002, 003 |
| 005 | project_budget | 월별 집행 | 003 |
| 006 | confluence_pages | 페이지 매핑 | 003 |
| 007 | project_updates | 업데이트 로그 | 003, 006 (FK) |
| 008 | classification_rules | 어댑터 규칙 | 002, 003 |
| 009 | triggers | updated_at 자동 갱신 | 003 |
| 010 | rls_policies | RLS 12개 테이블 | 전부 |
| 011 | seed_data | 본부/AX추진실/AI기술 시드 | 002 |

**중요**: 007(updates)이 006(confluence_pages)을 FK 참조하므로 006이 먼저여야 함.

## 검증 완료
- pglast(Postgres 파서) 문법 검증 통과 (72 statements)
- statement 단위 의존성 순서 검증 통과 (12 테이블, 모든 참조 선행 정의)

## 롤백 주의
작성된 마이그레이션 파일은 *수정하지 말 것*. 변경이 필요하면 새 마이그레이션
(`012_xxx.sql`)을 추가하는 방식으로. 이미 적용된 파일을 고치면 환경 간 불일치 발생.
