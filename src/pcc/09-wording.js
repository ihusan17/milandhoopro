// Standard wording for committee agenda items (Yaumiyya / minutes). Each agenda type has four texts:
// the agenda item, the papers submitted, what was discussed and the decision. They are filled with the
// project's details; a meeting can change any text for itself (saved with the agenda item).
// The defaults are the council's own wording, taken from its Yaumiyyas.
const WORD_KEYS = [["agenda", "Agenda item", "އެޖެންޑާ އައިޓަމް"], ["docs", "Papers submitted", "ހުށަހަޅާ ކަރުދާހާއި އެހެނިހެން ލިޔެކިޔުން"], ["discussion", "Discussed", "މަޝްވަރާ ކުރެވުނު ކަންތައް"], ["decision", "Decision", "ނިންމުން"]];
const AWARD_DOCS = "އިޢުލާން، މަޢުލޫމާތު ކަރުދާސް، ޕޮއިންޓް ދިނުމަށް ކަނޑައަޅާފައިވާ އުސޫލް، މަޢުލޫމާތު ސާފްކުރި ފަރާތްތަކުގެ ލިސްޓް، ބިޑް ހުށަހެޅި ފަރާތްތަކުގެ ލިސްޓް، ހުށަހަޅާފައިވާ ބިޑްތައް އަދި އިވެލުއޭޝަން ޝީޓް";
const WORDING_DEFAULTS = {
  award: {
    agenda: "{project_doer_dv} ފަރާތެއް ހޯދުމަށް ކުރެވުނު އިޢުލާނުގެ ބިޑް އިވެލުއޭޓްކޮށް އެވޯޑްކުރުން.",
    docs: AWARD_DOCS,
    discussion: "ބިޑް އިވެލުއޭޝަން ކޮމިޓީން ހުށަހެޅި ރިޕޯޓު ބައްދަލުވުމުގައި ދިރާސާކޮށް، ހުށަހަޅާފައިވާ އަގުތަކަކީ ޕްރޮޖެކްޓަށް ކަނޑައެޅިފައިވާ ބަޖެޓާ އެކަށީގެންވާ އަގުތަކެއްތޯ ބަލައި، އަދި ބީލަމުގައި ބަޔާންކޮށްފައިވާ ހުރިހާ ޝަރުތުތަކެއް ފުރިހަމަކޮށްފައިވޭތޯ ޗެކްކޮށް އެވޯޑުކުރުމާ ގެޅޭގޮތުން ގޮތެއް ނިންމުން.",
    decision: "{project_doer_dv} ފަރާތެއް ހޯދުމަށް ކުރެވުނު އިޢުލާނާއި ގުޅިގެން ބިޑް ހުށަހަޅާފައިވާ ފަރާތްތަކަށް ޕޮއިންޓް ދިނުމަށް ކަނޑައަޅާފައިވާ އުސޫލްގެ މަތީން  މި މަސައްކަތް ކޮށްދިނުމަށް އަގުހުށަހަޅާފައިވާ ފަރާތަކަށް ޕޮއިންޓް ދިނުމުން، އެފަރާތަކީ ބީލަމުގެ ޝަރުތު ފުރިހަމަވެ އަދި ހުށަހަޅާފައިވާ އަގަކީ އެކަށީގެންވާ އަގަކަށް ވުމުން ({award_bidder}) އަށް އެމަސައްކަތް ހަވާލުކުރުމަށް ނިންމުން."
  },
  extension: {
    agenda: "{project_work_with_dv} ގުޅިގެން ކޮންޓްރެކްޓަރުގެ ސައިޓް ލޮގް ދިރާސާކުރުމަށްފަހު، މަސައްކަތުގެ މުއްދަތު އިތުރުކުރުމާ މެދު ގޮތެއް ނިންމުން",
    docs: "މަސައްކަތްތަކުގެ އެގްރީމަންޓް އަދި ސައިޓް ލޮގް",
    discussion: "{project_work_with_dv} ގުޅިގެން ކޮންޓްރެކްޓަރުގެ ސައިޓް ލޮގް ދިރާސާކުރުމަށްފަހު، މަސައްކަތުގެ މުއްދަތު އިތުރުކުރުމާ މެދު ގޮތެއް ނިންމުން.",
    decision: "{project_work_with_dv} ގުޅިގެން ކޮންޓްރެކްޓަރުގެ ސައިޓް ލޮގް ދިރާސާކުރުމަށްފަހު، މަސައްކަތުގެ މުއްދަތުގެ ތެރޭގައި ވިއްސާރަވެގެން މަސައްކަތް ކުރިއަށް ގެންދެވިފައިނުވާ ކަމަށް ކޮމިޓީއަށް ފާހަގަކުރެވިފައިވާ {item_days} ({item_days_words_dv}) ދުވަސް މަސައްކަތުގެ މުއްދަތަށް އިތުރުކޮށްދިނުމަށް  ޖަލްސާއަށް ހާޒިރުވި މެންބަރުންގެ އިއްތިފާޤުން ނިންމުނެވެ."
  },
  variation: {
    agenda: "މި އިދާރާއިން އިތުރުކުރަން ބޭނުންވާ މަސައްކަތް ކޮންޓްރެކްޓަރު ހުށަހަޅާފައިވާ ވޭރިއޭޝަނަށް ހުއްދަދިނުމާ ގުޅޭގޮތުން ގޮތެއް ނިންމުން. (ވޭރިއޭޝަން {variation_no})",
    docs: "މަސައްކަތްތަކުގެ ތަފްޞީލް އަދި ސިޓީ",
    discussion: "އިތުރު މަސައްކަތް ކުރުމަށް ކައުންސިލުން ފޮނުވާފައިވާ ސިޓީއާއި، އެކަމާ ގުޅިގެން ކޮންޓްރެކްޓަރު ފޮނުވާފައިވާ ޖަވާބު ސިޓީ ބައްދަލުވުމުގައި ދިރާސާކޮށް، މަސައްކަތަށް ހުށަހަޅާފައިވާ މުއްދަތަކީ އެކަށީގެންވާ މުއްދަތެއްތޯ ބަލައި،  ވޭރިއޭޝަން ފާސްކޮށްދިނުމާ ގުޅޭގޮތުން ގޮތެއް ނިންމުން.",
    decision: "{project_work_to_dv} އިތުރުކުރެވުނު މަސައްކަތް ނިންމުމަށް އިތުރަށް {item_days} ދުވަސް ދިނުމަށް  ޖަލްސާއަށް ހާޒިރުވި މެންބަރުންގެ އިއްތިފާޤުން ނިންމީމެވެ."
  },
  retender: { agenda: "{project_doer_dv} ފަރާތެއް ހޯދުމަށް ކުރެވުނު އިޢުލާނާ ގުޅޭގޮތުން ގޮތެއް ނިންމުން.", docs: AWARD_DOCS, discussion: "ބިޑް އިވެލުއޭޝަން ކޮމިޓީން ހުށަހެޅި ރިޕޯޓު ބައްދަލުވުމުގައި ދިރާސާކުރުން.", decision: "{retender_reason_dv}" },
  cancel: { agenda: "{project_work_dv} ބާތިލްކުރުމާ ގުޅޭގޮތުން ގޮތެއް ނިންމުން.", docs: "", discussion: "", decision: "" },
  other: { agenda: "{project_work_dv}", docs: "", discussion: "", decision: "" },
  evaluation: { agenda: "{project_doer_dv} ފަރާތެއް ހޯދުމަށް ކުރެވުނު އިޢުލާނުގެ ބިޑްތައް އިވެލުއޭޓްކުރުން.", docs: AWARD_DOCS, discussion: "", decision: "" }
};
const WORD_TYPES = [["award", "Award"], ["extension", "Time extension"], ["variation", "Variation"], ["retender", "Re-tender"], ["cancel", "Cancellation"], ["other", "Other"], ["evaluation", "Evaluation"]];
const wordingFor = type => { const z = Z(), base = WORDING_DEFAULTS[type] || WORDING_DEFAULTS[type === "reeval" ? "evaluation" : "other"], own = (z.agendaWording || {})[type] || {}; return Object.assign({}, base, own); };

// Forms of the project name used inside sentences, from its base name (as in the plan: "… ތަރައްޤީކުރުން",
// "… ހަރުކޮށްދިނުން"): "… ކުރުމުގެ މަސައްކަތް", "… މަސައްކަތާ", "… މަސައްކަތަށް", "… ކޮށްދޭނެ".
function nameForms(name) {
  const n = String(name || "").trim(); if (!n) return { gen: "", work: "", with: "", to: "", doer: "" };
  if (/މަސައްކަތް$/.test(n)) { const st = n.replace(/ތް$/, ""); return { gen: n, work: n, with: st + "ތާ", to: st + "ތަށް", doer: n + " ކޮށްދޭނެ" }; }
  if (/ުން$/.test(n)) { const gen = n.replace(/ުން$/, "ުމުގެ"); return { gen, work: gen + " މަސައްކަތް", with: gen + " މަސައްކަތާ", to: gen + " މަސައްކަތަށް", doer: /ދިނުން$/.test(n) ? n.replace(/ދިނުން$/, "ދޭނެ") : gen + " މަސައްކަތް ކޮށްދޭނެ" }; }
  return { gen: n, work: n, with: n + " އާ", to: n + " އަށް", doer: n + " ކޮށްދޭނެ" };
}
function nameFields(d, name) { const f = nameForms(name); Object.assign(d, { project_gen_dv: f.gen, project_work_dv: f.work, project_work_with_dv: f.with, project_work_to_dv: f.to, project_doer_dv: f.doer }); return d; }

// Variation number of an agenda item: the project's variations at earlier Bid Committee meetings,
// plus its place among this meeting's items (so an unsaved meeting is numbered too).
function variationNo(m, it, list) {
  const before = x => String(x.date || "") < String(m.date || "") || (String(x.date || "") === String(m.date || "") && String(x.ref || "").localeCompare(String(m.ref || ""), undefined, { numeric: true }) < 0);
  const prev = MEETS().filter(x => x.kind === "bid" && x.id !== m.id && before(x)).reduce((a, x) => a + mItems(x).filter(y => y.projectId === it.projectId && y.type === "variation").length, 0);
  const L = (list || []).filter(y => y.projectId === it.projectId && y.type === "variation"), k = L.indexOf(it);
  return String(prev + (k < 0 ? L.length + 1 : k + 1)).padStart(2, "0");
}
// The data of one agenda item (one row of {#projects}…{/projects} / {#agenda_items}…).
function itemRow(m, it, p, i, list) {
  const x = dataFor(p), ty = mtype(m.kind, it.type);
  const r = { ...scalars(x), no: i + 1, agenda_no: String(i + 1), bidders: x.bidders, bid_members: x.bid_members, eval_members: x.eval_members, item_type: ty[1], item_type_dv: ty[2], item_code: ty[0], item_note: it.note || "",
    is_award: it.type === "award", is_variation: it.type === "variation", is_extension: it.type === "extension",
    variation_amount: it.amount == null ? "" : ht(Math.abs(it.amount)), variation_kind_dv: it.amount == null ? "" : it.amount < 0 ? "ކުޑަކުރުން" : "އިތުރުކުރުން", variation_amount_words_dv: it.amount == null ? "" : dvMoneyWords(Math.abs(it.amount)), variation_days: it.days == null ? "" : String(it.days),
    contract_after_variation: it.amount != null && p.contract != null ? ht(p.contract + it.amount) : "",
    item_days: it.daysText || (it.days == null ? "" : String(it.days)), item_days_words_dv: it.days ? dvInt(it.days) : "", variation_no: it.type === "variation" ? variationNo(m, it, list) : "" };
  const T = itemTexts(it, r);
  Object.assign(r, { agenda_text_dv: T.agenda, agenda_docs_dv: T.docs, discussion_dv: T.discussion, decision_dv: T.decision });
  return r;
}
// Texts of one agenda item: the meeting's own text if it was changed, else the standard wording filled in.
function itemTexts(it, row) { const W = wordingFor(it.type), T = it.texts || {}; return Object.fromEntries(WORD_KEYS.map(([k]) => [k, T[k] != null && T[k] !== "" ? T[k] : render(W[k] || "", row, row)])); }

async function wordingEdit() {
  const cur = o("select", {}), box = o("div", {}), z = Z(), draft = JSON.parse(JSON.stringify(z.agendaWording || {}));
  WORD_TYPES.forEach(([k, l]) => cur.append(o("option", { value: k }, l)));
  const draw = () => {
    const k = cur.value, W = wordingFor(k), own = draft[k] || {};
    box.replaceChildren(...WORD_KEYS.map(([f, l, dv]) => { const ta = thaanaInput(o("textarea", { rows: f === "decision" || f === "discussion" ? 5 : 3, dir: "rtl", lang: "dv", class: "dv" })); ta.value = own[f] ?? W[f] ?? "";
      ta.oninput = () => { (draft[k] = draft[k] || {})[f] = ta.value; };
      return o("div", { class: "pcc-wd-f" }, o("label", {}, l, " · ", o("span", { dir: "rtl", lang: "dv" }, dv)), ta); }),
      o("div", { class: "row", style: { gap: "8px" } }, btn("Back to the standard wording", () => { delete draft[k]; draw(); }, "small")));
  };
  cur.onchange = draw; draw();
  const ok = await form("Agenda wording", [o("p", { class: "muted small", style: { gridColumn: "1/-1" } }, "The four texts of each kind of agenda item, used in the Yaumiyya and other meeting documents. Fields such as {project_doer_dv}, {project_work_with_dv}, {award_bidder}, {item_days}, {item_days_words_dv}, {variation_no} are filled from the project and the agenda item. A meeting can still change any text for itself."),
    o("div", { style: { gridColumn: "1/-1" } }, o("label", {}, "Kind of agenda item"), cur, box)], { top: kbToggle() });
  if (!ok) return;
  save(() => { need("pdocs"); Z().agendaWording = draft; }, "Agenda wording saved");
}
