-- ============================================
-- 024. 과제 속성(태그) — 마스터 tags + M:N project_tags
-- ============================================
-- 기존 분류(MPRS·투자유형) 외, 과제에 여러 개 붙일 수 있는 속성(태그).
-- 마스터 관리에서 추가·수정·삭제 가능 (AI기술과 동일 구조). 멱등 시드.

CREATE TABLE tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  sort_order  INT  NOT NULL DEFAULT 0, -- 표시 순서 (작을수록 먼저)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_tags (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id)     ON DELETE RESTRICT,
  PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX idx_project_tags_tag ON project_tags(tag_id);

-- RLS: Phase 0 단일 역할 — 인증되면 모두 가능 (010과 동일 정책)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON tags FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_tags FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 초기 속성 3종 시드 (멱등)
INSERT INTO tags (name, sort_order)
SELECT v.name, v.ord
FROM (VALUES ('Top-down', 1), ('Bottom-up', 2), ('IT Backbone', 3)) AS v(name, ord)
WHERE NOT EXISTS (SELECT 1 FROM tags t WHERE t.name = v.name);
