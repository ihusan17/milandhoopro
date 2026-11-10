// Projects list: Overview (KPIs, handed-over strip, table / card / timeline) and the Documents register.

function PCNAV(cur) {
  const T = [["#/projects", "Overview", "all"], ...PTYPES.map(([k, l]) => ["#/projects/" + k, l, k]), ["#/plan", "Procurement plan", "plan"], ["#/worklog", "Work Logs", "log"], ["#/projects/documents", "Documents", "docs"], ...(can("templates") ? [["#/projects/templates", "Templates", "templates"]] : [])];
  return o("div", { class: "pills pcc-nav" }, T.map(([h, l, k]) => o("a", { href: h, class: "pill" + (k === cur ? " on" : "") }, l)));
}
const viewPref = () => { try { return localStorage.getItem("mq-pview") || "table"; } catch { return "table"; } };
const setViewPref = v => { try { localStorage.setItem("mq-pview", v); } catch {} };
const pName = p => o("div", { class: "pcc-pn" }, p.nameDv ? o("b", { dir: "rtl", lang: "dv" }, p.nameDv) : null, o(p.nameDv ? "span" : "b", { class: p.nameDv ? "muted small" : "" }, p.nameEn || p.name));
const pyear = p => String(p.handover || p.agreement || p.award || p.advertised || p.due || p.createdAt || "").slice(0, 4);

function dualBar(p) {
  const tp = timePct(p), pc = clamp(Number(p.progress) || 0, 0, 100), behind = tp != null && pc + 10 < tp;
  return o("div", { class: "pcc-dual" + (behind ? " behind" : "") },
    o("div", { class: "r" }, o("span", {}, "Time"), o("b", {}, o("i", { style: { width: (tp ?? 0) + "%" } })), o("em", {}, tp == null ? "—" : tp + "%")),
    o("div", { class: "r" }, o("span", {}, "Work"), o("b", {}, o("i", { class: "w", style: { width: pc + "%" } })), o("em", {}, pc + "%")));
}

function OVERVIEW(n, type) {
  const T = PTYPES.find(x => x[0] === type), all = PRJ().filter(p => !T || p.type === T[1]), t = today(), yr = t.slice(0, 4);
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
  const stSel = S([["", "All statuses"], ["@ongoing", "Ongoing (handed over)"], ["@due30", "Due within 30 days"], ...PST.map(s => [s, s])], "");
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
    views.replaceChildren(...[["table", "Table"], ["card", "Cards"], ["timeline", "Timeline"]].map(([k, l]) => o("button", { type: "button", class: F.view === k ? "on" : "", onclick: () => { F.view = k; setViewPref(k); draw(); } }, l)));
    const L2 = list();
    if (!L2.length) { body.replaceChildren(o("div", { class: "card" }, empty(all.length ? "No projects match these filters." : "No projects yet. Add the first one, or start one from a procurement plan item.", can("projects") && !all.length ? btn("New project", () => PEDIT2(null, T && T[1]), "primary") : null))); return; }
    const mobile = matchMedia("(max-width:760px)").matches;
    body.replaceChildren(F.view === "timeline" ? timeline(L2) : F.view === "card" || mobile ? o("div", { class: "pcc-cards" }, L2.map(pcard)) : o("div", { class: "card flush" }, ptable(L2)));
  }
  draw();
}
function ptable(L2) {
  return tbl(["Ref no.", "Project", "Contractor", "Contract (MVR)", "Handover", "Due", "Days left", "% complete", "Status", ""], L2.map(p => o("tr", { class: "click", onclick: e => { e.target.closest("button,a") || nav("#/project/" + p.id); } },
    o("td", { class: "nowrap" }, p.ref, o("div", { class: "muted small" }, p.type)), o("td", { style: { minWidth: "190px" } }, pName(p)), o("td", { dir: "auto", style: { minWidth: "120px" } }, p.vendor || "—"), o("td", { class: "money" }, money(p.contract)), o("td", { class: "nowrap" }, fd(p.handover)), o("td", { class: "nowrap" }, fd(p.due), p.dueOriginal && p.dueOriginal !== p.due ? o("div", { class: "muted small" }, "extended") : null), o("td", {}, cdChip(p)), o("td", { style: { minWidth: "120px" } }, K.PBAR(p.progress)), o("td", {}, stChip(p.status)),
    o("td", { class: "pcc-acts" }, can("projects") ? btn("Edit", () => PEDIT2(p), "small") : null))), "pcc-ptable");
}
function pcard(p) {
  return o("a", { class: "card pcc-pc", href: "#/project/" + p.id }, o("div", { class: "pcc-hc-top" }, o("span", { class: "muted small" }, p.ref + " · " + p.type), stChip(p.status)), pName(p), o("div", { class: "small muted", dir: "auto" }, [p.vendor, p.location].filter(Boolean).join(" · ") || "—"), o("div", { class: "pcc-hc-kv" }, o("span", {}, "Contract"), o("b", {}, mvr(p.contract)), o("span", {}, "Due"), o("b", {}, fd(p.due))), o("div", { class: "row", style: { alignItems: "center", gap: "10px" } }, cdChip(p)), dualBar(p));
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
