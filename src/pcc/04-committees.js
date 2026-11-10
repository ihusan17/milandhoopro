// Standing committees (the council's usual Bid / Evaluation Committee) and members on leave.
// A member on leave is shown on the attendance row with the reason in one merged cell, shaded light grey,
// in the columns from {leave} to the end of the row; {absent_mark} cells show "-" shaded the same.

const LEAVE_TEXTS = ["ޗުއްޓީ", "ސަފަރު", "ބަލި ޗުއްޓީ", "ރަސްމީ ދަތުރު"];
// The council's Bid Committee (from the list sent on 10.11.2026). Check the spellings under Templates › Standing committees.
const STANDING_BID = [
  { nameDv: "އަލްފާޟިލް މުޙައްމަދު ރަޝީދު", designationDv: "ކައުންސިލް އޮފިސަރ", role: "Chair" },
  { nameDv: "އަލްފާޟިލް އިބްރާހީމް ސަލާމް", designationDv: "ސ. ކައުންސިލް އޮފިސަރ", role: "Member" },
  { nameDv: "އަލްފާޟިލާ މާލާ ޝަފާރް", designationDv: "ސ. ކައުންސިލް އޮފިސަރ", role: "Member" },
  { nameDv: "އަލްފާޟިލް އަޙްމަދު ޝަފާޒް", designationDv: "ސ. ފައިނޭންސް އޮފިސަރ", role: "Member" },
  { nameDv: "އަލްފާޟިލް އަޙްމަދު ސާމް", designationDv: "ފައިނޭންސް އޮފިސަރ", role: "Member" },
];
const STAND = () => (Z().standing = Z().standing && typeof Z().standing === "object" ? Z().standing : { bid: [], eval: [] });
const copyMembers = L2 => (L2 || []).map(m => ({ ...JSON.parse(JSON.stringify(m)), id: uid() + Math.random(), onLeave: false, leaveText: "" }));

// One member as template data (used by projects and meetings).
function memberData(m, i) {
  const leave = !!m.onLeave, lt = m.leaveText || LEAVE_TEXTS[0];
  return { no: i + 1, member_no: i + 1, member_name: m.name || m.nameDv || "", member_name_dv: m.nameDv || m.name || "", member_designation: m.designation || "", member_designation_dv: m.designationDv || m.designation || "", member_role: m.role || "Member", member_role_dv: ROLEDV[m.role || "Member"] || "",
    on_leave: leave ? "Yes" : "", leave_text: leave ? lt : "", leave: leave ? "⟦L⟧" + lt : "", absent_mark: leave ? "⟦G⟧-" : "", present: leave ? "" : "✓", __leave: leave };
}

// Word post-processing for leave rows: merge from the {leave} cell to the end of the row, shade, centre.
function leaveCells(u8, byName = []) {
  const zip = new (LIB().PizZip)(u8); let changed = false;
  const SHD = '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>';
  const shade = tc => tc.replace(/<w:shd [^>]*\/>/g, "").replace(/<w:tcPr>([\s\S]*?)<\/w:tcPr>/, (a, b) => "<w:tcPr>" + (/<w:vAlign/.test(b) ? b.replace(/<w:vAlign/, SHD + "<w:vAlign") : b + SHD) + "</w:tcPr>").replace(/<w:tc>(?!\s*<w:tcPr>)/, "<w:tc><w:tcPr>" + SHD + "</w:tcPr>");
  const span = tc => Number((/<w:gridSpan w:val="(\d+)"/.exec(tc) || [])[1] || 1), width = tc => Number((/<w:tcW w:w="(\d+)"/.exec(tc) || [])[1] || 0);
  const center = tc => tc.replace(/<w:p(\s[^>]*)?>(?!\s*<w:pPr>)/g, m => m + "<w:pPr></w:pPr>").replace(/<w:pPr>/g, '<w:pPr><w:jc w:val="center"/>').replace(/(<w:jc w:val="center"\/>[\s\S]*?)<w:jc w:val="[^"]*"\/>/g, "$1");
  docxParts(zip).forEach(n => {
    const x0 = zip.file(n).asText(), plain = s => decodeEnt(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    // Templates with fixed member rows (no {leave}): find the row with the member's name; after the name and
    // designation cells, the next empty cell gets "-" and the remaining empty cells merge into the reason.
    const x = !byName.length || /⟦L⟧/.test(x0) ? x0 : x0.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, tr => {
      const cells = [...tr.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map(c => c[0]), txt = cells.map(plain);
      const who = byName.find(b => b.names.some(nm => txt.some(t => t.includes(nm))));
      if (!who) return tr;
      const ni = txt.findIndex(t => who.names.some(nm => t.includes(nm))), rest = [];
      for (let i = ni + 2; i < cells.length; i++) rest.push(i);
      if (rest.length < 2 || rest.some(i => txt[i] !== "" && txt[i] !== "-") || /<w:gridSpan w:val="([2-9]|\d\d)"/.test(cells.slice(ni + 2).join(""))) return tr;
      const run = text => '<w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">' + xmlEsc(text) + "</w:t></w:r>";
      const put = (tc, text) => (/<w:p\b[^>]*\/>/.test(tc) && !/<w:p\b[^>]*[^/]>/.test(tc.replace(/<w:pPr>|<w:p\b[^>]*\/>/g, ""))
        ? tc.replace(/<w:p\b([^>]*)\/>/, (m, a) => "<w:p" + a + ">" + run(text) + "</w:p>")
        : tc.replace(/(<w:p\b[^>]*[^/]>(?:\s*<w:pPr>[\s\S]*?<\/w:pPr>)?)([\s\S]*?)(<\/w:p>)/, (m, a, b, c) => a + run(text) + c));
      cells[rest[0]] = put(cells[rest[0]].replace(/<w:t[^>]*>-<\/w:t>/, "<w:t></w:t>"), "⟦G⟧-"); cells[rest[1]] = put(cells[rest[1]], "⟦L⟧" + who.text);
      let k = 0; return tr.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, () => cells[k++]);
    });
    if (!/⟦[LG]⟧/.test(x)) return;
    const y = x.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, tr => {
      if (!/⟦[LG]⟧/.test(tr)) return tr;
      const cells = [...tr.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)]; if (!cells.length) return tr;
      const head = tr.slice(0, cells[0].index), tail = tr.slice(cells[cells.length - 1].index + cells[cells.length - 1][0].length);
      let out = [], merged = false;
      cells.forEach(({ 0: tc }, i) => {
        if (merged) return;
        if (tc.includes("⟦L⟧")) {
          const rest = cells.slice(i).map(c => c[0]), sp = rest.reduce((a, c) => a + span(c), 0), w = rest.reduce((a, c) => a + width(c), 0);
          let c = tc.replace(/⟦L⟧/g, "").replace(/<w:gridSpan [^>]*\/>/g, "");
          c = c.replace(/<w:tcW [^>]*\/>/, w ? `<w:tcW w:w="${w}" w:type="dxa"/><w:gridSpan w:val="${sp}"/>` : `<w:gridSpan w:val="${sp}"/>`);
          if (!/<w:gridSpan/.test(c)) c = c.replace(/<w:tcPr>/, `<w:tcPr><w:gridSpan w:val="${sp}"/>`);
          out.push(center(shade(c))); merged = true; return;
        }
        if (tc.includes("⟦G⟧")) { out.push(center(shade(tc.replace(/⟦G⟧/g, "")))); return; }
        out.push(tc);
      });
      changed = true;
      return head + out.join("") + tail;
    });
    zip.file(n, y);
  });
  return changed ? zip.generate({ type: "uint8array", compression: "DEFLATE" }) : u8;
}

// Templates page card: edit the standing committees.
function STANDCARD(n) {
  if (!can("templates")) return;
  const st = STAND();
  n.append(o("div", { class: "card" }, o("h3", {}, "Standing committees"), o("p", { class: "muted small" }, "The council's usual committees. New projects start with these members, and “Use the standing committee” copies them into a project. Mark members on leave per project or per meeting."),
    ...[["bid", "Bid Committee"], ["eval", "Evaluation Committee"]].map(([k, l]) => o("div", { style: { marginTop: "12px" } }, o("h4", {}, l), (st[k] || []).length ? tbl(["#", "Name", "Designation", "Role", ""], st[k].map((m, i) => o("tr", {}, o("td", {}, i + 1), o("td", { dir: "rtl", lang: "dv" }, m.nameDv || m.name, m.name && m.nameDv ? o("div", { class: "muted small", dir: "ltr" }, m.name) : null), o("td", { dir: "rtl", lang: "dv" }, m.designationDv || m.designation), o("td", {}, m.role || "Member"), o("td", { class: "pcc-acts" }, btn("Edit", () => standEdit(k, m), "small"), btn("↑", () => save(() => { i && st[k].splice(i - 1, 0, st[k].splice(i, 1)[0]); }), "small"), btn("Remove", () => save(() => { st[k].splice(i, 1); }, "Removed"), "small"))))) : o("p", { class: "muted" }, "No members."),
      o("div", { class: "row", style: { gap: "8px", marginTop: "8px" } }, btn("Add member", () => standEdit(k, null), "small"), btn(`Copy into every project without ${l} members`, () => save(() => { let c = 0; PRJ().forEach(p => { if (!(p.committees[k] || []).length && (st[k] || []).length) { p.committees[k] = copyMembers(st[k]); audit(p, l + " set from the standing committee"); c++; } }); xt(c + " project" + (c === 1 ? "" : "s") + " updated"); }), "small"))))));
}
async function standEdit(k, m) {
  const x = m || {}, nameDv = DVI(x.nameDv), name = I(x.name), desDv = DVI(x.designationDv), des = I(x.designation), role = S(["Chair", "Member", "Secretary"], x.role || "Member");
  if (!(await form((m ? "Edit" : "Add") + " standing " + (k === "bid" ? "Bid" : "Evaluation") + " Committee member", [["Name (Dhivehi)", nameDv], ["Name (English)", name], ["Designation (Dhivehi)", desDv], ["Designation (English)", des], ["Role", role]], { top: kbToggle(), check: () => { if (!nameDv.value.trim() && !name.value.trim()) throw err("Type the name"); } }))) return;
  save(() => { need("templates"); const st = STAND(), v = { nameDv: nameDv.value.trim(), name: name.value.trim(), designationDv: desDv.value.trim(), designation: des.value.trim(), role: role.value }; if (v.role === "Chair") (st[k] || []).forEach(y => { y !== m && y.role === "Chair" && (y.role = "Member"); }); if (m) Object.assign(m, v); else (st[k] = st[k] || []).push(v); }, "Saved");
}
// Leave toggles used in the member and meeting forms.
function leaveFields(m) {
  const cb = o("input", { type: "checkbox", checked: !!m.onLeave }), txt = o("input", { type: "text", dir: "rtl", lang: "dv", class: "dv", list: "pcc-leave", value: m.onLeave ? m.leaveText || LEAVE_TEXTS[0] : LEAVE_TEXTS[0], style: { maxWidth: "180px" } });
  const sync = () => { txt.style.display = cb.checked ? "" : "none"; }; cb.addEventListener("change", sync); sync();
  return { cb, txt, el: o("span", { class: "pcc-leave" }, o("datalist", { id: "pcc-leave" }, LEAVE_TEXTS.map(t => o("option", { value: t }))), o("label", { class: "pcc-chk" }, cb, " On leave"), txt), read: () => ({ onLeave: cb.checked, leaveText: cb.checked ? txt.value.trim() || LEAVE_TEXTS[0] : "" }) };
}
// First run: set the standing Bid Committee and give it to every project that has no Bid Committee yet.
function seedStanding(z) {
  if (z.standingV) return false;
  const st = STAND(); if (!(st.bid || []).length) st.bid = JSON.parse(JSON.stringify(STANDING_BID));
  PRJ().forEach(p => { if (!p.seed && !(p.committees.bid || []).length) { p.committees.bid = copyMembers(st.bid); audit(p, "Bid Committee set from the standing committee"); } });
  z.standingV = 1; return true;
}
