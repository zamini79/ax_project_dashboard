-- ============================================
-- 012. 개발용 샘플 시드 (DEV ONLY)
-- ============================================
-- 대시보드 홈/KPI/정렬/필터/그룹을 눈으로 검증하기 위한 샘플 데이터.
-- ⚠️ 운영 데이터 아님. `supabase db reset` 후 다시 적용됨.
-- 멱등성: projects가 비어있을 때만 삽입 (재실행 시 중복 방지).
-- 제거하려면 이 파일 삭제 후 reset, 또는 아래 행들 수동 DELETE.

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM projects) > 0 THEN
    RAISE NOTICE 'projects가 이미 존재 — 샘플 시드 건너뜀';
    RETURN;
  END IF;

  -- ── 샘플 사람 (이메일 NULL: 실제 인증 사용자와 충돌 없음) ──
  INSERT INTO people (name, email, department_id) VALUES
    ('김민수', NULL, (SELECT id FROM departments WHERE name = 'AX추진실')),
    ('이지은', NULL, (SELECT id FROM departments WHERE name = 'AX추진실')),
    ('박서준', NULL, (SELECT id FROM departments WHERE name = 'AX추진실')),
    ('최유리', NULL, (SELECT id FROM departments WHERE name = 'AX추진실')),
    ('정태호', NULL, (SELECT id FROM departments WHERE name = 'AX추진실')),
    ('한소희', NULL, (SELECT id FROM departments WHERE name = 'AX추진실'));

  -- ── 과제 12건 ──
  INSERT INTO projects
    (name, description, mprs, headquarter_id, lifecycle, start_date, end_date, total_budget, fte, health, progress_pct)
  VALUES
    ('스마트팩토리 비전검사 고도화', '비전 AI 기반 외관검사 정확도 향상', 'production',
      (SELECT id FROM headquarters WHERE name='L HOUSE 공장'), 'in_progress', '2025-09-01', '2026-08-31', 1200000000, 4.0, 'red', 65),
    ('마케팅 카피 생성 LLM 파일럿', 'LLM으로 캠페인 카피 자동 생성', 'marketing',
      (SELECT id FROM headquarters WHERE name='MBD본부'), 'in_progress', '2026-01-05', '2026-06-30', 300000000, 1.5, 'green', 40),
    ('신약 후보물질 스크리닝 AI', '후보물질 우선순위 예측 모델', 'research',
      (SELECT id FROM headquarters WHERE name='Bio연구본부'), 'under_review', '2026-03-01', '2027-02-28', 800000000, 2.0, 'yellow', 10),
    ('고객문의 자동응답 봇', '상담 1차 응대 자동화', 'support',
      (SELECT id FROM headquarters WHERE name='경영지원본부'), 'in_progress', '2025-11-01', '2026-05-31', 250000000, 1.0, 'yellow', 55),
    ('수요예측 시계열 모델', '월간 수요 예측 정확도 개선', 'production',
      (SELECT id FROM headquarters WHERE name='개발본부'), 'completed', '2025-03-01', '2025-12-31', 600000000, 2.0, 'green', 100),
    ('품질 이상탐지 대시보드', '공정 데이터 이상 실시간 탐지', 'production',
      (SELECT id FROM headquarters WHERE name='Quality본부'), 'in_progress', '2025-10-15', '2026-07-31', 400000000, 1.5, 'green', 70),
    ('사내 지식검색 RAG', '사내 문서 RAG 검색 시스템', 'support',
      (SELECT id FROM headquarters WHERE name='개발본부'), 'in_progress', '2026-02-01', '2026-09-30', 500000000, 2.5, 'red', 30),
    ('영업 리드 추천 엔진', '잠재 고객 스코어링·추천', 'marketing',
      (SELECT id FROM headquarters WHERE name='MBD본부'), 'not_started', '2026-07-01', '2026-12-31', 300000000, 1.0, 'green', 0),
    ('연구문헌 요약 어시스턴트', '논문 요약·핵심 추출', 'research',
      (SELECT id FROM headquarters WHERE name='Bio연구본부'), 'in_progress', '2025-12-01', '2026-06-30', 450000000, 1.5, 'green', 45),
    ('생산라인 예지보전', '설비 고장 예측·정비 최적화', 'production',
      (SELECT id FROM headquarters WHERE name='L HOUSE 공장'), 'under_review', '2026-04-01', '2027-03-31', 700000000, 2.0, 'yellow', 15),
    ('HR 문서 자동분류', '인사 문서 태깅·분류 자동화', 'support',
      (SELECT id FROM headquarters WHERE name='경영지원본부'), 'completed', '2025-05-01', '2025-11-30', 150000000, 0.5, 'green', 100),
    ('마케팅 성과 분석 대시보드', '캠페인 성과 통합 분석', 'marketing',
      (SELECT id FROM headquarters WHERE name='MBD본부'), 'in_progress', '2025-08-01', '2026-04-30', 200000000, 1.0, 'green', 60);

  -- ── 공동 PM (project_pms) ──
  INSERT INTO project_pms (project_id, person_id)
  SELECT p.id, pe.id FROM projects p, people pe
  WHERE (p.name='스마트팩토리 비전검사 고도화' AND pe.name IN ('김민수','정태호'))
     OR (p.name='마케팅 카피 생성 LLM 파일럿' AND pe.name IN ('이지은'))
     OR (p.name='신약 후보물질 스크리닝 AI' AND pe.name IN ('박서준','한소희'))
     OR (p.name='고객문의 자동응답 봇' AND pe.name IN ('최유리'))
     OR (p.name='수요예측 시계열 모델' AND pe.name IN ('정태호'))
     OR (p.name='품질 이상탐지 대시보드' AND pe.name IN ('김민수'))
     OR (p.name='사내 지식검색 RAG' AND pe.name IN ('이지은','박서준'))
     OR (p.name='영업 리드 추천 엔진' AND pe.name IN ('이지은'))
     OR (p.name='연구문헌 요약 어시스턴트' AND pe.name IN ('한소희'))
     OR (p.name='생산라인 예지보전' AND pe.name IN ('정태호'))
     OR (p.name='HR 문서 자동분류' AND pe.name IN ('최유리'))
     OR (p.name='마케팅 성과 분석 대시보드' AND pe.name IN ('이지은'));

  -- ── 유관부서 (project_stakeholders) ──
  INSERT INTO project_stakeholders (project_id, department_id, person_id)
  SELECT p.id, (SELECT id FROM departments WHERE name='AX추진실'), NULL
  FROM projects p
  WHERE p.name IN ('사내 지식검색 RAG','품질 이상탐지 대시보드','고객문의 자동응답 봇');

  -- ── AI기술 매핑 (project_ai_techs) ──
  INSERT INTO project_ai_techs (project_id, ai_tech_id)
  SELECT p.id, t.id FROM projects p, ai_techs t
  WHERE (p.name='스마트팩토리 비전검사 고도화' AND t.name='Vision')
     OR (p.name='마케팅 카피 생성 LLM 파일럿' AND t.name='LLM')
     OR (p.name='신약 후보물질 스크리닝 AI' AND t.name IN ('시계열'))
     OR (p.name='고객문의 자동응답 봇' AND t.name IN ('LLM','NLP'))
     OR (p.name='수요예측 시계열 모델' AND t.name='시계열')
     OR (p.name='사내 지식검색 RAG' AND t.name='RAG')
     OR (p.name='영업 리드 추천 엔진' AND t.name='추천')
     OR (p.name='연구문헌 요약 어시스턴트' AND t.name IN ('LLM','RAG'))
     OR (p.name='마케팅 성과 분석 대시보드' AND t.name='추천');

  -- ── 월별 집행 (project_budget_monthly) ──
  INSERT INTO project_budget_monthly (project_id, year_month, amount)
  SELECT p.id, m.ym, m.amt FROM projects p
  JOIN (VALUES
    ('스마트팩토리 비전검사 고도화','2026-01',200000000::numeric),
    ('스마트팩토리 비전검사 고도화','2026-02',180000000),
    ('스마트팩토리 비전검사 고도화','2026-03',220000000),
    ('마케팅 카피 생성 LLM 파일럿','2026-02',60000000),
    ('마케팅 카피 생성 LLM 파일럿','2026-03',55000000),
    ('고객문의 자동응답 봇','2026-01',50000000),
    ('고객문의 자동응답 봇','2026-02',60000000),
    ('수요예측 시계열 모델','2025-10',300000000),
    ('수요예측 시계열 모델','2025-11',300000000),
    ('품질 이상탐지 대시보드','2026-02',120000000),
    ('품질 이상탐지 대시보드','2026-03',100000000),
    ('사내 지식검색 RAG','2026-03',90000000),
    ('연구문헌 요약 어시스턴트','2026-02',110000000),
    ('HR 문서 자동분류','2025-08',150000000),
    ('마케팅 성과 분석 대시보드','2026-01',80000000),
    ('마케팅 성과 분석 대시보드','2026-02',70000000)
  ) AS m(name, ym, amt) ON m.name = p.name;

  -- ── 업데이트 로그 (project_updates) — 일부는 금주(CURRENT_DATE)로 ──
  INSERT INTO project_updates (project_id, update_date, content, source)
  SELECT p.id, u.d, u.c, 'manual'::update_source FROM projects p
  JOIN (VALUES
    ('스마트팩토리 비전검사 고도화', CURRENT_DATE, '검출 모델 재학습 완료, 오탐률 12%→7%'),
    ('스마트팩토리 비전검사 고도화', CURRENT_DATE - 14, '라벨링 데이터 5천건 추가 확보'),
    ('마케팅 카피 생성 LLM 파일럿', CURRENT_DATE - 1, '프롬프트 A/B 테스트 착수'),
    ('고객문의 자동응답 봇', CURRENT_DATE - 2, 'FAQ 인텐트 30종 분류기 적용'),
    ('품질 이상탐지 대시보드', CURRENT_DATE - 3, '실시간 알림 임계치 튜닝'),
    ('사내 지식검색 RAG', CURRENT_DATE - 20, '임베딩 파이프라인 1차 구축'),
    ('연구문헌 요약 어시스턴트', CURRENT_DATE - 5, '요약 품질 평가셋 구성'),
    ('수요예측 시계열 모델', CURRENT_DATE - 60, '최종 검수 및 운영 이관 완료'),
    ('마케팅 성과 분석 대시보드', CURRENT_DATE - 4, '채널별 ROAS 위젯 추가')
  ) AS u(name, d, c) ON u.name = p.name;

  RAISE NOTICE '샘플 시드 완료: 과제 12건';
END $$;
