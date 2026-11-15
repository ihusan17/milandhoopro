// Documents written in the portal. A document is a list of simple blocks (paragraphs, label–value rows,
// tables, signatures…) typed in the browser, with fields picked from a list. Saving builds a real Word
// file with {placeholders} from the blocks and stores it as the template's next version, so packs,
// document sets, previews and versions work exactly as for uploaded Word templates.

const DOC_BLOCKS = [["p", "Paragraph"], ["kv", "Label – value rows"], ["table", "Table"], ["sign", "Signatures"], ["gap", "Space"], ["pb", "Page break"]];
const DOC_LOOPS = [["", "Fixed rows (typed here)"], ["bid_members", "Bid Committee members (all)"], ["bid_present", "Bid Committee members present"], ["eval_members", "Evaluation Committee members"], ["eval_present", "Evaluation Committee members present"],
  ["bidders", "Bids, by rank"], ["bidders_received", "Bids, in the order received"], ["responsive_bidders", "Responsive bids"], ["rejected_bidders", "Rejected bids"], ["projects", "Projects at the meeting"], ["criteria", "Evaluation criteria"]];
// Fields of one row inside a repeating table.
const LOOP_FIELDS = {
  member: [["no", "Row number"], ["member_name_dv", "Name (with title)"], ["member_short_dv", "Name (without title)"], ["member_designation_dv", "Designation"], ["member_office_dv", "Office"], ["member_role_dv", "Role in the committee"], ["present", "✓ when present"], ["leave_text", "Leave reason"]],
  bid: [["no", "Row number"], ["rank", "Rank"], ["bidder_name", "Bidder"], ["bid_amount", "Bid amount"], ["duration_offered", "Days offered"], ["experience", "Experience (documents)"], ["total_score", "Total points"], ["responsive", "Responsive (Yes/No)"], ["remarks", "Remarks"], ["dq_text_dv", "Disqualified (Dhivehi, empty if not)"]],
  projects: [["no", "Row number"], ["ref_no", "Project number"], ["project_name_dv", "Project name"], ["item_type_dv", "Agenda item (Dhivehi)"], ["award_bidder", "Winning bidder"], ["award_amount", "Award amount"], ["award_duration", "Duration"]],
  criteria: [["no", "Row number"], ["label_dv", "Criterion (Dhivehi)"], ["label", "Criterion"], ["weight", "Weight %"], ["per", "Marks per document"]]
};
const loopKind = l => /members|present/.test(l) ? "member" : /bidders/.test(l) ? "bid" : l === "projects" ? "projects" : l === "criteria" ? "criteria" : "";
const docNewBlock = k => ({ k, ...(k === "p" ? { text: "", align: "right", sz: 12, after: 6 } : k === "kv" ? { rows: [["", ""]], border: false } : k === "table" ? { cols: [{ h: "#", w: 1, g: "", c: "{no}" }, { h: "", w: 5, g: "", c: "" }], loop: "", rows: [["", ""]] } : k === "sign" ? { items: [{ text: "ސޮއި: .....................\n{office_head_name}\n{office_head_title_dv}" }] } : k === "gap" ? { h: 12 } : {}) });

// ---------- Word (.docx) builder ----------
const xe = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const esc = s => xe(s).replace(/"/g, "&quot;");
const JC = { right: "left", left: "right", center: "center", justify: "both" }; // right-to-left paragraphs: "left" is the start (right) side
function docRuns(text, o2 = {}) {
  const parts = String(text).split(/(\{[^{}]+\})/).filter(s => s !== "");
  const rpr = rtl => `<w:rPr><w:rFonts w:ascii="Faruma" w:hAnsi="Faruma" w:cs="Faruma"/>${o2.b ? "<w:b/><w:bCs/>" : ""}${o2.u ? '<w:u w:val="single"/>' : ""}<w:sz w:val="${(o2.sz || 12) * 2}"/><w:szCs w:val="${(o2.sz || 12) * 2}"/>${rtl ? "<w:rtl/>" : ""}<w:lang w:bidi="dv-MV"/></w:rPr>`;
  const run = (t, rtl) => `<w:r>${rpr(rtl)}<w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
  return parts.map(s => /^\{[^{}]+\}$/.test(s) ? run(s, false) : (s.match(/[A-Za-z][A-Za-z0-9()\-\/.]*|[^A-Za-z]+/g) || []).map(t => run(t, !/[A-Za-z]/.test(t))).join("")).join("");
}
const docPara = (text, o2 = {}) => `<w:p><w:pPr><w:bidi/><w:spacing w:before="${(o2.before || 0) * 20}" w:after="${(o2.after ?? 0) * 20}" w:line="${o2.line || 276}" w:lineRule="auto"/><w:jc w:val="${JC[o2.align || "right"]}"/></w:pPr>${docRuns(text, o2)}</w:p>`;
const docLines = (text, o2) => String(text || "").split("\n").map(l => docPara(l, o2)).join("");
const TBW = 9638; // text width of an A4 page with 2 cm margins, in twentieths of a point
function dxTable(cols, rows, o2 = {}) {
  const tot = cols.reduce((a, c) => a + (Number(c.w) || 1), 0), W = cols.map(c => Math.round(TBW * (Number(c.w) || 1) / tot));
  const bd = o2.border === false ? "nil" : "single";
  const borders = `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(s => `<w:${s} w:val="${bd}" w:sz="4" w:space="0" w:color="000000"/>`).join("")}</w:tblBorders>`;
  const cell = (inner, w, x = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${x.span > 1 ? `<w:gridSpan w:val="${x.span}"/>` : ""}${x.vm ? `<w:vMerge${x.vm === "r" ? ' w:val="restart"' : ""}/>` : ""}${x.shd ? '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>' : ""}<w:vAlign w:val="center"/></w:tcPr>${inner || docPara("")}</w:tc>`;
  const out = [`<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="${TBW}" w:type="dxa"/><w:jc w:val="center"/>${borders}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${W.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`];
  const ps = { align: "center", sz: o2.sz || 11, after: 0 };
  if (o2.head) {
    const grouped = cols.some(c => (c.g || "").trim());
    if (grouped) { // group row: consecutive columns with the same group text share one cell; others span both header rows
      const r1 = []; for (let i = 0; i < cols.length;) { const g = (cols[i].g || "").trim(); let j = i + 1; while (g && j < cols.length && (cols[j].g || "").trim() === g) j++;
        r1.push(g ? cell(docPara(g, { ...ps, b: true }), W.slice(i, j).reduce((a, b) => a + b, 0), { span: j - i, shd: true }) : cell(docPara(cols[i].h, { ...ps, b: true }), W[i], { vm: "r", shd: true })); i = j; }
      out.push(`<w:tr><w:trPr><w:tblHeader/></w:trPr>${r1.join("")}</w:tr>`);
      out.push(`<w:tr><w:trPr><w:tblHeader/></w:trPr>${cols.map((c, i) => (c.g || "").trim() ? cell(docPara(c.h, { ...ps, b: true }), W[i], { shd: true }) : cell("", W[i], { vm: "c", shd: true })).join("")}</w:tr>`);
    } else out.push(`<w:tr><w:trPr><w:tblHeader/></w:trPr>${cols.map((c, i) => cell(docPara(c.h, { ...ps, b: true }), W[i], { shd: true })).join("")}</w:tr>`);
  }
  rows.forEach(r => out.push(`<w:tr><w:trPr><w:trHeight w:val="${o2.rowH || 420}"/></w:trPr>${r.map((t, i) => cell(docLines(t, { ...ps, align: (o2.aligns || [])[i] || ps.align, b: (o2.bold || [])[i] }), W[i])).join("")}</w:tr>`));
  out.push("</w:tbl>", docPara("", { after: 0 }));
  return out.join("");
}
function docBody(blocks) {
  return blocks.map(b => {
    if (b.k === "p") return docLines(b.text, { align: b.align, b: b.b, u: b.u, sz: b.sz || 12, after: b.after ?? 6 });
    if (b.k === "gap") return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${Math.max(1, b.h || 12) * 20}" w:lineRule="exact"/></w:pPr></w:p>`;
    if (b.k === "pb") return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    if (b.k === "kv") return dxTable([{ w: 2 }, { w: 3 }], (b.rows || []).map(r => [r[0], r[1]]), { border: !!b.border, aligns: ["right", "right"], bold: [true, false], sz: b.sz || 12, rowH: 360 });
    if (b.k === "sign") { const it = b.items || []; return it.length ? dxTable(it.map(() => ({ w: 1 })), [it.map(x => x.text || "")], { border: false, sz: b.sz || 12, rowH: 360 }) : ""; }
    if (b.k === "table") {
      const cols = b.cols || [];
      const rows = b.loop ? [cols.map((c, i) => (i === 0 ? `{#${b.loop}}` : "") + (c.c || "") + (i === cols.length - 1 ? `{/${b.loop}}` : ""))] : (b.rows || []).map(r => cols.map((c, i) => r[i] || ""));
      return dxTable(cols, rows, { head: b.head !== false, sz: b.sz || 11 });
    }
    return "";
  }).join("");
}
const b64u8 = b => Uint8Array.from(atob(b), c => c.charCodeAt(0));
// Builds the .docx: letterhead in the page header, optional footer with page numbers.
async function docBuild(t) {
  const { PizZip } = LIB(), z = new PizZip(), D = t.doc || {}, f = OFF();
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  let img = null; if (D.letterhead !== false) { try { img = f.letterhead ? await fget(f.letterhead) : null; } catch { img = null; } }
  const emblem = b64u8(EMBLEM_PNG), pic = img || emblem, sz = imgSize(pic), ext = sz.ext === "png" ? "png" : "jpeg";
  const wEmu = img ? 6120000 : 560000, hEmu = Math.round(wEmu * sz.h / Math.max(1, sz.w));
  const center = inner => `<w:p><w:pPr><w:bidi/><w:spacing w:after="0"/><w:jc w:val="center"/></w:pPr>${inner}</w:p>`;
  const header = D.letterhead === false ? "" : img ? center(`<w:r>${drawingXml("rIdImg", 1, wEmu, hEmu, "Letterhead")}</w:r>`)
    : center(`<w:r>${drawingXml("rIdImg", 1, wEmu, hEmu, "Emblem")}</w:r>`) + docPara(f.nameDv, { align: "center", b: true, sz: 13 }) + docPara(f.islandDv + "، " + f.countryDv, { align: "center", sz: 11, after: 8 });
  const pageNo = D.pageNo ? `<w:p><w:pPr><w:bidi/><w:jc w:val="center"/></w:pPr>${docRuns("ސަފުހާ ", { sz: 10 })}<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>${docRuns(" - ", { sz: 10 })}<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p>` : "";
  const footer = (D.footer !== false && (f.footerDv || [f.phone, f.email, f.web].some(Boolean)) ? docPara([f.footerDv, f.phone, f.email, f.web].filter(Boolean).join("   ·   "), { align: "center", sz: 9 }) : "") + pageNo;
  const hasH = !!header, hasF = !!footer;
  z.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>${hasH ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ""}${hasF ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ""}</Types>`);
  z.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${hasH ? '<Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' : ""}${hasF ? '<Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : ""}</Relationships>`);
  z.file("word/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Faruma" w:hAnsi="Faruma" w:eastAsia="Faruma" w:cs="Faruma"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:bidi="dv-MV"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:bidi/><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>');
  z.file("word/settings.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>');
  if (hasH) { z.file("word/header1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${header}</w:hdr>`); z.file("word/_rels/header1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/head.${ext}"/></Relationships>`); z.file(`word/media/head.${ext}`, pic); }
  if (hasF) z.file("word/footer1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}>${footer}</w:ftr>`);
  const sect = `<w:sectPr>${hasH ? '<w:headerReference w:type="default" r:id="rIdH"/>' : ""}${hasF ? '<w:footerReference w:type="default" r:id="rIdF"/>' : ""}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${hasH ? (img ? 2400 : 2600) : 1134}" w:right="1134" w:bottom="1134" w:left="1134" w:header="420" w:footer="420" w:gutter="0"/><w:bidi/></w:sectPr>`;
  z.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${docBody(t.blocks || [])}${sect}</w:body></w:document>`);
  return z.generate({ type: "uint8array", compression: "DEFLATE" });
}

// ---------- Preview (HTML, filled with a project's data; also used for printing / PDF) ----------
function docHtml(t, data) {
  const f = OFF(), ltr = h => h.replace(/[A-Za-z0-9(\[][A-Za-z0-9()\[\]\-\/.:]*[A-Za-z0-9)\]]/g, m => /[A-Za-z\/]/.test(m) ? `<bdi dir="ltr">${m}</bdi>` : m);
  const fill = (s, scope) => ltr(esc(render(String(s || ""), scope || {}, data))).replace(/\n/g, "<br>");
  const P = (text, b, scope) => String(text || "").split("\n").map(l => `<p style="text-align:${b.align || "right"};font-size:${b.sz || 12}pt;margin:0 0 ${b.after ?? 6}pt;${b.b ? "font-weight:700;" : ""}${b.u ? "text-decoration:underline;" : ""}">${fill(l, scope) || "&nbsp;"}</p>`).join("");
  const tbl = (cols, rows, o2 = {}) => { const tot = cols.reduce((a, c) => a + (Number(c.w) || 1), 0);
    return `<table class="dx${o2.border === false ? " nb" : ""}" style="font-size:${o2.sz || 11}pt"><colgroup>${cols.map(c => `<col style="width:${(100 * (Number(c.w) || 1) / tot).toFixed(1)}%">`).join("")}</colgroup>${o2.head ? docHead(cols) : ""}${rows.map(r => `<tr>${r.map((x, i) => `<td style="text-align:${(o2.aligns || [])[i] || "center"};${(o2.bold || [])[i] ? "font-weight:700" : ""}">${x}</td>`).join("")}</tr>`).join("")}</table>`; };
  const docHead = cols => { const grouped = cols.some(c => (c.g || "").trim());
    if (!grouped) return `<tr>${cols.map(c => `<th>${esc(c.h)}</th>`).join("")}</tr>`;
    let r1 = ""; for (let i = 0; i < cols.length;) { const g = (cols[i].g || "").trim(); let j = i + 1; while (g && j < cols.length && (cols[j].g || "").trim() === g) j++; r1 += g ? `<th colspan="${j - i}">${esc(g)}</th>` : `<th rowspan="2">${esc(cols[i].h)}</th>`; i = j; }
    return `<tr>${r1}</tr><tr>${cols.filter(c => (c.g || "").trim()).map(c => `<th>${esc(c.h)}</th>`).join("")}</tr>`; };
  const body = (t.blocks || []).map(b => {
    if (b.k === "p") return P(b.text, b);
    if (b.k === "gap") return `<div style="height:${b.h || 12}pt"></div>`;
    if (b.k === "pb") return '<div class="dx-pb"></div>';
    if (b.k === "kv") return tbl([{ w: 2 }, { w: 3 }], (b.rows || []).map(r => [fill(r[0]), fill(r[1])]), { border: !!b.border, aligns: ["right", "right"], bold: [true, false], sz: b.sz || 12 });
    if (b.k === "sign") return tbl((b.items || []).map(() => ({ w: 1 })), [(b.items || []).map(x => fill(x.text))], { border: false, sz: b.sz || 12 });
    if (b.k === "table") { const cols = b.cols || [], L = b.loop ? (Array.isArray(data[b.loop]) ? data[b.loop] : []) : null;
      const rows = L ? L.map(sc => cols.map(c => fill(c.c, sc))) : (b.rows || []).map(r => cols.map((c, i) => fill(r[i])));
      return tbl(cols, rows, { head: b.head !== false, sz: b.sz || 11 }); }
    return "";
  }).join("");
  const D = t.doc || {}, head = D.letterhead === false ? "" : f.letterhead ? `<div class="dx-lh" data-lh="1"></div>` : `<div class="dx-lh"><img src="data:image/png;base64,${EMBLEM_PNG}" style="height:46px"><div style="font-weight:700;font-size:13pt">${esc(f.nameDv)}</div><div style="font-size:11pt">${esc(f.islandDv)}، ${esc(f.countryDv)}</div></div>`;
  return `<div class="dx-page" dir="rtl" lang="dv">${head}${body}</div>`;
}
const DX_CSS = `.dx-page{font-family:Faruma,'MV Faseyha',serif;background:#fff;color:#000;width:210mm;min-height:297mm;box-sizing:border-box;padding:16mm 20mm 20mm;margin:0 auto;line-height:1.6}
.dx-page p{margin:0}.dx-lh{text-align:center;margin-bottom:10pt}.dx-lh img{max-width:100%}.dx-page table.dx{width:100%;border-collapse:collapse;margin:0 0 8pt;table-layout:fixed}
.dx-page table.dx td,.dx-page table.dx th{border:1px solid #000;padding:3pt 4pt;vertical-align:middle}.dx-page table.dx th{background:#f2f2f2}.dx-page table.dx.nb td{border:0;text-align:right!important;vertical-align:top}
.dx-pb{border-top:1px dashed #94a3b8;margin:12pt 0}.dx-page bdi{white-space:nowrap;unicode-bidi:isolate}@media print{.dx-pb{border:0;break-after:page}}`;
async function docLetterheadSrc() { const f = OFF(); if (!f.letterhead) return ""; try { return URL.createObjectURL(new Blob([await fget(f.letterhead)])); } catch { return ""; } }
async function docFillLetterhead(host) { const el = host.querySelector(".dx-lh[data-lh]"); if (!el) return; const src = await docLetterheadSrc(); el.replaceChildren(src ? o("img", { src }) : ""); }
// Print view: the browser's print dialog saves it as PDF.
async function docPrint(t, data, title) {
  const w = window.open("", "_blank"); if (!w) return xt("Allow pop-ups to print or save as PDF", "err");
  const src = await docLetterheadSrc();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || t.code)}</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thaana&display=swap" rel="stylesheet"><style>@page{size:A4;margin:0}body{margin:0;background:#fff}${DX_CSS}</style></head><body>${docHtml(t, data).replace('<div class="dx-lh" data-lh="1"></div>', src ? `<div class="dx-lh"><img src="${src}"></div>` : "")}<script>setTimeout(function(){print()},600)<\/script></body></html>`);
  w.document.close();
}

// ---------- Saving: build the Word file and store it as the next version ----------
async function docSave(t, isNew) {
  const u8 = await docBuild(t), name = `${t.code}.docx`, fileId = await fput(u8, { name, mime: MIME.docx }), r = scanDocx(u8, []);
  save(() => {
    need("templates");
    if (isNew) { Z().removedTemplates = (Z().removedTemplates || []).filter(c => c !== t.code); TPL().push(t); }
    const v = (t.version || 0) + 1;
    (t.versions = t.versions || []).push({ v, fileId, name, size: u8.length, at: Vt(), by: me(), tags: r.tags, sheets: r.sheets, blocks: JSON.parse(JSON.stringify(t.blocks || [])) });
    t.version = v; t.demo = false;
  }, isNew ? `${t.code} created` : `${t.code} saved as version ${(t.version || 0) + 1}`);
}

// ---------- Editor ----------
function docNew() {
  const t = { id: uid(), code: "", nameEn: "", nameDv: "", group: "Letters", type: "docx", perMember: "", inPack: false, order: 0, active: true, version: 0, versions: [], mapping: {}, custom: {}, cellMap: [], portal: true, doc: { letterhead: true, pageNo: false }, blocks: [docNewBlock("p")] };
  const starters = [["", "Blank document"], ...DOC_STARTERS.map(s => [s[0], s[1]])];
  const sel = S(starters, "");
  form("New document written in the portal", [["Start from", sel], o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, "A starter fills in the blocks of a council document; change any wording afterwards. The document is saved as a Word template, so packs and document sets use it like any other.")]).then(ok => {
    if (!ok) return; const st = DOC_STARTERS.find(s => s[0] === sel.value); if (st) Object.assign(t, st[2]()); docEdit(t, true);
  });
}
function docEdit(t0, isNew) {
  const t = JSON.parse(JSON.stringify(t0)); t.blocks = t.blocks || []; t.doc = t.doc || {};
  const pr = PRJ().find(x => (x.bidders || []).length && x.vendor) || PRJ().find(x => x.status !== "Planned") || PRJ()[0] || blankProject();
  const mt = MEETS().filter(m => (m.projectIds || []).includes(pr.id)).slice(-1)[0];
  const sample = () => (mt ? meetingData(mt, pr) : dataFor(pr));
  const ov = o("div", { class: "pcc-dx" }), list = o("div", { class: "pcc-dx-blocks" }), prev = o("div", { class: "pcc-dx-prev" }), warn = o("div", { class: "pcc-dx-warn" });
  const code = I(t.code, { placeholder: "e.g. BC-INV-P" }), en = I(t.nameEn, { placeholder: "Name (English)" }), dv = DVI(t.nameDv, { placeholder: "Name (Dhivehi)" }), grp = S(TGROUPS, t.group);
  const lh = o("input", { type: "checkbox", checked: t.doc.letterhead !== false }), pn = o("input", { type: "checkbox", checked: !!t.doc.pageNo });
  const known = () => { const d = sample(); return k => knownTag(k, d) || progField(k); };
  let timer = 0; const redraw = () => { clearTimeout(timer); timer = setTimeout(draw, 180); };
  function draw() {
    const d = sample();
    prev.innerHTML = docHtml(t, d); docFillLetterhead(prev);
    // Fields that the program does not know (typing mistakes) are listed.
    const isK = known(), bad = new Set();
    const scan = (s, loopK) => (String(s || "").match(/\{([^{}#/]+)\}/g) || []).forEach(m => { const k = m.slice(1, -1).trim(); if (!(isK(k) || (loopK && (LOOP_FIELDS[loopK] || []).some(f => f[0] === k)) || (loopK && Object.prototype.hasOwnProperty.call(((d[t.blocks.find(b => b.loop && loopKind(b.loop) === loopK)?.loop] || [])[0]) || {}, k)))) bad.add(k); });
    t.blocks.forEach(b => { if (b.k === "p") scan(b.text); if (b.k === "kv") (b.rows || []).forEach(r => { scan(r[0]); scan(r[1]); }); if (b.k === "sign") (b.items || []).forEach(x => scan(x.text)); if (b.k === "table") { (b.cols || []).forEach(c => scan(c.c, loopKind(b.loop))); (b.rows || []).forEach(r => r.forEach(x => scan(x))); } });
    warn.replaceChildren(...(bad.size ? [o("b", {}, "Unknown fields: "), [...bad].map(k => "{" + k + "}").join(", "), " — pick fields with Insert field."] : []));
    warn.style.display = bad.size ? "" : "none";
  }
  // Insert-field picker for a text box (general fields, plus the row fields of a repeating table).
  function fieldBtn(el, loop) {
    return o("button", { type: "button", class: "pcc-dx-fb", title: "Insert a field", onclick: async () => {
      const q = o("input", { type: "search", placeholder: "Search fields (English or Dhivehi)" }), box = o("div", { class: "pcc-dx-fl" }), d = sample();
      const groups = [...(loop ? [["Row fields (" + (DOC_LOOPS.find(x => x[0] === loop) || [0, loop])[1] + ")", LOOP_FIELDS[loopKind(loop)] || []]] : []), ...FIELDS.map(g => [g[0], g[1].filter(f => !f[0].startsWith("{"))])];
      let done = null;
      const pick = k => { const s = el.selectionStart ?? el.value.length, e2 = el.selectionEnd ?? s; el.value = el.value.slice(0, s) + "{" + k + "}" + el.value.slice(e2); el.dispatchEvent(new Event("input")); el.focus(); el.selectionStart = el.selectionEnd = s + k.length + 2; done && done(); };
      const drawL = () => { const s = q.value.trim().toLowerCase(); box.replaceChildren(...groups.map(([g, L]) => { const L2 = L.filter(f => !s || (f[0] + " " + f[1]).toLowerCase().includes(s)); return L2.length ? o("div", {}, o("div", { class: "pcc-dx-fg" }, g), ...L2.map(f => o("button", { type: "button", class: "pcc-dx-fi", onclick: () => pick(f[0]) }, o("code", {}, "{" + f[0] + "}"), o("span", {}, f[1]), d[f[0]] != null && typeof d[f[0]] !== "object" && String(d[f[0]]).trim() ? o("small", { dir: "auto" }, String(d[f[0]]).slice(0, 40)) : null))) : null; })); };
      q.oninput = drawL; drawL();
      const pr2 = Mt("Insert field", [q, box], [{ label: "Close", value: !0 }]);
      done = () => { const m = [...document.querySelectorAll(".modal")].pop(), b = m && [...m.querySelectorAll("button")].find(x => /^Close$/.test(x.textContent.trim())); b && b.click(); };
      setTimeout(() => q.focus(), 50); await pr2;
    } }, "{ } Insert field");
  }
  const TA = (v, on, a = {}) => { const el = thaanaInput(o("textarea", { rows: a.rows || 2, dir: "auto", lang: "dv", ...a })); el.value = v || ""; el.oninput = () => { on(el.value); redraw(); }; return el; };
  const IN = (v, on, a = {}) => { const el = o("input", { type: "text", dir: "auto", ...a }); el.value = v ?? ""; el.oninput = () => { on(el.value); redraw(); }; return el; };
  const SEL = (opts, v, on) => { const el = S(opts, v); el.onchange = () => { on(el.value); drawBlocks(); draw(); }; return el; };
  function blockUI(b, i) {
    const tools = o("div", { class: "pcc-dx-bt" }, o("b", {}, (DOC_BLOCKS.find(x => x[0] === b.k) || [0, b.k])[1]),
      o("span", { class: "grow" }), btn("↑", () => { if (i) { [t.blocks[i - 1], t.blocks[i]] = [t.blocks[i], t.blocks[i - 1]]; drawBlocks(); draw(); } }, "small"), btn("↓", () => { if (i < t.blocks.length - 1) { [t.blocks[i + 1], t.blocks[i]] = [t.blocks[i], t.blocks[i + 1]]; drawBlocks(); draw(); } }, "small"),
      btn("Copy", () => { t.blocks.splice(i + 1, 0, JSON.parse(JSON.stringify(b))); drawBlocks(); draw(); }, "small"), btn("✕", () => { t.blocks.splice(i, 1); drawBlocks(); draw(); }, "small danger"));
    const body = o("div", { class: "pcc-dx-bb" });
    if (b.k === "p") {
      const ta = TA(b.text, v => { b.text = v; }, { rows: Math.min(8, Math.max(2, String(b.text || "").split("\n").length + 1)) });
      body.append(ta, o("div", { class: "pcc-dx-row" }, fieldBtn(ta), SEL([["right", "Right"], ["center", "Centre"], ["left", "Left"], ["justify", "Justify"]], b.align || "right", v => { b.align = v; }),
        o("label", { class: "pcc-chk" }, o("input", { type: "checkbox", checked: !!b.b, onchange: e => { b.b = e.target.checked; draw(); } }), " Bold"), o("label", { class: "pcc-chk" }, o("input", { type: "checkbox", checked: !!b.u, onchange: e => { b.u = e.target.checked; draw(); } }), " Underline"),
        o("label", { class: "pcc-dx-n" }, "Size ", IN(b.sz || 12, v => { b.sz = Number(v) || 12; }, { type: "number", min: 8, max: 28 })), o("label", { class: "pcc-dx-n" }, "Space after ", IN(b.after ?? 6, v => { b.after = Number(v) || 0; }, { type: "number", min: 0, max: 60 }))));
    } else if (b.k === "kv") {
      b.rows.forEach((r, j) => { const a = IN(r[0], v => { r[0] = v; }, { placeholder: "Label", dir: "rtl", lang: "dv" }), c = IN(r[1], v => { r[1] = v; }, { placeholder: "Value — usually a field" }); thaanaInput(a); thaanaInput(c);
        body.append(o("div", { class: "pcc-dx-kv" }, a, c, fieldBtn(c), btn("✕", () => { b.rows.splice(j, 1); drawBlocks(); draw(); }, "small"))); });
      body.append(o("div", { class: "pcc-dx-row" }, btn("+ Row", () => { b.rows.push(["", ""]); drawBlocks(); draw(); }, "small"), o("label", { class: "pcc-chk" }, o("input", { type: "checkbox", checked: !!b.border, onchange: e => { b.border = e.target.checked; draw(); } }), " Borders")));
    } else if (b.k === "sign") {
      b.items.forEach((x, j) => { const ta = TA(x.text, v => { x.text = v; }, { rows: 4 }); body.append(o("div", { class: "pcc-dx-kv" }, ta, fieldBtn(ta), btn("✕", () => { b.items.splice(j, 1); drawBlocks(); draw(); }, "small"))); });
      body.append(o("div", { class: "pcc-dx-row" }, btn("+ Signature (side by side)", () => { b.items.push({ text: "ސޮއި: .....................\nނަން: \nމަޤާމް: " }); drawBlocks(); draw(); }, "small")));
    } else if (b.k === "gap") body.append(o("label", { class: "pcc-dx-n" }, "Height (pt) ", IN(b.h || 12, v => { b.h = Number(v) || 12; }, { type: "number", min: 2, max: 200 })));
    else if (b.k === "pb") body.append(o("p", { class: "muted small" }, "The next block starts on a new page."));
    else if (b.k === "table") {
      body.append(o("div", { class: "pcc-dx-row" }, o("label", {}, "Rows: "), SEL(DOC_LOOPS, b.loop || "", v => { b.loop = v; }), o("label", { class: "pcc-chk" }, o("input", { type: "checkbox", checked: b.head !== false, onchange: e => { b.head = e.target.checked; draw(); } }), " Header row")));
      const g = o("div", { class: "pcc-dx-cols" });
      b.cols.forEach((c, j) => {
        const h = IN(c.h, v => { c.h = v; }, { placeholder: "Heading", dir: "rtl", lang: "dv" }), gr = IN(c.g || "", v => { c.g = v; }, { placeholder: "Group heading (optional)", dir: "rtl", lang: "dv" }), w = IN(c.w || 1, v => { c.w = Number(v) || 1; }, { type: "number", min: 1, max: 20, title: "Width (relative)" });
        thaanaInput(h); thaanaInput(gr);
        const cc = b.loop ? IN(c.c || "", v => { c.c = v; }, { placeholder: "Cell — e.g. {member_name_dv}" }) : null;
        g.append(o("div", { class: "pcc-dx-col" }, o("div", { class: "pcc-dx-cn" }, String(j + 1)), gr, h, w, cc ? o("div", { class: "pcc-dx-kv" }, cc, fieldBtn(cc, b.loop)) : null,
          o("div", { class: "pcc-dx-row" }, btn("→", () => { if (j) { [b.cols[j - 1], b.cols[j]] = [b.cols[j], b.cols[j - 1]]; (b.rows || []).forEach(r => { [r[j - 1], r[j]] = [r[j], r[j - 1]]; }); drawBlocks(); draw(); } }, "small"), btn("✕", () => { b.cols.splice(j, 1); (b.rows || []).forEach(r => r.splice(j, 1)); drawBlocks(); draw(); }, "small"))));
      });
      body.append(o("div", { class: "muted small" }, "Columns, right to left. Columns with the same group heading share one heading cell above."), g, btn("+ Column", () => { b.cols.push({ h: "", w: 2, g: "", c: "" }); (b.rows || []).forEach(r => r.push("")); drawBlocks(); draw(); }, "small"));
      if (!b.loop) {
        b.rows = b.rows || [];
        b.rows.forEach((r, j) => body.append(o("div", { class: "pcc-dx-fr" }, ...b.cols.map((c, k) => { const el = IN(r[k] || "", v => { r[k] = v; }, { placeholder: c.h || "cell" }); thaanaInput(el); return el; }), btn("✕", () => { b.rows.splice(j, 1); drawBlocks(); draw(); }, "small"))));
        body.append(btn("+ Row", () => { b.rows.push(b.cols.map(() => "")); drawBlocks(); draw(); }, "small"));
      }
    }
    return o("div", { class: "pcc-dx-b" }, tools, body);
  }
  function drawBlocks() {
    list.replaceChildren(...t.blocks.map(blockUI), o("div", { class: "pcc-dx-add" }, o("span", { class: "muted small" }, "Add: "), ...DOC_BLOCKS.map(([k, l]) => btn("+ " + l, () => { t.blocks.push(docNewBlock(k)); drawBlocks(); draw(); list.scrollTop = list.scrollHeight; }, "small"))));
  }
  const close = () => { ov.remove(); document.body.classList.remove("pcc-noscroll"); };
  const saveB = btn(isNew ? "Create document" : "Save new version", async () => {
    try {
      t.code = code.value.trim(); t.nameEn = en.value.trim() || t.code; t.nameDv = dv.value.trim(); t.group = grp.value; t.doc = { ...t.doc, letterhead: lh.checked, pageNo: pn.checked };
      if (!t.code) throw err("Type a code for the document");
      if (TPL().some(x => x.code === t.code && x.id !== t.id)) throw err("Another template already has the code " + t.code);
      if (!t.blocks.length) throw err("Add at least one block");
      const keep = isNew ? t : Object.assign(TPL().find(x => x.id === t.id) || t0, { code: t.code, nameEn: t.nameEn, nameDv: t.nameDv, group: t.group, doc: t.doc, blocks: t.blocks, portal: true });
      await docSave(keep, isNew); close();
    } catch (e) { console.error(e); xt(e.message, "err"); }
  }, "primary");
  ov.append(o("div", { class: "pcc-dx-top" }, o("b", { class: "pcc-dx-title" }, isNew ? "New document" : "Edit " + t.code), code, en, dv, grp,
      o("label", { class: "pcc-chk" }, lh, " Letterhead"), o("label", { class: "pcc-chk" }, pn, " Page numbers"), kbToggle(), o("span", { class: "grow" }),
      btn("Print / PDF", () => docPrint(t, sample(), t.code)), btn("Cancel", close), saveB),
    o("div", { class: "pcc-dx-main" }, o("div", { class: "pcc-dx-left" }, warn, list), o("div", { class: "pcc-dx-right" }, o("div", { class: "muted small pcc-dx-ph" }, "Preview with ", o("b", {}, pr.ref || "a sample project"), mt ? ` · meeting ${mt.ref}` : "", " — fields are filled in"), prev)));
  [lh, pn].forEach(x => { x.onchange = () => { t.doc.letterhead = lh.checked; t.doc.pageNo = pn.checked; draw(); }; });
  document.body.append(ov); document.body.classList.add("pcc-noscroll");
  drawBlocks(); draw();
}

// ---------- Starters: council documents ready to adjust ----------
const DOC_STARTERS = [
  ["bc-inv", "Bid Committee invitation (one project, as Type 01)", () => ({ code: "BC-INV-P", nameEn: "Bid Committee invitation (written in the portal)", nameDv: "ބިޑް ކޮމިޓީ ޖަލްސާއަށް ދަޢުވަތު", group: "Bid Committee", doc: { letterhead: true, pageNo: false }, blocks: [
    { k: "p", text: "ނަމްބަރު: {bid_meeting_no}", align: "left", sz: 12, after: 12 },
    { k: "p", text: "ބިޑް ކޮމެޓީގެ މެންބަރުންނަށް.", align: "right", sz: 12, after: 6 },
    { k: "p", text: "ވެދުންސަލާމަށްފަހު ދަންނަވަމެވެ.", align: "right", sz: 12, after: 6 },
    { k: "p", text: "{project_name_dv} ކޮށްދޭނެ ފަރާތެއް ހޯދުމަށް ކުރެވުނު ނަންބަރު އިޢުލާން: {advertisement_no} ({advertised_date_dv_dmy}) (ބިޑުހުށަހެޅުމުގެ ދަޢުވަތު) އާއި ގުޅިގެން ހުށަހަޅާފައިވާ ބިޑްތައް އިވެލުއޭޓް ކޮށްދިނުމަށް، {bid_meeting_date_dv_ymd} ވަނަ ދުވަހު {bid_meeting_time} އަށް މިއިދާރާއަށް ޙާޟިރުވެދެއްވުން އެދެމެވެ.", align: "justify", sz: 12, after: 6 },
    { k: "p", text: "އިޙްތިރާމް ޤަބޫލުކުރެއްވުން އެދެމެވެ.", align: "right", sz: 12, after: 12 },
    { k: "p", text: "{invite_date_hijri}\n{invite_date_dv_dmy}", align: "right", sz: 12, after: 12 },
    { k: "p", text: "ޚާދިމްކުމް\n\n{office_head_name}\n{office_head_title_dv}", align: "left", sz: 12, after: 12 },
    { k: "table", loop: "bid_members", head: true, sz: 11, cols: [{ h: "#", w: 1, g: "", c: "{no}" }, { h: "ނަން", w: 6, g: "", c: "{member_name_dv}" }, { h: "މަޤާމް", w: 5, g: "", c: "{member_designation_dv}" }, { h: "ތާރީޚް", w: 3, g: "", c: "" },
      { h: "ސޮއި", w: 3, g: "ޖަލްސާއަށް ދެންނެވި", c: "" }, { h: "ގަޑި", w: 2, g: "ޖަލްސާއަށް ދެންނެވި", c: "" }, { h: "ސޮއި", w: 3, g: "ޖަލްސާއަށް ޙާޟިރުވި", c: "" }, { h: "ގަޑި", w: 2, g: "ޖަލްސާއަށް ޙާޟިރުވި", c: "" }] }
  ] })],
  ["letter", "Simple letter (number, addressee, body, signature)", () => ({ code: "LTR-P", nameEn: "Letter (written in the portal)", nameDv: "ސިޓީ", group: "Letters", doc: { letterhead: true, pageNo: false }, blocks: [
    { k: "p", text: "ނަންބަރު: {letter_ref}", align: "left", sz: 12, after: 12 },
    { k: "p", text: "{vendor_name}", align: "right", b: true, sz: 12, after: 12 },
    { k: "p", text: "ވެދުންސަލާމަށްފަހު ދަންނަވަމެވެ.", align: "right", sz: 12, after: 6 },
    { k: "p", text: "{project_name_dv}", align: "justify", sz: 12, after: 12 },
    { k: "p", text: "{letter_date_hijri}\n{letter_date_dv}", align: "right", sz: 12, after: 12 },
    { k: "p", text: "{office_head_name}\n{office_head_title_dv}", align: "left", sz: 12 }
  ] })]
];
