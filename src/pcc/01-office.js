// Office settings: the office's own name, island, head of office and letterhead. Every built-in
// document, heading and default reads from here, so another office only changes these settings.
const OFFICE_DEFAULTS = {
  nameDv: "މިލަދުންމަޑުލު އުތުރުބުރީ މިލަންދޫ ކައުންސިލްގެ އިދާރާ", officeDv: "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", shortDv: "މިލަންދޫ ކައުންސިލް",
  nameEn: "Milandhoo Council", islandDv: "ށ.މިލަންދޫ", countryDv: "ދިވެހިރާއްޖެ", placeDv: "މިލަންދޫ ކައުންސިލްގެ އިދާރާ",
  memberOfficeDv: "ށ. މިލަންދޫ ކައުންސިލް އިދާރާ", headName: "", headTitleDv: "ކައުންސިލްގެ ރައީސް", phone: "", email: "", web: "", footerDv: "", letterhead: ""
};
const OFF = () => { const z = Z(); z.office = Object.assign({}, OFFICE_DEFAULTS, z.office || {}); return z.office; };
// Swap the built-in Milandhoo wording for this office's own (used by the built-in sheet designs).
const offT = s => { const f = OFF(); return String(s).replace(/މިލަދުންމަޑުލު އުތުރުބުރީ މިލަންދޫ ކައުންސިލްގެ އިދާރާ/g, f.nameDv).replace(/މިލަންދޫ ކައުންސިލްގެ އިދާރާ/g, f.officeDv).replace(/ށ\. ?މިލަންދޫ/g, f.islandDv).replace(/މިލަންދޫ ކައުންސިލް/g, f.shortDv).replace(/ދިވެހިރާއްޖެ/g, f.countryDv); };
// Template fields: {office_name_dv}, {office_dv}, {office_short_dv}, {office_name_en}, {office_island_dv}…
function officeData(d) {
  const f = OFF();
  Object.assign(d, { office_name_dv: f.nameDv, office_dv: f.officeDv, office_short_dv: f.shortDv, office_name_en: f.nameEn, office_island_dv: f.islandDv, office_country_dv: f.countryDv, office_place_dv: f.placeDv,
    office_head_name: f.headName, office_head_title_dv: f.headTitleDv, office_phone: f.phone, office_email: f.email, office_web: f.web, office_footer_dv: f.footerDv });
  return d;
}
async function officeEdit() {
  const f = OFF(), el = {
    nameDv: DVI(f.nameDv), officeDv: DVI(f.officeDv), shortDv: DVI(f.shortDv), nameEn: I(f.nameEn), islandDv: DVI(f.islandDv), countryDv: DVI(f.countryDv), placeDv: DVI(f.placeDv), memberOfficeDv: DVI(f.memberOfficeDv),
    headName: DVI(f.headName), headTitleDv: DVI(f.headTitleDv), phone: I(f.phone), email: I(f.email), web: I(f.web), footerDv: DVI(f.footerDv)
  };
  let lh = f.letterhead || "";
  const lhImg = o("img", { class: "pcc-lh-prev", alt: "" }), lhInfo = o("span", { class: "muted small" });
  const showLh = () => { lhImg.style.display = lh ? "" : "none"; lh ? fget(lh).then(u => { lhImg.src = URL.createObjectURL(new Blob([u])); }).catch(() => {}) : null; lhInfo.textContent = lh ? "" : "No letterhead image: documents written in the portal use the State emblem and the office name above."; };
  const pick = btn("Upload letterhead image…", async () => { const file = await pickFile("image/png,image/jpeg"); if (!file) return; const u8 = new Uint8Array(await file.arrayBuffer()); lh = await fput(u8, { name: file.name, mime: file.type }); showLh(); }, "small");
  const clear = btn("Remove", () => { lh = ""; showLh(); }, "small");
  showLh();
  const ok = await form("Office settings", [
    o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, "Used by documents written in the portal, the built-in evaluation sheets, page headings and defaults. Template fields: {office_name_dv}, {office_dv}, {office_island_dv}, {office_head_name}, {office_head_title_dv}…"),
    ["Office name — full, as on the letterhead", el.nameDv], ["Office name — short", el.officeDv], ["Office — very short", el.shortDv], ["Office name (English)", el.nameEn],
    ["Island", el.islandDv], ["Country", el.countryDv], ["Default meeting place", el.placeDv], ["Default office of committee members", el.memberOfficeDv],
    ["Head of office — name", el.headName], ["Head of office — title", el.headTitleDv], ["Phone", el.phone], ["E-mail", el.email], ["Website", el.web], ["Footer line (Dhivehi)", el.footerDv],
    o("div", { style: { gridColumn: "1/-1" } }, o("label", {}, "Letterhead image (top of documents written in the portal)"), o("div", { class: "row", style: { gap: "8px", alignItems: "center" } }, pick, clear, lhInfo), lhImg)
  ], { top: kbToggle(), check: () => { if (!el.officeDv.value.trim()) throw err("Type the office name"); } });
  if (!ok) return;
  save(() => { need("templates"); const z = Z(); z.office = Object.assign({}, OFF(), Object.fromEntries(Object.entries(el).map(([k, e]) => [k, e.value.trim()])), { letterhead: lh }); }, "Office settings saved");
}
