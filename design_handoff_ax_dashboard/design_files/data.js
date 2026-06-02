/* ============================================================
   AX 과제 대시보드 — 공용 데이터 & 디자인 토큰
   실제 시드(supabase/migrations/012)에서 추출한 과제 12건.
   금액은 억 단위(budget/executed), 진행률은 %.
   기준일: 2026-06-02 (화)
   ============================================================ */
(function () {
  // ── 디자인 토큰 ──────────────────────────────────────────
  const MPRS = {
    marketing:  { label: "Marketing",  letter: "M", main: "#1D9E75", bg: "#E2F4EC", text: "#085041" },
    production: { label: "Production", letter: "P", main: "#534AB7", bg: "#ECEAFA", text: "#3C3489" },
    research:   { label: "Research",   letter: "R", main: "#D4537E", bg: "#FBE6EE", text: "#72243E" },
    support:    { label: "Support",    letter: "S", main: "#D85A30", bg: "#FBE9E0", text: "#712B13" },
  };
  const HEALTH = {
    green:  { label: "정상", color: "#16A34A", soft: "#DCFCE7" },
    yellow: { label: "주의", color: "#E0A106", soft: "#FEF3C7" },
    red:    { label: "위험", color: "#DC2626", soft: "#FEE2E2" },
  };
  const LIFECYCLE = {
    not_started:  "진행 전",
    under_review: "검토 중",
    in_progress:  "진행 중",
    completed:    "완료",
  };

  // ── 과제 12건 ───────────────────────────────────────────
  const P = [
    { id: "p1",  name: "스마트팩토리 비전검사 고도화", mprs: "production", hq: "L HOUSE 공장",   life: "in_progress",  start: "2025-09", end: "2026-08", budget: 12,   exec: 6.0,  fte: 4.0, health: "red",    prog: 65,  pms: ["김민수", "정태호"], dept: "AX추진실", tech: ["Vision"],      upd: "오늘",   updDays: 0 },
    { id: "p2",  name: "마케팅 카피 생성 LLM 파일럿",  mprs: "marketing",  hq: "MBD본부",       life: "in_progress",  start: "2026-01", end: "2026-06", budget: 3,    exec: 1.15, fte: 1.5, health: "green",  prog: 40,  pms: ["이지은"],          dept: "AX추진실", tech: ["LLM"],         upd: "어제",   updDays: 1 },
    { id: "p3",  name: "신약 후보물질 스크리닝 AI",    mprs: "research",   hq: "Bio연구본부",   life: "under_review", start: "2026-03", end: "2027-02", budget: 8,    exec: 0,    fte: 2.0, health: "yellow", prog: 10,  pms: ["박서준", "한소희"], dept: "AX추진실", tech: ["시계열"],      upd: "업데이트 없음", updDays: 999 },
    { id: "p4",  name: "고객문의 자동응답 봇",         mprs: "support",    hq: "경영지원본부", life: "in_progress",  start: "2025-11", end: "2026-05", budget: 2.5,  exec: 1.1,  fte: 1.0, health: "yellow", prog: 55,  pms: ["최유리"],          dept: "AX추진실", tech: ["LLM", "NLP"],  upd: "2일 전", updDays: 2 },
    { id: "p5",  name: "수요예측 시계열 모델",         mprs: "production", hq: "개발본부",      life: "completed",    start: "2025-03", end: "2025-12", budget: 6,    exec: 6.0,  fte: 2.0, health: "green",  prog: 100, pms: ["정태호"],          dept: "AX추진실", tech: ["시계열"],      upd: "2025.12", updDays: 153 },
    { id: "p6",  name: "품질 이상탐지 대시보드",       mprs: "production", hq: "Quality본부",   life: "in_progress",  start: "2025-10", end: "2026-07", budget: 4,    exec: 2.2,  fte: 1.5, health: "green",  prog: 70,  pms: ["김민수"],          dept: "AX추진실", tech: [],              upd: "3일 전", updDays: 3 },
    { id: "p7",  name: "사내 지식검색 RAG",            mprs: "support",    hq: "개발본부",      life: "in_progress",  start: "2026-02", end: "2026-09", budget: 5,    exec: 0.9,  fte: 2.5, health: "red",    prog: 30,  pms: ["이지은", "박서준"], dept: "AX추진실", tech: ["RAG"],         upd: "3주 전", updDays: 20 },
    { id: "p8",  name: "영업 리드 추천 엔진",          mprs: "marketing",  hq: "MBD본부",       life: "not_started",  start: "2026-07", end: "2026-12", budget: 3,    exec: 0,    fte: 1.0, health: "green",  prog: 0,   pms: ["이지은"],          dept: "AX추진실", tech: ["추천"],        upd: "업데이트 없음", updDays: 999 },
    { id: "p9",  name: "연구문헌 요약 어시스턴트",     mprs: "research",   hq: "Bio연구본부",   life: "in_progress",  start: "2025-12", end: "2026-06", budget: 4.5,  exec: 1.1,  fte: 1.5, health: "green",  prog: 45,  pms: ["한소희"],          dept: "AX추진실", tech: ["LLM", "RAG"],  upd: "5일 전", updDays: 5 },
    { id: "p10", name: "생산라인 예지보전",            mprs: "production", hq: "L HOUSE 공장",   life: "under_review", start: "2026-04", end: "2027-03", budget: 7,    exec: 0,    fte: 2.0, health: "yellow", prog: 15,  pms: ["정태호"],          dept: "AX추진실", tech: [],              upd: "업데이트 없음", updDays: 999 },
    { id: "p11", name: "HR 문서 자동분류",             mprs: "support",    hq: "경영지원본부", life: "completed",    start: "2025-05", end: "2025-11", budget: 1.5,  exec: 1.5,  fte: 0.5, health: "green",  prog: 100, pms: ["최유리"],          dept: "AX추진실", tech: [],              upd: "2025.11", updDays: 184 },
    { id: "p12", name: "마케팅 성과 분석 대시보드",    mprs: "marketing",  hq: "MBD본부",       life: "in_progress",  start: "2025-08", end: "2026-04", budget: 2,    exec: 1.5,  fte: 1.0, health: "green",  prog: 60,  pms: ["이지은"],          dept: "AX추진실", tech: ["추천"],        upd: "4일 전", updDays: 4 },
  ];

  // ── KPI 집계 ────────────────────────────────────────────
  const HQ_ORDER = ["MBD본부", "Bio연구본부", "개발본부", "L HOUSE 공장", "Quality본부", "경영지원본부"];
  const MPRS_ORDER = ["marketing", "production", "research", "support"];
  const LIFE_ORDER = ["not_started", "under_review", "in_progress", "completed"];
  const HEALTH_ORDER = ["red", "yellow", "green"];

  const count = (arr, fn) => arr.filter(fn).length;
  const sum = (arr, fn) => arr.reduce((a, x) => a + fn(x), 0);

  const KPI = {
    total: P.length,
    lifecycle: LIFE_ORDER.map((k) => ({ key: k, label: LIFECYCLE[k], count: count(P, (p) => p.life === k) })),
    health: HEALTH_ORDER.map((k) => ({ key: k, label: HEALTH[k].label, color: HEALTH[k].color, count: count(P, (p) => p.health === k) })),
    thisWeek: count(P, (p) => p.updDays <= 1),
    byHq: HQ_ORDER.map((h) => ({ name: h, count: count(P, (p) => p.hq === h) })),
    avgProgress: Math.round(sum(P, (p) => p.prog) / P.length),
    completed: count(P, (p) => p.life === "completed"),
    inProgress: count(P, (p) => p.life === "in_progress"),
    budgetTotal: { budget: sum(P, (p) => p.budget), exec: sum(P, (p) => p.exec) },
    budgetByMprs: MPRS_ORDER.map((k) => ({
      key: k, budget: sum(P.filter((p) => p.mprs === k), (p) => p.budget),
      exec: sum(P.filter((p) => p.mprs === k), (p) => p.exec),
    })),
    atRisk: P.filter((p) => p.health !== "green").sort((a, b) => (a.health === "red" ? -1 : 1)),
  };
  KPI.budgetRate = Math.round((KPI.budgetTotal.exec / KPI.budgetTotal.budget) * 100);

  // 월별 집행 추이 (억)
  const MONTHLY = [
    { ym: "25.08", v: 1.5 }, { ym: "25.09", v: 0 }, { ym: "25.10", v: 3.0 },
    { ym: "25.11", v: 3.0 }, { ym: "25.12", v: 0 }, { ym: "26.01", v: 3.3 },
    { ym: "26.02", v: 6.0 }, { ym: "26.03", v: 4.65 },
  ];

  // 디폴트 정렬: 진행중 → 검토중 → 진행전 → 완료, 그 안에서 시작일 오래된 순
  const LIFE_RANK = { in_progress: 1, under_review: 2, not_started: 3, completed: 4 };
  const sorted = [...P].sort((a, b) => (LIFE_RANK[a.life] - LIFE_RANK[b.life]) || (a.start < b.start ? -1 : 1));

  // ── 성과(운영 효과지표) ─────────────────────────────────
  // 완료/운영 적용된 과제가 실제 운영되며 만들어낸 효과. pilot=초기 효과(부분 운영).
  // 절감비용(saveCostEok)=연간 억, 절감시간(saveHours)=시간/월.
  const EFFECTS = [
    { id: "p5",  applied: "2026.01", pilot: false, saveCostEok: 4.2, saveHours: 1200,
      note: "안전재고 최적화로 재고비용 절감 · 예측 정확도 향상",
      metrics: [{ k: "won", label: "연간 절감비용", value: "4.2억" }, { k: "time", label: "업무시간 절감", value: "1,200시간/월" }, { k: "target", label: "예측 정확도", value: "+18%p" }] },
    { id: "p11", applied: "2025.12", pilot: false, saveCostEok: 0.6, saveHours: 320,
      note: "인사 문서 태깅·분류 자동화로 수작업 제거",
      metrics: [{ k: "time", label: "문서처리 시간 절감", value: "320시간/월" }, { k: "won", label: "연간 절감비용", value: "0.6억" }, { k: "target", label: "분류 정확도", value: "96%" }] },
    { id: "p12", applied: "2026.02", pilot: true, saveCostEok: 0.4, saveHours: 45,
      note: "채널별 캠페인 성과 자동 집계 · 리포트 자동화",
      metrics: [{ k: "time", label: "리포트 작성 시간 절감", value: "45시간/월" }, { k: "target", label: "캠페인 ROAS 개선", value: "+12%" }] },
    { id: "p4",  applied: "2026.03", pilot: true, saveCostEok: 0.9, saveHours: 210,
      note: "FAQ 30종 1차 응대 자동화로 상담 부하 감소",
      metrics: [{ k: "target", label: "1차 응대 자동화율", value: "38%" }, { k: "time", label: "상담 처리시간 절감", value: "210시간/월" }, { k: "won", label: "연간 절감비용", value: "0.9억" }] },
  ];
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  const PERF = {
    appliedCount: EFFECTS.length,
    operatingCount: EFFECTS.filter((e) => !e.pilot).length,
    pilotCount: EFFECTS.filter((e) => e.pilot).length,
    totalSaveCost: EFFECTS.reduce((a, e) => a + e.saveCostEok, 0),     // 억/년
    totalSaveHours: EFFECTS.reduce((a, e) => a + e.saveHours, 0),       // 시간/월
    items: EFFECTS.map((e) => ({ ...e, project: byId[e.id] })),
  };
  PERF.investApplied = PERF.items.reduce((a, e) => a + (e.project.budget || 0), 0); // 관련 투자비(억)

  // ── 투자비(CAPEX) 항목 ──────────────────────────────────
  // plan/exec 합계는 전체 예산(58.5)·집행(21.45)과 일치.
  const CAPEX = [
    { cat: "GPU·AI 인프라",      plan: 18.0, exec: 9.0 },
    { cat: "외부 용역·컨설팅",   plan: 14.0, exec: 3.6 },
    { cat: "SW·라이선스",        plan: 8.5,  exec: 3.2 },
    { cat: "클라우드 운영",      plan: 7.0,  exec: 3.8 },
    { cat: "데이터 구축·라벨링", plan: 6.0,  exec: 1.4 },
    { cat: "기타",               plan: 5.0,  exec: 0.45 },
  ];
  const CAPEX_TOTAL = { plan: CAPEX.reduce((a, c) => a + c.plan, 0), exec: CAPEX.reduce((a, c) => a + c.exec, 0) };
  CAPEX_TOTAL.rate = Math.round((CAPEX_TOTAL.exec / CAPEX_TOTAL.plan) * 100);

  // ── 과제 업데이트 타임라인 (시드 기반 + Atlassian 동기화 혼합) ──
  const UPDATES = {
    p1: [
      { date: "오늘", src: "atlassian", role: "주간보고", content: "Confluence 주간 리포트 동기화 — 비전검사 PoC 결과 정리" },
      { date: "오늘", src: "manual", content: "검출 모델 재학습 완료, 오탐률 12% → 7%로 개선" },
      { date: "2주 전", src: "manual", content: "라벨링 데이터 5천 건 추가 확보, 클래스 불균형 보정" },
    ],
    p2: [{ date: "어제", src: "manual", content: "프롬프트 A/B 테스트 착수 — 톤·길이 2x2 조합 비교" }],
    p4: [
      { date: "2일 전", src: "manual", content: "FAQ 인텐트 30종 분류기 적용, 1차 응대 자동화 가동" },
      { date: "3주 전", src: "atlassian", role: "회의록", content: "Confluence: 상담팀 인텐트 정의 워크숍 회의록" },
    ],
    p5: [{ date: "2025.12", src: "manual", content: "최종 검수 및 운영 이관 완료 — 안전재고 로직 반영" }],
    p6: [{ date: "3일 전", src: "manual", content: "실시간 알림 임계치 튜닝, 오탐 알림 30% 감소" }],
    p7: [
      { date: "3주 전", src: "manual", content: "임베딩 파이프라인 1차 구축 — 사내 문서 8만 건 인덱싱" },
      { date: "5주 전", src: "atlassian", role: "기술문서", content: "Confluence: RAG 아키텍처 설계 문서 연결" },
    ],
    p9: [{ date: "5일 전", src: "manual", content: "요약 품질 평가셋 구성, 휴먼 평가 루브릭 확정" }],
    p11: [{ date: "2025.11", src: "manual", content: "운영 이관 완료 — 인사 문서 자동 태깅 정식 적용" }],
    p12: [{ date: "4일 전", src: "manual", content: "채널별 ROAS 위젯 추가, 대시보드 v2 배포" }],
  };

  // ── 마스터 (본부 / 부서 / 사람 / AI기술) ────────────────
  const HQS = HQ_ORDER.map((name, i) => ({ id: "hq" + i, name }));
  const DEPTS = [
    { id: "d0", name: "AX추진실", hqId: null },
    { id: "d1", name: "데이터분석팀", hqId: "hq2" },
    { id: "d2", name: "품질관리팀", hqId: "hq4" },
    { id: "d3", name: "생산기술팀", hqId: "hq3" },
    { id: "d4", name: "디지털마케팅팀", hqId: "hq0" },
    { id: "d5", name: "인사팀", hqId: "hq5" },
  ];
  const PEOPLE = [
    { id: "pe1", name: "김민수", email: "minsu.kim@skbs.com", deptId: "d0" },
    { id: "pe2", name: "이지은", email: "jieun.lee@skbs.com", deptId: "d0" },
    { id: "pe3", name: "박서준", email: "seojun.park@skbs.com", deptId: "d0" },
    { id: "pe4", name: "최유리", email: "yuri.choi@skbs.com", deptId: "d0" },
    { id: "pe5", name: "정태호", email: "taeho.jung@skbs.com", deptId: "d0" },
    { id: "pe6", name: "한소희", email: "sohee.han@skbs.com", deptId: "d0" },
  ];
  const AITECHS = ["LLM", "RAG", "Vision", "시계열", "추천", "NLP"].map((n, i) => ({ id: "t" + i, name: n }));
  const MASTERS = { HQS, DEPTS, PEOPLE, AITECHS };

  window.AX = { MPRS, HEALTH, LIFECYCLE, P, sorted, KPI, MONTHLY, HQ_ORDER, MPRS_ORDER, LIFE_ORDER, HEALTH_ORDER,
    EFFECTS, PERF, CAPEX, CAPEX_TOTAL, UPDATES, MASTERS,
    fmtEok: (v) => (v === 0 ? "-" : Number.isInteger(v) ? `${v}억` : `${v.toFixed(1)}억`) };
})();
