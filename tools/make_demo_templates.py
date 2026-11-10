#!/usr/bin/env python3
"""Builds the built-in DEMO templates in src/pcc/demo (Word + Excel with {placeholders}).

These are stand-ins until the council uploads its original templates under
Projects > Templates (Upload new version). Needs: python-docx, openpyxl.
Run from the repository root:  python3 tools/make_demo_templates.py
"""
import json, os, re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.worksheet.properties import PageSetupProperties

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "pcc", "demo")
HEAD = os.path.join(ROOT, "tools", "assets", "letterhead-header.jpg")
FOOT = os.path.join(ROOT, "tools", "assets", "letterhead-footer.jpg")
os.makedirs(OUT, exist_ok=True)
META = []
TEAL = RGBColor(0x0B, 0x6E, 0x5F)


def _rpr(run, size=13, bold=False, rtl=True, color=None):
    rpr = run._r.get_or_add_rPr()
    f = rpr.find(qn("w:rFonts"))
    if f is None:
        f = OxmlElement("w:rFonts"); rpr.insert(0, f)
    if rtl:
        for a in ("w:cs", "w:ascii", "w:hAnsi"):
            f.set(qn(a), "Faruma")
        rpr.append(OxmlElement("w:rtl"))
    else:
        for a in ("w:ascii", "w:hAnsi"):
            f.set(qn(a), "Calibri")
        f.set(qn("w:cs"), "Faruma")
    run.font.size = Pt(size)
    sz = OxmlElement("w:szCs"); sz.set(qn("w:val"), str(int(size * 2))); rpr.append(sz)
    if bold:
        run.bold = True
        rpr.append(OxmlElement("w:bCs"))
    if color is not None:
        run.font.color.rgb = color


def _align(p, align, rtl):
    """Word reads left/right in a right-to-left paragraph as start/end: visual right = no jc (start), visual left = "right"."""
    if not rtl:
        p.alignment = align if align is not None else WD_ALIGN_PARAGRAPH.LEFT
    elif align == WD_ALIGN_PARAGRAPH.CENTER:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == WD_ALIGN_PARAGRAPH.LEFT:
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT


def para(container, text="", size=13, bold=False, rtl=True, align=None, after=4, color=None):
    p = container.add_paragraph()
    if rtl:
        p._p.get_or_add_pPr().append(OxmlElement("w:bidi"))
    _align(p, align, rtl)
    p.paragraph_format.space_after = Pt(after)
    if text:
        _rpr(p.add_run(text), size, bold, rtl, color)
    return p


def cell_text(cell, text, size=12, bold=False, rtl=True, align=None, shade=None):
    cell.text = ""
    p = cell.paragraphs[0]
    if rtl:
        p._p.get_or_add_pPr().append(OxmlElement("w:bidi"))
    _align(p, align, rtl)
    if text:
        _rpr(p.add_run(text), size, bold, rtl)
    if shade:
        tcpr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd")
        sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), shade); tcpr.append(sh)


def table(doc, rows, widths=None, header=True, rtl=True, size=11.5):
    t = doc.add_table(rows=len(rows), cols=len(rows[0]))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    if rtl:
        t._tbl.tblPr.append(OxmlElement("w:bidiVisual"))
    for i, r in enumerate(rows):
        for j, v in enumerate(r):
            cell_text(t.cell(i, j), v, size=size, bold=header and i == 0, rtl=rtl, shade="D9EEE8" if header and i == 0 else None)
            if widths:
                t.cell(i, j).width = Cm(widths[j])
    doc.add_paragraph()
    return t


def new_doc(letterhead=False):
    """Letterhead images only on letters and memos, to keep the built-in demo set small."""
    d = Document()
    s = d.sections[0]
    s.page_height, s.page_width = Cm(29.7), Cm(21)
    s.left_margin = s.right_margin = Cm(2)
    s.top_margin, s.bottom_margin = Cm(1.6), Cm(1.6)
    s.header_distance = s.footer_distance = Cm(0.6)
    st = d.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(11)
    st.element.rPr.rFonts.set(qn("w:cs"), "Faruma")
    if not letterhead:
        hp = s.header.paragraphs[0]; hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _rpr(hp.add_run("މިލަންދޫ ކައުންސިލްގެ އިދާރާ"), 13, True)
        hp2 = s.header.add_paragraph(); hp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _rpr(hp2.add_run("Secretariat of the Milandhoo Council, Sh. Milandhoo, Maldives"), 9, False, False)
    if letterhead:
        hp = s.header.paragraphs[0]; hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        hp.add_run().add_picture(HEAD, width=Cm(17))
        fp = s.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fp.add_run().add_picture(FOOT, width=Cm(17))
    return d


def demo_note(d):
    para(d, "DEMO TEMPLATE — replace with the council's original under Projects › Templates › Upload new version.", size=8, rtl=False, color=RGBColor(0x99, 0x99, 0x99), align=WD_ALIGN_PARAGRAPH.CENTER)


def ref_block(d, ref="{letter_ref}", date="{letter_date_dv}"):
    t = d.add_table(rows=1, cols=2)
    t._tbl.tblPr.append(OxmlElement("w:bidiVisual"))
    cell_text(t.cell(0, 0), "ނަންބަރު: " + ref, 11.5)
    cell_text(t.cell(0, 1), "ތާރީޚު: " + date, 11.5, align=WD_ALIGN_PARAGRAPH.LEFT)
    d.add_paragraph()


def sign_block(d, name="{signatory_name}", des="{signatory_designation}"):
    para(d, "")
    para(d, "{letter_date_hijri}", 12)
    para(d, "{letter_date_dv}", 12, after=18)
    para(d, "......................................", 12, align=WD_ALIGN_PARAGRAPH.LEFT)
    para(d, name, 12.5, True, align=WD_ALIGN_PARAGRAPH.LEFT)
    para(d, des, 11.5, align=WD_ALIGN_PARAGRAPH.LEFT)


def committee_signatures(d, loop):
    table(d, [["#", "ނަން", "މަޤާމު", "ކޮމިޓީގެ މަޤާމު", "ސޮއި"], ["{#" + loop + "}{no}", "{member_name_dv}", "{member_designation_dv}", "{member_role_dv}", "{/" + loop + "}"]], widths=[1, 5, 4.5, 3, 3.5])


def attendance(d, loop):
    """Attendance table like the council's: arrival / leaving sign and time; a member on leave becomes one grey merged cell."""
    t = d.add_table(rows=3, cols=8)
    t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t._tbl.tblPr.append(OxmlElement("w:bidiVisual"))
    widths = [0.9, 4.2, 3.6, 1.6, 2.2, 1.4, 2.2, 1.4]
    head1 = ["#", "ނަން", "މަޤާމު", "ހާޒިރީ", "ޖަލްސާއަށް ވަދެވުނު", "", "ޖަލްސާއިން ނިކުމެވުނު", ""]
    head2 = ["", "", "", "", "ސޮއި", "ގަޑި", "ސޮއި", "ގަޑި"]
    for j in range(8):
        cell_text(t.cell(0, j), head1[j], 11, True, shade="D9EEE8", align=WD_ALIGN_PARAGRAPH.CENTER)
        cell_text(t.cell(1, j), head2[j], 11, True, shade="D9EEE8", align=WD_ALIGN_PARAGRAPH.CENTER)
    row = ["{#" + loop + "}{no}", "{member_name_dv}", "{member_designation_dv}", "{absent_mark}", "{leave}", "", "", "{/" + loop + "}"]
    for j, v in enumerate(row):
        cell_text(t.cell(2, j), v, 11.5, align=WD_ALIGN_PARAGRAPH.CENTER if j in (0, 3) else None)
    for r in range(3):
        for j in range(8):
            t.cell(r, j).width = Cm(widths[j])
    for j in range(4):
        a = t.cell(0, j); a.merge(t.cell(1, j)); cell_text(a, head1[j], 11, True, shade="D9EEE8", align=WD_ALIGN_PARAGRAPH.CENTER)
    for j in (4, 6):
        a = t.cell(0, j); a.merge(t.cell(0, j + 1)); cell_text(a, head1[j], 11, True, shade="D9EEE8", align=WD_ALIGN_PARAGRAPH.CENTER)
    d.add_paragraph()


def save_doc(d, code, group, en, dv, order=0, per="", pack=False):
    fn = code + ".docx"
    d.core_properties.title = en
    d.core_properties.author = "Milandhoo Council"
    d.save(os.path.join(OUT, fn))
    META.append(dict(code=code, file=fn, type="docx", group=group, nameEn=en, nameDv=dv, order=order, perMember=per, inPack=pack))


# ---------------- Bid Committee pack ----------------
d = new_doc(True); demo_note(d)
ref_block(d, "{bid_meeting_no}", "{today_dv}")
para(d, "{member_name_dv}", 13, True)
para(d, "{member_designation_dv}", 12)
para(d, "ބިޑް ކޮމިޓީ ބައްދަލުވުމަށް ދައުވަތު", 15, True, align=WD_ALIGN_PARAGRAPH.CENTER, after=10, color=TEAL)
para(d, "{project_name_dv} ({ref_no}) ގެ ބީލަމާ ގުޅޭގޮތުން ބިޑް ކޮމިޓީގެ ބައްދަލުވުމެއް {bid_meeting_date_dv_dmy} ވަނަ ދުވަހުގެ {bid_meeting_time} ގައި ކައުންސިލްގެ އިދާރާގައި ބޭއްވުމަށް ނިންމާފައިވާތީ، މި ބައްދަލުވުމަށް ޙާޟިރުވެވަޑައިގަތުމަށް ދަންނަވަމެވެ.", 13, after=8)
table(d, [["ބައްދަލުވުމުގެ ނަންބަރު", "{bid_meeting_no}"], ["ތާރީޚު", "{bid_meeting_date_dv_both}"], ["ގަޑި", "{bid_meeting_time}"], ["އިޢުލާން ނަންބަރު", "{advertisement_no}"], ["އިޢުލާން ކުރި ތާރީޚު", "{advertised_date_dv}"], ["ބީލަން ހުޅުވި ތާރީޚު", "{bid_opening_date_dv}"]], widths=[5, 12], header=False)
para(d, "ކޮމިޓީގައި ތިޔަބޭފުޅާގެ މަޤާމު: {member_role_dv}", 13)
sign_block(d, "{project_officer}", "{project_officer_designation}")
save_doc(d, "BC-INV", "Bid Committee", "Invitation to Bid Committee member", "ބިޑް ކޮމިޓީ ބައްދަލުވުމަށް ދައުވަތު", 1, "bid", True)

d = new_doc(); demo_note(d)
para(d, "ބިޑް ކޮމިޓީގެ ބައްދަލުވުމުގެ ޔައުމިއްޔާ", 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
table(d, [["މަޝްރޫޢު", "{project_name_dv}"], ["ރެފަރެންސް", "{ref_no}"], ["އިޢުލާން ނަންބަރު", "{advertisement_no}"], ["ބައްދަލުވި ތާރީޚު", "{bid_opening_date_dv}"], ["ތަން", "މިލަންދޫ ކައުންސިލްގެ އިދާރާ"]], widths=[5, 12], header=False)
para(d, "ޙާޟިރުވި މެމްބަރުން", 13, True)
attendance(d, "bid_members")
para(d, "ބީލަން ހުށަހެޅި ފަރާތްތައް", 13, True)
table(d, [["#", "ބީލަން ހުށަހެޅި ފަރާތް", "އަގު (ރ)", "މުއްދަތު (ދުވަސް)", "ރޭންކް"], ["{#bidders}{no}", "{bidder_name}", "{bid_amount}", "{duration_offered}", "{rank}{/bidders}"]], widths=[1, 6, 4, 3, 2])
para(d, "ބައްދަލުވުމުގައި ނިންމި ކަންތައްތައް", 13, True)
for i in range(1, 5):
    para(d, f"{i}. ...........................................................................................................", 12)
save_doc(d, "BC-YAU", "Bid Committee", "Yaumiyya (minutes) format", "ބިޑް ކޮމިޓީ ބައްދަލުވުމުގެ ޔައުމިއްޔާ", 2, "", True)

d = new_doc(); demo_note(d)
para(d, "PR-05", 10, rtl=False, align=WD_ALIGN_PARAGRAPH.LEFT)
para(d, "ބީލަން ހަވާލުކުރުމުގެ ނިންމުން", 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
table(d, [["މަޝްރޫޢު", "{project_name_dv}"], ["Project", "{project_name_en}"], ["ރެފަރެންސް / PR", "{ref_no} / {pr_number}"], ["އިޢުލާން ނަންބަރު", "{advertisement_no}"], ["ބީލަން ހުޅުވި ތާރީޚު", "{bid_opening_date_dv}"], ["ބީލަން ހުށަހެޅި ފަރާތްތަކުގެ އަދަދު", "{bidder_count}"]], widths=[6, 11], header=False)
table(d, [["ރޭންކް", "ފަރާތް", "އަގު (ރ)", "ޖުމްލަ މާކްސް", "ޤަބޫލުކުރެވޭ"], ["{#bidders}{rank}", "{bidder_name}", "{bid_amount}", "{total_score}", "{responsive}{/bidders}"]], widths=[2, 6, 4, 3, 2.5])
para(d, "ނިންމުން", 13, True)
para(d, "މަތީގައިވާ ބީލަން ވަޒަންކުރުމަށްފަހު، {project_name_dv} ގެ މަސައްކަތް {award_bidder} އަށް {award_amount} ރުފިޔާ ({award_amount_words_dv}) އަށް، {award_duration} ދުވަހުގެ މުއްދަތެއްގައި ހަވާލުކުރުމަށް ބިޑް ކޮމިޓީން ނިންމީމެވެ.", 13, after=10)
committee_signatures(d, "bid_members")
para(d, "ތާރީޚު: {award_date_dv}", 12)
save_doc(d, "PR-05", "Bid Committee", "Award sheet / decision", "ބީލަން ހަވާލުކުރުމުގެ ނިންމުން", 3, "", True)

# ---------------- meetings covering several projects ----------------
def meeting_minutes(code, group, en, dv, title, members):
    d = new_doc(); demo_note(d)
    para(d, title, 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
    table(d, [["ބައްދަލުވުމުގެ ނަންބަރު", "{meeting_ref}"], ["ތާރީޚު", "{meeting_date_dv}"], ["ވަގުތު", "{meeting_time}"], ["ތަން", "{meeting_place}"], ["މަޝްރޫޢުތަކުގެ އަދަދު", "{project_count}"]], widths=[5, 12], header=False)
    para(d, "ޙާޟިރުވި މެމްބަރުން", 13, True)
    attendance(d, members)
    para(d, "{#projects}", 11)
    para(d, "{no}. {project_name_dv}", 14, True, color=TEAL)
    table(d, [["ރެފަރެންސް", "{ref_no}"], ["އިޢުލާން ނަންބަރު", "{advertisement_no}"], ["ބީލަން ހުޅުވި ތާރީޚު", "{bid_opening_date_dv}"], ["ލަފާކުރި އަގު", "{estimated_cost} ރ"]], widths=[5, 12], header=False)
    table(d, [["ރޭންކް", "ބީލަން ހުށަހެޅި ފަރާތް", "އަގު (ރ)", "މުއްދަތު", "ޖުމްލަ"], ["{#bidders}{rank}", "{bidder_name}", "{bid_amount}", "{duration_offered}", "{total_score}{/bidders}"]], widths=[2, 6, 4, 3, 2])
    para(d, "ނިންމުން: .......................................................................................................", 12.5)
    para(d, "{/projects}", 11)
    para(d, "ސޮއި", 13, True)
    table(d, [["#", "ނަން", "ސޮއި"], ["{#" + members + "}{no}", "{member_name_dv}", "{/" + members + "}"]], widths=[1, 8, 8])
    save_doc(d, code, group, en, dv, 10, members.split("_")[0] if False else "", False)
    META[-1]["meeting"] = True

meeting_minutes("BC-YAU-M", "Bid Committee", "Yaumiyya — meeting for several projects", "ބިޑް ކޮމިޓީ ބައްދަލުވުމުގެ ޔައުމިއްޔާ (އެތައް މަޝްރޫޢެއް)", "ބިޑް ކޮމިޓީ ބައްދަލުވުމުގެ ޔައުމިއްޔާ", "bid_members")
meeting_minutes("EV-YAU-M", "Evaluation Committee", "Evaluation meeting minutes — several projects", "ވަޒަންކުރާ ކޮމިޓީ ބައްދަލުވުމުގެ ޔައުމިއްޔާ (އެތައް މަޝްރޫޢެއް)", "ބީލަން ވަޒަންކުރާ ކޮމިޓީ ބައްދަލުވުމުގެ ޔައުމިއްޔާ", "eval_members")

d = new_doc(True); demo_note(d)
ref_block(d, "{meeting_ref}", "{today_dv}")
para(d, "{member_name_dv}", 13, True)
para(d, "{member_designation_dv}", 12)
para(d, "ބިޑް ކޮމިޓީ ބައްދަލުވުމަށް ދައުވަތު", 15, True, align=WD_ALIGN_PARAGRAPH.CENTER, after=10, color=TEAL)
para(d, "ތިރީގައިވާ މަޝްރޫޢުތަކުގެ ބީލަމާ ގުޅޭގޮތުން ބިޑް ކޮމިޓީގެ ބައްދަލުވުމެއް {meeting_date_dv} ވަނަ ދުވަހުގެ {meeting_time} ގައި {meeting_place} ގައި ބޭއްވުމަށް ނިންމާފައިވާތީ، މި ބައްދަލުވުމަށް ޙާޟިރުވެވަޑައިގަތުމަށް ދަންނަވަމެވެ.", 13, after=8)
table(d, [["#", "މަޝްރޫޢު", "ރެފަރެންސް", "އިޢުލާން ނަންބަރު"], ["{#projects}{no}", "{project_name_dv}", "{ref_no}", "{advertisement_no}{/projects}"]], widths=[1, 8, 4, 4])
para(d, "ކޮމިޓީގައި ތިޔަބޭފުޅާގެ މަޤާމު: {member_role_dv}", 13)
sign_block(d, "{signatory_name}", "{signatory_designation}")
save_doc(d, "BC-INV-M", "Bid Committee", "Invitation — meeting for several projects", "ބިޑް ކޮމިޓީ ބައްދަލުވުމަށް ދައުވަތު (އެތައް މަޝްރޫޢެއް)", 11, "bid", False)
META[-1]["meeting"] = True

# ---------------- Evaluation Committee pack ----------------
d = new_doc(); demo_note(d)
para(d, "PR-03", 10, rtl=False, align=WD_ALIGN_PARAGRAPH.LEFT)
para(d, "މަޝްރޫޢުގެ ޚުލާޞާ - ޝީޓް 01", 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
table(d, [["މަޝްރޫޢުގެ ނަން", "{project_name_dv}"], ["Project name", "{project_name_en}"], ["ރެފަރެންސް", "{ref_no}"], ["ބާވަތް", "{type_dv}"], ["ތަން", "{location}"], ["ބަޖެޓް ކޯޑު", "{budget_code}"], ["ލަފާކުރި އަގު", "{estimated_cost} ރ ({estimated_cost_words_dv})"], ["އިޢުލާން ނަންބަރު / ތާރީޚު", "{advertisement_no} / {advertised_date_dv}"], ["ބީލަން ހުޅުވި ތާރީޚު", "{bid_opening_date_dv}"], ["ބީލަން ހުށަހެޅި ފަރާތްތައް", "{bidder_count}"], ["މަސައްކަތުގެ މުއްދަތު", "{duration_days} ދުވަސް"]], widths=[6, 11], header=False)
para(d, "ބީލަން ވަޒަންކުރާ ކޮމިޓީ", 13, True)
committee_signatures(d, "eval_members")
para(d, "ސްކޯޕް", 13, True)
para(d, "{description_dv}", 12)
save_doc(d, "PR-03", "Evaluation Committee", "Project Summary Sheet 01", "މަޝްރޫޢުގެ ޚުލާޞާ ޝީޓް 01", 1, "", True)

d = new_doc(); demo_note(d)
para(d, "PR-02", 10, rtl=False, align=WD_ALIGN_PARAGRAPH.LEFT)
para(d, "ބީލަން ވަޒަންކުރާ ކޮމިޓީގެ މެމްބަރެއްގެ އިޢުލާން", 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
para(d, "މަޝްރޫޢު: {project_name_dv} ({ref_no})", 13, True, after=10)
para(d, "އަހަރެން {member_name_dv} ({member_designation_dv})، މަތީގައިވާ މަޝްރޫޢުގެ ބީލަން ވަޒަންކުރާ ކޮމިޓީގެ {member_role_dv} ގެ ގޮތުގައި ތިރީގައިވާ ކަންކަމަށް އިޤްރާރުވަމެވެ.", 13, after=8)
for i, s in enumerate(["ބީލަމަށް ހުށަހެޅި އެއްވެސް ފަރާތަކާއި އަހަރެންނާ ދެމެދު ޒާތީ، ޢާއިލީ ނުވަތަ މާލީ ގުޅުމެއް ނެތްކަން.", "ބީލަން ވަޒަންކުރުމުގައި ޢަދުލުވެރިކަމާއެކު، ޤަވާޢިދާ އެއްގޮތަށް އަމަލުކުރާނެކަން.", "ވަޒަންކުރުމުގެ މަޢުލޫމާތު ސިއްރުކޮށް ހިފަހައްޓާނެކަން.", "މަސްލަޙަތު ފުށުއަރާ ޙާލަތެއް މެދުވެރިވެއްޖެނަމަ ވަގުތުން އަންގާނެކަން."], 1):
    para(d, f"{i}. {s}", 12.5)
para(d, "")
table(d, [["ނަން", "{member_name_dv}"], ["މަޤާމު", "{member_designation_dv}"], ["ސޮއި", ""], ["ތާރީޚު", "{evaluation_date_dv}"]], widths=[5, 12], header=False)
save_doc(d, "PR-02", "Evaluation Committee", "Declaration of Evaluation Committee member", "ބީލަން ވަޒަންކުރާ ކޮމިޓީގެ މެމްބަރުގެ އިޢުލާން", 2, "eval", True)

d = new_doc(); demo_note(d)
para(d, "ބީލަން ވަޒަންކުރުމުގެ ރިޕޯޓް", 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
table(d, [["މަޝްރޫޢު", "{project_name_dv}"], ["ރެފަރެންސް", "{ref_no}"], ["ވަޒަންކުރި ތާރީޚު", "{evaluation_date_dv}"], ["ލަފާކުރި އަގު", "{estimated_cost} ރ"]], widths=[5, 12], header=False)
para(d, "ވަޒަންކުރުމުގެ ނަތީޖާ", 13, True)
table(d, [["ރޭންކް", "ފަރާތް", "އަގު (ރ)", "މުއްދަތު", "ޓެކްނިކަލް", "ފައިނޭންޝަލް", "ޖުމްލަ", "ޤަބޫލު"], ["{#bidders}{rank}", "{bidder_name}", "{bid_amount}", "{duration_offered}", "{technical_score}", "{financial_score}", "{total_score}", "{responsive}{/bidders}"]], widths=[1.5, 4, 2.6, 1.8, 1.8, 1.8, 1.6, 1.6], size=10.5)
para(d, "ލަފާ", 13, True)
para(d, "ވަޒަންކުރުމުގެ ނަތީޖާއަށް ބަލައި، މި މަސައްކަތް {award_bidder} އަށް {award_amount} ރުފިޔާ ({award_amount_words_dv}) އަށް ހަވާލުކުރުމަށް ކޮމިޓީން ލަފާދެމެވެ.", 13, after=10)
committee_signatures(d, "eval_members")
save_doc(d, "EV-RPT", "Evaluation Committee", "Bid Evaluation Report", "ބީލަން ވަޒަންކުރުމުގެ ރިޕޯޓް", 3, "", True)

# ---------------- letters, memos, reports ----------------
def letter(code, group, en, dv, title, body_lines, extra_rows=None, to=True):
    d = new_doc(True); demo_note(d)
    ref_block(d)
    if to:
        para(d, "{recipient_name}", 13, True)
        para(d, "{recipient_address}", 12, after=10)
    para(d, title, 15, True, align=WD_ALIGN_PARAGRAPH.CENTER, after=8, color=TEAL)
    if extra_rows:
        table(d, extra_rows, widths=[5, 12], header=False)
    for ln in body_lines:
        para(d, ln, 13, after=8)
    sign_block(d)
    save_doc(d, code, group, en, dv)


letter("LTR-GEN", "Letters", "General letter", "ސިޓީ", "{subject}", ["{body}"])
letter("LTR-CON", "Letters", "Letter to contractor", "ކޮންޓްރެކްޓަރަށް ފޮނުވާ ސިޓީ", "{subject}", ["{body}"], [["މަޝްރޫޢު", "{project_name_dv}"], ["ރެފަރެންސް", "{ref_no}"], ["އެގްރީމެންޓް ތާރީޚު", "{agreement_date_dv}"]])
letter("LTR-EOT", "Letters", "Extension of time letter", "މުއްދަތު އިތުރުކުރުމުގެ ސިޓީ", "މަސައްކަތުގެ މުއްދަތު އިތުރުކުރުން", ["{project_name_dv} ({ref_no}) ގެ މަސައްކަތް ނިންމުމަށް ދީފައިވާ މުއްދަތު، {eot_reason} ސަބަބުން {eot_days} ދުވަހުން އިތުރުކޮށް، މަސައްކަތް ނިންމަންޖެހޭ ތާރީޚަކީ {new_due_date_dv} ކަމުގައި ކަނޑައަޅައިފީމެވެ.", "{body}"])
letter("LTR-WARN", "Letters", "Warning letter", "އިންޒާރު ސިޓީ", "އިންޒާރު", ["{project_name_dv} ({ref_no}) ގެ މަސައްކަތް ނިންމަންޖެހޭ ތާރީޚަކީ {due_date_dv} އެވެ. މަސައްކަތުގެ ޕްރޮގްރެސް ވަނީ {percent_complete}% ގައެވެ.", "{body}", "މި ސިޓީ ލިބުމާއެކު މަސައްކަތް ހަލުއިކުރުމަށް ފިޔަވަޅު އެޅުމަށް ދަންނަވަމެވެ."])
letter("LTR-HO", "Letters", "Site handover letter", "ސައިޓް ހަވާލުކުރުމުގެ ސިޓީ", "ސައިޓް ހަވާލުކުރުން", ["{project_name_dv} ގެ މަސައްކަތަށް ސައިޓް {handover_date_dv} ގައި ހަވާލުކުރީމެވެ. މަސައްކަތުގެ މުއްދަތަކީ {duration_days} ދުވަސް ކަމަށްވާތީ، މަސައްކަތް ނިންމަންޖެހޭނީ {due_date_dv} ގެ ކުރިންނެވެ.", "{body}"])
letter("WCL", "Letters", "Work Completion Letter", "މަސައްކަތް ނިމުނުކަމުގެ ސިޓީ", "މަސައްކަތް ނިމުނުކަމުގެ ސިޓީ", ["{handover_date_dv} ގައި ހަވާލުކުރި {project_name_dv} ({ref_no}) ގެ މަސައްކަތް {completion_date_dv} ގައި ނިމިފައިވާކަމަށް ކައުންސިލްގެ އިދާރާއިން ޤަބޫލުކުރަމެވެ.", "ރިޓެންޝަން މުއްދަތަކީ {retention_period_days} ދުވަސް ކަމަށްވާތީ، އެ މުއްދަތު ހަމަވާނީ {retention_end_date_dv} ގައެވެ. ރިޓެންޝަން ގޮތުގައި ހިފެހެއްޓިފައިވާ ފައިސާ: {retention_amount} ރ.", "{completion_remarks}"])

d = new_doc(True); demo_note(d)
ref_block(d, "{memo_ref}")
para(d, "އިންޓަރނަލް މެމޯ", 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
table(d, [["ފޮނުވާ ފަރާތް", "{recipient_name}"], ["ފޮނުވާ", "{signatory_name}"], ["މައުޟޫޢު", "{subject}"]], widths=[5, 12], header=False)
para(d, "{body}", 13)
sign_block(d)
save_doc(d, "MEMO", "Memos", "Internal memo", "އިންޓަރނަލް މެމޯ")

d = new_doc(True); demo_note(d)
ref_block(d, "{memo_ref}")
para(d, "ފައިސާ ދެއްކުމުގެ މެމޯ", 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
table(d, [["މަޝްރޫޢު", "{project_name_dv}"], ["ރެފަރެންސް", "{ref_no}"], ["ކޮންޓްރެކްޓަރު", "{contractor_name}"], ["ބަޖެޓް ކޯޑު", "{budget_code}"], ["އެގްރީމެންޓުގެ އަގު", "{contract_value} ރ"], ["ފައިސާ (ބާވަތް / ނަންބަރު)", "{payment_kind} / {payment_no}"], ["އިންވޮއިސް ނަންބަރު", "{invoice_no}"], ["މި ފަހަރު ދައްކާ އަދަދު", "{payment_amount} ރ"], ["ލިޔުމުން", "{payment_amount_words_dv}"], ["ކުރިން ދައްކާފައިވާ", "{previous_payments} ރ"], ["ރިޓެންޝަން ކެނޑޭ", "{retention_deducted} ރ"], ["ދައްކަންޖެހޭ ސާފު އަދަދު", "{net_payment} ރ"], ["ބާކީ (އެގްރީމެންޓުން)", "{balance} ރ"]], widths=[6, 11], header=False)
para(d, "މަތީގައިވާ ފައިސާ ދެއްކުމަށް އެދެމެވެ.", 13)
sign_block(d)
save_doc(d, "PAY-MEMO", "Payments", "Payment memo", "ފައިސާ ދެއްކުމުގެ މެމޯ")

def report(code, en, dv, title, rows, sections):
    d = new_doc(); demo_note(d)
    para(d, title, 16, True, align=WD_ALIGN_PARAGRAPH.CENTER, color=TEAL)
    table(d, rows, widths=[6, 11], header=False)
    for kind, payload in sections:
        if kind == "h": para(d, payload, 13, True)
        elif kind == "p": para(d, payload, 12.5)
        elif kind == "t": table(d, payload[0], widths=payload[1], size=10.5)
    para(d, "")
    para(d, "ތައްޔާރުކުރީ: {project_officer}", 12)
    para(d, "ތާރީޚު: {today_dv}", 12)
    save_doc(d, code, "Reports", en, dv)

BASE = [["މަޝްރޫޢު", "{project_name_dv}"], ["ރެފަރެންސް", "{ref_no}"], ["ކޮންޓްރެކްޓަރު", "{contractor_name}"], ["އެގްރީމެންޓުގެ އަގު", "{contract_value} ރ"], ["ހަވާލުކުރި ތާރީޚު", "{handover_date_dv}"], ["ނިންމަންޖެހޭ ތާރީޚު", "{due_date_dv}"]]
report("WPR", "Work Progress Report", "މަސައްކަތުގެ ޕްރޮގްރެސް ރިޕޯޓް", "މަސައްކަތުގެ ޕްރޮގްރެސް ރިޕޯޓް", BASE + [["ރިޕޯޓް ތާރީޚު", "{report_date_dv}"], ["މުއްދަތު", "{report_period}"], ["ޕްރޮގްރެސް", "{report_percent}%"], ["ބާކީ ދުވަސް", "{days_left}"]], [("h", "ތަފްޞީލު"), ("p", "{report_remarks}"), ("h", "ވޯކް ލޮގް"), ("t", ([["ތާރީޚު", "މަސައްކަތް", "މީހުން", "ދުވަހުގެ ހާލަތު", "މައްސަލަ"], ["{#logs}{date}", "{activity}", "{workers}", "{weather}", "{issues}{/logs}"]], [2.5, 7, 1.8, 2.5, 3.2]))])
report("WCR", "Work Completion Report", "މަސައްކަތް ނިމުނުކަމުގެ ރިޕޯޓް", "މަސައްކަތް ނިމުނުކަމުގެ ރިޕޯޓް", BASE + [["ނިމުނު ތާރީޚު", "{completion_date_dv}"], ["އިތުރުކުރި މުއްދަތު", "{extension_days} ދުވަސް"], ["ދައްކާފައިވާ", "{total_paid} ރ"], ["ރިޓެންޝަން", "{retention_percent}% · {retention_end_date_dv}"]], [("h", "ބަލާ ފާސްކުރުން"), ("p", "{completion_remarks}"), ("h", "ޗެކްލިސްޓް"), ("t", ([["#", "ކަންތައް", "ނިމުނު", "ތާރީޚު"], ["{#checklist}{no}", "{item}", "{done}", "{date}{/checklist}"]], [1, 10, 2, 4]))])
report("CHK", "Project checklist", "ޗެކްލިސްޓް", "މަޝްރޫޢުގެ ޗެކްލިސްޓް", BASE, [("t", ([["#", "ކަންތައް", "ނިމުނު", "ތާރީޚު", "ކުރީ"], ["{#checklist}{no}", "{item}", "{done}", "{date}", "{by}{/checklist}"]], [1, 8, 2, 3, 3]))])
report("RPR", "Retention Period Report", "ރިޓެންޝަން މުއްދަތުގެ ރިޕޯޓް", "ރިޓެންޝަން މުއްދަތުގެ ރިޕޯޓް", BASE + [["ނިމުނު ތާރީޚު", "{completion_date_dv}"], ["ރިޓެންޝަން ހަމަވާ", "{retention_end_date_dv}"], ["ރިޓެންޝަން އަދަދު", "{retention_amount} ރ"], ["ބެލި ތާރީޚު", "{report_date_dv}"]], [("h", "ފެނުނު ކުށްތައް"), ("p", "{defects}"), ("h", "ތަފްޞީލު"), ("p", "{report_remarks}")])

# ---------------- placeholder sample ----------------
src = open(os.path.join(ROOT, "src", "pcc", "03-fields.js"), encoding="utf8").read()
keys = []
for k, lab in re.findall(r'\["([a-z][a-z0-9_]*)", "([^"]+)"', src):
    if k not in [x[0] for x in keys] and not k.startswith("member_"):
        keys.append((k, lab))
d = new_doc(False)
para(d, "Placeholder sample — every field filled from a project", 16, True, rtl=False, color=TEAL)
para(d, "Generate this from any project (Templates › SAMPLE › Preview) to see what each placeholder becomes.", 10, rtl=False)
table(d, [["Placeholder", "Meaning", "Value"]] + [[k, lab, "{" + k + "}"] for k, lab in keys], widths=[5.5, 5.5, 6], rtl=False, size=9.5)
save_doc(d, "SAMPLE", "Other", "Placeholder sample (all fields)", "")

# ---------------- Excel templates ----------------
thin = Side(style="thin", color="9AA7A2")
B = Border(left=thin, right=thin, top=thin, bottom=thin)
HF = PatternFill("solid", fgColor="0B7F6D")
LF = PatternFill("solid", fgColor="EEF3F1")


def xl_header(ws, title, sub, ncols):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncols)
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ncols)
    ws["A1"] = title; ws["A1"].font = Font(name="Calibri", size=15, bold=True, color="0B6E5F"); ws["A1"].alignment = Alignment(horizontal="center")
    ws["A2"] = sub; ws["A2"].font = Font(name="Faruma", size=12); ws["A2"].alignment = Alignment(horizontal="center", readingOrder=2)
    ws.row_dimensions[1].height = 24; ws.row_dimensions[2].height = 22


def kv(ws, r, label, value, ncols, money=False):
    ws.cell(r, 1, label).font = Font(bold=True); ws.cell(r, 1).fill = LF; ws.cell(r, 1).border = B
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=ncols)
    c = ws.cell(r, 2, value); c.border = B
    c.font = Font(name="Faruma" if "_dv" in value else "Calibri", size=11)
    if money: c.number_format = "#,##0.00"
    if "_dv" in value: c.alignment = Alignment(horizontal="right", readingOrder=2)
    for col in range(3, ncols + 1): ws.cell(r, col).border = B


def xl_save(wb, code, group, en, dv, order, pack):
    fn = code + ".xlsx"; wb.save(os.path.join(OUT, fn))
    META.append(dict(code=code, file=fn, type="xlsx", group=group, nameEn=en, nameDv=dv, order=order, perMember="", inPack=pack))


wb = Workbook(); ws = wb.active; ws.title = "PR-12"
N = 6
xl_header(ws, "PR-12  Award Data Sheet — DEMO", "{project_name_dv}", N)
rows = [("Project", "{project_name_en}"), ("Project (Dhivehi)", "{project_name_dv}"), ("Reference", "{ref_no}"), ("PR number", "{pr_number}"), ("Advertisement no.", "{advertisement_no}"), ("Award date", "{award_date}"), ("Contractor", "{award_bidder}"), ("Award amount (MVR)", "{award_amount}"), ("Amount in words", "{award_amount_words_en}"), ("Duration (days)", "{award_duration}"), ("Budget code", "{budget_code}")]
for i, (l, v) in enumerate(rows, start=4):
    kv(ws, i, l, v, N, money=v == "{award_amount}")
hr = 4 + len(rows) + 1
for j, h in enumerate(["#", "Bidder", "Bid amount (MVR)", "Duration (days)", "Total score", "Rank"], start=1):
    c = ws.cell(hr, j, h); c.font = Font(bold=True, color="FFFFFF"); c.fill = HF; c.border = B; c.alignment = Alignment(horizontal="center", wrap_text=True)
for r in range(hr + 1, hr + 11):
    for j in range(1, N + 1):
        c = ws.cell(r, j); c.border = B
        if j == 3: c.number_format = "#,##0.00"
loop = ["{#bidders}{no}", "{bidder_name}", "{bid_amount}", "{duration_offered}", "{total_score}", "{rank}{/bidders}"]
for j, v in enumerate(loop, start=1): ws.cell(hr + 1, j, v)
tr = hr + 11
ws.cell(tr, 2, "Number of bids").font = Font(bold=True)
ws.cell(tr, 3, f"=COUNTA(B{hr + 1}:B{hr + 10})")
ws.cell(tr + 2, 1, "Prepared by: {project_officer}     Date: {today}")
for col, w in zip("ABCDEF", [24, 34, 18, 14, 12, 8]): ws.column_dimensions[col].width = w
ws.page_setup.orientation = "landscape"; ws.page_setup.paperSize = 9
ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True); ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
xl_save(wb, "PR-12", "Bid Committee", "Award Data Sheet", "އެވޯޑް ޑޭޓާ ޝީޓް", 4, True)

wb = Workbook(); ws = wb.active; ws.title = "Evaluation"
N = 9
xl_header(ws, "Bid Evaluation Form — DEMO", "{project_name_dv}  ·  {ref_no}", N)
kv(ws, 4, "Project", "{project_name_en}", N); kv(ws, 5, "Evaluation date", "{evaluation_date}", N); kv(ws, 6, "Estimated cost (MVR)", "{estimated_cost}", N, True)
hr = 8
for j, h in enumerate(["#", "Bidder", "Bid amount (MVR)", "Documents", "Technical (max 70)", "Financial (max 30)", "Total", "Rank", "Responsive"], start=1):
    c = ws.cell(hr, j, h); c.font = Font(bold=True, color="FFFFFF"); c.fill = HF; c.border = B; c.alignment = Alignment(horizontal="center", wrap_text=True)
ws.row_dimensions[hr].height = 32
loop = ["{#bidders}{no}", "{bidder_name}", "{bid_amount}", "{documents}", "{technical_score}", "{financial_score}", None, "{rank}", "{responsive}{/bidders}"]
for j, v in enumerate(loop, start=1):
    c = ws.cell(hr + 1, j, v if v is not None else f"=E{hr + 1}+F{hr + 1}"); c.border = B
    if j == 3: c.number_format = "#,##0.00"
ws.cell(hr + 3, 1, "Evaluation Committee").font = Font(bold=True)
for j, h in enumerate(["#", "Name", "Designation", "Role", "Signature"], start=1):
    c = ws.cell(hr + 4, j, h); c.font = Font(bold=True); c.fill = LF; c.border = B
for j, v in enumerate(["{#eval_members}{no}", "{member_name}", "{member_designation}", "{member_role}", "{/eval_members}"], start=1):
    ws.cell(hr + 5, j, v).border = B
for col, w in zip("ABCDEFGHI", [5, 30, 17, 34, 12, 12, 9, 7, 11]): ws.column_dimensions[col].width = w
ws.page_setup.orientation = "landscape"; ws.page_setup.paperSize = 9
xl_save(wb, "EV-FORM", "Evaluation Committee", "Bid Evaluation Form", "ބީލަން ވަޒަންކުރާ ފޯމު", 4, True)

# the council's own PR-09 plan workbook, turned into a template by tools/make_plan_template.py
PLAN = os.path.join(ROOT, "tools", "assets", "PR-09-plan-template.xlsx")
if os.path.exists(PLAN):
    import shutil
    shutil.copy(PLAN, os.path.join(OUT, "PLAN.xlsx"))
    META.append(dict(code="PLAN", file="PLAN.xlsx", type="xlsx", group="Plan", nameEn="Annual Procurement Plan (PR-09)", nameDv="އަހަރީ ޕްރޮކިއުމަންޓް ޕްލޭން", order=1, perMember="", inPack=False, official=True))

json.dump(META, open(os.path.join(OUT, "meta.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(len(META), "demo templates written to", OUT)
