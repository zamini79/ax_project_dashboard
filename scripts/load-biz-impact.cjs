/* 엑셀 → Supabase Biz Impact 적재 (일회성 도구, service role) */
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const dir = "/Users/zamini/Downloads/download (2)";
const AS_OF = "2026-07-25";

const WEEKLY = [
  { file: "Deep Research Biz Impact_20260725.xlsx", project: "AI기반 Deep Research", unit: 23.5 },
  { file: "Open call Biz Impact_20260725.xlsx", project: "Open call Funding 정보 수집", unit: 33.4 },
  { file: "Intelli RA Biz Impact_20260725.xlsx", project: "Intelli RA", unit: 59.8 },
  { file: "Intelli RQA Biz Impace _20260725.xlsx", project: "Intelli RQA", unit: 5.05 },
];

const num = (c) => {
  const v = c?.value;
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v.result != null) return Number(v.result);
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};
const txt = (c) => {
  const v = c?.value;
  if (v == null) return "";
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((r) => r.text).join("");
    if (v.text != null) return String(v.text);
  }
  return String(v).replace(/\s+/g, " ").trim();
};
function basisLines(ws) {
  const out = [];
  if (!ws) return out;
  ws.eachRow({ includeEmpty: false }, (row) => {
    const t = txt(row.getCell(1));
    if (t) out.push(t.replace(/^■\s*/, "").replace(/^-\s*/, "· "));
  });
  return out;
}

async function upsertImpact(projectName, unit, basis, file) {
  const { data: proj, error: pe } = await sb
    .from("projects").select("id").eq("name", projectName).single();
  if (pe || !proj) throw new Error(`과제 없음: ${projectName} ${pe?.message ?? ""}`);
  const { data, error } = await sb
    .from("project_biz_impacts")
    .upsert(
      {
        project_id: proj.id,
        unit_label: "API Call",
        unit_value_manwon: unit,
        basis,
        source_file: file,
        as_of: AS_OF,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`impact upsert 실패(${projectName}): ${error.message}`);
  return data.id;
}

(async () => {
  const report = [];

  for (const spec of WEEKLY) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(dir, spec.file));
    const data = wb.getWorksheet("Data");
    const basis = basisLines(wb.getWorksheet("Sheet1"));

    let curYear = null;
    const pts = [];
    data.eachRow({ includeEmpty: false }, (row, rn) => {
      if (rn <= 2) return;
      const y = num(row.getCell(1));
      if (y != null) curYear = y;
      const w = num(row.getCell(2));
      if (curYear == null || w == null) return;
      pts.push({
        period_kind: "week",
        year: curYear,
        period_no: w,
        call_count: num(row.getCell(3)) ?? 0,
        impact_manwon: num(row.getCell(4)) ?? 0,
      });
    });
    pts.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.period_no - b.period_no));

    const impactId = await upsertImpact(spec.project, spec.unit, basis, spec.file);
    const { error } = await sb
      .from("project_biz_impact_points")
      .upsert(pts.map((p) => ({ ...p, impact_id: impactId })), {
        onConflict: "impact_id,period_kind,year,period_no",
      });
    if (error) throw new Error(`points upsert 실패(${spec.project}): ${error.message}`);

    const calls = pts.reduce((s, p) => s + p.call_count, 0);
    const impact = pts.reduce((s, p) => s + p.impact_manwon, 0);
    report.push(
      `${spec.project}: ${pts.length}주 · Call ${calls} · 누계 ${Math.round(impact * 10) / 10}만원 · 기준 ${basis.length}줄`,
    );
  }

  // JSA — 월별, 추천 유형별 breakdown, 단가 미정
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(dir, "JSA 월별 API Call  (SKBS).xlsx"));
  const ws = wb.getWorksheet("Data");
  const headers = [];
  ws.getRow(3).eachCell({ includeEmpty: false }, (c, cn) => {
    if (cn >= 2) headers.push({ cn, name: txt(c) });
  });
  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, rn) => {
    if (rn <= 3) return;
    const m = txt(row.getCell(1)).match(/^(\d{2})\/(\d{4})$/);
    if (!m) return;
    const bd = {};
    let total = 0;
    for (const h of headers) {
      const v = num(row.getCell(h.cn)) ?? 0;
      bd[h.name] = v;
      total += v;
    }
    rows.push({
      period_kind: "month",
      year: Number(m[2]),
      period_no: Number(m[1]),
      call_count: total,
      impact_manwon: 0,
      breakdown: bd,
    });
  });
  rows.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.period_no - b.period_no));

  const jsaBasis = [
    "원본에 Biz Impact 산정식 없음 — 월별 API Call 수(추천 유형별)만 제공",
    "추천 유형: JSA문서 · 사고빈도 · 위험요인 · 재해유형 · 피해강도 · 현재조치사항",
    "1건당 절감액이 확정되면 사용량 × 단가로 자동 산출됩니다",
  ];
  const jsaId = await upsertImpact("JSA", null, jsaBasis, "JSA 월별 API Call  (SKBS).xlsx");
  const { error: je } = await sb
    .from("project_biz_impact_points")
    .upsert(rows.map((r) => ({ ...r, impact_id: jsaId })), {
      onConflict: "impact_id,period_kind,year,period_no",
    });
  if (je) throw new Error(`JSA points upsert 실패: ${je.message}`);
  report.push(
    `JSA: ${rows.length}개월 · Call ${rows.reduce((s, r) => s + r.call_count, 0)} · 단가 미정`,
  );

  console.log(report.join("\n"));
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
