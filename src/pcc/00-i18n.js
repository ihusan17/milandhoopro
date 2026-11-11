// Dhivehi interface. The language button in the top bar switches the whole portal to Dhivehi
// (right-to-left, Faruma). Only interface texts are replaced: a text is translated when it matches
// a dictionary entry exactly (or a pattern), so names, amounts, references and anything staff type
// stay as they are. The choice is kept per device; wording corrections are shared (Translations).
const I18N = (() => {
  const KEY = "mq-lang", ATTRS = ["placeholder", "title", "aria-label"];
  let lang = (() => { try { return localStorage.getItem(KEY) || "en"; } catch (e) { return "en"; } })();
  const orig = new WeakMap(), missing = new Map();
  const over = () => { try { return (window.__app && window.__app.K && window.__app.K.Z && window.__app.K.Z.i18n) || {}; } catch (e) { return {}; } };
  const norm = s => s.replace(/\s+/g, " ").trim();
  function tr(s) {
    const k = norm(s); if (!k) return null;
    const o2 = over(); if (o2[k]) return o2[k];
    if (Object.prototype.hasOwnProperty.call(DV_DICT, k)) return DV_DICT[k];
    for (const [re, rep] of DV_PAT) if (re.test(k)) return k.replace(re, rep);
    return null;
  }
  const skip = el => !el || el.closest("script,style,textarea,code,pre,.pcc-docx,[contenteditable],[data-noi18n],.pcc-xl");
  const looksLikeUi = s => s.length <= 70 && /[A-Za-z]{3}/.test(s) && !/[ހ-޿]/.test(s) && !/\d{3,}|[\/\\{}@]|^[A-Z0-9\-\/()]+$/.test(s);
  function doText(n) {
    const el = n.parentElement; if (skip(el)) return;
    const cur = n.nodeValue, base = orig.has(n) ? orig.get(n) : null;
    if (lang !== "dv") { if (base != null && cur === base.dv) n.nodeValue = base.en; return; }
    if (base && cur === base.dv) return;
    const t = tr(cur);
    if (t != null) { const lead = cur.match(/^\s*/)[0], trail = cur.match(/\s*$/)[0], dv = lead + t + trail; orig.set(n, { en: cur, dv }); n.nodeValue = dv; }
    else { const k = norm(cur); looksLikeUi(k) && missing.set(k, (missing.get(k) || 0) + 1); }
  }
  function doAttrs(el) {
    if (skip(el)) return;
    ATTRS.forEach(a => {
      if (!el.hasAttribute(a)) return;
      const saved = el.getAttribute("data-en-" + a), cur = el.getAttribute(a);
      if (lang !== "dv") { if (saved != null) { el.setAttribute(a, saved); el.removeAttribute("data-en-" + a); } return; }
      if (saved != null && cur !== saved) return;
      const t = tr(cur); if (t != null) { el.setAttribute("data-en-" + a, cur); el.setAttribute(a, t); }
    });
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n = root;
    do { n.nodeType === 3 ? doText(n) : doAttrs(n); } while ((n = w.nextNode()));
  }
  function applyDir() {
    const h = document.documentElement;
    if (lang === "dv") { h.setAttribute("dir", "rtl"); h.classList.add("pcc-ui-dv"); }
    else { h.removeAttribute("dir"); h.classList.remove("pcc-ui-dv"); }
  }
  let busy = false;
  const mo = new MutationObserver(list => {
    if (busy) return; busy = true;
    try { for (const m of list) { if (m.type === "childList") m.addedNodes.forEach(walk); else if (m.type === "characterData") doText(m.target); else if (m.type === "attributes") doAttrs(m.target); } ensureButton(); }
    finally { busy = false; }
  });
  function ensureButton() {
    const right = document.querySelector(".tb-right"); if (!right || right.querySelector(".pcc-lang")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "tb-btn pcc-lang"; b.setAttribute("data-noi18n", "");
    b.title = "Language / ބަސް"; b.textContent = lang === "dv" ? "EN" : "ދިވެހި";
    b.onclick = e => { e.shiftKey || e.altKey ? editor() : set(lang === "dv" ? "en" : "dv"); };
    b.oncontextmenu = e => { e.preventDefault(); editor(); };
    right.insertBefore(b, right.firstChild);
  }
  function set(l) {
    lang = l; try { localStorage.setItem(KEY, l); } catch (e) {}
    applyDir(); const b = document.querySelector(".pcc-lang"); b && (b.textContent = lang === "dv" ? "EN" : "ދިވެހި");
    busy = true; try { walk(document.body); } finally { busy = false; }
  }
  // Translations editor (administrators): fix wording or add the texts still shown in English.
  async function editor() {
    const K = window.__app.K, Z = K.Z, o = K.o;
    if (typeof can === "function" && !can("templates")) { K.xt && K.xt("Only administrators can change translations", "err"); return; }
    const ov = Object.assign({}, Z.i18n || {}), q = o("input", { type: "search", placeholder: "Search English or Dhivehi" }), box = o("div", { class: "pcc-i18n-list" });
    const keys = () => [...new Set([...missing.keys(), ...Object.keys(ov), ...Object.keys(DV_DICT)])];
    const draw = () => { const s = q.value.trim().toLowerCase(); box.replaceChildren(...keys().filter(k => !s || k.toLowerCase().includes(s) || String(ov[k] || DV_DICT[k] || "").includes(q.value.trim())).sort((a, b) => (DV_DICT[a] || ov[a] ? 1 : 0) - (DV_DICT[b] || ov[b] ? 1 : 0) || a.localeCompare(b)).slice(0, 300).map(k => {
      const inp = o("input", { type: "text", dir: "rtl", lang: "dv", class: "dv", value: ov[k] || DV_DICT[k] || "", placeholder: "ދިވެހި" });
      inp.addEventListener("input", () => { const v = inp.value.trim(); v && v !== DV_DICT[k] ? (ov[k] = v) : delete ov[k]; });
      return o("div", { class: "pcc-i18n-row" + (!DV_DICT[k] && !ov[k] ? " miss" : "") }, o("div", { dir: "ltr", class: "small" }, k), inp);
    })); };
    q.addEventListener("input", draw); draw();
    const ok = await K.Mt("Translations — ތަރުޖަމާ", [o("p", { class: "muted small", dir: "ltr" }, "Dhivehi wording for the interface. Texts still shown in English on the pages you opened are listed first (highlighted). Changes are shared with all staff."), q, box], [{ label: "Cancel", value: !1 }, { label: "Save", primary: !0, value: !0 }]);
    if (!ok) return;
    Z.i18n = ov; K.Qt && K.Qt(); K.xt && K.xt("Translations saved");
    lang === "dv" && (set("en"), set("dv"));
  }
  function start() { applyDir(); ensureButton(); if (lang === "dv") walk(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : setTimeout(start, 0);
  return { set, tr, editor, get lang() { return lang; }, missing };
})();
window.__i18n = I18N;
