-- ============================================
-- 007. Project Updates (업데이트 로그)
-- ============================================
-- projects, people, project_confluence_pages(006)에 의존.

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
