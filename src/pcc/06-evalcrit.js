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
  return o("div", { class: "card pcc-crit" }, o("div", { class: "row", style: { alignItems: "center" } }, o("h3", { style: { margin: 0 } }, "Evaluation criteria"), o("div", { class: "grow right pcc-acts" }, ed ? btn(C.length ? "Change criteria" : "Set criteria", () => critEdit(p), C.length ? "small" : "small primary") : null, C.length && (p.bidders || []).length ? btn("Evaluation sheet (Excel)", () => critSheet(p).catch(e => xt(e.message, "err")), "small primary") : null)),
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

// Evaluation sheet (Excel, right-to-left, Dhivehi headings): bidders with value and points for each
// criterion, total and rank, then the Evaluation Committee's signature block.
async function critSheet(p) {
  const C = critsOf(p); if (!C.length) throw err("Set the evaluation criteria first");
  critApply(p);
  const B = (p.bidders || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || (a.responsive === false) - (b.responsive === false));
  const head = ["#", "ނަން"], cs = [0, 0];
  C.forEach(c => { const T = critType(c.type), lab = (c.labelDv || T[2]) + " " + c.weight + "%";
    if (T[3] !== "manual") { head.push(lab + "\n" + (c.type === "price" ? "ހުށައެޅި އަގު" : c.type === "duration" ? "ދުވަސް" : c.type === "experience" ? "ލިޔުންތައް" : "")); cs.push(c.type === "price" ? 5 : 6); }
    head.push(lab + "\nލިބުނު ޕޮއިންޓް"); cs.push(7); });
  head.push("މުޅި ޖުމްލަ", "ރޭންކް", "ބަޔާން"); cs.push(7, 0, 0);
  const rows = B.map((b, i) => { const R2 = [i + 1, b.vendor || ""], dq = b.responsive === false;
    C.forEach(c => { const T = critType(c.type), v = critValue(b, c); if (T[3] !== "manual") R2.push(v == null ? "" : v); R2.push(dq ? "" : (b.points || {})[c.key] ?? ""); });
    R2.push(dq ? "" : b.total ?? "", dq ? "" : b.rank ?? "", dq ? (b.remarks || "ޑިސްކޮލިފައި ކުރެވިފައި") : (b.remarks || "")); return R2; });
  const mem = (p.committees.eval || []).filter(m => !m.onLeave);
  const foot = [[], ["ތާރީޚް: " + dvDate(today())], [], ...[["ސޮއި:"], ["ނަން:"], ["މަޤާމް:"]].map(([l], k) => mem.map(m => k === 0 ? l : k === 1 ? l + " " + noTitle(m.nameDv || m.name || "") : l + " " + (m.designationDv || m.designation || "")))];
  const u8 = await xlsxSimple({ sheet: "Evaluation", rtl: true, font: "Faruma", title: ["ބިޑް އިވެލުއޭޝަން ކޮމެޓީ / މިލަންދޫ ކައުންސިލްގެ އިދާރާ", (p.nameDv || p.name || "") + " — ބީލަން ހުށައެޅުއްވި ފަރާތްތަކަށް ޕޮއިންޓް ލިބިފައިވާގޮތުގެ ތަފްޞީލް", "ކްރައިޓީރިއާ: " + C.map(c => `${c.labelDv || critType(c.type)[2]} ${c.weight}%` + (critType(c.type)[3] === "per" ? ` (ކޮންމެ ލިޔުމަކަށް ${c.per || 1} މާކްސް)` : "")).join("، ") + (p.advertNo ? "   ·   " + p.advertNo : "")], head, rows, colStyle: cs, foot, footSpread: 3,
    widths: head.map((h, i) => (i === 0 ? 5 : i === 1 ? 32 : /ބަޔާން/.test(h) ? 26 : 15)) });
  ii(new Blob([u8], { type: MIME.xlsx }), `Evaluation_${safeName(p.ref)}.xlsx`);
  audit(p, "Evaluation sheet generated", critLine(p));
}
