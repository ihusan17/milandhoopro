// Project sub-tabs: work logs, progress reports, checklist, completion, retention,
// letters & memos, payments, files, activity; plus the printable summary.

// Generate one template for a project with extra values; asks for "custom" placeholders.
async function genOne(p, code, extra = {}, opts = {}) {
  try {
    need("pdocs");
    const t = tplByCode(code);
    if (!t) throw err(`No template with code ${code}. Add it under Projects > Templates.`);
    let data = applyMap(t, dataFor(p, extra), t.custom || {});
    const asks = Object.entries(t.mapping || {}).filter(([, f]) => f === "@custom").map(([k]) => k).filter(k => data[k] == null || data[k] === "");
    if (asks.length) {
      const ins = asks.map(k => [k, I("")]);
      if (!(await form(`${t.code}: a few more values`, ins.map(([k, e]) => [(t.custom || {})["@label:" + k] || fieldLabel(k), e])))) return null;
      const c = Object.fromEntries(ins.map(([k, e]) => [k, e.value.trim()]));
      data = applyMap(t, dataFor(p, extra), Object.assign({}, t.custom, c));
    }
    if (!(await tplTags(t)).length && !(await jt(`${t.code} has no placeholders or replace rules, so the document will be an unchanged copy of the template. Set it up under Projects › Templates › Replace text. Generate anyway?`, "Generate anyway"))) return null;
    const miss = await missingFor(t, data);
    if (miss.length && !opts.quiet && !(await jt(`${t.code} has empty fields: ${miss.slice(0, 8).map(fieldLabel).join(", ")}${miss.length > 8 ? "…" : ""}. Generate anyway?`, "Generate"))) return null;
    const out = await generateDocs(p, t, data, opts);
    K.Qt();
    if (!opts.noDownload) out.length === 1 ? ii(new Blob([out[0].data], { type: MIME[t.type] }), out[0].name) : ii(new Blob([await zipFiles(out)], { type: MIME.zip }), `${safeName(p.ref)}_${t.code}_${today()}.zip`);
    xt(`${out.length} document${out.length === 1 ? "" : "s"} generated and saved under Files`);
    K.le();
    return out;
  } catch (e) { xt(e.message, "err"); return null; }
}
const genBtn = (p, code, label, extra, opts) => (can("pdocs") && tplByCode(code) ? btn(label, () => genOne(p, code, typeof extra === "function" ? extra() : extra || {}, opts || {}), "small") : null);

// ----- photos -----
async function addPhotos(p, list) {
  const ids = [];
  for (const f of list) { if (!/^image\//.test(f.type)) continue; if (f.size > 8 * 1048576) { xt(f.name + " is larger than 8 MB", "err"); continue; } const u8 = await shrinkImage(f); const id = await fput(u8, { name: f.name.replace(/\.\w+$/, ".jpg"), mime: "image/jpeg" }); ids.push(id); Z().pfiles.push({ id: uid(), projectId: p.id, name: f.name.replace(/\.\w+$/, ".jpg"), size: u8.length, mime: "image/jpeg", fileId: id, at: Vt(), by: me(), kind: "Photo" }); }
  return ids;
}
async function shrinkImage(f) {
  try {
    const bmp = await createImageBitmap(f), s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = o("canvas", {}); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return toU8(await new Promise(r => c.toBlob(r, "image/jpeg", .82)));
  } catch { return toU8(f); }
}
function thumbs(ids) {
  if (!ids || !ids.length) return null;
  return o("div", { class: "pcc-thumbs" }, ids.map(id => { const im = o("img", { alt: "Photo", loading: "lazy" }); fget(id).then(u => { im.src = URL.createObjectURL(new Blob([u], { type: "image/jpeg" })); }).catch(() => { im.alt = "Photo not available on this device yet"; }); return o("button", { type: "button", class: "pcc-th", onclick: () => fget(id).then(u => previewFile(u, "photo.jpg", "Photo")).catch(e => xt(e.message, "err")) }, im); }));
}
const photoInput = () => o("input", { type: "file", accept: "image/*", multiple: true });

// ----- Work logs -----
function logForm(p) {
  if (!can("plogs")) return null;
  const d = D(today()), act = o("textarea", { rows: 3, dir: "auto", placeholder: "Work done today" }), wk = N("", { min: 0, placeholder: "e.g. 12" }), mat = I("", { placeholder: "Materials used or delivered" }), wea = S(["", "Sunny", "Cloudy", "Rain", "Heavy rain", "Strong wind", "Rough sea"], ""), iss = I("", { placeholder: "Problems, delays, safety" }), by = I(Z().ui.logBy || me()), ph = photoInput();
  return card("Add a work log entry", o("div", { class: "grid2" }, L("Date", d), L("Entered by", by), L("Workers on site", wk), L("Weather", wea)), L("Activity", act), o("div", { class: "grid2" }, L("Materials", mat), L("Issues", iss)), L("Photos", ph), o("div", { class: "row", style: { marginTop: "10px" } }, btn("Add entry", async () => {
    try {
      need("plogs"); if (!d.value) throw err("Choose the date"); if (!act.value.trim()) throw err("Describe the work done");
      const photos = await addPhotos(p, [...ph.files]);
      save(() => { p.logs.push({ id: uid(), date: d.value, text: act.value.trim().slice(0, 4000), workers: wk.value === "" ? "" : Number(wk.value), materials: mat.value.trim(), weather: wea.value, issues: iss.value.trim(), photos, by: by.value.trim(), at: Vt() }); Z().ui.logBy = by.value.trim(); audit(p, "Work log added", Xt(d.value)); }, "Work log saved");
    } catch (e) { xt(e.message, "err"); }
  }, "primary")));
}
function tLogs(n, p) {
  const L2 = p.logs.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.at).localeCompare(String(a.at)));
  n.append(o("div", { class: "split stack" }, o("div", {}, logForm(p)), o("div", {}, card(`Work log (${L2.length})`, L2.length ? o("div", { class: "pcc-feed" }, L2.map(l => o("div", { class: "pcc-log" }, o("div", { class: "pcc-log-h" }, o("b", {}, fd(l.date)), l.weather ? o("span", { class: "pcc-tag" }, l.weather) : null, l.workers !== "" && l.workers != null ? o("span", { class: "pcc-tag" }, l.workers + " workers") : null, l.hours ? o("span", { class: "pcc-tag" }, l.hours + " h") : null, o("span", { class: "muted small grow right" }, l.by || ""), can("plogs") ? btn("Delete", async () => { (await jt("Delete this entry?", "Delete")) && save(() => { p.logs = p.logs.filter(x => x !== l); audit(p, "Work log deleted", Xt(l.date)); }, "Deleted"); }, "small") : null), o("div", { dir: "auto", class: "pcc-pre" }, l.text), l.materials ? o("div", { class: "small" }, o("b", {}, "Materials: "), l.materials) : null, l.issues ? o("div", { class: "small pcc-issue" }, o("b", {}, "Issues: "), l.issues) : null, thumbs(l.photos)))) : o("p", { class: "muted" }, "No entries yet.")))));
}

// ----- Progress reports -----
function tProgress(n, p) {
  const L2 = p.reports.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const form1 = can("plogs") ? (() => { const d = D(today()), per = I("", { placeholder: "e.g. October 2026" }), pc = N(p.progress ?? 0, { min: 0, max: 100 }), rem = o("textarea", { rows: 4, dir: "auto" }), ph = photoInput(); return card("New progress report", o("div", { class: "grid2" }, L("Report date", d), L("Period covered", per), L("Physical progress (%)", pc)), L("Remarks", rem), L("Photos", ph), btn("Save report", async () => { try { need("plogs"); const v = Number(pc.value); if (!(v >= 0 && v <= 100)) throw err("Progress must be 0–100"); const photos = await addPhotos(p, [...ph.files]); save(() => { p.reports.push({ id: uid(), date: d.value || today(), period: per.value.trim(), pct: v, remarks: rem.value.trim(), photos, by: me(), at: Vt() }); p.progress = v; isOngoing(p) && p.status === "Handed over" && (p.status = "Ongoing"); audit(p, "Progress report", v + "%"); }, "Report saved — progress is now " + v + "%"); } catch (e) { xt(e.message, "err"); } }, "primary")); })() : null;
  n.append(o("div", { class: "split stack" }, o("div", {}, form1, card("Progress", dualBar(p), o("p", { class: "muted small" }, "Time elapsed since handover compared with physical progress. The bar turns red when work is more than 10 points behind time."))), o("div", {}, card(`Reports (${L2.length})`, L2.length ? o("div", { class: "pcc-feed" }, L2.map(r => o("div", { class: "pcc-log" }, o("div", { class: "pcc-log-h" }, o("b", {}, fd(r.date)), r.period ? o("span", { class: "pcc-tag" }, r.period) : null, o("span", { class: "pcc-tag win" }, r.pct + "%"), o("span", { class: "grow" }), genBtn(p, "WPR", "Generate report", () => ({ report_date: Xt(r.date), report_date_dv: dvDate(r.date), report_period: r.period, report_percent: r.pct, report_remarks: r.remarks }), { key: "r" + r.id })), r.remarks ? o("div", { dir: "auto", class: "pcc-pre" }, r.remarks) : null, thumbs(r.photos)))) : o("p", { class: "muted" }, "No reports yet.")), docsCard(p, ["Reports"], "Generated reports"))));
}

// ----- Checklist -----
const CHECKS = {
  Works: ["Agreement signed", "Performance guarantee received", "Advance payment guarantee received", "Insurance documents received", "Site handed over to contractor", "Work programme approved", "Site meeting held", "Monthly progress reports received", "Variations approved in writing", "Final inspection done", "Snag list cleared", "Work completion certificate issued", "As-built drawings received", "Retention period started", "Retention released"],
  Goods: ["Purchase order / agreement issued", "Delivery schedule agreed", "Goods delivered", "Goods inspected", "Goods received note signed", "Warranty documents received", "Invoice received", "Payment made"],
  Consultancy: ["Contract signed", "Inception report received", "Draft report received", "Comments sent to the consultant", "Final report received", "Invoice received", "Payment made"],
  "Non-consultancy": ["Agreement signed", "Service start confirmed", "Monthly service report received", "Service quality reviewed", "Invoice received", "Payment made", "Service completion confirmed"],
};
const defaultChecklist = type => (CHECKS[type] || CHECKS.Works).map(t => ({ id: uid() + Math.random(), text: t, done: false, date: "", by: "", fileId: null }));
function tChecklist(n, p) {
  const L2 = p.checklist, done = L2.filter(x => x.done).length, pc = L2.length ? Math.round(done / L2.length * 100) : 0, ed = can("plogs");
  n.append(card(`Checklist — ${done} of ${L2.length} done`, K.PBAR(pc),
    L2.length ? o("div", { class: "pcc-checks" }, L2.map((x, i) => o("div", { class: "pcc-ck" + (x.done ? " done" : "") }, o("input", { type: "checkbox", checked: x.done, disabled: !ed, "aria-label": x.text, onchange: e => save(() => { need("plogs"); x.done = e.target.checked; x.date = x.done ? today() : ""; x.by = x.done ? me() : ""; audit(p, (x.done ? "Ticked: " : "Unticked: ") + x.text); }) }), o("div", { class: "grow" }, o("div", { dir: "auto" }, x.text), x.done ? o("div", { class: "muted small" }, `${fd(x.date)} · ${x.by}`) : null), x.fileId ? btn("Attachment", () => fdownload(x.fileId, x.fileName || "attachment").catch(e => xt(e.message, "err")), "small") : null, ed ? btn(x.fileId ? "Replace file" : "Attach", async () => { const f = await pickFile("*/*"); if (!f) return; try { if (f.size > 15 * 1048576) throw err("Larger than 15 MB"); const id = await fput(f, { name: f.name, mime: f.type }); save(() => { x.fileId = id; x.fileName = f.name; Z().pfiles.push({ id: uid(), projectId: p.id, name: f.name, size: f.size, mime: f.type, fileId: id, at: Vt(), by: me(), kind: "Checklist" }); audit(p, "Checklist attachment", x.text); }, "Attached"); } catch (e) { xt(e.message, "err"); } }, "small") : null, ed ? btn("✕", () => save(() => { p.checklist.splice(i, 1); }, "Removed"), "small") : null))) : o("p", { class: "muted" }, "No checklist items."),
    ed ? (() => { const t = I("", { placeholder: "New checklist item" }); return o("div", { class: "row", style: { marginTop: "10px", alignItems: "center" } }, o("div", { class: "grow" }, t), btn("Add", () => save(() => { if (!t.value.trim()) throw err("Type the item"); p.checklist.push({ id: uid(), text: t.value.trim(), done: false }); }, "Added")), btn("Add standard " + p.type + " items", () => save(() => { const have = new Set(p.checklist.map(x => x.text)); defaultChecklist(p.type).forEach(x => have.has(x.text) || p.checklist.push(x)); }, "Added"))); })() : null,
    o("div", { class: "row", style: { marginTop: "10px" } }, genBtn(p, "CHK", "Generate checklist document"))));
}

// ----- Completion -----
function tCompletion(n, p) {
  const ed = can("projects");
  n.append(o("div", { class: "split stack" }, o("div", {}, card("Completion", kvs([["Due date", fd(p.due)], ["Actual completion", fd(p.done)], ["Finished", p.done && p.due ? (p.done <= p.due ? "On time" : dDiff(p.due, p.done) + " days late") : "—"], ["Status", stChip(p.status)]]),
    ed && !["Completed", "In retention", "Closed"].includes(p.status) ? (() => { const d = D(today()), rem = o("textarea", { rows: 3, dir: "auto", placeholder: "Completion remarks" }); return o("div", {}, o("h4", {}, "Mark the work as completed"), o("div", { class: "grid2" }, L("Completion date", d)), L("Remarks", rem), btn("Mark completed", async () => { if (!d.value) return xt("Choose the date", "err"); if (!(await jt(`Mark ${p.ref} completed on ${fd(d.value)}?${p.retentionPct && p.retentionDays ? ` The ${p.retentionDays}-day retention period starts.` : ""}`, "Mark completed"))) return; save(() => { need("projects"); p.done = d.value; p.progress = 100; p.completionRemarks = rem.value.trim(); p.status = p.retentionPct && p.retentionDays ? "In retention" : "Completed"; recalcDue(p); audit(p, "Work completed", fd(d.value)); }, "Marked completed"); }, "primary")); })() : null,
    p.completionRemarks ? o("p", { dir: "auto", class: "pcc-para" }, p.completionRemarks) : null,
    o("div", { class: "row", style: { gap: "8px", marginTop: "10px" } }, genBtn(p, "WCL", "Work Completion Letter", () => ({ completion_remarks: p.completionRemarks || "" })), genBtn(p, "WCR", "Work Completion Report", () => ({ completion_remarks: p.completionRemarks || "" }))))), o("div", {}, docsCard(p, [], "Completion documents", ["WCL", "WCR"]))));
}

// ----- Retention -----
function tRetention(n, p) {
  const amt = p.contract != null && p.retentionPct ? Math.round(p.contract * p.retentionPct / 100) : null, pt = payTotals(p), ed = can("projects");
  n.append(o("div", { class: "split stack" }, o("div", {}, card("Retention", kvs([["Retention", p.retentionPct ? p.retentionPct + "%" : "Not set (edit the project)"], ["Retention amount", mvr(amt)], ["Retention held (from payments)", mvr(pt.retentionHeld)], ["Period", p.retentionDays ? p.retentionDays + " days" : ""], ["Starts", fd(p.done)], ["Ends", fd(p.retentionEnd)], ["Countdown", retChip(p)], ["Released", p.retentionReleased ? `${fd(p.retentionReleased.date)} · ${mvr(p.retentionReleased.amount)}` : "Not yet"]]),
    ed && p.status === "In retention" && !p.retentionReleased ? btn("Release retention…", async () => { const d = D(today()), a = MI(pt.retentionHeld || amt); if (!(await form("Release retention", [["Release date", d], ["Amount (MVR)", a]], { check: () => parseMoney(a, "Amount") }))) return; save(() => { need("projects"); const v = parseMoney(a, "Amount"); p.retentionReleased = { date: d.value, amount: v }; p.payments.push({ id: uid(), kind: "Retention release", amount: v, status: "Planned", trigger: "End of retention period", at: Vt() }); p.status = "Closed"; audit(p, "Retention released", mvr(v)); }, "Retention released — a payment line was added under Payments"); }, "primary") : null)),
    o("div", {}, card("Retention period reports", (p.retReports || []).length ? tbl(["Date", "Defects", "Remarks", ""], p.retReports.slice().reverse().map(r => o("tr", {}, o("td", {}, fd(r.date)), o("td", { dir: "auto" }, r.defects || "None"), o("td", { dir: "auto" }, r.remarks || ""), o("td", {}, genBtn(p, "RPR", "Generate", () => ({ report_date: Xt(r.date), report_date_dv: dvDate(r.date), defects: r.defects, report_remarks: r.remarks }), { key: "rr" + r.id }))))) : o("p", { class: "muted" }, "No inspections recorded."),
      can("plogs") ? (() => { const d = D(today()), df = o("textarea", { rows: 2, dir: "auto", placeholder: "Defects found" }), rm = o("textarea", { rows: 2, dir: "auto", placeholder: "Remarks" }); return o("div", {}, o("h4", {}, "Record an inspection"), L("Date", d), L("Defects", df), L("Remarks", rm), btn("Save", () => save(() => { need("plogs"); (p.retReports = p.retReports || []).push({ id: uid(), date: d.value || today(), defects: df.value.trim(), remarks: rm.value.trim(), by: me() }); audit(p, "Retention inspection", fd(d.value)); }, "Saved"))); })() : null))));
}

// ----- Letters & memos -----
function tLetters(n, p) {
  const T = TPL().filter(t => ["Letters", "Memos"].includes(t.group) && t.active !== false).sort((a, b) => a.code.localeCompare(b.code));
  n.append(card("Letters and memos", can("pdocs") ? o("div", { class: "pcc-tiles" }, T.map(t => o("button", { type: "button", class: "pcc-tile", onclick: () => compose(p, t) }, o("b", {}, t.nameEn), t.nameDv ? o("span", { dir: "rtl", lang: "dv" }, t.nameDv) : null, o("small", { class: "muted" }, t.code)))) : o("p", { class: "muted" }, "Your role cannot create letters."), o("p", { class: "muted small" }, "Reference numbers are taken automatically and never reused. Change the patterns under Templates > Reference numbers.")), docsCard(p, ["Letters", "Memos"], "Issued letters and memos"));
}
async function compose(p, t) {
  const kind = t.group === "Memos" ? "memo" : "letter", v = vendorOf(p), isEot = /EOT/i.test(t.code), date = D(today()), toN = I(t.group === "Memos" ? "" : p.vendor || ""), toA = I(t.group === "Memos" ? "" : v.address || ""), subj = I(""), body = DVT(""), sig = I(me()), des = I(((K.STF() || []).find(s => s.email === (ME() || {}).email) || {}).designation || "");
  const eDays = N("", { min: 1 }), eReason = I(""), eRec = o("input", { type: "checkbox", checked: true });
  body.rows = 8;
  if (!(await form(`${t.nameEn} — ${p.ref}`, [["Date", date], ["Reference", o("input", { type: "text", value: refPeek(kind, p) + " (taken when generated)", readOnly: true })], ["To", toN], ["Address", toA], o("div", { style: { gridColumn: "1/-1" } }, L("Subject", subj), L("Text (Dhivehi or English)", body)), ["Signed by", sig], ["Designation", des], ...(isEot ? [["Extension (days)", eDays], ["Reason", eReason], o("label", { class: "pcc-chk", style: { gridColumn: "1/-1" } }, eRec, " Also record the extension and move the due date")] : [])], { top: kbToggle(), ok: "Generate", check: () => { if (isEot && !(Number(eDays.value) > 0)) throw err("Type the extension days"); } }))) return;
  const ref = refNext(kind, p), nd = isEot ? dAdd(p.due, Number(eDays.value)) : "";
  const extra = { letter_ref: ref, memo_ref: ref, letter_date: Xt(date.value), letter_date_dv: dvDate(date.value), letter_date_en: enDate(date.value), letter_date_hijri: hijri(date.value), recipient_name: toN.value.trim(), recipient_address: toA.value.trim(), subject: subj.value.trim(), body: body.value, signatory_name: sig.value.trim(), signatory_designation: des.value.trim(), eot_days: eDays.value, eot_reason: eReason.value.trim(), new_due_date: nd ? Xt(nd) : "", new_due_date_dv: dvDate(nd) };
  const out = await genOne(p, t.code, extra, { ref, quiet: true });
  if (out && isEot && eRec.checked) save(() => { p.eots.push({ id: uid(), days: Number(eDays.value), reason: eReason.value.trim(), approved: date.value, letterRef: ref }); recalcDue(p); audit(p, "Extension of time granted", `${eDays.value} days → due ${fd(p.due)}`); }, "Due date moved to " + fd(nd));
  else if (!out) { /* number stays used: references are never reused */ K.Qt(); }
}

// ----- Payments -----
const PAYKINDS = ["Advance", "Interim", "Final", "Retention release"];
function tPayments(n, p) {
  const pt = payTotals(p), ed = can("payments");
  n.append(o("div", { class: "stats pcc-kpis" }, [["Contract value", mvr(p.contract)], ["Paid (gross)", mvr(pt.gross)], ["Paid (net of retention)", mvr(pt.totalPaid)], ["Balance", mvr(pt.balance)], ["Retention held", mvr(pt.retentionHeld)], ["Retention released", mvr(p.retentionReleased ? p.retentionReleased.amount : 0)]].map(([k, v]) => o("div", { class: "stat" }, o("div", { class: "k" }, k), o("div", { class: "v small" }, v)))),
    card("Payment schedule", p.payments.length ? tbl(["#", "Payment", "Amount (MVR)", "Retention", "Due when", "Invoice", "Memo ref", "Status", ""], p.payments.map((x, i) => o("tr", {}, o("td", {}, i + 1), o("td", {}, x.kind, x.pct ? o("span", { class: "muted small" }, ` (${x.pct}%)`) : null), o("td", { class: "money" }, money(x.amount)), o("td", { class: "money" }, x.retention ? money(x.retention) : ""), o("td", { dir: "auto" }, x.trigger || ""), o("td", {}, x.invoice || ""), o("td", { class: "nowrap" }, x.memoRef || ""), o("td", {}, stChip(x.status), x.paidDate ? o("div", { class: "muted small" }, fd(x.paidDate)) : null),
      o("td", { class: "pcc-acts" }, ed ? [btn("Edit", () => payEdit(p, x), "small"), can("pdocs") && tplByCode("PAY-MEMO") ? btn(x.memoRef ? "New memo version" : "Payment memo", () => payMemo(p, x, i), "small") : null, x.status !== "Paid" ? btn("Mark paid", async () => { const d = D(today()); if (await form("Mark paid", [["Paid on", d]])) save(() => { need("payments"); x.status = "Paid"; x.paidDate = d.value || today(); audit(p, "Payment marked paid", `${x.kind} · ${mvr(x.amount)}`); }, "Marked paid"); }, "small") : null, x.status !== "Paid" ? btn("✕", async () => { (await jt("Remove this payment line?", "Remove")) && save(() => { p.payments = p.payments.filter(y => y !== x); audit(p, "Payment line removed", x.kind); }, "Removed"); }, "small") : null] : null)))) : o("p", { class: "muted" }, "No payments scheduled."), ed ? o("div", { class: "row", style: { gap: "8px", marginTop: "10px" } }, btn("Add payment", () => payEdit(p, null)), !p.payments.length && p.contract ? btn("Typical schedule (advance 20%, interim, final)", () => save(() => { need("payments"); const c = p.contract, r = p.retentionPct || 0, a = Math.round(c * .2); p.payments.push({ id: uid(), kind: "Advance", pct: 20, amount: a, retention: 0, trigger: "On signing, against an advance payment guarantee", status: "Planned" }, { id: uid(), kind: "Interim", pct: 40, amount: Math.round(c * .4), retention: Math.round(c * .4 * r / 100), trigger: "On 50% physical progress", status: "Planned" }, { id: uid(), kind: "Final", pct: 40, amount: c - a - Math.round(c * .4), retention: Math.round((c - a - Math.round(c * .4)) * r / 100), trigger: "On completion", status: "Planned" }); audit(p, "Payment schedule added"); }, "Schedule added — adjust it as needed")) : null) : null),
    docsCard(p, ["Payments"], "Payment memos"));
}
async function payEdit(p, x) {
  const v = x || {}, kind = S(PAYKINDS, v.kind || "Interim"), pct = N(v.pct ?? "", { min: 0, max: 100, step: .5 }), amt = MI(v.amount), ret = MI(v.retention), trig = I(v.trigger || ""), inv = I(v.invoice || ""), st = S(["Planned", "Memo issued", "Paid"], v.status || "Planned");
  pct.addEventListener("input", () => { if (p.contract && pct.value) { amt.value = _e(Math.round(p.contract * Number(pct.value) / 100)); if (p.retentionPct && kind.value !== "Advance" && kind.value !== "Retention release") ret.value = _e(Math.round(p.contract * Number(pct.value) / 100 * p.retentionPct / 100)); } });
  if (!(await form(x ? "Edit payment" : "Add payment", [["Payment", kind], ["% of contract", pct], ["Amount (MVR)", amt], ["Retention deducted (MVR)", ret], ["Due when", trig], ["Invoice no.", inv], ["Status", st]], { check: () => { if (parseMoney(amt, "Amount") == null) throw err("Type the amount"); parseMoney(ret, "Retention"); } }))) return;
  save(() => { need("payments"); const o2 = { kind: kind.value, pct: pct.value === "" ? null : Number(pct.value), amount: parseMoney(amt, "Amount"), retention: parseMoney(ret, "Retention") || 0, trigger: trig.value.trim(), invoice: inv.value.trim(), status: st.value }; if (x) Object.assign(x, o2); else p.payments.push({ id: uid(), ...o2, at: Vt() }); audit(p, "Payment " + (x ? "changed" : "added"), `${o2.kind} · ${mvr(o2.amount)}`); }, "Saved");
}
async function payMemo(p, x, i) {
  const prev = p.payments.filter(y => y !== x && y.status === "Paid").reduce((a, y) => a + (y.amount || 0), 0), ref = refNext("paymemo", p), net = (x.amount || 0) - (x.retention || 0);
  const extra = { memo_ref: ref, letter_ref: ref, letter_date: Xt(today()), letter_date_dv: dvDate(today()), payment_kind: x.kind, payment_no: i + 1, payment_amount: ht(x.amount), payment_amount_words_dv: dvMoneyWords(x.amount), payment_amount_words_en: enMoneyWords(x.amount), previous_payments: ht(prev), retention_deducted: ht(x.retention || 0), net_payment: ht(net), net_payment_words_dv: dvMoneyWords(net), net_payment_words_en: enMoneyWords(net), invoice_no: x.invoice || "", signatory_name: me() };
  const out = await genOne(p, "PAY-MEMO", extra, { ref, key: "pay" + x.id, quiet: true });
  if (out) save(() => { x.memoRef = ref; x.status === "Planned" && (x.status = "Memo issued"); }, "Payment memo " + ref);
  else K.Qt();
}

// ----- Files -----
function tFiles(n, p) {
  const G = Z().pdocs.filter(d => d.projectId === p.id).sort((a, b) => String(b.at).localeCompare(String(a.at))), U = Z().pfiles.filter(d => d.projectId === p.id).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  n.append(card(`Uploaded files (${U.length})`, can("plogs") || can("pdocs") ? o("div", { class: "row", style: { marginBottom: "10px", gap: "8px" } }, btn("Upload file", async () => { const f = await pickFile("*/*"); if (!f) return; try { if (f.size > 15 * 1048576) throw err("The file is larger than 15 MB"); const id = await fput(f, { name: f.name, mime: f.type }), ver = 1 + Math.max(0, ...U.filter(x => x.name === f.name).map(x => x.version || 1)); save(() => { Z().pfiles.push({ id: uid(), projectId: p.id, name: f.name, size: f.size, mime: f.type, fileId: id, at: Vt(), by: me(), kind: "Upload", version: ver }); audit(p, "File uploaded", f.name + (ver > 1 ? " v" + ver : "")); }, "Uploaded"); } catch (e) { xt(e.message, "err"); } }, "primary")) : null, U.length ? docTable(U.map(d => ({ kind: "file", d, p })), false) : o("p", { class: "muted" }, "No uploads yet. Photos added to work logs and reports appear here too.")),
    card(`Generated documents (${G.length})`, G.length ? docTable(G.map(d => ({ kind: "gen", d, p })), false) : o("p", { class: "muted" }, "Nothing generated yet.")));
}

// ----- Activity -----
function tActivity(n, p) {
  n.append(card("Activity", (p.activity || []).length ? tbl(["When", "Who", "What", "Details"], p.activity.map(a => o("tr", {}, o("td", { class: "nowrap" }, fd(String(a.at).slice(0, 10)), o("div", { class: "muted small" }, String(a.at).slice(11, 16))), o("td", { dir: "auto" }, a.by), o("td", {}, a.action), o("td", { dir: "auto", class: "small" }, a.detail)))) : o("p", { class: "muted" }, "Nothing recorded yet.")));
}

// ----- Print summary -----
function printSummary(p) {
  const root = document.getElementById("printroot"); if (!root) return window.print();
  const pt = payTotals(p), row = (k, v) => o("tr", {}, o("th", {}, k), o("td", { dir: "auto" }, v == null || v === "" ? "—" : v));
  root.replaceChildren(o("div", { class: "pcc-print" }, o("h1", {}, p.nameEn || p.name), p.nameDv ? o("h2", { dir: "rtl", lang: "dv" }, p.nameDv) : null, o("p", {}, `${p.ref} · ${p.type} · ${p.status} · printed ${fd(today())}`),
    o("table", {}, o("tbody", {}, row("Contractor", p.vendor), row("Contract value", mvr(p.contract)), row("Location", p.location), row("Project officer", p.officer), row("Iulaan", fd(p.advertised)), row("Award", fd(p.award)), row("Agreement", fd(p.agreement)), row("Handover", fd(p.handover)), row("Duration", p.duration ? p.duration + " days" : ""), row("Due date", fd(p.due) + (extDays(p) ? ` (incl. ${extDays(p)} days extension)` : "")), row("Time left", cdText(daysLeft(p), isDone(p), p.status)), row("Progress", (p.progress || 0) + "%"), row("Completed", fd(p.done)), row("Retention", p.retentionPct ? `${p.retentionPct}% · ends ${fd(p.retentionEnd)}` : ""), row("Paid (net)", mvr(pt.totalPaid)), row("Balance", mvr(pt.balance)))),
    p.bidders.length ? [o("h3", {}, "Bids"), o("table", {}, o("tbody", {}, p.bidders.map(b => row(`${b.rank ? "#" + b.rank + " " : ""}${b.vendor}`, `${mvr(b.amount)}${b.total != null ? " · score " + b.total : ""}${b.awarded ? " · AWARDED" : ""}`))))] : null,
    p.logs.length ? [o("h3", {}, "Latest work log"), o("table", {}, o("tbody", {}, p.logs.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8).map(l => row(fd(l.date), l.text))))] : null));
  document.body.classList.add("printing");
  const done = () => { document.body.classList.remove("printing"); root.replaceChildren(); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done); setTimeout(() => window.print(), 60);
}
