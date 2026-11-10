// Bid Committee and Evaluation Committee packs: review panel → validation → files + ZIP.

const PACKS = { bid: { group: "Bid Committee", zip: "BidCommittee", title: "Bid Committee pack" }, eval: { group: "Evaluation Committee", zip: "Evaluation", title: "Evaluation Committee pack" } };
// Fields that can be saved back to the project from the review panel.
const BACK = { pr_number: ["prNumber", "text"], advertisement_no: ["advertNo", "text"], iulaan_no: ["advertNo", "text"], bid_meeting_no: ["bidMeetingNo", "text"], eval_meeting_no: ["evalMeetingNo", "text"], bid_meeting_date: ["bidMeetingDate", "date"], bid_meeting_time: ["bidMeetingTime", "text"], eval_meeting_time: ["evalMeetingTime", "text"], evaluation_time: ["evaluationTime", "text"], eval_meeting_date: ["evalMeetingDate", "date"], iulaan_date: ["advertised", "date"], location: ["location", "text"], project_name_dv: ["nameDv", "text"], project_name_en: ["nameEn", "text"], category: ["category", "text"], contract_value: ["contract", "money"], estimated_cost: ["estimate", "money"], duration_days: ["duration", "int"], retention_percent: ["retentionPct", "num"], retention_period_days: ["retentionDays", "int"], advertised_date: ["advertised", "date"], bid_opening_date: ["bidOpening", "date"], evaluation_date: ["evaluation", "date"], award_date: ["award", "date"], agreement_date: ["agreement", "date"], handover_date: ["handover", "date"], description_dv: ["descDv", "text"], description: ["desc", "text"] };
const dmy2iso = s => { const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(String(s).trim()); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : isISO(s) ? s : null; };

function packTemplates(k) { return TPL().filter(t => t.group === PACKS[k].group && t.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0)); }
function packCard(p, k) {
  const P = PACKS[k], T = packTemplates(k).filter(t => t.inPack), mem = (p.committees[k] || []).length;
  const files = T.reduce((a, t) => a + (t.perMember ? Math.max(mem, 0) : 1), 0);
  return o("div", { class: "card pcc-pack" }, o("div", { class: "pcc-pack-h" }, o("div", {}, o("h3", { style: { margin: 0 } }, P.title), o("p", { class: "muted small", style: { margin: "4px 0 0" } }, `${T.length} document${T.length === 1 ? "" : "s"} in the pack → ${files} file${files === 1 ? "" : "s"} for ${mem} member${mem === 1 ? "" : "s"}. Review the values, then download everything as one ZIP.`)), can("pdocs") ? btn("Generate " + P.title, () => packPanel(p, k), "primary") : null),
    o("div", { class: "pcc-packlist" }, T.map((t, i) => { const last = Z().pdocs.filter(d => d.projectId === p.id && d.templateId === t.id).sort((a, b) => b.version - a.version)[0]; return o("div", { class: "pcc-pi" }, o("span", { class: "n" }, i + 1), o("span", { class: "pcc-fmt f-" + t.type }, t.type === "xlsx" ? "XLSX" : "DOCX"), o("div", { class: "grow" }, o("b", {}, t.nameEn), o("div", { class: "muted small" }, t.code + (t.perMember ? ` · one per member (${mem})` : ""))), last ? o("div", { class: "right" }, o("span", { class: "pcc-tag", title: "How many times this document has been generated for this project. It goes up each time you generate the pack." }, "Generated " + fd(String(last.at).slice(0, 10)) + " " + new Date(last.at).toTimeString().slice(0, 5) + " · copy " + last.version + " · template v" + (last.templateVersion || 1)), (last.templateVersion || 1) !== t.version ? o("div", { class: "pcc-bad small" }, "Template is now v" + t.version + " — generate again to use it") : null) : o("span", { class: "muted small" }, "not generated · template v" + t.version)); })));
}

async function packPanel(p, k) {
  const P = PACKS[k]; let sel = new Map(packTemplates(k).map(t => [t.id, !!t.inPack]));
  const base = dataFor(p), edits = {}, form1 = o("div", { class: "pcc-pform" }), right = o("div", { class: "pcc-pdocs" }), save2 = o("input", { type: "checkbox" });
  const tplsOn = () => TPL().filter(t => sel.get(t.id));
  async function tagsUnion() { const s = new Map(); for (const t of tplsOn()) { (await tplTags(t)).filter(x => !x.loop && !x.inLoop).forEach(x => { s.has(x.name) || s.set(x.name, []); s.get(x.name).push(t.code); }); Object.entries(t.mapping || {}).filter(([, f]) => f === "@custom").forEach(([tag]) => { s.has(tag) || s.set(tag, [t.code]); }); } return s; }
  const member = { member_no: 1, member_name: 1, member_name_dv: 1, member_designation: 1, member_designation_dv: 1, member_role: 1, member_role_dv: 1 };
  function current(t) {
    const d = applyMap(t, base, t.custom || {});
    Object.entries(edits).forEach(([key, val]) => {
      d[key] = val;
      if (MONEYF.some(m => m[0] === key)) { const x = yn(val); if (x != null && !Number.isNaN(x)) { edits[key + "_words_dv"] == null && (d[key + "_words_dv"] = dvMoneyWords(x)); edits[key + "_words_en"] == null && (d[key + "_words_en"] = enMoneyWords(x)); d.__num[key] = x / 100; } }
      if (DATEF.some(m => m[0] === key)) { const iso = dmy2iso(val); if (iso) { edits[key + "_dv"] == null && (d[key + "_dv"] = dvDate(iso)); edits[key + "_dv_ymd"] == null && (d[key + "_dv_ymd"] = dvYMD(iso)); edits[key + "_dv_dmy"] == null && (d[key + "_dv_dmy"] = dvDMY(iso)); edits[key + "_dv_both"] == null && (d[key + "_dv_both"] = dvBoth(iso)); edits[key + "_en"] == null && (d[key + "_en"] = enDate(iso)); edits[key + "_hijri"] == null && (d[key + "_hijri"] = hijri(iso)); } }
    });
    return d;
  }
  async function drawForm() {
    const U = await tagsUnion(), rows = [...U.entries()].filter(([name]) => !member[name]);
    form1.replaceChildren(o("div", { class: "row", style: { alignItems: "center" } }, o("h4", { style: { margin: 0 } }, "Values used in the documents"), o("span", { class: "grow" }), kbToggle()), o("p", { class: "muted small" }, "Pre-filled from the project. Change any value for this pack only, or tick the box below to save the changes to the project. Member names come from the committee list."),
      rows.length ? o("div", { class: "pcc-pf-grid" }, rows.map(([name, codes]) => {
        const t0 = TPL().find(t => t.code === codes[0]), d = current(t0), val = d[name] == null ? "" : String(d[name]), dv = /_dv$/.test(name) || /[ހ-޿]/.test(val), lab = (t0.custom || {})["@label:" + name] || fieldLabel(name);
        const inp = dv ? DVI(val) : I(val); inp.addEventListener("input", () => { edits[name] = inp.value; drawRight(); });
        return o("div", { class: "pcc-f" + (val === "" ? " miss" : "") }, o("label", {}, lab, " ", o("code", { class: "muted small" }, "{" + name + "}")), inp, o("div", { class: "muted small" }, codes.join(", "), BACK[name] ? " · saved to project if ticked" : ""));
      })) : o("p", { class: "muted" }, "These templates have no simple placeholders."),
      o("label", { class: "pcc-chk", style: { marginTop: "12px" } }, save2, " Save changed values back to the project"));
  }
  async function drawRight() {
    const items = [];
    for (const t of TPL().filter(x => x.group === P.group || sel.has(x.id))) {
      if (!sel.has(t.id)) continue;
      const on = sel.get(t.id), miss = on ? await missingFor(t, current(t)) : [], mem = (p.committees[t.perMember] || []).length;
      const cb = o("input", { type: "checkbox", checked: on, onchange: e => { sel.set(t.id, e.target.checked); drawForm(); drawRight(); } });
      items.push(o("div", { class: "pcc-pdoc" + (on ? "" : " off") }, o("label", { class: "pcc-chk" }, cb, o("span", { class: "pcc-fmt f-" + t.type }, t.type === "xlsx" ? "XLSX" : "DOCX"), o("span", {}, o("b", {}, t.code), " ", t.nameEn)), t.perMember ? o("div", { class: "small " + (mem ? "muted" : "pcc-bad") }, mem ? `${mem} files (one per member)` : "No committee members — add them first") : null, on && miss.length ? o("div", { class: "small pcc-bad" }, "Needs: " + miss.slice(0, 6).map(fieldLabel).join(", ") + (miss.length > 6 ? ` +${miss.length - 6} more` : "")) : on ? o("div", { class: "small pcc-ok" }, "Ready") : null));
    }
    const others = TPL().filter(t => t.active !== false && !sel.has(t.id)), add = S([["", "+ Add document…"], ...others.map(t => [t.id, `${t.code} — ${t.nameEn}`])], "");
    add.addEventListener("change", () => { if (add.value) { sel.set(Number(add.value), true); drawForm(); drawRight(); } });
    right.replaceChildren(o("h4", { style: { marginTop: 0 } }, "Documents in this pack"), ...items, others.length ? add : null);
  }
  await drawForm(); await drawRight();
  const ok = await Mt(`${P.title} — ${p.ref}`, [o("div", { class: "pcc-ppanel" }, form1, right)], [{ label: "Cancel", value: !1 }, { label: "Generate & download ZIP", primary: !0, value: !0, onClick: async () => {
    if (!tplsOn().length) { xt("Tick at least one document", "err"); return !1; }
    const blank = []; for (const t of tplsOn()) if (!(await tplTags(t)).length) blank.push(t.code);
    if (blank.length && !(await jt(`${blank.join(", ")}: no placeholders or replace rules — these files will be unchanged copies of the template. Set them up under Projects › Templates › Replace text. Continue?`, "Continue"))) return !1;
    const bad = tplsOn().filter(t => t.perMember && !(p.committees[t.perMember] || []).length);
    if (bad.length) { xt(`${bad.map(t => t.code).join(", ")}: add the committee members first`, "err"); return !1; }
    let miss = []; for (const t of tplsOn()) { const m = await missingFor(t, current(t)); m.length && miss.push(`${t.code}: ${m.slice(0, 4).map(fieldLabel).join(", ")}`); }
    if (miss.length && !(await jt("Some fields are empty — " + miss.join(" · ") + ". Generate anyway (the empty places stay blank)?", "Generate"))) return !1;
  } }]);
  if (!ok) return;
  try {
    need("pdocs");
    if (save2.checked) Object.entries(edits).forEach(([key, val]) => { const b = BACK[key]; if (!b) return; const [prop, kind] = b; p[prop] = kind === "money" ? yn(val) : kind === "int" ? (val === "" ? null : parseInt(val, 10)) : kind === "num" ? (val === "" ? null : Number(val)) : kind === "date" ? dmy2iso(val) || p[prop] : val; });
    if (save2.checked) { recalcDue(p); audit(p, "Values saved from the " + P.title, Object.keys(edits).join(", ")); }
    const packId = uid(), all = [];
    for (const t of tplsOn()) all.push(...await generateDocs(p, t, current(t), { pack: packId }));
    audit(p, P.title + " generated", `${all.length} files`);
    K.Qt();
    const zipName = `${safeName(p.ref)}_${P.zip}_${today()}.zip`, z = await zipFiles(all);
    ii(new Blob([z], { type: MIME.zip }), zipName);
    K.le();
    await Mt(P.title + " ready", [o("p", {}, `${all.length} files saved to the project and downloaded as ${zipName}.`), tbl(["File", ""], all.map(f => o("tr", {}, o("td", {}, f.name), o("td", { class: "pcc-acts" }, btn("Preview", () => previewFile(f.data, f.name, f.doc.title), "small"), btn("Download", () => ii(new Blob([f.data], { type: MIME[extOf(f.name)] }), f.name), "small"))))), o("p", { class: "muted small" }, "After signing, upload each signed scan with Upload signed (Bid Documents / Evaluation tab or Documents).")], [{ label: "Download ZIP again", value: "z", onClick: () => { ii(new Blob([z], { type: MIME.zip }), zipName); return !1; } }, { label: "Close", primary: !0, value: !1 }]);
  } catch (e) { xt(e.message, "err"); }
}
