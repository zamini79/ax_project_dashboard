-- ============================================
-- 014. 개발용 샘플 시드 — 운영 효과 + CAPEX (DEV ONLY)
-- ============================================
-- 멱등성: project_effects가 비어있을 때만 삽입.

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM project_effects) > 0 THEN
    RAISE NOTICE 'project_effects 존재 — 효과/CAPEX 시드 건너뜀';
    RETURN;
  END IF;

  -- ── 운영 효과 (과제명으로 매핑) ──
  INSERT INTO project_effects
    (project_id, applied_ym, is_pilot, save_cost_won, save_hours_month, note)
  SELECT p.id, v.applied, v.pilot, v.cost, v.hours, v.note
  FROM projects p
  JOIN (VALUES
    ('수요예측 시계열 모델',      '2026.01', false, 420000000::numeric, 1200::numeric, '안전재고 최적화로 재고비용 절감 · 예측 정확도 향상'),
    ('HR 문서 자동분류',          '2025.12', false,  60000000,           320,           '인사 문서 태깅·분류 자동화로 수작업 제거'),
    ('마케팅 성과 분석 대시보드', '2026.02', true,   40000000,            45,           '채널별 캠페인 성과 자동 집계 · 리포트 자동화'),
    ('고객문의 자동응답 봇',      '2026.03', true,   90000000,           210,           'FAQ 30종 1차 응대 자동화로 상담 부하 감소')
  ) AS v(name, applied, pilot, cost, hours, note) ON v.name = p.name;

  -- ── 효과 지표 (효과 → project → name 으로 연결) ──
  INSERT INTO project_effect_metrics (effect_id, kind, label, value, sort)
  SELECT e.id, m.kind, m.label, m.value, m.sort
  FROM project_effects e
  JOIN projects p ON p.id = e.project_id
  JOIN (VALUES
    ('수요예측 시계열 모델',      'won',    '연간 절감비용',      '4.2억',        0),
    ('수요예측 시계열 모델',      'time',   '업무시간 절감',      '1,200시간/월', 1),
    ('수요예측 시계열 모델',      'target', '예측 정확도',        '+18%p',        2),
    ('HR 문서 자동분류',          'time',   '문서처리 시간 절감', '320시간/월',   0),
    ('HR 문서 자동분류',          'won',    '연간 절감비용',      '0.6억',        1),
    ('HR 문서 자동분류',          'target', '분류 정확도',        '96%',          2),
    ('마케팅 성과 분석 대시보드', 'time',   '리포트 작성 시간 절감', '45시간/월',  0),
    ('마케팅 성과 분석 대시보드', 'target', '캠페인 ROAS 개선',   '+12%',         1),
    ('고객문의 자동응답 봇',      'target', '1차 응대 자동화율',  '38%',          0),
    ('고객문의 자동응답 봇',      'time',   '상담 처리시간 절감', '210시간/월',   1),
    ('고객문의 자동응답 봇',      'won',    '연간 절감비용',      '0.9억',        2)
  ) AS m(name, kind, label, value, sort) ON m.name = p.name;

  -- ── CAPEX 항목 (계획/집행 합계 = 전체 58.5억 / 21.45억) ──
  INSERT INTO capex_items (category, plan_won, exec_won, sort) VALUES
    ('GPU·AI 인프라',      1800000000,  900000000, 0),
    ('외부 용역·컨설팅',   1400000000,  360000000, 1),
    ('SW·라이선스',         850000000,  320000000, 2),
    ('클라우드 운영',       700000000,  380000000, 3),
    ('데이터 구축·라벨링',  600000000,  140000000, 4),
    ('기타',                500000000,   45000000, 5);

  RAISE NOTICE '효과/CAPEX 시드 완료';
END $$;
