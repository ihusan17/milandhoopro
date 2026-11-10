// Field catalogue (the placeholder cheat-sheet) and the data object given to templates.
// Every date field X also exists as X_dv (Dhivehi), X_en (English long) and, for letters, X_hijri.
// Every money field X also exists as X_words_dv and X_words_en; Excel cells written from a
// single money placeholder get the plain number so the template's own number format applies.

const DATEF = [["advertised_date", "Iulaan date", "advertised"], ["bid_opening_date", "Bid opening", "bidOpening"], ["evaluation_date", "Evaluation", "evaluation"], ["award_date", "Award", "award"], ["agreement_date", "Agreement signed", "agreement"], ["handover_date", "Site handover", "handover"], ["due_date", "Due date (with extensions)", "due"], ["original_due_date", "Due date (as signed)", "dueOriginal"], ["completion_date", "Actual completion", "done"], ["retention_end_date", "Retention period ends", "retentionEnd"], ["today", "Today", null]];
const MONEYF = [["estimated_cost", "Estimated cost", "estimate"], ["contract_value", "Contract value", "contract"], ["retention_amount", "Retention amount", null], ["award_amount", "Awarded amount", null], ["total_paid", "Total paid so far", null], ["balance", "Contract balance", null], ["retention_held", "Retention held", null]];

const FIELDS = [
  ["Project", [
    ["ref_no", "Project reference", "MC-PRJ/2026/004"], ["project_name", "Project name (main)", "Harbour wall repair"], ["project_name_dv", "Project name in Dhivehi", "ބަނދަރުގެ ފާރު މަރާމާތުކުރުން"], ["project_name_en", "Project name in English", "Harbour wall repair"],
    ["type", "Goods / Works / Non-consultancy / Consultancy", "Works"], ["type_dv", "Type in Dhivehi", "މަސައްކަތް"], ["category", "Category", "Construction"], ["location", "Location / island", "Sh. Milandhoo"], ["description", "Scope (English)", ""], ["description_dv", "Scope (Dhivehi)", ""],
    ["status", "Status", "Ongoing"], ["pr_number", "PR number", "181/2026"], ["advertisement_no", "Iulaan number", "(IUL)351-PRO/2026/12"], ["iulaan_no", "Iulaan number (same as advertisement_no)", "(IUL)351-PRO/2026/12"], ["budget_code", "Budget code", "CC2026"], ["budget_name", "Budget line description", ""], ["unit", "Unit / section", "Procurement"],
    ["duration_days", "Contract duration (days)", "120"], ["extension_days", "Extensions granted (days)", "15"], ["percent_complete", "Physical progress %", "65"], ["days_left", "Days left to the due date", "42"], ["retention_percent", "Retention %", "5"], ["retention_period_days", "Retention period (days)", "365"],
    ["project_officer", "Project officer", "Ahmed Ali"], ["project_officer_designation", "Officer designation", ""], ["year", "Current year", "2026"],
  ]],
  ["Dates", DATEF.map(([k, l]) => [k, l, "10.11.2026"]).concat([["evaluation_time", "Evaluation time", "10:00"], ["evaluation_date_dv_ymd", "Any date + _dv_ymd: year · month · day in Dhivehi", "2026 ނޮވެމްބަރ 09"], ["evaluation_date_dv_dmy", "Any date + _dv_dmy: day · month · year in Dhivehi", "09 ނޮވެމްބަރ 2026"], ["evaluation_date_dv_both", "Any date + _dv_both: both formats with /", "09 ނޮވެމްބަރ 2026 / 2026 ނޮވެމްބަރ 09"], ["today_dv", "Today in Dhivehi", "10 ނޮވެމްބަރު 2026"], ["today_en", "Today in English", "10 November 2026"], ["today_hijri", "Today, Hijri (Dhivehi)", "19 ޖުމާދަލްއޫލާ 1448 ހ"], ["today_hijri_en", "Today, Hijri (numbers)", "19/5/1448 AH"]])],
  ["Money (MVR)", MONEYF.flatMap(([k, l]) => [[k, l, "250,000.00"], [k + "_words_dv", l + " in Dhivehi words", "ދެލައްކަ ފަންސާސް ހާސް ރުފިޔާ"], [k + "_words_en", l + " in English words", "Two Hundred Fifty Thousand Rufiyaa Only"]])],
  ["Contractor", [["contractor_name", "Contractor / supplier", "Island Builders Pvt Ltd"], ["contractor_name_dv", "Contractor name (Dhivehi)", ""], ["contractor_address", "Address", ""], ["contractor_phone", "Phone", ""], ["contractor_email", "E-mail", ""], ["contractor_reg_no", "Registration number", ""], ["contractor_contact", "Contact person", ""]]],
  ["Award", [["award_bidder", "Winning bidder", "Island Builders Pvt Ltd"], ["award_duration", "Winning bidder's duration (days)", "120"], ["bidder_count", "Number of bids", "3"], ["responsive_count", "Number of responsive bids", "2"]]],
  ["Committees", [["bid_meeting_no", "Bid Committee meeting number", "(IUL)351-PRO/2026/BM004"], ["bid_meeting_date", "Bid Committee meeting date", "12.11.2026"], ["bid_meeting_date_dv", "Bid Committee meeting date (Dhivehi)", "12 ނޮވެމްބަރު 2026"], ["bid_meeting_date_dv_ymd", "Bid Committee meeting date (year month day)", "2026 ނޮވެމްބަރ 09"], ["bid_meeting_date_dv_dmy", "Bid Committee meeting date (day month year)", "09 ނޮވެމްބަރ 2026"], ["bid_meeting_date_dv_both", "Bid Committee meeting date, both formats", "09 ނޮވެމްބަރ 2026 / 2026 ނޮވެމްބަރ 09"], ["bid_meeting_time", "Bid Committee meeting time", "10:00"], ["eval_meeting_no", "Evaluation Committee meeting number", "(IUL)351-PRO/2026/EM002"], ["eval_meeting_date", "Evaluation Committee meeting date", "19.11.2026"], ["eval_meeting_date_dv", "Evaluation Committee meeting date (Dhivehi)", "19 ނޮވެމްބަރު 2026"], ["eval_meeting_date_dv_ymd", "Evaluation Committee meeting date (year month day)", "2026 ނޮވެމްބަރ 19"], ["eval_meeting_date_dv_dmy", "Evaluation Committee meeting date (day month year)", "19 ނޮވެމްބަރ 2026"], ["eval_meeting_time", "Evaluation Committee meeting time", "10:00"], ["bid_member_count", "Bid Committee members", "3"], ["eval_member_count", "Evaluation Committee members", "3"], ["bid_chair", "Bid Committee chair", ""], ["eval_chair", "Evaluation Committee chair", ""]]],
  ["Per member (inside a member document)", [["member_no", "Member number", "1"], ["member_name", "Name", "Ahmed Ali"], ["member_name_dv", "Name (Dhivehi)", "އަޙްމަދު ޢަލީ"], ["member_designation", "Designation", "Council Officer"], ["member_designation_dv", "Designation (Dhivehi)", "ކައުންސިލް އޮފިސަރ"], ["member_role", "Role (Chair / Member / Secretary)", "Chair"], ["member_role_dv", "Role (Dhivehi)", "ރައީސް"]]],
  ["Committee meeting (several projects)", [["meeting_ref", "Meeting number", "(IUL)351-PRO/2026/BM001"], ["meeting_date", "Meeting date", "12.11.2026"], ["meeting_date_dv", "Meeting date (Dhivehi)", "12 ނޮވެމްބަރު 2026"], ["meeting_time", "Time", "10:00"], ["meeting_place", "Place", ""], ["project_count", "Number of projects", "2"], ["{#projects}…{/projects}", "Repeats a block for every project of the meeting; inside it all project fields work, including {#bidders}…{/bidders}", ""]]],
  ["Letters and memos", [["letter_ref", "Reference number", "(IUL)351-PRO/2026/031"], ["letter_date", "Date", "10.11.2026"], ["letter_date_dv", "Date (Dhivehi)", ""], ["letter_date_hijri", "Date (Hijri)", ""], ["recipient_name", "To (name)", ""], ["recipient_address", "To (address)", ""], ["subject", "Subject", ""], ["body", "Body text (line breaks kept)", ""], ["signatory_name", "Signed by", ""], ["signatory_designation", "Signatory designation", ""], ["eot_days", "Extension of time (days)", ""], ["eot_reason", "Extension reason", ""], ["new_due_date", "New due date", ""]]],
  ["Payment memo", [["memo_ref", "Memo reference", ""], ["payment_kind", "Payment (Advance / Interim / Final / Retention release)", "Interim"], ["payment_no", "Payment number", "2"], ["payment_amount", "This payment", "50,000.00"], ["payment_amount_words_dv", "This payment in Dhivehi words", ""], ["payment_amount_words_en", "This payment in English words", ""], ["previous_payments", "Paid before this one", ""], ["retention_deducted", "Retention deducted now", ""], ["net_payment", "Net amount to pay", ""], ["invoice_no", "Invoice number", ""]]],
  ["Reports", [["report_date", "Report date", ""], ["report_period", "Period covered", ""], ["report_percent", "Progress % in this report", ""], ["report_remarks", "Remarks", ""], ["completion_remarks", "Completion remarks", ""], ["defects", "Defects noted (retention)", ""]]],
  ["Tables (loops)", [
    ["{#bidders}…{/bidders}", "One row per bid: no, rank, bidder_name, bid_amount, bid_amount_words_en, bid_validity, duration_offered, technical_score, financial_score, total_score, responsive, remarks", ""],
    ["{#bid_members}…{/bid_members}", "Bid Committee: no, member_name, member_name_dv, member_designation, member_designation_dv, member_role, member_role_dv", ""],
    ["{#eval_members}…{/eval_members}", "Evaluation Committee, same fields as bid_members", ""],
    ["{#payments}…{/payments}", "no, kind, amount, status, invoice_no, memo_ref, paid_date", ""],
    ["{#checklist}…{/checklist}", "no, item, done (✓), date, by", ""],
    ["{#logs}…{/logs}", "date, activity, workers, materials, weather, issues, by", ""],
    ["{#goods}…{/goods}", "PR-09 plan (also {#works}, {#noncons}, {#cons}): no, year, proc_no, name, name_en, estimate, funded, method, budget_y1, budget_y2, budget_y3, d_ifb, d_opening, d_eval, d_award, d_reoi, d_rfp_issue, d_rfp_sub, d_tech, d_fin_open, d_combined, remarks; outside the loops: year, y1, y2, y3", ""],
  ]],
];
const FIELDKEYS = () => FIELDS.flatMap(g => g[1].map(f => f[0])).filter(k => !k.startsWith("{"));

const ROLEDV = { Chair: "ރައީސް", Member: "މެމްބަރު", Secretary: "ސެކްރެޓަރީ" };
const TYPEDV = Object.fromEntries(PTYPES.map(t => [t[1], t[2]]));
const rf = v => (v == null || v === "" ? null : Math.round(Number(v)) / 100);

function vendorOf(p) { return (Z().vendors || []).find(v => v.name === p.vendor) || {}; }
function payTotals(p) {
  const L2 = p.payments || [], paid = L2.filter(x => x.status === "Paid");
  const sum = f => paid.reduce((a, x) => a + (Number(f(x)) || 0), 0);
  const gross = sum(x => x.amount), ret = sum(x => (x.kind === "Retention release" ? -(x.amount || 0) : x.retention || 0));
  const totalPaid = paid.reduce((a, x) => a + (x.kind === "Retention release" ? x.amount || 0 : (x.amount || 0) - (x.retention || 0)), 0);
  return { gross, retentionHeld: Math.max(0, ret), totalPaid, balance: p.contract != null ? p.contract - gross : null };
}
const winner = p => (p.bidders || []).find(b => b.awarded) || (p.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
function members(p, k) {
  return (p.committees[k] || []).map(memberData);
}

// Build the data object for a project. extra = per-document values (letter, payment, member…)
function dataFor(p, extra = {}) {
  const b = p.budgetId ? K.Kt(Z(), p.budgetId) : null, v = vendorOf(p), w = winner(p), t = today(), pt = payTotals(p);
  const off = (K.STF() || []).find(s => s.name === p.officer) || {};
  const d = {
    ref_no: p.ref || "", project_name: p.name || "", project_name_dv: p.nameDv || "", project_name_en: p.nameEn || p.name || "",
    type: p.type || "", type_dv: TYPEDV[p.type] || "", category: p.category || "", location: p.location || "", description: p.desc || "", description_dv: p.descDv || "",
    status: p.status || "", pr_number: p.prNumber || "", advertisement_no: p.advertNo || "", budget_code: b ? b.code : "", budget_name: b ? b.description : "", unit: p.unit || "",
    duration_days: p.duration ?? "", extension_days: (p.eots || []).reduce((a, e) => a + (Number(e.days) || 0), 0) || "", percent_complete: p.progress ?? 0, days_left: daysLeft(p) ?? "",
    retention_percent: p.retentionPct ?? "", retention_period_days: p.retentionDays ?? "",
    project_officer: p.officer || "", project_officer_designation: off.designation || "", year: t.slice(0, 4),
    contractor_name: p.vendor || "", contractor_name_dv: v.nameDv || "", contractor_address: v.address || "", contractor_phone: v.phone || "", contractor_email: v.email || "", contractor_reg_no: v.regNo || v.reg || "", contractor_contact: v.contact || "",
    award_bidder: w ? w.vendor : "", award_duration: w ? w.duration ?? "" : "", bidder_count: (p.bidders || []).length, responsive_count: (p.bidders || []).filter(x => x.responsive !== false).length,
    bid_member_count: (p.committees.bid || []).length, eval_member_count: (p.committees.eval || []).length,
    bid_chair: ((p.committees.bid || []).find(m => m.role === "Chair") || {}).name || "", eval_chair: ((p.committees.eval || []).find(m => m.role === "Chair") || {}).name || "",
    __num: {},
  };
  DATEF.forEach(([k, , prop]) => { const iso = prop ? p[prop] : t; d[k] = isISO(iso) ? Xt(iso) : ""; d[k + "_dv"] = dvDate(iso); d[k + "_en"] = enDate(iso); d[k + "_hijri"] = hijri(iso); d[k + "_iso"] = isISO(iso) ? iso : ""; });
  d.today_hijri_en = hijri(t, "en");
  // Committee meeting numbers: typed on the project, else the latest recorded meeting that includes it
  ["bid", "eval"].forEach(k => {
    const m = (Z().meetings || []).filter(x => x.kind === k && x.projectIds.includes(p.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    const no = p[k + "MeetingNo"] || (m ? m.ref : ""), dt = p[k + "MeetingDate"] || (m ? m.date : "");
    d[k + "_meeting_time"] = p[k + "MeetingTime"] || (m ? m.time || "" : "");
    d[k + "_meeting_no"] = no || ""; d[k + "_meeting_date"] = isISO(dt) ? Xt(dt) : ""; d[k + "_meeting_date_dv"] = dvDate(dt); d[k + "_meeting_date_en"] = enDate(dt); d[k + "_meeting_date_hijri"] = hijri(dt);
  });
  // Iulaan aliases
  d.iulaan_no = d.advertisement_no; ["", "_dv", "_en", "_hijri", "_iso"].forEach(x => { d["iulaan_date" + x] = d["advertised_date" + x]; });
  // letter defaults (a letter or memo overrides these with its own values)
  Object.assign(d, { letter_date: Xt(t), letter_date_dv: dvDate(t), letter_date_en: enDate(t), letter_date_hijri: hijri(t), signatory_name: p.officer || "", signatory_designation: off.designation || "" });
  const moneyVals = { estimated_cost: p.estimate, contract_value: p.contract, retention_amount: p.contract != null && p.retentionPct ? Math.round(p.contract * p.retentionPct / 100) : null, award_amount: w ? w.amount : null, total_paid: pt.totalPaid, balance: pt.balance, retention_held: pt.retentionHeld };
  Object.entries(moneyVals).forEach(([k, val]) => { d[k] = val == null ? "" : ht(val); d[k + "_words_dv"] = dvMoneyWords(val); d[k + "_words_en"] = enMoneyWords(val); d.__num[k] = rf(val); });
  ["duration_days", "percent_complete", "days_left", "retention_percent", "retention_period_days", "bidder_count", "responsive_count"].forEach(k => { d[k] !== "" && (d.__num[k] = Number(d[k])); });
  d.bidders = (p.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((x, i) => ({ no: i + 1, rank: x.rank ?? "", bidder_name: x.vendor || "", bid_amount: x.amount == null ? "" : ht(x.amount), bid_amount_words_en: enMoneyWords(x.amount), bid_amount_words_dv: dvMoneyWords(x.amount), bid_validity: x.validity || "", duration_offered: x.duration ?? "", technical_score: x.tech ?? "", financial_score: x.fin ?? "", total_score: x.total ?? "", responsive: x.responsive === false ? "No" : "Yes", remarks: x.remarks || "", documents: Object.entries(x.docs || {}).filter(e => e[1]).map(e => e[0]).join(", "), __num: { bid_amount: rf(x.amount), technical_score: num(x.tech), financial_score: num(x.fin), total_score: num(x.total), rank: num(x.rank), duration_offered: num(x.duration) } }));
  d.bid_members = members(p, "bid"); d.eval_members = members(p, "eval");
  d.payments = (p.payments || []).map((x, i) => ({ no: i + 1, kind: x.kind, amount: ht(x.amount), status: x.status, invoice_no: x.invoice || "", memo_ref: x.memoRef || "", paid_date: x.paidDate ? Xt(x.paidDate) : "", __num: { amount: rf(x.amount) } }));
  d.checklist = (p.checklist || []).map((x, i) => ({ no: i + 1, item: x.text, done: x.done ? "✓" : "", date: x.date ? Xt(x.date) : "", by: x.by || "" }));
  d.logs = (p.logs || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(x => ({ date: Xt(x.date), activity: x.text || "", workers: x.workers ?? "", materials: x.materials || "", weather: x.weather || "", issues: x.issues || "", by: x.by || "" }));
  d.evaluation_time = p.evaluationTime || "";
  return addYMD(Object.assign(d, extra));
}
