-- ============================================
-- 027. 과제 첨부파일 (공개 버킷 + 메타 테이블)
-- ============================================
-- 편집 폼에서 파일 업로드 → Supabase Storage(공개 버킷) 저장 + 메타 행 기록.
-- 공개 버킷이라 공개 URL을 그대로 복사·공유 가능(경로는 랜덤).

CREATE TABLE project_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,          -- 원본 파일명(표시용)
  storage_path TEXT NOT NULL,          -- 버킷 내 경로
  mime_type    TEXT,
  size_bytes   BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_project ON project_attachments(project_id);

ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_attachments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 공개 스토리지 버킷 (링크만 있으면 열람)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-attachments', 'project-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 정책: 인증 사용자는 업로드/수정/삭제, 읽기는 공개
CREATE POLICY "project-attachments insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-attachments');
CREATE POLICY "project-attachments update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-attachments');
CREATE POLICY "project-attachments delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-attachments');
CREATE POLICY "project-attachments read" ON storage.objects FOR SELECT
  USING (bucket_id = 'project-attachments');
