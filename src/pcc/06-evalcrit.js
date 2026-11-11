// Evaluation criteria per project (e.g. Price 75%, Duration 15%, Experience 10%).
// Each bidder's points are worked out from the bids received; the total ranks the bidders and
// fills the evaluation templates. An evaluation sheet (Excel) can be generated from it.
//   lowest : the lowest value gets full marks, others lowest / value × weight (price, duration)
//   per    : marks per document / item, up to the weight (experience: 2 marks per similar-work letter)
//   manual : points typed for each bidder, up to the weight (technical, financial, other)
const CRIT_TYPES = [
  ["price", "Price", "އަގު", "lowest", "Bid amount"],
  ["duration", "Duration", "މުއްދަތު", "lowest", "Days offered"],
  ["experience", "Experience", "ތަޖުރިބާ", "per", "Documents (similar works)"],
  ["technical", "Technical", "ޓެކްނިކަލް", "manual", "Technical points"],
  ["financial", "Financial", "ފައިނޭންޝަލް", "manual", "Financial points"],
  ["other", "Other", "އެހެނިހެން", "manual", "Points"]
];
const critType = t => CRIT_TYPES.find(x => x[0] === t) || CRIT_TYPES[5];
const CRIT_PRESETS = [
  ["Price 75 · Duration 15 · Experience 10", [["price", 75], ["duration", 15], ["experience", 10, 2]]],
  ["Price 80 · Duration 20", [["price", 80], ["duration", 20]]],
  ["Technical 70 · Financial 30", [["technical", 70], ["financial", 30]]],
  ["Price 100", [["price", 100]]]
];
const critsOf = p => (Array.isArray(p.criteria) ? p.criteria : []).filter(c => Number(c.weight) > 0);
const r2 = v => Math.round(v * 100) / 100;
// The value a bidder offers for a criterion.
function critValue(b, c) {
  if (c.type === "price") return b.amount == null ? null : b.amount / 100;
  if (c.type === "duration") return b.duration ?? null;
  if (c.type === "experience") return b.experience ?? null;
  if (c.type === "technical") return b.tech ?? null;
  if (c.type === "financial") return b.fin ?? null;
  const v = (b.scores || {})[c.key]; return v === "" || v == null ? null : Number(v);
}
// Points for every responsive bidder; sets b.points and b.total. Not-responsive bidders get none.
function critApply(p) {
  const C = critsOf(p); if (!C.length) return false;
  const R = (p.bidders || []).filter(b => b.responsive !== false);
  C.forEach(c => {
    const how = critType(c.type)[3], W = Number(c.weight), vals = R.map(b => critValue(b, c)).filter(v => v != null && v > 0), low = vals.length ? Math.min(...vals) : null;
    R.forEach(b => { const v = critValue(b, c); let pt = null;
      if (v != null) pt = how === "lowest" ? (v > 0 && low ? (low / v) * W : 0) : how === "per" ? Math.min(v * (Number(c.per) || 1), W) : Math.min(Number(v) || 0, W);
      (b.points = b.points || {})[c.key] = pt == null ? null : r2(pt); });
  });
  (p.bidders || []).forEach(b => {
    if (b.responsive === false) { b.points = {}; b.total = null; return; }
    const pts = C.map(c => (b.points || {})[c.key]); b.total = pts.every(v => v == null) ? null : r2(pts.reduce((a, v) => a + (v || 0), 0));
  });
  return true;
}
const critLine = p => critsOf(p).map(c => `${c.label || critType(c.type)[1]} ${c.weight}%` + (c.type === "experience" || critType(c.type)[3] === "per" ? ` (${c.per || 1} per document)` : "")).join(" · ");

async function critEdit(p) {
  const cur = critsOf(p).length ? critsOf(p) : (Z().critDefault || []);
  const rows = o("div", { class: "pcc-crit-rows" }), sum = o("b", {}), list = [];
  const addRow = (c = {}) => {
    const t = c.type || "other", T = critType(t), on = o("input", { type: "checkbox", checked: c.weight != null ? Number(c.weight) > 0 : false }), w = I(c.weight ?? "", { inputmode: "decimal", placeholder: "%", style: { width: "70px" } });
    const lab = I(c.label || (t === "other" ? "" : T[1]), { placeholder: "Name (English)", style: { width: "130px" } }), labDv = DVI(c.labelDv || (t === "other" ? "" : T[2]), { placeholder: "ނަން", style: { width: "130px" } });
    const per = I(c.per ?? (t === "experience" ? 2 : ""), { inputmode: "decimal", style: { width: "60px" } });
    const r = { t, on, w, lab, labDv, per, key: c.key || (t === "other" ? "other" + uid().toString(36) : t) };
    const how = { lowest: "Lowest gets full marks", per: "Marks per document", manual: "Points typed per bidder" }[T[3]];
    const el = o("div", { class: "pcc-crit-row" }, o("label", { class: "pcc-chk" }, on, " ", o("b", {}, T[1])), lab, labDv, o("span", { class: "pcc-crit-w" }, w, "%"), T[3] === "per" ? o("span", { class: "pcc-crit-w" }, per, o("small", {}, " marks / document")) : o("span", { class: "muted small" }, how), t === "other" ? btn("✕", () => { el.remove(); list.splice(list.indexOf(r), 1); total(); }, "small") : null);
    [on, w, per].forEach(x => x.addEventListener("input", total)); on.addEventListener("change", total);
    list.push(r); rows.append(el); return r;
  };
  const total = () => { const s2 = list.filter(r => r.on.checked).reduce((a, r) => a + (Number(r.w.value) || 0), 0); sum.textContent = r2(s2) + "%"; sum.className = Math.abs(s2 - 100) < 0.01 ? "pcc-ok" : "pcc-req"; };
  const draw = src => { rows.replaceChildren(); list.length = 0; CRIT_TYPES.filter(T => T[0] !== "other").forEach(T => { const c = src.find(x => x.type === T[0]); addRow(c ? { ...c } : { type: T[0] }); }); src.filter(x => x.type === "other").forEach(c => addRow(c)); total(); };
  draw(cur);
  const presets = o("div", { class: "row", style: { gap: "6px", flexWrap: "wrap" } }, o("span", { class: "muted small" }, "Quick set:"), CRIT_PRESETS.map(([l, P]) => btn(l, () => draw(P.map(([t, w, per]) => ({ type: t, weight: w, per }))), "small")));
  const ok = await form("Evaluation criteria — " + p.ref, [o("div", { style: { gridColumn: "1/-1" } }, presets, o("p", { class: "muted small" }, "Tick the criteria used for this project and give each a percentage; together they must make 100%. Price and duration: the lowest gets full marks, others lowest ÷ theirs × weight. Experience: marks for each similar-work document, up to its weight. Technical, financial and other: points typed for each bidder."), rows, o("div", { class: "row", style: { marginTop: "8px", alignItems: "center", gap: "10px" } }, btn("+ Other criterion", () => { addRow({ type: "other", weight: 0 }).on.checked = true; total(); }, "small"), o("span", {}, "Total: ", sum)))], {
    one: true, check: () => { const L = list.filter(r => r.on.checked); if (!L.length) throw err("Tick at least one criterion"); const s2 = L.reduce((a, r) => a + (Number(r.w.value) || 0), 0); if (Math.abs(s2 - 100) > 0.01) throw err(`The percentages make ${r2(s2)}% — they must make 100%`); L.forEach(r => { if (!(Number(r.w.value) > 0)) throw err((r.lab.value || "A criterion") + ": type its percentage"); if (r.t === "other" && !r.lab.value.trim() && !r.labDv.value.trim()) throw err("Name the other criterion"); }); }
  });
  if (!ok) return;
  save(() => {
    need("pdocs");
    p.criteria = list.filter(r => r.on.checked).map(r => ({ key: r.key, type: r.t, label: r.lab.value.trim() || critType(r.t)[1], labelDv: r.labDv.value.trim() || critType(r.t)[2], weight: Number(r.w.value), ...(critType(r.t)[3] === "per" ? { per: Number(r.per.value) || 1 } : {}) }));
    Z().critDefault = p.criteria.map(c => ({ ...c }));
    autoRank(p); audit(p, "Evaluation criteria set", critLine(p));
  }, "Criteria saved");
}

// Card on the Summary: the criteria as chips, and the actions.
function critCard(p) {
  const C = critsOf(p), ed = can("pdocs");
  return o("div", { class: "card pcc-crit" }, o("div", { class: "row", style: { alignItems: "center" } }, o("h3", { style: { margin: 0 } }, "Evaluation criteria"), o("div", { class: "grow right pcc-acts" }, ed ? btn(C.length ? "Change criteria" : "Set criteria", () => critEdit(p), C.length ? "small" : "small primary") : null, C.length && (p.bidders || []).length ? (() => { const sel = S(EVAL_DESIGNS, evalDesign(), { class: "pcc-evd", title: "Sheet design" }); sel.onchange = () => save(() => { Z().evalDesign = sel.value; }, "Sheet design: " + sel.selectedOptions[0].textContent); return o("span", { class: "pcc-evd-w" }, sel, btn("Evaluation sheet (Excel)", () => critSheet(p, sel.value).catch(e => xt(e.message, "err")), "small primary")); })() : null)),
    C.length ? o("div", { class: "pcc-crit-chips" }, C.map(c => o("span", { class: "pcc-crit-chip t-" + c.type }, o("b", {}, c.weight + "%"), o("span", {}, c.label || critType(c.type)[1]), o("span", { dir: "rtl", lang: "dv" }, c.labelDv || critType(c.type)[2]), critType(c.type)[3] === "per" ? o("small", {}, `${c.per || 1} marks / document`) : null)))
      : o("p", { class: "muted small" }, "No criteria yet. Set them (e.g. Price 75%, Duration 15%, Experience 10%) and each bidder's points and rank are worked out from the bids received."));
}

// Template fields: points per criterion inside {#bidders}, and the criteria list.
function critData(p, d) {
  const C = critsOf(p);
  d.criteria = C.map((c, i) => ({ no: i + 1, label: c.label || critType(c.type)[1], label_dv: c.labelDv || critType(c.type)[2], weight: String(c.weight), per: c.per != null ? String(c.per) : "" }));
  d.criteria_text = C.map(c => `${c.label || critType(c.type)[1]} ${c.weight}%`).join(", ");
  d.criteria_text_dv = C.map(c => `${c.labelDv || critType(c.type)[2]} ${c.weight}%`).join("، ");
  C.forEach(c => { d[c.key + "_weight"] = String(c.weight); });
  const B = (p.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99));
  (d.bidders || []).forEach((r, i) => { const b = B[i]; if (!b) return; C.forEach(c => { const v = (b.points || {})[c.key]; r[c.key + "_points"] = v == null ? "" : Number(v).toFixed(2); r.__num && (r.__num[c.key + "_points"] = v ?? null); }); });
}

// Evaluation sheet (Excel). Laid out like the council's Bid Evaluation Form: columns read from
// right to left (#, name, then for each criterion the value and the points, then the total), two
// heading rows, live formulas (MIN(...)/value × weight, MIN(documents × marks, weight), SUM), the
// date and the Evaluation Committee's signature block. Four designs: original, emerald, navy, scorecard.
const EVAL_DESIGNS = [["original", "Original (council form)"], ["styled", "Original — restyled (teal)"], ["royal", "Original — royal (navy & gold)"], ["minimal", "Original — minimal"], ["ocean", "Original — ocean"], ["evreport", "Evaluation report (stages, compliance, recommendation)"], ["evform", "Official evaluation form (numbered sections)"], ["award", "Award recommendation (summary panel)"], ["report", "Formal report"], ["calc", "Step-by-step calculation"], ["matrix", "Comparison matrix"]];
const evalDesign = () => Z().evalDesign || "original";
async function critSheet(p, design) {
  const C = critsOf(p); if (!C.length) throw err("Set the evaluation criteria first");
  critApply(p);
  const D = design || evalDesign(), orig = D === "original";
  if (STYLED[D]) return evalSheetStyled(p, D);
  if (["evreport", "evform", "award"].includes(D)) return evalSheetBid(p, D);
  if (!orig) return evalSheetPro(p, D);
  const resp = (p.bidders || []).filter(b => b.responsive !== false), dq = (p.bidders || []).filter(b => b.responsive === false);
  const B = orig ? [...resp, ...dq] : [...resp.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99)), ...dq];
  const TH = { // theme per design
    original: { font: "Faruma", head: { b: true, border: "thin", h: "center", wrap: true }, sub: { b: true, border: "thin", h: "center", wrap: true }, cell: { border: "thin", h: "center" }, zebra: null, total: { border: "thin", h: "center" }, win: null, dq: { color: "FF0000" } },
    emerald: { font: "Faruma", head: { b: true, fill: "0F766E", color: "FFFFFF", border: { style: "thin", color: "0B5F59" }, h: "center", wrap: true }, sub: { b: true, sz: 11, fill: "CCEFE9", color: "0F5149", border: { style: "thin", color: "9FD8CE" }, h: "center", wrap: true }, cell: { border: { style: "thin", color: "CDE7E2" }, h: "center" }, zebra: "F2FBF9", total: { b: true, fill: "DDF4EF", color: "0F5149", border: { style: "thin", color: "9FD8CE" }, h: "center" }, win: "FEF3C7", dq: { color: "9CA3AF", i: true } },
    navy: { font: "Faruma", head: { b: true, fill: "1E3A8A", color: "FFFFFF", border: { style: "thin", color: "1E3A8A" }, h: "center", wrap: true }, sub: { b: true, sz: 11, fill: "E5E9F5", color: "1E3A8A", border: { style: "thin", color: "B7C2E1" }, h: "center", wrap: true }, cell: { border: { style: "thin", color: "C9D1E8" }, h: "center" }, zebra: "F7F8FC", total: { b: true, color: "1E3A8A", border: { style: "medium", color: "1E3A8A" }, h: "center" }, win: "E0E7FF", dq: { color: "B91C1C", strike: true } },
    scorecard: { font: "Faruma", head: { b: true, color: "FFFFFF", border: { style: "thin", color: "FFFFFF" }, h: "center", wrap: true }, sub: { b: true, sz: 11, border: { style: "thin", color: "FFFFFF" }, h: "center", wrap: true }, cell: { border: { style: "thin", color: "E5E7EB" }, h: "center" }, zebra: null, total: { b: true, sz: 13, fill: "111827", color: "FFFFFF", border: { style: "thin", color: "FFFFFF" }, h: "center" }, win: null, dq: { color: "9CA3AF", i: true } }
  }[D] || null;
  if (!TH) throw err("Unknown sheet design");
  const GC = { price: ["0F766E", "E6F4F1"], duration: ["2563EB", "E8EFFD"], experience: ["D97706", "FDF2E3"], technical: ["7C3AED", "F1EAFE"], financial: ["DB2777", "FCE8F2"], other: ["475569", "EEF1F5"] };
  // Columns, left to right: [rank] total, then criteria (last criterion first; points left of value), name, #.
  const cols = []; let c = 2;
  if (!orig) cols.push({ k: "rank", c: c++ });
  cols.push({ k: "total", c: c++ });
  C.slice().reverse().forEach(cr => { const man = critType(cr.type)[3] === "manual"; cols.push({ k: "pts", cr, c: c++ }); if (!man) cols.push({ k: "val", cr, c: c++ }); });
  cols.push({ k: "name", c: c++ }); cols.push({ k: "no", c: c++ });
  const first = 2, last = c - 1, colOf = (k, cr) => (cols.find(x => x.k === k && (!cr || x.cr === cr)) || {}).c;
  const W = xlsxSheet(), H = {}, WD = { 1: orig ? 13 : 3 }, base = { font: TH.font };
  cols.forEach(x => { WD[x.c] = x.k === "name" ? 38 : x.k === "no" ? 7.7 : x.k === "total" ? 17 : x.k === "rank" ? 9 : x.k === "val" && x.cr.type === "price" ? 20.8 : 15; });
  const title = `${p.nameDv || p.name || ""} ކޮށްދޭނެ ފަރާތެއް ހޯދުމަށްކުރި އިޢުލާނާ ގުޅިގެން ބީލަން ހުށައެޅުއްވި ފަރާތްތަކަށް ޕޮއިންޓް ލިބިފައިވާގޮތުގެ ތަފްޞީލް`;
  const critTxt = C.map(cr => `${cr.labelDv || critType(cr.type)[2]} %${cr.weight}` + (critType(cr.type)[3] === "per" ? ` (ކޮންމެ ލިޔުމަކަށް ${cr.per || 1} މާކްސް)` : "")).join("   |   ");
  let r = 2;
  if (orig) {
    W.set(2, first, "`", { ...base, sz: 16, h: "center" }).merge(2, first, 2, last); H[1] = 9.75; H[2] = 31.5;
    W.set(3, last, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ / މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...base, b: true, h: "right" }); H[3] = 25.5;
    W.set(4, last, "ށ.މިލަންދޫ / ދިވެހިރާއްޖެ", { ...base, h: "right" }); H[4] = 21.75;
    W.set(6, first, title, { ...base, b: true, sz: 14, h: "center", wrap: true }).merge(6, first, 6, last); H[6] = 51; r = 8;
  } else if (D === "emerald") {
    W.set(2, first, "ބިޑް އިވެލުއޭޝަން — ޕޮއިންޓް ލިބުނުގޮތުގެ ތަފްޞީލް", { ...base, b: true, sz: 18, fill: "0F766E", color: "FFFFFF", h: "center" }).merge(2, first, 2, last); W.box(2, first, 2, last, { fill: "0F766E" }); H[2] = 40;
    W.set(3, first, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ  ·  މިލަންދޫ ކައުންސިލްގެ އިދާރާ  ·  ށ.މިލަންދޫ", { ...base, sz: 11, fill: "14B8A6", color: "FFFFFF", h: "center" }).merge(3, first, 3, last); W.box(3, first, 3, last, { fill: "14B8A6" }); H[3] = 22;
    W.set(5, first, title, { ...base, b: true, sz: 13, color: "0F5149", h: "center", wrap: true }).merge(5, first, 5, last); H[5] = 44;
    W.set(6, first, critTxt + (p.advertNo ? "     ·     " + p.advertNo : ""), { ...base, sz: 11, color: "0F766E", fill: "F0FDFA", h: "center", border: { style: "thin", color: "99E2D6" } }).merge(6, first, 6, last); W.box(6, first, 6, last, { fill: "F0FDFA", border: { style: "thin", color: "99E2D6" } }); H[6] = 24; r = 8;
  } else if (D === "navy") {
    W.set(2, last, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...base, b: true, sz: 16, color: "1E3A8A", h: "right" }); H[2] = 30;
    W.set(3, last, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ  —  ށ.މިލަންދޫ، ދިވެހިރާއްޖެ", { ...base, sz: 11, color: "475569", h: "right" });
    W.set(2, first, "ބިޑް އިވެލުއޭޝަން ޝީޓް", { ...base, b: true, sz: 14, color: "FFFFFF", fill: "1E3A8A", h: "center" }).merge(2, first, 3, first + 1); W.box(2, first, 3, first + 1, { fill: "1E3A8A" });
    W.box(4, first, 4, last, { border: { style: "medium", color: "1E3A8A" } }); H[4] = 4;
    W.set(5, first, title, { ...base, b: true, sz: 13, h: "center", wrap: true, color: "0F172A" }).merge(5, first, 5, last); H[5] = 44;
    W.set(6, last, "ކްރައިޓީރިއާ:", { ...base, b: true, sz: 11, color: "1E3A8A", h: "right", fill: "EEF2FF" }); W.set(6, first, critTxt + (p.advertNo ? "     ·     އިޢުލާން " + p.advertNo : ""), { ...base, sz: 11, color: "1E3A8A", h: "right", fill: "EEF2FF" }).merge(6, first, 6, last - 1); W.box(6, first, 6, last, { fill: "EEF2FF" }); H[6] = 24; r = 8;
  } else {
    W.set(2, first, "ބިޑް އިވެލުއޭޝަން ސްކޯކާޑް", { ...base, b: true, sz: 20, color: "111827", h: "right" }).merge(2, first, 2, last); H[2] = 38;
    W.set(3, first, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ  ·  ބިޑް އިވެލުއޭޝަން ކޮމެޓީ" + (p.advertNo ? "  ·  " + p.advertNo : ""), { ...base, sz: 11, color: "6B7280", h: "right" }).merge(3, first, 3, last);
    W.set(5, first, title, { ...base, b: true, sz: 13, h: "right", wrap: true }).merge(5, first, 5, last); H[5] = 42;
    // weight chips: one coloured cell per criterion group
    cols.filter(x => x.k === "pts").forEach(x => { const g = GC[x.cr.type] || GC.other, span = colOf("val", x.cr) ? [x.c, colOf("val", x.cr)] : [x.c, x.c]; W.set(6, span[0], `${x.cr.labelDv || critType(x.cr.type)[2]}  ${x.cr.weight}%`, { ...base, b: true, sz: 11, fill: g[1], color: g[0], h: "center" }).merge(6, span[0], 6, span[1]); W.box(6, span[0], 6, span[1], { fill: g[1] }); });
    H[6] = 24; r = 8;
  }
  // Heading rows
  const h1 = r, h2 = r + 1; H[h1] = 43.5; H[h2] = 43.5;
  const head = (k, cr) => ({ ...base, ...TH.head, ...(D === "scorecard" ? { fill: k === "total" ? "111827" : k === "name" || k === "no" || k === "rank" ? "374151" : (GC[cr.type] || GC.other)[0] } : {}) });
  const sub = cr => ({ ...base, ...TH.sub, ...(D === "scorecard" ? { fill: (GC[cr.type] || GC.other)[1], color: (GC[cr.type] || GC.other)[0] } : {}) });
  cols.forEach(x => {
    if (x.k === "total") W.set(h1, x.c, "މުޅި ޖުމްލަ", head("total")).merge(h1, x.c, h2, x.c);
    if (x.k === "rank") W.set(h1, x.c, "ރޭންކް", head("rank")).merge(h1, x.c, h2, x.c);
    if (x.k === "name") W.set(h1, x.c, "ނަން", head("name")).merge(h1, x.c, h2, x.c);
    if (x.k === "no") W.set(h1, x.c, "#", { ...head("no"), h: orig ? "left" : "center" }).merge(h1, x.c, h2, x.c);
    if (x.k === "pts") { const vc = colOf("val", x.cr); W.set(h1, x.c, `${x.cr.labelDv || critType(x.cr.type)[2]} %${x.cr.weight}`, head("pts", x.cr)).merge(h1, x.c, h1, vc || x.c); W.set(h2, x.c, "ލިބުނު ޕޮއިންޓް", sub(x.cr)); }
    if (x.k === "val") W.set(h2, x.c, x.cr.type === "price" ? "ހުށައެޅި އަގު" : x.cr.type === "duration" ? "ޖުމްލަ" : x.cr.type === "experience" ? "ޖުމްލަ" : "", sub(x.cr));
  });
  W.box(h1, first, h2, last, { ...TH.head, ...(D === "scorecard" ? { fill: "374151" } : {}) });
  // Data rows with formulas
  const r0 = h2 + 1, rLastResp = r0 + resp.length - 1;
  B.forEach((b, i) => {
    const rr = r0 + i, isDq = b.responsive === false, win = !isDq && b.rank === 1;
    const fill = TH.win && win ? TH.win : TH.zebra && i % 2 ? TH.zebra : null;
    const st = (extra = {}) => ({ ...base, ...TH.cell, ...(fill ? { fill } : {}), ...(isDq ? TH.dq : {}), ...(win && !orig ? { b: true } : {}), ...extra });
    H[rr] = 21.75;
    const ptsRefs = [];
    cols.forEach(x => {
      if (x.k === "no") W.set(rr, x.c, i + 1, st());
      if (x.k === "name") W.set(rr, x.c, b.vendor || "", st({ h: "right" }));
      if (x.k === "val") { const v = critValue(b, x.cr); W.set(rr, x.c, v == null ? "" : v, st({ fmt: x.cr.type === "price" ? "#,##0.00" : x.cr.type === "duration" ? '0" ދުވަސް"' : "0" })); }
      if (x.k === "pts") {
        const T = critType(x.cr.type), vc = colOf("val", x.cr), pt = (b.points || {})[x.cr.key], ref = xref(rr, x.c); ptsRefs.push(ref);
        if (isDq) { W.set(rr, x.c, "", st({ fmt: "0.00" })); return; }
        if (T[3] === "manual") { W.set(rr, x.c, critValue(b, x.cr) ?? "", st({ fmt: "0.00", ...(D === "scorecard" ? { fill: (GC[x.cr.type] || GC.other)[1] } : {}) })); return; }
        const V = xref(rr, vc), rng = `${xcol(vc)}$${r0}:${xcol(vc)}$${rLastResp}`;
        const f = T[3] === "lowest" ? `IF(${V}="","",MIN(${rng})/${V}*${x.cr.weight})` : `IF(${V}="","",MIN(${V}*${x.cr.per || 1},${x.cr.weight}))`;
        W.set(rr, x.c, pt == null ? "" : pt, st({ fmt: "0.00", ...(D === "scorecard" ? { fill: (GC[x.cr.type] || GC.other)[1], b: true, color: (GC[x.cr.type] || GC.other)[0] } : {}) }), f);
      }
      if (x.k === "total") isDq ? W.set(rr, x.c, "ޑިސްކޮލިފައި", st({ ...TH.total, ...TH.dq, fill: undefined, sz: 11 })) : W.set(rr, x.c, b.total ?? 0, st({ ...TH.total, fmt: "0.00" }), `SUM(${ptsRefs.length ? "" : "0"}${cols.filter(y => y.k === "pts").map(y => xref(rr, y.c)).join(",")})`);
      if (x.k === "rank") {
        const tc = xref(rr, colOf("total"));
        const medal = !isDq && b.rank && b.rank <= 3 && D !== "navy" ? { 1: "F59E0B", 2: "94A3B8", 3: "B45309" }[b.rank] : null;
        isDq ? W.set(rr, x.c, "—", st()) : W.set(rr, x.c, b.rank ?? "", st({ b: true, ...(medal ? { fill: medal, color: "FFFFFF" } : {}) }), `RANK(${tc},$${xcol(colOf("total"))}$${r0}:$${xcol(colOf("total"))}$${rLastResp})`);
      }
    });
  });
  r = r0 + B.length;
  // Recommended line (new designs)
  const w = resp.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
  if (!orig && w) { r++; W.set(r, first, `އެންމެ މަތިން ޕޮއިންޓް ލިބުނު ފަރާތް:  ${w.vendor}  —  ${Number(w.total || 0).toFixed(2)} ޕޮއިންޓް`, { ...base, b: true, sz: 12, h: "right", fill: D === "navy" ? "EEF2FF" : D === "emerald" ? "FEF3C7" : "F3F4F6", color: D === "navy" ? "1E3A8A" : "111827" }).merge(r, first, r, last); W.box(r, first, r, last, { fill: D === "navy" ? "EEF2FF" : D === "emerald" ? "FEF3C7" : "F3F4F6" }); H[r] = 26; }
  // Date and signatures
  r += 2; W.set(r, first, dvDate(today()), { ...base, h: "center" }).merge(r, first, r, last); H[r] = 21.75;
  const mem = (p.committees.eval || []).filter(m => !m.onLeave), per = 3;
  for (let g = 0; g < mem.length; g += per) {
    r += 3; const M = mem.slice(g, g + per), span = last - first + 1;
    M.forEach((m, k) => { const cc = last - Math.round((k * span) / per) - (k ? 1 : 0); const sg = { ...base, h: "right" };
      W.set(r, cc, "ސޮއި:", { ...sg, ...(orig ? {} : { border: undefined }) }); W.set(r + 1, cc, "ނަން: " + noTitle(m.nameDv || m.name || ""), sg); W.set(r + 2, cc, "މަޤާމް: " + (m.designationDv || m.designation || ""), sg); W.set(r + 3, cc, "ތާރީޚް: " + dvDate(today()), sg); });
    [0, 1, 2, 3].forEach(k => { H[r + k] = 21.75; }); r += 3;
  }
  const u8 = await xlsxBuild({ name: orig ? "AB" : "Evaluation", sheet: W, widths: WD, heights: H, landscape: true, font: "Faruma", area: [2, first, r, last] });
  ii(new Blob([u8], { type: MIME.xlsx }), `Evaluation_${safeName(p.ref)}${orig ? "" : "_" + D}.xlsx`);
  audit(p, "Evaluation sheet generated", critLine(p) + " · " + D);
}

// ---------- Professional layouts (right-to-left sheets) ----------
// report : header with document box, information panel, result banner, points table, notes, signature boxes
// calc   : one section per criterion showing the working (lowest ÷ value × weight), then a summary table
// matrix : bidders across, criteria down (value and points rows), total, rank and a points bar
async function evalSheetPro(p, D) {
  const C = critsOf(p), F = "Faruma", NAVY = "16325C", TEAL = "0F766E", INK = "1F2937", MUTE = "6B7280", LINE = "D1D5DB", SOFT = "F3F6FA", GOLD = "B7791F";
  const resp = (p.bidders || []).filter(b => b.responsive !== false).sort((a, b) => (a.rank || 99) - (b.rank || 99)), dq = (p.bidders || []).filter(b => b.responsive === false);
  const B = [...resp, ...dq], win = resp[0];
  const W = xlsxSheet(), H = {}, WD = { 1: 2 }, b0 = { font: F, color: INK };
  const lab = cr => cr.labelDv || critType(cr.type)[2], man = cr => critType(cr.type)[3] === "manual";
  const how = cr => critType(cr.type)[3] === "lowest" ? "އެންމެ ދަށް " + (cr.type === "price" ? "އަގަށް" : "މުއްދަތަށް") + " ފުރިހަމަ ޕޮއިންޓް؛ އެހެން ފަރާތްތަކަށް: އެންމެ ދަށް ÷ ހުށަހެޅި × " + cr.weight : critType(cr.type)[3] === "per" ? `ކޮންމެ ލިޔުމަކަށް ${cr.per || 1} މާކްސް، އެންމެ ގިނަވެގެން ${cr.weight}` : `ކޮމިޓީން ދޭ ޕޮއިންޓް (${cr.weight} އިން)`;
  const unit = cr => cr.type === "price" ? "ހުށައެޅި އަގު" : cr.type === "duration" ? "މުއްދަތު" : cr.type === "experience" ? "ލިޔުންތައް" : "ޕޮއިންޓް";
  const vfmt = cr => cr.type === "price" ? "#,##0.00" : cr.type === "duration" ? '0" ދުވަސް"' : cr.type === "experience" ? '0" ލިޔުން"' : "0.00";
  // Width of the printable area depends on the layout.
  const NC = D === "matrix" ? 2 + Math.max(B.length, 3) : D === "calc" ? 6 : 4 + C.reduce((a, cr) => a + (man(cr) ? 1 : 2), 0);
  const c1 = 2, cN = c1 + NC - 1;
  let r = 2;
  // Header: council (right) and a document box (left)
  const box = Math.min(3, Math.max(2, Math.floor(NC / 3)));
  W.set(2, c1, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...b0, b: true, sz: 18, color: NAVY, h: "right" }).merge(2, c1, 2, cN - box); H[2] = 34;
  W.set(3, c1, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ  ·  ށ. މިލަންދޫ، ދިވެހިރާއްޖެ", { ...b0, sz: 11, color: MUTE, h: "right" }).merge(3, c1, 3, cN - box);
  const dt = { ...b0, sz: 10, color: "FFFFFF", fill: NAVY, h: "center" };
  W.set(2, cN - box + 1, D === "calc" ? "ޕޮއިންޓް ހިސާބުކުރި ގޮތް" : D === "matrix" ? "ބިޑް އަޅާކިޔުމުގެ ޝީޓް" : "ބިޑް އިވެލުއޭޝަން ޝީޓް", { ...dt, b: true, sz: 13 }).merge(2, cN - box + 1, 2, cN);
  W.set(3, cN - box + 1, "ތާރީޚް: " + dvDate(today()), dt).merge(3, cN - box + 1, 3, cN); W.box(2, cN - box + 1, 3, cN, { fill: NAVY });
  W.box(4, c1, 4, cN, { border: { style: "medium", color: NAVY } }); H[4] = 3;
  // Title
  r = 6; W.set(r, c1, `${p.nameDv || p.name || ""} ކޮށްދޭނެ ފަރާތެއް ހޯދުމަށް ކުރި އިޢުލާނާ ގުޅިގެން ބީލަން ހުށައެޅުއްވި ފަރާތްތަކަށް ޕޮއިންޓް ލިބިފައިވާ ގޮތް`, { ...b0, b: true, sz: 14, h: "center", wrap: true }).merge(r, c1, r, cN); H[r] = 46;
  // Information panel: pairs of label | value, two per row
  const info = [["އިޢުލާން ނަންބަރު", p.advertNo || "—"], ["އިޢުލާން ކުރި ތާރީޚް", p.advertised ? dvDate(p.advertised) : "—"], ["ބިޑް ހުޅުވި ތާރީޚް", p.bidOpening ? dvDate(p.bidOpening) : "—"], ["ބިޑް ހުށަހެޅި ފަރާތްތައް", `${B.length} (ޝަރުތު ފުރިހަމަ: ${resp.length})`], ["ލަފާކުރި އަގު", p.estimate != null ? ht(p.estimate) : "—"], ["މަޝްރޫޢުގެ ނަންބަރު", p.ref || ""]];
  r = 8; const half = Math.floor(NC / 2), lw = Math.max(1, Math.floor(half / 3));
  const L = { ...b0, sz: 11, b: true, color: NAVY, fill: SOFT, h: "right", border: { style: "thin", color: LINE } }, V = { ...b0, sz: 11, h: "right", border: { style: "thin", color: LINE } };
  for (let i = 0; i < info.length; i += 2) {
    [info[i], info[i + 1]].forEach((pr, k) => { if (!pr) return; const s1 = c1 + k * half, e1 = k ? cN : c1 + half - 1; W.set(r, s1, pr[0], L).merge(r, s1, r, s1 + lw - 1); W.box(r, s1, r, s1 + lw - 1, L); W.set(r, s1 + lw, pr[1], V).merge(r, s1 + lw, r, e1); W.box(r, s1 + lw, r, e1, V); });
    H[r] = 22; r++;
  }
  W.set(r, c1, "ކްރައިޓީރިއާ", L).merge(r, c1, r, c1 + lw - 1); W.box(r, c1, r, c1 + lw - 1, L);
  W.set(r, c1 + lw, C.map(cr => `${lab(cr)} ${cr.weight}%`).join("   ·   "), { ...V, b: true, color: TEAL }).merge(r, c1 + lw, r, cN); W.box(r, c1 + lw, r, cN, V); H[r] = 22; r += 2;
  const hd = { ...b0, b: true, sz: 11, color: "FFFFFF", fill: NAVY, h: "center", wrap: true, border: { style: "thin", color: "FFFFFF" } };
  const sh = { ...b0, b: true, sz: 10, color: NAVY, fill: "DCE4F0", h: "center", wrap: true, border: { style: "thin", color: "FFFFFF" } };
  const cell = (i, ex = {}) => ({ ...b0, sz: 11, h: "center", border: { style: "thin", color: LINE }, ...(i % 2 ? { fill: "FAFBFD" } : {}), ...ex });
  const section = (t, sub) => { W.set(r, c1, t, { ...b0, b: true, sz: 13, color: NAVY, h: "right" }).merge(r, c1, r, cN); W.box(r, c1, r, cN, { border: undefined }); H[r] = 24; r++; if (sub) { W.set(r, c1, sub, { ...b0, sz: 10, color: MUTE, h: "right" }).merge(r, c1, r, cN); r++; } };
  let totalRefs = {};
  if (D === "report") {
    // Result banner
    if (win) { W.set(r, c1, "އެންމެ މަތިން ޕޮއިންޓް ލިބުނު ފަރާތް", { ...b0, sz: 11, color: MUTE, fill: "FFF8E6", h: "right" }).merge(r, c1, r, cN - 2); W.set(r + 1, c1, win.vendor, { ...b0, b: true, sz: 16, color: INK, fill: "FFF8E6", h: "right" }).merge(r + 1, c1, r + 1, cN - 2);
      W.set(r, cN - 1, Number(win.total || 0).toFixed(2), { ...b0, b: true, sz: 22, color: "FFFFFF", fill: GOLD, h: "center" }).merge(r, cN - 1, r + 1, cN); W.box(r, c1, r + 1, cN, { fill: "FFF8E6" }); W.box(r, cN - 1, r + 1, cN, { fill: GOLD }); H[r] = 22; H[r + 1] = 30; r += 3; }
    section("ޕޮއިންޓް ލިބުނު ގޮތް");
    // Table: # | name | per criterion (value, points) | total | rank
    const cols = [{ k: "no", w: 6 }, { k: "name", w: 34 }]; C.forEach(cr => { if (!man(cr)) cols.push({ k: "val", cr, w: cr.type === "price" ? 18 : 13 }); cols.push({ k: "pts", cr, w: 12 }); }); cols.push({ k: "total", w: 14 }, { k: "rank", w: 9 });
    cols.forEach((x, i) => { x.c = c1 + i; WD[x.c] = x.w; });
    const h1 = r, h2 = r + 1; H[h1] = 30; H[h2] = 30;
    cols.forEach(x => { if (x.k === "no") W.set(h1, x.c, "#", hd).merge(h1, x.c, h2, x.c); if (x.k === "name") W.set(h1, x.c, "ބިޑް ހުށައެޅި ފަރާތް", hd).merge(h1, x.c, h2, x.c); if (x.k === "total") W.set(h1, x.c, "މުޅި ޖުމްލަ", hd).merge(h1, x.c, h2, x.c); if (x.k === "rank") W.set(h1, x.c, "ރޭންކް", hd).merge(h1, x.c, h2, x.c);
      if (x.k === "val") { W.set(h1, x.c, `${lab(x.cr)} (${x.cr.weight}%)`, hd).merge(h1, x.c, h1, x.c + 1); W.set(h2, x.c, unit(x.cr), sh); }
      if (x.k === "pts") { man(x.cr) && W.set(h1, x.c, `${lab(x.cr)} (${x.cr.weight}%)`, hd); W.set(h2, x.c, "ޕޮއިންޓް", sh); } });
    W.box(h1, c1, h2, cN, hd); r = h2 + 1;
    const r0 = r, rl = r0 + resp.length - 1;
    B.forEach((b, i) => { const rr = r0 + i, isDq = b.responsive === false, top = b === win; H[rr] = 22; const ex = isDq ? { color: "9CA3AF", i: true } : top ? { b: true, fill: "FFF8E6" } : {};
      cols.forEach(x => { const s2 = cell(i, ex);
        if (x.k === "no") W.set(rr, x.c, i + 1, s2); if (x.k === "name") W.set(rr, x.c, b.vendor || "", { ...s2, h: "right" });
        if (x.k === "val") W.set(rr, x.c, critValue(b, x.cr) ?? "", { ...s2, fmt: vfmt(x.cr) });
        if (x.k === "pts") { const pt = (b.points || {})[x.cr.key]; if (isDq) return W.set(rr, x.c, "", s2); if (man(x.cr)) return W.set(rr, x.c, critValue(b, x.cr) ?? "", { ...s2, fmt: "0.00" }); const Vr = xref(rr, x.c - 1), rng = `${xcol(x.c - 1)}$${r0}:${xcol(x.c - 1)}$${rl}`;
          W.set(rr, x.c, pt ?? "", { ...s2, fmt: "0.00", color: TEAL, b: true }, critType(x.cr.type)[3] === "lowest" ? `IF(${Vr}="","",MIN(${rng})/${Vr}*${x.cr.weight})` : `IF(${Vr}="","",MIN(${Vr}*${x.cr.per || 1},${x.cr.weight}))`); }
        if (x.k === "total") isDq ? W.set(rr, x.c, "ޑިސްކޮލިފައި", { ...s2, sz: 10 }) : W.set(rr, x.c, b.total ?? 0, { ...s2, b: true, fmt: "0.00", fill: top ? GOLD : "E8EEF7", color: top ? "FFFFFF" : NAVY }, `SUM(${cols.filter(y => y.k === "pts").map(y => xref(rr, y.c)).join(",")})`);
        if (x.k === "rank") { const tc = cols.find(y => y.k === "total").c; isDq ? W.set(rr, x.c, "—", s2) : W.set(rr, x.c, b.rank ?? "", { ...s2, b: true }, `RANK(${xref(rr, tc)},$${xcol(tc)}$${r0}:$${xcol(tc)}$${rl})`); } }); });
    r = r0 + B.length + 1;
    if (dq.length) { section("ޝަރުތު ފުރިހަމަނުވާ ފަރާތްތައް"); dq.forEach((b, i) => { W.set(r, c1, `${i + 1}.  ${b.vendor}  —  ${b.remarks || "ޑިސްކޮލިފައި ކުރެވިފައި"}`, { ...b0, sz: 11, color: "991B1B", h: "right" }).merge(r, c1, r, cN); r++; }); r++; }
  }
  if (D === "calc") {
    [[c1, 6], [c1 + 1, 32], [c1 + 2, 18], [c1 + 3, 40], [c1 + 4, 12], [c1 + 5, 9]].forEach(([c, w]) => { WD[c] = w; });
    const sumRows = {};
    C.forEach((cr, n) => {
      section(`${n + 1}.  ${lab(cr)}  —  ${cr.weight}%`, how(cr));
      const hr = r; ["#", "ބިޑް ހުށައެޅި ފަރާތް", unit(cr), "ހިސާބު", "ޕޮއިންޓް", ""].forEach((t, k) => W.set(hr, c1 + k, t, hd)); W.set(hr, c1 + 5, "", hd); H[hr] = 26; r++;
      const r0 = r, rl = r0 + resp.length - 1, low = (() => { const v = resp.map(b => critValue(b, cr)).filter(v => v != null && v > 0); return v.length ? Math.min(...v) : null; })();
      resp.forEach((b, i) => { const rr = r0 + i, v = critValue(b, cr), pt = (b.points || {})[cr.key]; H[rr] = 21;
        const calc = critType(cr.type)[3] === "lowest" ? (v ? `${cr.type === "price" ? ht(low * 100) : low} ÷ ${cr.type === "price" ? ht(v * 100) : v} × ${cr.weight}` : "—") : critType(cr.type)[3] === "per" ? (v != null ? `${v} × ${cr.per || 1}  (އެންމެ ގިނަވެގެން ${cr.weight})` : "—") : "ކޮމިޓީން ދިން ޕޮއިންޓް";
        W.set(rr, c1, i + 1, cell(i)); W.set(rr, c1 + 1, b.vendor, cell(i, { h: "right" })); W.set(rr, c1 + 2, v ?? "", cell(i, { fmt: vfmt(cr) })); W.set(rr, c1 + 3, calc, cell(i, { color: MUTE, sz: 10 }));
        const Vr = xref(rr, c1 + 2), rng = `${xcol(c1 + 2)}$${r0}:${xcol(c1 + 2)}$${rl}`;
        W.set(rr, c1 + 4, pt ?? "", cell(i, { b: true, color: TEAL, fmt: "0.00" }), man(cr) ? null : critType(cr.type)[3] === "lowest" ? `IF(${Vr}="","",MIN(${rng})/${Vr}*${cr.weight})` : `IF(${Vr}="","",MIN(${Vr}*${cr.per || 1},${cr.weight}))`);
        W.set(rr, c1 + 5, v != null && v === low && critType(cr.type)[3] === "lowest" ? "އެންމެ ދަށް" : "", cell(i, { sz: 9, color: GOLD, b: true }));
        (sumRows[b.id || b.vendor] = sumRows[b.id || b.vendor] || []).push(xref(rr, c1 + 4)); });
      r = r0 + resp.length + 1;
    });
    section("ޖުމްލަ ޕޮއިންޓް", "ކޮންމެ ކްރައިޓީރިއާއަކުން ލިބުނު ޕޮއިންޓް އެއްކޮށް");
    const hr = r; ["#", "ބިޑް ހުށައެޅި ފަރާތް", C.map(cr => `${lab(cr)} ${cr.weight}%`).join(" + "), "", "މުޅި ޖުމްލަ", "ރޭންކް"].forEach((t, k) => W.set(hr, c1 + k, t, hd)); W.merge(hr, c1 + 2, hr, c1 + 3); H[hr] = 26; r++;
    const r0 = r, rl = r0 + resp.length - 1;
    resp.forEach((b, i) => { const rr = r0 + i, top = b === win; H[rr] = 22;
      W.set(rr, c1, i + 1, cell(i, top ? { b: true } : {})); W.set(rr, c1 + 1, b.vendor, cell(i, { h: "right", ...(top ? { b: true } : {}) }));
      W.set(rr, c1 + 2, C.map(cr => Number((b.points || {})[cr.key] || 0).toFixed(2)).join("  +  "), cell(i, { color: MUTE, sz: 10 })).merge(rr, c1 + 2, rr, c1 + 3); W.box(rr, c1 + 2, rr, c1 + 3, cell(i));
      W.set(rr, c1 + 4, b.total ?? 0, cell(i, { b: true, fmt: "0.00", fill: top ? GOLD : "E8EEF7", color: top ? "FFFFFF" : NAVY }), `SUM(${(sumRows[b.id || b.vendor] || []).join(",")})`);
      W.set(rr, c1 + 5, b.rank ?? "", cell(i, { b: true }), `RANK(${xref(rr, c1 + 4)},$${xcol(c1 + 4)}$${r0}:$${xcol(c1 + 4)}$${rl})`); });
    r = r0 + resp.length + 1;
    if (dq.length) { section("ޝަރުތު ފުރިހަމަނުވާ ފަރާތްތައް"); dq.forEach((b, i) => { W.set(r, c1, `${i + 1}.  ${b.vendor}  —  ${b.remarks || "ޑިސްކޮލިފައި ކުރެވިފައި"}`, { ...b0, sz: 11, color: "991B1B", h: "right" }).merge(r, c1, r, cN); r++; }); r++; }
  }
  if (D === "matrix") {
    WD[c1] = 26; WD[c1 + 1] = 8; B.forEach((b, i) => { WD[c1 + 2 + i] = 20; }); for (let k = B.length; k < 3; k++) WD[c1 + 2 + k] = 20;
    section("ބިޑްތައް އަޅާކިޔުން");
    const hr = r; W.set(hr, c1, "ކްރައިޓީރިއާ", hd); W.set(hr, c1 + 1, "%", hd);
    B.forEach((b, i) => W.set(hr, c1 + 2 + i, `${i + 1}. ${b.vendor}`, { ...hd, ...(b === win ? { fill: GOLD } : b.responsive === false ? { fill: "9CA3AF" } : {}) })); H[hr] = 44; r++;
    const ptsRow = [], rl = c1 + 2 + resp.length - 1;
    C.forEach((cr, n) => {
      let vr = null;
      if (!man(cr)) { vr = r; W.set(r, c1, `${lab(cr)} — ${unit(cr)}`, { ...b0, sz: 11, h: "right", fill: SOFT, border: { style: "thin", color: LINE } }); W.set(r, c1 + 1, "", { ...b0, fill: SOFT, border: { style: "thin", color: LINE } });
        B.forEach((b, i) => W.set(r, c1 + 2 + i, critValue(b, cr) ?? "", { ...b0, sz: 11, h: "center", fmt: vfmt(cr), border: { style: "thin", color: LINE }, ...(b.responsive === false ? { color: "9CA3AF", i: true } : {}) })); H[r] = 21; r++; }
      W.set(r, c1, `${lab(cr)} — ޕޮއިންޓް`, { ...b0, b: true, sz: 11, h: "right", border: { style: "thin", color: LINE } }); W.set(r, c1 + 1, cr.weight, { ...b0, b: true, h: "center", color: TEAL, border: { style: "thin", color: LINE } });
      B.forEach((b, i) => { const c = c1 + 2 + i, isDq = b.responsive === false, pt = (b.points || {})[cr.key], V = vr ? xref(vr, c) : null;
        W.set(r, c, isDq ? "" : pt ?? "", { ...b0, b: true, sz: 11, h: "center", color: TEAL, fmt: "0.00", border: { style: "thin", color: LINE } }, isDq || man(cr) ? null : critType(cr.type)[3] === "lowest" ? `IF(${V}="","",MIN($${xcol(c1 + 2)}$${vr}:$${xcol(rl)}$${vr})/${V}*${cr.weight})` : `IF(${V}="","",MIN(${V}*${cr.per || 1},${cr.weight}))`); });
      ptsRow.push(r); H[r] = 22; r++;
    });
    const tr = r; W.set(tr, c1, "މުޅި ޖުމްލަ", { ...hd, h: "right" }); W.set(tr, c1 + 1, 100, hd);
    B.forEach((b, i) => { const c = c1 + 2 + i, isDq = b.responsive === false; isDq ? W.set(tr, c, "ޑިސްކޮލިފައި", { ...hd, fill: "9CA3AF", sz: 10 }) : W.set(tr, c, b.total ?? 0, { ...hd, sz: 14, fmt: "0.00", ...(b === win ? { fill: GOLD } : {}) }, `SUM(${ptsRow.map(x => xref(x, c)).join(",")})`); }); H[tr] = 30; r++;
    W.set(r, c1, "ރޭންކް", { ...b0, b: true, h: "right", border: { style: "thin", color: LINE } }); W.set(r, c1 + 1, "", { border: { style: "thin", color: LINE } });
    B.forEach((b, i) => { const c = c1 + 2 + i; b.responsive === false ? W.set(r, c, "—", { ...b0, h: "center", border: { style: "thin", color: LINE } }) : W.set(r, c, b.rank ?? "", { ...b0, b: true, sz: 13, h: "center", border: { style: "thin", color: LINE } }, `RANK(${xref(tr, c)},$${xcol(c1 + 2)}$${tr}:$${xcol(rl)}$${tr})`); }); H[r] = 24; r++;
    W.set(r, c1, "ޕޮއިންޓް (ބާ)", { ...b0, sz: 10, color: MUTE, h: "right", border: { style: "thin", color: LINE } }); W.set(r, c1 + 1, "", { border: { style: "thin", color: LINE } });
    B.forEach((b, i) => { const c = c1 + 2 + i; W.set(r, c, b.responsive === false ? "" : "█".repeat(Math.round((b.total || 0) / 10)), { font: "Arial", sz: 11, color: b === win ? GOLD : TEAL, h: "right", border: { style: "thin", color: LINE } }, b.responsive === false ? null : `REPT("█",ROUND(${xref(tr, c)}/10,0))`); }); H[r] = 22; r++;
    W.set(r, c1, "ބަޔާން", { ...b0, sz: 10, color: MUTE, h: "right", border: { style: "thin", color: LINE } }); W.set(r, c1 + 1, "", { border: { style: "thin", color: LINE } });
    B.forEach((b, i) => W.set(r, c1 + 2 + i, b.responsive === false ? (b.remarks || "ޑިސްކޮލިފައި ކުރެވިފައި") : b.remarks || "", { ...b0, sz: 10, color: b.responsive === false ? "991B1B" : MUTE, h: "center", wrap: true, border: { style: "thin", color: LINE } })); H[r] = 30; r += 2;
    if (win) { W.set(r, c1, `ނަތީޖާ:  ${win.vendor}  —  ${Number(win.total || 0).toFixed(2)} ޕޮއިންޓް  (ރޭންކް 1)`, { ...b0, b: true, sz: 13, color: "FFFFFF", fill: TEAL, h: "right", indent: 1 }).merge(r, c1, r, cN); W.box(r, c1, r, cN, { fill: TEAL }); H[r] = 28; r += 2; }
  }
  // Signature boxes: one per Evaluation Committee member (three per row)
  const mem = (p.committees.eval || []).filter(m => !m.onLeave);
  if (mem.length) { section("ބިޑް އިވެލުއޭޝަން ކޮމެޓީ");
    const per = 3, span = Math.max(1, Math.floor(NC / per));
    for (let g = 0; g < mem.length; g += per) {
      mem.slice(g, g + per).forEach((m, k) => { const s1 = c1 + k * span, e1 = k === per - 1 ? cN : s1 + span - 1, bx = { ...b0, sz: 11, h: "right", border: { style: "thin", color: LINE } };
        W.set(r, s1, "ސޮއި:", { ...bx, color: MUTE }).merge(r, s1, r, e1); W.set(r + 1, s1, "", bx).merge(r + 1, s1, r + 1, e1);
        W.set(r + 2, s1, noTitle(m.nameDv || m.name || ""), { ...bx, b: true }).merge(r + 2, s1, r + 2, e1); W.set(r + 3, s1, m.designationDv || m.designation || "", { ...bx, color: MUTE, sz: 10 }).merge(r + 3, s1, r + 3, e1);
        W.box(r, s1, r + 3, e1, { border: { style: "thin", color: LINE } }); });
      H[r] = 20; H[r + 1] = 34; H[r + 2] = 22; H[r + 3] = 20; r += 5;
    }
  }
  for (let c = c1; c <= cN; c++) WD[c] = WD[c] || 14;
  const u8 = await xlsxBuild({ name: "Evaluation", sheet: W, widths: WD, heights: H, landscape: D !== "calc", onePage: D !== "calc", font: F, rtl: true, area: [2, c1, r, cN] });
  ii(new Blob([u8], { type: MIME.xlsx }), `Evaluation_${safeName(p.ref)}_${D}.xlsx`);
  audit(p, "Evaluation sheet generated", critLine(p) + " · " + D);
}

// ---------- The council's own form, restyled ----------
// Same columns and order as the Bid Evaluation Form (total on the left, then each criterion's points
// and value, name, # on the right) and the same formulas, in four looks:
//   styled  : teal title band, criterion tags and colours, gold winner, signature cards
//   royal   : navy and gold, split header with a document box, cream sub-headings, signature lines
//   minimal : white, fine rules, large light weights over the criteria, black total for the winner
//   ocean   : layered blue bands, project name in a framed panel, aqua winner row, framed signature boxes
const STYLED = {
  styled: { deep: "0B4F5C", acc: "0F766E", gold: "C8961E", zeb: "F8FAFC", line: "E2E8F0", win: "FFF7E0", winTot: "C8961E", tot: "E3F3EF", totC: "0B4F5C",
    cc: { price: ["0F766E", "E3F3EF"], duration: ["1D4ED8", "E6EEFC"], experience: ["C2410C", "FDEEE3"], technical: ["7C3AED", "F0E9FD"], financial: ["BE185D", "FCE7F1"], other: ["475569", "EEF1F5"] } },
  royal: { deep: "14234B", acc: "14234B", gold: "B8902F", zeb: null, line: "E8E1CC", win: "FBF6E8", winTot: "14234B", winTotC: "E9C46A", tot: "FFFFFF", totC: "14234B",
    cc: { price: ["14234B", "F8F4E8"], duration: ["14234B", "F8F4E8"], experience: ["14234B", "F8F4E8"], technical: ["14234B", "F8F4E8"], financial: ["14234B", "F8F4E8"], other: ["14234B", "F8F4E8"] } },
  minimal: { deep: "111827", acc: "111827", gold: "111827", zeb: null, line: "E5E7EB", win: null, winTot: "111827", tot: null, totC: "111827",
    cc: { price: ["111827", null], duration: ["111827", null], experience: ["111827", null], technical: ["111827", null], financial: ["111827", null], other: ["111827", null] } },
  ocean: { deep: "0C4A6E", acc: "0284C7", gold: "14B8A6", zeb: "F0F9FF", line: "D6ECF8", win: "CCFBF1", winTot: "0D9488", tot: "E0F2FE", totC: "0C4A6E",
    cc: { price: ["0369A1", "E0F2FE"], duration: ["0891B2", "DDF6FB"], experience: ["0D9488", "D5F5EF"], technical: ["4F46E5", "E8E8FD"], financial: ["7C3AED", "F0E9FD"], other: ["475569", "EEF1F5"] } }
};
async function evalSheetStyled(p, V = "styled") {
  const C = critsOf(p); critApply(p);
  const T = STYLED[V] || STYLED.styled, F = "Faruma", DEEP = T.deep, GOLD = T.gold, INK = "1F2937", MUTE = "64748B", LINE = T.line;
  const resp = (p.bidders || []).filter(b => b.responsive !== false), dq = (p.bidders || []).filter(b => b.responsive === false), B = [...resp, ...dq];
  const top = resp.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
  const lab = cr => cr.labelDv || critType(cr.type)[2], man = cr => critType(cr.type)[3] === "manual", col = cr => T.cc[cr.type] || T.cc.other;
  const cols = [{ k: "total" }]; C.slice().reverse().forEach(cr => { cols.push({ k: "pts", cr }); if (!man(cr)) cols.push({ k: "val", cr }); }); cols.push({ k: "name" }, { k: "no" });
  cols.forEach((x, i) => { x.c = 2 + i; });
  const c1 = 2, cN = cols[cols.length - 1].c, at = (k, cr) => (cols.find(x => x.k === k && (!cr || x.cr === cr)) || {}).c;
  const W = xlsxSheet(), H = {}, WD = { 1: 2 }, b0 = { font: F, color: INK };
  cols.forEach(x => { WD[x.c] = x.k === "name" ? 38 : x.k === "no" ? 7 : x.k === "total" ? 16 : x.k === "val" && x.cr.type === "price" ? 19 : 14; });
  const band = (r, v, st, h) => { W.set(r, c1, v, st).merge(r, c1, r, cN); W.box(r, c1, r, cN, { fill: st.fill }); H[r] = h; };
  const rule = (r, color, style = "medium") => { W.box(r, c1, r, cN, { border: { style, color, only: "bottom" } }); H[r] = 6; };
  const outline = (r1, a, r2, b, style, color) => { for (let r = r1; r <= r2; r++) for (let c = a; c <= b; c++) { const sides = [r === r1 && "top", r === r2 && "bottom", c === a && "left", c === b && "right"].filter(Boolean); sides.length && W.box(r, c, r, c, { border: { style, color, only: sides } }); } };
  const title2 = "ކޮށްދޭނެ ފަރާތެއް ހޯދުމަށްކުރި އިޢުލާނާ ގުޅިގެން ބީލަން ހުށައެޅުއްވި ފަރާތްތަކަށް ޕޮއިންޓް ލިބިފައިވާގޮތުގެ ތަފްޞީލް" + (p.advertNo ? "   ·   " + p.advertNo : "");
  H[1] = 8; let r = 2;
  // ----- Header -----
  if (V === "styled") {
    band(2, "`", { ...b0, sz: 18, color: "FFFFFF", fill: DEEP, h: "center" }, 30);
    band(3, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...b0, b: true, sz: 17, color: "FFFFFF", fill: DEEP, h: "center" }, 30);
    band(4, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ   ·   ށ. މިލަންދޫ، ދިވެހިރާއްޖެ", { ...b0, sz: 11, color: "D7F2EE", fill: T.acc, h: "center" }, 22);
    band(5, "", { fill: GOLD }, 4); H[6] = 10;
    W.set(7, c1, p.nameDv || p.name || "", { ...b0, b: true, sz: 16, color: DEEP, h: "center", wrap: true }).merge(7, c1, 7, cN); H[7] = 36;
    W.set(8, c1, title2, { ...b0, sz: 11, color: MUTE, h: "center" }).merge(8, c1, 8, cN); H[8] = 22; r = 10;
  } else if (V === "royal") {
    const bx = Math.min(3, cN - c1 - 2);
    W.set(2, c1 + bx, "`", { ...b0, sz: 16, color: DEEP, h: "right" }).merge(2, c1 + bx, 2, cN); H[2] = 26;
    W.set(3, c1 + bx, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...b0, b: true, sz: 18, color: DEEP, h: "right" }).merge(3, c1 + bx, 3, cN); H[3] = 32;
    W.set(4, c1 + bx, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ  —  ށ. މިލަންދޫ، ދިވެހިރާއްޖެ", { ...b0, sz: 11, color: GOLD, h: "right" }).merge(4, c1 + bx, 4, cN); H[4] = 22;
    W.set(2, c1, "ބިޑް އިވެލުއޭޝަން ޝީޓް", { ...b0, b: true, sz: 14, color: "E9C46A", fill: DEEP, h: "center" }).merge(2, c1, 3, c1 + bx - 1);
    W.set(4, c1, "ތާރީޚް: " + dvDate(today()), { ...b0, sz: 10, color: "FFFFFF", fill: DEEP, h: "center" }).merge(4, c1, 4, c1 + bx - 1); W.box(2, c1, 4, c1 + bx - 1, { fill: DEEP });
    rule(5, GOLD, "thick"); H[6] = 4; rule(6, DEEP, "thin"); H[7] = 10;
    W.set(8, c1, p.nameDv || p.name || "", { ...b0, b: true, sz: 16, color: DEEP, h: "center", wrap: true }).merge(8, c1, 8, cN); H[8] = 34;
    W.set(9, c1, title2, { ...b0, sz: 11, color: "7C6A3A", h: "center", i: true }).merge(9, c1, 9, cN); H[9] = 22; r = 11;
  } else if (V === "minimal") {
    W.set(2, c1, "ތާރީޚް  " + dvDate(today()), { ...b0, sz: 10, color: MUTE, h: "left" }).merge(2, c1, 2, c1 + 2);
    W.set(2, c1 + 3, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...b0, b: true, sz: 20, color: DEEP, h: "right" }).merge(2, c1 + 3, 2, cN); H[2] = 38;
    W.set(3, c1, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ  ·  ބިޑް އިވެލުއޭޝަން ޝީޓް", { ...b0, sz: 11, color: MUTE, h: "right" }).merge(3, c1, 3, cN); H[3] = 20;
    rule(4, DEEP, "medium"); H[5] = 14;
    W.set(6, c1, p.nameDv || p.name || "", { ...b0, b: true, sz: 15, color: DEEP, h: "right", wrap: true }).merge(6, c1, 6, cN); H[6] = 30;
    W.set(7, c1, title2, { ...b0, sz: 11, color: MUTE, h: "right" }).merge(7, c1, 7, cN); H[7] = 20; r = 9;
  } else {
    band(2, "`", { ...b0, sz: 18, color: "FFFFFF", fill: "0C4A6E", h: "center" }, 28);
    band(3, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...b0, b: true, sz: 18, color: "FFFFFF", fill: "0C4A6E", h: "center" }, 32);
    band(4, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ   ·   ށ. މިލަންދޫ، ދިވެހިރާއްޖެ", { ...b0, sz: 11, color: "E0F2FE", fill: "0284C7", h: "center" }, 22);
    band(5, "", { fill: "38BDF8" }, 5); band(6, "", { fill: "99F6E4" }, 3); H[7] = 12;
    W.set(8, c1, p.nameDv || p.name || "", { ...b0, b: true, sz: 16, color: "0C4A6E", fill: "F0F9FF", h: "center", wrap: true }).merge(8, c1, 8, cN); W.box(8, c1, 9, cN, { fill: "F0F9FF" }); H[8] = 34;
    W.set(9, c1, title2, { ...b0, sz: 11, color: "0369A1", fill: "F0F9FF", h: "center" }).merge(9, c1, 9, cN); H[9] = 22; outline(8, c1, 9, cN, "thin", "7DD3FC"); r = 11;
  }
  // ----- Tags / weights over each criterion's columns -----
  const tr = r; H[tr] = V === "minimal" ? 34 : 26;
  C.forEach(cr => { const a = at("pts", cr), b = at("val", cr) || a, [fg, bg] = col(cr), s1 = Math.min(a, b), e1 = Math.max(a, b);
    if (V === "minimal") { W.set(tr, s1, `${cr.weight}%`, { ...b0, b: true, sz: 22, color: "D1D5DB", h: "center" }).merge(tr, s1, tr, e1); return; }
    if (V === "royal") { W.set(tr, s1, `${lab(cr)}  ·  ${cr.weight}%` + (critType(cr.type)[3] === "per" ? `  ·  ${cr.per || 1} / ލިޔުން` : ""), { ...b0, b: true, sz: 11, color: GOLD, h: "center", border: { style: "thin", color: GOLD, only: "bottom" } }).merge(tr, s1, tr, e1); W.box(tr, s1, tr, e1, { border: { style: "thin", color: GOLD, only: "bottom" } }); return; }
    W.set(tr, s1, `${lab(cr)}  ${cr.weight}%` + (critType(cr.type)[3] === "per" ? `  ·  ${cr.per || 1} މާކްސް / ލިޔުމަކަށް` : ""), { ...b0, b: true, sz: 11, color: fg, fill: bg, h: "center" }).merge(tr, s1, tr, e1); W.box(tr, s1, tr, e1, { fill: bg }); });
  V === "minimal" ? W.set(tr, at("total"), "100%", { ...b0, b: true, sz: 22, color: "9CA3AF", h: "center" }) : W.set(tr, at("total"), "100%", { ...b0, b: true, sz: 11, color: V === "royal" ? "E9C46A" : "FFFFFF", fill: DEEP, h: "center" });
  W.set(tr, at("name"), `ބީލަން ހުށައެޅި ފަރާތްތައް: ${B.length}`, { ...b0, sz: 10, color: MUTE, h: "right" });
  H[tr + 1] = 6;
  // ----- Two heading rows -----
  const h1 = tr + 2, h2 = tr + 3; H[h1] = 34; H[h2] = 30;
  const wline = { style: "thin", color: "FFFFFF" };
  const dark = V === "minimal" ? { ...b0, b: true, sz: 12, color: DEEP, h: "center", wrap: true, border: { style: "medium", color: DEEP, only: "bottom" } } : { ...b0, b: true, sz: 12, color: V === "royal" ? "E9C46A" : "FFFFFF", fill: DEEP, h: "center", wrap: true, border: wline };
  [["total", "މުޅި ޖުމްލަ"], ["name", "ނަން"], ["no", "#"]].forEach(([k, t]) => { W.set(h1, at(k), t, dark).merge(h1, at(k), h2, at(k)); W.box(h1, at(k), h2, at(k), dark); });
  C.forEach(cr => { const a = at("pts", cr), v = at("val", cr), [fg, bg] = col(cr), s1 = Math.min(a, v || a), e1 = Math.max(a, v || a);
    const hd = V === "minimal" ? { ...b0, b: true, sz: 12, color: DEEP, h: "center", border: { style: "thin", color: "D1D5DB", only: "bottom" } } : V === "royal" ? { ...b0, b: true, sz: 12, color: "FFFFFF", fill: DEEP, h: "center", border: { style: "medium", color: GOLD, only: "bottom" } } : { ...b0, b: true, sz: 12, color: "FFFFFF", fill: fg, h: "center", border: wline };
    const sb = V === "minimal" ? { ...b0, sz: 10, color: MUTE, h: "center", wrap: true, border: { style: "medium", color: DEEP, only: "bottom" } } : { ...b0, b: true, sz: 10, color: fg, fill: bg, h: "center", wrap: true, border: V === "royal" ? { style: "thin", color: "E8E1CC" } : wline };
    W.set(h1, s1, `${lab(cr)} %${cr.weight}`, hd).merge(h1, s1, h1, e1); W.box(h1, s1, h1, e1, hd);
    W.set(h2, a, "ލިބުނު ޕޮއިންޓް", sb); v && W.set(h2, v, cr.type === "price" ? "ހުށައެޅި އަގު" : "ޖުމްލަ", sb); });
  // ----- Data rows (same formulas as the form) -----
  const r0 = h2 + 1, rl = r0 + resp.length - 1;
  B.forEach((b, i) => {
    const rr = r0 + i, isDq = b.responsive === false, win = b === top; H[rr] = 26;
    const border = V === "minimal" ? { style: "thin", color: LINE, only: "bottom" } : { style: "thin", color: LINE };
    const fill = isDq ? (V === "minimal" ? null : "FEF2F2") : win && T.win ? T.win : T.zeb && i % 2 ? T.zeb : null;
    const base = { ...b0, sz: 12, h: "center", border, ...(fill ? { fill } : {}), ...(isDq ? (V === "minimal" ? { color: "9CA3AF", strike: true } : { color: "B91C1C", i: true }) : {}), ...(win && V === "minimal" ? { b: true } : {}) };
    W.set(rr, at("no"), i + 1, { ...base, b: true, color: isDq ? base.color : MUTE });
    W.set(rr, at("name"), (win ? (V === "royal" ? "◆  " : V === "minimal" ? "" : "★  ") : "") + (b.vendor || ""), { ...base, h: "right", b: win, indent: 1 });
    C.forEach(cr => { const pc = at("pts", cr), vc = at("val", cr), [fg] = col(cr), v = critValue(b, cr), pt = (b.points || {})[cr.key];
      vc && W.set(rr, vc, v ?? "", { ...base, fmt: cr.type === "price" ? "#,##0.00" : cr.type === "duration" ? '0" ދުވަސް"' : "0" });
      if (isDq) return W.set(rr, pc, "", base);
      if (man(cr)) return W.set(rr, pc, v ?? "", { ...base, b: true, color: fg, fmt: "0.00" });
      const Vr = xref(rr, vc), rng = `${xcol(vc)}$${r0}:${xcol(vc)}$${rl}`;
      W.set(rr, pc, pt ?? "", { ...base, b: V !== "minimal", color: fg, fmt: "0.00" }, critType(cr.type)[3] === "lowest" ? `IF(${Vr}="","",MIN(${rng})/${Vr}*${cr.weight})` : `IF(${Vr}="","",MIN(${Vr}*${cr.per || 1},${cr.weight}))`); });
    const tc = at("total");
    isDq ? W.set(rr, tc, "ޑިސްކޮލިފައި", { ...base, b: true, sz: 11 })
      : W.set(rr, tc, b.total ?? 0, { ...base, b: true, sz: 13, fmt: "0.00", ...(win ? { fill: T.winTot, color: T.winTotC || "FFFFFF" } : T.tot ? { fill: T.tot, color: T.totC } : { color: T.totC }) }, `SUM(${cols.filter(x => x.k === "pts").map(x => xref(rr, x.c)).join(",")})`);
  });
  if (V === "ocean") outline(h1, c1, r0 + B.length - 1, cN, "medium", "0284C7");
  if (V === "royal") outline(h1, c1, r0 + B.length - 1, cN, "medium", DEEP);
  r = r0 + B.length;
  // ----- How points are worked out, result -----
  r++; W.set(r, c1, "ޕޮއިންޓް ހިސާބުކުރާ ގޮތް:  " + C.map(cr => `${lab(cr)} — ` + (critType(cr.type)[3] === "lowest" ? `އެންމެ ދަށް ÷ ހުށަހެޅި × ${cr.weight}` : critType(cr.type)[3] === "per" ? `ލިޔުން × ${cr.per || 1} (އެންމެ ގިނަވެގެން ${cr.weight})` : `ކޮމިޓީން ދޭ ޕޮއިންޓް (${cr.weight} އިން)`)).join("   ·   "), { ...b0, sz: 10, color: MUTE, h: "right" }).merge(r, c1, r, cN); H[r] = 20;
  if (top) { r++; const rs = V === "royal" ? { color: DEEP, fill: "FBF6E8", border: { style: "thin", color: GOLD, only: ["top", "bottom"] } } : V === "minimal" ? { color: DEEP, border: { style: "thin", color: DEEP, only: ["top", "bottom"] } } : V === "ocean" ? { color: "FFFFFF", fill: "0D9488" } : { color: "7A5A0C", fill: "FFF7E0" };
    W.set(r, c1, `${V === "royal" ? "◆" : V === "minimal" ? "→" : "★"}  އެންމެ މަތިން ޕޮއިންޓް ލިބުނީ:  ${top.vendor}  —  ${Number(top.total || 0).toFixed(2)} ޕޮއިންޓް`, { ...b0, b: true, sz: 12, h: "right", indent: 1, ...rs }).merge(r, c1, r, cN); W.box(r, c1, r, cN, rs); H[r] = 26; }
  if (V !== "royal" && V !== "minimal") { r += 2; const mid = Math.floor((c1 + cN) / 2), df = V === "ocean" ? "E0F2FE" : "EEF6F5"; W.set(r, mid - 1, "ތާރީޚް:  " + dvDate(today()), { ...b0, b: true, sz: 12, color: DEEP, fill: df, h: "center" }).merge(r, mid - 1, r, mid + 1); W.box(r, mid - 1, r, mid + 1, { fill: df }); H[r] = 24; }
  // ----- Signatures -----
  const mem = (p.committees.eval || []).filter(m => !m.onLeave), per = 3, span = cN - c1 + 1, w3 = Math.floor(span / per);
  for (let g = 0; g < mem.length; g += per) {
    r += 2;
    mem.slice(g, g + per).forEach((m, k) => {
      const e1 = cN - k * w3, s1 = Math.max(c1, e1 - w3 + 2);
      if (V === "royal" || V === "minimal") {
        // Signature line above the name, centred
        H[r] = 36; const ln = { style: V === "royal" ? "medium" : "thin", color: V === "royal" ? DEEP : "6B7280", only: "bottom" };
        W.set(r, s1, "", { border: ln }).merge(r, s1, r, e1); W.box(r, s1, r, e1, { border: ln });
        W.set(r + 1, s1, noTitle(m.nameDv || m.name || ""), { ...b0, b: true, color: DEEP, h: "center" }).merge(r + 1, s1, r + 1, e1);
        W.set(r + 2, s1, m.designationDv || m.designation || "", { ...b0, sz: 11, color: V === "royal" ? GOLD : MUTE, h: "center" }).merge(r + 2, s1, r + 2, e1);
        W.set(r + 3, s1, "ތާރީޚް: " + dvDate(today()), { ...b0, sz: 10, color: MUTE, h: "center" }).merge(r + 3, s1, r + 3, e1);
        return;
      }
      const card = { ...b0, fill: V === "ocean" ? "FFFFFF" : "F8FAFC", h: "right", indent: 1 };
      if (V === "styled") { W.box(r, s1, r, e1, { fill: T.acc }); }
      W.set(r + 1, s1, "ސޮއި:", { ...card, sz: 10, color: MUTE }).merge(r + 1, s1, r + 1, e1);
      W.set(r + 2, s1, "", { ...card, border: { style: "dashed", color: "94A3B8", only: "bottom" } }).merge(r + 2, s1, r + 2, e1); W.box(r + 2, s1, r + 2, e1, { fill: card.fill, border: { style: "dashed", color: "94A3B8", only: "bottom" } });
      W.set(r + 3, s1, "ނަން: " + noTitle(m.nameDv || m.name || ""), { ...card, b: true, color: DEEP }).merge(r + 3, s1, r + 3, e1);
      W.set(r + 4, s1, "މަޤާމް: " + (m.designationDv || m.designation || ""), { ...card, sz: 11, color: MUTE }).merge(r + 4, s1, r + 4, e1);
      W.set(r + 5, s1, "ތާރީޚް: " + dvDate(today()), { ...card, sz: 10, color: MUTE }).merge(r + 5, s1, r + 5, e1);
      for (let q = 1; q <= 5; q++) W.box(r + q, s1, r + q, e1, { fill: card.fill });
      if (V === "ocean") outline(r + 1, s1, r + 5, e1, "medium", "38BDF8");
    });
    if (V === "royal" || V === "minimal") { H[r + 1] = 22; H[r + 2] = 20; H[r + 3] = 18; r += 3; }
    else { H[r] = 4; H[r + 1] = 20; H[r + 2] = 34; H[r + 3] = 22; H[r + 4] = 20; H[r + 5] = 18; r += 5; }
  }
  // ----- Footer -----
  r += 2;
  if (V === "styled") { band(r, "", { fill: GOLD }, 3); band(r + 1, "", { fill: DEEP }, 6); r += 1; }
  else if (V === "royal") { rule(r, DEEP, "thin"); rule(r + 1, GOLD, "thick"); r += 1; }
  else if (V === "minimal") { rule(r, DEEP, "thin"); }
  else { band(r, "", { fill: "99F6E4" }, 3); band(r + 1, "", { fill: "38BDF8" }, 4); band(r + 2, "", { fill: "0C4A6E" }, 6); r += 2; }
  const u8 = await xlsxBuild({ name: "AB", sheet: W, widths: WD, heights: H, landscape: true, onePage: true, font: F, area: [1, 1, r, cN + 1] });
  ii(new Blob([u8], { type: MIME.xlsx }), `Evaluation_${safeName(p.ref)}_${V}.xlsx`);
  audit(p, "Evaluation sheet generated", critLine(p) + " · " + V);
}

// ---------- Bid-evaluation layouts ----------
// evreport : stage tracker, key figures, 1 compliance check, 2 scoring, 3 committee recommendation, 4 signature table
// evform   : official numbered form — form code box, 1 bid details, 2 criteria, 3 points, 4 rejected bids, 5 decision, 6 signatures
// award    : points table with a summary panel (winner, amount vs estimate, saving, runner-up) and a committee stamp box
async function evalSheetBid(p, D) {
  const C = critsOf(p); critApply(p);
  const F = "Faruma", INK = "1F2937", MUTE = "64748B", NAVY = "1E3A5F", TEAL = "0F766E", GREEN = "15803D", RED = "B91C1C", AMBER = "B45309";
  const LINE = D === "evform" ? "000000" : "CBD5E1", HEAD = D === "evform" ? { fill: "D9D9D9", color: "000000" } : { fill: NAVY, color: "FFFFFF" };
  const resp = (p.bidders || []).filter(b => b.responsive !== false).sort((a, b) => (a.rank || 99) - (b.rank || 99)), dq = (p.bidders || []).filter(b => b.responsive === false);
  const B = [...resp, ...dq], win = resp[0], second = resp[1], est = p.estimate != null ? p.estimate / 100 : null;
  const lab = cr => cr.labelDv || critType(cr.type)[2], man = cr => critType(cr.type)[3] === "manual";
  const W = xlsxSheet(), H = {}, WD = { 1: 2 }, b0 = { font: F, color: INK };
  // Main table columns (right to left in an RTL sheet): # | name | per criterion value, points | total | rank | vs estimate
  const tcols = [{ k: "no", w: 6 }, { k: "name", w: 32 }]; C.forEach(cr => { if (!man(cr)) tcols.push({ k: "val", cr, w: cr.type === "price" ? 17 : 12 }); tcols.push({ k: "pts", cr, w: 11 }); });
  tcols.push({ k: "total", w: 13 }, { k: "rank", w: 8 }); if (est && D !== "evform") tcols.push({ k: "est", w: 13 });
  const c1 = 2; tcols.forEach((x, i) => { x.c = c1 + i; WD[x.c] = x.w; });
  const tN = tcols[tcols.length - 1].c, side = D === "award" ? 4 : 0, cN = side ? tN + 1 + side : tN;
  if (side) { WD[tN + 1] = 2; for (let k = 1; k <= side; k++) WD[tN + 1 + k] = 15; }
  const at = (k, cr) => (tcols.find(x => x.k === k && (!cr || x.cr === cr)) || {}).c;
  const bd = D === "evform" ? { style: "thin", color: "000000" } : { style: "thin", color: LINE };
  const th = { ...b0, b: true, sz: 11, ...HEAD, h: "center", wrap: true, border: D === "evform" ? bd : { style: "thin", color: "FFFFFF" } };
  const td = (ex = {}) => ({ ...b0, sz: 11, h: "center", border: bd, ...ex });
  const mergeSet = (r, a, b, v, st, h) => { W.set(r, a, v, st).merge(r, a, r, b); W.box(r, a, r, b, { fill: st.fill, border: st.border }); if (h) H[r] = h; };
  const sec = (r, n, t) => { mergeSet(r, c1, D === "award" ? tN : cN, `${n ? n + ".  " : ""}${t}`, { ...b0, b: true, sz: 13, color: D === "evform" ? "000000" : NAVY, h: "right", ...(D === "evform" ? { fill: "F2F2F2", border: { style: "thin", color: "000000" } } : { border: { style: "medium", color: NAVY, only: "bottom" } }) }, 24); };
  const words = v => { try { return dvMoneyWords(Math.round(v * 100)); } catch (e) { return ""; } };
  const mem = (p.committees.eval || []).filter(m => !m.onLeave);
  // ----- Header -----
  let r = 2;
  if (D === "evform") {
    mergeSet(2, cN - 1, cN, "EV-01", { ...b0, b: true, sz: 12, h: "center", border: { style: "medium", color: "000000" } }, 24);
    mergeSet(3, cN - 1, cN, "ސަފުހާ 1", { ...b0, sz: 9, color: MUTE, h: "center", border: { style: "thin", color: "000000" } });
    mergeSet(2, c1, cN - 2, "`", { ...b0, sz: 16, h: "center" });
    mergeSet(3, c1, cN - 2, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...b0, b: true, sz: 16, h: "center" }, 28);
    mergeSet(4, c1, cN, "ބިޑް އިވެލުއޭޝަން ފޯމު", { ...b0, b: true, sz: 15, h: "center", border: { style: "double", color: "000000", only: ["top", "bottom"] } }, 30);
    r = 6;
  } else {
    mergeSet(2, c1, cN - 3, "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { ...b0, b: true, sz: 18, color: NAVY, h: "right" }, 32);
    mergeSet(3, c1, cN - 3, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީ  ·  ށ. މިލަންދޫ، ދިވެހިރާއްޖެ", { ...b0, sz: 11, color: MUTE, h: "right" });
    W.set(2, cN - 2, D === "award" ? "ހަވާލުކުރުމަށް ލަފާ" : "ބިޑް އިވެލުއޭޝަން ރިޕޯޓު", { ...b0, b: true, sz: 13, color: "FFFFFF", fill: D === "award" ? TEAL : NAVY, h: "center" }).merge(2, cN - 2, 2, cN);
    W.set(3, cN - 2, (p.advertNo || "") + "   ·   " + dvDate(today()), { ...b0, sz: 9, color: "FFFFFF", fill: D === "award" ? TEAL : NAVY, h: "center" }).merge(3, cN - 2, 3, cN); W.box(2, cN - 2, 3, cN, { fill: D === "award" ? TEAL : NAVY });
    W.box(4, c1, 4, cN, { border: { style: "medium", color: D === "award" ? TEAL : NAVY, only: "bottom" } }); H[4] = 4; r = 6;
  }
  mergeSet(r, c1, cN, `${p.nameDv || p.name || ""} ކޮށްދޭނެ ފަރާތެއް ހޯދުމަށްކުރި އިޢުލާނާ ގުޅިގެން ހުށަހެޅި ބިޑްތައް ވަޒަންކުރުން`, { ...b0, b: true, sz: 14, h: "center", wrap: true, color: D === "evform" ? "000000" : INK }, 40); r += 2;
  // ----- Stage tracker and key figures (evaluation report) -----
  if (D === "evreport") {
    const st = [["ބިޑް ހުޅުވުން", true, p.bidOpening ? dvDate(p.bidOpening) : ""], ["ޝަރުތު ބެލުން", true, `${resp.length} / ${B.length}`], ["ޕޮއިންޓް ދިނުން", true, C.map(c => c.weight + "%").join("·")], ["ކޮމިޓީގެ ލަފާ", !!win, win ? "ނިމިފައި" : ""], ["ބިޑް ކޮމިޓީ", false, "ހުށަހަޅަންޖެހޭ"]];
    const span = cN - c1 + 1, seg = Math.floor(span / st.length);
    st.forEach(([t, done, sub], k) => { const a = c1 + k * seg, b = k === st.length - 1 ? cN : a + seg - 1, f = done ? TEAL : "E5E7EB", fc = done ? "FFFFFF" : MUTE;
      mergeSet(r, a, b, `${done ? "✓" : "⏳"}  ${k + 1}. ${t}`, { ...b0, b: true, sz: 11, fill: f, color: fc, h: "center", border: { style: "thin", color: "FFFFFF" } }, 26);
      mergeSet(r + 1, a, b, sub, { ...b0, sz: 9, fill: done ? "D5EFEA" : "F3F4F6", color: done ? TEAL : MUTE, h: "center", border: { style: "thin", color: "FFFFFF" } }, 18); });
    r += 3;
    const kp = [["ބިޑް ހުށަހެޅި", String(B.length)], ["ޝަރުތު ފުރިހަމަ", String(resp.length)], ["ލަފާކުރި އަގު", est != null ? ht(est * 100) : "—"], ["އެންމެ ދަށް އަގު", resp.length ? ht(Math.min(...resp.map(b => b.amount ?? Infinity))) : "—"]];
    const ks = Math.floor(span / kp.length);
    kp.forEach(([l, v], k) => { const a = c1 + k * ks, b = k === kp.length - 1 ? cN : a + ks - 1; mergeSet(r, a, b, l, { ...b0, sz: 10, color: MUTE, fill: "F8FAFC", h: "center", border: { style: "thin", color: "E2E8F0", only: ["top", "left", "right"] } }, 18); mergeSet(r + 1, a, b, v, { ...b0, b: true, sz: 15, color: NAVY, fill: "F8FAFC", h: "center", border: { style: "thin", color: "E2E8F0", only: ["bottom", "left", "right"] } }, 28); });
    r += 3;
  }
  // ----- Bid details and criteria (official form) -----
  let n = 0;
  if (D === "evform") {
    sec(r, ++n, "ބީލަމުގެ މަޢުލޫމާތު"); r++;
    const info = [["މަޝްރޫޢު", p.nameDv || p.name || ""], ["މަޝްރޫޢުގެ ނަންބަރު", p.ref || ""], ["އިޢުލާން ނަންބަރު", p.advertNo || ""], ["އިޢުލާން ކުރި ތާރީޚް", p.advertised ? dvDate(p.advertised) : ""], ["ބިޑް ހުޅުވި ތާރީޚް", p.bidOpening ? dvDate(p.bidOpening) : ""], ["ލަފާކުރި އަގު", est != null ? ht(est * 100) : ""], ["ބިޑް ހުށަހެޅި ފަރާތްތަކުގެ އަދަދު", `${B.length}  (ޝަރުތު ފުރިހަމަ ${resp.length})`]];
    info.forEach(([l, v]) => { mergeSet(r, c1, c1 + 1, l, { ...b0, b: true, sz: 11, fill: "F2F2F2", h: "right", border: bd }); mergeSet(r, c1 + 2, cN, v, { ...b0, sz: 11, h: "right", border: bd }, 22); r++; });
    r++; sec(r, ++n, "ވަޒަންކުރުމުގެ މިންގަނޑު"); r++;
    W.set(r, c1, "#", th); mergeSet(r, c1 + 1, c1 + 2, "މިންގަނޑު", th); W.set(r, c1 + 3, "%", th); mergeSet(r, c1 + 4, cN, "ޕޮއިންޓް ދޭގޮތް", th, 24); r++;
    C.forEach((cr, i) => { W.set(r, c1, i + 1, td()); mergeSet(r, c1 + 1, c1 + 2, lab(cr), td({ h: "right" })); W.set(r, c1 + 3, cr.weight, td({ b: true }));
      mergeSet(r, c1 + 4, cN, critType(cr.type)[3] === "lowest" ? `އެންމެ ދަށް ${cr.type === "price" ? "އަގަށް" : "މުއްދަތަށް"} ${cr.weight}؛ އެހެން ފަރާތްތަކަށް: އެންމެ ދަށް ÷ ހުށަހެޅި × ${cr.weight}` : critType(cr.type)[3] === "per" ? `ކޮންމެ ލިޔުމަކަށް ${cr.per || 1} މާކްސް (އެންމެ ގިނަވެގެން ${cr.weight})` : `ކޮމިޓީން ދޭ ޕޮއިންޓް (${cr.weight} އިން)`, td({ h: "right", sz: 10 }), 22); r++; });
    W.set(r, c1, "", td({ fill: "F2F2F2" })); mergeSet(r, c1 + 1, c1 + 2, "ޖުމްލަ", td({ b: true, fill: "F2F2F2", h: "right" })); W.set(r, c1 + 3, C.reduce((a, c) => a + Number(c.weight), 0), td({ b: true, fill: "F2F2F2" })); mergeSet(r, c1 + 4, cN, "", td({ fill: "F2F2F2" }), 22); r += 2;
  }
  // ----- Compliance check (evaluation report) -----
  if (D === "evreport") {
    sec(r, ++n, "ޝަރުތު ފުރިހަމަވޭތޯ ބެލުން"); r++;
    W.set(r, c1, "#", th); W.set(r, c1 + 1, "ބިޑް ހުށައެޅި ފަރާތް", th); mergeSet(r, c1 + 2, c1 + 3, "ހުށަހެޅި އަގު", th); mergeSet(r, c1 + 4, c1 + 5, "ޝަރުތު", th); mergeSet(r, c1 + 6, cN, "ބަޔާން", th, 24); r++;
    B.forEach((b, i) => { const ok = b.responsive !== false; W.set(r, c1, i + 1, td()); W.set(r, c1 + 1, b.vendor, td({ h: "right" })); mergeSet(r, c1 + 2, c1 + 3, b.amount == null ? "—" : b.amount / 100, td({ fmt: "#,##0.00" }));
      mergeSet(r, c1 + 4, c1 + 5, ok ? "✓  ފުރިހަމަ" : "✗  ފުރިހަމަނުވޭ", td({ b: true, color: ok ? GREEN : RED, fill: ok ? "ECFDF5" : "FEF2F2" })); mergeSet(r, c1 + 6, cN, b.remarks || (ok ? "" : "ޑިސްކޮލިފައި ކުރެވިފައި"), td({ h: "right", sz: 10, color: MUTE }), 22); r++; });
    r++;
  }
  // ----- Scoring table -----
  sec(r, ++n, D === "evform" ? "ޕޮއިންޓް ލިބުނު ގޮތް" : "ޕޮއިންޓް ދިނުން"); if (side) W.box(r, tN + 2, r, cN, {}); r++;
  const h1 = r, h2 = r + 1; H[h1] = 28; H[h2] = 26;
  tcols.forEach(x => {
    const one = t => { W.set(h1, x.c, t, th).merge(h1, x.c, h2, x.c); W.box(h1, x.c, h2, x.c, th); };
    if (x.k === "no") one("#"); if (x.k === "name") one("ބިޑް ހުށައެޅި ފަރާތް"); if (x.k === "total") one("މުޅި ޖުމްލަ"); if (x.k === "rank") one("ރޭންކް"); if (x.k === "est") one("ލަފާކުރި އަގާ ބަލާއިރު");
    if (x.k === "val") { W.set(h1, x.c, `${lab(x.cr)}  (${x.cr.weight}%)`, th).merge(h1, x.c, h1, x.c + 1); W.box(h1, x.c, h1, x.c + 1, th); W.set(h2, x.c, x.cr.type === "price" ? "ހުށަހެޅި އަގު" : x.cr.type === "duration" ? "ދުވަސް" : "ލިޔުން", { ...th, sz: 10, ...(D === "evform" ? {} : { fill: "2E5480" }) }); }
    if (x.k === "pts") { if (man(x.cr)) { W.set(h1, x.c, `${lab(x.cr)}  (${x.cr.weight}%)`, th); } W.set(h2, x.c, "ޕޮއިންޓް", { ...th, sz: 10, ...(D === "evform" ? {} : { fill: "2E5480" }) }); }
  });
  const r0 = h2 + 1, rl = r0 + resp.length - 1;
  B.forEach((b, i) => { const rr = r0 + i, isDq = b.responsive === false, top = b === win; H[rr] = 23;
    const ex = isDq ? { color: "9CA3AF", i: true } : top ? { b: true, fill: D === "evform" ? "F2F2F2" : "FFF7E0" } : {};
    tcols.forEach(x => { const s2 = td(ex);
      if (x.k === "no") W.set(rr, x.c, i + 1, s2); if (x.k === "name") W.set(rr, x.c, b.vendor || "", { ...s2, h: "right" });
      if (x.k === "val") W.set(rr, x.c, critValue(b, x.cr) ?? "", { ...s2, fmt: x.cr.type === "price" ? "#,##0.00" : "0" });
      if (x.k === "pts") { if (isDq) return W.set(rr, x.c, "", s2); if (man(x.cr)) return W.set(rr, x.c, critValue(b, x.cr) ?? "", { ...s2, fmt: "0.00" }); const V = xref(rr, x.c - 1), rng = `${xcol(x.c - 1)}$${r0}:${xcol(x.c - 1)}$${rl}`;
        W.set(rr, x.c, (b.points || {})[x.cr.key] ?? "", { ...s2, fmt: "0.00", b: true, color: D === "evform" ? "000000" : TEAL }, critType(x.cr.type)[3] === "lowest" ? `IF(${V}="","",MIN(${rng})/${V}*${x.cr.weight})` : `IF(${V}="","",MIN(${V}*${x.cr.per || 1},${x.cr.weight}))`); }
      if (x.k === "total") isDq ? W.set(rr, x.c, "ޑިސްކޮލިފައި", { ...s2, sz: 10 }) : W.set(rr, x.c, b.total ?? 0, { ...s2, b: true, fmt: "0.00", ...(D === "evform" ? {} : { fill: top ? TEAL : "E8EEF5", color: top ? "FFFFFF" : NAVY }) }, `SUM(${tcols.filter(y => y.k === "pts").map(y => xref(rr, y.c)).join(",")})`);
      if (x.k === "rank") { const tc = at("total"); isDq ? W.set(rr, x.c, "—", s2) : W.set(rr, x.c, b.rank ?? "", { ...s2, b: true }, `RANK(${xref(rr, tc)},$${xcol(tc)}$${r0}:$${xcol(tc)}$${rl})`); }
      if (x.k === "est") { const v = b.amount == null || isDq ? null : (b.amount / 100 - est) / est; W.set(rr, x.c, v == null ? "" : v, { ...s2, fmt: '+0.0%;-0.0%;0.0%', color: v == null ? MUTE : v <= 0 ? GREEN : AMBER, b: true }); }
    }); });
  const tEnd = r0 + B.length - 1; r = tEnd + 2;
  // ----- Summary panel and stamp (award) -----
  if (side && win) {
    const s1 = tN + 2, sN = cN, card = (rr, l, v, st = {}) => { mergeSet(rr, s1, sN, l, { ...b0, sz: 10, color: MUTE, fill: st.bg || "F8FAFC", h: "right", border: { style: "thin", color: st.bd || "E2E8F0", only: ["top", "left", "right"] } }, 18); mergeSet(rr + 1, s1, sN, v, { ...b0, b: true, sz: st.sz || 14, color: st.c || NAVY, fill: st.bg || "F8FAFC", h: "right", border: { style: "thin", color: st.bd || "E2E8F0", only: ["bottom", "left", "right"] } }, st.h || 26); };
    let sr = h1;
    card(sr, "ހަވާލުކުރުމަށް ލަފާދެވޭ ފަރާތް", "★  " + win.vendor, { bg: "FFF7E0", bd: "E9C46A", c: "7A5A0C", sz: 14, h: 30 }); sr += 2;
    card(sr, "ޖުމްލަ ޕޮއިންޓް", Number(win.total || 0).toFixed(2), { sz: 20, c: TEAL, h: 32 }); sr += 2;
    card(sr, "ހުށަހެޅި އަގު", win.amount == null ? "—" : ht(win.amount)); sr += 2;
    if (est != null && win.amount != null) { const d = win.amount / 100 - est; card(sr, "ލަފާކުރި އަގާ ބަލާއިރު", `${d <= 0 ? "▼" : "▲"} ${ht(Math.abs(d) * 100)}  (${(Math.abs(d) / est * 100).toFixed(1)}%)`, { c: d <= 0 ? GREEN : AMBER, sz: 12 }); sr += 2; }
    if (second) { card(sr, "ދެވަނަ", `${second.vendor}  ·  ${Number(second.total || 0).toFixed(2)}`, { sz: 11, c: INK }); sr += 2; }
    sr++; mergeSet(sr, s1, sN, "ކޮމިޓީގެ ތައްގަނޑު", { ...b0, sz: 9, color: MUTE, h: "center" }); sr++;
    for (let rr = sr; rr <= sr + 3; rr++) for (let c = s1 + 1; c <= sN - 1; c++) { const sides = [rr === sr && "top", rr === sr + 3 && "bottom", c === s1 + 1 && "left", c === sN - 1 && "right"].filter(Boolean); sides.length && W.box(rr, c, rr, c, { border: { style: "dashed", color: "94A3B8", only: sides } }); }
    for (let rr = sr; rr <= sr + 3; rr++) H[rr] = H[rr] || 20;
    var panelEnd = sr + 4;
  }
  // ----- Rejected bids (official form) -----
  if (D === "evform") {
    sec(r, ++n, "ޝަރުތު ފުރިހަމަ ނުވާ ފަރާތްތައް"); r++;
    W.set(r, c1, "#", th); mergeSet(r, c1 + 1, c1 + 3, "ފަރާތް", th); mergeSet(r, c1 + 4, cN, "ސަބަބު", th, 22); r++;
    (dq.length ? dq : [null]).forEach((b, i) => { W.set(r, c1, b ? i + 1 : "", td()); mergeSet(r, c1 + 1, c1 + 3, b ? b.vendor : "ނެތް", td({ h: "right" })); mergeSet(r, c1 + 4, cN, b ? b.remarks || "ޑިސްކޮލިފައި ކުރެވިފައި" : "", td({ h: "right" }), 22); r++; });
    r++;
  }
  // ----- Recommendation / decision -----
  if (win) {
    sec(r, ++n, D === "evform" ? "ނިންމުން" : "ކޮމިޓީގެ ލަފާ"); r++;
    const txt = `މަތީގައިވާ ގޮތަށް ބިޑްތައް ވަޒަންކުރުމުން، އެންމެ މަތިން ޕޮއިންޓް (${Number(win.total || 0).toFixed(2)}) ލިބިފައިވާ ${win.vendor} އަށް، ރ. ${win.amount == null ? "—" : ht(win.amount)} (${win.amount == null ? "" : words(win.amount / 100)}) އަށް މި މަސައްކަތް ހަވާލުކުރުމަށް ބިޑް ކޮމިޓީއަށް ލަފާދެމެވެ.`;
    mergeSet(r, c1, side ? tN : cN, txt, { ...b0, sz: 12, h: "right", wrap: true, v: "center", ...(D === "evform" ? { border: bd } : { fill: "F0FDF4", color: "14532D", border: { style: "medium", color: GREEN, only: "right" } }) }, 54); r += 2;
  }
  // ----- Signature table -----
  if (mem.length) {
    sec(r, ++n, "ބިޑް އިވެލުއޭޝަން ކޮމެޓީގެ ސޮއި"); r++;
    const sE = side ? tN : cN, q = Math.max(1, Math.floor((sE - c1 - 1) / 4));
    const segs = [[c1, c1, "#"], [c1 + 1, c1 + q, "ނަން"], [c1 + q + 1, c1 + 2 * q, "މަޤާމް"], [c1 + 2 * q + 1, c1 + 3 * q, "ސޮއި"], [c1 + 3 * q + 1, sE, "ތާރީޚް"]];
    segs.forEach(([a, b, t]) => mergeSet(r, a, b, t, th, 24)); r++;
    mem.forEach((m, i) => { const vals = [i + 1, noTitle(m.nameDv || m.name || ""), m.designationDv || m.designation || "", "", dvDate(today())]; segs.forEach(([a, b], k) => mergeSet(r, a, b, vals[k], td({ h: k === 1 || k === 2 ? "right" : "center" }), 32)); r++; });
  }
  if (D === "evform") { r++; mergeSet(r, c1, cN, "", { border: { style: "double", color: "000000", only: "top" } }, 6); }
  if (typeof panelEnd === "number") r = Math.max(r, panelEnd);
  const u8 = await xlsxBuild({ name: "Evaluation", sheet: W, widths: WD, heights: H, landscape: D !== "evform" || cN - c1 > 9, onePage: D !== "evform", font: F, rtl: true, area: [1, 1, r + 1, cN + 1] });
  ii(new Blob([u8], { type: MIME.xlsx }), `Evaluation_${safeName(p.ref)}_${D}.xlsx`);
  audit(p, "Evaluation sheet generated", critLine(p) + " · " + D);
}
