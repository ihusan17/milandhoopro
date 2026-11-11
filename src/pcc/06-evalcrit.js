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
const EVAL_DESIGNS = [["original", "Original (council form)"], ["emerald", "Emerald band"], ["navy", "Navy formal"], ["scorecard", "Scorecard colours"]];
const evalDesign = () => Z().evalDesign || "original";
async function critSheet(p, design) {
  const C = critsOf(p); if (!C.length) throw err("Set the evaluation criteria first");
  critApply(p);
  const D = design || evalDesign(), orig = D === "original";
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
