-- ============================================
-- 006. Confluence Page Mapping
-- ============================================
-- projects에 의존. project_updates(007)가 이걸 FK로 참조하므로 먼저 생성.

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
  last_modified_at           TIMESTAMPTZ,   -- Confluence 상의 마지막 수정
  last_synced_at             TIMESTAMPTZ,   -- 우리가 마지막으로 동기화
  last_classified_at         TIMESTAMPTZ,   -- 마지막 역할 판정
  last_version               INT,           -- 버전 번호 (중복 방지)
  is_active                  BOOLEAN NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pages_project ON project_confluence_pages(project_id);
CREATE INDEX idx_pages_role    ON project_confluence_pages(page_role);
CREATE INDEX idx_pages_review  ON project_confluence_pages(needs_human_review)
  WHERE needs_human_review = true;
CREATE INDEX idx_pages_active  ON project_confluence_pages(is_active)
  WHERE is_active = true;
