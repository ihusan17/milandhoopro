// Injects the Projects Command Centre into index.html (single-file deploy).
// Usage: node tools/build-pcc.mjs
// Source: src/pcc/*.js (concatenated in name order into one IIFE), src/pcc/pcc.css,
// src/pcc/doclibs.min.js (docxtemplater, pizzip, jszip, docx-preview — rebuild with
// tools/build-doclibs.sh), demo templates in src/pcc/demo (made by tools/make_demo_templates.py).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = path.join(root, "src/pcc"), html = path.join(root, "index.html");
const noClose = s => s.replace(/<\/script/gi, "<\\/script");
const js = fs.readdirSync(src).filter(f => /^\d\d-.*\.js$/.test(f)).sort().map(f => `// ===== ${f} =====\n` + fs.readFileSync(path.join(src, f), "utf8")).join("\n");
const css = fs.readFileSync(path.join(src, "pcc.css"), "utf8");
const libs = fs.readFileSync(path.join(src, "doclibs.min.js"), "utf8");
const demoDir = path.join(src, "demo"), meta = JSON.parse(fs.readFileSync(path.join(demoDir, "meta.json"), "utf8")), demo = {};
for (const m of meta) { const b = fs.readFileSync(path.join(demoDir, m.file)); demo[m.code] = { b: b.toString("base64") }; m.size = b.length; }
const block = [
  "<!--PCC:BEGIN-->",
  `<style id="pcc-css">${css}</style>`,
  `<script id="pcc-libs">${noClose(libs)}</script>`,
  `<script id="pcc-demo">window.__PCC_BUILD=${JSON.stringify(new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 16).replace("T", " "))};window.__PCC_DEMO=${JSON.stringify(demo)};window.__PCC_DEMO_META=${noClose(JSON.stringify(meta))};window.__PCC_PR09=${noClose(fs.readFileSync(path.join(src, "data/pr09-2026.json"), "utf8").replace(/\s*\n\s*/g, ""))};</script>`,
  `<script id="pcc-app">(()=>{"use strict";\n${noClose(js)}\n})();</script>`,
  "<!--PCC:END-->",
].join("\n");
let h = fs.readFileSync(html, "utf8");
const a = h.indexOf("<!--PCC:BEGIN-->"), b = h.indexOf("<!--PCC:END-->");
if (a >= 0 && b > a) h = h.slice(0, a) + block + h.slice(b + "<!--PCC:END-->".length);
else { const i = h.lastIndexOf("</body>"); if (i < 0) throw new Error("no </body>"); h = h.slice(0, i) + block + "\n" + h.slice(i); }
fs.writeFileSync(html, h);
console.log(`index.html updated: app ${(js.length / 1024).toFixed(0)} KB, css ${(css.length / 1024).toFixed(0)} KB, libs ${(libs.length / 1024).toFixed(0)} KB, ${meta.length} demo templates, total ${(h.length / 1048576).toFixed(2)} MB`);
