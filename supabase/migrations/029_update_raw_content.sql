-- ============================================
-- 029. 업데이트 원본 보관 (raw_content)
-- ============================================
-- Confluence 등 외부 소스에서 가져온 업데이트는 요약본(content)과 별개로
-- 원본 발췌 전문을 raw_content에 보관한다.
-- - content      : 화면에 노출되는 요약본 (기존 그대로)
-- - raw_content  : 소스 원본 발췌 (요약 전 전문). 수동 입력은 NULL.

ALTER TABLE project_updates
  ADD COLUMN raw_content TEXT;

COMMENT ON COLUMN project_updates.content IS '표시용 요약본';
COMMENT ON COLUMN project_updates.raw_content IS '소스 원본 발췌 전문 (Confluence 등). 수동 입력은 NULL.';
