// Auto-detect: find the values in an original document that change from project to project
// (reference and meeting numbers, dates in every format, Hijri dates, times, amounts, committee
// member names) and suggest the field for each from the words around it. No placeholders need
// to be typed; the result is saved as Replace-text rules, so the original file stays untouched.

const AD_CTX = [
  [/އިޢުލާނ|އިއުލާނ|IUL|iulaan|advertis/i, "iulaan"],
  [/ހުޅުވ|bid opening|opened/i, "opening"],
  [/އިވެލުއޭ|ވަޒަނ|evaluat/i, "eval"],
  [/ޙަވާލު|ހަވާލު|އެވޯޑް|award/i, "award"],
  [/އެގްރީމަންޓ|އެއްބަސްވުމ|agreement/i, "agreement"],
  [/ބައްދަލުވުމ|ބައްދަލުވުނ|ޖަލްސާ|ޙާޟިރުވ|ހާޒިރުވ|meeting/i, "meeting"],
  [/ލަފާކުރ|estimat/i, "estimate"]
];
// The keyword nearest to the value wins (the end of the text before it).
const adCtx = s => { s = String(s).slice(-90); let best = "", at = -1; for (const [re, k] of AD_CTX) { const g = new RegExp(re.source, "gi"); for (const m of s.matchAll(g)) if (m.index > at) { at = m.index; best = k; } } return best; };
const adKind = t => (/Evaluation/.test(t.group || "") ? "eval" : "bid");
const adEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function adDateField(ctx, t, after = "") {
  const c = adCtx(ctx), k = adKind(t);
  // A date followed by a time in a committee document is the meeting's date.
  if (/Committee/.test(t.group || "") && /^[^\d]{0,30}(?:[01]?\d|2[0-3]):[0-5]\d/.test(after) && c !== "iulaan" && c !== "opening") return k + "_meeting_date";
  if (c === "iulaan") return "advertised_date";
  if (c === "opening") return "bid_opening_date";
  if (c === "award") return "award_date";
  if (c === "agreement") return "agreement_date";
  if (c === "meeting") return k + "_meeting_date";
  if (c === "eval") return "evaluation_date";
  return "today";
}

// Find candidates in the paragraphs (and table cells) of a template, in reading order.
function autoDetect(chunks, t) {
  const out = [], seen = {}, MON = [...DVMON, ...DVMON2, "އޮކްޓޫބަރ", "އޯގަސްޓް", "އޮކްޓޯބަރު", "އޮގަސްޓު"].map(adEsc).join("|"), HM = HJMON.map(adEsc).join("|");
  // n = which occurrence of this text in the whole document (the engine counts the same way).
  const occ = (str, f) => str.split(f).length - 1, all = chunks.join("\n");
  let prior = "";
  const add = (find, field, ctx, kind, pre) => { if (!find || !find.trim()) return; out.push({ find, field, ctx: ctx.replace(/[\u202A-\u202E\u200E\u200F]/g, "").replace(/\s+/g, " ").trim().slice(-22), kind, n: occ(prior + pre, find) + 1, total: occ(all, find) }); };
  const st = typeof STAND === "function" ? STAND() : { bid: [], eval: [] };
  const people = [];
  ["bid", "eval"].forEach(k => (st[k] || []).forEach((m, i) => { [m.nameDv, m.name].filter(x => x && x.length > 3).forEach(nm => { people.push([nm, k, i]); const bare = nm.replace(/^(އަލްފާޟިލް|އަލްފާޟިލާ|ޖަނާބު|Mr\.?|Ms\.?|Mrs\.?)\s+/, ""); bare !== nm && bare.length > 3 && people.push([bare, k, i]); }); }));
  people.sort((a, b) => b[0].length - a[0].length);
  const RX = [
    // Hijri dates: 1 ޖުމާދަލްއާޚިރާ 1448 ހ
    ["hijri", new RegExp(`\\d{1,2}\\s+(?:${HM})\\s+\\d{4}\\s?ހ?`, "g")],
    // Dhivehi dates both ways: 28 ޖަނަވަރީ 2026 / 2026 ޖަނަވަރީ 28
    ["dvymd", new RegExp(`\\d{4}\\s+(?:${MON})\\s+\\d{1,2}(?!\\d)`, "g")],
    ["dvdmy", new RegExp(`(?<!\\d)\\d{1,2}\\s+(?:${MON})\\s+\\d{4}`, "g")],
    // Numeric dates: 19.01.2026, 19/01/2026, 19-01-2026
    ["date", /(?<![\d.\/-])\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}(?![\d])/g],
    // Money: MVR 12,500.00 / ރ. 12,500 / 12,500.00
    ["money", /(?:MVR|Rf\.?|ރ\.)\s?\d[\d,]*(?:\.\d{1,2})?|(?<![\d.\/])\d{1,3}(?:,\d{3})+(?:\.\d{2})?(?![\d\/])/g],
    // Reference / meeting / Iulaan numbers: IUL(2026)14, (IUL)351-PRO/2026/031, BC/284/2026-01, PC-284/2026/W-01
    ["ref", /\(?[A-Za-z]{2,}\)?[A-Za-z0-9]*(?:[()\/\-]+[A-Za-z0-9]+)+\)?|\d+\/\d{4}(?:\/[A-Za-z0-9\-]+)?/g],
    // Times: 12:00, 9:30
    ["time", /(?<![\d:])(?:[01]?\d|2[0-3]):[0-5]\d(?![\d:])/g]
  ];
  chunks.forEach((ch, ci) => {
    let text = ch; const before = (chunks[ci - 1] || "") + " ";
    const taken = [];
    const free = (a, b) => !taken.some(([x, y]) => x < b && a < y);
    people.forEach(([nm, k, i]) => { let p = 0; while ((p = text.indexOf(nm, p)) >= 0) { const e = p + nm.length; if (free(p, e)) { taken.push([p, e, nm, t.perMember === k ? "member_name_dv" : `${k}_m${i + 1}_name_dv`, "name"]); } p = e; } });
    RX.forEach(([kind, re]) => { for (const m of text.matchAll(re)) { const a = m.index, s = m[0].trim(), e = a + m[0].length; if (!free(a, e)) continue;
      if (kind === "ref" && (!/\d/.test(s) || /^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$/.test(s) || s.length < 5)) continue;
      taken.push([a, e, s, "", kind]); } });
    taken.sort((x, y) => x[0] - y[0]).forEach(([a, e, s, field, kind]) => {
      const ctx = before.slice(-30) + text.slice(0, a), after = text.slice(e, e + 40);
      if (kind === "money") { const px = (/^(?:MVR|Rf\.?|ރ\.)\s?/.exec(s) || [""])[0]; px && (a += px.length, s = s.slice(px.length)); }
      if (!field) {
        if (kind === "hijri") field = "today_hijri";
        else if (kind === "dvymd") field = adDateField(ctx, t, after) + "_dv_ymd";
        else if (kind === "dvdmy") { const mon = (s.match(new RegExp(MON)) || [""])[0]; field = adDateField(ctx, t, after) + ((DVMON2.includes(mon) && !DVMON.includes(mon)) || /^0\d/.test(s) ? "_dv_dmy" : "_dv"); }
        else if (kind === "date") field = adDateField(ctx, t, after);
        else if (kind === "time") { const prev = (out[out.length - 1] || {}).field || ""; field = /_meeting_date/.test(prev) ? prev.replace(/_date.*$/, "_time") : /^evaluation_date/.test(prev) ? "evaluation_time" : adCtx(ctx) === "eval" ? "evaluation_time" : adKind(t) + "_meeting_time"; }
        else if (kind === "money") field = adCtx(ctx) === "estimate" ? "estimated_cost" : "contract_value";
        else if (kind === "ref") { const c = adCtx(ctx); field = c === "iulaan" || /^IUL|\(IUL\)/i.test(s) ? "iulaan_no" : /^[A-Z]{2,3}-\d+\/\d{4}\//.test(s) ? "ref_no" : /Letter|Memo/i.test(t.group || "") ? "letter_ref" : adKind(t) + "_meeting_no"; }
      }
      add(s, field, ctx, kind, text.slice(0, a));
    });
    prior += ch + "\n";
  });
  return out;
}

// Turn ticked detections into rules: one rule per text, or per occurrence when the same text
// (e.g. one date used for bid opening and evaluation) should become different fields.
function detectToRules(list) {
  const by = {}, rules = [];
  list.forEach(d => { (by[d.find] = by[d.find] || []).push(d); });
  Object.entries(by).forEach(([find, L]) => {
    const fields = [...new Set(L.map(d => d.field))];
    if (fields.length === 1 && L.length === L[0].total) rules.push({ find, field: fields[0] });
    else fields.forEach(f => rules.push({ find, field: f, at: L.filter(d => d.field === f).map(d => d.n) }));
  });
  return rules;
}

function detectPanel(t, chunks, onAdd) {
  const list = autoDetect(chunks, t), box = o("div", {});
  const KL = { name: "Name", hijri: "Hijri date", dvymd: "Date", dvdmy: "Date", date: "Date", money: "Amount", ref: "Number", time: "Time" };
  const pn = DVI(""), pe = I("", { placeholder: "English name, if the file has one" });
  if (!list.length) box.append(o("p", { class: "muted small" }, "No dates, numbers, times, amounts or member names were found in this file."));
  const rows = list.map(d => {
    const cb = o("input", { type: "checkbox", checked: true }), fl = o("input", { type: "text", list: "pcc-fields2", value: d.field, style: { width: "100%", minWidth: "150px" } }), lab = o("div", { class: "muted small" }, fieldLabel(d.field));
    fl.oninput = () => { d.field = fl.value.trim(); lab.textContent = fieldLabel(d.field); };
    d.cb = cb;
    return o("tr", {}, o("td", {}, cb), o("td", {}, o("div", { dir: "auto", style: { fontWeight: 600, whiteSpace: "nowrap" } }, d.find), o("div", { class: "small muted" }, KL[d.kind] || "")), o("td", { dir: "rtl", class: "muted small", lang: "dv", style: { whiteSpace: "nowrap" } }, d.ctx + "…"), o("td", {}, fl, lab));
  });
  list.length && box.append(o("p", { class: "small" }, `${list.length} value${list.length === 1 ? "" : "s"} found. Check the field for each one — the guess comes from the words just before it — and untick anything that should stay as it is (e.g. a fixed date in a law reference).`),
    o("div", { style: { overflowX: "auto" } }, tbl(["", "Text in the file", "Words before it", "Becomes"], rows)));
  box.append(o("div", { class: "pcc-f", style: { marginTop: "10px" } }, o("label", {}, "Project name exactly as written in this file (copy it from the document)"), pn, pe));
  box.append(o("div", { class: "row", style: { marginTop: "8px" } }, btn("Use the ticked values", () => {
    const tick = list.filter(d => d.cb.checked && d.field), rules = detectToRules(tick);
    pn.value.trim() && rules.push({ find: pn.value.trim(), field: "project_name_dv" });
    pe.value.trim() && rules.push({ find: pe.value.trim(), field: "project_name" });
    onAdd(rules); box.replaceChildren(o("p", { class: "pcc-ok small" }, `${rules.length} rule${rules.length === 1 ? "" : "s"} added below. Press Save, then Preview with a project to check.`));
  }, "primary")));
  return box;
}
