/* 대시보드 페이지 — 벤토 워크스페이스 (메인) */

function DashboardPage({ onNav, onOpenProject }) {
  const { KPI, MPRS, HEALTH, PERF, MONTHLY, fmtEok } = window.AX;
  const budgetTotal = KPI.budgetByMprs.reduce((a, b) => a + b.budget, 0);

  const Tile = ({ area, dark, pad = 18, style, children, onClick }) => (
    <div className="bento-tile" onClick={onClick} style={{
      gridArea: area, background: dark ? T.navy : T.card, border: dark ? "none" : `1px solid ${T.line}`,
      borderRadius: 18, padding: pad, color: dark ? "#fff" : T.ink, overflow: "hidden", cursor: onClick ? "pointer" : "default",
      boxShadow: dark ? "0 8px 28px rgba(15,24,48,.22)" : "0 1px 2px rgba(16,24,40,.05)", ...style,
    }}>{children}</div>
  );
  const Cap = ({ light, children, action }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: light ? "rgba(255,255,255,.6)" : T.sub }}>{children}</span>
      {action}
    </div>
  );
  const More = ({ onClick }) => (
    <span onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ fontSize: 11, fontWeight: 600, color: T.accent, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2 }}>
      전체 보기 <Icon name="chevR" size={12} />
    </span>
  );

  return (
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "162px",
      gridTemplateAreas: '"hero hero donut week" "hero hero risk risk" "mprs mprs trend trend" "perf perf trend trend"' }}>

      {/* HERO */}
      <Tile area="hero" dark pad={24}>
        <Cap light>포트폴리오 현황 · 2026년 6월</Cap>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 8px", margin: "4px 0 18px" }}>
          {[{ l: "전체 과제", v: KPI.total, u: "건" }, { l: "진행 중", v: KPI.inProgress, u: "건" },
            { l: "평균 진행률", v: KPI.avgProgress, u: "%" }, { l: "투자비 집행률", v: KPI.budgetRate, u: "%" }].map((k, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginBottom: 6 }}>{k.l}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{k.v}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.7)" }}>{k.u}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 7 }}>진행 현황(헬스)</div>
        <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", marginBottom: 9 }}>
          {KPI.health.map((h) => <div key={h.key} style={{ width: `${(h.count / KPI.total) * 100}%`, background: h.color }} />)}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {KPI.health.map((h) => (
            <span key={h.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(255,255,255,.8)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: h.color }} />{h.label} <b style={{ color: "#fff" }}>{h.count}</b></span>
          ))}
        </div>
      </Tile>

      {/* 단계 도넛 */}
      <Tile area="donut" style={{ display: "flex", flexDirection: "column" }}>
        <Cap>과제 단계</Cap>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <Donut size={102} thickness={14} segments={KPI.lifecycle.map((l, i) => ({ value: l.count, color: ["#C7CBD3", "#E0A106", T.accent, "#16A34A"][i] }))}>
            <div style={{ fontSize: 23, fontWeight: 800 }}>{KPI.total}</div>
            <div style={{ fontSize: 9.5, color: T.sub }}>전체</div>
          </Donut>
        </div>
      </Tile>

      {/* 금주 업데이트 */}
      <Tile area="week" onClick={() => onNav("projects")} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Cap action={<Icon name="arrowR" size={15} style={{ color: T.faint }} />}>금주 업데이트</Cap>
        <div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: T.accent, fontVariantNumeric: "tabular-nums" }}>{KPI.thisWeek}</div>
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 8 }}>이번 주 갱신된 과제</div>
        </div>
      </Tile>

      {/* 위험·주의 피드 (클릭→상세) */}
      <Tile area="risk">
        <Cap action={<More onClick={() => onNav("projects")} />}>위험·주의 과제 · {KPI.atRisk.length}건</Cap>
        {KPI.atRisk.slice(0, 3).map((p, i) => (
          <div key={p.id} className="p-row" onClick={() => onOpenProject(p.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 6px", margin: "0 -6px", borderRadius: 8, borderTop: i === 0 ? "none" : `1px solid ${T.line}`, cursor: "pointer" }}>
            <HealthDot health={p.health} size={9} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            <span style={{ fontSize: 11, color: T.sub, whiteSpace: "nowrap" }}>{p.hq}</span>
            <div style={{ width: 44 }}><Bar value={p.prog} color={HEALTH[p.health].color} h={5} /></div>
            <span style={{ fontSize: 11.5, color: T.sub, width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.prog}%</span>
          </div>
        ))}
      </Tile>

      {/* MPRS 투자 배분 */}
      <Tile area="mprs" onClick={() => onNav("budget")}>
        <Cap action={<Icon name="arrowR" size={15} style={{ color: T.faint }} />}>MPRS 투자 배분 · 총 {fmtEok(budgetTotal)}</Cap>
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 12 }}>
          {KPI.budgetByMprs.map((b) => <div key={b.key} style={{ width: `${(b.budget / budgetTotal) * 100}%`, background: MPRS[b.key].main }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px" }}>
          {KPI.budgetByMprs.map((b) => (
            <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: MPRS[b.key].main }} />
              <span style={{ color: T.sub }}>{MPRS[b.key].label}</span>
              <b style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{fmtEok(b.budget)}</b>
            </div>
          ))}
        </div>
      </Tile>

      {/* 월별 추이 */}
      <Tile area="trend" style={{ display: "flex", flexDirection: "column" }}>
        <Cap>월별 집행 추이 · 단위 억</Cap>
        <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtEok(KPI.budgetTotal.exec)} <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>누적 집행</span></div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", marginTop: 10 }}>
          <MiniBars data={MONTHLY} height={146} barW={32} gap={14} color="#D3D8E0" accentLast={T.accent} />
        </div>
      </Tile>

      {/* 성과 하이라이트 (신규 섹션 연결) */}
      <Tile area="perf" dark={false} onClick={() => onNav("performance")} style={{ background: "linear-gradient(135deg,#16A34A 0%,#0E7A4E 100%)", border: "none", color: "#fff" }}>
        <Cap light action={<Icon name="arrowR" size={15} style={{ color: "rgba(255,255,255,.8)" }} />}>운영 성과 하이라이트</Cap>
        <div style={{ display: "flex", gap: 26, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmtEok(PERF.totalSaveCost)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", marginTop: 6 }}>연간 절감비용</div>
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{PERF.totalSaveHours.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", marginTop: 6 }}>월 업무시간 절감(시간)</div>
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{PERF.appliedCount}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", marginTop: 6 }}>운영 적용 과제</div>
          </div>
        </div>
      </Tile>
    </div>
  );
}
Object.assign(window, { DashboardPage });
