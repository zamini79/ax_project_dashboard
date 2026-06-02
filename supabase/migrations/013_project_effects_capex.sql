-- ============================================
-- 013. 성과(운영 효과) + CAPEX 항목 테이블
-- ============================================
-- 성과 현황·투자비 현황 고도화를 위한 신규 데이터 모델 (planning.md "정량 효과지표 확장").

-- 운영 효과 (완료/운영 적용된 과제의 실제 효과)
CREATE TABLE project_effects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  applied_ym        TEXT,                          -- 적용 시점 'YYYY.MM'
  is_pilot          BOOLEAN NOT NULL DEFAULT false, -- 파일럿(부분 운영) 여부
  save_cost_won     NUMERIC NOT NULL DEFAULT 0,     -- 연간 절감비용(원). 화면은 억 환산
  save_hours_month  NUMERIC NOT NULL DEFAULT 0,     -- 월 업무시간 절감(시간)
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_effects_project ON project_effects(project_id);

-- 표시용 지표(라벨/값 자유형): 정확도 등 비정형 지표
CREATE TABLE project_effect_metrics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effect_id  UUID NOT NULL REFERENCES project_effects(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,   -- 'won' | 'time' | 'target'
  label      TEXT NOT NULL,
  value      TEXT NOT NULL,   -- "1,200시간/월", "+18%p" 등 표시 문자열
  sort       INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_effect_metrics_effect ON project_effect_metrics(effect_id);

-- CAPEX 항목(카테고리)별 계획/집행
CREATE TABLE capex_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category   TEXT NOT NULL,
  plan_won   NUMERIC NOT NULL DEFAULT 0,
  exec_won   NUMERIC NOT NULL DEFAULT 0,
  sort       INT NOT NULL DEFAULT 0
);

-- RLS (기존 패턴 동일: 인증되면 모두 가능)
ALTER TABLE project_effects ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_effects FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_effect_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON project_effect_metrics FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE capex_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_all ON capex_items FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
