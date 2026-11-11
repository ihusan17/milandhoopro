// Committee meetings that cover several projects: one Yaumiyya (minutes) for all of them and
// one invitation per member. Meeting templates repeat a block per project with {#projects} … {/projects};
// inside it every project field works ({project_name_dv}, {advertisement_no}, {#bidders}…).

const MEETS = () => (Z().meetings = Array.isArray(Z().meetings) ? Z().meetings : []);
const KLAB = { bid: "Bid Committee", eval: "Evaluation Committee" };
const meetingTpl = async t => t.meeting || (await tplTags(t)).some(x => x.loop && ["projects", "awards", "variations", "extensions", "evaluations"].includes(x.name));
const scalars = d => Object.fromEntries(Object.entries(d).filter(([k, v]) => k !== "__num" && (v == null || typeof v !== "object")));

function meetingsCard(p, k) {
  const L2 = MEETS().filter(m => m.kind === k && (m.projectIds || []).includes(p.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return card(KLAB[k] + " meetings",
    o("p", { class: "muted small" }, "Meetings that decided on this project (award, variation, evaluation…). A meeting can cover several projects: the program makes one Yaumiyya for all of them, and one invitation per member listing every project. ", o("a", { href: "#/projects/meetings/" + today().slice(0, 4) }, "All committee meetings →")),
    L2.length ? tbl(["Date", "Meeting no.", "Projects", "Members", "Documents", ""], L2.map(m => { const D2 = Z().pdocs.filter(d => d.meetingId === m.id && d.projectId === p.id); return o("tr", {}, o("td", { class: "nowrap" }, fd(m.date), m.time ? o("div", { class: "muted small" }, m.time) : null), o("td", { class: "nowrap" }, m.ref || "—"), o("td", {}, mItems(m).map(it => { const q = prj(it.projectId); return o("div", { class: "small" }, q.id === p.id ? o("b", {}, q.ref) : o("a", { href: `#/project/${q.id}/${k}` }, q.ref), " ", mChip(k, it.type), " ", o("span", { dir: "auto" }, q.nameDv || q.name)); })), o("td", { class: "small" }, m.members.map(x => x.name).join(", ")), o("td", { class: "small" }, D2.length ? D2.map(d => o("div", {}, o("a", { href: "#", onclick: e => { e.preventDefault(); fdownload(d.fileId, d.fileName).catch(er => xt(er.message, "err")); } }, d.code + " v" + d.version))) : "—"), o("td", { class: "pcc-acts wrap" }, can("pdocs") ? [btn("Generate documents", () => meetingGen(m), "small primary"), btn("Edit", () => meetingEdit(m, k, p), "small"), btn("Delete", async () => { (await jt("Delete this meeting? Documents already generated stay in each project's Files.", "Delete")) && save(() => { Z().meetings = MEETS().filter(x => x !== m); }, "Meeting deleted"); }, "small")] : null)); })) : null,
    can("pdocs") ? btn("New " + KLAB[k] + " meeting", () => meetingEdit(null, k, p)) : null);
}

// What each project is at the meeting for. Bid Committee: award, variation, time extension…;
// Evaluation Committee: evaluation or re-evaluation.
const MTYPES = {
  bid: [["award", "Award", "ހަވާލުކުރުން"], ["variation", "Variation", "ވޭރިއޭޝަން"], ["extension", "Time extension", "މުއްދަތު އިތުރުކުރުން"], ["retender", "Re-tender", "އަލުން އިޢުލާނުކުރުން"], ["cancel", "Cancellation", "ބާތިލްކުރުން"], ["other", "Other", "އެހެނިހެން"]],
  eval: [["evaluation", "Bid evaluation", "ބިޑް ވަޒަންކުރުން"], ["reeval", "Re-evaluation", "އަލުން ވަޒަންކުރުން"], ["other", "Other", "އެހެނިހެން"]]
};
const mtype = (k, t) => (MTYPES[k] || []).find(x => x[0] === t) || [t || "other", t || "Other", t || ""];
// Agenda items (one per project). Meetings recorded before items existed count as award / evaluation.
const mItems = m => (Array.isArray(m.items) && m.items.length ? m.items : (m.projectIds || []).map(id => ({ projectId: id, type: m.kind === "eval" ? "evaluation" : "award" }))).filter(it => prj(it.projectId));
const mSummary = m => { const c = {}; mItems(m).forEach(it => { c[it.type] = (c[it.type] || 0) + 1; }); return Object.entries(c).map(([t, n]) => [t, n, mtype(m.kind, t)]); };
const mChip = (k, t) => o("span", { class: "pcc-mt t-" + t }, mtype(k, t)[1]);
const mYear = m => String(m.date || m.at || "").slice(0, 4);
// Variation amount: a minus sign (- or −) means an omission.
const signedMoney = (el, name) => { const v = String(el.value || "").trim(), neg = /^[-−]/.test(v), x = yn(v.replace(/^[-−+]\s*/, "")); if (x == null || Number.isNaN(x)) throw err(name + ": type an amount like 12500.00 (or -12500.00 for an omission)"); return neg ? -x : x; };
const mSeq = m => Number(((m.ref || "").match(/(\d+)\D*$/) || [])[1] || 0);

// Project details a Bid Committee decision needs. Award / variation / time extension need all of them;
// other decisions (re-tender, cancellation…) need none.
const MREQ = [["contract", "Contract value (MVR)", "money"], ["vendor", "Contractor / supplier", "vendor"], ["advertNo", "Iulaan number", "text"], ["advertised", "Iulaan date", "date"], ["bidOpening", "Bid opening", "date"]];
const mNeeds = (k, t) => k === "bid" && ["award", "variation", "extension"].includes(t);
async function meetingEdit(m, k, p, pre) {
  const v = m || {}, date = D(v.date || today()), time = I(v.time || "", { placeholder: "e.g. 10:00" }), end = I(v.end || "", { placeholder: "e.g. 11:30" }), place = I(v.place || "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", { dir: "auto" }), notes = o("textarea", { rows: 2, dir: "auto" });
  const kind = k === "eval" ? "evalmeeting" : "meeting", ref = I(v.ref || "", { placeholder: refPeek(kind), title: "Leave empty: the next number is given automatically" });
  notes.value = v.notes || "";
  const items = new Map(mItems(v).map(it => [it.projectId, { ...it }]));
  if (!m && p) items.set(p.id, { projectId: p.id, type: k === "eval" ? "evaluation" : "award" });
  (pre || []).forEach(it => items.set(it.projectId, { ...it }));
  const q = o("input", { type: "search", placeholder: "Search projects by number or name" }), list = o("div", { class: "pcc-mpick" }), agenda = o("div", { class: "pcc-agenda" });
  const drawList = () => { const s = q.value.trim().toLowerCase(); list.replaceChildren(...PRJ().filter(x => (x.status !== "Cancelled" || items.has(x.id)) && (!s || `${x.ref} ${x.name} ${x.nameDv || ""} ${x.prNumber || ""}`.toLowerCase().includes(s) || items.has(x.id))).sort((a, b) => (items.has(b.id) - items.has(a.id)) || String(a.ref).localeCompare(String(b.ref), undefined, { numeric: true })).slice(0, 60).map(x => o("label", { class: "pcc-chk pcc-mrow" }, o("input", { type: "checkbox", checked: items.has(x.id), onchange: e => { e.target.checked ? items.set(x.id, { projectId: x.id, type: k === "eval" ? "evaluation" : x.contract != null && x.status !== "Not started" && x.status !== "Planned" ? "variation" : "award" }) : items.delete(x.id); drawAgenda(); drawSrc(); } }), o("span", { class: "nowrap" }, x.ref), o("span", { dir: "auto", class: "small" }, x.nameDv || x.name), stChip(x.status)))); };
  q.addEventListener("input", drawList);
  // One line per chosen project: what it is for, and the variation amount / days when it is a variation.
  const drawAgenda = () => {
    const L2 = [...items.values()];
    agenda.replaceChildren(...(L2.length ? L2.map((it, i) => {
      const x = prj(it.projectId), ty = S(MTYPES[k].map(t => [t[0], t[1]]), it.type), note = I(it.note || "", { dir: "auto", placeholder: "Decision / subject (optional)" });
      const amt = MI(it.amount == null ? "" : it.amount < 0 ? -it.amount : it.amount), days = I(it.days ?? "", { inputmode: "numeric", placeholder: "days", style: { width: "80px" } });
      const va = o("span", { class: "pcc-ag-f" }, o("label", {}, "Amount (MVR, − for omission)"), amt), vd = o("span", { class: "pcc-ag-f" }, o("label", {}, "Extra days"), days), vbox = o("div", { class: "pcc-ag-var" }, va, vd);
      const sync = () => { vbox.style.display = ty.value === "variation" || ty.value === "extension" ? "" : "none"; va.style.display = ty.value === "variation" ? "" : "none"; };
      ty.onchange = () => { it.type = ty.value; sync(); }; note.oninput = () => { it.note = note.value; };
      amt.oninput = () => { it._amt = amt.value; }; days.oninput = () => { it.days = days.value.trim() === "" ? null : Number(days.value) || 0; };
      it.amount < 0 && (amt.value = "-" + amt.value); it._amtEl = amt;
      // Required project details, filled in right here (saved to the project with the meeting).
      it._req = it._req || {};
      const reqBox = o("div", { class: "pcc-ag-req" }), drawReq = () => {
        reqBox.replaceChildren(); reqBox.style.display = mNeeds(k, ty.value) ? "" : "none"; if (!mNeeds(k, ty.value)) return;
        MREQ.forEach(([key, lab, kind2]) => {
          const el = it._req[key] || (it._req[key] = kind2 === "money" ? MI(x[key]) : kind2 === "date" ? D(x[key]) : I(x[key] || "", kind2 === "vendor" ? { list: "pcc-mvend", placeholder: "Pick or type" } : {}));
          const mark = () => el.classList.toggle("pcc-req-miss", !String(el.value).trim()); el.oninput = el.onchange = mark; mark();
          reqBox.append(o("label", { class: "pcc-ag-rf" }, o("span", {}, lab, o("b", { class: "pcc-req" }, " **")), el));
        });
      };
      const row = o("div", { class: "pcc-ag-row" }, o("b", { class: "pcc-ag-n" }, i + 1), o("div", { class: "pcc-ag-p" }, o("a", { href: "#", class: "pcc-ag-link", title: "Open this project's Edit box", onclick: e => { e.preventDefault(); PEDIT2(x); } }, o("b", {}, x.ref), o("div", { dir: "auto", class: "small" }, x.nameDv || x.name))), ty, note, vbox);
      row.append(reqBox); const ty0 = ty.onchange; ty.onchange = () => { ty0(); drawReq(); }; drawReq();
      sync(); return row;
    }) : [o("p", { class: "muted small" }, "Tick the projects decided at this meeting.")]));
  };
  const src = o("select", {}), mprev = o("div", { class: "pcc-mmem" }); let mrows = [];
  const stand = () => (STAND()[k] || []);
  const drawSrc = () => { const opts = [...items.keys()].map(id => prj(id)).filter(x => x && (x.committees[k] || []).length), cur = src.value; src.replaceChildren(...(m ? [bt("@keep", "Keep this meeting's members (" + (v.members || []).length + ")", true)] : []), ...(stand().length ? [bt("@stand", "Standing " + KLAB[k] + " (" + stand().length + ")", !m)] : []), ...opts.map(x => bt(x.id, `Committee of ${x.ref} (${x.committees[k].length})`, false))); cur && [...src.options].some(op => op.value === cur) && (src.value = cur); showPrev(); };
  const showPrev = () => { const L2 = src.value === "@keep" ? v.members || [] : src.value === "@stand" ? stand() : ((prj(src.value) || {}).committees || {})[k] || []; mrows = L2.map(x => ({ x, lf: leaveFields(x) })); mprev.replaceChildren(...(L2.length ? mrows.map(({ x, lf }) => o("div", { class: "pcc-mrow2" }, o("span", { dir: "auto" }, (x.nameDv || x.name) + " · " + (x.role || "Member")), lf.el)) : [o("p", { class: "muted small" }, `No ${KLAB[k]} members yet — add the standing committee under Templates › Standing committees, or on a project.`)])); };
  src.addEventListener("change", showPrev);
  drawList(); drawAgenda(); drawSrc();
  const ok = await form((m ? "Edit " : "New ") + KLAB[k] + " meeting", [["Meeting date", date], ["Meeting no. (automatic if empty)", ref], ["Starts", time], ["Ends", end], o("div", { style: { gridColumn: "1/-1" } }, L("Place", place), o("label", { style: { marginTop: "10px" } }, "Projects at this meeting"), q, list, o("label", { style: { marginTop: "10px" } }, "Agenda — what each project is for"), k === "bid" ? o("p", { class: "muted small", style: { margin: "2px 0 4px" } }, "Boxes marked ", o("b", { class: "pcc-req" }, "**"), " must be filled for an award, variation or time extension. They are saved to the project.") : null, o("datalist", { id: "pcc-mvend" }, K.sa().map(x => o("option", { value: x }))), agenda, L("Committee members", src), mprev, L("Notes", notes))], {
    check: () => { if (!date.value) throw err("Choose the meeting date"); if (items.size < 1) throw err("Tick at least one project"); if (!mrows.length) throw err(`Add ${KLAB[k]} members first`);
      items.forEach(it => { if (it.type === "variation" && it._amtEl && it._amtEl.value.trim()) signedMoney(it._amtEl, "Variation amount"); });
      const miss = []; items.forEach(it => { if (!mNeeds(k, it.type)) return; const x = prj(it.projectId); MREQ.forEach(([key, lab]) => { const el = (it._req || {})[key]; if (!el || !String(el.value).trim()) { miss.push(x.ref + ": " + lab); el && el.classList.add("pcc-req-miss"); } else if (key === "contract") parseMoney(el, x.ref + " contract value"); }); });
      if (miss.length) throw err("Fill the boxes marked ** — " + miss.slice(0, 3).join("; ") + (miss.length > 3 ? ` and ${miss.length - 3} more` : "")); },
  });
  if (!ok) return;
  save(() => {
    need("pdocs");
    const members = mrows.map(({ x, lf }) => ({ ...JSON.parse(JSON.stringify(x)), ...lf.read() }));
    const its = [...items.values()].filter(it => prj(it.projectId)).map(it => { const r = { projectId: it.projectId, type: it.type }; it.note && it.note.trim() && (r.note = it.note.trim()); if (it.type === "variation" && it._amtEl && it._amtEl.value.trim()) r.amount = signedMoney(it._amtEl, "Variation amount"); else if (it.type === "variation" && it.amount != null && !it._amtEl) r.amount = it.amount; if ((it.type === "variation" || it.type === "extension") && it.days != null) r.days = it.days; return r; });
    const o2 = { kind: k, date: date.value, time: time.value.trim(), start: time.value.trim(), end: end.value.trim(), place: place.value.trim(), notes: notes.value.trim(), items: its, projectIds: its.map(it => it.projectId), members };
    let mm = m;
    if (m) Object.assign(m, o2, ref.value.trim() ? { ref: ref.value.trim() } : {}); else { mm = { id: uid(), ref: ref.value.trim() || refNext(kind, null, date.value.slice(0, 4)), ...o2, by: me(), at: Vt() }; MEETS().push(mm); }
    items.forEach(it => { if (!mNeeds(k, it.type) || !it._req) return; const x = prj(it.projectId), ch = [];
      MREQ.forEach(([key, lab, kind2]) => { const el = it._req[key]; if (!el) return; const val = kind2 === "money" ? parseMoney(el, lab) : el.value.trim(); if (String(x[key] ?? "") !== String(val ?? "")) { x[key] = val; ch.push(lab); } });
      ch.length && audit(x, "Details entered at the Bid Committee meeting", ch.join(", ")); });
    meetingSync(mm);
    o2.projectIds.forEach(id => audit(prj(id), `${KLAB[k]} meeting ${m ? "changed" : "recorded"}`, `${mm.ref} · ${fd(o2.date)} · ${mtype(k, its.find(it => it.projectId === id).type)[1]}`));
  }, m ? "Meeting saved" : "Meeting recorded");
}
// The project's own meeting fields (used by single-project documents) follow the meeting
// that awarded / evaluated it, unless staff typed different ones.
function meetingSync(m) {
  const pre = m.kind === "eval" ? "evalMeeting" : "bidMeeting", main = m.kind === "eval" ? ["evaluation", "reeval"] : ["award"];
  mItems(m).filter(it => main.includes(it.type)).forEach(it => { const p = prj(it.projectId); if (!p || (p[pre + "No"] && p[pre + "Id"] !== m.id)) return;
    Object.assign(p, { [pre + "Id"]: m.id, [pre + "No"]: m.ref, [pre + "Date"]: m.date, [pre + "Time"]: m.time || "", [pre + "Start"]: m.start || m.time || "", [pre + "End"]: m.end || "" }, m.kind === "eval" ? { evaluation: m.date, evaluationTime: m.start || m.time || "" } : { award: m.date }); });
}
async function meetingDelete(m) {
  const n = Z().pdocs.filter(d => d.meetingId === m.id).length;
  if (!(await Mt("Delete meeting " + m.ref + "?", [o("p", {}, "The meeting is removed from the register. Its number is not reused." + (n ? ` The ${n} document(s) already generated stay in the projects' Files.` : ""))], [{ label: "Cancel", value: !1 }, { label: "Delete", primary: !0, value: !0 }]))) return;
  save(() => { need("pdocs"); const i = MEETS().indexOf(m); i >= 0 && MEETS().splice(i, 1); const pre = m.kind === "eval" ? "evalMeeting" : "bidMeeting"; PRJ().forEach(p => { if (p[pre + "Id"] === m.id) delete p[pre + "Id"]; }); }, "Meeting deleted");
}

// ---------- Committee meetings register (all meetings of the year in one table) ----------
function MEETPAGE(n, [y, kf]) {
  const yr = /^\d{4}$/.test(y || "") ? y : today().slice(0, 4), K2 = kf === "bid" || kf === "eval" ? kf : "", ed = can("pdocs");
  const all = MEETS().filter(m => mYear(m) === yr), L2 = all.filter(m => !K2 || m.kind === K2).sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.kind.localeCompare(b.kind) || mSeq(a) - mSeq(b));
  const ys = S([...new Set([today().slice(0, 4), yr, ...MEETS().map(mYear).filter(Boolean)])].sort().map(x => [x, x]), yr, { style: { width: "auto", minWidth: "110px" } });
  ys.addEventListener("change", () => nav("#/projects/meetings/" + ys.value + (K2 ? "/" + K2 : "")));
  const cnt = t => all.reduce((a, m) => a + mItems(m).filter(it => it.type === t).length, 0);
  // Meetings typed only on a project (Edit › Committee meetings) that are not in the register yet.
  const loose = [];
  ["bid", "eval"].forEach(k => { const pre = k === "eval" ? "evalMeeting" : "bidMeeting", g = {};
    PRJ().filter(p => p[pre + "No"] && !p[pre + "Id"] && String(p[pre + "Date"] || "").slice(0, 4) === yr && !MEETS().some(m => m.kind === k && m.ref === p[pre + "No"])).forEach(p => { const key = p[pre + "No"] + "|" + (p[pre + "Date"] || ""); (g[key] = g[key] || { k, no: p[pre + "No"], date: p[pre + "Date"], time: p[pre + "Time"] || "", P: [] }).P.push(p); });
    loose.push(...Object.values(g)); });
  const waiting = PRJ().filter(p => p.status !== "Cancelled" && MEETS().some(m => m.kind === "eval" && mItems(m).some(it => it.projectId === p.id)) && !MEETS().some(m => m.kind === "bid" && mItems(m).some(it => it.projectId === p.id && it.type === "award")) && !p.bidMeetingNo);
  n.append(o("div", { class: "row" }, o("h1", { style: { margin: 0 } }, "Committee meetings " + yr), o("div", { class: "grow right pcc-acts" }, ed ? btn("New Bid Committee meeting", () => meetingEdit(null, "bid"), "primary") : null, ed ? btn("New Evaluation meeting", () => meetingEdit(null, "eval")) : null)),
    PCNAV("meet"),
    o("div", { class: "card toolbar" }, o("div", { class: "row", style: { alignItems: "center" } }, o("div", {}, o("label", {}, "Year"), ys), o("div", { class: "grow muted" }, `${all.length} meeting${all.length === 1 ? "" : "s"} · numbered automatically in order (Bid Committee ${refPeek("meeting").replace(/\d+$/, "…")}, Evaluation ${refPeek("evalmeeting").replace(/\d+$/, "…")})`)),
      o("div", { class: "pills", style: { marginTop: "12px" } }, [["", "All meetings", all.length], ["bid", "Bid Committee", all.filter(m => m.kind === "bid").length], ["eval", "Evaluation Committee", all.filter(m => m.kind === "eval").length]].map(([k, l, c]) => o("a", { href: `#/projects/meetings/${yr}${k ? "/" + k : ""}`, class: "pill" + (k === K2 ? " on" : ""), style: { textDecoration: "none" } }, l, o("span", {}, String(c)))))),
    o("div", { class: "stats pcc-kpis" }, [["Bid Committee meetings", all.filter(m => m.kind === "bid").length], ["Evaluation meetings", all.filter(m => m.kind === "eval").length], ["Awards decided", cnt("award")], ["Variations decided", cnt("variation")]].map(([l, v]) => o("div", { class: "stat" }, o("div", { class: "k" }, l), o("div", { class: "v" }, String(v))))),
    waiting.length ? o("div", { class: "card pcc-planstate" }, o("b", {}, "Evaluated, waiting for the Bid Committee (" + waiting.length + ")"), o("div", { class: "pcc-mwait" }, waiting.map(p => o("a", { href: "#/project/" + p.id, class: "pcc-tag" }, p.ref))), ed ? btn("New Bid Committee meeting for these", () => meetingEdit(null, "bid", null, waiting.map(p => ({ projectId: p.id, type: "award" }))), "small") : null) : null,
    o("div", { class: "card flush" }, L2.length ? tbl(["#", "Meeting no.", "Date", "Committee", "Agenda", "Projects", ""], L2.map((m, i) => {
      const its = mItems(m), docs = Z().pdocs.filter(d => d.meetingId === m.id), uniq = new Set(docs.map(d => d.templateCode || d.title)).size, pres = (m.members || []).filter(x => !x.onLeave).length;
      return o("tr", { class: ed ? "click" : "", onclick: e => { ed && !e.target.closest("a,button") && meetingEdit(m, m.kind); } },
        o("td", {}, i + 1), o("td", { class: "nowrap" }, o("b", {}, m.ref || "—")), o("td", { class: "nowrap" }, fd(m.date), m.time ? o("div", { class: "muted small" }, m.time + (m.end ? "–" + m.end : "")) : null),
        o("td", {}, o("span", { class: "pcc-mk k-" + m.kind }, m.kind === "eval" ? "Evaluation" : "Bid Committee"), o("div", { class: "muted small", title: "Members present / total" }, pres + " / " + (m.members || []).length + " present")),
        o("td", { class: "small" }, mSummary(m).map(([t, c, ty]) => o("div", {}, c + " × ", mChip(m.kind, t)))),
        o("td", { style: { minWidth: "220px" } }, its.map((it, j) => { const p = prj(it.projectId); return o("div", { class: "pcc-mproj" }, o("span", { class: "muted small" }, (j + 1) + "."), o("a", { href: `#/project/${p.id}/${m.kind}` }, p.ref), mChip(m.kind, it.type), it.amount != null ? o("span", { class: "small money" }, (it.amount < 0 ? "−" : "+") + ht(Math.abs(it.amount))) : null, it.days ? o("span", { class: "small muted" }, "+" + it.days + "d") : null, o("div", { dir: "auto", class: "small muted pcc-mpn" }, p.nameDv || p.name)); })),
        o("td", { class: "pcc-macts" }, ed ? btn("Documents", () => meetingGen(m), "small") : null, docs.length ? o("div", { class: "small pcc-ok" }, uniq + " generated") : null, ed ? btn("Delete", () => meetingDelete(m), "small danger") : null));
    })) : o("div", { class: "empty", style: { padding: "26px" } }, o("p", {}, "No " + (K2 ? KLAB[K2] + " " : "committee ") + "meetings recorded for " + yr + "."), ed ? o("p", { class: "muted small" }, "Use New Bid Committee meeting / New Evaluation meeting. Each meeting gets the next number and lists the projects it decided — one award, several awards, variations, or a mix.") : null)),
    loose.length ? o("details", { class: "card" }, o("summary", { style: { cursor: "pointer", fontWeight: 700 } }, `Meetings typed on projects only (${loose.length}) — not in the register yet`),
      o("p", { class: "muted small" }, "These meeting numbers were typed in a project's Edit form. Add them to the register to keep every meeting in one list."),
      tbl(["Committee", "Meeting no.", "Date", "Projects", ""], loose.sort((a, b) => String(a.date).localeCompare(String(b.date))).map(g => o("tr", {}, o("td", {}, KLAB[g.k]), o("td", {}, g.no), o("td", {}, fd(g.date)), o("td", {}, g.P.map(p => o("div", { class: "small" }, p.ref, " ", o("span", { dir: "auto" }, p.nameDv || p.name)))),
        o("td", {}, ed ? btn("Add to register", () => save(() => { need("pdocs"); const pre = g.k === "eval" ? "evalMeeting" : "bidMeeting", src = g.P.find(p => (p.committees[g.k] || []).length); const mm = { id: uid(), ref: g.no, kind: g.k, date: g.date || "", time: g.time, start: g.time, end: g.P[0][pre + "End"] || "", place: "މިލަންދޫ ކައުންސިލްގެ އިދާރާ", notes: "", items: g.P.map(p => ({ projectId: p.id, type: g.k === "eval" ? "evaluation" : "award" })), projectIds: g.P.map(p => p.id), members: JSON.parse(JSON.stringify(src ? src.committees[g.k] : STAND()[g.k] || [])), by: me(), at: Vt() }; MEETS().push(mm); g.P.forEach(p => { p[pre + "Id"] = mm.id; }); }, "Added to the register"), "small") : null))))) : null);
}
function meetingData(m, focus) {
  const P = mItems(m).map(it => prj(it.projectId)).filter(Boolean), first = focus || P[0];
  const mem = m.members.map(memberData);
  const d = dataFor(first, { meeting_ref: m.ref || "", meeting_date: Xt(m.date), meeting_date_dv: dvDate(m.date), meeting_date_en: enDate(m.date), meeting_date_hijri: hijri(m.date), meeting_time: m.time || "", meeting_place: m.place || "", meeting_notes: m.notes || "", project_count: P.length, letter_date: Xt(m.date), letter_date_dv: dvDate(m.date), letter_date_hijri: hijri(m.date) });
  d[m.kind + "_members"] = mem; numberedMembers(d, m.kind, mem);
  d[m.kind + "_meeting_no"] = m.ref || ""; d[m.kind + "_meeting_date"] = Xt(m.date); d[m.kind + "_meeting_date_dv"] = dvDate(m.date); d[m.kind + "_meeting_date_en"] = enDate(m.date); d[m.kind + "_meeting_date_hijri"] = hijri(m.date);
  d[m.kind + "_meeting_time"] = m.time || ""; d[m.kind + "_meeting_start_time"] = m.start || m.time || ""; d[m.kind + "_meeting_end_time"] = m.end || ""; d[m.kind + "_meeting_year"] = isISO(m.date) ? m.date.slice(0, 4) : d[m.kind + "_meeting_year"]; d[m.kind + "_meeting_seq"] = String(Number(((m.ref || "").match(/(\d+)\D*$/) || [])[1] || "") || "");
  const IT = mItems(m);
  d.projects = P.map((p, i) => { const x = dataFor(p), it = IT.find(y => y.projectId === p.id) || { type: m.kind === "eval" ? "evaluation" : "award" }, ty = mtype(m.kind, it.type);
    const r = { ...scalars(x), no: i + 1, bidders: x.bidders, bid_members: x.bid_members, eval_members: x.eval_members, item_type: ty[1], item_type_dv: ty[2], item_code: ty[0], item_note: it.note || "", is_award: it.type === "award", is_variation: it.type === "variation", is_extension: it.type === "extension",
      variation_amount: it.amount == null ? "" : ht(Math.abs(it.amount)), variation_kind_dv: it.amount == null ? "" : it.amount < 0 ? "ކުޑަކުރުން" : "އިތުރުކުރުން", variation_amount_words_dv: it.amount == null ? "" : dvMoneyWords(Math.abs(it.amount)), variation_days: it.days == null ? "" : String(it.days),
      contract_after_variation: it.amount != null && p.contract != null ? ht(p.contract + it.amount) : "" };
    return r; });
  ["award", "variation", "extension", "evaluation"].forEach(t => { const L3 = d.projects.filter(r => r.item_code === t || (t === "evaluation" && r.item_code === "reeval")).map((r, i) => ({ ...r, no: i + 1 })); d[t === "evaluation" ? "evaluations" : t + "s"] = L3; d[t + "_count"] = L3.length; });
  const mine = d.projects.find(r => r.ref_no === first.ref) || d.projects[P.indexOf(first)] || {};
  ["item_type", "item_type_dv", "item_code", "item_note", "is_award", "is_variation", "is_extension", "variation_amount", "variation_kind_dv", "variation_amount_words_dv", "variation_days", "contract_after_variation"].forEach(k => { k in mine && (d[k] = mine[k]); });
  d.agenda_dv = mSummary(m).map(([t, c, ty]) => c + " " + ty[2]).join("، "); d.agenda = mSummary(m).map(([t, c, ty]) => c + " " + ty[1]).join(", "); d.meeting_seq = String(mSeq(m) || ""); d.meeting_year = mYear(m);
  d.meeting_date_dv_ymd = dvYMD(m.date); d[m.kind + "_meeting_date_dv_ymd"] = dvYMD(m.date); d.meeting_date_dv_dmy = dvDMY(m.date); d[m.kind + "_meeting_date_dv_dmy"] = dvDMY(m.date); d[m.kind + "_meeting_date_dv_both"] = dvBoth(m.date);
  return addYMD(d);
}

async function meetingGen(m) {
  try {
    need("pdocs");
    const P = mItems(m).map(it => prj(it.projectId)).filter(Boolean);
    if (!P.length) throw err("The meeting has no projects");
    const group = KLAB[m.kind], cands = [];
    // Every template of the committee's group. A template that repeats a block per project
    // ({#projects}…{/projects}) makes one document for the whole meeting; any other template
    // (your own one-project formats) makes one document per project, filled with this meeting's
    // number, date, time and members.
    for (const t of TPL().filter(x => x.active !== false && x.group === group).sort((a, b) => (a.order || 0) - (b.order || 0))) cands.push({ t, multi: await meetingTpl(t), own: !String((curVer(t) || {}).fileId || "").startsWith("demo:") });
    if (!cands.length) throw err(`No templates in the ${group} group yet — upload them under Templates.`);
    const hasOwn = cands.some(c => c.own);
    const cbs = cands.map(c => o("input", { type: "checkbox", checked: hasOwn ? c.own : c.multi }));
    // Members with their leave status: leave marked on any of the meeting's projects is picked up here too.
    const same = (a, b) => (a.nameDv && a.nameDv === b.nameDv) || (a.name && a.name === b.name);
    const mrows = m.members.map(x => { const src = P.map(p => (p.committees[m.kind] || []).find(y => same(x, y))).find(y => y && y.onLeave); return { x, lf: leaveFields(src && !x.onLeave ? { onLeave: true, leaveText: src.leaveText } : x) }; });
    const how = c => c.multi ? "one for the whole meeting" : P.length > 1 ? `one per project (${P.length})` : "for this project";
    if (!(await Mt(`Documents for ${m.ref || "the meeting"} · ${fd(m.date)}`, [o("p", {}, `${P.length} project${P.length === 1 ? "" : "s"}: ${P.map(p => p.ref).join(", ")}`), o("h4", {}, "Members at this meeting"), o("div", { class: "pcc-mmem" }, mrows.map(({ x, lf }) => o("div", { class: "pcc-mrow2" }, o("span", { dir: "auto", lang: x.nameDv ? "dv" : null }, (x.nameDv || x.name) + " · " + (x.role || "Member")), lf.el))),
      o("h4", {}, "Documents"), o("p", { class: "muted small" }, "Your uploaded templates are ticked. Each is filled with this meeting's number, date, time and members. A template with {#projects}…{/projects} makes one document listing every project; other templates make one document per project."),
      ...cands.map((c, i) => o("label", { class: "pcc-chk", style: { display: "flex", margin: "6px 0", gap: "8px", alignItems: "center" } }, cbs[i], o("span", { class: "pcc-fmt f-" + c.t.type }, c.t.type === "xlsx" ? "XLSX" : "DOCX"), o("span", {}, o("b", {}, c.t.code), " ", c.t.nameEn, o("span", { class: "muted small" }, " · " + how(c) + (c.t.perMember ? " · one per member present" : "") + (c.own ? "" : " · built-in sample format")))))], [{ label: "Cancel", value: !1 }, { label: "Generate", primary: !0, value: !0 }]))) return;
    m.members = mrows.map(({ x, lf }) => Object.assign(x, lf.read()));
    const all = [];
    for (const [i, c] of cands.entries()) {
      if (!cbs[i].checked) continue;
      const t = c.t;
      if (c.multi) {
        const data = meetingData(m);
        const out = await generateDocs(P[0], t, applyMap(t, data, t.custom || {}), { key: "meet" + m.id, ref: m.ref });
        out.forEach(f => {
          f.doc.meetingId = m.id; f.doc.title = `${f.doc.title} — meeting ${fd(m.date)} (${P.length} projects)`;
          P.slice(1).forEach(p => { Z().pdocs.push({ ...f.doc, id: uid(), projectId: p.id, snapshot: {} }); audit(p, "Generated " + t.code + " for the meeting of " + fd(m.date)); });
        });
        all.push(...out);
      } else {
        for (const p of P) {
          const data = meetingData(m, p);
          const out = await generateDocs(p, t, applyMap(t, data, t.custom || {}), { key: "meet" + m.id, ref: m.ref });
          out.forEach(f => { f.doc.meetingId = m.id; f.doc.title = `${f.doc.title} — meeting ${fd(m.date)}`; });
          all.push(...out);
        }
      }
    }
    if (!all.length) return;
    K.Qt();
    all.length === 1 ? ii(new Blob([all[0].data], { type: MIME[extOf(all[0].name)] }), all[0].name) : ii(new Blob([await zipFiles(all)], { type: MIME.zip }), `${safeName(m.ref || "meeting")}_${m.date}.zip`);
    xt(`${all.length} document${all.length === 1 ? "" : "s"} saved to each project's Files`);
    K.le();
  } catch (e) { xt(e.message, "err"); }
}
