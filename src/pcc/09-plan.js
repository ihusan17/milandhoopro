// Annual Procurement Plan in the council's PR-09 layout: four categories (sheets) — Goods, Works,
// Non-consultancy services, Consultancy services — with procurement numbers, budgets for three
// years and the planned dates of each category. Template download / export use the PR-09 workbook
// (template code PLAN); upload reads all four sheets and shows the changes before applying them.

const PCATS = [["Goods", "goods", "G", "Goods"], ["Works", "works", "W", "Works"], ["Non-consultancy", "noncons", "NC", "Non consultancy"], ["Consultancy", "cons", "C", "Consultancy"]];
const PMETHODS = ["NCB", "ICB", "Shopping", "Direct", "QCBS", "IC", "Other"];
const PMETHOD_INFO = { NCB: "National Competitive Bidding", ICB: "International Competitive Bidding", QCBS: "Quality and Cost Based Selection", IC: "Individual / International Consultant" };
const PFUND = ["Domestic", "Other"];
const PLSTAT = ["Planned", "In progress", "Done", "Cancelled"];
const PDATES = {
  bid: [["ifb", "Invitation for bids"], ["opening", "Bid opening"], ["award", "Contract award"]],
  "Non-consultancy": [["ifb", "Invitation for bids"], ["opening", "Bid opening"], ["eval", "Bid evaluation report"], ["award", "Approval for contract award"]],
  Consultancy: [["reoi", "Request for expression of interest"], ["rfp_issue", "RFP issue"], ["rfp_sub", "RFP submission"], ["tech", "Technical evaluation"], ["fin_open", "Financial proposal opening"], ["combined", "Combined evaluation"], ["award", "Approval for contract award"]],
};
const datesFor = type => PDATES[type] || PDATES.bid;
const DSHORT = { ifb: "IFB", opening: "Opening", eval: "Eval. report", award: "Award", reoi: "REOI", rfp_issue: "RFP issue", rfp_sub: "RFP subm.", tech: "Tech. eval.", fin_open: "Fin. opening", combined: "Combined" };
const firstDate = x => { const d = x.dates || {}; return d.ifb || d.reoi || d.opening || d.award || ""; };
const qOf = x => x.q || (isISO(firstDate(x)) ? Math.floor((Number(firstDate(x).slice(5, 7)) - 1) / 3) + 1 : null);
const planYear = y => (Z().plan || []).filter(x => String(x.year) === String(y));
const budgetCode = id => { const b = id ? K.Kt(Z(), id) : null; return b ? b.code : ""; };
const planName = x => x.itemDv || x.item || "";
const procPrefix = () => { const m = (Z().plan || []).map(x => /^([A-Z]+-\d+)\//.exec(x.procNo || "")).find(Boolean); return m ? m[1] : Z().procPrefix || "PC-284"; };
function nextProcNo(yr, type) {
  const c = (PCATS.find(k => k[0] === type) || PCATS[0])[2], re = new RegExp(`/${yr}/${c}-(\\d+)$`);
  const n = Math.max(0, ...(Z().plan || []).map(x => (re.exec(x.procNo || "") || [])[1]).filter(Boolean).map(Number));
  return `${procPrefix()}/${yr}/${c}-${String(n + 1).padStart(2, "0")}`;
}
function nextPid(yr) { const n = Math.max(0, ...(Z().plan || []).filter(k => String(k.year) === String(yr)).map(k => Number(String(k.pid || "").split("-").pop()) || 0)); return `PL-${yr}-${String(n + 1).padStart(4, "0")}`; }
const bsum = x => (x.budget || []).reduce((a, v) => a + (Number(v) || 0), 0);
const sortPlan = (a, b) => PCATS.findIndex(c => c[0] === a.type) - PCATS.findIndex(c => c[0] === b.type) || String(a.procNo || a.pid).localeCompare(String(b.procNo || b.pid), undefined, { numeric: true });

// Planned / not planned. A project is "in the plan" when it is linked to a PR-09 item that is not
// cancelled; items added during the year (addedLater) are amendments; no link = not in the plan.
function planState(p) {
  const x = (Z().plan || []).find(k => (p.planId && k.id === p.planId) || k.projectId === p.id);
  if (!x) return { code: "unplanned", label: "Not in plan", dv: "ޕްލޭނުގައި ނުހިމެނޭ", tone: "warn" };
  if (x.status === "Cancelled") return { code: "cancelled", label: "Plan item cancelled", dv: "ޕްލޭނުން ކެންސަލްކޮށްފައި", tone: "bad", x };
  if (x.addedLater) return { code: "amended", label: "Added to plan", dv: "ފަހުން ޕްލޭނަށް އިތުރުކުރި", tone: "info", x };
  return { code: "planned", label: "In plan", dv: "ޕްލޭނުގައި ހިމެނޭ", tone: "ok", x };
}
const planChip = p => { const s2 = planState(p); return o("span", { class: "pcc-plan-chip t-" + s2.tone, title: s2.code === "unplanned" && p.unplannedReason ? p.unplannedReason : "" }, s2.label); };
async function planCancel(x) {
  const pj = x.projectId && prj(x.projectId), d = D(today()), why = DVT(""), ref = I("", { placeholder: "e.g. council meeting / decision no." }), alsoP = o("input", { type: "checkbox", checked: !!pj });
  if (!(await form("Cancel plan item " + (x.procNo || x.pid), [o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, "The item stays in the plan history, marked Cancelled with the reason. It is left out of the plan totals, the exported PR-09 and the Monthly view. A new project started instead is shown as Not in plan until you add it to the plan."), ["Decision date", d], ["Decision reference", ref], ["Reason (Dhivehi)", why], pj ? o("label", { class: "pcc-chk", style: { gridColumn: "1/-1" } }, alsoP, " Also mark the linked project " + pj.ref + " as Cancelled") : null], { top: kbToggle(), check: () => { if (!why.value.trim()) throw err("Type the reason"); } }))) return;
  save(() => { need("projects"); x.status = "Cancelled"; x.cancel = { date: d.value || today(), reason: why.value.trim(), ref: ref.value.trim(), by: me() }; if (pj && alsoP.checked) { pj.status = "Cancelled"; audit(pj, "Cancelled with its plan item", why.value.trim()); } }, "Plan item cancelled");
}
async function planAddProject(p, yr) {
  const why = DVT(p.unplannedReason || ""), id = Math.max(Z().nextPlanId || 1, ...Z().plan.map(k => k.id + 1));
  if (!(await form("Add " + p.ref + " to the " + yr + " plan", [o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, "Adds this project to the procurement plan as an amendment made during the year (marked Added later)."), ["Reason for adding (Dhivehi)", why]], { top: kbToggle() }))) return;
  save(() => { need("projects"); Z().nextPlanId = id + 1; Z().plan.push({ id, pid: nextPid(yr), year: Number(yr), procNo: p.prNumber || "", type: p.type, item: p.nameEn || p.name, itemDv: p.nameDv || "", estimate: p.estimate ?? null, funding: p.fund || "", method: "", budget: [p.estimate ?? null, null, null], dates: isISO(p.advertised) ? { [p.type === "Consultancy" ? "reoi" : "ifb"]: p.advertised } : {}, remarks: "", status: "In progress", unit: p.unit || "", notes: "", projectId: p.id, addedLater: { date: today(), reason: why.value.trim(), by: me() } }); p.planId = id; p.unplannedReason = why.value.trim() || p.unplannedReason; audit(p, "Added to the procurement plan", why.value.trim()); }, "Added to the plan");
}
function PLANPAGE(n, [y, cat]) {
  const yr = /^\d{4}$/.test(y || "") ? y : today().slice(0, 4), C = PCATS.find(c => c[1] === cat), all = planYear(yr).sort(sortPlan), L2 = all.filter(x => !C || x.type === C[0]), act = L2.filter(x => x.status !== "Cancelled"), ed = can("projects");
  const ys = S([...new Set([today().slice(0, 4), String(Number(today().slice(0, 4)) + 1), yr, ...(Z().plan || []).map(x => String(x.year))])].sort().map(x => [x, x]), yr, { style: { width: "auto", minWidth: "110px" } });
  ys.addEventListener("change", () => nav("#/plan/" + ys.value + (C ? "/" + C[1] : "")));
  const hist = Z().planImports.filter(h => String(h.year) === yr), tot = L => L.filter(x => x.status !== "Cancelled").reduce((a, x) => a + (x.estimate || 0), 0);
  n.append(o("div", { class: "row" }, o("h1", { style: { margin: 0 } }, "Annual procurement plan " + yr), o("div", { class: "grow right pcc-acts" }, btn("Download template (PR-09)", () => planTemplate(yr).catch(e => xt(e.message, "err"))), all.length ? btn("Export plan", () => planExport(yr).catch(e => xt(e.message, "err"))) : null, ed ? btn("Upload / update from Excel", () => planImport(yr)) : null, ed ? btn("Add plan item", () => planEdit(null, yr, C && C[0]), "primary") : null)),
    PCNAV("plan"),
    o("div", { class: "card toolbar" }, o("div", { class: "row", style: { alignItems: "center" } }, o("div", {}, o("label", {}, "Year"), ys), o("div", { class: "grow muted" }, `${all.length} item${all.length === 1 ? "" : "s"} · estimated ${ht(tot(all))} MVR · done ${all.filter(x => x.status === "Done").length}`), hist.length ? btn(`Import history (${hist.length})`, () => planHistory(yr), "small") : null),
      o("div", { class: "pills", style: { marginTop: "12px" } }, [["", "All categories", all], ...PCATS.map(c => [c[1], c[0], all.filter(x => x.type === c[0])])].map(([k, l, L]) => o("a", { href: `#/plan/${yr}${k ? "/" + k : ""}`, class: "pill" + ((C ? C[1] : "") === k ? " on" : ""), style: { textDecoration: "none" } }, l, o("span", {}, String(L.length)))))),
    (() => { const unpl = PRJ().filter(p => planState(p).code === "unplanned" && (String(p.advertised || p.createdAt || "").slice(0, 4) === yr || (!p.advertised && yr === today().slice(0, 4)))).filter(p => !C || p.type === C[0]), canc = L2.filter(x => x.status === "Cancelled"), added = L2.filter(x => x.addedLater);
      return o("div", { class: "card pcc-planstate" }, o("div", { class: "pcc-ps-k" }, o("span", { class: "pcc-plan-chip t-ok" }, "In plan"), o("b", {}, String(act.filter(x => !x.addedLater).length))), o("div", { class: "pcc-ps-k" }, o("span", { class: "pcc-plan-chip t-info" }, "Added during the year"), o("b", {}, String(added.length))), o("div", { class: "pcc-ps-k" }, o("span", { class: "pcc-plan-chip t-bad" }, "Cancelled"), o("b", {}, String(canc.length))), o("div", { class: "pcc-ps-k" }, o("span", { class: "pcc-plan-chip t-warn" }, "Projects not in plan"), o("b", {}, String(unpl.length))),
        unpl.length ? o("details", { class: "pcc-ps-list" }, o("summary", {}, "Projects started that are not in the " + yr + " plan"), tbl(["Project", "Reason", "Replaces", ""], unpl.map(p => { const rp = p.replacesPlanId && (Z().plan || []).find(k => k.id === p.replacesPlanId); return o("tr", {}, o("td", {}, o("a", { href: "#/project/" + p.id }, p.ref), o("div", { dir: "auto", class: "small" }, p.nameDv || p.name)), o("td", { dir: "auto", class: "small" }, p.unplannedReason || o("span", { class: "muted" }, "—")), o("td", { class: "small" }, rp ? (rp.procNo || rp.pid) + " · " + planName(rp) : "—"), o("td", {}, ed ? btn("Add to plan", () => planAddProject(p, yr), "small") : null)); }))) : null); })(),
    o("div", { class: "stats pcc-kpis" }, [1, 2, 3, 4].map(q => { const Q = act.filter(x => qOf(x) === q); return o("div", { class: "stat" }, o("div", { class: "k" }, `Quarter ${q} · ${Q.length} item${Q.length === 1 ? "" : "s"} · ${Q.filter(x => x.status === "Done").length} done`), o("div", { class: "v" }, ht(Q.reduce((a, x) => a + (x.estimate || 0), 0)), o("small", {}, " MVR"))); })),
    o("div", { class: "card flush" }, L2.length ? tbl(["#", "Procurement no.", "Procurement name", ...(C ? [] : ["Category"]), "Estimated (MVR)", "Funded / method", "Allocated budget", "Planned dates", "Remarks", "Status", "Project"], L2.map((x, i) => { const pj = x.projectId && prj(x.projectId), repl = PRJ().find(p => p.replacesPlanId === x.id); return o("tr", { class: (ed ? "click" : "") + (x.status === "Cancelled" ? " pcc-cancelled" : ""), onclick: e => { ed && !e.target.closest("a,button") && planEdit(x, yr); } },
      o("td", {}, i + 1), o("td", { class: "nowrap" }, x.procNo || o("span", { class: "muted small" }, x.pid)), o("td", { style: { minWidth: "220px" } }, x.itemDv ? o("b", { dir: "rtl", lang: "dv" }, x.itemDv) : null, x.item && x.item !== x.itemDv ? o("div", { class: x.itemDv ? "small muted" : "", dir: "auto" }, x.item) : null, x.notes ? o("div", { class: "muted small" }, x.notes) : null),
      C ? null : o("td", {}, x.type), o("td", { class: "money" }, money(x.estimate)), o("td", { class: "small" }, x.funding || "", o("div", { title: PMETHOD_INFO[x.method] || "" }, o("b", {}, x.method || ""))),
      o("td", { class: "small nowrap" }, (x.budget || []).map((v, k) => (v == null ? null : o("div", {}, o("span", { class: "muted" }, Number(x.year) + k + " "), ht(v)))), (x.budget || []).filter(v => v != null).length > 1 ? o("div", {}, o("b", {}, "Total " + ht(bsum(x)))) : null),
      o("td", { class: "small nowrap" }, datesFor(x.type).filter(([k]) => (x.dates || {})[k]).map(([k, l]) => o("div", { title: l }, o("span", { class: "muted" }, DSHORT[k] + " "), fd(x.dates[k])))),
      o("td", { class: "small" }, x.remarks || ""), o("td", {}, stChip(x.status), x.addedLater ? o("div", { class: "pcc-plan-chip t-info", title: x.addedLater.reason || "" }, "Added later") : null, x.cancel ? o("div", { class: "small", dir: "auto", title: [x.cancel.ref, fd(x.cancel.date)].filter(Boolean).join(" · ") }, x.cancel.reason) : null, repl ? o("div", { class: "small" }, "Replaced by ", o("a", { href: "#/project/" + repl.id }, repl.ref)) : null),
      o("td", {}, pj ? o("a", { href: "#/project/" + pj.id, dir: "auto" }, pj.ref) : x.status === "Cancelled" || !ed ? "" : btn("Convert to project", () => planToProject(x), "small"), ed && x.status !== "Cancelled" ? btn("Cancel…", () => planCancel(x), "small danger") : ed && x.cancel ? btn("Undo cancel", () => save(() => { x.status = x.projectId ? "In progress" : "Planned"; delete x.cancel; }, "Restored"), "small") : null)); })) : empty(`No ${C ? C[0].toLowerCase() + " " : ""}plan items for ${yr} yet. Add them here, or fill in the PR-09 template in Excel and upload it.`)),
    o("p", { class: "muted small" }, "Methods: " + Object.entries(PMETHOD_INFO).map(([k, v]) => k + " = " + v).join(" · ")));
}

async function planEdit(x, yr, cat) {
  const v = x || {}, type = S(PCATS.map(k => k[0]), v.type || cat || "Goods"), procNo = I(v.procNo || nextProcNo(yr, v.type || cat || "Goods")), itemDv = DVI(v.itemDv), item = I(v.item && v.item !== v.itemDv ? v.item : ""), est = MI(v.estimate),
    fund = S([["", "—"], ...[...new Set([...PFUND, v.funding].filter(Boolean))].map(f => [f, f])], x ? v.funding || "" : "Domestic"), meth = S([...new Set([...PMETHODS, v.method].filter(Boolean))], v.method || "NCB"),
    bud = [0, 1, 2].map(i => MI((v.budget || [])[i])), rem = I(v.remarks, { list: "pcc-funds" }), st = S(PLSTAT, v.status || "Planned"), unit = I(v.unit, { list: "pcc-units" }), notes = I(v.notes), dbox = o("div", { class: "grid2" }), dins = {};
  const drawDates = () => { dbox.replaceChildren(...datesFor(type.value).map(([k, l]) => { dins[k] = dins[k] || D((v.dates || {})[k]); return L(l, dins[k]); })); };
  type.addEventListener("change", () => { if (!x) procNo.value = nextProcNo(yr, type.value); drawDates(); }); drawDates();
  bud[0].addEventListener("focus", () => { if (!bud[0].value && est.value) bud[0].value = est.value; });
  const r = await Mt(x ? "Plan item " + (x.procNo || x.pid) : "Add plan item — " + yr, [o("datalist", { id: "pcc-units" }, Z().lists.units.map(u => o("option", { value: u.label }))), o("datalist", { id: "pcc-funds" }, ["J-GOM", "J-LCL"].map(f => o("option", { value: f }))), o("div", { class: "row", style: { justifyContent: "flex-end" } }, kbToggle()),
    o("div", { class: "grid2" }, L("Category", type), L("Procurement no.", procNo)), L("Procurement name (Dhivehi)", itemDv), L("Procurement name (English, optional)", item),
    o("div", { class: "grid2" }, L("Estimated amount (MVR)", est), L("Funded method", fund), L("Procurement method", meth), L("Remarks / fund", rem)),
    o("h4", { class: "pcc-sec" }, "Allocated budget (MVR)"), o("div", { class: "grid2" }, bud.map((b, i) => L(String(Number(yr) + i), b))),
    o("h4", { class: "pcc-sec" }, "Planned dates"), dbox,
    o("h4", { class: "pcc-sec" }, "Tracking"), o("div", { class: "grid2" }, L("Status", st), L("Responsible section", unit)), L("Notes", notes)],
  [...(x && !x.projectId ? [{ label: "Delete", value: "del" }] : []), { label: "Cancel", value: !1 }, { label: x ? "Save" : "Add", primary: !0, value: !0, onClick: () => { try { if (!itemDv.value.trim() && !item.value.trim()) throw err("Type the procurement name"); parseMoney(est, "Estimated amount"); bud.forEach((b, i) => parseMoney(b, "Budget " + (Number(yr) + i))); if ((Z().plan || []).some(k => k !== x && procNo.value.trim() && k.procNo === procNo.value.trim())) throw err("That procurement number is already used"); } catch (e) { xt(e.message, "err"); return !1; } } }]);
  if (r === "del") { (await jt("Delete this plan item?", "Delete")) && save(() => { need("projects"); Z().plan = Z().plan.filter(k => k !== x); }, "Plan item deleted"); return; }
  if (!r) return;
  save(() => {
    need("projects");
    const dates = {}; datesFor(type.value).forEach(([k]) => { dins[k] && dins[k].value && (dates[k] = dins[k].value); });
    const o2 = { type: type.value, procNo: procNo.value.trim(), itemDv: itemDv.value.trim(), item: item.value.trim() || itemDv.value.trim(), estimate: parseMoney(est, "Estimated amount"), funding: fund.value, method: meth.value, budget: bud.map(b => parseMoney(b, "Budget")), dates, remarks: rem.value.trim(), status: st.value, unit: unit.value.trim(), notes: notes.value.trim(), q: null };
    if (x) Object.assign(x, o2); else { const id = Math.max(Z().nextPlanId || 1, ...(Z().plan || []).map(k => k.id + 1)); Z().nextPlanId = id + 1; (Z().plan = Z().plan || []).push({ id, pid: nextPid(yr), year: Number(yr), ...o2, projectId: null }); }
  }, x ? "Plan item saved" : "Plan item added");
}
// Project fields that come from a plan item.
function planProjectFields(x) {
  const d = x.dates || {};
  return { nameDv: x.itemDv || "", nameEn: x.item && x.item !== x.itemDv ? x.item : "", name: x.item || x.itemDv, type: x.type, status: "Planned", unit: x.unit || "", budgetId: x.budgetId || null, fund: x.remarks || x.funding || "", estimate: x.estimate, planId: x.id, advertised: d.ifb || d.reoi || "", bidOpening: d.opening || d.fin_open || "", evaluation: d.eval || d.tech || d.combined || "", award: d.award || "", notes: `From plan item ${x.procNo || x.pid}${x.method ? " · " + x.method : ""}${x.funding ? " · " + x.funding : ""}` };
}
function planToProject(x) { PEDIT2(null, x.type, planProjectFields(x), x.procNo); }

// ---------- PR-09 template (Excel) ----------
const xlSerial = iso => (isISO(iso) ? Math.round((Date.parse(iso + "T00:00:00Z") - Date.UTC(1899, 11, 30)) / 864e5) : null);
const planTpl = () => { const t = tplByCode("PLAN"); return t && t.active !== false ? t : null; };
function planData(yr, L2) {
  const d = { year: yr, y1: Number(yr), y2: Number(yr) + 1, y3: Number(yr) + 2, __num: { year: Number(yr), y1: Number(yr), y2: Number(yr) + 1, y3: Number(yr) + 2 } };
  PCATS.forEach(([type, loop]) => {
    d[loop] = L2.filter(x => x.type === type).sort(sortPlan).map((x, i) => {
      const r = { no: i + 1, year: x.year, proc_no: x.procNo || x.pid, name: planName(x), name_en: x.item || "", estimate: x.estimate == null ? "" : ht(x.estimate), funded: x.funding || "", method: x.method || "", remarks: x.remarks || "", status: x.status, __num: { no: i + 1, year: Number(x.year), estimate: x.estimate == null ? null : x.estimate / 100 } };
      [0, 1, 2].forEach(k => { const v = (x.budget || [])[k]; r["budget_y" + (k + 1)] = v == null ? "-" : ht(v); r.__num["budget_y" + (k + 1)] = v == null ? null : v / 100; });
      Object.entries(x.dates || {}).forEach(([k, v]) => { r["d_" + k] = isISO(v) ? Xt(v) : ""; r.__num["d_" + k] = xlSerial(v); });
      return r;
    });
  });
  return d;
}
async function planTemplate(yr) {
  const t = planTpl(); if (!t) throw err("The PLAN template is missing or inactive (Projects › Templates).");
  ii(new Blob([await fillXlsx(await fget(curVer(t).fileId), planData(yr, []), t.cellMap)], { type: MIME.xlsx }), `PR-09_Procurement_Plan_${yr}_template.xlsx`);
}
async function planExport(yr) {
  const t = planTpl(); if (!t) throw err("The PLAN template is missing or inactive (Projects › Templates).");
  ii(new Blob([await fillXlsx(await fget(curVer(t).fileId), planData(yr, planYear(yr).filter(x => x.status !== "Cancelled")), t.cellMap)], { type: MIME.xlsx }), `PR-09_Procurement_Plan_${yr}.xlsx`);
}

// ---------- import (all sheets) ----------
async function readBook(u8) {
  const X = await xlsxOpen(u8), out = [];
  for (const sh of X.sheets) {
    const f = X.zip.file(sh.path); if (!f) continue;
    const d = xparse(await f.async("string")), rows = [];
    [...d.getElementsByTagName("c")].forEach(c => { const rc = splitRef(c.getAttribute("r")); if (!rc) return; (rows[rc[1] - 1] = rows[rc[1] - 1] || [])[rc[0] - 1] = String(cellText(c, X.ss) ?? "").trim(); });
    out.push({ name: sh.name, rows: Array.from(rows, r => Array.from(r || [], v => v ?? "")) });
  }
  return out;
}
const lc = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
function sheetCat(sh) {
  const t = lc(sh.name + " " + sh.rows.slice(0, 6).map(r => r.join(" ")).join(" "));
  return /non[- ]?consult/.test(t) ? "Non-consultancy" : /consult/.test(t) ? "Consultancy" : /works?\b/.test(lc(sh.name)) || /of works/.test(t) ? "Works" : /goods/.test(t) ? "Goods" : null;
}
function toISO(v) {
  if (v === "" || v == null || v === "-") return "";
  if (/^\d+(\.\d+)?$/.test(v)) { const n = Number(v); if (n > 20000 && n < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 864e5).toISOString().slice(0, 10); }
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(v); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return isISO(v) ? v : null;
}
const toLaari = v => { if (v === "" || v == null || v === "-") return null; const n = Number(String(v).replace(/[, ]|MVR|Rf\.?/gi, "")); return isFinite(n) ? Math.round(n * 100) : NaN; };
function parsePR09(book) {
  const out = [];
  book.forEach(sh => {
    const type = sheetCat(sh); if (!type) return;
    const h = sh.rows.findIndex(r => (r || []).some(c => /procurement (name|description)/i.test(c))); if (h < 0) return;
    const H = sh.rows[h] || [], Sb = sh.rows[h + 1] || [], map = {}, years = [];
    const width = Math.max(H.length, Sb.length);
    for (let i = 0; i < width; i++) {
      const a = lc(H[i]), b = lc(Sb[i]);
      if (/^(s\.? ?no\.?|#)$/.test(a)) map.no = i; else if (a === "year") map.year = i; else if (/procurement no|reference no/.test(a)) map.procNo = i; else if (/procurement (name|description)/.test(a)) map.name = i; else if (/estimated amount/.test(a)) map.estimate = i; else if (/funded/.test(a)) map.funding = i; else if (/procurement method/.test(a)) map.method = i; else if (/remarks/.test(a)) map.remarks = i;
      if (/^\d{4}$/.test(b) || /^\{y[123]\}$/.test(b)) years.push(i); else if (b === "total") map.total = i;
      else if (/invitation for bids/.test(b)) map.d_ifb = i; else if (/bid opening/.test(b)) map.d_opening = i; else if (/evaluation report/.test(b)) map.d_eval = i; else if (/contract award/.test(b)) map.d_award = i; else if (/expression of interest/.test(b)) map.d_reoi = i; else if (/\(rfp\) issue|rfp issue/.test(b)) map.d_rfp_issue = i; else if (/rfp submission/.test(b)) map.d_rfp_sub = i; else if (/technical evaluation/.test(b)) map.d_tech = i; else if (/financial proposal/.test(b)) map.d_fin_open = i; else if (/combine/.test(b)) map.d_combined = i;
    }
    for (let r = h + 2; r < sh.rows.length; r++) {
      const row = sh.rows[r] || [], g = k => (k in map ? String(row[map[k]] ?? "").trim() : ""), line = `${sh.name} row ${r + 1}`;
      if (/^key$/i.test(g("no"))) break;
      if (!g("name") && !g("procNo")) continue;
      const errs = [], v = { type, procNo: g("procNo"), itemDv: g("name"), item: g("name"), funding: g("funding"), method: g("method"), remarks: g("remarks"), dates: {} };
      v.estimate = toLaari(g("estimate")); Number.isNaN(v.estimate) && errs.push(`estimated amount "${g("estimate")}" is not a number`);
      v.budget = years.slice(0, 3).map(i => toLaari(String(row[i] ?? "").trim())); v.budget.some(Number.isNaN) && errs.push("an allocated budget is not a number");
      if (g("year") && !/^\d{4}$/.test(g("year"))) errs.push(`year "${g("year")}" is not a year`);
      v.year = Number(g("year")) || null;
      Object.keys(map).filter(k => k.startsWith("d_")).forEach(k => { const iso = toISO(g(k)); if (iso === null) errs.push(`date "${g(k)}" is not a date`); else if (iso) v.dates[k.slice(2)] = iso; });
      if (!g("name")) errs.push("procurement name is missing");
      out.push({ line, errs, v });
    }
  });
  return out;
}
const PFIELDS = [["procNo", "Procurement no."], ["itemDv", "Name"], ["type", "Category"], ["estimate", "Estimate"], ["funding", "Funded"], ["method", "Method"], ["budget", "Budget"], ["dates", "Planned dates"], ["remarks", "Remarks"]];
const pshow = (k, v) => (k === "estimate" ? (v == null ? "" : ht(v)) : k === "budget" ? (v || []).map(b => (b == null ? "-" : ht(b))).join(" · ") : k === "dates" ? Object.entries(v || {}).map(([a, b]) => a + " " + fd(b)).join(", ") : v ?? "");
async function planImport(yr) {
  try {
    need("projects");
    const f = await pickFile(".xlsx"); if (!f) return;
    const book = await readBook(await toU8(f)), parsed = parsePR09(book);
    if (!parsed.length) throw err("No plan rows found. Use the PR-09 template (Download template) — sheets Goods, Works, Non consultancy and Consultancy.");
    const other = parsed.filter(r => r.v.year && String(r.v.year) !== String(yr));
    if (other.length && !(await jt(`${other.length} row${other.length === 1 ? " is" : "s are"} for another year (${[...new Set(other.map(r => r.v.year))].join(", ")}). Import everything into ${yr}?`, "Continue"))) return;
    const cur = planYear(yr), ok = parsed.filter(r => !r.errs.length), bad = parsed.filter(r => r.errs.length);
    const used = new Set(), NEW = [], CHG = [], SAME = [];
    ok.forEach(r => {
      let x = r.v.procNo && cur.find(c => !used.has(c) && lc(c.procNo) === lc(r.v.procNo)), how = "no";
      if (!x) { x = cur.find(c => !used.has(c) && c.type === r.v.type && lc(planName(c)) === lc(r.v.itemDv)); how = "name"; }
      if (x) { used.add(x); const diff = PFIELDS.filter(([k]) => JSON.stringify(pshow(k, x[k])) !== JSON.stringify(pshow(k, r.v[k]))); (diff.length ? CHG : SAME).push({ r, x, how, diff, confirm: o("input", { type: "checkbox", checked: true }) }); }
      else NEW.push({ r });
    });
    const MISS = cur.filter(x => !used.has(x));
    const mode = o("div", { class: "pcc-modes" }, [["add", "Add new only", "Adds the new rows. Existing items are not changed."], ["update", "Add + update", "Adds new rows and applies the changes shown."], ["replace", "Replace whole year", `Makes the ${yr} plan exactly like the file: also removes items missing from it (items linked to a project are kept).`]].map(([v, l, h], i) => o("label", { class: "pcc-mode" }, o("input", { type: "radio", name: "pcc-mode", value: v, checked: i === 1 }), o("b", {}, l), o("span", { class: "muted small" }, h))));
    const sec = (t, cls, kids2) => o("details", { class: "pcc-diff " + cls, open: true }, o("summary", {}, t), kids2);
    const byCat = PCATS.map(c => `${c[0]} ${parsed.filter(r => r.v.type === c[0]).length}`).join(" · ");
    const res = await Mt(`Update plan ${yr} from ${f.name}`, [o("p", { class: "muted small" }, "Rows found by sheet: " + byCat), o("div", { class: "stats pcc-kpis" }, [["New rows", NEW.length, ""], ["Changed rows", CHG.length, CHG.length ? "warn" : ""], ["Unchanged", SAME.length, ""], ["Missing from file", MISS.length, ""], ["Errors", bad.length, bad.length ? "bad" : ""]].map(([k, v, c]) => o("div", { class: "stat " + c }, o("div", { class: "k" }, k), o("div", { class: "v" }, String(v))))),
      bad.length ? sec(`Errors — ${bad.length} row${bad.length === 1 ? "" : "s"} will be skipped`, "bad", tbl(["Row", "Problem"], bad.map(b => o("tr", {}, o("td", { class: "nowrap" }, b.line), o("td", {}, b.errs.join("; ")))))) : null,
      NEW.length ? sec(`New rows (${NEW.length})`, "new", tbl(["Row", "Procurement no.", "Name", "Category", "Estimate"], NEW.map(({ r }) => o("tr", {}, o("td", { class: "nowrap small" }, r.line), o("td", { class: "nowrap" }, r.v.procNo || "(new number)"), o("td", { dir: "auto" }, r.v.itemDv), o("td", {}, r.v.type), o("td", { class: "money" }, pshow("estimate", r.v.estimate)))))) : null,
      CHG.length ? sec(`Changed rows (${CHG.length})`, "chg", tbl(["Row", "Item", "Changes (old → new)", "Same item?"], CHG.map(c => o("tr", {}, o("td", { class: "nowrap small" }, c.r.line), o("td", { dir: "auto" }, c.x.procNo || c.x.pid, o("div", {}, planName(c.x))), o("td", {}, c.diff.map(([k, l]) => o("div", { class: "small" }, o("b", {}, l + ": "), o("s", { class: "muted" }, String(pshow(k, c.x[k])) || "(empty)"), " → ", o("span", {}, String(pshow(k, c.r.v[k])) || "(empty)")))), o("td", {}, c.how === "name" ? o("label", { class: "pcc-chk small" }, c.confirm, " matched by name") : "by number"))))) : null,
      MISS.length ? sec(`In the program but not in the file (${MISS.length})`, "miss", tbl(["Procurement no.", "Name", "Project"], MISS.map(x => o("tr", {}, o("td", {}, x.procNo || x.pid), o("td", { dir: "auto" }, planName(x)), o("td", {}, x.projectId ? "linked — kept" : ""))))) : null,
      o("h4", {}, "What should happen?"), mode], [{ label: "Cancel", value: !1 }, { label: "Apply", primary: !0, value: !0 }]);
    if (!res) return;
    const m = (mode.querySelector("input:checked") || {}).value || "update";
    save(() => {
      need("projects");
      const before = JSON.parse(JSON.stringify(cur)); let nAdd = 0, nUpd = 0, nDel = 0;
      Z().plan = Z().plan || [];
      const add = v => { const id = Math.max(Z().nextPlanId || 1, ...Z().plan.map(k => k.id + 1)); Z().nextPlanId = id + 1; Z().plan.push({ status: "Planned", unit: "", notes: "", ...v, id, pid: nextPid(yr), year: Number(yr), procNo: v.procNo || nextProcNo(yr, v.type), projectId: null }); nAdd++; };
      NEW.forEach(({ r }) => add(r.v));
      CHG.forEach(c => { if (c.how === "name" && !c.confirm.checked) { add(c.r.v); return; } if (m === "add") return; const { year, ...rest } = c.r.v; void year; Object.assign(c.x, rest, { q: null }); nUpd++; });
      if (m === "replace") { const gone = new Set(MISS.filter(x => !x.projectId)); nDel = gone.size; Z().plan = Z().plan.filter(x => !gone.has(x)); }
      Z().planImports.unshift({ id: uid(), year: Number(yr), at: Vt(), by: me(), file: f.name, mode: m, counts: { added: nAdd, updated: nUpd, removed: nDel, errors: bad.length }, before });
      Z().planImports = Z().planImports.slice(0, 30);
    }, `Plan updated: ${NEW.length} added${m !== "add" ? `, ${CHG.length} changed` : ""}${m === "replace" ? `, ${MISS.filter(x => !x.projectId).length} removed` : ""}`);
  } catch (e) { xt(e.message, "err"); }
}
async function planHistory(yr) {
  const H = Z().planImports.filter(h => String(h.year) === String(yr));
  await Mt("Plan import history " + yr, [tbl(["When", "By", "File", "Mode", "Result", ""], H.map((h, i) => o("tr", {}, o("td", { class: "nowrap" }, fd(String(h.at).slice(0, 10)) + " " + String(h.at).slice(11, 16)), o("td", {}, h.by), o("td", {}, h.file), o("td", {}, { add: "Add new only", update: "Add + update", replace: "Replace whole year" }[h.mode]), o("td", { class: "small" }, `${h.counts.added} added, ${h.counts.updated} updated, ${h.counts.removed} removed, ${h.counts.errors} errors`), o("td", {}, can("projects") ? btn("Roll back", async () => { if (!(await jt(`Put the ${yr} plan back to how it was before this import${i ? ` (this also undoes the ${i} later import${i === 1 ? "" : "s"})` : ""}?`, "Roll back"))) return; save(() => { need("projects"); const keepLinked = planYear(yr).filter(x => x.projectId && !h.before.some(b => b.id === x.id)); Z().plan = (Z().plan || []).filter(x => String(x.year) !== String(yr)).concat(JSON.parse(JSON.stringify(h.before)), keepLinked); const idx = Z().planImports.indexOf(h); Z().planImports = Z().planImports.filter((x, j) => !(String(x.year) === String(yr) && j <= idx)); document.querySelector(".modal-back") && document.querySelector(".modal-back").click(); }, "Plan rolled back"); }, "small") : null))))], [{ label: "Close", primary: !0, value: !1 }]);
}

// ---------- the council's PR-09 2026 plan, loaded once into the portal ----------
function loadPR09(z) {
  const D = window.__PCC_PR09 || [];
  if (z.pr09Loaded || !D.length) return false;
  z.plan = z.plan || [];
  D.forEach(it => {
    let x = z.plan.find(k => k.procNo && lc(k.procNo) === lc(it.procNo));
    if (!x) { const id = Math.max(z.nextPlanId || 1, ...z.plan.map(k => k.id + 1)); z.nextPlanId = id + 1; x = { id, pid: nextPid(it.year), year: it.year, procNo: it.procNo, type: it.type, item: it.itemDv, itemDv: it.itemDv, estimate: it.estimate, funding: it.funding, method: it.method, budget: it.budget, dates: it.dates, remarks: it.remarks, status: "Planned", unit: "", notes: "", projectId: null, src: "PR-09" }; z.plan.push(x); }
    if (!x.projectId && !PRJ().some(p => p.ref === it.procNo)) {
      const id = Math.max(z.nextProjectId || 1, ...PRJ().map(k => k.id + 1)); z.nextProjectId = id + 1;
      const p = { id, ref: it.procNo, ...planProjectFields(x), logs: [], cases: [], bidders: [], committees: { bid: [], eval: [] }, reports: [], checklist: defaultChecklist(x.type), letters: [], payments: [], eots: [], activity: [], retReports: [], dueOriginal: "", due: "", createdAt: Vt(), src: "PR-09" };
      audit(p, "Created from the PR-09 procurement plan " + it.year, it.procNo);
      PRJ().push(p); x.projectId = id;
    }
  });
  z.pr09Loaded = Vt();
  return true;
}
