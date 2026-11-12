// Projects list: Overview (KPIs, handed-over strip, table / card / timeline) and the Documents register.

// Projects navigation: project types (with counts and colours) and the workspace pages, in two grouped bars.
const PNAV_IC = { all: "M4 5h7v6H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 13h7v6H4z", goods: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8", works: "M3 20h18M5 20V10l7-5 7 5v10M10 20v-5h4v5", noncons: "M4 7h16v10H4zM8 7V5h8v2M4 12h16", cons: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 20c0-4 3-6 7-6s7 2 7 6", plan: "M5 4h14v16H5zM9 9h6M9 13h6M9 17h3", meet: "M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5m0-5c1-.6 2-1 2-1 3 0 6 2 6 5", log: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z", docs: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6", templates: "M4 4h16v6H4zM4 14h7v6H4zM15 14h5v6h-5z" };
Object.assign(PNAV_IC, { eval: "M9 11l3 3 8-8M20 12v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h11", summary: "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5", logs: "M5 4h11l3 3v13H5zM9 10h6M9 14h6M9 18h3", progress: "M4 20V10M10 20V4M16 20v-7M22 20H2", checklist: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2", completion: "M5 12l4 4L19 6M12 22a10 10 0 100-20 10 10 0 000 20z", retention: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z", letters: "M3 6h18v12H3zM3 7l9 6 9-6", payments: "M3 7h18v10H3zM3 11h18M7 15h3", files: "M3 6h7l2 2h9v11H3z", activity: "M3 12h4l3-8 4 16 3-8h4" });
const PNAV_COL = { goods: "#2563EB", works: "#D97706", noncons: "#7C3AED", cons: "#DB2777" };
const nvIco = k => { const s2 = document.createElement("span"); s2.className = "pnv-ic"; s2.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${PNAV_IC[k] || PNAV_IC.all}"/></svg>`; return s2; };
function PCNAV(cur) {
  const cats = [["#/projects", "Overview", "all"], ...PTYPES.map(([k, l]) => ["#/projects/" + k, l, k])];
  const tools = [["#/plan", "Procurement plan", "plan"], ["#/projects/meetings", "Committee meetings", "meet"], ["#/projects/documents", "Documents", "docs"], ...(can("templates") ? [["#/projects/templates", "Templates", "templates"]] : [])];
  const live = PRJ().filter(p => p.status !== "Cancelled"), cnt = k => (k === "all" ? live.length : live.filter(p => (PTYPES.find(t => t[0] === k) || [])[1] === p.type).length);
  const yr = today().slice(0, 4), extra = { plan: (Z().plan || []).filter(x => String(x.year) === yr && x.status !== "Cancelled").length, meet: MEETS().filter(m => String(m.date || "").slice(0, 4) === yr).length };
  const item = ([h, l, k]) => { const a = o("a", { href: h, class: "pnv-i" + (k === cur ? " on" : ""), "data-k": k }); PNAV_COL[k] && a.style.setProperty("--c", PNAV_COL[k]); a.append(nvIco(k), o("span", { class: "pnv-l" }, l)); const n = k in extra ? extra[k] : cats.some(c => c[2] === k) ? cnt(k) : null; n != null && a.append(o("span", { class: "pnv-n" }, String(n))); return a; };
  return o("nav", { class: "pnv pnv-a" }, o("div", { class: "pnv-grp" }, o("span", { class: "pnv-cap" }, "Projects"), o("div", { class: "pnv-seg" }, cats.map(item))), o("div", { class: "pnv-grp" }, o("span", { class: "pnv-cap" }, "Workspace"), o("div", { class: "pnv-seg" }, tools.map(item))));
}
const viewPref = () => { try { return localStorage.getItem("mq-pview") || "table"; } catch { return "table"; } };
const setViewPref = v => { try { localStorage.setItem("mq-pview", v); } catch {} };
const pName = p => { const en = p.nameEn || (p.name !== p.nameDv ? p.name : ""); return o("div", { class: "pcc-pn" }, p.nameDv ? o("b", { dir: "rtl", lang: "dv" }, p.nameDv) : null, en ? o(p.nameDv ? "span" : "b", { class: p.nameDv ? "muted small" : "" }, en) : null); };
const pyear = p => String(p.handover || p.agreement || p.award || p.advertised || p.due || p.createdAt || "").slice(0, 4);

function dualBar(p) {
  const tp = timePct(p), pc = clamp(Number(p.progress) || 0, 0, 100), behind = tp != null && pc + 10 < tp;
  return o("div", { class: "pcc-dual" + (behind ? " behind" : "") },
    o("div", { class: "r" }, o("span", {}, "Time"), o("b", {}, o("i", { style: { width: (tp ?? 0) + "%" } })), o("em", {}, tp == null ? "—" : tp + "%")),
    o("div", { class: "r" }, o("span", {}, "Work"), o("b", {}, o("i", { class: "w", style: { width: pc + "%" } })), o("em", {}, pc + "%")));
}

function OVERVIEW(n, type) {
  const T = PTYPES.find(x => x[0] === (type === "services" ? "noncons" : type)), all = PRJ().filter(p => !T || p.type === T[1]), t = today(), yr = t.slice(0, 4);
  const ongoing = all.filter(isOngoing), od = all.filter(p => (daysLeft(p) ?? 1) < 0), due30 = all.filter(p => { const d = daysLeft(p); return d != null && d >= 0 && d <= 30; });
  const tv = all.filter(p => p.status !== "Cancelled").reduce((a, p) => a + (Number(p.contract) || 0), 0);
  const F = { q: "", status: "", year: "", vendor: "", overdue: false, sort: "due", view: viewPref() };
  const kpi = (l, v, cls, f) => o("button", { type: "button", class: "stat pcc-kpi " + (cls || ""), onclick: f || null }, o("div", { class: "k" }, l), o("div", { class: "v" }, v));
  n.append(
    o("div", { class: "row" }, o("h1", { style: { margin: 0 } }, T ? T[1] + " projects" : "Projects"), o("div", { class: "grow right" }, can("projects") ? btn("New project", () => PEDIT2(null, T && T[1]), "primary") : null)),
    PCNAV(T ? T[0] : "all"),
    o("div", { class: "stats pcc-kpis" },
      kpi("Total projects", String(all.length), "", () => { F.status = ""; F.overdue = false; draw(); }),
      kpi("Ongoing (handed over)", String(ongoing.length), "", () => { F.status = "@ongoing"; draw(); }),
      kpi("Due within 30 days", String(due30.length), due30.length ? "warn" : "", () => { F.status = "@due30"; draw(); }),
      kpi("Overdue", String(od.length), od.length ? "bad" : "", () => { F.overdue = true; draw(); }),
      kpi("In retention", String(all.filter(p => p.status === "In retention").length), "", () => { F.status = "In retention"; draw(); }),
      kpi("Completed in " + yr, String(all.filter(p => ["Completed", "In retention", "Closed"].includes(p.status) && String(p.done || "").startsWith(yr)).length)),
      kpi("Total contract value", o("span", {}, ht(tv), o("small", {}, " MVR")), "wide")));
  if (ongoing.length) n.append(o("div", { class: "card pcc-strip-card" }, o("div", { class: "card-h" }, SV(ICO.truck, "hi"), o("h3", {}, "Handed over to contractor"), o("span", { class: "muted small" }, ongoing.length + " ongoing")), o("div", { class: "pcc-strip" }, ongoing.sort((a, b) => String(a.due || "9").localeCompare(String(b.due || "9"))).map(p => o("a", { class: "pcc-hc t-" + cdTone(daysLeft(p), false), href: "#/project/" + p.id }, o("div", { class: "pcc-hc-top" }, o("span", { class: "muted small" }, p.ref), cdChip(p)), pName(p), o("div", { class: "small" }, SV(ICO.users), " ", p.vendor || "Contractor not set"), o("div", { class: "pcc-hc-kv" }, o("span", {}, "Contract"), o("b", {}, mvr(p.contract)), o("span", {}, "Handover"), o("b", {}, fd(p.handover)), o("span", {}, "Due"), o("b", {}, fd(p.due))), dualBar(p))))));
  // toolbar
  const q = o("input", { type: "search", placeholder: "Search ref no., name (English or Dhivehi), contractor, place", dir: "auto" });
  const stSel = S([["", "All statuses"], ["@ongoing", "Ongoing (handed over)"], ["@due30", "Due within 30 days"], ["@unplanned", "Not in procurement plan"], ["@readv", "Iulaan more than once (2nd, 3rd…)"], ...PST.map(s => [s, s])], "");
  const yrs = [...new Set(all.map(pyear).filter(Boolean))].sort().reverse(), ySel = S([["", "All years"], ...yrs.map(y => [y, y])], "");
  const vSel = S([["", "All contractors"], ...[...new Set(all.map(p => p.vendor).filter(Boolean))].sort().map(v => [v, v])], "");
  const odChk = o("input", { type: "checkbox" }), sSel = S([["due", "Sort: due date"], ["ref", "Sort: reference"], ["name", "Sort: name"], ["value", "Sort: contract value"], ["progress", "Sort: % complete"], ["updated", "Sort: last updated"]], "due");
  const views = o("div", { class: "pcc-seg", role: "tablist" }), body = o("div", {});
  const sync = () => { F.q = q.value.trim().toLowerCase(); F.status = stSel.value; F.year = ySel.value; F.vendor = vSel.value; F.overdue = odChk.checked; F.sort = sSel.value; draw(); };
  [q, stSel, ySel, vSel, odChk, sSel].forEach(e => e.addEventListener(e === q ? "input" : "change", sync));
  n.append(o("div", { class: "card toolbar pcc-tools" }, o("div", { class: "pcc-trow" }, o("div", { class: "grow" }, q), views), o("div", { class: "pcc-trow" }, stSel, ySel, vSel, sSel, o("label", { class: "pcc-chk" }, odChk, " Overdue only"))), body);
  function list() {
    let L2 = all.filter(p => {
      if (F.q && !`${p.ref} ${p.name} ${p.nameDv || ""} ${p.nameEn || ""} ${p.vendor || ""} ${p.location || ""} ${p.officer || ""}`.toLowerCase().includes(F.q)) return false;
      if (F.status === "@ongoing" && !isOngoing(p)) return false;
      if (F.status === "@unplanned" && planState(p).code === "planned") return false;
      if (F.status === "@readv" && !(p.rounds || []).length) return false;
      if (F.status === "@due30") { const d = daysLeft(p); if (!(d != null && d >= 0 && d <= 30)) return false; }
      if (F.status && !F.status.startsWith("@") && p.status !== F.status) return false;
      if (F.year && pyear(p) !== F.year) return false;
      if (F.vendor && p.vendor !== F.vendor) return false;
      if (F.overdue && !((daysLeft(p) ?? 1) < 0)) return false;
      return true;
    });
    const cmp = { due: (a, b) => isDone(a) - isDone(b) || String(a.due || "9999").localeCompare(String(b.due || "9999")), ref: (a, b) => String(a.ref).localeCompare(String(b.ref)), name: (a, b) => String(a.name).localeCompare(String(b.name)), value: (a, b) => (b.contract || 0) - (a.contract || 0), progress: (a, b) => (b.progress || 0) - (a.progress || 0), updated: (a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")) }[F.sort];
    return L2.sort(cmp);
  }
  function draw() {
    stSel.value = F.status; odChk.checked = F.overdue;
    views.replaceChildren(...[["table", "Table"], ["card", "Cards"], ["timeline", "Timeline"], ["monthly", "Monthly"]].map(([k, l]) => o("button", { type: "button", class: F.view === k ? "on" : "", onclick: () => { F.view = k; setViewPref(k); draw(); } }, l)));
    const L2 = list();
    if (!L2.length) { body.replaceChildren(o("div", { class: "card" }, empty(all.length ? "No projects match these filters." : "No projects yet. Add the first one, or start one from a procurement plan item.", can("projects") && !all.length ? btn("New project", () => PEDIT2(null, T && T[1]), "primary") : null))); return; }
    const mobile = matchMedia("(max-width:760px)").matches;
    body.replaceChildren(F.view === "monthly" ? monthly(L2, F, T) : F.view === "timeline" ? timeline(L2) : F.view === "card" || mobile ? o("div", { class: "pcc-cards" }, L2.map(pcard)) : o("div", { class: "card flush" }, ptable(L2)));
  }
  draw();
}
function ptable(L2) {
  return tbl(["Ref no.", "Project", "Contractor", "Contract (MVR)", "Handover", "Due", "Days left", "% complete", "Status", ""], L2.map(p => o("tr", { class: "click", onclick: e => { e.target.closest("button,a") || nav("#/project/" + p.id); } },
    o("td", { class: "nowrap" }, p.ref, o("div", { class: "muted small" }, p.type), roundChip(p), iulaanNos(p)), o("td", { style: { minWidth: "190px" } }, pName(p)), o("td", { dir: "auto", style: { minWidth: "120px" } }, p.vendor || "—"), o("td", { class: "money" }, money(p.contract)), o("td", { class: "nowrap" }, fd(p.handover)), o("td", { class: "nowrap" }, fd(p.due), p.dueOriginal && p.dueOriginal !== p.due ? o("div", { class: "muted small" }, "extended") : null), o("td", {}, cdChip(p)), o("td", { style: { minWidth: "120px" } }, K.PBAR(p.progress)), o("td", {}, stChip(p.status)),
    o("td", { class: "pcc-acts" }, can("projects") ? btn("Edit", () => PEDIT2(p), "small") : null))), "pcc-ptable");
}
function pcard(p) {
  return o("a", { class: "card pcc-pc", href: "#/project/" + p.id }, o("div", { class: "pcc-hc-top" }, o("span", { class: "muted small" }, p.ref + " · " + p.type), o("span", {}, roundChip(p), " ", stChip(p.status))), pName(p), o("div", { class: "small muted", dir: "auto" }, [p.vendor, p.location].filter(Boolean).join(" · ") || "—"), o("div", { class: "pcc-hc-kv" }, o("span", {}, "Contract"), o("b", {}, mvr(p.contract)), o("span", {}, "Due"), o("b", {}, fd(p.due))), o("div", { class: "row", style: { alignItems: "center", gap: "10px" } }, cdChip(p)), dualBar(p));
}
// Monthly view: procurements grouped by the month their Iulaan is (or is planned to be) announced.
// Date: the project's Iulaan date, else the linked PR-09 item's planned IFB / REOI date. Plan items
// not yet started as projects are included so the whole year's procurement shows in one place.
const planOf = p => (Z().plan || []).find(x => (p.planId && x.id === p.planId) || x.projectId === p.id);
function startOf(p) { if (isISO(p.advertised)) return { d: p.advertised, src: "iulaan" }; const x = planOf(p), d = x && x.dates ? x.dates.ifb || x.dates.reoi : null; return isISO(d) ? { d, src: "plan" } : null; }
function monthly(L2, F, T) {
  const items = L2.map(p => ({ p, s: startOf(p) }));
  (Z().plan || []).filter(x => !x.projectId && x.status !== "Cancelled" && (!T || x.type === T[1])).forEach(x => { const d = x.dates ? x.dates.ifb || x.dates.reoi : null; items.push({ x, s: isISO(d) ? { d, src: "plan" } : null }); });
  const years = [...new Set(items.filter(i => i.s).map(i => i.s.d.slice(0, 4)))].sort();
  let yr = F.year || F.mYear || (years.includes(today().slice(0, 4)) ? today().slice(0, 4) : years[years.length - 1]) || today().slice(0, 4);
  const box = o("div", {});
  const draw = () => {
    const inYear = items.filter(i => i.s && i.s.d.startsWith(yr)), none = items.filter(i => !i.s), cm = today().slice(0, 7);
    const head = o("div", { class: "card pcc-mhead" }, o("button", { type: "button", class: "btn small", onclick: () => { yr = String(Number(yr) - 1); F.mYear = yr; draw(); } }, "‹"), o("h3", {}, "Procurements by Iulaan month — " + yr), o("button", { type: "button", class: "btn small", onclick: () => { yr = String(Number(yr) + 1); F.mYear = yr; draw(); } }, "›"), o("span", { class: "grow" }),
      o("span", { class: "pcc-mkey" }, o("i", { class: "k-iulaan" }), "Iulaan date", o("i", { class: "k-plan" }), "Planned (PR-09)"));
    const bars = o("div", { class: "pcc-mbars" }, ENMON.map((mn, i) => { const k = yr + "-" + String(i + 1).padStart(2, "0"), n = inYear.filter(it => it.s.d.startsWith(k)).length, mx = Math.max(1, ...ENMON.map((_, j) => inYear.filter(it => it.s.d.startsWith(yr + "-" + String(j + 1).padStart(2, "0"))).length));
      return o("a", { href: "#", class: "pcc-mbar" + (k === cm ? " now" : ""), onclick: e => { e.preventDefault(); const t = box.querySelector("#m-" + k); t && t.scrollIntoView({ behavior: "smooth", block: "start" }); } }, o("b", {}, n || ""), o("i", { style: { height: (n / mx * 100) + "%" } }), o("span", {}, mn.slice(0, 3))); }));
    const card = it => {
      const d = it.s.d, p = it.p, x = it.x, type = p ? p.type : x.type, name = p ? (p.nameDv || p.name) : planName(x), ref = p ? p.ref : (x.procNo || x.pid || "Plan item");
      return o(p ? "a" : "div", { class: "pcc-mi t-" + String(type || "").replace(/\W/g, "").toLowerCase() + (it.s.src === "plan" ? " planned" : ""), href: p ? "#/project/" + p.id : undefined },
        o("div", { class: "pcc-mday" }, o("b", {}, String(Number(d.slice(8)))), o("span", {}, ENMON[Number(d.slice(5, 7)) - 1].slice(0, 3))),
        o("div", { class: "grow", style: { minWidth: 0 } }, o("div", { class: "pcc-mname", dir: "auto" }, name), o("div", { class: "muted small" }, o("span", { class: "pcc-mref" }, ref), " · " + (type || ""), p && p.advertNo ? " · " + p.advertNo : "")),
        o("div", { class: "pcc-mchips" }, p && planState(p).code !== "planned" ? planChip(p) : null, p ? roundChip(p) : null, p ? stChip(p.status) : o("span", { class: "pcc-tag" }, "Not started")));
    };
    const months = o("div", { class: "pcc-months" }, ENMON.map((mn, i) => { const k = yr + "-" + String(i + 1).padStart(2, "0"), L3 = inYear.filter(it => it.s.d.startsWith(k)).sort((a, b) => a.s.d.localeCompare(b.s.d));
      return o("section", { class: "card pcc-month" + (k === cm ? " now" : "") + (L3.length ? "" : " empty"), id: "m-" + k }, o("div", { class: "pcc-month-h" }, o("h3", {}, mn), o("span", { class: "pcc-cnt" + (L3.length ? " full" : "") }, String(L3.length))), L3.length ? L3.map(card) : o("p", { class: "muted small" }, "No procurement this month.")); }));
    box.replaceChildren(head, bars, months, none.length ? o("details", { class: "card pcc-mnone" }, o("summary", {}, `No Iulaan date yet (${none.length})`), o("p", { class: "muted small" }, "Set the Iulaan date on the project (Edit › Procurement), or the planned IFB date on its PR-09 plan item, to place it in a month."), o("div", { class: "pcc-mlist" }, none.map(it => { const p = it.p, x = it.x; return o(p ? "a" : "div", { class: "pcc-mi", href: p ? "#/project/" + p.id : undefined }, o("div", { class: "grow" }, o("div", { class: "pcc-mname", dir: "auto" }, p ? (p.nameDv || p.name) : planName(x)), o("div", { class: "muted small" }, (p ? p.ref : (x.procNo || x.pid || "")) + " · " + ((p ? p.type : x.type) || ""))), o("div", { class: "pcc-mchips" }, p && planState(p).code !== "planned" ? planChip(p) : null, p ? roundChip(p) : null, p ? stChip(p.status) : o("span", { class: "pcc-tag" }, "Not started"))); }))) : null);
  };
  draw();
  return box;
}
function timeline(L2) {
  const st = p => p.handover || p.agreement || p.award || p.advertised || p.start || (p.createdAt || "").slice(0, 10);
  const end = p => p.status === "In retention" && p.retentionEnd ? p.retentionEnd : p.done && isDone(p) ? p.done : p.due || dAdd(st(p), 30);
  const rows = L2.filter(p => isISO(st(p)));
  if (!rows.length) return o("div", { class: "card" }, empty("Add handover and due dates to see projects on the timeline."));
  let a = rows.map(st).sort()[0], b = rows.map(end).filter(isISO).sort().pop(); const t = today();
  if (t < a) a = t; if (t > b) b = t;
  a = a.slice(0, 8) + "01"; b = dAdd(b.slice(0, 8) + "28", 7);
  const span = Math.max(1, dDiff(a, b)), x = d => clamp(dDiff(a, d) / span * 100, 0, 100), months = [];
  for (let d = a; d < b; d = dAdd(d.slice(0, 8) + "28", 7).slice(0, 8) + "01") months.push(d);
  return o("div", { class: "card pcc-gantt" }, o("div", { class: "g-head" }, o("div", { class: "g-lab" }, "Project"), o("div", { class: "g-track" }, months.map(m => o("span", { style: { left: x(m) + "%" } }, ENMON[Number(m.slice(5, 7)) - 1].slice(0, 3) + (m.slice(5, 7) === "01" ? " ’" + m.slice(2, 4) : ""))))),
    rows.map(p => { const s = st(p), e = end(p), d = daysLeft(p); return o("a", { class: "g-row", href: "#/project/" + p.id }, o("div", { class: "g-lab" }, o("b", { dir: "auto" }, p.nameDv || p.name), o("small", { class: "muted" }, p.ref)), o("div", { class: "g-track" }, o("i", { class: "g-today", style: { left: x(t) + "%" } }), o("span", { class: "g-bar t-" + cdTone(d, isDone(p)), style: { left: x(s) + "%", width: Math.max(1, x(e) - x(s)) + "%" }, title: `${fd(s)} → ${fd(e)} · ${cdText(d, isDone(p), p.status)}` }, o("em", { style: { width: clamp(Number(p.progress) || 0, 0, 100) + "%" } })), p.dueOriginal && p.dueOriginal !== p.due ? o("i", { class: "g-orig", style: { left: x(p.dueOriginal) + "%" }, title: "Original due date " + fd(p.dueOriginal) }) : null)); }),
    o("div", { class: "muted small g-legend" }, "Bars run from handover (or the first known date) to the due date — or to the end of retention. The darker part is physical progress; the line marks today."));
}

// ---------- Documents register (#/projects/documents) ----------
function DOCSPAGE(n) {
  const fp = S([["", "All projects"], ...PRJ().map(p => [p.id, `${p.ref} — ${p.name}`])], ""), fg = S([["", "All types"], ...TGROUPS.map(g => [g, g]), ["@upload", "Uploaded files"], ["@signed", "Signed copies"]], ""), fs = S([["", "Any status"], "Draft", "Final", "Issued", "Signed"], ""), f1 = D(""), f2 = D(""), q = o("input", { type: "search", placeholder: "Search document, ref no., file name" }), box = o("div", { class: "card flush" });
  const draw = () => {
    const s = q.value.trim().toLowerCase();
    let rows = [...Z().pdocs.map(d => ({ kind: "gen", d, at: d.at, p: prj(d.projectId) })), ...Z().pfiles.map(d => ({ kind: "file", d, at: d.at, p: prj(d.projectId) }))];
    rows = rows.filter(r => (!fp.value || String(r.d.projectId) === fp.value) && (!fg.value || (fg.value === "@upload" ? r.kind === "file" : fg.value === "@signed" ? r.kind === "gen" && r.d.signedFileId : r.kind === "gen" && r.d.group === fg.value)) && (!fs.value || r.d.status === fs.value) && (!f1.value || String(r.at).slice(0, 10) >= f1.value) && (!f2.value || String(r.at).slice(0, 10) <= f2.value) && (!s || `${r.d.title || r.d.name} ${r.d.fileName || r.d.name} ${r.d.ref || ""} ${r.d.code || ""} ${r.p ? r.p.ref + " " + r.p.name : ""}`.toLowerCase().includes(s)));
    rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    box.replaceChildren(rows.length ? docTable(rows, true) : empty("No documents match. Generate documents from a project's Bid Documents, Evaluation, Letters or Payments tab, or upload files under Files."));
  };
  [fp, fg, fs, f1, f2].forEach(e => e.addEventListener("change", draw)); q.addEventListener("input", draw);
  n.append(o("h1", {}, "Documents"), PCNAV("docs"), o("div", { class: "card toolbar pcc-tools" }, o("div", { class: "pcc-trow" }, o("div", { class: "grow" }, q)), o("div", { class: "pcc-trow" }, fp, fg, fs, L("From", f1), L("To", f2))), box);
  draw();
}
function docTable(rows, showP) {
  return tbl(["Document", ...(showP ? ["Project"] : []), "Ref no.", "Version", "Status", "Date", "By", ""], rows.map(({ kind, d, p }) => o("tr", {},
    o("td", {}, o("div", { class: "pcc-dn" }, o("span", { class: "pcc-fmt f-" + extOf(d.fileName || d.name) }, extOf(d.fileName || d.name).toUpperCase()), o("div", {}, o("b", { dir: "auto" }, d.title || d.name), o("div", { class: "muted small" }, (d.code ? d.code + " · " : "") + (d.fileName || d.name) + (kind === "file" && d.size ? " · " + kb(d.size) : ""))))),
    showP ? o("td", {}, p ? o("a", { href: "#/project/" + p.id + "/files", dir: "auto" }, p.ref + " " + p.name) : "—") : null,
    o("td", { class: "nowrap" }, d.ref || ""), o("td", {}, kind === "gen" ? "v" + d.version : d.version ? "v" + d.version : ""), o("td", {}, d.status ? stChip(d.status) : kind === "file" ? o("span", { class: "muted small" }, d.kind || "Upload") : ""), o("td", { class: "nowrap" }, fd(String(d.at).slice(0, 10))), o("td", { dir: "auto" }, d.by || ""),
    o("td", { class: "pcc-acts" }, btn("Preview", () => fget(d.fileId).then(u => previewFile(u, d.fileName || d.name, d.title || d.name)).catch(e => xt(e.message, "err")), "small"), btn("Download", () => fdownload(d.fileId, d.fileName || d.name).catch(e => xt(e.message, "err")), "small"),
      kind === "gen" && d.signedFileId ? btn("Signed copy", () => fget(d.signedFileId).then(u => previewFile(u, d.signedName || "signed.pdf", "Signed: " + d.title)).catch(e => xt(e.message, "err")), "small") : null,
      kind === "gen" && can("pdocs") ? btn(d.signedFileId ? "Replace signed" : "Upload signed", () => uploadSigned(d), "small") : null,
      can("pdocs") ? btn("Delete", () => docDelete(kind, d), "small danger") : null,
      kind === "gen" && can("pdocs") && d.status === "Draft" ? btn("Mark final", () => save(() => { d.status = "Final"; const pp = prj(d.projectId); pp && audit(pp, "Marked final", d.title); }, "Marked final"), "small") : null))));
}
async function uploadSigned(d) {
  try {
    need("pdocs");
    const f = await pickFile(".pdf,image/*"); if (!f) return;
    if (f.size > 15 * 1048576) throw err("The file is larger than 15 MB");
    const id = await fput(f, { name: f.name, mime: f.type });
    save(() => { d.signedFileId = id; d.signedName = f.name; d.status = "Signed"; d.signedAt = Vt(); const p = prj(d.projectId); p && audit(p, "Signed copy uploaded", d.title); }, "Signed copy saved");
  } catch (e) { xt(e.message, "err"); }
}

async function docDelete(kind, d) {
  const p = prj(d.projectId), name = d.title || d.name, shared = kind === "gen" && d.meetingId && Z().pdocs.some(x => x !== d && x.fileId === d.fileId);
  const msg = kind === "gen"
    ? `Delete ${name}${d.version ? " (v" + d.version + ")" : ""}${d.signedFileId ? " and its signed copy" : ""}? This cannot be undone.${shared ? " The other projects of the meeting keep their copy." : ""}${d.ref ? " Its reference number " + d.ref + " is not reused." : ""}`
    : `Delete the file ${name}? This cannot be undone.`;
  if (!(await jt(msg, "Delete"))) return;
  try {
    need("pdocs");
    const ids = [d.fileId, d.signedFileId].filter(Boolean);
    if (kind === "gen") Z().pdocs = Z().pdocs.filter(x => x !== d); else Z().pfiles = Z().pfiles.filter(x => x !== d);
    p && audit(p, kind === "gen" ? "Document deleted" : "File deleted", `${name}${d.version ? " v" + d.version : ""}`);
    K.Qt();
    for (const id of ids) await fdrop(id);
    K.Qt(); xt("Deleted"); K.le();
  } catch (e) { xt(e.message, "err"); }
}
