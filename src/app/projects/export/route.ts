import ExcelJS from "exceljs";

import { fetchProjectList, fetchHeadquarters } from "@/lib/repositories/projects";
import { parseFilter, applyFilter, sortProjectList } from "@/lib/domain/dashboard";
import { parseSort, parseDir } from "@/components/dashboard/url";
import { MPRS_LABEL } from "@/lib/domain/mprs";
import { LIFECYCLE_LABEL, HEALTH_LABEL } from "@/lib/domain/lifecycle";
import { formatYearMonth } from "@/lib/domain/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 과제현황 엑셀(.xlsx) 내보내기.
 * 화면과 동일한 필터·정렬 로직(parseFilter→applyFilter→sortProjectList)을 재현해
 * "현재 보여지는 그대로"의 목록을 출력한다. (진행상태는 표시용 파생값 그대로)
 */
export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams);

  const [projects, headquarters] = await Promise.all([
    fetchProjectList(),
    fetchHeadquarters(),
  ]);

  const filter = parseFilter(sp);
  const hqRank = new Map(headquarters.map((h, i) => [h.id, i]));
  const items = sortProjectList(
    applyFilter(projects, filter),
    parseSort(sp.sort),
    parseDir(sp.dir),
    hqRank,
  );

  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  const ws = wb.addWorksheet("과제현황");

  ws.columns = [
    { header: "순번", key: "idx", width: 6 },
    { header: "MPRS", key: "mprs", width: 12 },
    { header: "본부", key: "hq", width: 16 },
    { header: "과제명", key: "name", width: 40 },
    { header: "PM", key: "pm", width: 18 },
    { header: "AI기술", key: "ai", width: 20 },
    { header: "과제현황", key: "lifecycle", width: 10 },
    { header: "진행상태", key: "health", width: 10 },
    { header: "시작일", key: "start", width: 12 },
    { header: "종료일", key: "end", width: 12 },
  ];

  items.forEach((it, i) => {
    ws.addRow({
      idx: i + 1,
      mprs: MPRS_LABEL[it.mprs],
      hq: it.headquarter_name,
      name: it.name,
      pm: it.pms.map((p) => p.name).join(", "),
      ai: it.ai_techs.join(", "),
      lifecycle: LIFECYCLE_LABEL[it.lifecycle],
      health: HEALTH_LABEL[it.health],
      start: formatYearMonth(it.start_date),
      end: formatYearMonth(it.end_date),
    });
  });

  // 헤더 행 스타일
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "center" };

  const buffer = await wb.xlsx.writeBuffer();

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const filename = `과제현황_${stamp}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="project-status-${stamp}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
