// Project form and the project detail page (banner, sub-tab bar, Summary, Plan, Bid, Evaluation).

const SUBTABS = [["summary", "Summary"], ["plan", "Procurement plan"], ["bid", "Bid Documents"], ["eval", "Evaluation"], ["logs", "Work Logs"], ["progress", "Progress Reports"], ["checklist", "Checklist"], ["completion", "Completion"], ["retention", "Retention"], ["letters", "Letters & Memos"], ["payments", "Payments"], ["files", "Files"], ["activity", "Activity"]];
const extDays = p => (p.eots || []).reduce((a, e) => a + (Number(e.days) || 0), 0);
function recalcDue(p) {
  if (p.handover && p.duration && !p.dueManual) p.dueOriginal = dAdd(p.handover, Number(p.duration));
  p.due = p.dueOriginal ? dAdd(p.dueOriginal, extDays(p)) : p.due || "";
  if (p.done && p.retentionDays) p.retentionEnd = dAdd(p.done, Number(p.retentionDays));
}

async function PEDIT2(p, type, pre, ref) {
  const v = p || pre || {}, staff = (K.STF() || []).filter(s => s.status !== "Disabled");
  const f = {
    nameEn: I(v.nameEn || (v.nameDv ? "" : v.name) || ""), nameDv: DVI(v.nameDv), type: S(PTYPES.map(x => x[1]), v.type || type || "Works"), category: I(v.category, { placeholder: "e.g. Construction, IT" }), status: S(PST, v.status || "Planned"), location: I(v.location || "", { placeholder: "e.g. Sh. Milandhoo harbour" }),
    unit: I(v.unit, { list: "pcc-units" }), officer: I(v.officer, { list: "pcc-staff" }), vendor: I(v.vendor, { list: "pcc-vendors", placeholder: "Pick from Vendors or type" }),
    budget: S([["", "— none —"], ...Z().budgets.map(b => [b.id, `${b.code} - ${b.description}`])], v.budgetId ?? ""), fund: I(v.fund, { placeholder: "Council budget, grant…" }), estimate: MI(v.estimate), contract: MI(v.contract),
    bidMeetingNo: I(v.bidMeetingNo, { placeholder: "e.g. (IUL)351-PRO/2026/BM004" }), bidMeetingDate: D(v.bidMeetingDate), bidMeetingTime: o("input", { type: "time", value: v.bidMeetingTime || "" }), evalMeetingTime: o("input", { type: "time", value: v.evalMeetingTime || "" }), bidMeetingStart: o("input", { type: "time", value: v.bidMeetingStart || "" }), bidMeetingEnd: o("input", { type: "time", value: v.bidMeetingEnd || "" }), evalMeetingStart: o("input", { type: "time", value: v.evalMeetingStart || "" }), evalMeetingEnd: o("input", { type: "time", value: v.evalMeetingEnd || "" }), evaluationTime: o("input", { type: "time", value: v.evaluationTime || "" }), evalMeetingNo: I(v.evalMeetingNo, { placeholder: "e.g. (IUL)351-PRO/2026/EM002" }), evalMeetingDate: D(v.evalMeetingDate),
    prNumber: I(v.prNumber), advertNo: I(v.advertNo), advertised: D(v.advertised), bidOpening: D(v.bidOpening), evaluation: D(v.evaluation), award: D(v.award), agreement: D(v.agreement), agreementNo: I(v.agreementNo || "", { placeholder: "e.g. (AGR)284-A/PRIV/2026/22" }), handover: D(v.handover),
    duration: N(v.duration, { min: 0, placeholder: "days" }), penalty: MI(v.penaltyPerDay), due: D(v.dueOriginal || v.due), done: D(v.done), progress: N(v.progress ?? 0, { min: 0, max: 100, step: 1 }),
    retentionPct: N(v.retentionPct ?? "", { min: 0, max: 100, step: .5, placeholder: "e.g. 5" }), retentionDays: N(v.retentionDays ?? "", { min: 0, placeholder: "e.g. 365" }),
    plan: S([["", "— not linked —"], ...(Z().plan || []).filter(x => !x.projectId || x.projectId === v.id).map(x => [x.id, `${x.pid} · ${x.item}`])], v.planId ?? ""),
    descDv: DVT(v.descDv), desc: o("textarea", { rows: 3, dir: "auto" }), notes: o("textarea", { rows: 2, dir: "auto" }),
  };
  // Placeholders in your templates that the program has no field for: typed here once per project.
  const xtags = extraTags(), xf = {};
  Object.keys(xtags).sort().forEach(k => { const val = (v.fields || {})[k] ?? "", kd = (ownOf(k) || {}).kind || (/_date$/.test(k) ? "date" : /_time$/.test(k) ? "time" : /_dv$/.test(k) ? "dv" : "text"); xf[k] = kd === "date" ? D(val) : kd === "time" ? o("input", { type: "time", value: val }) : kd === "dv" ? DVI(val) : kd === "number" ? N(val) : I(val); });
  f.desc.value = v.desc || ""; f.notes.value = v.notes || "";
  let manual = !!v.dueManual;
  const hint = o("div", { class: "muted small" });
  const auto = () => { if (!manual && f.handover.value && Number(f.duration.value) > 0) f.due.value = dAdd(f.handover.value, Number(f.duration.value)); hint.textContent = manual ? "Set by hand. Clear it to calculate from handover + duration." : f.handover.value && f.duration.value ? "Handover + duration" + (extDays(v) ? ` (+${extDays(v)} extension days are added on top)` : "") : "Fills in from handover date + duration"; };
  f.handover.addEventListener("change", auto); f.duration.addEventListener("input", auto); f.due.addEventListener("change", () => { manual = !!f.due.value && !(f.handover.value && f.duration.value && f.due.value === dAdd(f.handover.value, Number(f.duration.value))); auto(); }); auto();
  const lists = [o("datalist", { id: "pcc-units" }, Z().lists.units.map(u => o("option", { value: u.label }))), o("datalist", { id: "pcc-staff" }, staff.map(s => o("option", { value: s.name }, s.designation || ""))), o("datalist", { id: "pcc-vendors" }, K.sa().map(x => o("option", { value: x })))];
  const sec = t => o("h4", { class: "pcc-sec" }, t);
  let out = null;
  // Sections with field widths on a 12-column grid (3 = quarter, 4 = third, 6 = half, 12 = full).
  const F = (label, el, w = 4, hint) => ({ label, el, w, hint });
  const nextBtn = (k, kind) => btn("Take next number", () => { if (f[k + "MeetingNo"].value.trim() && !confirm("Replace the number already typed?")) return; f[k + "MeetingNo"].value = refNext(kind, v); K.Qt(); }, "small");
  const withBtn = (el, b) => o("div", { class: "pcc-pe-inbtn" }, el, b);
  const meet = (k, l, kind) => [{ sub: l }, F("Meeting number", withBtn(f[k + "MeetingNo"], nextBtn(k, kind)), 12, "Empty: the latest meeting recorded for this project"), F("Date", f[k + "MeetingDate"], 3), F("Time", f[k + "MeetingTime"], 3), F("Started at", f[k + "MeetingStart"], 3), F("Ended at", f[k + "MeetingEnd"], 3)];
  const secs = [
    { id: "project", t: "Project", ic: "M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4", fields: [F("Name in English", f.nameEn, 6), F("Name in Dhivehi", f.nameDv, 6), F("Type", f.type), F("Category", f.category), F("Status", f.status), F("Location / island", f.location), F("Unit / section", f.unit), F("Project officer", f.officer), F("Linked plan item", f.plan, 12)] },
    { id: "money", t: "Money", ic: "M12 3v18M17 7.5C17 5.6 14.8 5 12 5s-5 1-5 3 2 3 5 3.5 5 1.5 5 3.5-2.2 3-5 3-5-.6-5-2.5", fields: [F("Budget line", f.budget, 6), F("Funding source", f.fund, 6), F("Estimated cost (MVR)", f.estimate), F("Contract value (MVR)", f.contract), F("Contractor / supplier", f.vendor)] },
    { id: "proc", t: "Procurement", ic: "M9 4h6l1 3H8l1-3zM6 7h12v13H6zM9 12h6M9 16h4", fields: [F("PR number", f.prNumber), F("Iulaan number", f.advertNo), F("Iulaan date", f.advertised), F("Bid opening", f.bidOpening), F("Evaluation date", f.evaluation), F("Evaluation time", f.evaluationTime), F("Award", f.award), F("Agreement signed", f.agreement), F("Agreement number", f.agreementNo)] },
    { id: "meet", t: "Committee meetings", sh: "Meetings", ic: "M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5m0-5c1-.6 2-1 2-1 3 0 6 2 6 5", fields: [...meet("bid", "Bid Committee", "meeting"), ...meet("eval", "Evaluation Committee", "evalmeeting")] },
    { id: "period", t: "Contract period", sh: "Period", ic: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", fields: [F("Site handover", f.handover), F("Duration (days)", f.duration), F("Due date", f.due, 4, hint), F("Actual completion", f.done), F("Physical progress (%)", f.progress), F("Delay penalty per day (MVR)", f.penalty)] },
    { id: "ret", t: "Retention", ic: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z", fields: [F("Retention (%)", f.retentionPct, 6), F("Retention period (days)", f.retentionDays, 6)] },
    Object.keys(xf).length ? { id: "own", t: "Other template fields", sh: "Other fields", ic: "M8 4H6v16h2M16 4h2v16h-2", hint: "Placeholders in your templates that the program has no field for. Type the value for this project; it fills every template that uses it.", fields: Object.keys(xf).map(k => F([(ownOf(k) || {}).label || "", o("code", {}, "{" + k + "}")], xf[k], 4, xtags[k].length ? "In " + xtags[k].join(", ") : "Not in a template yet")) } : null,
    { id: "scope", t: "Scope and notes", sh: "Scope", ic: "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h6", fields: [F("Scope in Dhivehi", f.descDv, 12), F("Scope in English", f.desc, 12), F("Notes", f.notes, 12)] }
  ].filter(Boolean);
  const style = (Z().ui || {}).peditStyle || "cards";
  const ok = await Mt(p ? "Edit project " + (p.ref || "") : "New project", [...lists, peditLayout(style, secs)],
  [{ label: "Cancel", value: !1 }, { label: p ? "Save" : "Create project", primary: !0, value: !0, onClick: () => {
    try {
      if (!f.nameEn.value.trim() && !f.nameDv.value.trim()) throw err("Type the project name in English or Dhivehi");
      const pr = Number(f.progress.value || 0); if (!(pr >= 0 && pr <= 100)) throw err("Progress must be between 0 and 100");
      if (f.handover.value && f.due.value && f.due.value < f.handover.value) throw err("The due date is before the handover date");
      const nn = el => (el.value === "" ? null : Number(el.value));
      out = { nameEn: f.nameEn.value.trim(), nameDv: f.nameDv.value.trim(), name: f.nameEn.value.trim() || f.nameDv.value.trim(), type: f.type.value, category: f.category.value.trim(), status: f.status.value, location: f.location.value.trim(), unit: f.unit.value.trim(), officer: f.officer.value.trim(), vendor: f.vendor.value.trim(), budgetId: f.budget.value ? Number(f.budget.value) : null, fund: f.fund.value.trim(), estimate: parseMoney(f.estimate, "Estimated cost"), contract: parseMoney(f.contract, "Contract value"), bidMeetingNo: f.bidMeetingNo.value.trim(), bidMeetingDate: f.bidMeetingDate.value, bidMeetingTime: f.bidMeetingTime.value, evalMeetingTime: f.evalMeetingTime.value, bidMeetingStart: f.bidMeetingStart.value, bidMeetingEnd: f.bidMeetingEnd.value, evalMeetingStart: f.evalMeetingStart.value, evalMeetingEnd: f.evalMeetingEnd.value, evaluationTime: f.evaluationTime.value, evalMeetingNo: f.evalMeetingNo.value.trim(), evalMeetingDate: f.evalMeetingDate.value, prNumber: f.prNumber.value.trim(), advertNo: f.advertNo.value.trim(), advertised: f.advertised.value, bidOpening: f.bidOpening.value, evaluation: f.evaluation.value, award: f.award.value, agreement: f.agreement.value, agreementNo: f.agreementNo.value.trim(), handover: f.handover.value, duration: nn(f.duration), penaltyPerDay: parseMoney(f.penalty, "Delay penalty per day") || null, dueOriginal: f.due.value, dueManual: manual, done: f.done.value, progress: pr, retentionPct: nn(f.retentionPct), retentionDays: nn(f.retentionDays), planId: f.plan.value ? Number(f.plan.value) : null, descDv: f.descDv.value.trim(), desc: f.desc.value.trim(), notes: f.notes.value.trim() };
      if (Object.keys(xf).length) { out.fields = Object.assign({}, v.fields || {}); Object.entries(xf).forEach(([k, el]) => { const x = el.value.trim(); x ? (out.fields[k] = x) : delete out.fields[k]; }); }
      if (out.status === "Completed" || out.status === "In retention") { out.progress = 100; out.done = out.done || today(); }
    } catch (e) { xt(e.message, "err"); return !1; }
  } }]);
  if (!ok || !out) return;
  save(() => {
    need("projects");
    let q = p;
    if (q) { const ch = Object.keys(out).filter(k => String(q[k] ?? "") !== String(out[k] ?? "")); Object.assign(q, out); recalcDue(q); audit(q, "Project details changed", ch.join(", ")); }
    else { const id = Math.max(Z().nextProjectId || 1, ...PRJ().map(x => x.id + 1)); Z().nextProjectId = id + 1; q = { id, ...out, logs: [], cases: [], bidders: [], committees: { bid: copyMembers(STAND().bid), eval: copyMembers(STAND().eval) }, reports: [], checklist: defaultChecklist(out.type), letters: [], payments: [], eots: [], activity: [], retReports: [], createdAt: Vt() }; q.ref = ref && !PRJ().some(x => x.ref === ref) ? ref : refNext("project", q); recalcDue(q); audit(q, "Project created", q.ref); PRJ().push(q); setTimeout(() => nav("#/project/" + id), 0); }
    (Z().plan || []).forEach(x => { if (x.projectId === q.id && x.id !== q.planId) x.projectId = null; if (x.id === q.planId) { x.projectId = q.id; x.status === "Planned" && (x.status = "In progress"); } });
  }, p ? "Project saved" : "Project created");
}

function PDETAIL(n, [id, tab = "summary"]) {
  const p = prj(id);
  if (!p) { n.append(o("h1", {}, "Projects"), PCNAV(""), o("div", { class: "alert err" }, "Project not found.")); return; }
  const d = daysLeft(p), w = (Z().vendors || []).find(v => v.name === p.vendor);
  n.append(o("div", { class: "pcc-banner" },
    o("div", { class: "pcc-b-main" }, o("div", { class: "pcc-b-ref" }, p.ref, " · ", p.type, " ", stChip(p.status)), p.nameDv ? o("h1", { dir: "rtl", lang: "dv" }, p.nameDv) : null, (() => { const en = p.nameEn || (p.name !== p.nameDv ? p.name : ""); return en ? o(p.nameDv ? "div" : "h1", { class: p.nameDv ? "pcc-b-en" : "" }, en) : null; })(),
      o("div", { class: "pcc-b-kv" }, o("span", {}, SV(ICO.users), " ", p.vendor || "No contractor yet"), o("span", {}, "Contract ", o("b", {}, mvr(p.contract))), p.handover ? o("span", {}, "Handover ", o("b", {}, fd(p.handover))) : null, p.due ? o("span", {}, "Due ", o("b", {}, fd(p.due))) : null)),
    o("div", { class: "pcc-b-side" }, o("div", { class: "pcc-badge t-" + cdTone(d, isDone(p)) }, o("b", { "data-due": null }, d == null ? (isDone(p) ? "✓" : "—") : d < 0 ? String(-d) : String(d)), o("span", {}, d == null ? (isDone(p) ? p.status : "No due date") : d < 0 ? "days overdue" : d === 0 ? "due today" : d === 1 ? "day left" : "days left")),
      p.status === "In retention" ? retChip(p) : null,
      o("div", { class: "pcc-b-acts" }, can("projects") ? btn("Edit", () => PEDIT2(p), "small") : null, btn("Print summary", () => printSummary(p), "small"), K.LV5() ? btn("Delete", async () => { if (await jt(`Delete ${p.ref} and everything recorded under it? Generated files stay in storage but are no longer listed.`, "Delete")) save(() => { need("projects"); Z().projects = PRJ().filter(x => x !== p); (Z().plan || []).forEach(x => { x.projectId === p.id && (x.projectId = null); }); Z().pdocs = Z().pdocs.filter(x => x.projectId !== p.id); Z().pfiles = Z().pfiles.filter(x => x.projectId !== p.id); nav("#/projects"); }, "Project deleted"); }, "small danger") : null))),
    o("div", { class: "pills pcc-subnav", role: "tablist" }, SUBTABS.map(([k, l]) => o("a", { href: `#/project/${p.id}/${k}`, class: "pill" + (k === tab ? " on" : ""), role: "tab", "aria-selected": String(k === tab) }, l, tabCount(p, k)))));
  const body = o("div", { class: "pcc-tab" }); n.append(body);
  const fn = { summary: tSummary, plan: tPlan, bid: tBid, eval: tEval, logs: tLogs, progress: tProgress, checklist: tChecklist, completion: tCompletion, retention: tRetention, letters: tLetters, payments: tPayments, files: tFiles, activity: tActivity }[tab] || tSummary;
  fn(body, p);
  requestAnimationFrame(() => { const on = n.querySelector(".pcc-subnav .on"); on && on.scrollIntoView({ block: "nearest", inline: "center" }); });
  void w;
}
function tabCount(p, k) {
  const c = { bid: Z().pdocs.filter(d => d.projectId === p.id && d.group === "Bid Committee").length, eval: (p.bidders || []).length, logs: (p.logs || []).length, progress: (p.reports || []).length, checklist: (p.checklist || []).length ? Math.round((p.checklist.filter(x => x.done).length / p.checklist.length) * 100) + "%" : 0, letters: Z().pdocs.filter(d => d.projectId === p.id && ["Letters", "Memos"].includes(d.group)).length, payments: (p.payments || []).length, files: Z().pdocs.filter(d => d.projectId === p.id).length + Z().pfiles.filter(d => d.projectId === p.id).length }[k];
  return c ? o("span", {}, String(c)) : null;
}

// ----- Summary -----
function tSummary(n, p) {
  const b = p.budgetId ? K.Kt(Z(), p.budgetId) : null, v = (Z().vendors || []).find(x => x.name === p.vendor) || {};
  const steps = [["PR raised", p.prDate || (p.prNumber ? null : null), p.prNumber], ["Iulaan", p.advertised], ["Bid opening", p.bidOpening], ["Evaluation", p.evaluation], ["Award", p.award], ["Agreement", p.agreement], ["Handover", p.handover], ["Due date", p.due], ["Completion", p.done], ["Retention end", p.retentionEnd]];
  const t = today();
  n.append(o("div", { class: "card pcc-steps-card" }, o("h3", {}, "Key dates"), o("div", { class: "pcc-steps" }, steps.map(([l, dt, extra]) => o("div", { class: "pcc-step" + (dt && dt <= t ? " done" : dt ? " next" : extra ? " done" : "") }, o("i", {}), o("b", {}, l), o("span", {}, dt ? fd(dt) : extra || "—"))))));
  const cs = (p.cases || []).map(i => Z().cases.find(c => c.id === i)).filter(Boolean);
  n.append(o("div", { class: "split stack" },
    o("div", {},
      card("Project", kvs([["Reference", p.ref], ["Name (English)", p.nameEn || p.name], ["Name (Dhivehi)", p.nameDv ? o("span", { dir: "rtl", lang: "dv" }, p.nameDv) : ""], ["Type", p.type + (p.category ? " · " + p.category : "")], ["Status", stChip(p.status)], ["Location", p.location], ["Unit / section", p.unit], ["Project officer", p.officer], ["Budget line", b && `${b.code} - ${b.description}`], ["Funding source", p.fund], ["Estimated cost", p.estimate != null ? mvr(p.estimate) : ""], ["Contract value", p.contract != null ? mvr(p.contract) : ""], ["PR number", p.prNumber], ["Iulaan no.", p.advertNo]]), p.descDv ? o("p", { dir: "rtl", lang: "dv", class: "pcc-para" }, p.descDv) : null, p.desc ? o("p", { dir: "auto", class: "pcc-para" }, p.desc) : null, p.notes ? o("p", { class: "muted small pcc-para" }, p.notes) : null),
      card("Contract period", kvs([["Site handover", fd(p.handover)], ["Duration", p.duration ? p.duration + " days" : ""], ["Due date (as signed)", fd(p.dueOriginal)], ["Extensions", extDays(p) ? extDays(p) + " days" : "None"], ["Due date now", fd(p.due)], ["Time left", cdChip(p)], ["Actual completion", fd(p.done)], ["Progress", K.PBAR(p.progress)]]), dualBar(p),
        o("h4", {}, "Extensions of time"), (p.eots || []).length ? tbl(["Approved", "Days", "Reason", "Letter ref", ""], p.eots.map(e => o("tr", {}, o("td", {}, fd(e.approved)), o("td", {}, String(e.days)), o("td", { dir: "auto" }, e.reason || ""), o("td", {}, e.letterRef || ""), o("td", {}, can("projects") ? btn("Remove", async () => { (await jt("Remove this extension? The due date moves back.", "Remove")) && save(() => { p.eots = p.eots.filter(x => x !== e); recalcDue(p); audit(p, "Extension removed", e.days + " days"); }, "Extension removed"); }, "small") : null)))) : o("p", { class: "muted" }, "No extensions granted."),
        can("projects") ? btn("Grant extension of time…", () => eotAdd(p)) : null)),
    o("div", {},
      card("Contractor", p.vendor ? kvs([["Name", p.vendor], ["Contact person", v.contact], ["Phone", v.phone], ["E-mail", v.email], ["Address", v.address], ["Registration no.", v.reg]]) : o("p", { class: "muted" }, "Not set. Award a bidder under Evaluation, or edit the project."), p.vendor && v.name ? o("a", { href: "#/vendor/" + encodeURIComponent(v.name), class: "small" }, "Open vendor →") : null),
      card("Committees", o("p", {}, `Bid Committee: ${(p.committees.bid || []).map(m => m.name).join(", ") || "not set"}`), o("p", {}, `Evaluation Committee: ${(p.committees.eval || []).map(m => m.name).join(", ") || "not set"}`)),
      card("Payments", (() => { const pt = payTotals(p); return kvs([["Contract value", mvr(p.contract)], ["Paid (net)", mvr(pt.totalPaid)], ["Balance", mvr(pt.balance)], ["Retention held", mvr(pt.retentionHeld)]]); })()),
      card("Purchase cases", cs.length ? tbl(["Request", "Status"], cs.map(c => o("tr", {}, o("td", {}, o("a", { href: "#/case/" + c.id }, K.Gt(c) || "Draft #" + c.id)), o("td", {}, K.sn(c.status))))) : o("p", { class: "muted" }, "No purchase cases linked."), linkCase(p)))));
}
function linkCase(p) {
  if (!can("projects")) return null;
  const first = c => ((c.req.items.find(x => x.particulars) || {}).particulars || ""), sel = S([["", "Choose a purchase case…"], ...Z().cases.filter(c => !(p.cases || []).includes(c.id)).map(c => [c.id, `${K.Gt(c) || "Draft #" + c.id} — ${first(c).slice(0, 50)}`])], "");
  return o("div", { class: "row", style: { marginTop: "10px", alignItems: "center" } }, o("div", { class: "grow" }, sel), btn("Link", () => save(() => { if (!sel.value) throw err("Choose a purchase case"); p.cases.push(Number(sel.value)); audit(p, "Purchase case linked"); }, "Case linked")));
}
async function eotAdd(p, fromLetter) {
  const days = N("", { min: 1 }), reason = o("textarea", { rows: 2, dir: "auto" }), ap = D(today()), ref = I(fromLetter || "", { placeholder: "Letter reference, if any" });
  const res = { ok: await form("Extension of time — " + p.ref, [["Extra days", days], ["Approved on", ap], ["Reason", reason], ["Letter ref", ref], o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, `Due date now ${fd(p.due)}. The new due date is calculated from the signed due date plus all extensions.`)], { check: () => { if (!(Number(days.value) > 0)) throw err("Type the number of days"); } }) };
  if (!res.ok) return null;
  const e = { id: uid(), days: Number(days.value), reason: reason.value.trim(), approved: ap.value, letterRef: ref.value.trim() };
  save(() => { need("projects"); p.eots.push(e); recalcDue(p); audit(p, "Extension of time granted", `${e.days} days → due ${fd(p.due)}`); }, "Extension recorded — due date is now " + fd(dAdd(p.due, e.days)));
  return e;
}

// ----- Procurement plan link -----
function tPlan(n, p) {
  const L2 = (Z().plan || []).filter(x => x.projectId === p.id || x.id === p.planId);
  n.append(card("Plan line(s) for this project", L2.length ? tbl(["Plan ID", "Item", "Type", "Qty", "Quarter", "Method", "Funding", "Estimate (MVR)", "Status", ""], L2.map(x => o("tr", {}, o("td", { class: "nowrap" }, x.pid), o("td", { dir: "auto" }, o("b", {}, x.item), x.itemDv ? o("div", { dir: "rtl", lang: "dv", class: "muted small" }, x.itemDv) : null), o("td", {}, x.type), o("td", {}, [x.qty, x.uom].filter(Boolean).join(" ")), o("td", {}, x.q ? `Q${x.q} ${x.year}` : x.year), o("td", {}, x.method || ""), o("td", {}, x.funding || ""), o("td", { class: "money" }, money(x.estimate)), o("td", {}, stChip(x.status)), o("td", {}, can("projects") ? btn("Unlink", () => save(() => { x.projectId = null; p.planId === x.id && (p.planId = null); audit(p, "Plan item unlinked", x.pid); }, "Unlinked"), "small") : null)))) : o("p", { class: "muted" }, "Not linked to the procurement plan."),
    can("projects") ? (() => { const sel = S([["", "Link a plan item…"], ...(Z().plan || []).filter(x => !x.projectId).map(x => [x.id, `${x.pid} · ${x.item}`])], ""); return o("div", { class: "row", style: { marginTop: "10px", alignItems: "center" } }, o("div", { class: "grow" }, sel), btn("Link", () => save(() => { const x = (Z().plan || []).find(k => k.id === Number(sel.value)); if (!x) throw err("Choose a plan item"); x.projectId = p.id; p.planId = p.planId || x.id; x.status === "Planned" && (x.status = "In progress"); audit(p, "Plan item linked", x.pid); }, "Linked")), o("a", { class: "btn", href: "#/plan/" + ((L2[0] || {}).year || today().slice(0, 4)), style: { textDecoration: "none" } }, "Open plan")); })() : null));
}

// ----- committees, bidders -----
function committeeCard(p, k) {
  const L2 = p.committees[k] || [], title = k === "bid" ? "Bid Committee" : "Evaluation Committee";
  return card(title + " members", L2.length ? tbl(["#", "Name", "Designation", "Role", ""], L2.map((m, i) => o("tr", {}, o("td", {}, i + 1), o("td", {}, o("div", { dir: "auto", lang: m.nameDv ? "dv" : null }, m.nameDv || m.name), m.name && m.nameDv && m.name !== m.nameDv ? o("div", { class: "muted small" }, m.name) : null), o("td", {}, o("div", { dir: "auto", lang: m.designationDv ? "dv" : null }, m.designationDv || m.designation || ""), m.designation && m.designationDv && m.designation !== m.designationDv ? o("div", { class: "muted small" }, m.designation) : null), o("td", {}, m.role || "Member", m.onLeave ? o("span", { class: "pcc-tag leave", dir: "rtl" }, m.leaveText || "ޗުއްޓީ") : null), o("td", { class: "pcc-acts" }, can("pdocs") ? [btn("Edit", () => memberEdit(p, k, m), "small"), btn("↑", () => save(() => { if (i) { L2.splice(i - 1, 0, L2.splice(i, 1)[0]); } }), "small"), btn("Remove", () => save(() => { p.committees[k] = L2.filter(x => x !== m); audit(p, title + " member removed", m.name); }, "Removed"), "small")] : null)))) : o("p", { class: "muted" }, "No members yet. Each committee usually has 3 members; the program makes one declaration / invitation per member."),
    can("pdocs") ? o("div", { class: "row", style: { marginTop: "10px", gap: "8px" } }, btn("Add member", () => memberEdit(p, k, null)), (STAND()[k] || []).length ? btn(L2.length ? "Replace with the standing committee" : "Use the standing committee", async () => { if (L2.length && !(await jt("Replace this project's members with the standing " + title + "?", "Replace"))) return; save(() => { p.committees[k] = copyMembers(STAND()[k]); audit(p, title + " set from the standing committee"); }, "Members set"); }) : null, k === "eval" && (p.committees.bid || []).length && !L2.length ? btn("Copy from Bid Committee", () => save(() => { p.committees.eval = p.committees.bid.map(m => ({ ...m, id: uid() })); }, "Copied")) : null) : null);
}
async function memberEdit(p, k, m) {
  const x = m || {}, staff = (K.STF() || []).filter(s => s.status !== "Disabled"), pick = S([["", "Pick from Staff…"], ...staff.map(s => [s.email, s.name + (s.designation ? " — " + s.designation : "")])], ""), name = I(x.name), nameDv = DVI(x.nameDv), des = I(x.designation), desDv = DVI(x.designationDv), idc = I(x.idCard || "", { placeholder: "e.g. A123456" }), off = DVI(x.officeDv || ""), lf = leaveFields(x), role = S(["Chair", "Member", "Secretary"], x.role || ((p.committees[k] || []).length ? "Member" : "Chair"));
  pick.addEventListener("change", () => { const s = staff.find(y => y.email === pick.value); if (s) { name.value = s.name; des.value = s.designation || ""; s.nameDv && (nameDv.value = s.nameDv); } });
  if (!(await form((m ? "Edit " : "Add ") + (k === "bid" ? "Bid" : "Evaluation") + " Committee member", [m ? null : ["From staff list", pick], ["Name", name], ["Name (Dhivehi)", nameDv], ["Designation", des], ["Designation (Dhivehi)", desDv], ["ID card number", idc], ["Office (Dhivehi)", off], ["Role", role], o("div", { style: { gridColumn: "1/-1" } }, lf.el)], { top: kbToggle(), check: () => { if (!name.value.trim() && !nameDv.value.trim()) throw err("Type the name"); } }))) return;
  save(() => { need("pdocs"); const v = { name: name.value.trim() || nameDv.value.trim(), nameDv: nameDv.value.trim(), designation: des.value.trim(), designationDv: desDv.value.trim(), idCard: idc.value.trim(), officeDv: off.value.trim(), role: role.value, ...lf.read() }; if (m) Object.assign(m, v); else (p.committees[k] = p.committees[k] || []).push({ id: uid(), ...v }); audit(p, "Committee member " + (m ? "changed" : "added"), v.name); }, "Saved");
}
const BIDDOCS = ["Bid form", "Business registration", "GST / TIN certificate", "Bid security", "Work plan / schedule", "Staff CVs", "Experience letters", "Bank statement"];
async function bidderEdit(p, b) {
  const x = b || {}, ven = I(x.vendor, { list: "pcc-vendors2" }), amt = MI(x.amount), val = I(x.validity, { placeholder: "e.g. 90 days" }), dur = N(x.duration, { min: 0 }), exper = N(x.experience, { min: 0, placeholder: "e.g. 3" }), tech = N(x.tech, { step: .01 }), fin = N(x.fin, { step: .01 }), tot = N(x.total, { step: .01, placeholder: "auto: technical + financial" }), rank = N(x.rank, { min: 1, placeholder: "auto" }), resp = S([["yes", "Responsive"], ["no", "Not responsive"]], x.responsive === false ? "no" : "yes"), rem = o("textarea", { rows: 2, dir: "auto" }), docs = BIDDOCS.map(d => [d, o("input", { type: "checkbox", checked: !!(x.docs || {})[d] })]);
  rem.value = x.remarks || "";
  if (!(await form(b ? "Edit bid" : "Add bid", [o("datalist", { id: "pcc-vendors2" }, K.sa().map(v => o("option", { value: v }))), ["Bidder", ven], ["Bid amount (MVR)", amt], ["Bid validity", val], ["Duration offered (days)", dur], ["Experience (number of similar works)", exper], ["Technical score", tech], ["Financial score", fin], ["Total score", tot], ["Rank", rank], ["Responsive", resp], ["Remarks", rem], o("div", { class: "pcc-docs", style: { gridColumn: "1/-1" } }, o("label", {}, "Documents submitted"), o("div", { class: "pcc-chks" }, docs.map(([d, c]) => o("label", { class: "pcc-chk" }, c, " ", d))))], { check: () => { if (!ven.value.trim()) throw err("Type the bidder"); parseMoney(amt, "Bid amount"); } }))) return;
  save(() => {
    need("pdocs");
    const nn = el => (el.value === "" ? null : Number(el.value)), v = { vendor: ven.value.trim(), amount: parseMoney(amt, "Bid amount"), validity: val.value.trim(), duration: nn(dur), experience: nn(exper), tech: nn(tech), fin: nn(fin), total: nn(tot), rank: nn(rank), responsive: resp.value === "yes", remarks: rem.value.trim(), docs: Object.fromEntries(docs.map(([d, c]) => [d, c.checked])) };
    if (v.total == null && v.tech != null && v.fin != null) v.total = Math.round((v.tech + v.fin) * 100) / 100;
    if (b) Object.assign(b, v); else p.bidders.push({ id: uid(), ...v });
    autoRank(p); audit(p, "Bid " + (b ? "changed" : "recorded"), v.vendor);
    if (!(Z().vendors || []).some(y => y.name === v.vendor)) (Z().vendors = Z().vendors || []).push({ name: v.vendor, category: (Z().vendorCats || [])[0] || "Other", status: "Active" });
  }, "Bid saved");
}
function autoRank(p) {
  const R = p.bidders.filter(b => b.responsive !== false), byScore = R.some(b => b.total != null);
  const manual = p.bidders.some(b => b.rankManual);
  if (manual) return;
  R.slice().sort((a, b) => (byScore ? (b.total ?? -1) - (a.total ?? -1) : (a.amount ?? Infinity) - (b.amount ?? Infinity))).forEach((b, i) => { b.rank = i + 1; });
  p.bidders.filter(b => b.responsive === false).forEach(b => { b.rank = null; });
}
function tBid(n, p) {
  n.append(packCard(p, "bid"), meetingsCard(p, "bid"), committeeCard(p, "bid"), docsCard(p, ["Bid Committee"], "Bid Committee documents"));
}
function tEval(n, p) {
  const B = p.bidders.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99));
  n.append(packCard(p, "eval"), meetingsCard(p, "eval"), card("Bids received", B.length ? tbl(["Rank", "Bidder", "Bid (MVR)", "Duration", "Validity", "Technical", "Financial", "Total", "Documents", "Responsive", ""], B.map(b => o("tr", { class: b.awarded ? "pcc-win" : "" }, o("td", {}, b.rank ?? "—"), o("td", { dir: "auto" }, o("b", {}, b.vendor), b.awarded ? o("span", { class: "pcc-tag win" }, "Awarded") : null, b.remarks ? o("div", { class: "muted small" }, b.remarks) : null), o("td", { class: "money" }, money(b.amount)), o("td", {}, b.duration ? b.duration + " d" : ""), o("td", {}, b.validity || ""), o("td", {}, b.tech ?? ""), o("td", {}, b.fin ?? ""), o("td", {}, o("b", {}, b.total ?? "")), o("td", { class: "small" }, Object.values(b.docs || {}).filter(Boolean).length + "/" + BIDDOCS.length), o("td", {}, b.responsive === false ? "No" : "Yes"), o("td", { class: "pcc-acts" }, can("pdocs") ? [btn("Edit", () => bidderEdit(p, b), "small"), b.awarded ? null : btn("Award", () => award(p, b), "small primary"), btn("Remove", async () => { (await jt("Remove this bid?", "Remove")) && save(() => { p.bidders = p.bidders.filter(x => x !== b); autoRank(p); audit(p, "Bid removed", b.vendor); }, "Removed"); }, "small")] : null)))) : o("p", { class: "muted" }, "No bids recorded yet."), can("pdocs") ? btn("Add bid", () => bidderEdit(p, null)) : null, o("p", { class: "muted small" }, "Rank is worked out from the total score (highest first) or, without scores, the lowest responsive bid.")), committeeCard(p, "eval"), docsCard(p, ["Evaluation Committee"], "Evaluation Committee documents"));
}
async function award(p, b) {
  if (!(await jt(`Award ${p.ref} to ${b.vendor} for ${mvr(b.amount)}? The contractor and contract value are set from this bid.`, "Award"))) return;
  save(() => { need("pdocs"); p.bidders.forEach(x => { x.awarded = x === b; }); p.vendor = b.vendor; p.contract = b.amount; b.duration && !p.duration && (p.duration = b.duration); p.award = p.award || today(); ["Planned", "Iulaan", "Advertised", "Under evaluation"].includes(p.status) && (p.status = "Awarded"); recalcDue(p); audit(p, "Awarded", `${b.vendor} · ${mvr(b.amount)}`); }, "Awarded to " + b.vendor);
}
// Generated documents of some groups, newest version first, older versions folded.
function docsCard(p, groups, title, codes) {
  const L2 = Z().pdocs.filter(d => d.projectId === p.id && (codes ? codes.includes(d.code) : groups.includes(d.group))).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  if (!L2.length) return card(title, o("p", { class: "muted" }, "Nothing generated yet."));
  const latest = new Map(); L2.forEach(d => { const k = d.code + "|" + (d.key || ""); latest.has(k) || latest.set(k, d); });
  const cur = [...latest.values()], old = L2.filter(d => !cur.includes(d));
  return card(title, docTable(cur.map(d => ({ kind: "gen", d, p })), false), old.length ? o("details", { class: "pcc-old" }, o("summary", {}, `${old.length} older version${old.length === 1 ? "" : "s"}`), docTable(old.map(d => ({ kind: "gen", d, p })), false)) : null);
}

// ----- Edit-project layouts: "cards", "tabs" or "sheet" -----
function peditLayout(style, secs) {
  const icon = d => { const sv = document.createElementNS("http://www.w3.org/2000/svg", "svg"); sv.setAttribute("viewBox", "0 0 24 24"); sv.setAttribute("class", "pcc-pe-ic"); const pa = document.createElementNS("http://www.w3.org/2000/svg", "path"); pa.setAttribute("d", d); sv.append(pa); return sv; };
  const field = x => x.sub ? o("div", { class: "pcc-pe-sub" }, x.sub) : o("div", { class: "pcc-pe-f w" + x.w }, o("label", {}, x.label), x.el, x.hint ? (typeof x.hint === "string" ? o("div", { class: "pcc-pe-hint" }, x.hint) : o("div", { class: "pcc-pe-hint" }, x.hint)) : null);
  const filled = s2 => { const els = s2.fields.filter(x => x.el).map(x => x.el.querySelector ? (x.el.matches("input,select,textarea") ? x.el : x.el.querySelector("input,select,textarea")) : null).filter(Boolean); return [els.filter(e => String(e.value || "").trim()).length, els.length]; };
  const top = o("div", { class: "pcc-pe-top" }, o("span", { class: "muted small" }, "Changes are saved when you press Save."), o("span", { class: "grow" }), kbToggle());
  if (style === "tabs") {
    const nav = o("div", { class: "pcc-pe-nav" }), panes = o("div", { class: "pcc-pe-panes" }), btns = [];
    const show = i => { btns.forEach((b, k) => b.classList.toggle("on", k === i)); [...panes.children].forEach((pn, k) => { pn.hidden = k !== i; }); };
    secs.forEach((s2, i) => {
      const cnt = o("span", { class: "pcc-pe-cnt" }), upd = () => { const [a, b] = filled(s2); cnt.textContent = a + "/" + b; cnt.classList.toggle("full", a === b && b > 0); };
      const b = o("button", { type: "button", class: "pcc-pe-tab", onclick: () => show(i) }, icon(s2.ic), o("span", { class: "grow" }, s2.t), cnt); btns.push(b); nav.append(b);
      const pane = o("div", { class: "pcc-pe-pane" }, o("h3", { class: "pcc-pe-h" }, icon(s2.ic), s2.t), s2.hint ? o("p", { class: "pcc-pe-hint" }, s2.hint) : null, o("div", { class: "pcc-pe-grid" }, s2.fields.map(field)));
      pane.addEventListener("input", upd); pane.addEventListener("change", upd); panes.append(pane); setTimeout(upd);
    });
    show(0);
    return o("div", { class: "pcc-pe pcc-pe-tabs" }, top, o("div", { class: "pcc-pe-tabwrap" }, nav, panes));
  }
  const valOf = el => { const e = el && (el.matches && el.matches("input,select,textarea") ? el : el.querySelector && el.querySelector("input,select,textarea")); if (!e) return ""; if (e.tagName === "SELECT") { const op = e.options[e.selectedIndex]; return e.value ? (op ? op.text : e.value) : ""; } return String(e.value || "").trim(); };
  const pretty = (x, v2) => (x.el && x.el.matches && x.el.matches("input[type=date]") && v2 ? fd(v2) : v2);
  if (style === "steps") {
    let cur = 0; const bar = o("div", { class: "pcc-pe-steps" }), panes = o("div", {}), back = o("button", { type: "button", class: "btn" }, "‹ Back"), next = o("button", { type: "button", class: "btn primary" }, "Next ›"), pos = o("span", { class: "muted small" });
    const dots = secs.map((s2, i) => o("button", { type: "button", class: "pcc-pe-step", onclick: () => go(i) }, o("span", { class: "pcc-pe-stepn" }, String(i + 1)), o("span", { class: "pcc-pe-stepl" }, s2.sh || s2.t)));
    bar.append(...dots);
    secs.forEach(s2 => panes.append(o("div", { class: "pcc-pe-steppane" }, o("h3", { class: "pcc-pe-h" }, o("span", { class: "pcc-pe-icb" }, icon(s2.ic)), s2.t), s2.hint ? o("p", { class: "pcc-pe-hint" }, s2.hint) : null, o("div", { class: "pcc-pe-grid" }, s2.fields.map(field)))));
    const go = i => { cur = Math.max(0, Math.min(secs.length - 1, i)); dots.forEach((d, k) => { d.classList.toggle("on", k === cur); d.classList.toggle("done", k < cur); }); [...panes.children].forEach((pn, k) => { pn.hidden = k !== cur; }); back.disabled = cur === 0; next.disabled = cur === secs.length - 1; pos.textContent = `Step ${cur + 1} of ${secs.length} — you can press Save at any step`; bar.style.setProperty("--pe-pct-n", String(cur / Math.max(1, secs.length - 1))); };
    back.onclick = () => go(cur - 1); next.onclick = () => go(cur + 1); go(0);
    return o("div", { class: "pcc-pe pcc-pe-stepper" }, top, bar, panes, o("div", { class: "pcc-pe-stepnav" }, back, pos, next));
  }
  if (style === "split") {
    const g = id => (secs.find(x => x.id === id) || { fields: [] }).fields, byLabel = (id, l) => (g(id).find(x => x.label === l) || {}).el;
    const nm = o("div", { class: "pcc-pe-sname" }), st = o("span", { class: "pcc-pe-schip" }), money = o("div", { class: "pcc-pe-smoney" }), dates = o("ol", { class: "pcc-pe-stl" }), done = o("div", { class: "pcc-pe-sdone" });
    const DL = [["proc", "Iulaan date"], ["proc", "Bid opening"], ["proc", "Evaluation date"], ["proc", "Award"], ["proc", "Agreement signed"], ["period", "Site handover"], ["period", "Due date"], ["period", "Actual completion"]];
    const upd = () => {
      nm.replaceChildren(o("div", { dir: "rtl", lang: "dv", class: "dv" }, valOf(byLabel("project", "Name in Dhivehi")) || ""), o("div", {}, valOf(byLabel("project", "Name in English")) || "Untitled project"));
      st.textContent = valOf(byLabel("project", "Status")) || "Planned";
      const est = valOf(byLabel("money", "Estimated cost (MVR)")), con = valOf(byLabel("money", "Contract value (MVR)"));
      money.replaceChildren(o("div", {}, o("span", {}, "Estimated"), o("b", {}, est ? "MVR " + est : "—")), o("div", {}, o("span", {}, "Contract"), o("b", {}, con ? "MVR " + con : "—")));
      dates.replaceChildren(...DL.map(([sid, l]) => { const v2 = valOf(byLabel(sid, l)); return o("li", { class: v2 ? "set" : "" }, o("span", {}, l), o("b", {}, v2 ? fd(v2) : "—")); }));
      const all = secs.flatMap(s2 => s2.fields.filter(x => x.el)), n = all.filter(x => valOf(x.el)).length;
      done.replaceChildren(o("div", { class: "pcc-pe-sbar" }, o("i", { style: { width: Math.round(n / all.length * 100) + "%" } })), o("span", {}, `${n} of ${all.length} fields filled`));
    };
    const side = o("aside", { class: "pcc-pe-side" }, o("div", { class: "pcc-pe-slabel" }, "Project"), nm, st, money, o("div", { class: "pcc-pe-slabel" }, "Key dates"), dates, done);
    const main = o("div", { class: "pcc-pe-main" }, secs.map(s2 => o("section", { class: "pcc-pe-msec" }, o("h3", { class: "pcc-pe-mh" }, icon(s2.ic), s2.t), s2.hint ? o("p", { class: "pcc-pe-hint" }, s2.hint) : null, o("div", { class: "pcc-pe-grid" }, s2.fields.map(field)))));
    main.addEventListener("input", upd); main.addEventListener("change", upd); setTimeout(upd);
    return o("div", { class: "pcc-pe pcc-pe-split" }, top, o("div", { class: "pcc-pe-splitwrap" }, side, main));
  }
  if (style === "accordion") {
    const items = secs.map((s2, i) => {
      const sum = o("span", { class: "pcc-pe-asum" }), cnt = o("span", { class: "pcc-pe-cnt" });
      const upd = () => { const f2 = s2.fields.filter(x => x.el), vals = f2.map(x => [x, valOf(x.el)]).filter(([, v2]) => v2); cnt.textContent = vals.length + "/" + f2.length; cnt.classList.toggle("full", vals.length === f2.length && f2.length > 0); sum.textContent = vals.slice(0, 3).map(([x, v2]) => pretty(x, v2)).join(" · ") || "Nothing filled yet"; };
      const body = s2.id === "proc" ? o("div", { class: "pcc-pe-tline" }, s2.fields.map(x => o("div", { class: "pcc-pe-tli" }, o("span", { class: "pcc-pe-tdot" }), field({ ...x, w: 12 })))) : o("div", { class: "pcc-pe-grid" }, s2.fields.map(field));
      const d = o("details", { class: "pcc-pe-acc", open: i === 0 }, o("summary", {}, o("span", { class: "pcc-pe-icb" }, icon(s2.ic)), o("span", { class: "pcc-pe-at" }, o("b", {}, s2.t), sum), cnt, o("span", { class: "pcc-pe-chev" }, "⌄")), s2.hint ? o("p", { class: "pcc-pe-hint" }, s2.hint) : null, body);
      d.addEventListener("input", upd); d.addEventListener("change", upd); setTimeout(upd);
      d.addEventListener("toggle", () => { if (d.open) items.forEach(y => y !== d && (y.open = false)); });
      return d;
    });
    return o("div", { class: "pcc-pe pcc-pe-accordion" }, top, items);
  }
  if (style === "sheet") {
    return o("div", { class: "pcc-pe pcc-pe-sheet" }, top, secs.map((s2, i) => o("section", { class: "pcc-pe-ssec" }, o("div", { class: "pcc-pe-sh" }, o("span", { class: "pcc-pe-num" }, String(i + 1)), s2.t), s2.hint ? o("p", { class: "pcc-pe-hint" }, s2.hint) : null,
      o("div", { class: "pcc-pe-rows" }, s2.fields.map(x => x.sub ? o("div", { class: "pcc-pe-sub" }, x.sub) : o("div", { class: "pcc-pe-row" + (x.w === 12 ? " full" : "") }, o("label", {}, x.label), o("div", {}, x.el, x.hint ? o("div", { class: "pcc-pe-hint" }, x.hint) : null)))))));
  }
  const jump = o("div", { class: "pcc-pe-jump" }, secs.map(s2 => o("button", { type: "button", class: "pcc-pe-chip", onclick: e => { const t = e.target.closest(".pcc-pe").querySelector("#pe-" + s2.id); t && t.scrollIntoView({ behavior: "smooth", block: "start" }); } }, icon(s2.ic), s2.sh || s2.t)));
  return o("div", { class: "pcc-pe pcc-pe-cards" }, top, jump, secs.map(s2 => o("section", { class: "pcc-pe-card", id: "pe-" + s2.id }, o("h3", { class: "pcc-pe-h" }, o("span", { class: "pcc-pe-icb" }, icon(s2.ic)), s2.t), s2.hint ? o("p", { class: "pcc-pe-hint" }, s2.hint) : null, o("div", { class: "pcc-pe-grid" }, s2.fields.map(field)))));
}
