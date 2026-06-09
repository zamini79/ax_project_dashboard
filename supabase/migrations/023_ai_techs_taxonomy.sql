-- ============================================
-- 023. AI기술 분류 정비 — LLM / ML / RAG / Vision
-- ============================================
-- AI기술 마스터를 4종으로 표준화 (그 외 제거, 누락분 추가). 멱등.

DELETE FROM ai_techs WHERE name NOT IN ('LLM', 'ML', 'RAG', 'Vision');

INSERT INTO ai_techs (name)
SELECT v.name
FROM (VALUES ('LLM'), ('ML'), ('RAG'), ('Vision')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM ai_techs a WHERE a.name = v.name);
