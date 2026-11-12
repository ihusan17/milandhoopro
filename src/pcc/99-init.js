// Routes, bell / dashboard / search hooks, Work Logs page, reference-number settings, sample data.

function WLOG(n) {
  const fp = S([["", "All projects"], ...PRJ().map(p => [p.id, `${p.ref} — ${p.name}`])], ""), fm = o("input", { type: "month" }), box = o("div", { class: "card flush" });
  const addSel = S(PRJ().filter(p => !["Cancelled", "Closed"].includes(p.status)).map(p => [p.id, `${p.ref} — ${p.name}`]), ""), addBox = o("div", {});
  const drawAdd = () => { const p = prj(addSel.value); addBox.replaceChildren(p ? logForm(p) : o("p", { class: "muted" }, "Add a project first.")); };
  addSel.addEventListener("change", drawAdd);
  const draw = () => {
    const L2 = PRJ().flatMap(p => (p.logs || []).map(l => ({ l, p }))).filter(({ l, p }) => (!fp.value || p.id === Number(fp.value)) && (!fm.value || String(l.date).startsWith(fm.value))).sort((a, b) => String(b.l.date).localeCompare(String(a.l.date)));
    box.replaceChildren(L2.length ? tbl(["Date", "Project", "Activity", "Workers", "Weather", "Issues", "By"], L2.map(({ l, p }) => o("tr", {}, o("td", { class: "nowrap" }, fd(l.date)), o("td", {}, o("a", { href: `#/project/${p.id}/logs`, dir: "auto" }, p.ref + " " + p.name)), o("td", { dir: "auto", class: "pcc-pre", style: { minWidth: "240px" } }, l.text, (l.photos || []).length ? o("span", { class: "pcc-tag" }, l.photos.length + " photo" + (l.photos.length === 1 ? "" : "s")) : null), o("td", {}, l.workers ?? ""), o("td", {}, l.weather || ""), o("td", { dir: "auto", class: "small" }, l.issues || ""), o("td", { dir: "auto" }, l.by || "")))) : empty("No work log entries."));
  };
  fp.addEventListener("change", draw); fm.addEventListener("change", draw);
  n.append(o("h1", {}, "Work Logs"), PCNAV("log"), can("plogs") && PRJ().length ? o("div", { class: "card toolbar" }, L("Add an entry for", addSel)) : null, addBox, o("div", { class: "card toolbar" }, o("div", { class: "grid2" }, L("Project", fp), L("Month", fm))), box);
  can("plogs") && drawAdd(); draw();
}

function REFSET(n) {
  if (!can("templates")) return;
  const z = Z(), yr = today().slice(0, 4);
  n.append(o("div", { class: "card" }, o("h3", {}, "Reference numbers"), o("p", { class: "muted small" }, "Patterns: {YYYY} year, {YY} short year, {###} running number (as many # as digits), {PRJ} project reference. Numbers restart each year and are never reused."), tbl(["Documents", "Pattern", "Next number", ""], REFKINDS.map(([k, l]) => { const inp = I(refPattern(k), { style: { minWidth: "260px" } }), nx = o("span", { class: "nowrap" }, refPeek(k)); inp.addEventListener("input", () => { nx.textContent = refFormat(inp.value, ((z.refSeq || {})[k + ":" + yr] || 0) + 1, yr, { ref: "MC-PRJ/" + yr + "/001" }); }); return o("tr", {}, o("td", {}, l), o("td", {}, inp), o("td", {}, nx), o("td", {}, btn("Save", () => save(() => { need("templates"); if (!/\{#+\}/.test(inp.value)) throw err("The pattern needs a running number such as {###}"); z.refPatterns = z.refPatterns || {}; z.refPatterns[k] = inp.value.trim(); }, "Pattern saved"), "small"))); }))));
}

// ---------- sample data (easy to remove) ----------
const SEEDV = [["Island Builders Pvt Ltd", "އައިލެންޑް ބިލްޑާޒް"], ["Noonu Construction", "ނޫނު ކޮންސްޓްރަކްޝަން"], ["Shaviyani Works Co.", "ށަވިޔަނި ވޯކްސް"], ["Blue Lagoon Engineering", "ބްލޫ ލަގޫން އިންޖިނިއަރިންގ"]];
function seedLoad() {
  save(() => {
    need("projects");
    const z = Z(), t = today(), yr = t.slice(0, 4);
    SEEDV.forEach(([nm, dv]) => { if (!(z.vendors || []).some(v => v.name === nm)) (z.vendors = z.vendors || []).push({ name: nm, nameDv: dv, category: (z.vendorCats || [])[0] || "Other", status: "Active", phone: "7" + String(Math.floor(Math.random() * 899999 + 100000)), address: "Sh. Milandhoo", seed: true }); });
    const com = () => [["Ahmed Ali", "އަޙްމަދު ޢަލީ", "Council Officer", "ކައުންސިލް އޮފިސަރ", "Chair"], ["Aishath Naseer", "އާއިޝަތު ނަޞީރު", "Assistant Procurement Officer", "އެސިސްޓެންޓް ޕްރޮކިއުމެންޓް އޮފިސަރ", "Member"], ["Mohamed Shareef", "މުޙައްމަދު ޝަރީފް", "Engineer", "އިންޖިނިއަރު", "Secretary"]].map(([a, b, c, d, e]) => ({ id: uid() + Math.random(), name: a, nameDv: b, designation: c, designationDv: d, role: e }));
    const mk = (en, dv, days, dur, val, extra = {}) => {
      const id = Math.max(z.nextProjectId || 1, ...PRJ().map(x => x.id + 1)); z.nextProjectId = id + 1;
      const handover = dAdd(t, days - dur), p = { id, seed: true, nameEn: en, nameDv: dv, name: en, type: "Works", category: "Construction", status: "Ongoing", location: "Sh. Milandhoo", unit: (z.lists.units[0] || {}).label || "", officer: "Ahmed Ali", fund: "Council budget", estimate: Math.round(val * 1.08), contract: val, prNumber: `${100 + id}/${yr}`, advertNo: `(IUL)351-PRO/${yr}/${String(10 + id).padStart(3, "0")}`, advertised: dAdd(handover, -60), bidOpening: dAdd(handover, -40), evaluation: dAdd(handover, -35), award: dAdd(handover, -25), agreement: dAdd(handover, -10), handover, duration: dur, dueManual: false, progress: Math.max(5, Math.min(95, Math.round((dur - days) / dur * 100) - 8)), retentionPct: 5, retentionDays: null, descDv: dv + " ގެ މަސައްކަތް.", desc: "Sample project — delete with Remove sample data.", logs: [], cases: [], reports: [], letters: [], payments: [], eots: [], activity: [], retReports: [], committees: { bid: com(), eval: com() }, checklist: defaultChecklist("Works"), createdAt: Vt(), ...extra };
      const vs = SEEDV.slice(0, 3); p.bidders = vs.map(([nm], i) => ({ id: uid() + i, vendor: nm, amount: Math.round(val * (1 + i * 0.07)), validity: "90 days", duration: dur + i * 10, tech: [72, 65, 58][i], fin: [28, 26, 25][i], total: null, responsive: true, remarks: "", docs: Object.fromEntries(BIDDOCS.map(d => [d, i < 2])) }));
      p.bidders.forEach(b => { b.total = b.tech + b.fin; }); autoRank(p); p.bidders[0].awarded = true; p.vendor = p.bidders[0].vendor;
      recalcDue(p); p.ref = refNext("project", p); p.checklist.slice(0, 6).forEach(c => { c.done = true; c.date = p.handover; c.by = "Ahmed Ali"; });
      p.logs.push({ id: uid(), date: dAdd(t, -2), text: "ފައުންޑޭޝަން ކޮންކްރީޓް އަޅައިފި. Foundation concrete poured on the east side.", workers: 14, materials: "Cement 120 bags, steel 2 t", weather: "Sunny", issues: "", photos: [], by: "Ahmed Ali", at: Vt() }, { id: uid() + 1, date: dAdd(t, -9), text: "Site cleared and set out.", workers: 9, materials: "", weather: "Cloudy", issues: "Late delivery of aggregate", photos: [], by: "Ahmed Ali", at: Vt() });
      p.payments.push({ id: uid(), kind: "Advance", pct: 20, amount: Math.round(val * .2), retention: 0, trigger: "On signing", status: "Paid", paidDate: dAdd(handover, 3), memoRef: "" }, { id: uid() + 1, kind: "Interim", pct: 40, amount: Math.round(val * .4), retention: Math.round(val * .4 * .05), trigger: "On 50% progress", status: "Planned", invoice: "" });
      audit(p, "Sample project created"); PRJ().push(p); return p;
    };
    mk("Milandhoo harbour wall repair", "މިލަންދޫ ބަނދަރުގެ ފާރު މަރާމާތުކުރުން", 45, 150, 185000000);
    mk("Council office roof replacement", "ކައުންސިލް އިދާރާގެ ފުރާޅު ބަދަލުކުރުން", 6, 90, 42575050);
    mk("Island road paving — phase 1", "ރަށުގެ މަގު ރާޅުކުރުން - ފަސް 1", -12, 120, 96000000);
    const ret = mk("Mosque ablution block", "މިސްކިތުގެ ވުޟޫކުރާ ތަން", -80, 100, 31000000, {});
    ret.status = "In retention"; ret.done = dAdd(t, -70); ret.progress = 100; recalcDue(ret); ret.checklist.forEach((c, i) => { if (i < 13) { c.done = true; c.date = ret.done; c.by = "Ahmed Ali"; } });
    ret.payments.forEach(x => { x.status = "Paid"; x.paidDate = x.paidDate || ret.done; });
    const items = [["Office furniture", "އޮފީހުގެ ފަރުނީޗަރު", "Goods", "01-20", 4500000], ["Waste management service", "ކުނި މެނޭޖްކުރުމުގެ ޚިދުމަތް", "Non-consultancy", "04-12", 12000000], ["Harbour lighting upgrade", "ބަނދަރުގެ އަލިކުރުން ރަނގަޅުކުރުން", "Works", "05-03", 38000000], ["Road design consultancy", "މަގުގެ ޑިޒައިން ކޮންސަލްޓެންސީ", "Consultancy", "07-15", 6500000], ["Football ground fencing", "ފުޓުބޯޅަ ދަނޑު ފާރުކުރުން", "Works", "10-05", 22000000]];
    z.plan = z.plan || [];
    items.forEach(([en, dv, ty, md, est]) => { const id = Math.max(z.nextPlanId || 1, ...z.plan.map(k => k.id + 1)); z.nextPlanId = id + 1; const d0 = `${yr}-${md}`; z.plan.push({ id, pid: nextPid(yr), procNo: "SAMPLE/" + yr + "/" + id, year: Number(yr), item: en, itemDv: dv, type: ty, estimate: est, method: ty === "Consultancy" ? "QCBS" : "NCB", funding: "Domestic", budget: [est, null, null], dates: ty === "Consultancy" ? { reoi: d0, award: dAdd(d0, 45) } : { ifb: d0, opening: dAdd(d0, 10), award: dAdd(d0, 20) }, remarks: "J-GOM", unit: "", status: "Planned", notes: "Sample item", projectId: null, seed: true }); });
  }, "Sample data loaded — remove it any time with Remove sample data");
}
function seedRemove() {
  jt("Remove all sample projects, plan items, vendors and their documents? Your own data is not touched.", "Remove").then(ok => ok && save(() => {
    need("projects");
    const z = Z(), ids = new Set(PRJ().filter(p => p.seed).map(p => p.id));
    z.projects = PRJ().filter(p => !p.seed); z.plan = (z.plan || []).filter(x => !x.seed);
    z.pdocs = z.pdocs.filter(d => !ids.has(d.projectId)); z.pfiles = z.pfiles.filter(d => !ids.has(d.projectId));
    const used = new Set([...PRJ().map(p => p.vendor), ...z.cases.flatMap(c => c.rfqs.map(r => r.vendor))]);
    z.vendors = (z.vendors || []).filter(v => !v.seed || used.has(v.name));
  }, "Sample data removed"));
}

// ---------- hooks into the bell, dashboard and global search ----------
window.__pcc = {
  notes(N, t) {
    PRJ().forEach(p => {
      const d = daysLeft(p);
      if (d != null && d < 0) for (let i = N.length - 1; i >= 0; i--) if (N[i].id === "od" + p.id + p.due) N.splice(i, 1);
      if (d != null && d >= 8 && d <= 14) N.push({ id: "d14" + p.id + p.due, k: "purple", i: "cal", t: "Project due in 2 weeks", s: `${p.ref} ${p.name} · ${fd(p.due)}`, h: "#/project/" + p.id, at: p.due });
      else if (d != null && d >= 15 && d <= 30) N.push({ id: "d30" + p.id + p.due, k: "info", i: "cal", t: "Project due within 30 days", s: `${p.ref} ${p.name} · ${fd(p.due)}`, h: "#/project/" + p.id, at: p.due });
      if (d != null && d < 0) N.push({ id: "odd" + p.id + t, k: "bad", i: "alert", t: `Project overdue by ${-d} days`, s: `${p.ref} ${p.name}`, h: "#/project/" + p.id, at: t });
      const r = retLeft(p);
      if (r != null && r <= 30) N.push({ id: "ret" + p.id + p.retentionEnd, k: r < 0 ? "bad" : "warn", i: "shield", t: r < 0 ? "Retention period ended — release due" : `Retention ends in ${r} days`, s: `${p.ref} ${p.name}`, h: `#/project/${p.id}/retention`, at: p.retentionEnd });
      (p.payments || []).forEach(x => { if (x.status === "Memo issued") N.push({ id: "pm" + x.id, k: "warn", i: "wallet", t: "Payment memo issued, not yet paid", s: `${p.ref} · ${x.kind} ${mvr(x.amount)}`, h: `#/project/${p.id}/payments`, at: x.at || t }); else if (x.status === "Planned" && x.invoice && !x.memoRef) N.push({ id: "pmi" + x.id, k: "info", i: "wallet", t: "Invoice received — payment memo pending", s: `${p.ref} · ${x.kind}`, h: `#/project/${p.id}/payments`, at: x.at || t }); });
    });
    const q = Math.floor((Number(t.slice(5, 7)) - 1) / 3) + 1;
    (Z().plan || []).filter(x => String(x.year) === t.slice(0, 4) && qOf(x) && qOf(x) < q && x.status === "Planned" && !x.projectId).forEach(x => N.push({ id: "pl" + x.id + "late", k: "warn", i: "list", t: `Plan item not started (Q${qOf(x)})`, s: (x.procNo ? x.procNo + " " : "") + planName(x), h: "#/plan/" + x.year, at: t }));
  },
  tasks(T, t) {
    PRJ().forEach(p => {
      const r = retLeft(p); r != null && r <= 30 && T.push({ id: "rt" + p.id + p.retentionEnd, t: r < 0 ? "Release retention" : "Retention ending", s: p.name, h: `#/project/${p.id}/retention`, d: p.retentionEnd, bad: r < 0 });
      (p.payments || []).forEach(x => { x.status === "Memo issued" && T.push({ id: "pt" + x.id, t: "Pay " + x.kind.toLowerCase() + " payment", s: `${p.name} · ${mvr(x.amount)}`, h: `#/project/${p.id}/payments`, d: null }); });
    });
  },
  search(m, add) {
    Z().pdocs && Z().pdocs.forEach(d => { if (m(d.title) || m(d.ref) || m(d.fileName) || m(d.code)) { const p = prj(d.projectId); add("doc", d.title, `${d.ref ? d.ref + " · " : ""}${d.fileName}${p ? " · " + p.ref : ""}`, `#/project/${d.projectId}/files`); } });
    (Z().pfiles || []).forEach(d => { if (m(d.name)) add("folder", d.name, "Project file", `#/project/${d.projectId}/files`); });
    (Z().plan || []).forEach(x => { if (m(x.item) || m(x.itemDv) || m(x.pid) || m(x.procNo)) add("list", planName(x), `${x.procNo || x.pid} · ${x.type} · plan ${x.year}`, "#/plan/" + x.year); });
  },
  dash(n, CH) {
    const t = today(), E = [];
    PRJ().forEach(p => { const d = daysLeft(p); d != null && d <= 30 && E.push({ d: p.due, left: d, t: p.name, s: `${p.ref} · due`, h: "#/project/" + p.id }); const r = retLeft(p); r != null && r <= 30 && E.push({ d: p.retentionEnd, left: r, t: p.name, s: `${p.ref} · retention ends`, h: `#/project/${p.id}/retention` }); });
    if (!E.length) return;
    E.sort((a, b) => a.d.localeCompare(b.d));
    const c = o("div", { class: "card pcc-dl" }, CH("cal", "Upcoming deadlines", "#/projects", "All projects →"), o("div", { class: "pcc-dl-list" }, E.slice(0, 8).map(e => o("a", { href: e.h, class: "pcc-dl-i" }, o("span", { class: "pcc-cd t-" + cdTone(e.left, false) }, e.left < 0 ? `${-e.left}d over` : e.left === 0 ? "today" : `${e.left}d`), o("span", { class: "grow" }, o("b", { dir: "auto" }, e.t), o("small", { class: "muted" }, `${e.s} ${fd(e.d)}`))))));
    void t;
    const k = n.querySelector(".kpis"); k ? k.after(c) : n.append(c);
  },
};

// ---------- routes ----------
function ROUTE_PROJECTS(n, [sub, a, b]) {
  migrate();
  if (sub === "meetings") return MEETPAGE(n, [a, b]);
  if (sub === "documents") return DOCSPAGE(n);
  if (sub === "templates") { if (!can("templates")) return K.Fa.projects && OVERVIEW(n, ""); TPLPAGE(n); REFSET(n); STANDCARD(n); return; }
  if (sub === "cheatsheet") return CHEAT(n);
  OVERVIEW(n, sub);
  if (can("projects")) n.append(o("div", { class: "pcc-seed muted small" }, PRJ().some(p => p.seed) ? ["Sample projects are loaded. ", btn("Remove sample data", seedRemove, "small")] : K.LV5() ? ["Trying the module? ", btn("Load sample projects", seedLoad, "small"), " (3 ongoing works, 1 in retention, 5 plan items — removable)"] : null));
}
Object.assign(K.Fa, { projects: ROUTE_PROJECTS, project: (n, a) => { migrate(); PDETAIL(n, a); }, plan: (n, a) => { migrate(); PLANPAGE(n, a); }, worklog: n => { migrate(); WLOG(n); } });
window.addEventListener("online", () => retryUploads());
// Only for signed-in staff (not on the vendor quotation page).
setTimeout(() => { try { if (K.SYS().refresh && !/^#\/?(q|vq|login)(\/|$)/.test(location.hash)) { migrate(); retryUploads(); } } catch (e) { console.error(e); } }, 1500);
if (/^#\/(projects?|plan|worklog)(\/|$)/.test(location.hash)) K.le();
// The built-in page was hidden while loading (see index.html); show the page now that it is drawn.
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("pcc-wait")));
