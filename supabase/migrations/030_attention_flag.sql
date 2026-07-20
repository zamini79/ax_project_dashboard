-- ============================================
-- 030. '확인 필요' 이슈 플래그 (일정 신호등과 독립된 축)
-- ============================================
-- health(green/yellow/red)는 '일정 리스크' 축. 그와 별개로 "일정은 정상이나
-- 확인해야 할 이슈가 있는" 상태를 표현하기 위한 하이브리드(자동+수동) 플래그.
--
-- 자동: project_updates.issue_note — 주간보고에서 추출한 이슈 텍스트(없으면 NULL).
--       과제의 자동 상태 = 최신 업데이트에 issue_note가 있으면 ON.
-- 수동: projects.attention_override — PM이 자동 판정을 덮어씀.
--   auto = 자동 신호 따름(기본) / on = 강조 지정 / off = 확인 완료(해제)
--   attention_note = 수동 지정 시 메모.

CREATE TYPE attention_override AS ENUM ('auto', 'on', 'off');

ALTER TABLE projects
  ADD COLUMN attention_override attention_override NOT NULL DEFAULT 'auto',
  ADD COLUMN attention_note     TEXT;

ALTER TABLE project_updates
  ADD COLUMN issue_note TEXT;

COMMENT ON COLUMN projects.attention_override IS '확인 필요 수동 오버라이드: auto(자동)/on(강조)/off(해제)';
COMMENT ON COLUMN projects.attention_note IS '확인 필요 수동 지정 시 메모';
COMMENT ON COLUMN project_updates.issue_note IS '주간보고에서 추출한 이슈/확인필요 텍스트(없으면 NULL) — 자동 신호원';

CREATE INDEX idx_updates_issue ON project_updates(project_id)
  WHERE issue_note IS NOT NULL;
