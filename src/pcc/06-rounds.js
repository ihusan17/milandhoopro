// Re-advertisement (re-Iulaan). When the bids are over the budget and the Bid Committee decides to
// advertise again, the project starts a new round: the finished round (Iulaan, bids, points,
// criteria, decision) is kept as history, the bids table is emptied and the project goes back to
// Iulaan with the new Iulaan number and dates.
const roundNo = p => (p.rounds || []).length + 1;

// Every responsive bid above the estimate?
function overBudget(p) {
  const est = p.estimate, R = (p.bidders || []).filter(b => b.responsive !== false && b.amount != null);
  if (est == null || !R.length) return null;
  const low = Math.min(...R.map(b => b.amount)), over = R.filter(b => b.amount > est).length;
  return { est, low, over, all: over === R.length, n: R.length, pct: ((low - est) / est) * 100 };
}

function overBudgetCard(p) {
  const ob = overBudget(p); if (!ob || !ob.over) return null;
  const ed = can("projects") && !p.__ro;
  return o("div", { class: "card pcc-ob" + (ob.all ? " all" : "") },
    o("div", { class: "pcc-ob-h" }, ob.all ? "⚠  All responsive bids are above the estimate" : `${ob.over} of ${ob.n} responsive bids are above the estimate`),
    o("div", { class: "pcc-ob-r" }, o("span", {}, "Estimate ", o("b", {}, mvr(ob.est))), o("span", {}, "Lowest responsive bid ", o("b", {}, mvr(ob.low))), ob.all ? o("span", { class: "pcc-ob-pct" }, `+${ob.pct.toFixed(1)}% (${mvr(ob.low - ob.est)} over)`) : null),
    ob.all && !p.__ro ? o("p", { class: "small" }, "If the Bid Committee decides to advertise again, record its decision as Re-tender in the Committee meetings, or start the new round here.") : null,
    ob.all && ed ? btn("Re-advertise (new round)…", () => retender(p), "small") : null);
}

// Banner when the Bid Committee has decided to re-advertise.
function retenderBanner(p) {
  const r = p.retender; if (!r) return null;
  return o("div", { class: "card pcc-rt" }, o("div", {}, o("b", {}, "Bid Committee decided to re-advertise"), o("div", { class: "small muted" }, o("bdi", { dir: "ltr" }, [r.ref, r.date ? fd(r.date) : ""].filter(Boolean).join(" · ")), r.note ? o("div", { dir: "auto" }, r.note) : null)),
    can("projects") ? btn("Start new round…", () => retender(p), "primary") : null);
}

async function retender(p) {
  const pend = p.retender || {}, n = roundNo(p);
  const why = DVT(pend.note || "ހުށަހެޅި އަގުތައް ލަފާކުރި އަގަށްވުރެ ބޮޑުވުމުން އަލުން އިޢުލާނުކުރުމަށް ނިންމުން");
  const ref = I(pend.ref || "", { placeholder: "e.g. Bid Committee meeting no." }), dd = D(pend.date || today());
  const adv = I("", { placeholder: "New Iulaan number" }), advD = D(""), open2 = D(""), est = MI(p.estimate);
  const keepC = o("input", { type: "checkbox", checked: true }), keepD = o("input", { type: "checkbox", checked: true });
  const ok = await form(`Re-advertise ${p.ref} — round ${n + 1}`, [
    o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, `Round ${n} (Iulaan ${p.advertNo || "—"}, ${(p.bidders || []).length} bids) is kept under Previous rounds with its bids, points and this decision. The bids table is emptied for the new proposals and the project goes back to Iulaan.`),
    ["Reason (Dhivehi)", why], ["Decision reference", ref], ["Decision date", dd], ["New Iulaan number", adv], ["New Iulaan date", advD], ["New bid opening date", open2], ["Estimate / budget (MVR)", est],
    o("label", { class: "pcc-chk", style: { gridColumn: "1/-1" } }, keepC, " Keep the evaluation criteria (" + (critLine(p) || "none set") + ")"),
    o("label", { class: "pcc-chk", style: { gridColumn: "1/-1" } }, keepD, " Keep the document columns and compulsory documents")
  ], { top: kbToggle(), check: () => { if (!why.value.trim()) throw err("Type the reason"); parseMoney(est, "Estimate"); } });
  if (!ok) return;
  save(() => {
    need("projects");
    const keep = ["advertNo", "advertised", "bidOpening", "estimate", "evaluation", "evaluationTime", "award", "evalMeetingId", "evalMeetingNo", "evalMeetingDate", "bidMeetingId", "bidMeetingNo", "bidMeetingDate", "vendor", "contract", "duration"];
    (p.rounds = p.rounds || []).push({ no: n, ...Object.fromEntries(keep.map(k => [k, p[k] ?? null])), bidders: JSON.parse(JSON.stringify(p.bidders || [])), criteria: JSON.parse(JSON.stringify(p.criteria || [])), bidDocs: (p.bidDocs || []).slice(), bidDocsReq: (p.bidDocsReq || []).slice(),
      decision: { reason: why.value.trim(), ref: ref.value.trim(), date: dd.value || today(), meetingId: pend.meetingId || null }, closedAt: today(), by: me() });
    const auto = p.awardSrc || {};
    p.bidders = [];
    if (String(p.vendor ?? "") === String(auto.vendor ?? "")) p.vendor = "";
    if (String(p.contract ?? "") === String(auto.amount ?? "")) p.contract = null;
    if (String(p.duration ?? "") === String(auto.duration ?? "")) p.duration = null;
    delete p.awardSrc;
    ["evaluation", "evaluationTime", "award", "evalMeetingId", "evalMeetingNo", "evalMeetingDate", "evalMeetingTime", "evalMeetingStart", "evalMeetingEnd", "bidMeetingId", "bidMeetingNo", "bidMeetingDate", "bidMeetingTime", "bidMeetingStart", "bidMeetingEnd"].forEach(k => { delete p[k]; });
    p.advertNo = adv.value.trim(); p.advertised = advD.value || ""; p.bidOpening = open2.value || ""; p.estimate = parseMoney(est, "Estimate");
    if (!keepC.checked) p.criteria = [];
    if (!keepD.checked) { delete p.bidDocs; delete p.bidDocsReq; }
    p.status = "Iulaan"; delete p.retender;
    recalcDue(p); audit(p, `Re-advertised — round ${n + 1}`, why.value.trim());
  }, `Round ${n + 1} started`);
}

// Earlier rounds, with their bids and the decision.
function roundsCard(p) {
  const R = p.rounds || []; if (!R.length) return null;
  const view = r => { const B = (r.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || (a.responsive === false) - (b.responsive === false));
    Mt(`Round ${r.no} — Iulaan ${r.advertNo || "—"}`, [o("p", { class: "muted small" }, (r.criteria || []).map(c => `${c.label} ${c.weight}%`).join(" · ")), B.length ? tbl(["Rank", "Bidder", "Bid (MVR)", "Days", "Total", "Responsive"], B.map(b => o("tr", {}, o("td", {}, b.rank ?? "—"), o("td", { dir: "auto" }, b.vendor), o("td", { class: "money" }, money(b.amount)), o("td", {}, b.duration ?? ""), o("td", {}, b.total == null ? "" : Number(b.total).toFixed(2)), o("td", {}, b.responsive === false ? "No" : "Yes")))) : o("p", { class: "muted" }, "No bids."),
      o("p", { dir: "auto" }, o("b", {}, "Decision: "), r.decision.reason, r.decision.ref ? ` (${r.decision.ref}, ${fd(r.decision.date)})` : "")], [{ label: "Close", value: !0 }]); };
  return card("Previous rounds", tbl(["Round", "Iulaan", "Bid opening", "Bids", "Lowest bid", "Estimate", "Decision", ""], R.map(r => { const resp = (r.bidders || []).filter(b => b.responsive !== false && b.amount != null), low = resp.length ? Math.min(...resp.map(b => b.amount)) : null;
    return o("tr", {}, o("td", {}, o("b", {}, r.no)), o("td", { class: "nowrap" }, r.advertNo || "—", r.advertised ? o("div", { class: "muted small" }, fd(r.advertised)) : null), o("td", {}, r.bidOpening ? fd(r.bidOpening) : "—"), o("td", {}, `${(r.bidders || []).length} (${resp.length} responsive)`), o("td", { class: "money" }, money(low)), o("td", { class: "money" }, money(r.estimate)),
      o("td", { dir: "auto", class: "small" }, r.decision.reason, r.decision.ref ? o("div", { class: "muted", dir: "ltr" }, `${r.decision.ref} · ${fd(r.decision.date)}`) : null), o("td", {}, btn("View bids", () => view(r), "small"))); })),
    o("p", { class: "muted small" }, `This is round ${roundNo(p)}. Earlier rounds are kept with their bids and decisions.`));
}

// Template fields for a re-advertisement: {round_no}, {is_retender}, {previous_iulaan_no}, {previous_iulaan_date_dv}, {retender_reason_dv}, {retender_decision_ref}
function roundData(p, d) {
  const R = p.rounds || [], last = R[R.length - 1];
  d.round_no = String(roundNo(p)); d.is_retender = R.length > 0;
  d.previous_iulaan_no = last ? last.advertNo || "" : ""; d.previous_iulaan_date_dv = last && last.advertised ? dvDate(last.advertised) : "";
  d.retender_reason_dv = last ? last.decision.reason || "" : ""; d.retender_decision_ref = last ? last.decision.ref || "" : "";
  d.previous_lowest_bid = last ? (l => (l.length ? ht(Math.min(...l)) : ""))((last.bidders || []).filter(b => b.responsive !== false && b.amount != null).map(b => b.amount)) : "";
}

// ---------- Viewing an earlier round ----------
// The Bid evaluation tab can show any earlier round read-only: its criteria, bids (points, ranks,
// documents), the estimate comparison, the decision, and its evaluation sheet and checklist.
const ROUNDSEL = {};
const roundSel = p => { const n = ROUNDSEL[p.id]; return n && (p.rounds || []).find(r => r.no === n) || null; };
// A read-only copy of the project as it was in that round (everything else comes from the project).
function roundView(p, r) {
  const v = Object.create(p);
  Object.assign(v, { __ro: true, bidders: r.bidders || [], criteria: r.criteria || [], bidDocs: r.bidDocs && r.bidDocs.length ? r.bidDocs : undefined, bidDocsReq: r.bidDocsReq || [], estimate: r.estimate, advertNo: r.advertNo, advertised: r.advertised, bidOpening: r.bidOpening, evaluation: r.evaluation, award: r.award, vendor: r.vendor, contract: r.contract, duration: r.duration, awardSrc: null, rounds: (p.rounds || []).filter(x => x.no < r.no), showDqPoints: true });
  return v;
}
function roundPills(p) {
  const R = p.rounds || []; if (!R.length) return null;
  const cur = ROUNDSEL[p.id] || 0, go = n => { ROUNDSEL[p.id] = n; K.le(); };
  return o("div", { class: "pcc-rounds" }, o("span", { class: "muted small" }, "Advertisement round:"),
    R.map(r => o("button", { type: "button", class: "pill" + (cur === r.no ? " on" : ""), onclick: () => go(r.no) }, `Round ${r.no}`, o("small", {}, " · " + (r.advertNo || "no Iulaan no.")))),
    o("button", { type: "button", class: "pill" + (!cur ? " on" : ""), onclick: () => go(0) }, `Round ${roundNo(p)} (current)`, p.advertNo ? o("small", {}, " · " + p.advertNo) : null));
}
function roundInfo(v, r) {
  const d = r.decision || {};
  return o("div", { class: "card pcc-rinfo" }, o("div", { class: "pcc-rinfo-h" }, o("b", {}, `Round ${r.no} — read-only`), o("span", { class: "muted small" }, "This is how the bids stood when the round was closed. Changes are made in the current round.")),
    kvs([["Iulaan number", r.advertNo], ["Iulaan date", r.advertised ? fd(r.advertised) : ""], ["Bid opening", r.bidOpening ? fd(r.bidOpening) : ""], ["Estimate", r.estimate != null ? mvr(r.estimate) : ""], ["Evaluation meeting", [r.evalMeetingNo, r.evalMeetingDate ? fd(r.evalMeetingDate) : ""].filter(Boolean).join(" · ")], ["Bid Committee meeting", [r.bidMeetingNo, r.bidMeetingDate ? fd(r.bidMeetingDate) : ""].filter(Boolean).join(" · ")]]),
    o("div", { class: "pcc-rinfo-d" }, o("b", {}, "Decision: "), o("span", { dir: "auto" }, d.reason || "—"), d.ref || d.date ? o("div", { class: "muted small", dir: "ltr" }, [d.ref, d.date ? fd(d.date) : ""].filter(Boolean).join(" · ")) : null),
    o("div", { class: "row", style: { gap: "8px", marginTop: "10px" } }, critsOf(v).length && (v.bidders || []).length ? btn("Evaluation sheet (Excel)", () => critSheet(v).catch(e => xt(e.message, "err")), "small") : null, (v.bidders || []).length ? btn("Checklist PDF", () => bidsChecklist(v), "small") : null));
}
