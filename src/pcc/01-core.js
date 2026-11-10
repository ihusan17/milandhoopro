// Projects Command Centre (PCC) — core: shared helpers, data migration, file store,
// Dhivehi helpers and the Thaana phonetic keyboard.
// The portal's own helpers come from window.__app.K (see the bridge in index.html).

const APP = window.__app, K = APP.K;
const { o, Mt, jt, Oe, ot, xt, ht, _e, yn, Xt, Zt, Vt, te, bt, St, PERM, PCHK, ME, ii, SV, ICO } = K;
const Z = () => K.Z;
const err = m => new St(m);

// ---------- small utilities ----------
const uid = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
const today = () => Zt();
const isISO = d => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
const dAdd = (iso, n) => { if (!isISO(iso)) return ""; const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + Number(n || 0)); return d.toISOString().slice(0, 10); };
const dDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const fd = d => (isISO(d) ? Xt(d) : "—");
const money = v => (v == null || v === "" ? "—" : ht(v));
const mvr = v => (v == null || v === "" ? "—" : ht(v) + " MVR");
const num = v => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const safeName = s => String(s || "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "file";
const byId = (L, id) => (L || []).find(x => String(x.id) === String(id));
const me = () => { const m = ME() || {}; return m.name || m.email || "Office"; };
const L = (t, e, hint) => o("div", { class: "pcc-f" }, o("label", {}, t), e, hint ? o("div", { class: "muted small" }, hint) : null);
const I = (v, a = {}) => o("input", { type: "text", dir: "auto", value: v ?? "", ...a });
const DVI = (v, a = {}) => thaanaInput(o("input", { type: "text", dir: "rtl", lang: "dv", class: "dv", value: v ?? "", ...a }));
const DVT = (v, a = {}) => { const t = o("textarea", { rows: 3, dir: "rtl", lang: "dv", class: "dv", ...a }); t.value = v ?? ""; return thaanaInput(t); };
const D = v => o("input", { type: "date", value: v || "" });
const N = (v, a = {}) => o("input", { type: "number", value: v ?? "", ...a });
const MI = v => o("input", { type: "text", inputmode: "decimal", value: v == null || v === "" ? "" : _e(v), placeholder: "0.00" });
const S = (opts, cur, a = {}) => o("select", a, opts.map(x => (Array.isArray(x) ? bt(x[0], x[1], String(x[0]) === String(cur)) : bt(x, x, x === cur))));
const parseMoney = (el, name) => { const x = yn(el.value); if (Number.isNaN(x)) throw err(name + ": type an amount like 12500.00"); return x; };
const can = k => PERM(k);
const need = k => PCHK(k);

// ---------- project lifecycle ----------
const PST = ["Planned", "Iulaan", "Under evaluation", "Awarded", "Handed over", "Ongoing", "On hold", "Completed", "In retention", "Closed", "Cancelled"];
// The four categories of the council's PR-09 procurement plan (one sheet each).
const PTYPES = [["goods", "Goods", "ސާމާނު"], ["works", "Works", "މަސައްކަތް"], ["noncons", "Non-consultancy", "ކޮންސަލްޓެންސީ ނޫން ޚިދުމަތް"], ["cons", "Consultancy", "ކޮންސަލްޓެންސީ ޚިދުމަތް"]];
const ONGOING = ["Handed over", "Ongoing", "On hold"];
const DONE = ["Completed", "In retention", "Closed", "Cancelled"];
const PRJ = () => K.PJ();
const prj = id => PRJ().find(p => p.id === Number(id));
const isOngoing = p => ONGOING.includes(p.status);
const isDone = p => DONE.includes(p.status);
const daysLeft = p => (p.due && !isDone(p) ? dDiff(today(), p.due) : null);
const retLeft = p => (p.retentionEnd && p.status === "In retention" ? dDiff(today(), p.retentionEnd) : null);

// Countdown colour: green > 30 days, amber 8–30, red 0–7, dark red overdue, grey when completed.
function cdTone(d, finished) { if (finished || d == null) return "grey"; if (d < 0) return "over"; if (d <= 7) return "red"; if (d <= 30) return "amber"; return "green"; }
function cdText(d, finished, doneLabel = "Completed") {
  if (finished) return doneLabel;
  if (d == null) return "No due date";
  if (d < 0) return `Overdue by ${-d} day${d === -1 ? "" : "s"}`;
  if (d === 0) return "Due today";
  return `${d} day${d === 1 ? "" : "s"} left`;
}
function cdChip(p, big) {
  const d = daysLeft(p), fin = isDone(p);
  return o("span", { class: `pcc-cd t-${cdTone(d, fin)}${big ? " big" : ""}`, "data-due": !fin && p.due ? p.due : null }, cdText(d, fin, p.status));
}
function retChip(p) {
  const d = retLeft(p);
  if (!p.retentionEnd) return o("span", { class: "pcc-cd t-grey" }, "No retention");
  if (p.status !== "In retention") return o("span", { class: "pcc-cd t-grey" }, p.retentionReleased ? "Released" : "Ends " + fd(p.retentionEnd));
  return o("span", { class: `pcc-cd t-${cdTone(d, false)}` }, d < 0 ? `Retention ended ${-d} days ago` : `Retention: ${d} days left`);
}
const stChip = s => o("span", { class: "chip pst-" + String(s).replace(/\W+/g, "") }, s);
const timePct = p => { if (!p.handover || !p.due) return null; const tot = dDiff(p.handover, p.due) || 1; return clamp(Math.round(dDiff(p.handover, today()) / tot * 100), 0, 100); };

function audit(p, action, detail) {
  (p.activity = p.activity || []).unshift({ at: Vt(), by: me(), action, detail: detail || "" });
  if (p.activity.length > 400) p.activity.length = 400;
  p.updatedAt = Vt();
}

// ---------- reference numbers ----------
const REFKINDS = [
  ["project", "Project reference", "MC-PRJ/{YYYY}/{###}"],
  ["letter", "Letters", "(IUL)351-PRO/{YYYY}/{###}"],
  ["memo", "Internal memos", "(IUL)351-PRO/{YYYY}/M{###}"],
  ["paymemo", "Payment memos", "(IUL)351-PRO/{YYYY}/PM{###}"],
  ["report", "Reports", "(IUL)351-PRO/{YYYY}/R{###}"],
  ["meeting", "Bid Committee meetings", "(IUL)351-PRO/{YYYY}/BM{###}"],
  ["evalmeeting", "Evaluation Committee meetings", "(IUL)351-PRO/{YYYY}/EM{###}"],
];
function refPattern(kind) { const z = Z(); z.refPatterns = z.refPatterns || {}; return z.refPatterns[kind] || (REFKINDS.find(k => k[0] === kind) || [0, 0, "{YYYY}/{###}"])[2]; }
function refFormat(pat, n, yr, p) {
  return pat.replace(/\{YYYY\}/g, yr).replace(/\{YY\}/g, String(yr).slice(2)).replace(/\{(#+)\}/g, (_, h) => String(n).padStart(h.length, "0")).replace(/\{PRJ\}/g, (p && p.ref) || "");
}
function refPeek(kind, p) { const z = Z(), yr = today().slice(0, 4), k = kind + ":" + yr; return refFormat(refPattern(kind), ((z.refSeq || {})[k] || 0) + 1, yr, p); }
// Takes the next number. Numbers are never reused, even if the document is later deleted.
function refNext(kind, p) { const z = Z(), yr = today().slice(0, 4), k = kind + ":" + yr; z.refSeq = z.refSeq || {}; z.refSeq[k] = (z.refSeq[k] || 0) + 1; return refFormat(refPattern(kind), z.refSeq[k], yr, p); }

// ---------- migration (idempotent; runs before every Projects page) ----------
const NEWPERMS = [["plogs", "Work logs, progress reports and checklists"], ["pdocs", "Generate project documents, letters and memos"], ["payments", "Project payments and payment memos"], ["templates", "Manage document templates"]];
function migrate() {
  const z = Z(); let ch = false;
  NEWPERMS.forEach(x => { if (!K.PERMS.some(y => y[0] === x[0])) K.PERMS.push(x); });
  if ((z.pccV || 0) < 1) {
    (K.ROLES() || []).forEach(r => {
      if (r.id === "admin") return;
      const add = k => { r.perms.includes(k) || r.perms.push(k); };
      if (r.perms.includes("projects")) { add("plogs"); add("pdocs"); }
      if (r.id === "finance" || r.id === "head") add("payments");
    });
    if (!K.ROLES().some(r => r.id === "projofficer")) K.ROLES().push({ id: "projofficer", name: "Project officer", level: 2, perms: ["plogs"], limit: null });
    z.pccV = 1; ch = true;
  }
  const yrs = {};
  PRJ().forEach(p => {
    if (p.status === "In progress") { p.status = "Ongoing"; ch = true; }
    if (p.type === "Services") { p.type = "Non-consultancy"; ch = true; }
    if (p.status === "Advertised") { p.status = "Iulaan"; ch = true; }
    for (const k of ["bidders", "reports", "checklist", "letters", "payments", "eots", "activity", "retReports", "logs", "cases"]) if (!Array.isArray(p[k])) { p[k] = []; ch = true; }
    if (!p.committees || typeof p.committees !== "object") { p.committees = { bid: [], eval: [] }; ch = true; }
    if (p.dueOriginal === undefined) { p.dueOriginal = p.due || ""; ch = true; }
    if (!p.ref) { p.ref = refNext("project", p); ch = true; }
    if (!p.type) { p.type = "Works"; ch = true; }
  });
  (z.plan || []).forEach(x => {
    if (x.status === "Dropped") { x.status = "Cancelled"; ch = true; }
    if (x.type === "Services") { x.type = "Non-consultancy"; ch = true; }
    if (!x.pid) { const y = x.year || today().slice(0, 4); yrs[y] = yrs[y] || Math.max(0, ...(z.plan || []).filter(k => k.pid && String(k.year) === String(y)).map(k => Number(String(k.pid).split("-").pop()) || 0)); x.pid = `PL-${y}-${String(++yrs[y]).padStart(4, "0")}`; ch = true; }
  });
  if (!Array.isArray(z.ptemplates)) { z.ptemplates = []; ch = true; }
  if (seedDemoTemplates()) ch = true;
  for (const k of ["pdocs", "pfiles", "planImports"]) if (!Array.isArray(z[k])) { z[k] = []; ch = true; }
  if (!z.blobs || typeof z.blobs !== "object") { z.blobs = {}; ch = true; }
  if (loadPR09(z)) ch = true;
  if (ch) K.Qt();
}

// ---------- file store: IndexedDB cache + Firestore chunks (office/f_<id>_<n>) ----------
let idbP = null;
const idb = () => idbP || (idbP = new Promise((res, rej) => { const r = indexedDB.open("mq-files", 1); r.onupgradeneeded = () => r.result.createObjectStore("f"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
async function idbOp(mode, fn) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction("f", mode), q = fn(t.objectStore("f")); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); }
const idbGet = k => idbOp("readonly", s => s.get(k)).catch(() => null);
const idbPut = (k, v) => idbOp("readwrite", s => s.put(v, k)).catch(() => null);
const CHUNK = 600 * 1024;
function b64e(u8) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function b64d(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
const toU8 = async x => (x instanceof Uint8Array ? x : x instanceof ArrayBuffer ? new Uint8Array(x) : new Uint8Array(await x.arrayBuffer()));
const remoteOK = () => !!(K.SYS().refresh && K.SRV());
const pendingUp = new Set();

async function fput(data, meta = {}) {
  const u8 = await toU8(data), id = "b" + uid().toString(36), n = Math.max(1, Math.ceil(u8.length / CHUNK));
  Z().blobs[id] = { n, size: u8.length, mime: meta.mime || "", name: meta.name || "", at: Vt(), by: me(), up: 0 };
  await idbPut(id, u8);
  upload(id, u8);
  return id;
}
async function upload(id, u8) {
  if (!remoteOK() || pendingUp.has(id)) return;
  pendingUp.add(id);
  try {
    const n = Math.max(1, Math.ceil(u8.length / CHUNK));
    for (let i = 0; i < n; i++) {
      const x = await K.FBA(`/office/f_${id}_${i}`, { method: "PATCH", body: JSON.stringify({ fields: { d: { bytesValue: b64e(u8.subarray(i * CHUNK, (i + 1) * CHUNK)) } } }) });
      if (x.s !== 200) throw new Error("Upload refused (" + x.s + ")");
    }
    const b = Z().blobs[id]; if (b && !b.up) { b.up = 1; K.Qt(); }
  } catch (e) { console.warn("File upload will be retried:", e.message); }
  finally { pendingUp.delete(id); }
}
async function retryUploads() { if (!remoteOK()) return; for (const [id, b] of Object.entries(Z().blobs || {})) if (!b.up && !String(id).startsWith("demo:")) { const u = await idbGet(id); if (u) await upload(id, u); } }
async function fget(id) {
  if (!id) throw err("No file");
  if (String(id).startsWith("demo:")) { const d = (window.__PCC_DEMO || {})[id.slice(5)]; if (!d) throw err("Demo template missing"); return b64d(d.b); }
  const c = await idbGet(id); if (c) return c;
  const b = (Z().blobs || {})[id]; if (!b) throw err("File not found");
  if (!remoteOK()) throw err("This file is stored on another device. Sign in to fetch it.");
  const parts = [];
  for (let i = 0; i < b.n; i++) {
    const x = await K.FBA(`/office/f_${id}_${i}`);
    if (x.s === 404) throw err(b.up ? "File not found in the cloud" : "This file is still uploading from the device that added it. Try again shortly.");
    if (x.s !== 200) throw err("Could not download the file (" + x.s + ")");
    parts.push(b64d(x.j.fields.d.bytesValue));
  }
  const u8 = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let off = 0; parts.forEach(p => { u8.set(p, off); off += p.length; });
  await idbPut(id, u8);
  return u8;
}
const MIME = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", pdf: "application/pdf", zip: "application/zip" };
const extOf = n => String(n || "").split(".").pop().toLowerCase();
async function fdownload(id, name) { const u8 = await fget(id); ii(new Blob([u8], { type: MIME[extOf(name)] || (Z().blobs[id] || {}).mime || "application/octet-stream" }), name); }
const pickFile = accept => new Promise(res => { const i = o("input", { type: "file", accept, style: { display: "none" } }); i.addEventListener("change", () => { res(i.files[0] || null); i.remove(); }); document.body.append(i); i.click(); });
const kb = n => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

// ---------- Dhivehi helpers ----------
const DVMON = ["ޖަނަވަރީ", "ފެބުރުއަރީ", "މާރިޗު", "އޭޕްރީލް", "މެއި", "ޖޫން", "ޖުލައި", "އޯގަސްޓު", "ސެޕްޓެމްބަރު", "އޮކްޓޫބަރު", "ނޮވެމްބަރު", "ޑިސެމްބަރު"];
const ENMON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const HJMON = ["މުޙައްރަމް", "ޞަފަރު", "ރަބީޢުލްއައްވަލް", "ރަބީޢުލްއާޚިރު", "ޖުމާދަލްއޫލާ", "ޖުމާދަލްއާޚިރާ", "ރަޖަބު", "ޝަޢުބާން", "ރަމަޟާން", "ޝައްވާލް", "ޛުލްޤަޢިދާ", "ޛުލްޙިއްޖާ"];
const dvDate = d => (isISO(d) ? `${Number(d.slice(8))} ${DVMON[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : "");
const enDate = d => (isISO(d) ? `${Number(d.slice(8))} ${ENMON[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : "");
function hijri(d, lang = "dv") {
  if (!isISO(d)) return "";
  try {
    const p = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }).formatToParts(new Date(d + "T12:00:00Z"));
    const g = t => Number((p.find(x => x.type === t) || {}).value);
    const yy = String(g("year")).replace(/\D/g, "");
    return lang === "dv" ? `${g("day")} ${HJMON[g("month") - 1]} ${yy} ހ` : `${g("day")}/${g("month")}/${yy} AH`;
  } catch { return ""; }
}
const DV1 = ["", "އެކެއް", "ދޭއް", "ތިނެއް", "ހަތަރެއް", "ފަހެއް", "ހައެއް", "ހަތެއް", "އަށެއް", "ނުވައެއް", "ދިހައެއް", "އެގާރަ", "ބާރަ", "ތޭރަ", "ސާދަ", "ފަނަރަ", "ސޯޅަ", "ސަތާރަ", "އަށާރަ", "ނަވާރަ"];
const DVA = ["", "އެއް", "ދެ", "ތިން", "ހަތަރު", "ފަސް", "ހަ", "ހަތް", "އަށް", "ނުވަ", "ދިހަ", "އެގާރަ", "ބާރަ", "ތޭރަ", "ސާދަ", "ފަނަރަ", "ސޯޅަ", "ސަތާރަ", "އަށާރަ", "ނަވާރަ"];
const DVTEN = ["", "", "ވިހި", "ތިރީސް", "ސާޅީސް", "ފަންސާސް", "ފަސްދޮޅަސް", "ހައްދިހަ", "އައްޑިހަ", "ނުވަދިހަ"];
const DVHUN = ["", "ސަތޭކަ", "ދުއިސައްތަ", "ތިންސަތޭކަ", "ހަތަރުސަތޭކަ", "ފަސްސަތޭކަ", "ހަސަތޭކަ", "ހަތްސަތޭކަ", "އަށްސަތޭކަ", "ނުވަސަތޭކަ"];
const dv99 = (n, a) => (n < 20 ? (a ? DVA : DV1)[n] : DVTEN[Math.floor(n / 10)] + (n % 10 ? " " + (a ? DVA : DV1)[n % 10] : ""));
const dv999 = (n, a) => [Math.floor(n / 100) ? DVHUN[Math.floor(n / 100)] : "", n % 100 ? dv99(n % 100, a) : ""].filter(Boolean).join(" ");
// Whole number in Dhivehi words. a = attributive form (used before a noun such as ރުފިޔާ).
function dvInt(n, a) {
  n = Math.floor(Math.abs(n)); if (!n) return "ސުން";
  const m = Math.floor(n / 1e6), lk = Math.floor(n % 1e6 / 1e5), th = Math.floor(n % 1e5 / 1e3), r = n % 1e3, out = [];
  if (m) out.push(dv999(m, true) + " މިލިއަން");
  if (lk) out.push(DVA[lk] + "ލައްކަ");
  if (th) out.push(th < 20 ? DVA[th] + "ހާސް" : dv99(th, true) + " ހާސް");
  if (r) out.push(dv999(r, a));
  return out.join(" ");
}
// Amount in laari -> Dhivehi words, e.g. "ދެލައްކަ ފަންސާސް ހާސް ރުފިޔާ އާއި ފަންސާސް ލާރި"
function dvMoneyWords(laari) {
  if (laari == null || laari === "" || isNaN(laari)) return "";
  const rf = Math.floor(laari / 100), l = Math.round(laari % 100);
  return dvInt(rf, true) + " ރުފިޔާ" + (l ? " އާއި " + dv99(l, true) + " ލާރި" : "");
}
const EN1 = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const ENT = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const en99 = n => (n < 20 ? EN1[n] : ENT[Math.floor(n / 10)] + (n % 10 ? "-" + EN1[n % 10] : ""));
const en999 = n => [Math.floor(n / 100) ? EN1[Math.floor(n / 100)] + " Hundred" : "", n % 100 ? en99(n % 100) : ""].filter(Boolean).join(" ");
function enInt(n) { n = Math.floor(Math.abs(n)); if (!n) return "Zero"; const S3 = ["", " Thousand", " Million", " Billion"], out = []; let i = 0; while (n) { const c = n % 1000; if (c) out.unshift(en999(c) + S3[i]); n = Math.floor(n / 1000); i++; } return out.join(" "); }
function enMoneyWords(laari) {
  if (laari == null || laari === "" || isNaN(laari)) return "";
  const rf = Math.floor(laari / 100), l = Math.round(laari % 100);
  return enInt(rf) + " Rufiyaa" + (l ? " and " + en99(l) + " Laari" : "") + " Only";
}

// ---------- Thaana phonetic keyboard ----------
const THAANA = { q: "ް", w: "އ", e: "ެ", r: "ރ", t: "ތ", y: "ޔ", u: "ު", i: "ި", o: "ޮ", p: "ޕ", a: "ަ", s: "ސ", d: "ދ", f: "ފ", g: "ގ", h: "ހ", j: "ޖ", k: "ކ", l: "ލ", z: "ޒ", x: "×", c: "ޗ", v: "ވ", b: "ބ", n: "ނ", m: "މ", Q: "ޤ", W: "ޢ", E: "ޭ", R: "ޜ", T: "ޓ", Y: "ޠ", U: "ޫ", I: "ީ", O: "ޯ", P: "÷", A: "ާ", S: "ށ", D: "ޑ", F: "ﷲ", G: "ޣ", H: "ޙ", J: "ޛ", K: "ޚ", L: "ޅ", Z: "ޡ", X: "ޘ", C: "ޝ", V: "ޥ", B: "ޞ", N: "ޏ", M: "ޟ", ",": "،", ";": "؛", "?": "؟", "(": ")", ")": "(" };
const kbOn = () => { try { return localStorage.getItem("mq-thaana") !== "0"; } catch { return true; } };
const kbSet = v => { try { localStorage.setItem("mq-thaana", v ? "1" : "0"); } catch {} document.querySelectorAll(".pcc-kb").forEach(b => { b.classList.toggle("on", v); b.textContent = v ? "ދިވެހި" : "ABC"; }); };
function thaanaInput(el) {
  el.addEventListener("keydown", e => {
    if (!kbOn() || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const ch = THAANA[e.key]; if (!ch) return;
    e.preventDefault();
    const s = el.selectionStart, en = el.selectionEnd;
    el.setRangeText(ch, s, en, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return el;
}
// Small toggle shown on forms that contain Dhivehi fields.
const kbToggle = () => o("button", { type: "button", class: "pcc-kb" + (kbOn() ? " on" : ""), title: "Thaana phonetic keyboard: type Latin keys to get Thaana letters", onclick: () => kbSet(!kbOn()) }, kbOn() ? "ދިވެހި" : "ABC");

// ---------- generic UI bits ----------
function card(title, ...kids) { return o("div", { class: "card" }, title ? o("h3", {}, title) : null, ...kids); }
function empty(text, btn) { return o("div", { class: "pcc-empty" }, o("p", { class: "muted" }, text), btn || null); }
function kvs(rows) { return o("div", { class: "kv" }, rows.filter(Boolean).flatMap(([k, v]) => [o("div", {}, k), o("div", { dir: "auto" }, v == null || v === "" ? "—" : v)])); }
function tbl(head, rows, cls = "") { return o("div", { style: { overflowX: "auto" } }, o("table", { class: "t " + cls }, te(head), o("tbody", {}, rows))); }
const btn = (label, fn, cls = "") => o("button", { type: "button", class: "btn " + cls, onclick: fn }, label);
async function form(title, fields, opts = {}) {
  // fields: [label, element, hint?] ; returns true when saved
  let res = await Mt(title, [opts.top || null, o("div", { class: opts.one ? "" : "grid2" }, fields.filter(Boolean).map(f => (f.nodeType ? f : L(f[0], f[1], f[2]))))], [{ label: "Cancel", value: !1 }, { label: opts.ok || "Save", primary: !0, value: !0, onClick: opts.check ? () => { try { return opts.check() === false ? !1 : void 0; } catch (e) { xt(e.message, "err"); return !1; } } : undefined }]);
  return !!res;
}
const nav = h => { location.hash = h; };
const save = (fn, msg) => ot(fn, msg);

// Live countdown: every minute refresh chips that carry data-due (hours shown in the last week).
setInterval(() => {
  document.querySelectorAll(".pcc-cd[data-due]").forEach(e => {
    const due = e.getAttribute("data-due"), d = dDiff(today(), due);
    if (d >= 0 && d <= 7) {
      const end = new Date(due + "T23:59:59+05:00").getTime(), ms = end - Date.now();
      if (ms > 0) { const dd = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5), mm = Math.floor(ms % 36e5 / 6e4); e.textContent = dd ? `${dd}d ${hh}h left` : `${hh}h ${mm}m left`; }
    }
  });
}, 30000);
