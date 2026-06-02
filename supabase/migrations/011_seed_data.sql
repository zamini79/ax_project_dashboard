-- ============================================
-- 011. Seed Data
-- ============================================
-- 본부 마스터 (D-015). 추후 '전사' 추가 가능.

INSERT INTO headquarters (name) VALUES
  ('MBD본부'),
  ('Bio연구본부'),
  ('개발본부'),
  ('L HOUSE 공장'),
  ('Quality본부'),
  ('경영지원본부')
ON CONFLICT (name) DO NOTHING;

-- AX추진실 부서 (소속 본부는 운영하면서 결정 → 일단 NULL)
INSERT INTO departments (name, headquarter_id) VALUES
  ('AX추진실', NULL)
ON CONFLICT (name) DO NOTHING;

-- AI기술 마스터 초기값 (즉석 추가 가능하므로 최소만)
INSERT INTO ai_techs (name) VALUES
  ('LLM'),
  ('RAG'),
  ('Vision'),
  ('시계열'),
  ('추천'),
  ('NLP')
ON CONFLICT (name) DO NOTHING;

-- ※ 사람(people) 시드는 하지 않음.
--   각 사용자가 Supabase Auth로 첫 로그인 후, email 일치하는 row를 추가하는 절차.
--   (Phase 0 체크리스트 9번 참조)
