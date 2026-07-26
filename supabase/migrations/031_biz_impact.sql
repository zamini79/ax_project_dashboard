-- ============================================
-- 031. 사용성 지표 기반 Biz Impact (성과 현황)
-- ============================================
-- 운영 중인 AI 서비스의 사용량(API Call)에 단가를 곱해 산출하는 절감효과.
-- project_effects(연간 절감비용·시간, 수기 보고)와 별개 축:
--   - project_effects        : 부서 보고 기반 연간 환산 효과
--   - project_biz_impacts    : 사용량 로그 기반 기간별 실측 효과 + 산정기준
--
-- 산정기준(basis)은 원본 엑셀의 문구를 그대로 배열로 보관해 화면에 함께 표시한다.
-- 누계는 저장하지 않고 points를 기간순 누적해 계산한다 (D-007 원칙과 동일).

CREATE TYPE biz_period_kind AS ENUM ('week', 'month');

CREATE TABLE project_biz_impacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  unit_label        TEXT NOT NULL DEFAULT 'API Call',  -- 사용성 지표 이름
  unit_value_manwon NUMERIC,                            -- 1건당 절감액(만원). NULL = 산정기준 미정
  basis             TEXT[] NOT NULL DEFAULT '{}',       -- 산정기준 문구(원본 그대로)
  source_file       TEXT,                               -- 근거 파일명
  as_of             DATE,                               -- 데이터 기준일
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_biz_impact_points (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impact_id      UUID NOT NULL REFERENCES project_biz_impacts(id) ON DELETE CASCADE,
  period_kind    biz_period_kind NOT NULL,
  year           INT NOT NULL,
  period_no      INT NOT NULL,                    -- 주차(1~53) 또는 월(1~12)
  call_count     NUMERIC NOT NULL DEFAULT 0,
  impact_manwon  NUMERIC NOT NULL DEFAULT 0,
  breakdown      JSONB,                           -- 지표 세부(예: JSA 추천 유형별 건수)
  UNIQUE (impact_id, period_kind, year, period_no)
);

CREATE INDEX idx_biz_points_impact ON project_biz_impact_points(impact_id, year, period_no);

COMMENT ON TABLE project_biz_impacts IS '사용성 지표 기반 Biz Impact 정의 + 산정기준';
COMMENT ON COLUMN project_biz_impacts.basis IS '산정기준 문구 배열 — 원본 엑셀 표기 보존';
COMMENT ON COLUMN project_biz_impacts.unit_value_manwon IS '사용 1건당 절감액(만원). NULL이면 산정기준 미정';
COMMENT ON TABLE project_biz_impact_points IS '기간별(주/월) 사용량·절감효과 실측치. 누계는 계산으로 도출';

ALTER TABLE project_biz_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_biz_impact_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_all ON project_biz_impacts FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY auth_all ON project_biz_impact_points FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
