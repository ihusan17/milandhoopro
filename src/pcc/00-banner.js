// Page banner: adds a small label above each page title ("Milandhoo Council · Projects") and
// selects the banner design (html[data-banner]).
(() => {
  const pick = () => { try { return localStorage.getItem("mq-banner") || ""; } catch (e) { return "1"; } };
  const tag = () => {
    const b = pick(); b ? document.documentElement.setAttribute("data-banner", b) : document.documentElement.removeAttribute("data-banner");
    const h = document.querySelector(".screen>h1:first-child, .screen>.row:first-child h1"); if (!h) return;
    const nav = document.querySelector("header#top nav a.on, header#top nav a[aria-current='page'], header#top nav a.active"), sec = nav ? nav.textContent.trim() : "";
    const dv = document.documentElement.classList.contains("pcc-ui-dv"), t = (dv ? "މިލަންދޫ ކައުންސިލް" : "Milandhoo Council") + (sec && sec !== h.textContent.trim() ? " · " + sec : "");
    h.getAttribute("data-eyebrow") !== t && h.setAttribute("data-eyebrow", t);
  };
  new MutationObserver(() => tag()).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(tag, 0);
})();
