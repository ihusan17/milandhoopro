// Field catalogue (the placeholder cheat-sheet) and the data object given to templates.
// Every date field X also exists as X_dv (Dhivehi), X_en (English long) and, for letters, X_hijri.
// Every money field X also exists as X_words_dv and X_words_en; Excel cells written from a
// single money placeholder get the plain number so the template's own number format applies.

const DATEF = [["advertised_date", "Iulaan date", "advertised"], ["bid_opening_date", "Bid opening", "bidOpening"], ["evaluation_date", "Evaluation", "evaluation"], ["award_date", "Award", "award"], ["agreement_date", "Agreement signed", "agreement"], ["handover_date", "Site handover", "handover"], ["due_date", "Due date (with extensions)", "due"], ["original_due_date", "Due date (as signed)", "dueOriginal"], ["completion_date", "Actual completion", "done"], ["retention_end_date", "Retention period ends", "retentionEnd"], ["today", "Today", null]];
const MONEYF = [["estimated_cost", "Estimated cost", "estimate"], ["budget_after_award", "Budget left after the award (estimated cost − awarded amount)", null], ["budget_extra_needed", "Extra budget needed (awarded amount above the estimated cost, else -)", null], ["contract_value", "Contract value", "contract"], ["retention_amount", "Retention amount", null], ["award_amount", "Awarded amount", null], ["total_paid", "Total paid so far", null], ["balance", "Contract balance", null], ["retention_held", "Retention held", null]];

const FIELDS = [
  ["Project", [
    ["ref_no", "Project reference", "MC-PRJ/2026/004"], ["project_name", "Project name (main)", "Harbour wall repair"], ["project_name_dv", "Project name in Dhivehi", "ބަނދަރުގެ ފާރު މަރާމާތުކުރުން"], ["project_name_en", "Project name in English", "Harbour wall repair"],
    ["type", "Goods / Works / Non-consultancy / Consultancy", "Works"], ["type_dv", "Type in Dhivehi", "މަސައްކަތް"], ["category", "Category", "Construction"], ["location", "Location / island", "Sh. Milandhoo"], ["description", "Scope (English)", ""], ["description_dv", "Scope (Dhivehi)", ""],
    ["status", "Status", "Ongoing"], ["pr_number", "PR number", "181/2026"], ["advertisement_no", "Iulaan number", "(IUL)351-PRO/2026/12"], ["iulaan_no", "Iulaan number (same as advertisement_no)", "(IUL)351-PRO/2026/12"], ["budget_code", "Budget code", "CC2026"], ["budget_name", "Budget line description", ""], ["unit", "Unit / section", "Procurement"],
    ["duration_days", "Contract duration (days)", "120"], ["extension_days", "Extensions granted (days)", "15"], ["percent_complete", "Physical progress %", "65"], ["days_left", "Days left to the due date", "42"], ["retention_percent", "Retention %", "5"], ["retention_period_days", "Retention period (days)", "365"],
    ["project_officer", "Project officer", "Ahmed Ali"], ["project_officer_designation", "Officer designation", ""], ["year", "Current year", "2026"],
  ]],
  ["Dates", DATEF.map(([k, l]) => [k, l, "10.11.2026"]).concat([["evaluation_time", "Evaluation time", "10:00"], ["evaluation_date_dv_ymd", "Any date + _dv_ymd: year · month · day in Dhivehi", "2026 ނޮވެމްބަރ 09"], ["evaluation_date_dv_dmy", "Any date + _dv_dmy: day · month · year in Dhivehi", "09 ނޮވެމްބަރ 2026"], ["evaluation_date_dash", "Any date + _dash: day-month-year with dashes", "10-11-2026"], ["evaluation_date_dv_both", "Any date + _dv_both: both formats with /", "09 ނޮވެމްބަރ 2026 / 2026 ނޮވެމްބަރ 09"], ["today_dv", "Today in Dhivehi", "10 ނޮވެމްބަރު 2026"], ["today_en", "Today in English", "10 November 2026"], ["today_hijri", "Today, Hijri (Dhivehi)", "19 ޖުމާދަލްއޫލާ 1448ހ"], ["today_hijri_en", "Today, Hijri (numbers)", "19/5/1448 AH"]])],
  ["Money (MVR)", MONEYF.flatMap(([k, l]) => [[k, l, "250,000.00"], [k + "_words_dv", l + " in Dhivehi words", "ދެލައްކަ ފަންސާސް ހާސް ރުފިޔާ"], [k + "_words_en", l + " in English words", "Two Hundred Fifty Thousand Rufiyaa Only"]])],
  ["Contractor", [["contractor_name", "Contractor / supplier", "Island Builders Pvt Ltd"], ["contractor_name_dv", "Contractor name (Dhivehi)", ""], ["contractor_address", "Address", ""], ["contractor_phone", "Phone", ""], ["contractor_email", "E-mail", ""], ["contractor_reg_no", "Registration number", ""], ["contractor_contact", "Contact person", ""]]],
  ["Award", [["award_bidder", "Winning bidder", "Island Builders Pvt Ltd"], ["award_duration", "Winning bidder's duration (days)", "120"], ["award_year", "Year of the award date (else this year)", "2026"], ["award_score", "Winning bidder's total points (Bidders tab)", "94.00"], ["plan_status_dv", "In plan / not in plan (Dhivehi): ޕްލޭނުގައި ހިމެނޭ / ޕްލޭނުގައި ނުހިމެނޭ / ފަހުން ޕްލޭނަށް އިތުރުކުރި", ""], ["plan_status", "Same in English", "In plan"], ["in_plan", "Yes when the project is in the PR-09 plan", "Yes"], ["unplanned_reason_dv", "Why it is not in the plan (Edit form)", ""], ["replaces_plan_item", "The cancelled plan item it replaces", ""], ["plan_cancel_reason_dv", "Why that plan item was cancelled", ""], ["agreement_no", "Agreement number (project Edit form)", "(AGR)284-A/PRIV/2026/22"], ["last_invoice_no", "Invoice number of the latest payment that has one (Payments tab)", "INV/016/2026"], ["scope_dv", "Scope in Dhivehi (project name when no scope is typed)", ""], ["plan_year1", "Procurement plan: first budget year (also plan_year2, plan_year3)", "2026"], ["plan_budget_y1", "Budget in the first year from the PR-09 plan, or the estimated cost (also plan_budget_y2, plan_budget_y3; - when none)", "1,334,731.55"], ["plan_budget_y2", "Budget in the second year", "-"], ["plan_budget_y3", "Budget in the third year", "-"], ["plan_year2", "Second budget year", "2027"], ["plan_year3", "Third budget year", "2028"], ["bidder_count", "Number of bids", "3"], ["responsive_count", "Number of responsive bids", "2"]]],
  ["Committees", [["bid_meeting_no", "Bid Committee meeting number", "(IUL)351-PRO/2026/BM004"], ["bid_meeting_date", "Bid Committee meeting date", "12.11.2026"], ["bid_meeting_date_dv", "Bid Committee meeting date (Dhivehi)", "12 ނޮވެމްބަރު 2026"], ["bid_meeting_date_dv_ymd", "Bid Committee meeting date (year month day)", "2026 ނޮވެމްބަރ 09"], ["bid_meeting_date_dv_dmy", "Bid Committee meeting date (day month year)", "09 ނޮވެމްބަރ 2026"], ["bid_meeting_date_dv_both", "Bid Committee meeting date, both formats", "09 ނޮވެމްބަރ 2026 / 2026 ނޮވެމްބަރ 09"], ["bid_meeting_year", "Bid Committee meeting year", "2026"], ["bid_meeting_seq", "Bid Committee meeting number only (last number of the meeting no.)", "18"], ["bid_meeting_start_time", "Bid Committee meeting started at", "10:00"], ["bid_meeting_end_time", "Bid Committee meeting ended at", "10:25"], ["bid_meeting_date_hijri", "Bid Committee meeting date (Hijri)", "30 ޖުމާދަލްއޫލާ 1448ހ"], ["bid_present_count", "Bid Committee members present", "4"], ["bid_absent_count", "Bid Committee members on leave", "1"], ["bid_chair_short_dv", "Bid Committee chair, name without title", "މުޙައްމަދު ރަޝީދު"], ["eval_meeting_year", "Evaluation Committee meeting year", "2026"], ["eval_meeting_seq", "Evaluation Committee meeting number only", "3"], ["eval_meeting_start_time", "Evaluation Committee meeting started at", "10:00"], ["eval_meeting_end_time", "Evaluation Committee meeting ended at", "11:00"], ["eval_chair_short_dv", "Evaluation Committee chair, name without title", ""], ["bid_meeting_time", "Bid Committee meeting time", "10:00"], ["eval_meeting_no", "Evaluation Committee meeting number", "(IUL)351-PRO/2026/EM002"], ["eval_meeting_date", "Evaluation Committee meeting date", "19.11.2026"], ["eval_meeting_date_dv", "Evaluation Committee meeting date (Dhivehi)", "19 ނޮވެމްބަރު 2026"], ["eval_meeting_date_dv_ymd", "Evaluation Committee meeting date (year month day)", "2026 ނޮވެމްބަރ 19"], ["eval_meeting_date_dv_dmy", "Evaluation Committee meeting date (day month year)", "19 ނޮވެމްބަރ 2026"], ["eval_meeting_time", "Evaluation Committee meeting time", "10:00"], ["bid_member_count", "Bid Committee members", "3"], ["eval_member_count", "Evaluation Committee members", "3"], ["bid_chair", "Bid Committee chair", ""], ["eval_chair", "Evaluation Committee chair", ""]]],
  ...[["bid", "Bid Committee"], ["eval", "Evaluation Committee"]].map(([k, l]) => [`${l} members by number (tables with fixed rows)`, [1, 2, 3, 4, 5].flatMap(n => [
    [`${k}_m${n}_name_dv`, `Member ${n} — name (Dhivehi)`, ""], [`${k}_m${n}_designation_dv`, `Member ${n} — designation (Dhivehi)`, ""], [`${k}_m${n}_role_dv`, `Member ${n} — role (Dhivehi)`, ""], [`${k}_m${n}_name`, `Member ${n} — name (English)`, ""],
    [`${k}_m${n}_absent_mark`, `Member ${n} — “-” cell when on leave (grey)`, ""], [`${k}_m${n}_leave`, `Member ${n} — first cell to merge with the leave reason (grey)`, ""], [`${k}_m${n}_leave_text`, `Member ${n} — leave reason only`, ""]])]),
  ["Per member — only inside a {#bid_members} row, or in a one-per-member document", [["member_no", "Member number", "1"], ["member_name", "Name", "Ahmed Ali"], ["member_name_dv", "Name (Dhivehi)", "އަޙްމަދު ޢަލީ"], ["member_short_dv", "Name without އަލްފާޟިލް / އަލްފާޟިލާ", "އަޙްމަދު ޢަލީ"], ["member_id_card", "ID card number (typed on the committee member)", "A000000"], ["member_office_dv", "Office (empty: ށ. މިލަންދޫ ކައުންސިލް އިދާރާ)", "ށ. މިލަންދޫ ކައުންސިލް އިދާރާ"], ["member_designation", "Designation", "Council Officer"], ["member_designation_dv", "Designation (Dhivehi)", "ކައުންސިލް އޮފިސަރ"], ["member_role", "Role (Chair / Member / Secretary)", "Chair"], ["member_role_dv", "Role (Dhivehi)", "ރައީސް"]]],
  ["Committee meeting (several projects)", [["meeting_ref", "Meeting number", "(IUL)351-PRO/2026/BM001"], ["meeting_date", "Meeting date", "12.11.2026"], ["meeting_date_dv", "Meeting date (Dhivehi)", "12 ނޮވެމްބަރު 2026"], ["meeting_time", "Time", "10:00"], ["meeting_place", "Place", ""], ["project_count", "Number of projects", "2"], ["{#projects}…{/projects}", "Repeats a block for every project of the meeting; inside it all project fields work, including {#bidders}…{/bidders}", ""], ["agenda_dv", "What the meeting decided, counted (Dhivehi)", "2 ހަވާލުކުރުން، 1 ވޭރިއޭޝަން"], ["agenda", "Same in English", "2 Award, 1 Variation"], ["award_count", "Projects for award (also variation_count, extension_count, evaluation_count)", "2"], ["item_type_dv", "Inside {#projects}: what this project is for (ހަވާލުކުރުން / ވޭރިއޭޝަން …)", "ހަވާލުކުރުން"], ["item_type", "Inside {#projects}: same in English", "Award"], ["item_note", "Inside {#projects}: decision / subject typed for it", ""], ["variation_amount", "Inside {#projects}: variation amount", "25,000.00"], ["variation_kind_dv", "Inside {#projects}: އިތުރުކުރުން (addition) / ކުޑަކުރުން (omission)", "އިތުރުކުރުން"], ["variation_amount_words_dv", "Inside {#projects}: variation in Dhivehi words", ""], ["variation_days", "Inside {#projects}: extra days given", "14"], ["contract_after_variation", "Inside {#projects}: contract value after the variation", ""], ["{#awards}…{/awards}", "Repeats only the projects for award (also {#variations}, {#extensions}, {#evaluations}); numbered from 1", ""], ["{#is_variation}…{/is_variation}", "Inside {#projects}: shown only for a variation (also is_award, is_extension)", ""], ["{^is_last}…{/is_last}", "Inside {#projects}: shown for every project except the last (e.g. ށާއި، between projects); {#is_last}…{/is_last} only for the last", ""]]],
  ["Report extras", [["days_total", "Days from handover to the due date", "63"], ["days_used", "Days used so far (to completion or today)", "42"], ["time_percent", "Time used %", "67"], ["delay_status_dv", "On time / days late (Dhivehi)", "ނުލަސްވެ ނިމިފައި"], ["delay_status", "On time / days late (English)", "Completed on time"], ["days_late", "Days late", "0"], ["days_remaining", "Days left to the due date (0 when overdue, - when finished)", "21"], ["penalty_per_day", "Delay penalty per day (project Edit form)", "500.00"], ["penalty_amount", "Penalty = days late × penalty per day (- when none)", "-"], ["penalty_amount_words_dv", "Penalty in Dhivehi words", ""], ["status_dv", "Status word (ނިމިފައި / ކުރިއަށް ދަނީ / ލަސްވެފައި)", "ނިމިފައި"], ["status_stamp", "The status word as a coloured stamp", "▮ ނިމިފައި"], ["paid_percent", "Paid so far as % of the contract", "40"], ["extension_count", "Number of extensions of time", "1"], ["inspector_name_dv", "First member of the inspection team", ""], ["inspector_designation_dv", "Their designation", ""], ["snag_count", "Defects found at inspection", "3"], ["snag_open_count", "Defects still open", "0"], ["retention_start_date", "Retention period starts (= completion date; also _dv, _dash…)", ""], ["progress_bar", "Picture: work done vs time used", "▬▬▬"], ["qr_code", "Picture: QR code linking to the project in the portal", "▦"], ["project_photos", "Photos: the project's latest 4 photos in a 2×2 grid (alone in a paragraph)", "▣▣"], ["report_photos", "Photos of this progress report in a 2×2 grid (alone in a paragraph)", "▣▣"], ["page_no", "Page number (Word field)", "1"], ["has_extensions", "Show-if switch: {#has_extensions}…{/has_extensions} shows that part only when there are extensions (also has_inspectors, has_snags, has_project_photos, has_report_photos)", ""], ["has_inspectors", "Show-if: inspection team set", ""], ["has_snags", "Show-if: defects recorded", ""], ["has_project_photos", "Show-if: project has photos", ""], ["has_report_photos", "Show-if: this progress report has photos", ""], ["page_count", "Number of pages (Word field)", "2"], ["report_bill_amount", "Amount of this bill (progress report)", "50,000.00"], ["report_bill_amount_words_dv", "This bill in Dhivehi words", ""]]],
  ["Letters and memos", [["letter_ref", "Reference number", "(IUL)351-PRO/2026/031"], ["letter_date", "Date", "10.11.2026"], ["letter_date_dv", "Date (Dhivehi)", ""], ["letter_date_hijri", "Date (Hijri)", ""], ["recipient_name", "To (name)", ""], ["recipient_address", "To (address)", ""], ["subject", "Subject", ""], ["body", "Body text (line breaks kept)", ""], ["signatory_name", "Signed by", ""], ["signatory_designation", "Signatory designation", ""], ["eot_days", "Extension of time (days)", ""], ["eot_reason", "Extension reason", ""], ["new_due_date", "New due date", ""]]],
  ["Payment memo", [["memo_ref", "Memo reference", ""], ["payment_kind", "Payment (Advance / Interim / Final / Retention release)", "Interim"], ["payment_no", "Payment number", "2"], ["payment_amount", "This payment", "50,000.00"], ["payment_amount_words_dv", "This payment in Dhivehi words", ""], ["payment_amount_words_en", "This payment in English words", ""], ["previous_payments", "Paid before this one", ""], ["retention_deducted", "Retention deducted now", ""], ["net_payment", "Net amount to pay", ""], ["invoice_no", "Invoice number", ""]]],
  ["Reports", [["report_date", "Report date", ""], ["report_bill_no", "Bill number of this progress report", "01"], ["report_invoice_no", "Invoice number for this bill", "1/64750"], ["report_inspect_date", "Date inspected (also _dash, _dv_dmy…)", "31.08.2026"], ["report_period", "Period covered", ""], ["report_percent", "Progress % in this report", ""], ["report_remarks", "Remarks", ""], ["completion_remarks", "Completion remarks", ""], ["defects", "Defects noted (retention)", ""]]],
  ["Tables (loops)", [
    ["{#bidders}…{/bidders}", "One row per bid: no, rank, bidder_name, bid_amount, bid_amount_words_en, bid_validity, duration_offered, experience, technical_score, financial_score, total_score, responsive, remarks", ""],
    ["{#bid_members}…{/bid_members}", "Bid Committee: no, member_name, member_name_dv, member_designation, member_designation_dv, member_role, member_role_dv", ""],
    ["{#eval_members}…{/eval_members}", "Evaluation Committee, same fields as bid_members", ""],
    ["{#bid_present}…{/bid_present}", "Bid Committee members present (not on leave), numbered 1, 2, 3…: no, member_name_dv, member_short_dv (no title), member_designation_dv", ""],
    ["{#bid_absent}…{/bid_absent}", "Bid Committee members on leave: no, member_name_dv, member_short_dv, leave_text", ""],
    ["{#bid_attendance}…{/bid_attendance}", "Side-by-side rows, present | on leave: no, present_name_dv, absent_name_dv, absent_reason (also present_full_dv / absent_full_dv with titles)", ""],
    ["{#eval_present}, {#eval_absent}, {#eval_attendance}", "The same for the Evaluation Committee", ""],
    ["{#extensions}…{/extensions}", "Extensions of time: no, days, reason_dv, letter_ref, approved_date, approved_date_dash, approved_date_dv", ""],
    ["{#inspectors}…{/inspectors}", "Inspection team (Completion tab): no, name_dv, designation_dv", ""],
    ["{#snags}…{/snags}", "Defects found at inspection (Completion tab): no, item_dv, status_dv", ""],
    ["{#report_items}…{/report_items}", "Progress report work items (one per line in the report): no, item_dv, status_dv (ނިމިފައި), inspect_date, inspect_date_dash", ""],
    ["price_points", "Inside {#bidders}: points for price (also duration_points, experience_points, technical_points, financial_points) from the project's evaluation criteria", "75.00"],
    ["criteria_text_dv", "The evaluation criteria in Dhivehi, e.g. އަގު 75%، މުއްދަތު 15%، ތަޖުރިބާ 10%  (criteria_text in English; {#criteria}{label_dv} {weight}%{/criteria} as a list)", ""],
    ["{#responsive_bidders}…{/responsive_bidders}", "Bidders marked Responsive, numbered 1, 2, 3…: same fields as bidders (bidder_name, bid_amount, duration_offered, experience, technical_score, financial_score, total_score)", ""],
    ["{#rejected_bidders}…{/rejected_bidders}", "Bidders marked Not responsive: no, bidder_name, bid_amount, remarks (type the reason for rejection in the bidder's Remarks)", ""],
    ["round_no", "Advertisement round: 1, or 2, 3… after re-advertising (also {#is_retender}…{/is_retender} shows text only for a re-advertisement)", "2"],
    ["previous_iulaan_no", "Iulaan number of the previous round (also previous_iulaan_date_dv, previous_lowest_bid)", ""],
    ["retender_reason_dv", "Why it was re-advertised (also retender_decision_ref)", ""],
    ["row_no", "Inside {#responsive_bidders} and {#rejected_bidders}: a number that runs on from the responsive bidders into the rejected ones (1, 2, 3, 4, then 5…), for one table listing both", "5"],
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
    contractor_name: p.vendor || "", contractor_name_dv: v.nameDv || p.vendor || (w ? w.vendor : "") || "", contractor_address: v.address || "", contractor_phone: v.phone || "", contractor_email: v.email || "", contractor_reg_no: v.regNo || v.reg || "", contractor_contact: v.contact || "",
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
    d[k + "_meeting_start_time"] = p[k + "MeetingStart"] || d[k + "_meeting_time"]; d[k + "_meeting_end_time"] = p[k + "MeetingEnd"] || "";
    d[k + "_meeting_year"] = isISO(dt) ? dt.slice(0, 4) : String(new Date().getFullYear());
    d[k + "_meeting_seq"] = String(Number(((no || "").match(/(\d+)\D*$/) || [])[1] || "") || "");
    d[k + "_meeting_no"] = no || ""; d[k + "_meeting_date"] = isISO(dt) ? Xt(dt) : ""; d[k + "_meeting_date_dv"] = dvDate(dt); d[k + "_meeting_date_en"] = enDate(dt); d[k + "_meeting_date_hijri"] = hijri(dt);
  });
  // Iulaan aliases
  d.iulaan_no = d.advertisement_no; ["", "_dv", "_en", "_hijri", "_iso"].forEach(x => { d["iulaan_date" + x] = d["advertised_date" + x]; });
  // letter defaults (a letter or memo overrides these with its own values)
  Object.assign(d, { letter_date: Xt(t), letter_date_dv: dvDate(t), letter_date_en: enDate(t), letter_date_hijri: hijri(t), signatory_name: p.officer || "", signatory_designation: off.designation || "" });
  const moneyVals = { estimated_cost: p.estimate, contract_value: p.contract, retention_amount: p.contract != null && p.retentionPct ? Math.round(p.contract * p.retentionPct / 100) : null, award_amount: w ? w.amount : null, total_paid: pt.totalPaid, balance: pt.balance, retention_held: pt.retentionHeld,
    // Award sheet: budget left after the award, and extra budget needed when the award is above the budget.
    budget_after_award: p.estimate != null && w && w.amount != null ? Math.max(0, p.estimate - w.amount) : null, budget_extra_needed: p.estimate != null && w && w.amount != null && w.amount > p.estimate ? w.amount - p.estimate : null };
  Object.entries(moneyVals).forEach(([k, val]) => { d[k] = val == null ? (k === "budget_extra_needed" && p.estimate != null && w && w.amount != null ? "-" : "") : ht(val); d[k + "_words_dv"] = dvMoneyWords(val); d[k + "_words_en"] = enMoneyWords(val); d.__num[k] = rf(val); });
  ["duration_days", "percent_complete", "days_left", "retention_percent", "retention_period_days", "bidder_count", "responsive_count"].forEach(k => { d[k] !== "" && (d.__num[k] = Number(d[k])); });
  d.bidders = (p.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((x, i) => ({ no: i + 1, rank: x.rank ?? "", bidder_name: x.vendor || "", bid_amount: x.amount == null ? "" : ht(x.amount), bid_amount_words_en: enMoneyWords(x.amount), bid_amount_words_dv: dvMoneyWords(x.amount), bid_validity: x.validity || "", duration_offered: x.duration ?? "", technical_score: x.tech ?? "", financial_score: x.fin ?? "", total_score: x.total ?? "", responsive: x.responsive === false ? "No" : "Yes", remarks: x.remarks || "", experience: x.experience ?? "", __ok: x.responsive !== false, documents: Object.entries(x.docs || {}).filter(e => e[1]).map(e => e[0]).join(", "), __num: { bid_amount: rf(x.amount), technical_score: num(x.tech), financial_score: num(x.fin), total_score: num(x.total), rank: num(x.rank), duration_offered: num(x.duration), experience: num(x.experience) } }));
  critData(p, d); roundData(p, d);
  // Responsive bidders (scored) and rejected bidders (with the reason typed in Remarks), numbered 1, 2, 3…
  d.responsive_bidders = d.bidders.filter(x => x.__ok).map((x, i) => ({ ...x, no: i + 1, row_no: i + 1, __num: { ...x.__num, no: i + 1, row_no: i + 1 } }));
  // row_no continues after the responsive bidders, for sheets that list the rejected ones underneath.
  d.rejected_bidders = d.bidders.filter(x => !x.__ok).map((x, i, A) => ({ ...x, no: i + 1, row_no: d.responsive_bidders.length + i + 1, __num: { ...x.__num, no: i + 1, row_no: d.responsive_bidders.length + i + 1 } }));
  d.award_score = w && w.total != null && w.total !== "" ? Number(w.total).toFixed(2) : "";
  d.bid_members = members(p, "bid"); d.eval_members = members(p, "eval");
  numberedMembers(d, "bid", d.bid_members); numberedMembers(d, "eval", d.eval_members);
  d.payments = (p.payments || []).map((x, i) => ({ no: i + 1, kind: x.kind, amount: ht(x.amount), status: x.status, invoice_no: x.invoice || "", memo_ref: x.memoRef || "", paid_date: x.paidDate ? Xt(x.paidDate) : "", __num: { amount: rf(x.amount) } }));
  d.checklist = (p.checklist || []).map((x, i) => ({ no: i + 1, item: x.text, done: x.done ? "✓" : "", date: x.date ? Xt(x.date) : "", by: x.by || "" }));
  d.logs = (p.logs || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map(x => ({ date: Xt(x.date), activity: x.text || "", workers: x.workers ?? "", materials: x.materials || "", weather: x.weather || "", issues: x.issues || "", by: x.by || "" }));
  d.evaluation_time = p.evaluationTime || "";
  // Budget by year from the linked PR-09 plan item (else the estimate in the first year).
  { const pl = (Z().plan || []).find(x => (p.planId && x.id === p.planId) || x.projectId === p.id), y0 = pl && Number(pl.year) ? Number(pl.year) : new Date().getFullYear();
    [0, 1, 2].forEach(k => { const v = pl ? (pl.budget || [])[k] : k === 0 ? p.estimate : null; d["plan_year" + (k + 1)] = String(y0 + k); d["plan_budget_y" + (k + 1)] = v == null || v === 0 ? "-" : ht(v); v != null && v !== 0 && (d.__num["plan_budget_y" + (k + 1)] = rf(v)); }); }
  d.agreement_no = p.agreementNo || "";
  { const ps = planState(p), rp = p.replacesPlanId && (Z().plan || []).find(k => k.id === p.replacesPlanId);
    d.plan_status = ps.label; d.plan_status_dv = ps.dv; d.in_plan = ps.code === "planned" ? "Yes" : "No"; d.unplanned_reason_dv = p.unplannedReason || "";
    d.replaces_plan_item = rp ? (rp.procNo || rp.pid) + " " + planName(rp) : ""; d.plan_cancel_reason_dv = rp && rp.cancel ? rp.cancel.reason || "" : ""; }
  { const inv = (p.payments || []).filter(x => x.invoice).slice(-1)[0]; d.last_invoice_no = inv ? inv.invoice : ""; }
  d.scope_dv = d.description_dv || d.project_name_dv || "";
  d.award_year = /^\d{2}\.\d{2}\.(\d{4})$/.test(d.award_date || "") ? d.award_date.slice(6) : String(new Date().getFullYear());
  // ----- Report extras: progress summary, payment position, extensions, delay, inspection, defects, retention -----
  { const t0 = today(), end = p.done || t0, span = p.handover && p.due ? Math.max(1, dDiff(p.handover, p.due)) : null, used = p.handover ? Math.max(0, dDiff(p.handover, end < p.handover ? p.handover : end)) : null;
    d.days_total = span ?? ""; d.days_used = used ?? ""; d.time_percent = span && used != null ? Math.min(100, Math.round(used / span * 100)) : "";
    const late = p.due ? (p.done ? Math.max(0, dDiff(p.due, p.done)) : Math.max(0, dDiff(p.due, t0))) : 0, behind = d.time_percent !== "" && Number(p.progress || 0) + 10 < d.time_percent;
    d.days_late = late || 0;
    d.days_remaining = p.done ? "-" : p.due ? String(Math.max(0, dDiff(t0, p.due))) : "";
    d.delay_status_dv = p.done ? (late ? `${late} ދުވަސް ލަސްވެފައި` : "ނުލަސްވެ ނިމިފައި") : late ? `${late} ދުވަސް ލަސްވެފައި` : behind ? "ލަސްވަމުން" : "ވަގުތުގެ ތެރޭގައި ކުރިއަށް";
    d.delay_status = p.done ? (late ? `${late} days late` : "Completed on time") : late ? `${late} days late` : behind ? "Behind schedule" : "On schedule";
    const rate = p.penaltyPerDay || 0, pen = late && rate ? late * rate : null;
    d.penalty_per_day = rate ? ht(rate) : ""; d.penalty_amount = pen ? ht(pen) : "-"; d.penalty_amount_words_dv = pen ? dvMoneyWords(pen) : ""; pen && (d.__num.penalty_amount = rf(pen));
    const st = p.done || ["Completed", "In retention", "Closed"].includes(p.status) ? ["ނިމިފައި", "2E7D32"] : late || behind ? ["ލަސްވެފައި", "C62828"] : ["ކުރިއަށް ދަނީ", "1565C0"];
    d.status_dv = st[0]; d.status_stamp = `⟦STAMP:${st[1]}:${st[0]}⟧`;
    d.paid_percent = p.contract ? Math.round((pt.totalPaid || 0) / p.contract * 100) : "";
    d.extensions = (p.eots || []).map((e, i) => ({ no: i + 1, days: e.days, reason_dv: e.reason || "", letter_ref: e.letterRef || "", approved_date: isISO(e.approved) ? Xt(e.approved) : "", approved_date_dash: isISO(e.approved) ? Xt(e.approved).replace(/\./g, "-") : "", approved_date_dv: dvDate(e.approved) }));
    d.extension_count = d.extensions.length;
    d.inspectors = (p.inspectors || []).map((x, i) => ({ no: i + 1, name_dv: x.nameDv || "", designation_dv: x.designationDv || "" }));
    d.inspector_name_dv = (d.inspectors[0] || {}).name_dv || ""; d.inspector_designation_dv = (d.inspectors[0] || {}).designation_dv || "";
    d.snags = (p.snags || []).map((x, i) => ({ no: i + 1, item_dv: x.text || "", status_dv: x.fixed ? "ރަނގަޅުކުރެވިފައި" : "ރަނގަޅުކުރަން ބާކީ" }));
    d.snag_count = d.snags.length; d.snag_open_count = (p.snags || []).filter(x => !x.fixed).length;
    d.has_extensions = d.extensions.length > 0; d.has_inspectors = d.inspectors.length > 0; d.has_snags = d.snags.length > 0;
    d.retention_start_date = isISO(p.done) ? Xt(p.done) : ""; d.retention_start_date_dv = dvDate(p.done);
    // Pictures and Word features filled after the text (see decorateDocx).
    d.progress_bar = "⟦IMG:progress_bar⟧"; d.qr_code = "⟦IMG:qr⟧"; d.page_no = "⟦FIELD:PAGE⟧"; d.page_count = "⟦FIELD:NUMPAGES⟧"; d.project_photos = "⟦PHOTOS:project⟧";
    d.__photos = { project: (Z().pfiles || []).filter(f => f.projectId === p.id && f.kind === "Photo").slice(-4).map(f => ({ fileId: f.fileId, caption: fd(String(f.at || "").slice(0, 10)) })) };
    d.has_project_photos = d.__photos.project.length > 0;
    d.__proj = { id: p.id, ref: p.ref, progress: Number(p.progress || 0), time: d.time_percent === "" ? null : d.time_percent };
  }
  // Values typed on the project for template placeholders the program has no field for.
  Object.entries(p.fields || {}).forEach(([k, val]) => { d[k] === undefined && (d[k] = isISO(val) ? Xt(val) : val); });
  // Own fields of kind "date" get the usual _dv, _dv_dmy, _dash… variants (addYMD below); numbers fill Excel as numbers.
  (Z().ownFields || []).forEach(f => { const raw = (p.fields || {})[f.key]; f.kind === "date" && [["_dv", dvDate], ["_en", enDate], ["_hijri", hijri]].forEach(([x, fn]) => { d[f.key + x] === undefined && (d[f.key + x] = isISO(raw) ? fn(raw) : ""); }); f.kind === "date" && d[f.key + "_iso"] === undefined && (d[f.key + "_iso"] = isISO(raw) ? raw : "");
  });
  (Z().ownFields || []).forEach(f => { f.kind === "number" && d[f.key] !== "" && d[f.key] != null && !isNaN(Number(d[f.key])) && (d.__num[f.key] = Number(d[f.key])); (d[f.key] === undefined || d[f.key] === "") && (d[f.key] = f.def || ""); });
  return addYMD(Object.assign(d, extra));
}
