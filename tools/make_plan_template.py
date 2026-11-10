#!/usr/bin/env python3
"""Turns the council's PR-09 Annual Procurement Plan workbook into the portal's plan template.

Input : tools/assets/PR-09-original-2026.xlsx  (the council's own file)
Output: tools/assets/PR-09-plan-template.xlsx  (same file; data rows replaced by one {#loop} row)
        src/pcc/data/pr09-2026.json             (the plan items read from the original)

The workbook XML is edited as text, so the letterhead image, fonts, borders, merged cells,
column widths and print setup stay exactly as in the original. Run from the repository root.
"""
import json, os, re, zipfile, datetime
from openpyxl import load_workbook

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "assets", "PR-09-original-2026.xlsx")
OUT = os.path.join(ROOT, "tools", "assets", "PR-09-plan-template.xlsx")
DATA = os.path.join(ROOT, "src", "pcc", "data", "pr09-2026.json")

# sheet name -> (loop name, category, columns from A)
SHEETS = {
    "Goods": ("goods", "Goods", ["no", "year", "proc_no", "name", "estimate", "funded", "method", "budget_y1", "budget_y2", "budget_y3", "@total", "d_ifb", "d_opening", "d_award", "remarks"]),
    "Works": ("works", "Works", ["no", "year", "proc_no", "name", "estimate", "funded", "method", "budget_y1", "budget_y2", "budget_y3", "@total", "d_ifb", "d_opening", "d_award", "remarks"]),
    "Non consultancy": ("noncons", "Non-consultancy", ["no", "year", "proc_no", "name", "estimate", "funded", "method", "budget_y1", "budget_y2", "budget_y3", "@total", "d_ifb", "d_opening", "d_eval", "d_award", "remarks"]),
    "Consultancy": ("cons", "Consultancy", ["no", "year", "proc_no", "name", "estimate", "funded", "method", "budget_y1", "budget_y2", "budget_y3", "@total", "d_reoi", "d_rfp_issue", "d_rfp_sub", "d_tech", "d_fin_open", "d_combined", "d_award", "remarks"]),
}
FIRST = 9  # first data row in every sheet


def col(n):
    s = ""
    while n:
        n, m = divmod(n - 1, 26)
        s = chr(65 + m) + s
    return s


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def set_cell(xml, ref, inner=None, attrs_extra=""):
    """Replace cell `ref` keeping its style. inner=None clears the value."""
    m = re.search(r'<c r="%s"([^>]*?)(/>|>.*?</c>)' % ref, xml, flags=re.S)
    if not m:
        return xml
    attrs = re.sub(r'\s+t="[^"]*"', "", m.group(1))
    new = '<c r="%s"%s%s/>' % (ref, attrs, attrs_extra) if inner is None else '<c r="%s"%s%s>%s</c>' % (ref, attrs, attrs_extra, inner)
    return xml[:m.start()] + new + xml[m.end():]


def text(t):
    return ' t="inlineStr"', '<is><t xml:space="preserve">%s</t></is>' % esc(t)


def main():
    z = zipfile.ZipFile(SRC)
    files = {n: z.read(n) for n in z.namelist()}
    wb = files["xl/workbook.xml"].decode()
    rels = files["xl/_rels/workbook.xml.rels"].decode()
    rid = {m.group(1): m.group(2) for m in re.finditer(r'<Relationship Id="([^"]+)"[^>]*Target="([^"]+)"', rels)}
    rid.update({m.group(2): m.group(1) for m in re.finditer(r'<Relationship [^>]*Target="([^"]+)"[^>]*Id="([^"]+)"', rels)})
    for m in re.finditer(r'<sheet name="([^"]+)"[^>]*r:id="([^"]+)"', wb):
        name, r = m.group(1), m.group(2)
        if name not in SHEETS:
            continue
        loop, _, cols = SHEETS[name]
        path = "xl/" + rid[r].lstrip("/").replace("xl/", "")
        x = files[path].decode()
        key = min(int(k) for k in re.findall(r'<row r="(\d+)"', x) if re.search(r'<c r="A%s"[^>]*t="s"' % k, x) and int(k) > FIRST)
        last = col(len(cols))
        for i, c in enumerate(cols, start=1):
            ref = col(i) + str(FIRST)
            if c == "@total":
                x = set_cell(x, ref, "<f>SUM(H%d:J%d)</f>" % (FIRST, FIRST))
                continue
            tag = "{%s}" % c
            if i == 1:
                tag = "{#%s}" % loop + tag
            if i == len(cols):
                tag = tag + "{/%s}" % loop
            t, inner = text(tag)
            x = set_cell(x, ref, inner, t)
        for rr in range(FIRST + 1, key):
            for i in range(1, len(cols) + 1):
                x = set_cell(x, col(i) + str(rr))
        # title and budget-year headers
        t, inner = text("ANNUAL PROCUREMENT PLAN {year}")
        x = set_cell(x, "A3", inner, t)
        for i, c in zip(("H", "I", "J"), ("y1", "y2", "y3")):
            t, inner = text("{%s}" % c)
            x = set_cell(x, i + "7", inner, t)
        files[path] = x.encode()
        print(name, "rows", FIRST, "to", key - 1, "→ one loop row; columns A to", last)
    # stale calculation chain out (Excel rebuilds it)
    files.pop("xl/calcChain.xml", None)
    files["[Content_Types].xml"] = re.sub(rb'<Override[^>]*calcChain[^>]*/>', b"", files["[Content_Types].xml"])
    files["xl/_rels/workbook.xml.rels"] = re.sub(rb'<Relationship[^>]*calcChain[^>]*/>', b"", files["xl/_rels/workbook.xml.rels"])
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as o:
        for n in z.namelist():
            if n in files:
                o.writestr(n, files[n])
    print("template:", OUT)

    # ---- plan items from the original ----
    wbx = load_workbook(SRC, data_only=True)
    items = []
    for name, (loop, cat, cols) in SHEETS.items():
        if name not in wbx.sheetnames:
            continue
        ws = wbx[name]
        for r in range(FIRST, ws.max_row + 1):
            v = {c: ws.cell(r, i).value for i, c in enumerate(cols, start=1)}
            if str(v["no"]).strip() == "Key":
                break
            if not v.get("name") and not v.get("proc_no"):
                continue
            def num(x):
                return None if x in (None, "", "-") else round(float(x) * 100)
            def d(x):
                return x.date().isoformat() if isinstance(x, datetime.datetime) else (x.isoformat() if isinstance(x, datetime.date) else None)
            items.append({
                "procNo": str(v["proc_no"] or "").strip(), "year": int(v["year"] or 2026), "type": cat,
                "itemDv": str(v["name"] or "").strip(), "estimate": num(v["estimate"]), "funding": v.get("funded") or "",
                "method": v.get("method") or "", "budget": [num(v["budget_y1"]), num(v["budget_y2"]), num(v["budget_y3"])],
                "dates": {k[2:]: d(v[k]) for k in cols if k.startswith("d_") and d(v.get(k))},
                "remarks": str(v.get("remarks") or "").strip(),
            })
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    json.dump(items, open(DATA, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(len(items), "plan items →", DATA)


if __name__ == "__main__":
    main()
