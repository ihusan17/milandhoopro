// Template registry, Templates admin tab, placeholder cheat-sheet, and single-document generation.

const TGROUPS = ["Bid Committee", "Evaluation Committee", "Letters", "Memos", "Reports", "Payments", "Plan", "Other"];
const TPL = () => Z().ptemplates;
const tplByCode = c => TPL().find(t => t.code === c && t.active !== false) || TPL().find(t => t.code === c);
const curVer = t => (t.versions || []).find(v => v.v === t.version) || (t.versions || []).slice(-1)[0];

function seedDemoTemplates() {
  const meta = window.__PCC_DEMO_META || [], z = Z(); let ch = false;
  meta.forEach(m => {
    if (z.ptemplates.some(t => t.code === m.code)) return;
    z.ptemplates.push({ id: uid(), code: m.code, nameEn: m.nameEn, nameDv: m.nameDv || "", group: m.group, type: m.type, perMember: m.perMember || "", inPack: !!m.inPack, order: m.order || 0, active: true, version: 1, versions: [{ v: 1, fileId: "demo:" + m.code, name: m.file, size: m.size || 0, at: Vt(), by: "Built-in demo", tags: m.tags || null, sheets: m.sheets || [] }], mapping: {}, custom: {}, cellMap: [], demo: !m.official, meeting: !!m.meeting });
    ch = true;
  });
  return ch;
}
async function tplTags(t) {
  const v = curVer(t);
  if (v.tags) return v.tags;
  const u8 = await fget(v.fileId), r = t.type === "xlsx" ? await scanXlsx(u8, t.replace) : scanDocx(u8, t.replace);
  v.tags = r.tags; v.sheets = r.sheets; K.Qt();
  return v.tags;
}
const fieldLabel = k => { for (const g of FIELDS) for (const f of g[1]) if (f[0] === k) return f[1]; const m = /^(.*?)_(dv_ymd|dv_dmy|dv_both|dv|en|hijri|iso|words_dv|words_en)$/.exec(k); const SUF = { dv_ymd: "2026 ނޮވެމްބަރ 09", dv_dmy: "09 ނޮވެމްބަރ 2026", dv_both: "both formats", dv: "Dhivehi", en: "English", hijri: "Hijri", iso: "ISO", words_dv: "Dhivehi words", words_en: "English words" }; return m ? fieldLabel(m[1]) + " (" + SUF[m[2]] + ")" : k; };
function knownTag(name, data) { const top = name.split(".")[0]; return Object.prototype.hasOwnProperty.call(data, top) || Object.prototype.hasOwnProperty.call(memberData({}, 0), top) || /^(bid|eval)_m\d+_(name|name_dv|short_dv|designation|designation_dv|role|role_dv|leave|absent_mark|leave_text)$/.test(top) || /^(.+_date|today)_(dv|en|hijri|iso|dv_ymd|dv_dmy|dv_both)$/.test(top) && Object.prototype.hasOwnProperty.call(data, top.replace(/_(dv|en|hijri|iso|dv_ymd|dv_dmy|dv_both)$/, "")); }

// Values for one template: mapping aliases and custom inputs applied on top of the data object.
function applyMap(t, data, custom = {}) {
  const d = Object.assign({}, data, { __num: Object.assign({}, data.__num) });
  Object.entries(t.mapping || {}).forEach(([tag, f]) => { if (!f) return; if (f === "@custom") d[tag] = custom[tag] ?? d[tag] ?? ""; else { d[tag] = d[f] ?? ""; d.__num[f] != null && (d.__num[tag] = d.__num[f]); } });
  Object.entries(custom).forEach(([k, v]) => { d[k] = v; });
  return d;
}
async function missingFor(t, data) {
  const tags = await tplTags(t), out = [];
  if (t.perMember) data = Object.assign({}, data, (data[t.perMember + "_members"] || [])[0] || {});
  // Leave fields are empty on purpose for members who are present.
  tags.filter(x => !x.loop && !x.inLoop && !/(^|_)(leave|leave_text|on_leave|absent_mark|present)$/.test(x.name)).forEach(x => { const v = data[x.name]; if (v == null || v === "") out.push(x.name); });
  return out;
}

function nextVersion(projectId, code, key) { return 1 + Math.max(0, ...Z().pdocs.filter(d => d.projectId === projectId && d.code === code && (d.key || "") === (key || "")).map(d => d.version || 0)); }
// Fill one template for one project (one file per committee member when the template says so).
async function generateDocs(p, t, data, opts = {}) {
  const ver = curVer(t), u8 = await fget(ver.fileId), tags = await tplTags(t), tops = new Set(tags.map(x => x.name.split(".")[0]));
  const runs = t.perMember ? (data[t.perMember + "_members"] || []).filter(m => !m.__leave).map(m => ({ key: "m" + m.no, label: safeName(m.member_name) !== "file" ? m.member_name : "Member_" + m.no, d: Object.assign({}, data, m) })) : [{ key: opts.key || "", label: "", d: data }];
  if (t.perMember && !runs.length) throw err(`${t.code}: add the ${t.perMember === "bid" ? "Bid" : "Evaluation"} Committee members first`);
  const out = [];
  for (const r of runs) {
    const bytes = t.type === "xlsx" ? await fillXlsx(u8, r.d, t.cellMap || [], t.replace) : fillDocx(u8, r.d, t.replace);
    const version = nextVersion(p.id, t.code, r.key);
    const fileName = `${safeName(p.ref)}_${t.code}${r.label ? "_" + safeName(r.label) : ""}_v${version}.${t.type}`;
    const fileId = await fput(bytes, { name: fileName, mime: MIME[t.type] });
    const snap = {}; Object.keys(r.d).forEach(k => { (tops.has(k) || k.startsWith("member_") || k === "letter_ref") && (snap[k] = r.d[k]); });
    const doc = { id: uid(), projectId: p.id, templateId: t.id, code: t.code, title: (t.nameEn || t.code) + (r.label ? " — " + r.label : ""), group: t.group, key: r.key, fileName, fileId, templateVersion: t.version, version, status: "Draft", by: me(), at: Vt(), snapshot: snap, pack: opts.pack || null, ref: opts.ref || r.d.letter_ref || r.d.memo_ref || "" };
    Z().pdocs.push(doc);
    audit(p, "Generated " + t.code + " v" + version, doc.title);
    out.push({ doc, name: fileName, data: bytes });
  }
  return out;
}

// ---------- Templates admin (#/projects/templates) ----------
function TPLPAGE(n) {
  const admin = can("templates");
  const todo = TPL().filter(t => !(curVer(t) || {}).tags);
  if (todo.length) setTimeout(async () => { let ch = 0; for (const t of todo) { try { await tplTags(t); ch++; } catch (e) { console.warn(t.code, e.message); } } if (ch && /#\/projects\/templates/.test(location.hash)) K.le(); }, 50);
  const head = o("div", { class: "row" }, o("h1", { style: { margin: 0 } }, "Document templates"), o("div", { class: "grow right" }, o("a", { class: "btn", href: "#/projects/cheatsheet", style: { textDecoration: "none" } }, "Placeholder cheat-sheet"), admin ? btn("Add template", () => tplAdd(), "primary") : null));
  n.append(head, PCNAV("templates"));
  if (!admin) n.append(o("div", { class: "alert warn" }, "Only administrators can add or change templates. You can still preview them."));
  n.append(o("div", { class: "alert warn pcc-note" }, o("b", {}, "Using your original documents as they are? "), "The program only changes text it is told about. Either type placeholders such as {project_name_dv} into the file, or press ", o("b", {}, "Replace text"), " on the template: pick the project the document was made for and the program finds that project's name, Iulaan number, dates and amounts in the file and swaps them for every new project."));
  n.append(o("div", { class: "alert info pcc-note" }, "Upload the council's original Word (.docx) and Excel (.xlsx) files once. Put placeholders such as {project_name_dv} or {contract_value_words_dv} where values go; the program fills them and keeps everything else — letterhead, fonts, borders, RTL text and signature blocks — exactly as in your file. Built-in demo templates are marked Demo: replace each with your original using Upload new version."));
  TGROUPS.forEach(g => {
    const L2 = TPL().filter(t => t.group === g).sort((a, b) => (a.order || 0) - (b.order || 0) || a.code.localeCompare(b.code));
    if (!L2.length) return;
    n.append(o("div", { class: "card flush" }, o("h3", { class: "pcc-ch" }, g + (g.includes("Committee") ? " pack" : "")), tbl(["#", "Code", "Document", "Format", "Version", "Placeholders", "In pack", "Status", ""], L2.map((t, i) => {
      const v = curVer(t) || {}, tags = v.tags;
      return o("tr", {}, o("td", {}, t.order || i + 1), o("td", { class: "nowrap" }, o("b", {}, t.code)), o("td", { style: { minWidth: "230px" } }, o("div", {}, t.nameEn), t.nameDv ? o("div", { class: "muted small", dir: "rtl", lang: "dv" }, t.nameDv) : null, t.perMember ? o("div", { class: "small pcc-tag" }, "One file per " + (t.perMember === "bid" ? "Bid" : "Evaluation") + " Committee member") : null),
        o("td", {}, o("span", { class: "pcc-fmt f-" + t.type }, t.type === "xlsx" ? "Excel" : "Word")), o("td", {}, "v" + t.version, t.demo && v.fileId && String(v.fileId).startsWith("demo:") ? o("span", { class: "pcc-tag demo" }, "Demo") : null),
        o("td", {}, tags ? (tags.length ? [String(tags.length), (t.replace || []).length ? o("div", { class: "muted small" }, `${t.replace.length} replace rule${t.replace.length === 1 ? "" : "s"}`) : null] : o("span", { class: "pcc-bad small", title: "Nothing in this file will change. Use Replace text, or type {placeholders} into the file." }, "0 — nothing fills")) : o("button", { class: "btn small", onclick: async () => { try { await tplTags(t); K.le(); } catch (e) { xt(e.message, "err"); } } }, "Scan")),
        o("td", {}, t.group.includes("Committee") ? (t.inPack ? "Yes" : "No") : "—"), o("td", {}, t.active === false ? stChip("Inactive") : stChip("Active")),
        o("td", { class: "pcc-acts wrap" }, btn("Preview", () => tplPreview(t), "small"), admin ? btn("Edit", () => tplEdit(t), "small") : null, admin ? btn("Placeholders", () => tplMap(t), "small") : null, admin ? btn("Replace text", () => tplRules(t), "small") : null, admin ? btn("Upload new version", () => tplUpload(t), "small") : null, btn("Versions", () => tplVersions(t), "small")));
    }))));
  });
}
async function readTemplateFile(f) {
  if (!f) return null;
  const ext = extOf(f.name);
  if (!["docx", "xlsx"].includes(ext)) throw err("Choose a Word .docx or Excel .xlsx file (old .doc/.xls files: open them in Word/Excel and save as .docx/.xlsx first)");
  if (f.size > 8 * 1048576) throw err("The file is larger than 8 MB");
  const u8 = await toU8(f), r = ext === "xlsx" ? await scanXlsx(u8) : scanDocx(u8);
  return { u8, ext, tags: r.tags, sheets: r.sheets, name: f.name, size: f.size };
}
async function tplAdd() {
  try {
    need("templates");
    const f = await readTemplateFile(await pickFile(".docx,.xlsx")); if (!f) return;
    const code = I("", { placeholder: "e.g. PR-07" }), en = I(f.name.replace(/\.\w+$/, "")), dv = DVI(""), grp = S(TGROUPS, "Letters"), pm = S([["", "One file per project"], ["bid", "One per Bid Committee member"], ["eval", "One per Evaluation Committee member"]], ""), pack = o("input", { type: "checkbox", checked: true }), ord = N(10, { min: 0 });
    const ok = await form("Add template — " + f.name, [["Code", code], ["Group", grp], ["Name (English)", en], ["Name (Dhivehi)", dv], ["Copies", pm], ["Order in pack", ord], o("label", { class: "pcc-chk" }, pack, " Include in the committee pack by default"), o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, `${f.tags.length} placeholder${f.tags.length === 1 ? "" : "s"} found.`)], { check: () => { if (!code.value.trim()) throw err("Type a code"); if (TPL().some(t => t.code === code.value.trim())) throw err("That code is already used — use Upload new version on it instead"); } });
    if (!ok) return;
    const fileId = await fput(f.u8, { name: f.name, mime: MIME[f.ext] });
    save(() => { TPL().push({ id: uid(), code: code.value.trim(), nameEn: en.value.trim(), nameDv: dv.value.trim(), group: grp.value, type: f.ext, perMember: pm.value, inPack: pack.checked, order: Number(ord.value) || 0, active: true, version: 1, versions: [{ v: 1, fileId, name: f.name, size: f.size, at: Vt(), by: me(), tags: f.tags, sheets: f.sheets }], mapping: {}, custom: {}, cellMap: [] }); }, "Template added");
    if (!f.tags.length) { const nt = TPL().find(x => x.code === code.value.trim()); nt && setTimeout(() => tplRules(nt, true), 400); }
  } catch (e) { xt(e.message, "err"); }
}
async function tplUpload(t) {
  try {
    need("templates");
    const f = await readTemplateFile(await pickFile("." + t.type)); if (!f) return;
    if (f.ext !== t.type) throw err(`This template is ${t.type === "xlsx" ? "an Excel" : "a Word"} file; upload a .${t.type}`);
    const sample = dataFor(PRJ()[0] || blankProject()), unknown = f.tags.filter(x => !x.loop && !knownTag(x.name, sample) && !(t.mapping || {})[x.name] && !x.inLoop);
    if (!(await jt(`Upload ${f.name} as version ${t.version + 1} of ${t.code}? ${f.tags.length} placeholders found${unknown.length ? `, ${unknown.length} not recognised (${unknown.slice(0, 5).map(x => x.name).join(", ")}) — map them next` : ""}. Documents made earlier keep using the version they were made with.`, "Upload"))) return;
    const fileId = await fput(f.u8, { name: f.name, mime: MIME[f.ext] });
    save(() => { const v = t.version + 1; t.versions.push({ v, fileId, name: f.name, size: f.size, at: Vt(), by: me(), tags: f.tags, sheets: f.sheets }); t.version = v; t.demo = false; }, `${t.code} updated to version ${t.version + 1}`);
    unknown.length ? setTimeout(() => tplMap(t), 400) : !f.tags.length && setTimeout(() => tplRules(t, true), 400);
  } catch (e) { xt(e.message, "err"); }
}
async function tplEdit(t) {
  const code = I(t.code), en = I(t.nameEn), dv = DVI(t.nameDv), grp = S(TGROUPS, t.group), pm = S([["", "One file per project"], ["bid", "One per Bid Committee member"], ["eval", "One per Evaluation Committee member"]], t.perMember || ""), pack = o("input", { type: "checkbox", checked: !!t.inPack }), act = o("input", { type: "checkbox", checked: t.active !== false }), ord = N(t.order || 0, { min: 0 });
  const ok = await form("Template " + t.code, [["Code", code], ["Group", grp], ["Name (English)", en], ["Name (Dhivehi)", dv], ["Copies", pm], ["Order in pack", ord], o("label", { class: "pcc-chk" }, pack, " Include in the committee pack by default"), o("label", { class: "pcc-chk" }, act, " Active")], { top: kbToggle(), check: () => { if (!code.value.trim()) throw err("Type a code"); if (TPL().some(x => x !== t && x.code === code.value.trim())) throw err("Code already used"); } });
  if (!ok) return;
  save(() => { need("templates"); Object.assign(t, { code: code.value.trim(), nameEn: en.value.trim(), nameDv: dv.value.trim(), group: grp.value, perMember: pm.value, inPack: pack.checked, active: act.checked, order: Number(ord.value) || 0 }); }, "Template saved");
}
async function tplVersions(t) {
  await Mt(`${t.code} — versions`, [tbl(["Version", "File", "Size", "Uploaded", "By", ""], t.versions.slice().reverse().map(v => o("tr", {}, o("td", {}, "v" + v.v + (v.v === t.version ? " (current)" : "")), o("td", {}, v.name), o("td", {}, v.size ? kb(v.size) : ""), o("td", {}, fd(String(v.at).slice(0, 10))), o("td", {}, v.by || ""), o("td", {}, btn("Download original", () => fdownload(v.fileId, v.name).catch(e => xt(e.message, "err")), "small"), can("templates") && v.v !== t.version ? btn("Delete", async () => { const used = Z().pdocs.filter(d => d.templateId === t.id && d.templateVersion === v.v).length; if (!(await jt(`Delete version ${v.v} of ${t.code} (${v.name})?${used ? ` ${used} generated document${used === 1 ? " was" : "s were"} made with it; ${used === 1 ? "it stays" : "they stay"} as ${used === 1 ? "it is" : "they are"}.` : ""} This cannot be undone.`, "Delete"))) return; try { need("templates"); t.versions = t.versions.filter(x => x !== v); K.Qt(); await fdrop(v.fileId); K.Qt(); xt("Version " + v.v + " deleted"); document.querySelector(".modal-back") && document.querySelector(".modal-back").click(); setTimeout(() => tplVersions(t), 50); } catch (e) { xt(e.message, "err"); } }, "small danger") : null, can("templates") && v.v !== t.version ? btn("Make current", () => { save(() => { t.version = v.v; }, "Version " + v.v + " is now current"); document.querySelector(".modal-back") && document.querySelector(".modal-back").click(); }, "small") : null)))), o("p", { class: "muted small" }, "Documents keep a link to the version they were made with.")], [{ label: "Close", primary: !0, value: !1 }]);
}
function blankProject() { return { id: 0, name: "Sample project", nameDv: "ނަމޫނާ މަޝްރޫޢު", ref: "MC-PRJ/2026/000", type: "Works", status: "Ongoing", bidders: [], committees: { bid: [], eval: [] }, payments: [], checklist: [], logs: [], eots: [] }; }
async function tplPreview(t, p) {
  try {
    const pr = p || PRJ().find(x => (x.bidders || []).length) || PRJ()[0] || blankProject();
    let data = applyMap(t, dataFor(pr, { letter_ref: refPeek("letter", pr), letter_date: Xt(today()), letter_date_dv: dvDate(today()), subject: "(subject)", body: "(letter text)", signatory_name: me() }), t.custom || {});
    if (t.perMember) { const m = (data[t.perMember + "_members"] || [])[0]; m && (data = Object.assign({}, data, m)); }
    const u8 = await fget(curVer(t).fileId), out = t.type === "xlsx" ? await fillXlsx(u8, data, t.cellMap || [], t.replace) : fillDocx(u8, data, t.replace);
    await previewFile(out, `${t.code}-preview.${t.type}`, `${t.code} filled with “${pr.name}”`);
  } catch (e) { xt(e.message, "err"); }
}
// Placeholder scanner and mapping
async function tplMap(t) {
  let tags;
  try { tags = await tplTags(t); } catch (e) { return xt(e.message, "err"); }
  const sample = dataFor(PRJ()[0] || blankProject()), keys = FIELDKEYS(), dl = o("datalist", { id: "pcc-fields" }, keys.map(k => o("option", { value: k }, fieldLabel(k)))), rows = [], mapping = Object.assign({}, t.mapping || {}), custom = Object.assign({}, t.custom || {});
  const list = tags.filter(x => !x.inLoop).map(x => {
    const known = x.loop ? Array.isArray(sample[x.name]) : knownTag(x.name, sample);
    const sel = S([["", known ? "Program field (automatic)" : "— not mapped —"], ["@field", "Use another field…"], ["@custom", "Ask when generating"]], mapping[x.name] === "@custom" ? "@custom" : mapping[x.name] ? "@field" : ""), fld = o("input", { type: "text", list: "pcc-fields", value: mapping[x.name] && mapping[x.name] !== "@custom" ? mapping[x.name] : "", placeholder: "field name", style: { display: mapping[x.name] && mapping[x.name] !== "@custom" ? "" : "none" } }), lab = I(custom["@label:" + x.name] || "", { placeholder: "Question shown when generating", style: { display: mapping[x.name] === "@custom" ? "" : "none" } });
    sel.addEventListener("change", () => { fld.style.display = sel.value === "@field" ? "" : "none"; lab.style.display = sel.value === "@custom" ? "" : "none"; });
    rows.push({ x, sel, fld, lab });
    return o("tr", {}, o("td", {}, o("code", {}, "{" + (x.loop ? "#" : "") + x.name + "}")), o("td", {}, known || mapping[x.name] ? o("span", { class: "pcc-ok" }, x.loop ? "Table loop" : fieldLabel(x.name)) : o("span", { class: "pcc-bad" }, "Not recognised")), o("td", {}, x.loop ? "" : [sel, fld, lab]));
  });
  const cm = (t.cellMap || []).map(m => ({ ...m })), cmBox = o("div", {}), sheets = curVer(t).sheets || [];
  const drawCm = () => cmBox.replaceChildren(tbl(["Sheet", "Cell", "Field", ""], cm.map((m, i) => { const sh = S(sheets.length ? sheets : [m.sheet || "Sheet1"], m.sheet), ce = I(m.cell, { placeholder: "C5", style: { width: "80px" } }), fl = o("input", { type: "text", list: "pcc-fields", value: m.field || "" }); sh.onchange = () => { m.sheet = sh.value; }; ce.oninput = () => { m.cell = ce.value.trim().toUpperCase(); }; fl.oninput = () => { m.field = fl.value.trim(); }; return o("tr", {}, o("td", {}, sh), o("td", {}, ce), o("td", {}, fl), o("td", {}, btn("Remove", () => { cm.splice(i, 1); drawCm(); }, "small"))); })), btn("Add cell", () => { cm.push({ sheet: sheets[0] || "Sheet1", cell: "", field: "" }); drawCm(); }, "small"));
  drawCm();
  const ok = await Mt(`${t.code} — placeholders`, [dl, o("p", { class: "muted small" }, `Found in version ${t.version}. Recognised placeholders fill automatically. Map the others to a program field, or have the program ask for the value when the document is generated.`), tags.length ? tbl(["Placeholder", "Fills with", "Mapping"], list) : o("p", { class: "muted" }, "No {placeholders} found in this file."), tags.some(x => x.inLoop) ? o("p", { class: "muted small" }, "Inside tables: " + tags.filter(x => x.inLoop).map(x => x.name).join(", ")) : null, t.type === "xlsx" ? [o("h4", {}, "Cell map (optional)"), o("p", { class: "muted small" }, "Instead of typing placeholders into the workbook, write a field into a fixed cell. Formulas are never overwritten."), cmBox] : null], [{ label: "Cancel", value: !1 }, { label: "Save", primary: !0, value: !0 }]);
  if (!ok) return;
  save(() => {
    need("templates");
    const m2 = {}, c2 = {};
    rows.forEach(({ x, sel, fld, lab }) => { if (sel.value === "@field" && fld.value.trim()) m2[x.name] = fld.value.trim(); if (sel.value === "@custom") { m2[x.name] = "@custom"; c2["@label:" + x.name] = lab.value.trim(); } });
    t.mapping = m2; t.custom = c2; t.cellMap = cm.filter(m => m.cell && m.field);
  }, "Placeholders saved");
}

// ---------- Cheat-sheet (#/projects/cheatsheet) ----------
function CHEAT(n) {
  const pr = PRJ().find(x => x.status !== "Planned") || PRJ()[0], data = pr ? dataFor(pr) : null, q = o("input", { type: "search", placeholder: "Search fields" }), box = o("div", {});
  const ph = f => (f[0].startsWith("{") ? f[0] : "{" + f[0] + "}");
  const ex = f => (data && !f[0].startsWith("{") && data[f[0]] !== undefined && data[f[0]] !== "" ? String(data[f[0]]) : f[2]);
  const row = f => o("tr", {}, o("td", {}, o("code", { class: "pcc-code", title: "Click to copy", onclick: () => { navigator.clipboard && navigator.clipboard.writeText(ph(f)); xt("Copied " + ph(f)); } }, ph(f))), o("td", {}, f[1]), o("td", { dir: "auto" }, ex(f)));
  const draw = () => {
    const s = q.value.trim().toLowerCase();
    box.replaceChildren(...FIELDS.map(([g, fs]) => { const L2 = fs.filter(f => !s || (f[0] + " " + f[1]).toLowerCase().includes(s)); return L2.length ? o("div", { class: "card flush" }, o("h3", { class: "pcc-ch" }, g), tbl(["Placeholder", "Meaning", "Example" + (pr ? " (" + pr.name + ")" : "")], L2.map(row))) : null; }));
  };
  q.addEventListener("input", draw);
  const sample = tplByCode("SAMPLE");
  n.append(o("div", { class: "row" }, o("h1", { style: { margin: 0 } }, "Placeholder cheat-sheet"), o("div", { class: "grow right" }, sample ? btn("Download sample Word file", () => fdownload(curVer(sample).fileId, "placeholder-sample.docx").catch(e => xt(e.message, "err"))) : null)), PCNAV("templates"),
    card(null, o("p", {}, "Type a placeholder in curly brackets anywhere in a Word or Excel template, e.g. ", o("code", {}, "{project_name_dv}"), ". For a table row that repeats, put ", o("code", {}, "{#bidders}"), " in the first cell and ", o("code", {}, "{/bidders}"), " in the last cell of the row; the cells in between use the loop fields such as ", o("code", {}, "{bidder_name}"), "."), o("p", { class: "muted small" }, "Dates: add _dv, _en or _hijri (e.g. {handover_date_dv}). Money: add _words_dv or _words_en (e.g. {contract_value_words_dv}). Check Dhivehi amount words on important documents; you can correct any value before generating."), q), box);
  draw();
}

// ---------- Replace text: turn text in an original document into fields ----------
const SUGGEST_KEYS = ["project_name_dv", "project_name_en", "project_name", "advertisement_no", "ref_no", "pr_number", "contractor_name", "contractor_name_dv", "contractor_address", "location", "description_dv", "award_bidder",
  "contract_value_words_dv", "contract_value_words_en", "contract_value", "estimated_cost_words_dv", "estimated_cost_words_en", "estimated_cost", "award_amount_words_dv", "award_amount", "retention_amount",
  ...DATEF.filter(d => d[2]).flatMap(([k]) => [k + "_dv", k + "_en", k + "_hijri", k]), "duration_days", "budget_code", "project_officer"];
function suggestRules(chunks, p) {
  const d = dataFor(p), cand = [];
  SUGGEST_KEYS.forEach(k => { const v = d[k]; if (v == null || v === "") return; const s = String(v).trim(); if (s.length < 4 && !/[\u0780-\u07BF]/.test(s)) return; if (/^\d{1,4}$/.test(s)) return; cand.push([s, k]); });
  DATEF.filter(x => x[2] && isISO(p[x[2]])).forEach(([k, , prop]) => { const [y, m, dd] = p[prop].split("-"); [`${Number(dd)}.${Number(m)}.${y}`, `${dd}/${m}/${y}`, `${Number(dd)}/${Number(m)}/${y}`, `${dd}-${m}-${y}`].forEach(s => cand.push([s, k])); });
  const seen = new Set(), list = cand.filter(([s]) => (seen.has(s) ? false : seen.add(s))).sort((a, b) => b[0].length - a[0].length);
  let text = chunks.join("\n"); const out = [];
  list.forEach(([s, k]) => { const n = text.split(s).length - 1; if (n > 0) { out.push({ find: s, field: k, count: n }); text = text.split(s).join("\u0000"); } });
  return out;
}
async function tplRules(t, fresh) {
  const rules = (t.replace || []).map(r => ({ ...r })), box = o("div", {}), keys = FIELDKEYS();
  const dl = o("datalist", { id: "pcc-fields2" }, [...new Set(keys.concat(["bid_meeting_date", "eval_meeting_date"]))].flatMap(k => [k, ...(DATEF.some(d => d[0] === k) || /_meeting_date$/.test(k) ? [k + "_dv", k + "_dv_dmy", k + "_dv_ymd", k + "_dv_both", k + "_en", k + "_hijri"] : []), ...(MONEYF.some(m => m[0] === k) ? [k + "_words_dv", k + "_words_en"] : [])]).map(k => o("option", { value: k }, fieldLabel(k))));
  const draw = () => box.replaceChildren(rules.length ? tbl(["Text in the original document", "Replace with field", ""], rules.map((r, i) => { const f = o("textarea", { rows: 1, dir: "auto" }), fl = o("input", { type: "text", list: "pcc-fields2", value: r.field || "" }); f.value = r.find || ""; f.oninput = () => { r.find = f.value; }; fl.oninput = () => { r.field = fl.value.trim(); }; return o("tr", {}, o("td", { style: { minWidth: "260px" } }, f), o("td", {}, fl, o("div", { class: "muted small" }, fieldLabel(r.field || "")), r.at && r.at.length ? o("div", { class: "small pcc-tag" }, "Only place" + (r.at.length > 1 ? "s " : " ") + r.at.join(", ") + " where this text appears") : null), o("td", {}, btn("Remove", () => { rules.splice(i, 1); draw(); }, "small"))); })) : o("p", { class: "muted" }, "No rules yet."), btn("Add a rule", () => { rules.push({ find: "", field: "" }); draw(); }, "small"));
  draw();
  const dbox = o("div", {}), detect = async () => {
    try { dbox.replaceChildren(o("p", { class: "muted small" }, "Reading the file…")); const chunks = await templateText(await fget(curVer(t).fileId), t.type); dbox.replaceChildren(detectPanel(t, chunks, add => { add.forEach(r => { const i = rules.findIndex(x => x.find === r.find && !(x.at && x.at.length) && !(r.at && r.at.length)); i >= 0 ? (rules[i] = r) : rules.push(r); }); draw(); })); }
    catch (e) { dbox.replaceChildren(o("p", { class: "pcc-bad small" }, e.message)); }
  };
  dbox.append(btn("Detect values in this file", detect, "primary"));
  (fresh || !rules.length) && setTimeout(detect, 50);
  const pick = S([["", "Choose the project this document was made for…"], ...PRJ().map(p => [p.id, `${p.ref} — ${p.nameDv || p.name}`])], ""), sbox = o("div", {});
  const suggest = async () => {
    const p = prj(pick.value); if (!p) return xt("Choose the project", "err");
    try {
      const chunks = await templateText(await fget(curVer(t).fileId), t.type), S2 = suggestRules(chunks, p).filter(s => !rules.some(r => r.find === s.find));
      if (!S2.length) { sbox.replaceChildren(o("p", { class: "muted small" }, `None of ${p.ref}'s values (name, Iulaan number, dates, amounts…) were found in this file. Check that the project's details match the document, or add rules by hand.`)); return; }
      const cbs = S2.map(() => o("input", { type: "checkbox", checked: true }));
      sbox.replaceChildren(o("p", { class: "small" }, `Found in the file — tick the ones to replace:`), tbl(["", "Text found", "Field", "Times"], S2.map((s, i) => o("tr", {}, o("td", {}, cbs[i]), o("td", { dir: "auto" }, s.find), o("td", {}, fieldLabel(s.field), o("div", { class: "muted small" }, "{" + s.field + "}")), o("td", {}, s.count)))), btn("Add the ticked ones", () => { S2.forEach((s, i) => cbs[i].checked && rules.push({ find: s.find, field: s.field })); sbox.replaceChildren(); draw(); }, "small primary"));
    } catch (e) { xt(e.message, "err"); }
  };
  const ok = await Mt(`${t.code} — replace text`, [dl, fresh ? o("div", { class: "alert warn" }, "This file has no {placeholders}. You don't need to type any: check the values found below, press Use the ticked values, then Save.") : null,
    o("p", { class: "muted small" }, "Each time a document is generated, the text on the left is replaced with the current project's value. Use this for your original files: last project's name, Iulaan number, dates and amounts become fields. Rules apply to every version of this template."),
    o("div", { class: "card", style: { margin: "8px 0" } }, o("h4", { style: { marginTop: 0 } }, "Find values automatically"), o("p", { class: "muted small" }, "Reads the file and lists every date, Hijri date, reference/meeting/Iulaan number, time, amount and committee member name, with the field it should become. No project needed."), dbox),
    o("div", { class: "card", style: { margin: "8px 0" } }, o("h4", { style: { marginTop: 0 } }, "Suggest from a project"), o("div", { class: "row", style: { alignItems: "center", gap: "8px" } }, o("div", { class: "grow" }, pick), btn("Find its values in the file", suggest)), sbox),
    o("h4", {}, "Rules"), box], [{ label: "Cancel", value: !1 }, { label: "Save", primary: !0, value: !0 }]);
  if (!ok) return;
  save(() => { need("templates"); t.replace = rules.filter(r => r.find && r.find.trim() && r.field).map(r => (r.at && r.at.length ? { find: r.find, field: r.field, at: r.at } : { find: r.find, field: r.field })); (t.versions || []).forEach(v => { v.tags = null; }); }, "Replace rules saved — " + rules.filter(r => r.find && r.field).length + " rule(s)");
  const pp = prj(pick.value) || PRJ().find(p => p.committees && (p.committees.bid || []).length && p.advertNo);
  setTimeout(() => tplPreview(t, pp || undefined), 400);
}
