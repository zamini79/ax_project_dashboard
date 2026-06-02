/* 성과 현황 페이지 — 완료·운영 적용된 과제의 실제 운영 효과 */

function PerformancePage({ onOpenProject }) {
  const { PERF, MPRS, HEALTH, LIFECYCLE, fmtEok } = window.AX;
  const metricColor = { won: "#16A34A", time: T.accent, target: "#0EA5E9" };
  const recoverPct = Math.round((PERF.totalSaveCost / PERF.investApplied) * 100);

  const Metric = ({ m }) => (
    <div style={{ flex: 1, minWidth: 0, background: "#FAFAFB", border: `1px solid ${T.line}`, borderRadius: 11, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: metricColor[m.k], marginBottom: 7 }}>
        <Icon name={m.k} size={15} /><span style={{ fontSize: 10.5, color: T.sub, fontWeight: 600 }}>{m.label}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>성과 현황</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>완료·운영 적용된 과제가 실제 운영되며 만들어낸 효과 (운영 {PERF.operatingCount} · 파일럿 {PERF.pilotCount})</div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Card><Stat label="운영 적용 과제" value={PERF.appliedCount} unit="건" sub={`운영 ${PERF.operatingCount} · 파일럿 ${PERF.pilotCount}`} /></Card>
        <Card><Stat label="연간 절감비용 (환산)" value={fmtEok(PERF.totalSaveCost)} accent="#16A34A" sub="확정·추정 합산" /></Card>
        <Card><Stat label="월 업무시간 절감" value={PERF.totalSaveHours.toLocaleString()} unit="시간" accent={T.accent} sub="반복 업무 자동화 기준" /></Card>
        <Card>
          <Stat label="연간 효과 / 관련 투자" value={`${recoverPct}%`} sub={`연 ${fmtEok(PERF.totalSaveCost)} 효과 / ${fmtEok(PERF.investApplied)} 투자`} />
          <div style={{ marginTop: 10 }}><Bar value={Math.min(100, recoverPct)} color="#16A34A" h={6} /></div>
        </Card>
      </div>

      {/* 효과 카드 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>과제별 운영 효과</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {PERF.items.map((e) => {
            const p = e.project;
            return (
              <Card key={e.id} pad={18} onClick={() => onOpenProject(e.id)} hover>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <MprsBadge mprs={p.mprs} size={22} />
                  <span style={{ fontSize: 14.5, fontWeight: 700, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                    background: e.pilot ? "#FEF3C7" : "#DCFCE7", color: e.pilot ? "#92660A" : "#0E7A4E" }}>
                    {e.pilot ? "파일럿 운영" : "운영 적용"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="building" size={13} />{p.hq}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="calendar" size={13} />{e.applied} 적용</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="user" size={13} />{p.pms.join(", ")}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {e.metrics.map((m, i) => <Metric key={i} m={m} />)}
                </div>
                <div style={{ fontSize: 12, color: "#454A53", lineHeight: 1.5, display: "flex", gap: 7 }}>
                  <Icon name="sparkle" size={14} style={{ color: "#16A34A", flexShrink: 0, marginTop: 1 }} />{e.note}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 효과 환산 요약 + 안내 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <Card>
          <PanelHead title="과제별 연간 절감비용 (환산)" right="단위: 억" />
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[...PERF.items].sort((a, b) => b.saveCostEok - a.saveCostEok).map((e) => {
              const max = Math.max(...PERF.items.map((x) => x.saveCostEok));
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 150, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.project.name}</span>
                  <div style={{ flex: 1 }}><Bar value={(e.saveCostEok / max) * 100} color={MPRS[e.project.mprs].main} h={10} /></div>
                  <span style={{ width: 46, textAlign: "right", fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtEok(e.saveCostEok)}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card style={{ background: "#FAFAFB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="target" size={17} style={{ color: T.accent }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>정량 효과지표 확장 예정</span>
          </div>
          <p style={{ fontSize: 12.5, color: T.sub, lineHeight: 1.7, margin: 0 }}>
            현재는 운영 부서가 보고한 <b style={{ color: T.ink }}>절감 시간·비용·정확도</b> 중심으로 집계합니다.
            향후 ROI·도입 효과·만족도 등 정량 지표를 데이터 모델에 추가해
            과제 단위로 자동 추적하도록 고도화할 예정입니다.
          </p>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}`, display: "flex", flexDirection: "column", gap: 9 }}>
            {[["측정 지표", "절감시간 · 절감비용 · 정확도"], ["집계 주기", "월간 (운영 부서 보고)"], ["검증", "재무·현업 교차 확인"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.sub }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
Object.assign(window, { PerformancePage });
