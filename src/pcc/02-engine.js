// Template engine. Word: docxtemplater fills {placeholders} in the original file, so the
// letterhead, fonts, RTL paragraphs, borders and signature blocks stay exactly as uploaded.
// Excel: the original workbook XML is edited in place (cells, merged ranges, styles,
// formulas and print setup are kept); {placeholders} in cells, an optional cell map, and
// loop rows ({#bidders} … {/bidders}) that fill the formatted rows below or insert new ones.

const LIB = () => { if (!window.PCCLIB) throw err("The document library did not load. Reload the page."); return window.PCCLIB; };
const XNS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const decodeEnt = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const TAGRE = /\{\s*([#\/^]?)\s*([A-Za-z_][\w.]*)\s*\}/g;

// Collect placeholders in reading order; tags inside a loop are reported as "loop.tag".
function scanText(chunks) {
  const out = [], seen = new Set(), stack = [];
  for (const t of chunks) for (const m of t.matchAll(TAGRE)) {
    const [, k, name] = m;
    if (k === "#" || k === "^") { stack.push(name); const id = "#" + name; seen.has(id) || (seen.add(id), out.push({ name, loop: true })); }
    else if (k === "/") { const i = stack.lastIndexOf(name); i >= 0 && stack.splice(i, 1); }
    else { const full = stack.length ? stack[stack.length - 1] + "." + name : name; seen.has(full) || (seen.add(full), out.push({ name: full, inLoop: stack[stack.length - 1] || null })); }
  }
  return out;
}

// ----- Word -----
function docxParts(zip) { return Object.keys(zip.files).filter(n => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n)).sort((a, b) => (a === "word/document.xml" ? -1 : b === "word/document.xml" ? 1 : a.localeCompare(b))); }
// Text rules: replace text that is in the council's original document (e.g. last project's name,
// Iulaan number or dates) with a {field}, so originals work without typing placeholders.
// Also repairs tags typed with an RTL keyboard, which come out as }name{.
const REVTAG = /\}\s*([#\/^]?)\s*([A-Za-z_][\w.]*)\s*\{/g;
// Placeholders as people really type them in Word: spaces or hidden RTL/zero-width marks
// inside the braces, non-breaking spaces, capitals, {{double}} or full-width ｛braces｝,
// and }reversed{ or {mixed{ braces from an RTL keyboard. All become a clean {name}.
const TJ = "[\\s\\u00A0\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF]*";
const TN = TJ + "([#\\/^]?)" + TJ + "([A-Za-z_][\\w.]*)" + TJ;
const TAGFIX = [new RegExp("[{\\uFF5B]" + TJ + "[{\\uFF5B]" + TN + "[}\\uFF5D]" + TJ + "[}\\uFF5D]", "g"), new RegExp("[{\\uFF5B]" + TN + "[}\\uFF5D]", "g"), new RegExp("[}\\uFF5D{\\uFF5B]" + TN + "[}\\uFF5D{\\uFF5B]", "g")];
function tagMatches(full) {
  const M = [], free = (a, b) => !M.some(x => x[0] < b && a < x[1]);
  TAGFIX.forEach(re => { for (const m of full.matchAll(re)) { const a = m.index, b = a + m[0].length, rep = "{" + m[1] + m[2].toLowerCase() + "}"; free(a, b) && M.push([a, b, rep]); } });
  return M.filter(x => full.slice(x[0], x[1]) !== x[2]);
}
const xmlEsc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cleanRules = rules => (rules || []).filter(r => r && r.find && r.field).sort((a, b) => b.find.length - a.find.length);
function rewriteText(s, rules) {
  s = String(s); for (const [a, b, rep] of tagMatches(s).sort((x, y) => y[0] - x[0])) s = s.slice(0, a) + rep + s.slice(b);
  for (const r of cleanRules(rules)) s = s.split(r.find).join("{" + r.field + "}");
  return s;
}
// A rule with "at" replaces only those occurrences (1 = first in the document), so one date can
// become the bid opening date in one place and the evaluation date in another.
function textMatches(full, rules, seen = {}) {
  const M = [];
  M.push(...tagMatches(full));
  const R = cleanRules(rules), finds = [...new Set(R.map(r => r.find))];
  for (const f of finds) { let i = 0; while ((i = full.indexOf(f, i)) >= 0) { const e = i + f.length, n = (seen[f] = (seen[f] || 0) + 1), r = R.find(x => x.find === f && x.at && x.at.includes(n)) || R.find(x => x.find === f && !(x.at && x.at.length)); if (r && !M.some(x => x[0] < e && i < x[1])) M.push([i, e, "{" + r.field + "}"]); i = e; } }
  return M.sort((a, b) => b[0] - a[0]);
}
// Apply text rules inside Word paragraphs, also when the text is split over several runs.
function rulesDocx(u8, rules) {
  const zip = new (LIB().PizZip)(u8), seen = {}; let changed = false;
  docxParts(zip).forEach(n => {
    const xml = zip.file(n).asText();
    const out = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, par => {
      const re = /(<w:t(?:\s[^>]*)?>)([^<]*)(<\/w:t>)/g, segs = []; let m;
      while ((m = re.exec(par))) segs.push({ start: m.index, len: m[0].length, open: m[1], text: decodeEnt(m[2]), close: m[3] });
      if (!segs.length) return par;
      const texts = segs.map(s => s.text), M = textMatches(texts.join(""), rules, seen);
      if (!M.length) return par;
      for (const [s, e, rep] of M) {
        let o0 = 0; const of = texts.map(t => { const x = o0; o0 += t.length; return x; });
        const i = of.findIndex((x, k) => s >= x && s < x + texts[k].length), j = of.findIndex((x, k) => e - 1 >= x && e - 1 < x + texts[k].length);
        if (i < 0 || j < 0) continue;
        if (i === j) texts[i] = texts[i].slice(0, s - of[i]) + rep + texts[i].slice(e - of[i]);
        else { texts[i] = texts[i].slice(0, s - of[i]) + rep; for (let k = i + 1; k < j; k++) texts[k] = ""; texts[j] = texts[j].slice(e - of[j]); }
      }
      changed = true;
      let res = "", last = 0;
      segs.forEach((s, k) => { res += par.slice(last, s.start) + (/xml:space/.test(s.open) ? s.open : s.open.replace(/^<w:t/, '<w:t xml:space="preserve"')) + xmlEsc(texts[k]) + s.close; last = s.start + s.len; });
      return res + par.slice(last);
    });
    if (out !== xml) zip.file(n, out);
  });
  return changed ? zip.generate({ type: "uint8array", compression: "DEFLATE" }) : u8;
}
// Plain text of a template, for suggesting rules.
async function templateText(u8, type) {
  if (type === "xlsx") { const X = await xlsxOpen(u8), out = []; for (const sh of X.sheets) { const f = X.zip.file(sh.path); if (!f) continue; [...xparse(await f.async("string")).getElementsByTagName("c")].forEach(c => { const t = cellText(c, X.ss); t && isNaN(Number(t)) && out.push(t); }); } return out; }
  const zip = new (LIB().PizZip)(u8), out = [];
  // Only the text Word shows (w:t), in paragraph order, the same text the replace rules work on.
  docxParts(zip).forEach(n => (zip.file(n).asText().match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).forEach(p => { const t = decodeEnt((p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g) || []).map(x => x.replace(/<[^>]+>/g, "")).join("")); t.trim() && out.push(t); }));
  return out;
}
function scanDocx(u8, rules) {
  u8 = rulesDocx(u8, rules);
  const zip = new (LIB().PizZip)(u8), chunks = [];
  docxParts(zip).forEach(n => zip.file(n).asText().split(/<\/w:p>/).forEach(p => chunks.push(decodeEnt(p.replace(/<w:tab\/>/g, " ").replace(/<[^>]+>/g, "")))));
  return { tags: scanText(chunks), sheets: [] };
}
function docxError(e) {
  const es = (e.properties && e.properties.errors) || [e];
  return err("The Word template has a problem: " + es.slice(0, 4).map(x => (x.properties && (x.properties.explanation || x.properties.id)) || x.message).join("; "));
}
function fillDocx(u8, data, rules) {
  const { PizZip, Docxtemplater } = LIB();
  u8 = rulesDocx(u8, rules);
  let doc;
  try {
    doc = new Docxtemplater(new PizZip(u8), { paragraphLoop: true, linebreaks: true, nullGetter: () => "" });
    doc.render(data);
  } catch (e) { throw docxError(e); }
  const onLeave = [...(data.bid_members || []), ...(data.eval_members || [])].filter(m => m.__leave).map(m => ({ names: [m.member_name_dv, m.member_name].filter(s => s && s.length > 3), text: m.leave_text }));
  return fixRuns(leaveCells(doc.getZip().generate({ type: "uint8array", compression: "DEFLATE" }), onLeave));
}
// Filled values take the formatting of the run the placeholder was typed in. Placeholders are typed
// in English, so that run often has no Thaana font (Word then shows Thaana in MV Boli) and may be
// marked right-to-left (Word then shows BC/284/2026-01 back to front). Thaana runs get the font the
// document's own Thaana text uses; runs with English letters and no Thaana lose the RTL mark.
const THRE = /[\u0780-\u07BF]/;
function fixRuns(u8) {
  const zip = new (LIB().PizZip)(u8); let changed = false;
  const parts = docxParts(zip), runs = n => zip.file(n).asText().match(/<w:r[ >](?:(?!<\/w:r>)[\s\S])*?<\/w:r>/g) || [];
  const rtext = r => decodeEnt((r.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, "")).join(""));
  const count = {};
  parts.forEach(n => runs(n).forEach(r => { const f = (/<w:rFonts [^>]*w:cs="([^"]+)"/.exec(r) || [])[1]; f && THRE.test(rtext(r)) && !/MV Boli/i.test(f) && (count[f] = (count[f] || 0) + rtext(r).length); }));
  const font = Object.keys(count).sort((a, b) => count[b] - count[a])[0] || "Faruma";
  parts.forEach(n => {
    const x = zip.file(n).asText();
    const y = x.replace(/<w:r((?:\s[^>]*)?)>((?:(?!<\/w:r>)[\s\S])*?)<\/w:r>/g, (r, sp, body) => {
      const t = rtext(r); if (!t.trim()) return r;
      let b = body;
      if (THRE.test(t)) {
        const cs = (/<w:rFonts [^>]*w:cs="([^"]+)"/.exec(b) || [])[1];
        if (!/<w:rPr>/.test(b)) b = "<w:rPr></w:rPr>" + b;
        if (!cs || /MV Boli/i.test(cs)) {
          b = /<w:rFonts [^>]*\/>/.test(b) ? b.replace(/<w:rFonts ([^>]*)\/>/, (m, a) => "<w:rFonts " + a.replace(/\s*w:cs="[^"]*"/, "") + ` w:cs="${font}"/>`) : b.replace("<w:rPr>", `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>`);
          b = b.replace(/<w:rFonts ([^>]*)\/>/, (m, a) => /w:ascii=/.test(a) ? m : `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" ${a}/>`);
        }
        // Dhivehi text is right-to-left (the placeholder's run may have been left-to-right).
        /<w:rtl\/>/.test(b) || (b = b.replace("</w:rPr>", "<w:rtl/></w:rPr>"));
      } else if (/[A-Za-z]/.test(t) && !/[\u0590-\u08FF]/.test(t)) {
        b = b.replace(/<w:rtl\/>/g, "");
        // Keep values such as (AGR)284-A/PRIV/2026/22 in one piece inside a Dhivehi line: brackets at the
        // start or end would otherwise jump to the other side.
        if (/[()\[\]]/.test(t) && !/^\u202A/.test(t)) { let first = true; const ts = b.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g) || [], lastT = ts[ts.length - 1];
          b = b.replace(/(<w:t(?:\s[^>]*)?>)([^<]*)(<\/w:t>)/g, (m, o1, x, c1) => { const isFirst = first; first = false; return o1.replace(/^<w:t(?!\s+xml:space)/, '<w:t xml:space="preserve"') + (isFirst ? "\u202A" : "") + x + (m === lastT ? "\u202C" : "") + c1; }); }
        /<w:rFonts /.test(b) || (b = /<w:rPr>/.test(b) ? b.replace("<w:rPr>", `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>`) : `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/></w:rPr>` + b);
      }
      if (b === body) return r;
      changed = true; return "<w:r" + sp + ">" + b + "</w:r>";
    });
    y !== x && zip.file(n, y);
  });
  return changed ? zip.generate({ type: "uint8array", compression: "DEFLATE" }) : u8;
}

// ----- Excel helpers -----
const colNum = s => { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n; };
const colStr = n => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const splitRef = r => { const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(r || ""); return m ? [colNum(m[1]), Number(m[2])] : null; };
const xparse = t => new DOMParser().parseFromString(t, "application/xml");
const xser = d => new XMLSerializer().serializeToString(d);
const kids = (el, tag) => [...el.childNodes].filter(n => n.nodeType === 1 && n.localName === tag);
const kid = (el, tag) => kids(el, tag)[0] || null;

async function xlsxOpen(u8) {
  const zip = await LIB().JSZip.loadAsync(u8);
  const wb = xparse(await zip.file("xl/workbook.xml").async("string"));
  const rels = xparse(await zip.file("xl/_rels/workbook.xml.rels").async("string"));
  const R = {}; [...rels.getElementsByTagName("Relationship")].forEach(r => { R[r.getAttribute("Id")] = r.getAttribute("Target"); });
  const sheets = [...wb.getElementsByTagName("sheet")].map(s => {
    const rid = s.getAttribute("r:id") || s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    let tg = R[rid] || ""; tg = tg.startsWith("/") ? tg.slice(1) : "xl/" + tg.replace(/^\.\//, "");
    return { name: s.getAttribute("name"), path: tg, state: s.getAttribute("state") || "visible" };
  });
  const ssf = zip.file("xl/sharedStrings.xml");
  const ss = ssf ? [...xparse(await ssf.async("string")).getElementsByTagName("si")].map(si => [...si.getElementsByTagName("t")].map(t => t.textContent).join("")) : [];
  return { zip, wb, sheets, ss };
}
function cellText(c, ss) {
  const t = c.getAttribute("t"), v = kid(c, "v");
  if (t === "s") return ss[Number(v && v.textContent)] ?? "";
  if (t === "inlineStr") { const is = kid(c, "is"); return is ? [...is.getElementsByTagName("t")].map(x => x.textContent).join("") : ""; }
  return v ? v.textContent : "";
}
function setCell(doc, c, val) {
  if (typeof val === "string") val = val.replace(/\u27E6[LG]\u27E7/g, "").replace(/\u27E6(IMG|PHOTOS|FIELD|STAMP):[^\u27E7]*\u27E7/g, "");
  [...c.childNodes].forEach(n => { if (n.nodeType === 1 && (n.localName === "v" || n.localName === "is")) c.removeChild(n); });
  if (val === "" || val == null) { c.removeAttribute("t"); return; }
  if (typeof val === "number" && isFinite(val)) {
    c.removeAttribute("t");
    const v = doc.createElementNS(XNS, "v"); v.textContent = String(val); c.appendChild(v);
  } else {
    c.setAttribute("t", "inlineStr");
    const is = doc.createElementNS(XNS, "is"), t = doc.createElementNS(XNS, "t");
    t.setAttribute("xml:space", "preserve"); t.textContent = String(val); is.appendChild(t); c.appendChild(is);
  }
}
function getRow(doc, sd, r, create) {
  const rows = kids(sd, "row");
  for (const row of rows) { const n = Number(row.getAttribute("r")); if (n === r) return row; if (n > r) { if (!create) return null; const nr = doc.createElementNS(XNS, "row"); nr.setAttribute("r", r); sd.insertBefore(nr, row); return nr; } }
  if (!create) return null;
  const nr = doc.createElementNS(XNS, "row"); nr.setAttribute("r", r); sd.appendChild(nr); return nr;
}
function getCell(doc, row, col, create) {
  const r = row.getAttribute("r");
  for (const c of kids(row, "c")) { const n = splitRef(c.getAttribute("r"))[0]; if (n === col) return c; if (n > col) { if (!create) return null; const nc = doc.createElementNS(XNS, "c"); nc.setAttribute("r", colStr(col) + r); row.insertBefore(nc, c); return nc; } }
  if (!create) return null;
  const nc = doc.createElementNS(XNS, "c"); nc.setAttribute("r", colStr(col) + r); row.appendChild(nc); return nc;
}
const rowBlank = row => !row || kids(row, "c").every(c => !kid(c, "v") && !kid(c, "is") && !kid(c, "f"));
// Shift references to rows >= at by k (formulas, merges, validations, dimension, defined names).
function shiftFormula(f, at, k) {
  let out = "", inQ = false;
  for (let i = 0; i < f.length;) {
    const ch = f[i];
    if (ch === '"') { inQ = !inQ; out += ch; i++; continue; }
    if (inQ) { out += ch; i++; continue; }
    const m = /^(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\d(A-Za-z_])/.exec(f.slice(i));
    if (m && !/[A-Za-z0-9_!.]/.test(f[i - 1] || "")) { const r = Number(m[4]); out += m[1] + m[2] + m[3] + (r >= at ? r + k : r); i += m[0].length; continue; }
    out += ch; i++;
  }
  return out;
}
const shiftRange = (s, at, k) => s.split(" ").map(part => part.split(":").map(ref => { const m = /^(\$?)([A-Z]+)(\$?)(\d+)$/.exec(ref); return m ? m[1] + m[2] + m[3] + (Number(m[4]) >= at ? Number(m[4]) + k : m[4]) : ref; }).join(":")).join(" ");
function insertRows(doc, sd, at, k) {
  kids(sd, "row").forEach(row => {
    const r = Number(row.getAttribute("r"));
    if (r >= at) { row.setAttribute("r", r + k); kids(row, "c").forEach(c => { const [cn] = splitRef(c.getAttribute("r")); c.setAttribute("r", colStr(cn) + (r + k)); }); }
  });
  [...doc.getElementsByTagName("f")].forEach(f => { f.textContent = shiftFormula(f.textContent, at, k); f.getAttribute("ref") && f.setAttribute("ref", shiftRange(f.getAttribute("ref"), at, k)); });
  [...doc.getElementsByTagName("mergeCell")].forEach(m => m.setAttribute("ref", shiftRange(m.getAttribute("ref"), at, k)));
  for (const tag of ["dataValidation", "conditionalFormatting"]) [...doc.getElementsByTagName(tag)].forEach(m => m.getAttribute("sqref") && m.setAttribute("sqref", shiftRange(m.getAttribute("sqref"), at, k)));
  [...doc.getElementsByTagName("hyperlink")].forEach(m => m.getAttribute("ref") && m.setAttribute("ref", shiftRange(m.getAttribute("ref"), at, k)));
  const dim = doc.getElementsByTagName("dimension")[0]; dim && dim.setAttribute("ref", shiftRange(dim.getAttribute("ref"), at, k));
}
function mergesOnRow(doc, r) { return [...doc.getElementsByTagName("mergeCell")].map(m => m.getAttribute("ref")).filter(ref => { const [a, b] = ref.split(":"); return splitRef(a)[1] === r && splitRef(b || a)[1] === r; }); }
function addMerge(doc, ref) {
  let mc = doc.getElementsByTagName("mergeCells")[0];
  if (!mc) {
    mc = doc.createElementNS(XNS, "mergeCells");
    const ws = doc.documentElement, before = ["sheetData", "sheetCalcPr", "sheetProtection", "protectedRanges", "scenarios", "autoFilter", "sortState", "dataConsolidate", "customSheetViews"].map(t => kid(ws, t)).filter(Boolean).pop();
    ws.insertBefore(mc, before.nextSibling);
  }
  if ([...mc.getElementsByTagName("mergeCell")].some(m => m.getAttribute("ref") === ref)) return;
  const m = doc.createElementNS(XNS, "mergeCell"); m.setAttribute("ref", ref); mc.appendChild(m); mc.setAttribute("count", mc.getElementsByTagName("mergeCell").length);
}
const getPath = (o2, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o2);
function render(str, scope, root) {
  return str.replace(TAGRE, (all, k, name) => { if (k) return ""; const v = getPath(scope, name) ?? getPath(root, name); return v == null ? "" : String(v); });
}
const pureTag = s => { const m = /^\s*\{\s*([A-Za-z_][\w.]*)\s*\}\s*$/.exec(s); return m ? m[1] : null; };
function valueFor(text, scope, root) {
  const pt = pureTag(text);
  if (pt) { const nm = (scope.__num && scope.__num[pt]) ?? (root.__num && root.__num[pt]); if (typeof nm === "number") return nm; const v = getPath(scope, pt) ?? getPath(root, pt); if (typeof v === "number") return v; }
  return render(text, scope, root);
}

async function scanXlsx(u8, rules) {
  const X = await xlsxOpen(u8), chunks = [];
  // Per row, the cell that opens a loop is read first and the one that closes it last, so right-to-left
  // sheets (loop opened in the last column) report the row's fields as loop fields.
  for (const sh of X.sheets) { const f = X.zip.file(sh.path); if (!f) continue; const d = xparse(await f.async("string"));
    [...d.getElementsByTagName("row")].forEach(row => { const T = kids(row, "c").map(c => rewriteText(cellText(c, X.ss), rules)).filter(t => t.includes("{")); const rank = t => (/\{\s*[#^]/.test(t) ? 0 : /\{\s*\//.test(t) ? 2 : 1); T.sort((a, b) => rank(a) - rank(b)).forEach(t => chunks.push(t)); }); }
  return { tags: scanText(chunks), sheets: X.sheets.map(s => s.name) };
}

// Cells formatted as dates get a real Excel date (so the workbook's own date format shows), not text.
async function dateStyles(zip) {
  const f = zip.file("xl/styles.xml"); if (!f) return () => false;
  const st = xparse(await f.async("string")), codes = {};
  [...st.getElementsByTagName("numFmt")].forEach(n => { codes[n.getAttribute("numFmtId")] = n.getAttribute("formatCode") || ""; });
  const xfs = st.getElementsByTagName("cellXfs")[0], list = xfs ? kids(xfs, "xf").map(x => Number(x.getAttribute("numFmtId") || 0)) : [];
  const isD = id => (id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (codes[id] != null && /[dmy]/i.test(codes[id].replace(/"[^"]*"|\[[^\]]*\]/g, "")));
  return c => isD(list[Number(c.getAttribute("s") || 0)] || 0);
}
const dmySerial = v => { const [d, m, y] = v.split(".").map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000; };
async function fillXlsx(u8, data, cellMap = [], rules) {
  const X = await xlsxOpen(u8), ct = c => rewriteText(cellText(c, X.ss), rules), DS = await dateStyles(X.zip);
  const put = (doc, c, v) => setCell(doc, c, typeof v === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(v) && DS(c) ? dmySerial(v) : v);
  for (const sh of X.sheets) {
    const f = X.zip.file(sh.path); if (!f) continue;
    const doc = xparse(await f.async("string")), sd = doc.getElementsByTagName("sheetData")[0]; if (!sd) continue;
    // 1. loop rows
    let guard = 0;
    for (;;) {
      if (++guard > 200) break;
      const loopRow = kids(sd, "row").find(row => kids(row, "c").some(c => /\{\s*#\s*[A-Za-z_]/.test(ct(c))));
      if (!loopRow) break;
      const R = Number(loopRow.getAttribute("r")), cells = kids(loopRow, "c").map(c => ({ col: splitRef(c.getAttribute("r"))[0], s: c.getAttribute("s"), text: ct(c), f: kid(c, "f") }));
      const name = (cells.map(c => /\{\s*#\s*([A-Za-z_][\w.]*)\s*\}/.exec(c.text)).find(Boolean) || [])[1];
      const items = Array.isArray(getPath(data, name)) ? getPath(data, name) : [];
      const tpl = cells.map(c => ({ ...c, text: c.text.replace(new RegExp(`\\{\\s*[#/^]\\s*${name}\\s*\\}`, "g"), "") }));
      const merges = mergesOnRow(doc, R), rowAttrs = ["ht", "customHeight", "s", "customFormat", "spans"].map(a => [a, loopRow.getAttribute(a)]).filter(x => x[1] != null);
      const n = Math.max(1, items.length);
      // rows available below without disturbing content
      let avail = 0; for (let r = R + 1; avail < n - 1; r++) { const row = getRow(doc, sd, r, false); const later = kids(sd, "row").some(x => Number(x.getAttribute("r")) > r); if (row && !rowBlank(row)) break; if (!row && !later) { avail = Infinity; break; } avail++; }
      if (n - 1 > avail) insertRows(doc, sd, R + 1 + avail, n - 1 - avail);
      for (let i = 0; i < n; i++) {
        const r = R + i, row = getRow(doc, sd, r, true), it = items[i];
        rowAttrs.forEach(([a, v]) => row.getAttribute(a) == null && row.setAttribute(a, v));
        for (const c of tpl) {
          const cell = getCell(doc, row, c.col, true);
          c.s != null && !cell.getAttribute("s") && cell.setAttribute("s", c.s);
          // copy a formula from the template row, moving its relative references to this row
          if (c.f && i > 0 && !kid(cell, "f")) { const nf = doc.createElementNS(XNS, "f"); nf.textContent = c.f.textContent.replace(/(\$?[A-Z]{1,3})(\$?)(\d+)(?![\d(])/g, (m, a, b, d) => (b || Number(d) !== R ? m : a + r)); cell.appendChild(nf); continue; }
          if (c.f) continue;
          put(doc, cell, it ? valueFor(c.text, { ...it, __num: it.__num }, data) : "");
        }
        if (i > 0) merges.forEach(ref => addMerge(doc, ref.split(":").map(x => { const [cn] = splitRef(x); return colStr(cn) + r; }).join(":")));
      }
    }
    // 2. plain placeholders
    [...doc.getElementsByTagName("c")].forEach(c => { if (kid(c, "f")) return; const t = ct(c); if (/\{\s*[A-Za-z_][\w.]*\s*\}/.test(t)) put(doc, c, valueFor(t, data, data)); });
    // 3. cell map
    cellMap.filter(m => m.sheet === sh.name && m.cell && m.field).forEach(m => {
      const ref = splitRef(String(m.cell).toUpperCase()); if (!ref) return;
      const row = getRow(doc, sd, ref[1], true), c = getCell(doc, row, ref[0], true);
      if (kid(c, "f")) return; // keep formulas live
      put(doc, c, valueFor("{" + m.field + "}", data, data));
    });
    X.zip.file(sh.path, xser(doc));
  }
  // Recalculate formulas when the file is opened; drop the stale calculation chain.
  if (X.zip.file("xl/calcChain.xml")) {
    X.zip.remove("xl/calcChain.xml");
    const ct = await X.zip.file("[Content_Types].xml").async("string");
    X.zip.file("[Content_Types].xml", ct.replace(/<Override[^>]*calcChain[^>]*\/>/, ""));
    const rf = "xl/_rels/workbook.xml.rels", rt = await X.zip.file(rf).async("string");
    X.zip.file(rf, rt.replace(/<Relationship[^>]*calcChain[^>]*\/>/, ""));
  }
  let cp = X.wb.getElementsByTagName("calcPr")[0];
  if (!cp) { cp = X.wb.createElementNS(XNS, "calcPr"); X.wb.documentElement.appendChild(cp); }
  cp.setAttribute("fullCalcOnLoad", "1");
  X.zip.file("xl/workbook.xml", xser(X.wb));
  return X.zip.generateAsync({ type: "uint8array", compression: "DEFLATE", mimeType: MIME.xlsx });
}

// ----- previews -----
// Word treats jc left/right/start/end in a right-to-left paragraph as start/end (start = right edge);
// the preview library reads them literally, so swap them for the preview only.
function previewFixRTL(u8) {
  const zip = new (LIB().PizZip)(u8), SW = { left: "right", right: "left", start: "right", end: "left" }; let ch = false;
  docxParts(zip).forEach(n => {
    const x = zip.file(n).asText(), y = x.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/g, pp => (/<w:bidi(\/| w:val="(1|true|on)")/.test(pp) ? pp.replace(/<w:jc w:val="(left|right|start|end)"\/>/, (m, v) => { ch = true; return `<w:jc w:val="${SW[v]}"/>`; }) : pp));
    if (y !== x) zip.file(n, y);
  });
  return ch ? zip.generate({ type: "uint8array" }) : u8;
}
async function previewDocx(u8, host) {
  host.replaceChildren(o("div", { class: "muted small" }, "Opening preview…"));
  try { u8 = previewFixRTL(u8); } catch (e) { console.warn(e); }
  const box = o("div", { class: "pcc-docx" });
  await LIB().renderDocx(new Blob([u8]), box, null, { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true, experimental: true });
  host.replaceChildren(box);
}
async function previewXlsx(u8, host) {
  const X = await xlsxOpen(u8), out = [];
  for (const sh of X.sheets.filter(s => s.state === "visible")) {
    const f = X.zip.file(sh.path); if (!f) continue;
    const d = xparse(await f.async("string")), grid = {}, merges = {}, skip = new Set();
    let maxR = 0, maxC = 0;
    [...d.getElementsByTagName("c")].forEach(c => { const rc = splitRef(c.getAttribute("r")); if (!rc) return; let t = cellText(c, X.ss); const fm = kid(c, "f"); if (fm && !t) t = "=" + fm.textContent; if (t !== "") { grid[rc[1] + ":" + rc[0]] = t; maxR = Math.max(maxR, rc[1]); maxC = Math.max(maxC, rc[0]); } });
    [...d.getElementsByTagName("mergeCell")].forEach(m => { const [a, b] = m.getAttribute("ref").split(":"); const A = splitRef(a), B = splitRef(b || a); merges[A[1] + ":" + A[0]] = [B[1] - A[1] + 1, B[0] - A[0] + 1]; for (let r = A[1]; r <= B[1]; r++) for (let c = A[0]; c <= B[0]; c++) (r !== A[1] || c !== A[0]) && skip.add(r + ":" + c); maxR = Math.max(maxR, B[1]); maxC = Math.max(maxC, B[0]); });
    maxR = Math.min(maxR, 300); maxC = Math.min(maxC, 40);
    const rows = [];
    for (let r = 1; r <= maxR; r++) { const tds = []; for (let c = 1; c <= maxC; c++) { const k = r + ":" + c; if (skip.has(k)) continue; const m = merges[k]; tds.push(o("td", { dir: "auto", rowspan: m && m[0] > 1 ? m[0] : null, colspan: m && m[1] > 1 ? m[1] : null }, grid[k] ?? "")); } rows.push(o("tr", {}, o("th", {}, r), tds)); }
    out.push(o("h4", {}, sh.name), o("div", { class: "pcc-xl" }, o("table", {}, o("thead", {}, o("tr", {}, o("th", {}), Array.from({ length: maxC }, (_, i) => o("th", {}, colStr(i + 1))))), o("tbody", {}, rows))));
  }
  host.replaceChildren(...(out.length ? out : [o("p", { class: "muted" }, "The workbook has no visible cells.")]));
}
async function previewFile(u8, name, title) {
  const host = o("div", { class: "pcc-prev" }), ext = extOf(name);
  const p = Mt(title || name, [host], [{ label: "Download", value: "dl" }, { label: "Close", primary: !0, value: !1 }]);
  requestAnimationFrame(() => { const m = host.closest(".modal"); m && m.classList.add("pcc-wide"); });
  try {
    if (ext === "docx") await previewDocx(u8, host);
    else if (ext === "xlsx") await previewXlsx(u8, host);
    else if (ext === "pdf" || /^(png|jpe?g|gif|webp)$/.test(ext)) { const url = URL.createObjectURL(new Blob([u8], { type: ext === "pdf" ? "application/pdf" : "image/" + ext.replace("jpg", "jpeg") })); host.replaceChildren(ext === "pdf" ? o("iframe", { src: url, class: "pcc-pdf", title: name }) : o("img", { src: url, alt: name, style: { maxWidth: "100%" } })); }
    else host.replaceChildren(o("p", { class: "muted" }, "No preview for this file type. Use Download."));
  } catch (e) { host.replaceChildren(o("div", { class: "alert err" }, "Preview failed: " + e.message)); }
  if ((await p) === "dl") ii(new Blob([u8], { type: MIME[ext] || "application/octet-stream" }), name);
}
async function zipFiles(files) { const z = new (LIB().JSZip)(); files.forEach(f => z.file(f.name, f.data)); return z.generateAsync({ type: "uint8array", compression: "DEFLATE" }); }

// ----- Pictures and Word features after filling: ⟦IMG:key⟧, ⟦PHOTOS:key⟧, ⟦FIELD:PAGE⟧, ⟦STAMP:color:text⟧ -----
const EMU = 360000; // per cm
function imgSize(u8) {
  if (u8[0] === 0x89 && u8[1] === 0x50) return { w: (u8[16] << 24) | (u8[17] << 16) | (u8[18] << 8) | u8[19], h: (u8[20] << 24) | (u8[21] << 16) | (u8[22] << 8) | u8[23], ext: "png" };
  for (let i = 2; i < u8.length - 9;) { if (u8[i] !== 0xFF) { i++; continue; } const m = u8[i + 1], len = (u8[i + 2] << 8) | u8[i + 3]; if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: (u8[i + 5] << 8) | u8[i + 6], w: (u8[i + 7] << 8) | u8[i + 8], ext: "jpeg" }; i += 2 + len; }
  return { w: 4, h: 3, ext: "jpeg" };
}
const canvasPng = c => new Promise(res => c.toBlob(b => b.arrayBuffer().then(a => res(new Uint8Array(a))), "image/png"));
async function progressPng(work, time) {
  const c = document.createElement("canvas"); c.width = 1200; c.height = 170; const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.font = "bold 30px Arial, sans-serif"; g.textBaseline = "middle";
  const bar = (y, pct, col, label) => { g.fillStyle = "#E8ECEF"; g.fillRect(260, y, 900, 46); g.fillStyle = col; g.fillRect(260, y, 900 * Math.max(0, Math.min(100, pct || 0)) / 100, 46); g.fillStyle = "#1F2933"; g.textAlign = "right"; g.fillText(label, 245, y + 24); g.textAlign = "left"; g.fillStyle = (pct || 0) > 12 ? "#fff" : "#1F2933"; g.fillText((pct == null ? "—" : Math.round(pct) + "%"), (pct || 0) > 12 ? 275 : 270 + 900 * (pct || 0) / 100, y + 24); };
  bar(20, work, work + 10 < (time ?? 0) ? "#C62828" : "#2E7D32", "Work done"); bar(100, time, "#1565C0", "Time used");
  return canvasPng(c);
}
async function qrPng(text) {
  const q = LIB().qrcode(0, "M"); q.addData(text); q.make(); const n = q.getModuleCount(), s = 8, pad = 4, c = document.createElement("canvas"); c.width = c.height = (n + pad * 2) * s; const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#000"; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) q.isDark(r, k) && g.fillRect((k + pad) * s, (r + pad) * s, s, s);
  return canvasPng(c);
}
function drawingXml(rid, id, cx, cy, name) {
  return `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${name}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
}
async function decorateDocx(u8, data) {
  const zip = new (LIB().PizZip)(u8), parts = docxParts(zip).filter(n => /⟦(IMG|PHOTOS|FIELD|STAMP):/.test(zip.file(n).asText()));
  if (!parts.length) return u8;
  let seq = 900; const P = data.__proj || {};
  const ct = () => zip.file("[Content_Types].xml").asText(), addType = ext => { const x = ct(); if (!new RegExp(`Extension="${ext}"`, "i").test(x)) zip.file("[Content_Types].xml", x.replace("<Types ", "<Types ").replace(/(<Types[^>]*>)/, `$1<Default Extension="${ext}" ContentType="image/${ext === "jpg" ? "jpeg" : ext}"/>`)); };
  const cache = {};
  const imageFor = async key => {
    if (cache[key]) return cache[key];
    let bytes = null;
    if (key === "progress_bar") bytes = await progressPng(P.progress, P.time);
    else if (key === "qr") bytes = await qrPng(`${location.origin}${location.pathname}#/project/${P.id}/files`);
    return (cache[key] = bytes);
  };
  for (const n of parts) {
    let x = zip.file(n).asText();
    const relPath = n.replace(/^word\//, "word/_rels/") + ".rels";
    let rels = zip.file(relPath) ? zip.file(relPath).asText() : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
    const addRel = (bytes, ext) => { seq++; const rid = "rIdPcc" + seq, file = `pcc${seq}.${ext}`; zip.file("word/media/" + file, bytes); addType(ext); rels = rels.replace("</Relationships>", `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${file}"/></Relationships>`); return rid; };
    // namespaces used by pictures
    x = x.replace(/<(w:document|w:hdr|w:ftr)\b([^>]*)>/, (m, tag, at) => `<${tag}${at}${/xmlns:wp=/.test(at) ? "" : ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'}${/xmlns:r=/.test(at) ? "" : ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'}>`);
    // 1. photo grids: the whole paragraph holding ⟦PHOTOS:key⟧ becomes a 2-column table of pictures
    const photoParas = [...x.matchAll(/<w:p[ >](?:(?!<\/w:p>)[\s\S])*?⟦PHOTOS:(\w+)⟧(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/g)];
    for (const m of photoParas.reverse()) {
      const list = (m[1] === "report" ? data.__reportPhotos : (data.__photos || {})[m[1]]) || [];
      let tbl = "";
      if (list.length) {
        const cells = [];
        for (const ph of list.slice(0, 8)) { try { const b = await fget(ph.fileId), sz = imgSize(b), cx = Math.round(7.6 * EMU), cy = Math.round(cx * sz.h / sz.w), rid = addRel(b, sz.ext === "png" ? "png" : "jpeg"); seq++; cells.push(`<w:tc><w:tcPr><w:tcW w:w="4800" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>${drawingXml(rid, seq, cx, cy, "Photo " + seq)}</w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">${xmlEsc(ph.caption || "")}</w:t></w:r></w:p></w:tc>`); } catch (e) { console.warn(e); } }
        const rowsX = []; for (let i = 0; i < cells.length; i += 2) rowsX.push(`<w:tr>${cells[i]}${cells[i + 1] || '<w:tc><w:tcPr><w:tcW w:w="4800" w:type="dxa"/></w:tcPr><w:p/></w:tc>'}</w:tr>`);
        const B = '<w:top w:val="single" w:sz="4" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/>';
        tbl = rowsX.length ? `<w:tbl><w:tblPr><w:jc w:val="center"/><w:tblW w:w="9600" w:type="dxa"/><w:tblBorders>${B}</w:tblBorders><w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4800"/><w:gridCol w:w="4800"/></w:tblGrid>${rowsX.join("")}</w:tbl>` : "";
      }
      x = x.slice(0, m.index) + tbl + "<w:p/>" + x.slice(m.index + m[0].length);
    }
    // 2. run-level markers
    const runs = [...x.matchAll(/<w:r(\s[^>]*)?>((?:(?!<\/w:r>)[\s\S])*?)<\/w:r>/g)].filter(m => /⟦(IMG|FIELD|STAMP):/.test(m[2]));
    for (const m of runs.reverse()) {
      const at = m[1] || "", body = m[2], rPr = (/<w:rPr>[\s\S]*?<\/w:rPr>/.exec(body) || [""])[0], text = decodeEnt((body.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, "")).join(""));
      const plain = s => (s ? `<w:r${at}>${rPr}<w:t xml:space="preserve">${xmlEsc(s)}</w:t></w:r>` : "");
      let out = "";
      for (const piece of text.split(/(⟦(?:IMG|FIELD|STAMP):[^⟧]*⟧)/)) {
        const mm = /^⟦(IMG|FIELD|STAMP):([^⟧]*)⟧$/.exec(piece);
        if (!mm) { out += plain(piece); continue; }
        if (mm[1] === "FIELD") { const f = mm[2] === "NUMPAGES" ? "NUMPAGES" : "PAGE"; out += `<w:r${at}>${rPr}<w:fldChar w:fldCharType="begin"/></w:r><w:r${at}>${rPr}<w:instrText xml:space="preserve"> ${f} </w:instrText></w:r><w:r${at}>${rPr}<w:fldChar w:fldCharType="separate"/></w:r><w:r${at}>${rPr}<w:t>1</w:t></w:r><w:r${at}>${rPr}<w:fldChar w:fldCharType="end"/></w:r>`; continue; }
        if (mm[1] === "STAMP") { const [col, ...tx] = mm[2].split(":"), r2 = (rPr || "<w:rPr></w:rPr>").replace(/<w:color [^>]*\/>|<w:shd [^>]*\/>|<w:b\/>|<w:bCs\/>/g, "").replace("<w:rPr>", `<w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:shd w:val="clear" w:color="auto" w:fill="${/^[0-9A-F]{6}$/i.test(col) ? col : "1565C0"}"/>`); out += `<w:r${at}>${r2}<w:t xml:space="preserve"> ${xmlEsc(tx.join(":"))} </w:t></w:r>`; continue; }
        const bytes = await imageFor(mm[2]); if (!bytes) continue;
        const sz = imgSize(bytes), cx = mm[2] === "qr" ? Math.round(2.6 * EMU) : Math.round(12 * EMU), cy = Math.round(cx * sz.h / sz.w), rid = addRel(bytes, "png"); seq++;
        out += `<w:r${at}>${rPr}${drawingXml(rid, seq, cx, cy, mm[2] + " " + seq)}</w:r>`;
      }
      x = x.slice(0, m.index) + out + x.slice(m.index + m[0].length);
    }
    zip.file(n, x); zip.file(relPath, rels);
  }
  return zip.generate({ type: "uint8array", compression: "DEFLATE" });
}
