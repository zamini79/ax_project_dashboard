-- ============================================
-- 001. Extensions & Enums
-- ============================================
-- 가장 먼저 실행. 이후 모든 테이블이 이 타입들에 의존.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

CREATE TYPE mprs_category AS ENUM ('marketing', 'production', 'research', 'support');

CREATE TYPE project_health AS ENUM ('green', 'yellow', 'red');

CREATE TYPE project_lifecycle AS ENUM ('not_started', 'under_review', 'in_progress', 'completed');

CREATE TYPE update_source AS ENUM ('manual', 'atlassian_sync');

CREATE TYPE confluence_page_role AS ENUM ('root', 'weekly_report', 'issue', 'meeting_note', 'other');

CREATE TYPE classification_method AS ENUM ('manual', 'rule', 'llm', 'unclassified');

CREATE TYPE rule_target_field AS ENUM ('title', 'parent_title', 'space_key');

-- 단일 역할로 시작. 추후 ALTER TYPE ... ADD VALUE 로 확장.
CREATE TYPE user_role AS ENUM ('user');
