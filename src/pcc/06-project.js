// Project form and the project detail page (banner, sub-tab bar, Summary, Plan, Bid, Evaluation).

const SUBTABS = [["summary", "Summary"], ["eval", "Bid evaluation"], ["logs", "Work Logs"], ["progress", "Progress Reports"], ["checklist", "Checklist"], ["completion", "Completion"], ["retention", "Retention"], ["letters", "Letters & Memos"], ["payments", "Payments"], ["files", "Files"], ["activity", "Activity"]];
const extDays = p => (p.eots || []).reduce((a, e) => a + (Number(e.days) || 0), 0);
function recalcDue(p) {
  if (p.handover && p.duration && !p.dueManual) p.dueOriginal = dAdd(p.handover, Number(p.duration));
  p.due = p.dueOriginal ? dAdd(p.dueOriginal, extDays(p)) : p.due || "";
  if (p.done) { p.retentionEnd = mAdd(p.done, RET_MONTHS); p.retentionDays = dDiff(p.done, p.retentionEnd); }
}

async function PEDIT2(p, type, pre, ref) {
  const v = p || pre || {}, staff = (K.STF() || []).filter(s => s.status !== "Disabled");
  const f = {
    nameEn: I(v.nameEn || (v.nameDv ? "" : v.name) || ""), nameDv: DVI(v.nameDv), type: S(PTYPES.map(x => x[1]), v.type || type || "Works"), category: I(v.category, { placeholder: "e.g. Construction, IT" }), status: S(PST, v.status || "Planned"), location: I(v.location || "", { placeholder: "e.g. Sh. Milandhoo harbour" }),
    unit: I(v.unit, { list: "pcc-units" }), officer: I(v.officer, { list: "pcc-staff" }), vendor: I(v.vendor, { list: "pcc-vendors", placeholder: "Pick from Vendors or type" }),
    budget: S([["", "— none —"], ...Z().budgets.map(b => [b.id, `${b.code} - ${b.description}`])], v.budgetId ?? ""), fund: I(v.fund, { placeholder: "Council budget, grant…" }), estimate: MI(v.estimate), contract: MI(v.contract),
    bidMeetingNo: I(v.bidMeetingNo, { placeholder: "e.g. (IUL)351-PRO/2026/BM004" }), bidMeetingDate: D(v.bidMeetingDate || v.award), bidMeetingTime: o("input", { type: "time", value: v.bidMeetingTime || "" }), evalMeetingTime: o("input", { type: "time", value: v.evalMeetingTime || "" }), bidMeetingStart: o("input", { type: "time", value: v.bidMeetingStart || v.bidMeetingTime || "" }), bidMeetingEnd: o("input", { type: "time", value: v.bidMeetingEnd || "" }), evalMeetingStart: o("input", { type: "time", value: v.evalMeetingStart || v.evalMeetingTime || v.evaluationTime || "" }), evalMeetingEnd: o("input", { type: "time", value: v.evalMeetingEnd || "" }), evaluationTime: o("input", { type: "time", value: v.evaluationTime || "" }), evalMeetingNo: I(v.evalMeetingNo, { placeholder: "e.g. (IUL)351-PRO/2026/EM002" }), evalMeetingDate: D(v.evalMeetingDate || v.evaluation),
    prNumber: I(v.prNumber), advertNo: I(v.advertNo), advertised: D(v.advertised), bidOpening: D(v.bidOpening), evaluation: D(v.evaluation), award: D(v.award), agreement: D(v.agreement), agreementNo: I(v.agreementNo || "", { placeholder: "e.g. (AGR)284-A/PRIV/2026/22" }), handover: D(v.handover),
    duration: N(v.duration, { min: 0, placeholder: "days" }), penalty: MI(v.penaltyPerDay), due: D(v.dueOriginal || v.due), done: D(v.done), progress: N(v.progress ?? 0, { min: 0, max: 100, step: 1 }),
    retentionPct: N(v.retentionPct ?? "", { min: 0, max: 100, step: .5, placeholder: "e.g. 5" }), retentionDays: o("input", { readonly: true, tabindex: -1, class: "pcc-auto", value: v.done ? `${dDiff(v.done, mAdd(v.done, RET_MONTHS))} days · ${fd(v.done)} → ${fd(mAdd(v.done, RET_MONTHS))}` : `${RET_MONTHS} months from the completion date (automatic)` }),
    plan: S([["", "— not linked —"], ...(Z().plan || []).filter(x => (!x.projectId || x.projectId === v.id) && (x.status !== "Cancelled" || x.id === v.planId)).map(x => [x.id, `${x.procNo || x.pid} · ${planName(x)}`])], v.planId ?? ""),
    unplanned: DVI(v.unplannedReason || ""), replaces: S([["", "— none —"], ...(Z().plan || []).filter(x => x.status === "Cancelled").map(x => [x.id, `${x.procNo || x.pid} · ${planName(x)}`])], v.replacesPlanId ?? ""),
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
  const meet = (k, l, kind) => [{ sub: l }, F("Meeting number", withBtn(f[k + "MeetingNo"], nextBtn(k, kind)), 12, "Empty: the latest meeting recorded for this project"), F(k === "bid" ? "Date (award decision)" : "Date (evaluation)", f[k + "MeetingDate"], 4), F("Started at", f[k + "MeetingStart"], 4), F("Ended at", f[k + "MeetingEnd"], 4)];
  const prSync = () => { const x = (Z().plan || []).find(k => String(k.id) === f.plan.value); if (x && (x.procNo || x.pid)) { f.prNumber.value = x.procNo || x.pid; f.prNumber.readOnly = true; f.prNumber.classList.add("pcc-ro"); } else { f.prNumber.readOnly = false; f.prNumber.classList.remove("pcc-ro"); } };
  f.plan.addEventListener("change", prSync); prSync();
  const secs = [
    { id: "project", t: "Project", ic: "M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4", fields: [F("Name in English", f.nameEn, 6), F("Name in Dhivehi", f.nameDv, 6), F("Type", f.type), F("Category", f.category), F("Status", f.status), F("Location / island", f.location), F("Linked plan item", f.plan, 12)] },
    { id: "money", t: "Money", ic: "M12 3v18M17 7.5C17 5.6 14.8 5 12 5s-5 1-5 3 2 3 5 3.5 5 1.5 5 3.5-2.2 3-5 3-5-.6-5-2.5", fields: [F("Estimated cost (MVR)", f.estimate), F("Contract value (MVR)", f.contract), F("Contractor / supplier", f.vendor)] },
    { id: "proc", t: "Procurement", ic: "M9 4h6l1 3H8l1-3zM6 7h12v13H6zM9 12h6M9 16h4", hint: "The evaluation and award dates are taken from the Evaluation and Bid Committee meetings (section 4).", fields: [F("PR number", f.prNumber, 4, "Taken from the linked procurement plan item"), F("Iulaan number", f.advertNo), F("Iulaan date", f.advertised), F("Bid opening", f.bidOpening), F("Agreement signed", f.agreement), F("Agreement number", f.agreementNo)] },
    { id: "meet", t: "Committee meetings", sh: "Meetings", ic: "M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5m0-5c1-.6 2-1 2-1 3 0 6 2 6 5", hint: "Filled from the Committee meetings register. To change them, open the meeting.", fields: [meetView(p, "bid"), meetView(p, "eval")] },
    { id: "period", t: "Contract period", sh: "Period", ic: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", fields: [F("Site handover", f.handover), F("Duration (days)", f.duration), F("Due date", f.due, 4, hint), F("Actual completion", f.done), F("Physical progress (%)", f.progress), F("Delay penalty per day (MVR)", f.penalty)] },
    { id: "ret", t: "Retention", ic: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z", fields: [F("Retention (%)", f.retentionPct, 6), F("Retention period (days)", f.retentionDays, 6)] },
    Object.keys(xf).length ? { id: "own", t: "Other template fields", sh: "Other fields", ic: "M8 4H6v16h2M16 4h2v16h-2", hint: "Placeholders in your templates that the program has no field for. Type the value for this project; it fills every template that uses it.", fields: Object.keys(xf).map(k => F([(ownOf(k) || {}).label || "", o("code", {}, "{" + k + "}")], xf[k], 4, xtags[k].length ? "In " + xtags[k].join(", ") : "Not in a template yet")) } : null,
    { id: "scope", t: "Scope and notes", sh: "Scope", ic: "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h6", fields: [F("Scope in Dhivehi", f.descDv, 12), F("Scope in English", f.desc, 12), F("Notes", f.notes, 12)] }
  ].filter(Boolean);
  const ok = await Mt(p ? "Edit project " + (p.ref || "") : "New project", [...lists, peditLayout(secs)],
  [{ label: "Cancel", value: !1 }, { label: p ? "Save" : "Create project", primary: !0, value: !0, onClick: () => {
    try {
      if (!f.nameEn.value.trim() && !f.nameDv.value.trim()) throw err("Type the project name in English or Dhivehi");
      const pr = Number(f.progress.value || 0); if (!(pr >= 0 && pr <= 100)) throw err("Progress must be between 0 and 100");
      if (f.handover.value && f.due.value && f.due.value < f.handover.value) throw err("The due date is before the handover date");
      const nn = el => (el.value === "" ? null : Number(el.value));
      out = { nameEn: f.nameEn.value.trim(), nameDv: f.nameDv.value.trim(), name: f.nameEn.value.trim() || f.nameDv.value.trim(), type: f.type.value, category: f.category.value.trim(), status: f.status.value, location: f.location.value.trim(), unit: f.unit.value.trim(), officer: f.officer.value.trim(), vendor: f.vendor.value.trim(), budgetId: f.budget.value ? Number(f.budget.value) : null, fund: f.fund.value.trim(), estimate: parseMoney(f.estimate, "Estimated cost"), contract: parseMoney(f.contract, "Contract value"), bidMeetingNo: f.bidMeetingNo.value.trim(), bidMeetingDate: f.bidMeetingDate.value, bidMeetingTime: f.bidMeetingStart.value, evalMeetingTime: f.evalMeetingStart.value, bidMeetingStart: f.bidMeetingStart.value, bidMeetingEnd: f.bidMeetingEnd.value, evalMeetingStart: f.evalMeetingStart.value, evalMeetingEnd: f.evalMeetingEnd.value, evaluationTime: f.evalMeetingStart.value, evalMeetingNo: f.evalMeetingNo.value.trim(), evalMeetingDate: f.evalMeetingDate.value, prNumber: f.prNumber.value.trim(), advertNo: f.advertNo.value.trim(), advertised: f.advertised.value, bidOpening: f.bidOpening.value, evaluation: f.evalMeetingDate.value, award: f.bidMeetingDate.value, agreement: f.agreement.value, agreementNo: f.agreementNo.value.trim(), handover: f.handover.value, duration: nn(f.duration), penaltyPerDay: parseMoney(f.penalty, "Delay penalty per day") || null, dueOriginal: f.due.value, dueManual: manual, done: f.done.value, progress: pr, retentionPct: nn(f.retentionPct),  planId: f.plan.value ? Number(f.plan.value) : null, unplannedReason: f.unplanned.value.trim(), replacesPlanId: f.replaces.value ? Number(f.replaces.value) : null, descDv: f.descDv.value.trim(), desc: f.desc.value.trim(), notes: f.notes.value.trim() };
      if (Object.keys(xf).length) { out.fields = Object.assign({}, v.fields || {}); Object.entries(xf).forEach(([k, el]) => { const x = el.value.trim(); x ? (out.fields[k] = x) : delete out.fields[k]; }); }
      if (out.status === "Completed" || out.status === "In retention") { out.progress = 100; out.done = out.done || today(); }
      if (p) ["bidMeetingNo", "bidMeetingDate", "bidMeetingTime", "bidMeetingStart", "bidMeetingEnd", "evalMeetingNo", "evalMeetingDate", "evalMeetingTime", "evalMeetingStart", "evalMeetingEnd", "evaluation", "evaluationTime", "award"].forEach(k => delete out[k]);
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
    o("div", { class: "pcc-b-main" }, o("div", { class: "pcc-b-ref" }, p.ref, " · ", p.type, " ", stChip(p.status), " ", planChip(p), roundChip(p)), p.nameDv ? o("h1", { dir: "rtl", lang: "dv" }, p.nameDv) : null, (() => { const en = p.nameEn || (p.name !== p.nameDv ? p.name : ""); return en ? o(p.nameDv ? "div" : "h1", { class: p.nameDv ? "pcc-b-en" : "" }, en) : null; })(),
      o("div", { class: "pcc-b-kv" }, o("span", {}, SV(ICO.users), " ", p.vendor || "No contractor yet"), o("span", {}, "Contract ", o("b", {}, mvr(p.contract))), p.handover ? o("span", {}, "Handover ", o("b", {}, fd(p.handover))) : null, p.due ? o("span", {}, "Due ", o("b", {}, fd(p.due))) : null)),
    o("div", { class: "pcc-b-side" }, o("div", { class: "pcc-badge t-" + cdTone(d, isDone(p)) }, o("b", { "data-due": null }, d == null ? (isDone(p) ? "✓" : "—") : d < 0 ? String(-d) : String(d)), o("span", {}, d == null ? (isDone(p) ? p.status : "No due date") : d < 0 ? "days overdue" : d === 0 ? "due today" : d === 1 ? "day left" : "days left")),
      p.status === "In retention" ? retChip(p) : null,
      o("div", { class: "pcc-b-acts" }, can("projects") ? btn("Edit", () => PEDIT2(p), "small") : null, btn("Print summary", () => printSummary(p), "small"), K.LV5() ? btn("Delete", async () => { if (await jt(`Delete ${p.ref} and everything recorded under it? Generated files stay in storage but are no longer listed.`, "Delete")) save(() => { need("projects"); Z().projects = PRJ().filter(x => x !== p); (Z().plan || []).forEach(x => { x.projectId === p.id && (x.projectId = null); }); Z().pdocs = Z().pdocs.filter(x => x.projectId !== p.id); Z().pfiles = Z().pfiles.filter(x => x.projectId !== p.id); nav("#/projects"); }, "Project deleted"); }, "small danger") : null))),
    (() => { const it = ([k, l]) => { const a = o("a", { href: `#/project/${p.id}/${k}`, class: "pnv-i" + (k === tab ? " on" : ""), role: "tab", "aria-selected": String(k === tab) }); a.append(nvIco(k), o("span", { class: "pnv-l" }, l)); const c = tabCount(p, k); c && (c.className = "pnv-n", a.append(c)); return a; };
      const G = [["Project work", ["summary", "eval", "logs", "progress", "checklist", "completion", "retention"]], ["Records", ["letters", "payments", "files", "activity"]]];
      return o("nav", { class: "pnv pnv-a pcc-subnav", role: "tablist" }, G.map(([cap, ks]) => o("div", { class: "pnv-grp" }, o("span", { class: "pnv-cap" }, cap), o("div", { class: "pnv-seg" }, SUBTABS.filter(t => ks.includes(t[0])).map(it))))); })());
  const body = o("div", { class: "pcc-tab" }); n.append(body);
  const fn = { summary: tSummary, eval: tEval, logs: tLogs, progress: tProgress, checklist: tChecklist, completion: tCompletion, retention: tRetention, letters: tLetters, payments: tPayments, files: tFiles, activity: tActivity }[tab] || tSummary;
  fn(body, p);
  requestAnimationFrame(() => { const on = n.querySelector(".pcc-subnav .on"); on && on.scrollIntoView({ block: "nearest", inline: "center" }); });
  void w;
}
function tabCount(p, k) {
  const c = { bid: Z().pdocs.filter(d => d.projectId === p.id && d.group === "Bid Committee").length, eval: (p.bidders || []).length, logs: (p.logs || []).length, progress: (p.reports || []).length, checklist: (p.checklist || []).length ? Math.round((p.checklist.filter(x => x.done).length / p.checklist.length) * 100) + "%" : 0, letters: Z().pdocs.filter(d => d.projectId === p.id && ["Letters", "Memos"].includes(d.group)).length, payments: (p.payments || []).length, files: Z().pdocs.filter(d => d.projectId === p.id).length + Z().pfiles.filter(d => d.projectId === p.id).length }[k];
  return c ? o("span", {}, String(c)) : null;
}

// ----- Summary -----
// Summary detail cards: money boxes and labelled tiles.
const has = v => !(v == null || v === "" || v === "—");
function psumData(p) {
  const b = p.budgetId ? K.Kt(Z(), p.budgetId) : null, pt = payTotals(p), plan = (Z().plan || []).find(x => x.id === p.planId || x.projectId === p.id);
  return {
    id: [["Reference", p.ref, "ref"], ["Type", p.type + (p.category ? " · " + p.category : "")], ["Status", stChip(p.status)], ["Plan", planChip(p)], ["Location", p.location], ["Unit / section", p.unit, "opt"], ["Project officer", p.officer, "opt"], ["Budget line", b && `${b.code} - ${b.description}`, "opt"], ["Funding source", p.fund || (plan && plan.funding)]],
    proc: [["PR number", p.prNumber], ["Iulaan no.", p.advertNo], ["Iulaan date", fd(p.advertised)], ["Bid opening", fd(p.bidOpening)], ["Method", plan && plan.method]],
    money: [["Estimated cost", p.estimate], ["Contract value", p.contract], ["Paid (net)", pt.totalPaid], ["Balance", pt.balance]],
    period: [["Site handover", fd(p.handover)], ["Duration", p.duration ? p.duration + " days" : ""], ["Due date (as signed)", fd(p.dueOriginal)], ["Extensions", extDays(p) ? extDays(p) + " days" : "None"], ["Due date now", fd(p.due)], ["Actual completion", fd(p.done)]]
  };
}
const psMoney = v => (v == null ? o("span", { class: "muted" }, "—") : o("span", {}, ht(v), o("small", {}, " MVR")));
function psumProject(p, V) {
  const D = psumData(p), names = o("div", { class: "ps-names" }, p.nameDv ? o("div", { class: "ps-dv", dir: "rtl", lang: "dv" }, p.nameDv) : null, (p.nameEn || (!p.nameDv && p.name)) ? o("div", { class: "ps-en" }, p.nameEn || p.name) : null);
  const rows = L => L.filter(([, v, f]) => f !== "opt" || has(v));
  const desc = [p.descDv ? o("p", { dir: "rtl", lang: "dv", class: "pcc-para" }, p.descDv) : null, p.desc ? o("p", { dir: "auto", class: "pcc-para" }, p.desc) : null, p.notes ? o("p", { class: "muted small pcc-para" }, p.notes) : null];
  {
    const tile = ([l, v, f]) => o("div", { class: "ps-tile" + (f === "ref" ? " ref" : "") }, o("span", {}, l), o("b", { dir: "auto" }, has(v) ? v : o("i", { class: "muted" }, "Not set")));
    return o("div", { class: "card ps-a" },
      o("div", { class: "ps-money" }, D.money.map(([l, v], i) => o("div", { class: "ps-m m" + i }, o("span", {}, l), o("b", {}, psMoney(v))))),
      o("h4", {}, "Details"), o("div", { class: "ps-tiles" }, rows(D.id).map(tile)), o("h4", {}, "Procurement"), o("div", { class: "ps-tiles" }, rows(D.proc).map(tile)), ...desc);
  }
}
function psumPeriod(p, V) {
  const D = psumData(p);
  const eot = [o("h4", {}, "Extensions of time"), (p.eots || []).length ? tbl(["Approved", "Days", "Reason", "Letter ref", ""], p.eots.map(e => o("tr", {}, o("td", {}, fd(e.approved)), o("td", {}, String(e.days)), o("td", { dir: "auto" }, e.reason || ""), o("td", {}, e.letterRef || ""), o("td", {}, can("projects") ? btn("Remove", async () => { (await jt("Remove this extension? The due date moves back.", "Remove")) && save(() => { p.eots = p.eots.filter(x => x !== e); recalcDue(p); audit(p, "Extension removed", e.days + " days"); }, "Extension removed"); }, "small") : null)))) : o("p", { class: "muted" }, "No extensions granted."), can("projects") ? btn("Grant extension of time…", () => eotAdd(p)) : null];
  const cls = "ps-a";
  const L = [...D.period, ["Time left", cdChip(p)]];
  const body = o("div", { class: "ps-tiles" }, L.map(([l, v]) => o("div", { class: "ps-tile" }, o("span", {}, l), o("b", {}, has(v) ? v : "—"))));
  return o("div", { class: "card " + cls }, o("h3", {}, "Contract period"), body, dualBar(p), ...eot);
}
function psumBox(V, title, ic, L, extra) {
  return o("div", { class: "card ps-a" }, o("h3", {}, title), o("div", { class: "ps-tiles" + (ic === "meet" ? " wide" : "") }, L.map(([l, v]) => o("div", { class: "ps-tile" }, o("span", {}, l), o("b", { dir: "auto" }, has(v) ? v : o("i", { class: "muted" }, "Not set"))))), ...(extra || []));
}
// Committees card: numbered member lists (names aligned to the right, Chair / On leave tags to the left)
// and the project's meeting from the Committee meetings register.
function commView(p) {
  const K2 = [["bid", "Bid Committee", "#0f766e"], ["eval", "Evaluation Committee", "#7c3aed"]];
  const meetOf = k => MEETS().filter(m => m.kind === k && mItems(m).some(it => it.projectId === p.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const meetLine = (k, m) => m ? o("div", { class: "pcm-meet" }, nvIco("meet"), o("b", { dir: "ltr" }, m.ref), mChip(k, (mItems(m).find(it => it.projectId === p.id) || {}).type), o("span", {}, fd(m.date) + ((m.start || m.time) ? " · " + (m.start || m.time) : ""))) : o("div", { class: "pcm-meet none" }, nvIco("meet"), o("span", {}, "No meeting recorded yet"));
  const role = m => /chair/i.test(m.role || "") ? o("span", { class: "pcm-role" }, "Chair") : null;
  const leave = m => m.onLeave ? o("span", { class: "pcm-leave" }, "On leave") : null;
  const col = ([k, t, c]) => {
    const L = (p.committees[k] || []).slice().sort((a, b) => (/chair/i.test(b.role || "") - /chair/i.test(a.role || ""))), mt = meetOf(k);
    const head = o("div", { class: "pcm-h" }, o("span", { class: "pcm-dot" }), o("b", {}, t), o("span", { class: "pcm-n" }, L.length + " members"));
    const body = o("div", { class: "pcm-list" }, L.map((m, i) => o("div", { class: "pcm-row" }, o("span", { class: "pcm-no" }, i + 1), o("div", { class: "pcm-who" }, o("b", { dir: "rtl", lang: "dv" }, noTitle(m.nameDv || m.name || "")), o("span", { dir: "rtl", lang: "dv" }, m.designationDv || m.designation || "")), o("span", { class: "pcm-tags" }, role(m), leave(m)))));
    const el = o("div", { class: "pcm-col" }, head, L.length ? body : o("p", { class: "muted small" }, "No members set."), meetLine(k, mt)); el.style.setProperty("--c", c); return el;
  };
  return o("div", { class: "card pcm" }, o("h3", {}, "Committees"), o("div", { class: "pcm-cols" }, K2.map(col)));
}
function tSummary(n, p) {
  const b = p.budgetId ? K.Kt(Z(), p.budgetId) : null, v = (Z().vendors || []).find(x => x.name === p.vendor) || {};
  const steps = [["PR raised", p.prDate || (p.prNumber ? null : null), p.prNumber], ["Iulaan", p.advertised], ["Bid opening", p.bidOpening], ["Evaluation", p.evaluation], ["Award", p.award], ["Agreement", p.agreement], ["Handover", p.handover], ["Due date", p.due], ["Completion", p.done], ["Retention end", p.retentionEnd]];
  const t = today();
  n.append(o("div", { class: "card pcc-steps-card" }, o("h3", {}, "Key dates"), o("div", { class: "pcc-steps" }, steps.map(([l, dt, extra]) => o("div", { class: "pcc-step" + (dt && dt <= t ? " done" : dt ? " next" : extra ? " done" : "") }, o("i", {}), o("b", {}, l), o("span", {}, dt ? fd(dt) : extra || "—"))))));
  const cs = (p.cases || []).map(i => Z().cases.find(c => c.id === i)).filter(Boolean);
  n.append(o("div", { class: "split stack" },
    o("div", {}, psumProject(p, "A"), psumPeriod(p, "A")),
    (() => { const V = "A", pt = payTotals(p), mn = k => (p.committees[k] || []).map(m => m.nameDv || m.name).filter(Boolean).join("، ");
      return o("div", {}, psumBox(V, "Contractor", "cons", [["Name", p.vendor], ["Contact person", v.contact], ["Phone", v.phone], ["E-mail", v.email], ["Address", v.address], ["Registration no.", v.reg]], p.vendor && v.name ? [o("a", { href: "#/vendor/" + encodeURIComponent(v.name), class: "small" }, "Open vendor →")] : []),
        psumBox(V, "Payments", "payments", [["Contract value", psMoney(p.contract)], ["Paid (net)", psMoney(pt.totalPaid)], ["Balance", psMoney(pt.balance)], ["Retention held", psMoney(pt.retentionHeld)]]),
        commView(p),
        card("Purchase cases", cs.length ? tbl(["Request", "Status"], cs.map(c => o("tr", {}, o("td", {}, o("a", { href: "#/case/" + c.id }, K.Gt(c) || "Draft #" + c.id)), o("td", {}, K.sn(c.status))))) : o("p", { class: "muted" }, "No purchase cases linked."), linkCase(p))); })()));
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
// A small Excel file built in the browser: a title, a coloured heading row, data rows, column widths
// and optional Yes/No drop-downs. Used for the bids template.
async function xlsxSimple({ sheet = "Sheet1", title = [], head = [], rows = [], widths = [], yesNo = [], rtl = false, font = "Calibri", colStyle = null, foot = [], footSpread = 1 }) {
  const Z2 = new (LIB().PizZip)(), X = s2 => String(s2 ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const col = n => { let s2 = ""; n++; while (n) { const m = (n - 1) % 26; s2 = String.fromCharCode(65 + m) + s2; n = Math.floor((n - 1) / 26); } return s2; };
  const cell = (r, c, v, st) => v === "" || v == null ? `<c r="${col(c)}${r}" s="${st}"/>` : typeof v === "number" ? `<c r="${col(c)}${r}" s="${st}"><v>${v}</v></c>` : `<c r="${col(c)}${r}" s="${st}" t="inlineStr"><is><t xml:space="preserve">${X(v)}</t></is></c>`;
  let r = 0, xml = "";
  title.forEach((t, i) => { r++; xml += `<row r="${r}">${cell(r, 0, t, i ? 2 : 1)}</row>`; });
  r++; const hr = ++r; xml += `<row r="${hr}" ht="${head.some(h => /\n/.test(h)) ? 46 : 30}" customHeight="1">${head.map((h, c) => cell(hr, c, h, 3)).join("")}</row>`;
  rows.forEach(R => { r++; xml += `<row r="${r}">${head.map((_, c) => cell(r, c, R[c], colStyle ? colStyle[c] || 4 : c === 1 ? 5 : 4)).join("")}</row>`; });
  foot.forEach(F => { r++; xml += `<row r="${r}">${(F || []).map((v, k) => cell(r, 1 + k * footSpread, v, 0)).join("")}</row>`; });
  const last = Math.max(hr + rows.length, hr + 30);
  const dv = yesNo.length ? `<dataValidations count="${yesNo.length}">${yesNo.map(c => `<dataValidation type="list" allowBlank="1" sqref="${col(c)}${hr + 1}:${col(c)}${last}"><formula1>"Yes,No"</formula1></dataValidation>`).join("")}</dataValidations>` : "";
  Z2.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`);
  Z2.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  Z2.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${X(sheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  Z2.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  Z2.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="4"><font><sz val="11"/><name val="${font}"/></font><font><b/><sz val="14"/><color rgb="FF0F766E"/><name val="${font}"/></font><font><sz val="10"/><color rgb="FF64748B"/><name val="${font}"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="${font}"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center" horizontal="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="2" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs></styleSheet>`);
  Z2.file("xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0"${rtl ? ' rightToLeft="1"' : ""}><pane ySplit="${hr}" topLeftCell="A${hr + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${xml}</sheetData>${dv}<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`);
  return Z2.generate({ type: "uint8array", compression: "DEFLATE" });
}
// Bids are scored with the project's evaluation criteria, so the criteria come first.
const critHas = (p, t) => critsOf(p).some(c => c.type === t);
function needCrit(p) {
  if (critsOf(p).length) return false;
  xt("Set the evaluation criteria first (e.g. Price 75%, Duration 15%, Experience 10%), then add the bids", "err");
  can("pdocs") && critEdit(p);
  return true;
}
// Bid columns for this project: always bidder and amount; the others only when a criterion uses them.
function bidFields(p) {
  const L = [["vendor", "Bidder name", 34], ["amount", "Bid amount (MVR)", 18]];
  critHas(p, "duration") && L.push(["duration", "Duration (days)", 14]);
  critHas(p, "experience") && L.push(["experience", "Experience (similar works)", 16]);
  critHas(p, "technical") && L.push(["tech", "Technical score", 14]);
  critHas(p, "financial") && L.push(["fin", "Financial score", 14]);
  critsOf(p).filter(c => c.type === "other").forEach(c => L.push(["sc:" + c.key, `${c.label} (points, out of ${c.weight})`, 16]));
  return L;
}
const bidGet = (b, k) => (k.startsWith("sc:") ? (b.scores || {})[k.slice(3)] : k === "amount" ? (b.amount == null ? null : b.amount / 100) : b[k]);
async function bidsTemplate(p, docNames) {
  if (needCrit(p)) return;
  const B = (p.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99)), FL = bidFields(p), DN = docNames || docsOf(p);
  const RQ = reqDocsOf(p), head = [...FL.map(f => f[1]), "Responsive (Yes/No)", ...DN.map(d => RQ.includes(d) ? d + " *" : d), "Remarks"];
  const rows = B.length ? B.map(b => [...FL.map(([k]) => bidGet(b, k) ?? ""), b.responsive === false ? "No" : "Yes", ...DN.map(d => (b.docs || {})[d] ? "Yes" : "No"), b.remarks || ""]) : Array.from({ length: 10 }, () => [...FL.map(() => ""), "Yes", ...DN.map(() => "No"), ""]);
  const u8 = await xlsxSimple({ sheet: "Bids", title: [`Bids received — ${p.ref}`, (p.nameDv || p.name || "") + (p.advertNo ? "  ·  Iulaan " + p.advertNo : "") + "  ·  " + critLine(p)], head, rows, widths: [...FL.map(f => f[2]), 16, ...DN.map(() => 14), 30], yesNo: [FL.length, ...DN.map((_, i) => FL.length + 1 + i)] });
  ii(new Blob([u8], { type: MIME.xlsx }), `Bids_${safeName(p.ref)}.xlsx`);
}
// The documents checked for each bid. Each project keeps its own list (renamed, added or removed in
// the bids table); the default is the standard list.
const docsOf = p => (Array.isArray(p.bidDocs) && p.bidDocs.length ? p.bidDocs : BIDDOCS).slice();
// Compulsory documents: a bid missing any of them is not responsive.
const reqDocsOf = p => (Array.isArray(p.bidDocsReq) ? p.bidDocsReq : []).filter(d => docsOf(p).includes(d));
const docsComplete = (p, docs) => reqDocsOf(p).every(d => (docs || {})[d]);
// Amounts in accounting format: 966,600.00
const fmtAcc = v => { const t = String(v ?? "").replace(/[,\s]/g, "").replace(/^(MVR|Rf\.?|ރ\.)/i, ""); if (t === "") return ""; const n = Number(t); return Number.isNaN(n) ? String(v) : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const docKey = s2 => String(s2 || "").toLowerCase().replace(/\s+/g, " ").trim();

// Bids received for a project, as one table: existing bids are shown and can be changed, new rows
// added, typed, pasted or imported from Excel (a bidder already in the table is updated, not added
// twice). One tick-box column per document, with editable headings and tick / untick all.
async function bidsBulk(p) {
  if (needCrit(p)) return;
  // Headings in Dhivehi (the document headings come from the template as written).
  const SHORT = { vendor: ["ބިޑް ހުށައެޅި ފަރާތް", "190px"], amount: ["ހުށައެޅި އަގު (ރ.)", "120px"], duration: ["މުއްދަތު (ދުވަސް)", "70px"], validity: ["މުއްދަތު", "86px"], experience: ["ތަޖުރިބާ (ލިޔުން)", "76px"], tech: ["ޓެކްނިކަލް", "64px"], fin: ["ފައިނޭންޝަލް", "64px"] };
  const COLS = bidFields(p).map(([k, l]) => { const oc = k.startsWith("sc:") ? critsOf(p).find(c => "sc:" + c.key === k) : null; return [k, SHORT[k] ? SHORT[k][0] : oc ? (oc.labelDv || oc.label) + ` (${oc.weight} އިން)` : l, SHORT[k] ? SHORT[k][1] : "90px"]; });
  const REQ0 = new Set(reqDocsOf(p));
  let DOCS = docsOf(p).map(n => ({ id: uid(), name: n, orig: n, req: REQ0.has(n) }));
  // Responsive follows the compulsory documents: ticked only when all of them are ticked.
  const autoResp = r => { const R2 = DOCS.filter(d => d.req); if (!R2.length) return; r.resp.checked = r.manualOff ? false : R2.every(d => r.dk[d.id] && r.dk[d.id].checked); r.tr && r.tr.classList.toggle("pcc-bk-dq", !r.resp.checked); };
  const autoAll = () => rows.forEach(autoResp);
  const head = o("thead", {}), body = o("tbody", {}), rows = [];
  const renum = () => [...body.children].forEach((t, i) => { t.firstChild.textContent = String(i + 1); });
  const docCell = (r, d) => { const cb = r.dk[d.id] || (r.dk[d.id] = o("input", { type: "checkbox", checked: !!r.init[d.orig] || !!r.init[d.name] })); cb.onchange = () => autoResp(r); return o("td", { class: "pcc-bk-c" + (d.req ? " req" : "") }, cb); };
  const rowEl = r => { const tr = o("tr", {}, o("td", { class: "muted small" }, ""), COLS.map(([k]) => o("td", {}, r.els[k])), o("td", { class: "pcc-bk-c" }, r.resp), DOCS.map(d => docCell(r, d)), o("td", {}, btn("✕", () => { r.tr.remove(); rows.splice(rows.indexOf(r), 1); renum(); }, "small"))); r.tr = tr; return tr; };
  const addRow = (vals = {}, b = null) => {
    const els = {}; COLS.forEach(([k, , w]) => { els[k] = k === "vendor" ? I(vals[k] || "", { list: "pcc-vendors3", style: { width: w } }) : k === "amount" ? (() => { const e = MI(""); e.value = fmtAcc(vals[k]); e.style.width = w; e.classList.add("pcc-acc"); e.addEventListener("blur", () => { e.value = fmtAcc(e.value); }); return e; })() : I(vals[k] ?? "", { style: { width: w }, inputmode: k === "validity" ? "text" : "decimal" }); });
    const r = { b, els, resp: o("input", { type: "checkbox", checked: vals.responsive !== false }), dk: {}, init: vals.docs || {}, remarks: vals.remarks ?? (b ? b.remarks || "" : ""), manualOff: vals.responsive === false && !!vals.dq };
    r.resp.onchange = () => { r.manualOff = !r.resp.checked && DOCS.filter(d => d.req).every(d => r.dk[d.id] && r.dk[d.id].checked); r.tr && r.tr.classList.toggle("pcc-bk-dq", !r.resp.checked); };
    if (vals.alldocs) DOCS.forEach(d => { r.init[d.name] = true; });
    rows.push(r); body.append(rowEl(r)); renum(); if (vals.vendor || b) autoResp(r); return r;
  };
  const fill = (r, vals) => { COLS.forEach(([k]) => { const v = vals[k]; if (v != null && String(v).trim() !== "") r.els[k].value = k === "amount" ? fmtAcc(v) : String(v); }); vals.responsive != null && (r.resp.checked = vals.responsive); vals.remarks && (r.remarks = vals.remarks);
    DOCS.forEach(d => { const v = (vals.docs || {})[d.name]; if (v != null) (r.dk[d.id] || (r.dk[d.id] = o("input", { type: "checkbox" }))).checked = !!v; else if (vals.alldocs != null && r.dk[d.id]) r.dk[d.id].checked = !!vals.alldocs; }); };
  const findRow = name => rows.find(r => docKey(r.els.vendor.value) === docKey(name));
  const dropEmpty = () => rows.filter(r => !r.b && !Object.values(r.els).some(e => e.value.trim())).forEach(r => { r.tr.remove(); rows.splice(rows.indexOf(r), 1); });
  // Add new rows or update the rows of bidders already in the table.
  const merge = list => { dropEmpty(); let up = 0, add = 0; list.forEach(v => { const r = findRow(v.vendor); if (r) { fill(r, v); v.responsive === false && v.dq && (r.manualOff = true); autoResp(r); up++; } else { addRow(v); add++; } }); renum(); return [up, add]; };
  // Heading: tick-all boxes, and document names that can be renamed or removed.
  const tickAll = get => { const cb = o("input", { type: "checkbox", title: "Tick / untick all" }); cb.onchange = () => { rows.forEach(r => { const x = get(r); x && (x.checked = cb.checked); x && x === r.resp && (r.manualOff = false); }); autoAll(); }; return cb; };
  const drawHead = () => head.replaceChildren(o("tr", {}, o("th", {}, "#"), COLS.map(([, l]) => o("th", { class: "pcc-bk-dvh", lang: "dv", dir: "rtl" }, l)), o("th", { class: "pcc-bk-h" }, o("div", { class: "pcc-bk-lab pcc-bk-dvh", lang: "dv", dir: "rtl" }, "ޝަރުތު ފުރިހަމަ")),
    DOCS.map(d => o("th", { class: "pcc-bk-h" + (d.req ? " req" : ""), title: d.req ? "Compulsory — a bid without it is not responsive" : "" }, o("div", { class: "pcc-bk-name", dir: "auto" }, d.name, d.req ? o("b", { class: "pcc-req" }, " ★") : null))),
    o("th", {})));
  const redraw = () => { drawHead(); body.replaceChildren(...rows.map(rowEl)); rows.forEach(r => r.tr.classList.toggle("pcc-bk-dq", !r.resp.checked)); renum(); };
  // Existing bids first (they are updated on save), then empty rows.
  (p.bidders || []).forEach(b => addRow({ ...Object.fromEntries(COLS.map(([k]) => [k, bidGet(b, k) ?? ""])), responsive: b.responsive !== false, dq: b.responsive === false && docsComplete(p, b.docs), docs: b.docs || {}, remarks: b.remarks || "" }, b));
  for (let i = 0; i < (rows.length ? 2 : 5); i++) addRow();
  drawHead(); rows.forEach(r => r.tr.classList.toggle("pcc-bk-dq", !r.resp.checked && !!(r.b || r.els.vendor.value)));
  const paste = o("textarea", { rows: 3, placeholder: "Paste rows copied from Excel here — columns in this order: " + COLS.map(c => c[1]).join(", ") });
  const usePaste = () => {
    const lines = paste.value.split(/\r?\n/).map(l => l.split("\t").map(c => c.trim())).filter(c => c[0]);
    if (!lines.length) return xt("Nothing to add — copy the rows in Excel and paste them here", "err");
    const [up, add] = merge(lines.map(c => Object.fromEntries(COLS.map(([k], i) => [k, (c[i] || "").replace(/^(MVR|Rf\.?|ރ\.)\s*/i, "")]))));
    paste.value = ""; xt(`${add} added, ${up} updated`);
  };
  // Upload an Excel sheet. Columns are found from their headings (English or Dhivehi, one or two
  // heading rows, merged headings); document columns by their names. Points columns are skipped.
  // A row marked disqualified becomes "not responsive". Bidders already in the table are updated.
  const PTS = /ޕޮއިންޓް|point|score|marks/i;
  const HDR = () => [
    ["vendor", h => /bidder|company|contractor|supplier|party|firm|name|ނަން|ފަރާތ|ކުންފުނި/i.test(h) && !/designation|signature|ސޮއި/i.test(h)],
    ["total", h => /total score|overall|grand total|މުޅި ޖުމްލަ/i.test(h)],
    ["amount", h => !PTS.test(h) && /amount|price|quoted|quotation|bid ?value|mvr|އަގު/i.test(h)],
    ["duration", h => !PTS.test(h) && /duration|days|period|މުއްދަތު|ދުވަސް/i.test(h)],
    ["validity", h => /validity|valid/i.test(h)],
    ["experience", h => !PTS.test(h) && /experience|similar|ތަޖުރިބާ/i.test(h)],
    ["tech", h => /tech/i.test(h)], ["fin", h => /financ/i.test(h)], ["responsive", h => /responsive|qualified/i.test(h)], ["alldocs", h => /all documents/i.test(h)], ["remarks", h => /remark|note|ބަޔާން/i.test(h)],
    ...COLS.filter(([k]) => k.startsWith("sc:")).map(([k, l]) => [k, h => docKey(h).startsWith(docKey(l).split(" (")[0])])];
  const isText = v => { const t = String(v ?? "").trim(); return t && !/^[-+=]?[\d.,\s%]+$/.test(t); };
  const headerAt = (R, ri) => {
    const top = R[ri] || [], sub = (R[ri + 1] || []).some(isText) && !(R[ri + 1] || []).some(v => /^\d{3,}/.test(String(v || ""))) && !(R[ri + 1] || []).some(v => /^(yes|no)$/i.test(String(v || "").trim())) ? R[ri + 1] : null, n = Math.max(top.length, sub ? sub.length : 0);
    const H = []; let parentL = "";
    for (let c = 0; c < n; c++) { const t = isText(top[c]) ? String(top[c]).trim() : ""; const parent = t || (sub && isText(sub[c]) ? (isText(top[c - 1]) ? String(top[c - 1]).trim() : parentL) : ""); t && (parentL = t); H[c] = (parent + " " + (sub && isText(sub[c]) ? String(sub[c]).trim() : "")).trim(); }
    const map = {}; HDR().forEach(([k, f]) => { const c = H.findIndex((h, ci) => h && f(h) && !Object.values(map).includes(ci)); c >= 0 && (map[k] = c); });
    return { map, H, start: ri + (sub ? 2 : 1) };
  };
  const fromExcel = async () => {
    const f = await pickFile(".xlsx"); if (!f) return;
    try {
      const book = await readBook(await toU8(f)), cands = [];
      book.forEach(sh => { let best = null; sh.rows.slice(0, 25).forEach((r, ri) => { if (!r || !r.some(isText)) return; const h = headerAt(sh.rows, ri), sc = Object.keys(h.map).length; if ("vendor" in h.map && "amount" in h.map && (!best || sc > best.sc)) best = { sh, ...h, sc }; }); best && cands.push(best); });
      if (!cands.length) throw err("Could not find the bidder name and bid amount columns. Give the columns headings such as Bidder / ނަން and Bid amount / ހުށައެޅި އަގު.");
      let best = cands[0];
      if (cands.length > 1) { const sel = S(cands.map((c, i) => [i, c.sh.name]), 0); if (!(await form("Which sheet?", [["Sheet", sel]], { ok: "Use this sheet" }))) return; best = cands[Number(sel.value)]; }
      const M = best.map, DQ = /disqualif|ޑިސްކޮލިފައި|ޑިސްކޮލިފައިކުރެވިފައި|not responsive|rejected/i;
      const data0 = best.sh.rows.slice(best.start).filter(r => r && isText(r[M.vendor]));
      // Document columns: headings whose values are Yes / No. Their names become this table's documents.
      const YN = /^(yes|no|y|n|true|false|✓|✔|✗|✘|x|☑|☐|ހުށަހަޅާފައި|ނެތް|އާނ|ނޫން)$/i, ynCols = best.H.map((h, c) => c).filter(c => best.H[c] && data0.some(r => String(r[c] ?? "").trim()) && data0.every(r => { const v = String(r[c] ?? "").trim(); return !v || YN.test(v); }));
      Object.keys(M).forEach(k => { if (!["responsive", "alldocs", "vendor"].includes(k) && ynCols.includes(M[k])) delete M[k]; });
      const docCols = ynCols.filter(c => c !== M.responsive && c !== M.alldocs && c !== M.vendor && !/responsive|qualified|all documents/i.test(best.H[c]));
      if (docCols.length) {
        const old = DOCS; DOCS = docCols.map(c => { const raw = String(best.H[c]), star = /[*★]/.test(raw), name = raw.replace(/[*★]/g, "").replace(/\s+/g, " ").trim(), prev = old.find(d => docKey(d.name) === docKey(name)); return prev ? { ...prev, name, req: star } : { id: uid(), name, orig: name, req: star }; });
        docCols.forEach((c, i) => { M["doc:" + DOCS[i].id] = c; }); redraw();
      }
      const data = best.sh.rows.slice(best.start).filter(r => r && isText(r[M.vendor]) && !/^(grand )?total|^sub ?total|^ޖުމްލަ|^ޖުމުލަ|^ނަން:|^ސޮއި/i.test(String(r[M.vendor]).trim()) && (/\d/.test(String(r[M.amount] || "")) || r.some(v => DQ.test(String(v || "")))));
      if (!data.length) throw err("No bidder rows found under the headings in sheet " + best.sh.name);
      const numv = (v, d = 2) => { const t = String(v ?? "").replace(/^(MVR|Rf\.?|ރ\.)\s*/i, "").replace(/,/g, "").trim(); return t !== "" && !Number.isNaN(Number(t)) ? String(Math.round(Number(t) * 10 ** d) / 10 ** d) : t; };
      const yes = (r, k) => k in M ? (s2 => s2 !== "" && !/^(no|n|false|0|✗|✘|x|☐|ނޫން|ނެތް)$/i.test(s2))(String(r[M[k]] ?? "").trim()) : null;
      const list = data.map(r => { const dq = r.some(v => DQ.test(String(v || ""))), vals = Object.fromEntries(COLS.map(([k]) => [k, k in M ? (k === "vendor" || k === "validity" ? String(r[M[k]] ?? "").trim() : numv(r[M[k]])) : ""]));
        "responsive" in M && String(r[M.responsive] ?? "").trim() && (vals.responsive = yes(r, "responsive")); dq && (vals.responsive = false); vals.responsive === false && (vals.dq = true);
        "alldocs" in M && (vals.alldocs = !!yes(r, "alldocs"));
        const dd = {}; DOCS.forEach(d => { const k = "doc:" + d.id; k in M && (dd[d.name] = !!yes(r, k)); }); Object.keys(dd).length && (vals.docs = dd);
        "remarks" in M && String(r[M.remarks] ?? "").trim() && (vals.remarks = String(r[M.remarks]).trim()); return vals; });
      const [up, add] = merge(list);
      xt(`Sheet "${best.sh.name}": ${add} added, ${up} updated — check them, then Save bids`);
    } catch (e) { xt(e.message, "err"); }
  };
  const ok = await form("Bids received — " + p.ref, [o("div", { style: { gridColumn: "1/-1" } },
    o("datalist", { id: "pcc-vendors3" }, K.sa().map(v => o("option", { value: v }))),
    o("p", { class: "muted small" }, "One row per bidder; existing bids are listed and can be changed. Empty rows are ignored. Tick the documents each bidder submitted. The document columns come from the Excel template: change, add or remove document headings in the template and upload it; a heading ending in * is compulsory (★ here) and Responsive is ticked automatically only when all compulsory documents are ticked (untick Responsive by hand for other reasons, e.g. a late bid, and type the reason in Remarks). Importing or pasting a bidder already listed updates that row."),
    o("div", { class: "pcc-bulk", dir: "rtl" }, o("table", { class: "t", dir: "rtl" }, head, body)),
    o("div", { class: "row", style: { marginTop: "8px", gap: "8px", flexWrap: "wrap" } }, btn("+ Add row", () => addRow(), "small"), btn("Download Excel template", () => { const keep = p.bidDocsReq; p.bidDocsReq = DOCS.filter(d => d.req).map(d => d.name); bidsTemplate(p, DOCS.map(d => d.name)).catch(e => xt(e.message, "err")).finally(() => { p.bidDocsReq = keep; }); }, "small"), btn("Upload Excel file…", fromExcel, "small primary"), btn("Checklist PDF", () => bidsChecklist(p), "small"), o("span", { class: "muted small" }, "Upload reads your Bid Evaluation Form or the template; a bidder already listed is updated.")),
    o("details", { style: { marginTop: "10px" } }, o("summary", { style: { cursor: "pointer", fontWeight: 600 } }, "Paste from Excel"), paste, o("div", { class: "row", style: { marginTop: "6px" } }, btn("Add the pasted rows", usePaste, "small"))))], { one: true, ok: "Save bids",
    check: () => { autoAll(); const L = rows.filter(r => r.els.vendor.value.trim()); if (!L.length) throw err("Type at least one bidder"); L.forEach(r => parseMoney(r.els.amount, r.els.vendor.value.trim() + ": bid amount")); if (rows.some(r => !r.els.vendor.value.trim() && Object.values(r.els).some(e => e.value.trim()))) throw err("A row has values but no bidder name"); if (DOCS.some(d => !d.name.trim())) throw err("A document column has no name"); const seen = new Set(); L.forEach(r => { const k = docKey(r.els.vendor.value); if (seen.has(k)) throw err(r.els.vendor.value.trim() + " is listed twice"); seen.add(k); }); } });
  if (!ok) return;
  save(() => {
    need("pdocs");
    const num = el => { if (!el) return null; const t = el.value.trim().replace(/,/g, ""); return t === "" || Number.isNaN(Number(t)) ? null : Number(t); };
    p.bidDocs = DOCS.map(d => d.name.trim()); p.bidDocsReq = DOCS.filter(d => d.req).map(d => d.name.trim());
    const keep = new Set(), added = [], changed = [];
    rows.filter(r => r.els.vendor.value.trim()).forEach(r => {
      const v = { vendor: r.els.vendor.value.trim(), amount: parseMoney(r.els.amount, "Bid amount"), ...(r.els.validity ? { validity: r.els.validity.value.trim() } : {}), responsive: r.resp.checked, remarks: r.remarks || "", docs: Object.fromEntries(DOCS.map(d => [d.name.trim(), !!(r.dk[d.id] && r.dk[d.id].checked)])) };
      COLS.forEach(([k]) => { if (["duration", "experience", "tech", "fin"].includes(k)) v[k] = num(r.els[k]); });
      const sc = Object.fromEntries(COLS.filter(([k]) => k.startsWith("sc:")).map(([k]) => [k.slice(3), num(r.els[k])]));
      if (r.b) { Object.assign(r.b, v, { scores: { ...(r.b.scores || {}), ...sc } }); keep.add(r.b); changed.push(v.vendor); }
      else { const nb = { id: uid(), ...v, scores: sc, total: null, rank: null }; p.bidders.push(nb); keep.add(nb); added.push(v.vendor); }
    });
    const removed = p.bidders.filter(b => !keep.has(b)); p.bidders = p.bidders.filter(b => keep.has(b));
    autoRank(p); audit(p, "Bids received updated", [added.length ? added.length + " added" : "", changed.length ? changed.length + " checked" : "", removed.length ? removed.length + " removed" : ""].filter(Boolean).join(", "));
    added.forEach(n2 => { if (!(Z().vendors || []).some(y => y.name === n2)) (Z().vendors = Z().vendors || []).push({ name: n2, category: (Z().vendorCats || [])[0] || "Other", status: "Active" }); });
  }, "Bids saved");
}

// Checklist of documents submitted by each bidder, printed or saved as PDF (right to left, Dhivehi headings).
function bidsChecklist(p) {
  const D = docsOf(p), RQ = reqDocsOf(p), B = (p.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || (a.responsive === false) - (b.responsive === false));
  if (!B.length) return xt("No bids recorded yet", "err");
  const E = s2 => String(s2 ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const mem = (p.committees.eval || []).filter(m => !m.onLeave);
  const html = `<!doctype html><html dir="rtl" lang="dv"><head><meta charset="utf-8"><title>Checklist ${E(p.ref)}</title><style>
  @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Faruma,"MV Faseyha","Segoe UI",Arial,sans-serif;color:#1f2937;margin:0;font-size:12px}
  .hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0b4f5c;padding-bottom:8px;margin-bottom:10px}.hd h1{margin:0;font-size:20px;color:#0b4f5c}.hd .s{color:#64748b;font-size:11px}
  .box{background:#0b4f5c;color:#fff;padding:8px 14px;border-radius:6px;text-align:center}.box b{display:block;font-size:14px}.ttl{text-align:center;font-weight:bold;font-size:14px;margin:6px 0 2px}.sub{text-align:center;color:#64748b;margin-bottom:10px}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:6px 5px;text-align:center}th{background:#0b4f5c;color:#fff;font-size:11px}th.rq{background:#9a3412}
  table.ck{table-layout:fixed}col.dc{width:34px}td.c{white-space:nowrap}
  th.v{height:170px;padding:6px 2px;vertical-align:bottom}th.v span{display:inline-block;writing-mode:vertical-rl;transform:rotate(180deg);white-space:normal;max-height:160px;text-align:left;line-height:1.15;font-size:11px}td.n{text-align:right}tr:nth-child(even) td{background:#f8fafc}
  .y{color:#15803d;font-weight:bold;font-size:15px}.x{color:#b91c1c;font-weight:bold;font-size:15px}.dq td{color:#b91c1c}.c{font-weight:bold}
  .sig{display:flex;gap:24px;margin-top:28px}.sig div{flex:1;border-top:1px dashed #94a3b8;padding-top:6px;text-align:center}.sig b{display:block}.sig span{color:#64748b;font-size:11px}
  .lg{margin-top:8px;color:#64748b;font-size:11px}</style></head><body>
  <div class="hd"><div><h1>މިލަންދޫ ކައުންސިލްގެ އިދާރާ</h1><div class="s">ބިޑް އިވެލުއޭޝަން ކޮމެޓީ · ށ. މިލަންދޫ، ދިވެހިރާއްޖެ</div></div><div class="box"><b>ލިޔެކިޔުންތަކުގެ ޗެކްލިސްޓް</b>${E(dvDate(today()))}</div></div>
  <div class="ttl">${E(p.nameDv || p.name || "")}</div><div class="sub">ބީލަން ހުށައެޅުއްވި ފަރާތްތަކުން ހުށަހެޅި ލިޔެކިޔުންތައް${p.advertNo ? " · " + E(p.advertNo) : ""}</div>
  <table class="ck"><colgroup><col style="width:28px"><col style="width:200px"><col style="width:100px">${D.map(() => '<col class="dc">').join("")}<col style="width:58px"><col style="width:84px"><col></colgroup>
  <thead><tr><th>#</th><th>ބިޑް ހުށައެޅި ފަރާތް</th><th>ހުށަހެޅި އަގު</th>${D.map(d => `<th class="v${RQ.includes(d) ? " rq" : ""}"><span>${E(d)}${RQ.includes(d) ? " ★" : ""}</span></th>`).join("")}<th>ހުށަހެޅި</th><th>ޝަރުތު</th><th>ބަޔާން</th></tr></thead><tbody>
  ${B.map((b, i) => { const n = D.filter(d => (b.docs || {})[d]).length; return `<tr class="${b.responsive === false ? "dq" : ""}"><td>${i + 1}</td><td class="n">${E(b.vendor)}</td><td>${b.amount == null ? "—" : E(ht(b.amount))}</td>${D.map(d => (b.docs || {})[d] ? '<td class="y">✓</td>' : '<td class="x">✗</td>').join("")}<td class="c"><bdi dir="ltr">${n} / ${D.length}</bdi></td><td>${b.responsive === false ? "ފުރިހަމަނުވޭ" : "ފުރިހަމަ"}</td><td class="n">${E(b.remarks || "")}</td></tr>`; }).join("")}
  </tbody></table><div class="lg">✓ ހުށަހަޅާފައި · ✗ ހުށަހަޅާފައި ނުވޭ${RQ.length ? " · ★ ހުށަހަޅަންޖެހޭ ލާޒިމް ލިޔުން (މިއިން އެއްވެސް ލިޔުމެއް ނެތިއްޔާ ޝަރުތު ފުރިހަމަނުވޭ)" : ""}</div>
  ${mem.length ? `<div class="sig">${mem.map(m => `<div><b>${E(noTitle(m.nameDv || m.name || ""))}</b><span>${E(m.designationDv || m.designation || "")}</span></div>`).join("")}</div>` : ""}
  </body></html>`;
  const f = o("iframe", { style: { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" } }); document.body.append(f);
  f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { xt(e.message, "err"); } setTimeout(() => f.remove(), 60000); }, 400);
  xt("Choose “Save as PDF” in the print window to download the checklist");
}
async function bidderEdit(p, b) {
  if (!b && needCrit(p)) return;
  const x = b || {}, ven = I(x.vendor, { list: "pcc-vendors2" }), amt = MI(x.amount), val = I(x.validity, { placeholder: "e.g. 90 days" }), dur = N(x.duration, { min: 0 }), exper = N(x.experience, { min: 0, placeholder: "e.g. 3" }), tech = N(x.tech, { step: .01 }), fin = N(x.fin, { step: .01 }), tot = N(x.total, { step: .01, placeholder: "auto: technical + financial" }), rank = N(x.rank, { min: 1, placeholder: "auto" }), resp = S([["yes", "Responsive"], ["no", "Not responsive"]], x.responsive === false ? "no" : "yes"), rem = o("textarea", { rows: 2, dir: "auto" }), docs = docsOf(p).map(d => [d, o("input", { type: "checkbox", checked: !!(x.docs || {})[d] })]);
  rem.value = x.remarks || "";
  const oth = critsOf(p).filter(c => c.type === "other").map(c => [c, N((x.scores || {})[c.key], { step: .01, min: 0, max: c.weight, placeholder: "out of " + c.weight })]);
  const full = !critsOf(p).length, has = t => full || critHas(p, t);
  if (!(await form(b ? "Edit bid" : "Add bid", [o("datalist", { id: "pcc-vendors2" }, K.sa().map(v => o("option", { value: v }))), ["Bidder", ven], ["Bid amount (MVR)", amt], has("duration") ? ["Duration offered (days)", dur] : null, has("experience") ? ["Experience (number of similar-work documents)", exper] : null, has("technical") ? [full ? "Technical score" : `Technical (points, out of ${critsOf(p).find(c => c.type === "technical").weight})`, tech] : null, has("financial") ? [full ? "Financial score" : `Financial (points, out of ${critsOf(p).find(c => c.type === "financial").weight})`, fin] : null, ...oth.map(([c, el]) => [`${c.label} (points, out of ${c.weight})`, el]), full ? ["Total score", tot] : null, full ? ["Rank", rank] : null, ["Responsive", resp], ["Remarks", rem], o("div", { class: "pcc-docs", style: { gridColumn: "1/-1" } }, o("label", {}, "Documents submitted"), o("div", { class: "pcc-chks" }, docs.map(([d, c]) => { reqDocsOf(p).includes(d) && (c.onchange = () => { resp.value = docs.filter(([dd]) => reqDocsOf(p).includes(dd)).every(([, cc]) => cc.checked) ? "yes" : "no"; }); return o("label", { class: "pcc-chk" }, c, " ", d, reqDocsOf(p).includes(d) ? o("b", { class: "pcc-req" }, " ★") : null); })), reqDocsOf(p).length ? o("p", { class: "muted small" }, "★ Compulsory — Responsive changes to Not responsive when one of these is not ticked.") : null)], { check: () => { if (!ven.value.trim()) throw err("Type the bidder"); parseMoney(amt, "Bid amount"); } }))) return;
  save(() => {
    need("pdocs");
    const nn = el => (el.value === "" ? null : Number(el.value)), v = { vendor: ven.value.trim(), amount: parseMoney(amt, "Bid amount"), validity: val.value.trim(), duration: nn(dur), experience: nn(exper), tech: nn(tech), fin: nn(fin), total: nn(tot), rank: nn(rank), responsive: resp.value === "yes", remarks: rem.value.trim(), docs: Object.fromEntries(docs.map(([d, c]) => [d, c.checked])) };
    if (v.total == null && v.tech != null && v.fin != null) v.total = Math.round((v.tech + v.fin) * 100) / 100;
    if (oth.length) v.scores = Object.assign({}, x.scores || {}, Object.fromEntries(oth.map(([c, el]) => [c.key, el.value === "" ? null : Number(el.value)])));
    if (b) Object.assign(b, v); else p.bidders.push({ id: uid(), ...v });
    autoRank(p); audit(p, "Bid " + (b ? "changed" : "recorded"), v.vendor);
    if (!(Z().vendors || []).some(y => y.name === v.vendor)) (Z().vendors = Z().vendors || []).push({ name: v.vendor, category: (Z().vendorCats || [])[0] || "Other", status: "Active" });
  }, "Bid saved");
}
function autoRank(p) {
  critApply(p);
  const R = p.bidders.filter(b => b.responsive !== false), byScore = R.some(b => b.total != null);
  const manual = p.bidders.some(b => b.rankManual);
  if (manual) return;
  R.slice().sort((a, b) => (byScore ? (b.total ?? -1) - (a.total ?? -1) : (a.amount ?? Infinity) - (b.amount ?? Infinity))).forEach((b, i) => { b.rank = i + 1; });
  p.bidders.filter(b => b.responsive === false).forEach(b => { b.rank = null; });
  awardSync(p);
}
function tBid(n, p) {
  n.append(packCard(p, "bid"), meetingsCard(p, "bid"), committeeCard(p, "bid"), docsCard(p, ["Bid Committee"], "Bid Committee documents"));
}
// Bid evaluation: the project's evaluation criteria, then the bids received with their points.
function tEval(n, p) {
  const sel = roundSel(p);
  if (sel) { const v = roundView(p, sel); n.append(...[roundPills(p), roundInfo(v, sel), critCard(v), overBudgetCard(v), bidsCard(v)].filter(Boolean)); return; }
  n.append(...[roundPills(p), retenderBanner(p), readvertCard(p), critCard(p), overBudgetCard(p), bidsCard(p), roundsCard(p)].filter(Boolean));
}
// Bids received (used by the evaluation templates through {#bidders}); shown on the Bid evaluation tab.
function bidsCard(p) {
  const ED = can("pdocs") && !p.__ro; // previous rounds are shown read-only
  const B = p.bidders.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const C = critsOf(p), crit = C.length > 0;
  const showDq = p.showDqPoints !== false, sh = new Map((p.bidders || []).filter(b => b.responsive === false).map(b => [b, critShadow(p, b)]));
  const critCells = b => C.map(c => { const dq = b.responsive === false, pt = dq ? (showDq ? sh.get(b).pts[c.key] : undefined) : (b.points || {})[c.key], v = critValue(b, c), T = critType(c.type); return o("td", { class: "pcc-pt" + (dq ? " dq" : "") }, pt === undefined ? "—" : o("b", {}, pt == null ? "—" : Number(pt).toFixed(2)), T[3] !== "manual" && v != null ? o("div", { class: "muted small" }, c.type === "price" ? ht(v * 100) : c.type === "duration" ? v + " days" : v + " docs") : null); });
  return card("Bids received", B.length ? tbl(["Rank", "Bidder", ...(crit ? [] : ["Bid (MVR)", "Duration"]), ...(crit ? C.map(c => `${c.label || critType(c.type)[1]} ${c.weight}%`) : ["Technical", "Financial"]), "Total", "Documents", "Responsive", ""], B.map(b => o("tr", { class: b.awarded ? "pcc-win" : "" }, o("td", {}, b.rank ?? "—"), o("td", { dir: "auto", style: { minWidth: "190px" } }, o("b", {}, b.vendor), b.awarded ? o("span", { class: "pcc-tag win" }, "Awarded") : null, b.remarks ? o("div", { class: "muted small" }, b.remarks) : null), ...(crit ? [] : [o("td", { class: "money" }, money(b.amount)), o("td", {}, b.duration ? b.duration + " d" : "")]), ...(crit ? critCells(b) : [o("td", {}, b.tech ?? ""), o("td", {}, b.fin ?? "")]), o("td", { class: b.responsive === false ? "pcc-pt dq" : "" }, b.responsive === false ? (crit && showDq && sh.get(b).total != null ? [o("b", {}, Number(sh.get(b).total).toFixed(2)), o("div", { class: "small" }, "not ranked")] : "") : o("b", {}, b.total == null ? "" : Number(b.total).toFixed(2))), o("td", { class: "small" }, docsOf(p).filter(d => (b.docs || {})[d]).length + "/" + docsOf(p).length), o("td", {}, b.responsive === false ? "No" : "Yes"), o("td", { class: "pcc-acts" }, ED ? [btn("Edit", () => bidderEdit(p, b), "small"), b.awarded || b.responsive === false ? null : btn("Award", () => award(p, b), "small primary"), btn("Remove", async () => { (await jt("Remove this bid?", "Remove")) && save(() => { p.bidders = p.bidders.filter(x => x !== b); autoRank(p); audit(p, "Bid removed", b.vendor); }, "Removed"); }, "small")] : null)))) : o("p", { class: "muted" }, "No bids recorded yet."), !crit ? o("div", { class: "pcc-crit-need" }, "Set the evaluation criteria above before adding bids — the bids are scored with them.", ED ? btn("Set criteria", () => critEdit(p), "small primary") : null) : ED ? o("div", { class: "row" }, btn("Add bid", () => bidderEdit(p, null)), btn(B.length ? "Bids table (add / update)" : "Add several bids", () => bidsBulk(p), "primary"), B.length ? btn("Checklist PDF", () => bidsChecklist(p)) : null) : null, !p.__ro && p.awardSrc && p.vendor ? o("div", { class: "pcc-award-note" }, "Contractor, contract value and duration on the project: ", o("b", { dir: "auto" }, p.vendor), " · ", money(p.contract), p.duration ? ` · ${p.duration} days` : "", o("span", { class: "muted small" }, ` — filled from the ${p.awardSrc.from === "awarded" ? "awarded bid" : "highest scorer"}`)) : null,
    crit && sh.size && !p.__ro ? o("label", { class: "pcc-chk", style: { marginTop: "8px" } }, o("input", { type: "checkbox", checked: showDq, onchange: e => save(() => { p.showDqPoints = e.target.checked; }, e.target.checked ? "Showing points for not-responsive bids" : "Hiding points for not-responsive bids") }), " Show points for not-responsive bids (grey, for comparison — they are not ranked)") : null,
    o("p", { class: "muted small" }, crit ? "Points are worked out from the evaluation criteria above; the highest total ranks first. Not-responsive bids are not ranked; their grey points show what they would get if they were responsive." : "Rank is worked out from the total score (highest first) or, without scores, the lowest responsive bid."));
}
async function award(p, b) {
  if (!(await jt(`Award ${p.ref} to ${b.vendor} for ${mvr(b.amount)}? The contractor and contract value are set from this bid.`, "Award"))) return;
  save(() => { need("pdocs"); p.bidders.forEach(x => { x.awarded = x === b; }); p.vendor = b.vendor; p.contract = b.amount; b.duration != null && (p.duration = b.duration); p.awardSrc = { id: b.id, vendor: b.vendor, amount: b.amount, duration: b.duration, from: "awarded" }; p.award = p.award || today(); ["Planned", "Iulaan", "Advertised", "Under evaluation"].includes(p.status) && (p.status = "Awarded"); recalcDue(p); audit(p, "Awarded", `${b.vendor} · ${mvr(b.amount)}`); }, "Awarded to " + b.vendor);
}
// Generated documents of some groups, newest version first, older versions folded.
function docsCard(p, groups, title, codes) {
  const L2 = Z().pdocs.filter(d => d.projectId === p.id && (codes ? codes.includes(d.code) : groups.includes(d.group))).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  if (!L2.length) return card(title, o("p", { class: "muted" }, "Nothing generated yet."));
  const latest = new Map(); L2.forEach(d => { const k = d.code + "|" + (d.key || ""); latest.has(k) || latest.set(k, d); });
  const cur = [...latest.values()], old = L2.filter(d => !cur.includes(d));
  return card(title, docTable(cur.map(d => ({ kind: "gen", d, p })), false), old.length ? o("details", { class: "pcc-old" }, o("summary", {}, `${old.length} older version${old.length === 1 ? "" : "s"}`), docTable(old.map(d => ({ kind: "gen", d, p })), false)) : null);
}

// ----- Edit-project layout: numbered sections, label left / box right, two per line -----
// Read-only view of the project's Bid / Evaluation Committee meeting, as recorded in the register.
function meetView(p, k) {
  const L0 = k === "bid" ? "Bid Committee" : "Evaluation Committee", pre = k === "eval" ? "evalMeeting" : "bidMeeting";
  const L2 = p ? MEETS().filter(m => m.kind === k && mItems(m).some(it => it.projectId === p.id)).sort((a, b) => String(b.date).localeCompare(String(a.date))) : [];
  const box = o("div", { class: "pcc-mv" });
  const line = (m, it) => o("div", { class: "pcc-mv-row" }, o("b", {}, m.ref || "—"), it ? mChip(k, it.type) : null, o("span", {}, fd(m.date)), (m.start || m.time) ? o("span", { class: "muted" }, (m.start || m.time) + (m.end ? " – " + m.end : "")) : null, m.id && can("pdocs") ? btn("Open meeting", () => meetingEdit(m, k), "small") : null);
  if (L2.length) L2.forEach(m => box.append(line(m, mItems(m).find(it => it.projectId === p.id))));
  else if (p && p[pre + "No"]) box.append(line({ ref: p[pre + "No"], date: p[pre + "Date"], start: p[pre + "Start"] || p[pre + "Time"], end: p[pre + "End"] }), o("div", { class: "muted small" }, "Typed on the project before the register — add it to the register from Committee meetings."));
  else box.append(o("div", { class: "muted small" }, p ? "No " + L0 + " meeting recorded yet. " : "Save the project first, then record its meetings. "), p && can("pdocs") ? btn("New " + L0 + " meeting", () => meetingEdit(null, k, p), "small") : null);
  return { label: L0, el: box, w: 12 };
}
function peditLayout(secs) {
  const top = o("div", { class: "pcc-pe-top" }, o("span", { class: "muted small" }, "Changes are saved when you press Save."), o("span", { class: "grow" }), kbToggle());
  return o("div", { class: "pcc-pe pcc-pe-sheet" }, top, secs.map((s2, i) => o("section", { class: "pcc-pe-ssec" }, o("div", { class: "pcc-pe-sh" }, o("span", { class: "pcc-pe-num" }, String(i + 1)), s2.t), s2.hint ? o("p", { class: "pcc-pe-hint" }, s2.hint) : null,
    o("div", { class: "pcc-pe-rows" }, s2.fields.map(x => x.sub ? o("div", { class: "pcc-pe-sub" }, x.sub) : o("div", { class: "pcc-pe-row" + (x.w === 12 ? " full" : "") }, o("label", {}, x.label), o("div", {}, x.el, x.hint ? o("div", { class: "pcc-pe-hint" }, x.hint) : null)))))));
}
