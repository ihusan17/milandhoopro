// Committee meetings that cover several projects: one Yaumiyya (minutes) for all of them and
// one invitation per member. Meeting templates repeat a block per project with {#projects} … {/projects};
// inside it every project field works ({project_name_dv}, {advertisement_no}, {#bidders}…).

const MEETS = () => (Z().meetings = Array.isArray(Z().meetings) ? Z().meetings : []);
const KLAB = { bid: "Bid Committee", eval: "Evaluation Committee" };
const meetingTpl = async t => t.meeting || (await tplTags(t)).some(x => x.loop && x.name === "projects");
const scalars = d => Object.fromEntries(Object.entries(d).filter(([k, v]) => k !== "__num" && (v == null || typeof v !== "object")));

function meetingsCard(p, k) {
  const L2 = MEETS().filter(m => m.kind === k && m.projectIds.includes(p.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return card(KLAB[k] + " meetings (several projects)",
    o("p", { class: "muted small" }, "When one meeting decides on more than one project, record it here: the program makes one Yaumiyya for all of them, and one invitation per member listing every project."),
    L2.length ? tbl(["Date", "Meeting no.", "Projects", "Members", "Documents", ""], L2.map(m => { const D2 = Z().pdocs.filter(d => d.meetingId === m.id && d.projectId === p.id); return o("tr", {}, o("td", { class: "nowrap" }, fd(m.date), m.time ? o("div", { class: "muted small" }, m.time) : null), o("td", { class: "nowrap" }, m.ref || "—"), o("td", {}, m.projectIds.map(id => prj(id)).filter(Boolean).map(q => o("div", { class: "small" }, q.id === p.id ? o("b", {}, q.ref) : o("a", { href: `#/project/${q.id}/${k}` }, q.ref), " ", o("span", { dir: "auto" }, q.nameDv || q.name)))), o("td", { class: "small" }, m.members.map(x => x.name).join(", ")), o("td", { class: "small" }, D2.length ? D2.map(d => o("div", {}, o("a", { href: "#", onclick: e => { e.preventDefault(); fdownload(d.fileId, d.fileName).catch(er => xt(er.message, "err")); } }, d.code + " v" + d.version))) : "—"), o("td", { class: "pcc-acts wrap" }, can("pdocs") ? [btn("Generate documents", () => meetingGen(m), "small primary"), btn("Edit", () => meetingEdit(m, k, p), "small"), btn("Delete", async () => { (await jt("Delete this meeting? Documents already generated stay in each project's Files.", "Delete")) && save(() => { Z().meetings = MEETS().filter(x => x !== m); }, "Meeting deleted"); }, "small")] : null)); })) : null,
    can("pdocs") ? btn("New meeting for several projects", () => meetingEdit(null, k, p)) : null);
}

async function meetingEdit(m, k, p) {
  const v = m || {}, date = D(v.date || today()), time = I(v.time || "", { placeholder: "e.g. 10:00" }), place = I(v.place || "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { dir: "auto" }), notes = o("textarea", { rows: 2, dir: "auto" });
  notes.value = v.notes || "";
  const chosen = new Set(v.projectIds || [p.id]), q = o("input", { type: "search", placeholder: "Search projects" }), list = o("div", { class: "pcc-mlist" });
  const drawList = () => { const s = q.value.trim().toLowerCase(); list.replaceChildren(...PRJ().filter(x => x.status !== "Cancelled" && (!s || `${x.ref} ${x.name} ${x.nameDv || ""}`.toLowerCase().includes(s) || chosen.has(x.id))).sort((a, b) => (chosen.has(b.id) - chosen.has(a.id)) || String(a.ref).localeCompare(String(b.ref), undefined, { numeric: true })).map(x => o("label", { class: "pcc-chk pcc-mrow" }, o("input", { type: "checkbox", checked: chosen.has(x.id), onchange: e => { e.target.checked ? chosen.add(x.id) : chosen.delete(x.id); drawSrc(); } }), o("span", { class: "nowrap" }, x.ref), o("span", { dir: "auto" }, x.nameDv || x.name), (x.committees[k] || []).length ? o("span", { class: "pcc-tag" }, (x.committees[k] || []).length + " members") : null))); };
  q.addEventListener("input", drawList);
  const src = o("select", {}), mprev = o("div", { class: "pcc-mmem" }); let mrows = [];
  const drawSrc = () => { const opts = [...chosen].map(id => prj(id)).filter(x => x && (x.committees[k] || []).length); src.replaceChildren(...(m ? [bt("@keep", "Keep this meeting's members (" + v.members.length + ")", true)] : []), ...opts.map(x => bt(x.id, `Committee of ${x.ref} (${x.committees[k].length})`, !m && x.id === p.id))); showPrev(); };
  const showPrev = () => { const L2 = src.value === "@keep" ? v.members : ((prj(src.value) || {}).committees || {})[k] || []; mrows = L2.map(x => ({ x, lf: leaveFields(x) })); mprev.replaceChildren(...(L2.length ? mrows.map(({ x, lf }) => o("div", { class: "pcc-mrow2" }, o("span", { dir: "auto" }, (x.nameDv || x.name) + " · " + (x.role || "Member")), lf.el)) : [o("p", { class: "muted small" }, `None of the chosen projects has ${KLAB[k]} members yet — add them on a project first.`)])); };
  src.addEventListener("change", showPrev);
  drawList(); drawSrc();
  const ok = await form((m ? "Edit " : "New ") + KLAB[k] + " meeting", [["Meeting date", date], ["Time", time], o("div", { style: { gridColumn: "1/-1" } }, L("Place", place), o("label", { style: { marginTop: "10px" } }, "Projects decided at this meeting"), q, list, L("Committee members", src), mprev, L("Notes", notes))], {
    check: () => { if (!date.value) throw err("Choose the meeting date"); if (chosen.size < 1) throw err("Tick at least one project"); if (!src.value) throw err(`Add ${KLAB[k]} members to one of the projects first`); },
  });
  if (!ok) return;
  save(() => {
    need("pdocs");
    const members = mrows.map(({ x, lf }) => ({ ...JSON.parse(JSON.stringify(x)), ...lf.read() }));
    const o2 = { kind: k, date: date.value, time: time.value.trim(), place: place.value.trim(), notes: notes.value.trim(), projectIds: [...chosen].filter(id => prj(id)), members };
    if (m) Object.assign(m, o2); else { const nm = { id: uid(), ref: refNext(k === "eval" ? "evalmeeting" : "meeting"), ...o2, by: me(), at: Vt() }; MEETS().push(nm); }
    o2.projectIds.forEach(id => audit(prj(id), `${KLAB[k]} meeting ${m ? "changed" : "recorded"}`, `${fd(o2.date)} · ${o2.projectIds.length} projects`));
  }, m ? "Meeting saved" : "Meeting recorded");
}

function meetingData(m) {
  const P = m.projectIds.map(id => prj(id)).filter(Boolean), first = P[0];
  const mem = m.members.map(memberData);
  const d = dataFor(first, { meeting_ref: m.ref || "", meeting_date: Xt(m.date), meeting_date_dv: dvDate(m.date), meeting_date_en: enDate(m.date), meeting_date_hijri: hijri(m.date), meeting_time: m.time || "", meeting_place: m.place || "", meeting_notes: m.notes || "", project_count: P.length, letter_date: Xt(m.date), letter_date_dv: dvDate(m.date), letter_date_hijri: hijri(m.date) });
  d[m.kind + "_members"] = mem;
  d[m.kind + "_meeting_no"] = m.ref || ""; d[m.kind + "_meeting_date"] = Xt(m.date); d[m.kind + "_meeting_date_dv"] = dvDate(m.date); d[m.kind + "_meeting_date_en"] = enDate(m.date); d[m.kind + "_meeting_date_hijri"] = hijri(m.date);
  d[m.kind + "_meeting_time"] = m.time || "";
  d.projects = P.map((p, i) => { const x = dataFor(p); return { ...scalars(x), no: i + 1, bidders: x.bidders, bid_members: x.bid_members, eval_members: x.eval_members }; });
  d.meeting_date_dv_ymd = dvYMD(m.date); d[m.kind + "_meeting_date_dv_ymd"] = dvYMD(m.date); d.meeting_date_dv_dmy = dvDMY(m.date); d[m.kind + "_meeting_date_dv_dmy"] = dvDMY(m.date); d[m.kind + "_meeting_date_dv_both"] = dvBoth(m.date);
  return addYMD(d);
}

async function meetingGen(m) {
  try {
    need("pdocs");
    const P = m.projectIds.map(id => prj(id)).filter(Boolean);
    if (!P.length) throw err("The meeting has no projects");
    const group = KLAB[m.kind], cands = [];
    for (const t of TPL().filter(x => x.active !== false && x.group === group)) if (await meetingTpl(t)) cands.push(t);
    if (!cands.length) throw err(`No meeting template in the ${group} group. A meeting template repeats a block per project between {#projects} and {/projects}.`);
    const cbs = cands.map(() => o("input", { type: "checkbox", checked: true }));
    if (!(await Mt(`Documents for the ${group} meeting of ${fd(m.date)}`, [o("p", {}, `${P.length} projects: ${P.map(p => p.ref).join(", ")}`), ...cands.map((t, i) => o("label", { class: "pcc-chk", style: { display: "flex", margin: "6px 0" } }, cbs[i], o("span", { class: "pcc-fmt f-" + t.type }, t.type === "xlsx" ? "XLSX" : "DOCX"), o("span", {}, o("b", {}, t.code), " ", t.nameEn, t.perMember ? o("span", { class: "muted small" }, ` · one per member (${m.members.length})`) : null)))], [{ label: "Cancel", value: !1 }, { label: "Generate", primary: !0, value: !0 }]))) return;
    const data = meetingData(m), all = [];
    for (const [i, t] of cands.entries()) {
      if (!cbs[i].checked) continue;
      const out = await generateDocs(P[0], t, applyMap(t, data, t.custom || {}), { key: "meet" + m.id, ref: m.ref });
      out.forEach(f => {
        f.doc.meetingId = m.id; f.doc.title = `${f.doc.title} — meeting ${fd(m.date)} (${P.length} projects)`;
        P.slice(1).forEach(p => { Z().pdocs.push({ ...f.doc, id: uid(), projectId: p.id, snapshot: {} }); audit(p, "Generated " + t.code + " for the meeting of " + fd(m.date)); });
      });
      all.push(...out);
    }
    if (!all.length) return;
    K.Qt();
    all.length === 1 ? ii(new Blob([all[0].data], { type: MIME[extOf(all[0].name)] }), all[0].name) : ii(new Blob([await zipFiles(all)], { type: MIME.zip }), `${safeName(m.ref || "meeting")}_${m.date}.zip`);
    xt(`${all.length} document${all.length === 1 ? "" : "s"} saved to each project's Files`);
    K.le();
  } catch (e) { xt(e.message, "err"); }
}
