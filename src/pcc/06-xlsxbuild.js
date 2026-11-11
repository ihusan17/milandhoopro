// Excel writer for formatted sheets: cells with styles (font, fill, border, alignment, number
// format), formulas with their values, merged cells, column widths, row heights, print setup.
//   const W = xlsxSheet(); W.set(r, c, value, style, formula); W.merge(r1, c1, r2, c2); …
//   await xlsxBuild({ name, sheet: W, widths: { 2: 17 }, heights: { 8: 43 }, landscape: true })
// Rows and columns are 1-based. Style: { b, i, strike, sz, color, font, fill, border ("thin" |
// "medium" | { style, color }), h, v, wrap, fmt }.
function xlsxSheet() {
  const cells = new Map(), merges = [];
  return { cells, merges,
    set(r, c, v, s = {}, f = null) { cells.set(r + ":" + c, { r, c, v, s, f }); return this; },
    box(r1, c1, r2, c2, s) { for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) { const k = r + ":" + c, x = cells.get(k); x ? (x.s = { ...s, ...x.s, border: s.border || x.s.border, fill: x.s.fill || s.fill }) : cells.set(k, { r, c, v: null, s: { ...s }, f: null }); } return this; },
    merge(r1, c1, r2, c2) { if (r1 !== r2 || c1 !== c2) merges.push([r1, c1, r2, c2]); return this; } };
}
const xcol = n => { let s = ""; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const xref = (r, c) => xcol(c) + r;
async function xlsxBuild({ name = "Sheet1", sheet, widths = {}, heights = {}, landscape = true, font = "Faruma", rtl = false, freeze = 0, area = null, margins = 0.35, onePage = false, images = [] }) {
  const X = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = ["<border><left/><right/><top/><bottom/><diagonal/></border>"], fmts = [], xfs = [];
  const idx = (arr, x) => { let i = arr.indexOf(x); if (i < 0) { arr.push(x); i = arr.length - 1; } return i; };
  const argb = c => "FF" + String(c || "000000").replace("#", "").toUpperCase();
  idx(fonts, `<font><sz val="12"/><color rgb="FF000000"/><name val="${X(font)}"/></font>`);
  idx(xfs, '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
  const BI = { "0.00": 2, "#,##0": 3, "#,##0.00": 4, "0": 1, General: 0 };
  const sid = s => {
    if (!s || !Object.keys(s).length) return 0;
    const fo = idx(fonts, `<font>${s.b ? "<b/>" : ""}${s.i ? "<i/>" : ""}${s.strike ? "<strike/>" : ""}<sz val="${s.sz || 12}"/><color rgb="${argb(s.color)}"/><name val="${X(s.font || font)}"/></font>`);
    const fi = s.fill ? idx(fills, `<fill><patternFill patternType="solid"><fgColor rgb="${argb(s.fill)}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
    const bd = s.border ? (() => { const b = typeof s.border === "string" ? { style: s.border } : s.border, side = t => b.style && (!b.only || b.only === t || (Array.isArray(b.only) && b.only.includes(t))) ? `<${t} style="${b.style}"><color rgb="${argb(b.color || "000000")}"/></${t}>` : `<${t}/>`; return idx(borders, `<border>${side("left")}${side("right")}${side("top")}${side("bottom")}<diagonal/></border>`); })() : 0;
    let nf = 0; if (s.fmt) { nf = s.fmt in BI ? BI[s.fmt] : 164 + idx(fmts, s.fmt); }
    const al = s.h || s.v || s.wrap ? `<alignment${s.h ? ` horizontal="${s.h}"` : ""} vertical="${s.v || "center"}"${s.wrap ? ' wrapText="1"' : ""}${s.indent ? ` indent="${s.indent}"` : ""}/>` : "";
    return idx(xfs, `<xf numFmtId="${nf}" fontId="${fo}" fillId="${fi}" borderId="${bd}" xfId="0" applyFont="1"${fi ? ' applyFill="1"' : ""}${bd ? ' applyBorder="1"' : ""}${nf ? ' applyNumberFormat="1"' : ""}${al ? ' applyAlignment="1"' : ""}>${al}</xf>`);
  };
  const byRow = new Map(); for (const x of sheet.cells.values()) { (byRow.get(x.r) || byRow.set(x.r, []).get(x.r)).push(x); }
  const rowsXml = [...byRow.keys()].sort((a, b) => a - b).map(r => { const L = byRow.get(r).sort((a, b) => a.c - b.c); const ht = heights[r] ? ` ht="${heights[r]}" customHeight="1"` : "";
    return `<row r="${r}"${ht}>${L.map(x => { const s = sid(x.s), ref = xref(x.r, x.c);
      if (x.f) { const num = typeof x.v === "number"; return `<c r="${ref}" s="${s}"${num ? "" : ' t="str"'}><f>${X(x.f.replace(/^=/, ""))}</f>${x.v == null || x.v === "" ? "" : `<v>${X(x.v)}</v>`}</c>`; }
      if (x.v == null || x.v === "") return `<c r="${ref}" s="${s}"/>`;
      return typeof x.v === "number" ? `<c r="${ref}" s="${s}"><v>${x.v}</v></c>` : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${X(x.v)}</t></is></c>`; }).join("")}</row>`; }).join("");
  // Row heights for rows that have no cells.
  const extra = Object.keys(heights).map(Number).filter(r => !byRow.has(r)).map(r => `<row r="${r}" ht="${heights[r]}" customHeight="1"/>`);
  const ordered = [...(rowsXml.match(/<row r="\d+"[\s\S]*?<\/row>/g) || []), ...extra].sort((a, b) => Number(/r="(\d+)"/.exec(a)[1]) - Number(/r="(\d+)"/.exec(b)[1])).join("");
  const maxC = Math.max(1, ...[...sheet.cells.values()].map(x => x.c)), maxR = Math.max(1, ...[...sheet.cells.values()].map(x => x.r));
  const cols = Object.entries(widths).sort((a, b) => a[0] - b[0]).map(([c, w]) => `<col min="${c}" max="${c}" width="${w}" customWidth="1"/>`).join("");
  const mg = sheet.merges.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map(([a, b, c, d]) => `<mergeCell ref="${xref(a, b)}:${xref(c, d)}"/>`).join("")}</mergeCells>` : "";
  const Z2 = new (LIB().PizZip)();
  Z2.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${images.length ? '<Default Extension="png" ContentType="image/png"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ""}</Types>`);
  Z2.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  const pa = area ? `<definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'${X(name)}'!$${xcol(area[1])}$${area[0]}:$${xcol(area[3])}$${area[2]}</definedName></definedNames>` : "";
  Z2.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${X(name)}" sheetId="1" r:id="rId1"/></sheets>${pa}<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
  Z2.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  // Styles are collected while the rows are written, so build them last.
  Z2.file("xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${xref(maxR, maxC)}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"${rtl ? ' rightToLeft="1"' : ""}>${freeze ? `<pane ySplit="${freeze}" topLeftCell="A${freeze + 1}" activePane="bottomLeft" state="frozen"/>` : ""}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${ordered}</sheetData>${mg}<pageMargins left="${margins}" right="${margins}" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${landscape ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="${onePage ? 1 : 0}"/>${images.length ? '<drawing r:id="rId1"/>' : ""}</worksheet>`);
  if (images.length) {
    // Pictures: placed by column/row (1-based) and offset in EMU, sized in EMU.
    Z2.file("xl/worksheets/_rels/sheet1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`);
    Z2.file("xl/drawings/_rels/drawing1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images.map((im, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i + 1}.png"/>`).join("")}</Relationships>`);
    images.forEach((im, i) => Z2.file(`xl/media/image${i + 1}.png`, im.u8));
    Z2.file("xl/drawings/drawing1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${images.map((im, i) => `<xdr:oneCellAnchor><xdr:from><xdr:col>${im.c - 1}</xdr:col><xdr:colOff>${Math.round(im.colOff || 0)}</xdr:colOff><xdr:row>${im.r - 1}</xdr:row><xdr:rowOff>${Math.round(im.rowOff || 0)}</xdr:rowOff></xdr:from><xdr:ext cx="${im.cx}" cy="${im.cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i + 2}" name="Picture ${i + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${im.cx}" cy="${im.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`).join("")}</xdr:wsDr>`);
  }
  Z2.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${fmts.length ? `<numFmts count="${fmts.length}">${fmts.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${X(f)}"/>`).join("")}</numFmts>` : ""}<fonts count="${fonts.length}">${fonts.join("")}</fonts><fills count="${fills.length}">${fills.join("")}</fills><borders count="${borders.length}">${borders.join("")}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join("")}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  return Z2.generate({ type: "uint8array", compression: "DEFLATE" });
}

// The emblem centred over columns from..to (column widths in characters), at a given row.
function emblemAt(widths, from, to, row, cx = 458918, cy = 483054) {
  const px = c => Math.round((widths[c] ?? 8.43) * 7 + 5), u8 = Uint8Array.from(atob(EMBLEM_PNG), ch => ch.charCodeAt(0));
  let total = 0; for (let c = from; c <= to; c++) total += px(c);
  let x = total / 2 - cx / 9525 / 2, c = from; while (c < to && x > px(c)) { x -= px(c); c++; }
  return { u8, r: row, c, colOff: x * 9525, rowOff: 20000, cx, cy };
}
