# Projects command centre

Everything about each project in one place: the procurement plan, bids and committees, work logs, progress, checklists, completion, retention, letters, payments and files. It also generates the council's documents from its own Word and Excel templates.

## Where things are

**Projects** in the side bar opens these tabs:

| Tab | What it is for |
|---|---|
| Overview | KPI cards, the "Handed over to contractor" strip with live countdowns, and every project as a table, cards or a timeline |
| Goods / Works / Non-consultancy / Consultancy | The same overview for each category — the four sheets of the PR-09 plan |
| Procurement plan | The yearly plan, with Excel template download, export and upload |
| Work Logs | Work log entries for all projects |
| Documents | Every generated or uploaded file, with filters |
| Templates *(administrators)* | Master Word and Excel templates, placeholders, reference-number patterns |

Open a project to see its 13 tabs: Summary, Procurement plan, Bid Documents, Evaluation, Work Logs, Progress Reports, Checklist, Completion, Retention, Letters & Memos, Payments, Files and Activity.

### Countdowns

Days left = due date − today. The due date is the handover date plus the duration, plus any extensions of time.

| Colour | Meaning |
|---|---|
| Green | more than 30 days |
| Amber | 8 to 30 days |
| Red | 0 to 7 days (shows hours in the last week) |
| Dark red | "Overdue by X days" |
| Grey | completed |

The retention end date counts down the same way.

## Putting in your own templates (no code changes)

The built-in templates are **demo** stand-ins marked *Demo*. To replace one:

1. Open your original Word or Excel file. Type placeholders where values should go, for example `{project_name_dv}`, `{contract_value}`, `{contract_value_words_dv}` or `{handover_date_dv}`. The **Placeholder cheat-sheet** (Templates tab) lists every field with an example. Click a placeholder to copy it.
2. For a table row that repeats (bidders, committee members, payments), put `{#bidders}` in the first cell of the row and `{/bidders}` in the last cell. Use the loop fields in between, for example `{bidder_name}` and `{bid_amount}`.
3. Save the file as .docx or .xlsx. Then open **Projects › Templates**, find the template and choose **Upload new version**. Use **Add template** for a new one.
4. The program lists the placeholders it found. Use **Placeholders** to point any unknown ones at a program field, or have the program ask for them when you generate.

Everything outside the placeholders stays exactly as in your file: letterhead, logo, fonts, RTL paragraphs, table borders, margins and signature blocks. In Excel, formulas stay live, and loop rows fill the formatted rows below them. New rows are inserted only when the formatted rows run out. Instead of placeholders, an Excel template can also use a **cell map**, for example `PR-12!C5 = project_name_dv`.

Earlier documents keep a link to the template version they were made with. **Versions** lets you download any old version or make it current again.

### Using your original documents without typing placeholders

The program changes only text it knows about. Any text without a placeholder or a rule is copied unchanged, which is why an original document with the previous project's name, Iulaan number and dates comes out unchanged.

On the template, press **Replace text**:
1. Pick the project the original document was made for, then press **Find its values in the file**. The program looks for that project's values in the file:
   - name (Dhivehi and English),
   - Iulaan number,
   - reference and PR number,
   - contractor,
   - dates (Dhivehi, English and dd.mm.yyyy formats),
   - amounts and amounts in words.
2. Tick the suggestions you want, add any others by hand, and **Save**.

Every document generated from that template then gets the current project's values in those places. The rules work even when Word has split the text into pieces. The template's details must match the original document for its values to be found. In particular, fill in the **Iulaan number** in the project (Edit › Iulaan number).

Placeholders typed with a Dhivehi keyboard sometimes come out reversed, like `}project_name{`. The program reads those correctly too.

The Templates list shows **"0 — nothing fills"** for a template that has neither placeholders nor rules. Generating such a template asks for confirmation first.

## Committee packs

On **Bid Documents** or **Evaluation**:

1. Add the committee members. Pick them from Staff and add their Dhivehi names and designations.
2. Record the bids under **Evaluation**, then **Award** the winning bid. This sets the contractor and the contract value.
3. Press **Generate Bid Committee pack** or **Generate Evaluation Committee pack**.
   - The panel shows every value the documents need, filled in from the project.
   - Change any value for this pack only, or tick *Save changed values back to the project*.
   - Untick a document to leave it out, or use **+ Add document** to include any other template.
   - Empty fields are listed for each document before anything is generated.
4. The files download as `{ProjectRef}_{BidCommittee|Evaluation}_{date}.zip`. Each file is also saved under the project's **Files** tab, and you can preview it in the browser.

Documents marked "one per member" (BC-INV and PR-02) make one file for each committee member.

Generating again creates v2, v3 and so on; nothing is overwritten. Use **Delete** on a document, an older version or an uploaded file to remove it; the stored file is removed too unless another project's copy (from a meeting) still uses it. Old template versions can be deleted under Templates › Versions; the current version cannot be deleted. After signing, use **Upload signed** to attach the scanned PDF. The document then shows as *Signed*.

### Dates, times and the year-month-day format

Two more Dhivehi date styles work on any date placeholder; the day always has two digits:

| Add | Example | Gives |
|---|---|---|
| `_dv_ymd` | `{bid_meeting_date_dv_ymd}` | `2026 ނޮވެމްބަރ 09` |
| `_dv_dmy` | `{bid_meeting_date_dv_dmy}` | `09 ނޮވެމްބަރ 2026` |
| `_dv_both` | `{bid_meeting_date_dv_both}` | `09 ނޮވެމްބަރ 2026 / 2026 ނޮވެމްބަރ 09` (read from the right) |

The times are `{evaluation_time}`, `{bid_meeting_time}` and `{eval_meeting_time}`. Enter them on the project (Edit), or record them with a committee meeting.

### Meeting numbers in documents

The placeholders `{bid_meeting_no}` and `{eval_meeting_no}` give the meeting numbers. Add `_date`, `_date_dv`, `_date_en` or `_date_hijri` for the meeting dates, for example `{eval_meeting_date_dv}`.

Each value comes from the number typed on the project (Edit › Committee meetings, where **Take next number** issues one). If none is typed, the program uses the latest meeting recorded for that project.

### Standing committees and members on leave

**Projects › Templates › Standing committees** holds the council's usual Bid Committee (and Evaluation Committee). New projects start with these members; on a project, **Use the standing committee** copies them in.

To mark someone **on leave** for a project, use **Edit** on that member; for a meeting, use the member list when recording it. Pick the reason, e.g. ޗުއްޓީ or ސަފަރު. In the attendance table of the Yaumiyya:
- the `{absent_mark}` column shows "-",
- the cells from `{leave}` to the end of the row merge into one cell showing the reason,
- both are shaded light grey.

Members on leave do not get a per-member invitation or declaration.

**Which member is which?** There are two ways to fill a committee table:

- **One repeating row (recommended).** Keep only the first member row, written like this:
  `{#bid_members}{no}` | `{member_name_dv}` | `{member_designation_dv}` | `{absent_mark}` | `{leave}` | … | `{/bid_members}`.
  The program repeats the row for every member in order: 1, 2, 3…
- **Numbered placeholders for fixed rows.** Use `{bid_m1_name_dv}`, `{bid_m1_designation_dv}`, `{bid_m1_absent_mark}` and `{bid_m1_leave}` in row 1, then `bid_m2_…` in row 2, and so on. For the Evaluation Committee, use `eval_m1_…`. The number is the member's position in the project's committee list.

The plain `{member_…}` placeholders only work inside a repeating row, or in a document made once per member (such as an invitation).

Templates with **fixed rows** (each member's name typed in the table instead of a `{#bid_members}` row) work too. The program finds the row with the member's name; after the name and designation cells, the next empty cell gets "-" and the remaining empty cells merge into the reason, shaded grey. Keep those cells empty in the template. A row that is already merged and grey in the template stays as it is in every document.

### One meeting for several projects

When the Bid Committee or Evaluation Committee decides on two or more projects in one meeting:

1. On a project's **Bid Documents** or **Evaluation** tab, press **New meeting for several projects**.
2. Choose the date, time and place, tick the projects decided at the meeting, and pick whose committee members attend.
3. Press **Generate documents**. You get:
   - **one Yaumiyya** with a section for every project: its name, reference, Iulaan number, bid opening date, estimated cost and bidders table;
   - **one invitation per member** that lists all the projects.

The meeting gets its own number. Bid Committee and Evaluation Committee meetings are numbered separately, for example `…/BM001` and `…/EM001`; the patterns are under Templates › Reference numbers. The files are saved in every project of the meeting.

Meeting templates repeat a block per project between `{#projects}` and `{/projects}`. Inside the block every project field works, including the `{#bidders}` table. The demo meeting templates are BC-YAU-M, BC-INV-M and EV-YAU-M; replace them with the council's originals the same way as the other templates.

## Letters, memos and reference numbers

On **Letters & Memos**, choose a template and fill in the recipient, subject and text (Dhivehi or English). Then press **Generate**. The reference number is taken automatically from the pattern under **Templates › Reference numbers**, for example `(IUL)351-PRO/{YYYY}/{###}`. Numbers restart each year and are never reused.

The extension-of-time letter can also record the extension, and the due date then moves.

## Payments

Add the payment schedule: advance, interim, final and retention release. **Payment memo** generates the memo with the payment amount in Dhivehi and English words, earlier payments, retention deducted and the balance. **Mark paid** updates the totals: paid, balance, retention held and retention released.

## Procurement plan (PR-09)

The plan follows the council's **Annual Procurement Plan (PR-09)** workbook, which has four sheets: Goods, Works, Non consultancy and Consultancy. Each plan item has:
- a procurement number, such as `PC-284/2026/W-01`,
- the procurement name,
- the estimated amount,
- the funded method and the procurement method (NCB, ICB, Shopping, Direct, QCBS, IC),
- the allocated budget for three years,
- remarks such as the fund (J-GOM or J-LCL),
- the planned dates of its category:

  | Category | Planned dates |
  |---|---|
  | Goods and Works | Invitation for bids, bid opening, contract award |
  | Non-consultancy | Also the bid evaluation report |
  | Consultancy | REOI, RFP issue and submission, technical evaluation, financial opening, combined evaluation, award |

**Download template (PR-09)** and **Export plan** use the council's own workbook, kept as template `PLAN`, with its logo, layout, borders and formulas. Each sheet has one loop row: `{#goods}` … `{/goods}`, and likewise `works`, `noncons` and `cons`. If the layout changes, upload a new version of `PLAN` under Templates.

**Upload / update from Excel** reads all four sheets. Rows are matched by procurement number, or by name when a row has none. You then see:
- new rows,
- changed values (old → new),
- items missing from the file,
- rows with errors.

Then choose one of these modes:

| Mode | What it does |
|---|---|
| Add new only | Adds new rows only |
| Add + update | Adds new rows and applies the changes |
| Replace whole year | Also removes missing items; items linked to a project are kept |

**Import history** can roll the plan back to before any import.

The council's 2026 PR-09 plan was loaded into the portal once: 4 goods, 16 works and 3 non-consultancy items. Each item also has a project, with the procurement number as its reference. The projects start as *Planned*; update each one as it moves on.

## Dhivehi

- Dhivehi fields are right-to-left and use the Faruma font.
- The **ދިވެހި / ABC** button switches the phonetic Thaana keyboard on or off. With it on, typing `h` gives ހ, `a` gives ަ, and so on. The program remembers the choice on each device.
- Amounts in words are available in Dhivehi and English, with laari. Dates are available in Dhivehi, in English, and as a Hijri date.
- Check the Dhivehi amount words on important documents. Any value can be corrected in the pack panel before generating.

## Sample data

On the Overview, an administrator can press **Load sample projects**. This adds:
- 3 ongoing works projects: one with 45 days left, one with 6 days left, and one overdue,
- 1 project in retention,
- 5 plan items, with bidders and committees.

**Remove sample data** deletes all of it and leaves your own data alone.

## Where files are kept

Templates, generated documents, photos and signed scans are stored:
- in the browser (IndexedDB) on the device that made them,
- and in the Firestore `office` collection as documents named `f_<id>_<n>`, in pieces of 600 KB.

The Firestore rules already cover this collection, so nothing needs to change in Firebase. Large files count against the Firestore storage quota (1 GB on the free plan). Uploads are limited to 15 MB, and templates to 8 MB.

## Not included yet

- **E-mail reminders.** Reminders show in the bell and on the dashboard only. E-mail needs a server-side function.
- **PDF output.** Open the .docx in Word and use *Save as PDF*.

## For developers

The module source is readable and kept outside the minified bundle:

- `src/pcc/01-core.js` … `99-init.js`: the module, concatenated in name order into one IIFE.
- `src/pcc/pcc.css`: the module's styles.
- `src/pcc/doclibs.min.js`: docxtemplater, pizzip, jszip and docx-preview. Rebuild it with `tools/build-doclibs.sh`.
- `src/pcc/demo/`: the demo templates. Rebuild them with `python3 tools/make_demo_templates.py` (needs python-docx and openpyxl).

After editing, run `node tools/build-pcc.mjs`. It replaces the block between `<!--PCC:BEGIN-->` and `<!--PCC:END-->` in `index.html`. The app reaches the portal's helpers through `window.__app.K`. The bell, dashboard and search call into `window.__pcc`.

## When your own template does not fill

- **Typing slips are fixed for you.** Spaces inside the braces (`{ bid_meeting_no }`), hidden RTL marks or non-breaking spaces from a Dhivehi paragraph, capitals (`{BID_MEETING_NO}`), double braces (`{{bid_meeting_no}}`), full-width braces and braces reversed by an RTL keyboard (`}bid_meeting_no{`) are cleaned to `{bid_meeting_no}` when the file is scanned and filled.
- **Check the Placeholders column** on Templates. A number means the file is read; open **Placeholders** and map anything shown as *Not recognised*. "0 — nothing fills" means no `{…}` was found.
- **Upload new version on the template itself** (Projects › Templates). A file uploaded as a signed copy in a project's Documents is stored as it is and is never filled.
- **Generate again from the project** (Bid / Evaluation tab › Generate pack). Documents made earlier keep their old values; the template Preview uses a sample project, not yours.
- **Fonts and English text in filled values.** Values take the font your document's Dhivehi text uses (e.g. Faruma), never the MV Boli fallback, and English/number values such as `BC/284/2026-01` or `IUL(2026)14` are written left-to-right so they don't appear reversed.
- **Leave boxes.** Put `{bid_mN_leave}` in any of the signature/time boxes: the grey leave cell covers all the empty boxes under the grouped headers (e.g. both "ސޮއި | ގަޑި" pairs) through to the end of the row.

## Using your original documents without typing placeholders

1. Projects › Templates › **Add template** (or **Upload new version**) and choose the document exactly as it was used for a past project.
2. If the file has no `{placeholders}`, the **Replace text** window opens by itself and **Find values automatically** lists every date (19.01.2026, 28 ޖަނަވަރީ 2026, 2026 ޖަނަވަރީ 28), Hijri date, reference / meeting / Iulaan number, time, amount and committee member name, each with the field it should become. The guess comes from the words just before it (އިޢުލާން → Iulaan, ހުޅުވި → bid opening, އިވެލުއޭޓް → evaluation, a date followed by a time → meeting date and time).
3. Change any field that's wrong, untick text that must stay as it is, copy the project's name from the document into **Project name exactly as written in this file**, press **Use the ticked values**, then **Save**. A preview opens filled with a project so you can check it.
4. The same text can become different fields: if 28.01.2026 is both the bid opening and the evaluation date, each place gets its own field ("Only place 1 / 2 where this text appears").

The original file is not changed; the rules are applied every time a document is generated. Open **Replace text** again at any time and press **Detect values in this file** to review.

## Minutes (Yaumiyya) fields

- `{bid_meeting_year}`, `{bid_meeting_seq}`: the meeting's year and its number only ("BC/2026/18" → 18).
- `{bid_meeting_time}` (scheduled), `{bid_meeting_start_time}`, `{bid_meeting_end_time}`: typed on the project (Edit › Committee meetings › Meeting started at / ended at).
- `{bid_meeting_date_hijri}`, `{bid_chair_short_dv}` (chair without އަލްފާޟިލް).
- Table loops: `{#bid_attendance}{present_name_dv}` | `{absent_name_dv}{/bid_attendance}` puts present and on-leave members side by side; `{#bid_present}{no}` | `{member_short_dv}` | `{/bid_present}` lists the members who attended, numbered 1, 2, 3…; `{#bid_absent}` lists those on leave. All exist for `eval_` too.

## Award sheet fields

- `{estimated_cost}` approved budget, `{award_amount}` awarded price, `{award_duration}` days, `{award_bidder}` winning bidder (Bidders tab, marked awarded).
- `{budget_after_award}` = estimated cost − awarded amount; `{budget_extra_needed}` = awarded amount above the estimated cost, or "-" when within budget.
- Any date + `_dash` gives 10-11-2026 (e.g. `{bid_meeting_date_dash}`).

## Your own placeholders

Any placeholder the program has no field for (e.g. `{meeting_venue_dv}`, `{secretary_name_dv}`, `{site_visit_date}`) is kept as **your own field**: it appears on every project's **Edit** form under **Other template fields**, where you type the value once per project, and it fills every template that uses it. Names ending in `_date` get a date picker (and the usual `_dv`, `_dv_dmy`, `_dash`… variants), `_time` a time picker, `_dv` a Dhivehi box. To fill it from a program field instead, map it under **Placeholders**.
- Excel: a date placeholder alone in a cell formatted as a date (e.g. `{award_date}`) is written as a real Excel date, so the workbook's own date format shows; amounts alone in a cell are written as numbers. `{award_year}` is the award date's year.
- **Add a field before using it:** Projects › Templates › Placeholder cheat-sheet › **Your own fields** › **Add a field** — give a name (e.g. `psip_no`), its meaning and the kind of value (text, Dhivehi text, date, time, number). It then shows as recognised in every template, appears on each project's Edit form, and date fields also get `_dv`, `_en`, `_hijri`, `_dv_dmy`, `_dv_ymd`, `_dash`. Placeholders found in templates are listed there too — press **Describe** to give them a meaning and kind.

## Evaluation documents (PR-02, PR-03)

- PR-02 declaration is one template, one copy per Evaluation Committee member: `{member_short_dv}`, `{member_id_card}`, `{member_office_dv}`, `{member_designation_dv}`, `{evaluation_date_dv_dmy}`. Type each member's ID card number and office on the committee member (or the standing committee) — ID numbers are kept only in the portal's database.
- PR-03 summary sheet: `{plan_year1..3}` and `{plan_budget_y1..3}` come from the linked PR-09 plan item; `{scope_dv}` is the Dhivehi scope (or the project name); `{bidder_count}` and the `{#bidders}` list come from Bidders.
- Your own fields added for these forms (Placeholder cheat-sheet › Your own fields, typed on each project): `{agenda_no}`, `{iulaan_count}` (empty → 01), `{interest_count}`, `{prev_meeting_no}`, `{prev_meeting_date}`, `{prev_decision_dv}` (empty → -), `{psip_no}`.

## Deleting a template

Templates › **Delete** on the template's row (administrators). Documents already generated from it stay in the projects; a built-in demo template that is deleted is not added back. To stop using a template but keep it, press **Edit** and untick **Active** instead. The demo EV-YAU-M (evaluation minutes for several projects) has been removed.

## Evaluation form and report (EV-FORM, EV-RPT)

- EV-FORM: sheet "AB" lists every bidder (`{#bidders}`), sheet "Table 01" only bidders marked Responsive (`{#responsive_bidders}`). Each row takes `{bidder_name}`, `{bid_amount}`, `{duration_offered}`, `{experience}` from the Bidders tab; the points are Excel formulas (lowest price and shortest duration taken with MIN over the column), so they recalculate when the file opens.
- EV-RPT: the rejected bids are listed from `{#rejected_bidders}` — type the reason sentence in each rejected bidder's **Remarks** and set it to Not responsive. `{award_bidder}` and `{award_score}` (winner's total points) fill the conclusion; the signature table lists the Evaluation Committee members present.
- Bidder form: new **Experience (number of similar works)** box.

## Completion and progress documents (WCR, WCL, WPR)

- Project Edit form: new **Agreement number** (`{agreement_no}`). Contractor: `{contractor_name_dv}` (the Dhivehi name on the vendor, else the contractor name typed on the project) and `{contractor_reg_no}` (vendor registration number).
- WCR / WCL: `{handover_date_dv_dmy}`, `{due_date_dv_dmy}`, `{completion_date_dv_dmy}` / `{completion_date_dash}`, `{duration_days}`, `{contract_value}` with `{contract_value_words_dv}`, and `{last_invoice_no}` (latest invoice on the Payments tab). A template that uses `{letter_ref}` takes the next letter number automatically when it is generated.
- WPR: the progress report form has **Bill number**, **Invoice number**, **Inspected on** and **Work items done** (one per line) → `{report_bill_no}`, `{report_invoice_no}`, `{report_inspect_date_dash}`, and the table loop `{#report_items}{inspect_date_dash} | {status_dv} | {item_dv}{/report_items}`.
- Dhivehi amount words now use އެކާވީސް … ނަވާވީސް for 21–29 (128,000 → އެއްލައްކަ އަށާވީސްހާސް). Day-month-year dates use އޮގަސްޓް and އޮކްޓޯބަރ.

## Advanced report features

- **Progress summary**: `{days_used}`, `{days_total}`, `{time_percent}`, `{days_remaining}`, `{delay_status_dv}`; `{progress_bar}` draws work done vs time used as a picture.
- **Payment position**: `{contract_value}`, `{report_bill_amount}` (+ `_words_dv`), `{total_paid}`, `{paid_percent}`, `{balance}`, `{retention_held}`.
- **Extensions / delay**: `{#extensions}` table; `{days_late}`, `{penalty_per_day}` (Edit › Delay penalty per day), `{penalty_amount}`.
- **Completion tab**: Inspection team (`{#inspectors}`, `{inspector_name_dv}`) and Defects found at inspection (`{#snags}`, `{snag_open_count}`).
- **Retention**: `{retention_start_date_dv_dmy}`, `{retention_end_date_dv_dmy}`, `{retention_amount}`.
- **Pictures and Word features**: `{report_photos}` / `{project_photos}` (alone in a paragraph) make a 2×2 photo grid; `{qr_code}` links to the project in the portal; `{status_stamp}` is a coloured ނިމިފައި / ކުރިއަށް ދަނީ / ލަސްވެފައި badge; `{page_no}` / `{page_count}` are Word page fields.
- **Show-if switches**: put `{#has_extensions}` and `{/has_extensions}` in their own paragraphs around a section to show it only when there is something to list (also `has_inspectors`, `has_snags`, `has_project_photos`, `has_report_photos`).
- **Checks before generating**: warns when completion is before handover, the completion date is missing, a report has no work items, the work finished late without a penalty rate, no inspection team is set, defects are still open, or the contract value looks wrong. The pack window shows Dhivehi amount words under each amount as you type.

## Dhivehi interface

Press **ދިވެހި** in the top bar (next to the dark-mode button) to switch the portal to Dhivehi: right-to-left layout, Faruma for Thaana. Press **EN** to switch back. The choice is remembered on each device.

Only interface wording is translated — names, amounts, reference numbers and anything staff type stay exactly as entered. Administrators can correct wording or translate texts still in English: Projects › Templates › **Translations** (or right-click the language button). Texts seen in English on the pages you opened are listed first; corrections are shared with all staff.

## Monthly view (procurements by Iulaan month)

Projects › **Monthly** (next to Table / Cards / Timeline) groups every procurement by the month its Iulaan is announced, January to December, with ‹ › to change year and a bar chart of how many start each month (click a bar to jump to that month). The date is the project's **Iulaan date**, or — if that is not set yet — the planned IFB/REOI date of its PR-09 plan item (shown with a dashed border). PR-09 plan items not yet started as projects are included ("Not started"). The category tabs (Goods, Works…) and filters apply. Procurements with no date are listed under "No Iulaan date yet".

## Cancelled plan items and projects not in the plan

- **Cancel a plan item** (Procurement plan → row → *Cancel…*): decision date, decision reference, reason (Dhivehi), and optionally cancel the linked project too. The row stays in the plan history, greyed and struck through with its reason; it is left out of totals, the PR-09 export and the Monthly view. *Undo cancel* restores it.
- **Plan state of every project** (chip in the project banner, Monthly view, overview filter *Not in procurement plan*):
  - *In plan*: linked to a plan item that is not cancelled.
  - *Added to plan*: linked to an item added during the year (amendment).
  - *Plan item cancelled*: its plan item was cancelled.
  - *Not in plan*: no plan item linked.
- **Edit project → Project section**: *If not in the plan: reason* and *Replaces cancelled plan item*. The cancelled row then shows "Replaced by PC-…".
- **Plan page summary**: counts for In plan, Added during the year, Cancelled and Projects not in plan, with a list of the unplanned projects and an *Add to plan* button. That button adds the project as an amendment, marked "Added later".
- **Placeholders**: `{plan_status_dv}`, `{plan_status}`, `{in_plan}`, `{unplanned_reason_dv}`, `{replaces_plan_item}`, `{plan_cancel_reason_dv}`.

## Committee meetings register

Projects → **Committee meetings** (`#/projects/meetings/<year>/<bid|eval>`) lists every Bid Committee and Evaluation Committee meeting of the year in one table, sorted by date. It shows the meeting no., date and time, members present, the agenda counts, and each project with its decision type.

- **New Bid Committee meeting / New Evaluation meeting.** The number is given automatically in order from the reference patterns: Bid Committee `…/BM001, BM002…`, Evaluation `…/EM001…`. It counts per year of the meeting date and can be overridden for past meetings.
- **Agenda.** Tick the projects, then choose what each one is for:
  - Bid Committee: Award, Variation (amount, with − for an omission, and extra days), Time extension (days), Re-tender, Cancellation or Other.
  - Evaluation Committee: Bid evaluation, Re-evaluation or Other.
  - Each item also takes an optional decision note.
- **Members.** Taken from the Standing committee by default, or from one project's committee; leave status is marked per member.
- **Linked to the projects.** A project awarded or evaluated at a meeting gets that meeting's no., date and times in its own fields (unless different ones were typed), so single-project documents use the same number.
- **Evaluated, waiting for the Bid Committee.** Lists projects that have an evaluation meeting but no award yet, with a button that starts a Bid Committee meeting with them ticked.
- **Meetings typed on projects only.** Meetings typed in a project's Edit form are listed with an *Add to register* button.
- **Documents.** Generates the meeting templates (Yaumiyya, invitations) for the meeting.
- **Template fields:**
  - Meeting level: `{agenda_dv}`, `{agenda}`, `{award_count}`, `{variation_count}`, `{extension_count}`, `{evaluation_count}`.
  - Inside `{#projects}`: `{item_type_dv}`, `{item_type}`, `{item_note}`, `{variation_amount}`, `{variation_kind_dv}`, `{variation_amount_words_dv}`, `{variation_days}`, `{contract_after_variation}`, and the switches `{#is_award}`, `{#is_variation}`, `{#is_extension}`.
  - Loops of one kind only: `{#awards}`, `{#variations}`, `{#extensions}`, `{#evaluations}`.
- **Documents from a meeting use your own templates.** Every template in the committee's group is offered, and uploaded ones are ticked first; built-in samples are marked as such. A template with `{#projects}` (or `{#awards}`…) makes one document for the whole meeting. Any other template makes one document per project, filled with the meeting's no., date, time, members and that project's agenda fields. A variation amount may be typed with a minus sign for an omission.
- **No duplicate dates in Edit project.** The evaluation date and time come from the Evaluation Committee meeting, and the award date from the Bid Committee meeting. Procurement no longer asks for them, and the meeting "Time" field is merged into "Started at". Existing values are carried over when the form opens, and meetings in the register fill them too. The placeholders `{evaluation_date}`, `{evaluation_time}` and `{award_date}` keep working.
- **Edit project, simplified.**
  - The Committee meetings section is read-only. It shows the register's meetings for the project (no., decision type, date, start–end) with *Open meeting*, or *New … meeting* when none is recorded.
  - PR number is taken from the linked plan item's procurement no. and locked.
  - Removed from the form, with stored values kept: Unit / section, Project officer, Not-in-plan reason, Replaces cancelled plan item, Budget line, Funding source.
  - In the meeting form, clicking a project in the agenda opens its Edit box on top.
- **Required details at a Bid Committee meeting.** For each project marked Award, Variation or Time extension, the agenda row asks for Contract value, Contractor / supplier, Iulaan number, Iulaan date and Bid opening. These are marked with a red `**`, prefilled from the project, and empty ones are outlined in red. The meeting cannot be saved until they are filled; the values are saved to the project and noted in its activity. Re-tender, Cancellation and Other need none of them.

## Projects navigation

Every Projects page shows two grouped bars:
- **Projects**: Overview, Goods, Works, Non-consultancy and Consultancy. Each has its icon, colour and number of projects.
- **Workspace**: Procurement plan (items this year), Committee meetings (meetings this year), Work Logs, Documents and Templates.

The current page is filled with its colour. In Dhivehi the bars mirror right to left. On a phone each bar scrolls sideways.
- **Project tabs.** The Procurement plan, Bid Documents and Evaluation tabs were removed from the project page. Committee meetings, their members and their documents are handled in the Committee meetings register. The Bids received table (Add bid, Edit, Award), used by `{#bidders}` in the evaluation templates, is now at the bottom of the project's Summary. Generated documents stay in Files.
- **Summary layout (tiles).** The project's name in Dhivehi is shown large at the top. Four coloured money boxes follow: Estimated cost, Contract value, Paid and Balance. All other details are shown as labelled tiles, grouped as Details, Procurement and Contract period. Contractor, Payments and Committees use the same tiles, and committee members are listed in Dhivehi. Empty values say "Not set". Unit / section, Project officer and Budget line appear only when they have a value.
- **Committees card.** The Bid Committee (green) and Evaluation Committee (purple) are shown side by side. Each member is listed with a number, the Dhivehi name without the title, and the designation underneath; names are aligned to the right. A *Chair* or *On leave* tag sits to the left. Each committee ends with the project's meeting from the register: number, decision, date and time.
- **Add several bids.** Next to *Add bid* in Bids received, **Add several bids** opens a table with one row per bidder. Columns: bidder, bid amount, days, validity, experience, technical score, financial score, *Responsive*, *All documents*. Use *+ Add row* for more rows. Under *Paste from Excel*, rows copied from a spreadsheet are added in the same column order; "MVR" and thousands commas are accepted. Totals (technical + financial) and ranks are worked out on save, and new bidders are added to Vendors.
- **Bids from an Excel file.** In *Add several bids*, **Upload Excel file…** reads the bidders from a sheet, finding the columns by their headings in English or Dhivehi. One or two heading rows and merged headings are handled. It reads your Bid Evaluation Form: ނަން → bidder, ހުށައެޅި އަގު → bid amount, މުއްދަތު → days, ތަޖުރިބާ → experience, މުޅި ޖުމްލަ → total score. Points columns (ލިބުނު ޕޮއިންޓް) are skipped. Rows marked ޑިސްކޮލިފައި / disqualified are added as not responsive; total and signature rows are ignored. When several sheets match, you choose one. The rows appear in the table to check before *Save bids*.
- **Bids Excel template.** *Add several bids → Download Excel template* gives `Bids_<project>.xlsx`:
  - a title with the project number, name and Iulaan number;
  - green headings: Bidder name, Bid amount (MVR), Duration (days), Bid validity, Experience, Technical score, Financial score, Total score, Responsive (Yes/No), All documents (Yes/No), Remarks;
  - Yes/No drop-downs, the heading row frozen, and landscape A4 printing;
  - the project's existing bids already filled in, or 10 empty rows.

  Fill it in and use *Upload Excel file…*; the Responsive, All documents and Remarks columns are read too.

## Evaluation criteria

Summary → **Evaluation criteria** → *Set criteria*. Tick the criteria used for the project and give each a percentage; together they must make 100%.

**Quick sets:** Price 75 · Duration 15 · Experience 10 (2 marks per document), Price 80 · Duration 20, Technical 70 · Financial 30, Price 100. The last criteria used become the starting point for the next project.

**How points are worked out** (for responsive bids only):

| Criterion | Points |
|---|---|
| Price, Duration | The lowest gets full marks; others get lowest ÷ theirs × weight. |
| Experience | Marks per similar-work document (e.g. 2 each), up to its weight. |
| Technical, Financial, Other | Points typed for each bidder, up to the weight. Other criteria get their own box in *Edit bid*. |

**Where the points appear:**
- *Bids received* shows each criterion's points, with the price, days or document count underneath, and the total.
- Bids are ranked by total.
- **Evaluation sheet (Excel)** gives `Evaluation_<project>.xlsx`. It is a right-to-left sheet with Dhivehi headings: name, then for each criterion the value and the points, then total, rank and remarks. Not-responsive bids are marked ޑިސްކޮލިފައި. It ends with the date and the Evaluation Committee's signature block.

**Template fields:**
- Inside `{#bidders}`: `{price_points}`, `{duration_points}`, `{experience_points}`, `{technical_points}`, `{financial_points}`.
- Elsewhere: `{criteria_text_dv}`, `{criteria_text}`, and the list `{#criteria}{label_dv} {weight}%{/criteria}`.
- **Evaluation sheet designs.** The sheet now follows the council's Bid Evaluation Form:
  - columns read from right to left: #, name, then for each criterion the value and ލިބުނު ޕޮއިންޓް, then މުޅި ޖުމްލަ;
  - two heading rows and Faruma font;
  - live formulas: `MIN(range)/value*weight` for price and duration, `MIN(docs*marks,weight)` for experience, `SUM` for the total, and `RANK` in the new designs;
  - the date and the Evaluation Committee's signature block (ސޮއި / ނަން / މަޤާމް / ތާރީޚް), printing on landscape A4.

  Choose the layout next to the button:
  - **Original (council form)**: your form's layout. It now includes the State Emblem in the header, as on the form.
  - **Original — polished**: the form lightly refined:
    - the same layout, wording, Faruma font and black text, with the State Emblem centred and a thin rule under the header;
    - grey-blue heading rows, a firm frame around the table, and the total column in bold on light grey;
    - consistent number formats and row heights, and the disqualified row in red;
    - a small "how points are worked out" line, the date centred, and signature blocks with dotted signing lines.
  - **Original — restyled**: the same columns, order and formulas as the form, with:
    - a deep-teal title band (Bismillah, council name, committee) above a gold line;
    - the project name large, with the Iulaan number;
    - coloured criterion tags over each criterion's columns, and heading groups in each criterion's colour;
    - alternating rows, coloured points, and the top bidder marked ★ with a gold total;
    - the disqualified row in red;
    - a "how points are worked out" line, the date, and signature cards with a dashed signing line.
  - Three more looks of the same form:
    - **Original — royal (navy & gold)**:
      - a split header, with the council on the right and a navy "ބިޑް އިވެލުއޭޝަން ޝީޓް" box with the date on the left;
      - gold and navy lines, gold criterion captions, cream sub-headings and a framed table;
      - the winner marked ◆ with a navy and gold total;
      - centred signature lines with the name and designation below.
    - **Original — minimal**:
      - white, with fine rules and the council name large;
      - big light-grey weights (75%, 15%, 10%) over the criteria;
      - headings ruled underneath and the winner's total in black;
      - signature lines above each name.
    - **Original — ocean**:
      - layered blue and aqua bands, with the project name in a framed light-blue panel;
      - blue and aqua criterion colours and a framed table;
      - an aqua winner row and result bar;
      - framed signature boxes.
  - Bid-evaluation layouts:
    - **Evaluation report**:
      - a stage tracker: bid opening, compliance check, scoring and recommendation (✓), then the Bid Committee (⏳);
      - key figures: bids received, responsive bids, estimate and lowest bid;
      - 1 Compliance check: each bid with ✓ or ✗ and the reason;
      - 2 Scoring: with rank and a % against the estimate;
      - 3 The committee's recommendation: winner, amount and the amount in Dhivehi words;
      - 4 A signature table: name, designation, signature and date.
    - **Official evaluation form**: an EV-01 form-code box, double rules, grey headings and numbered sections:
      - 1 Bid details;
      - 2 Evaluation criteria (% and method);
      - 3 Points;
      - 4 Rejected bids;
      - 5 Decision;
      - 6 Signatures.
    - **Award recommendation**:
      - the scoring table, with the recommendation and signatures beneath it;
      - a summary panel showing the recommended bidder, total points, bid amount, the difference from the estimate (saving), and the runner-up;
      - a dashed box for the committee stamp.
  - **Formal report**: a header with a document box; an information panel (Iulaan no., dates, number of bids, estimate, criteria); a result banner naming the top bidder with the total; the points table with formulas; the disqualified bidders with reasons; signature boxes for the Evaluation Committee.
  - **Step-by-step calculation**: one section per criterion showing the working for each bidder (e.g. 924,000 ÷ 966,600 × 75 = 71.69; 3 × 2 = 6), then a summary table that adds the points and ranks the bidders.
  - **Comparison matrix**: bidders across the top and criteria down the side, with a value row and a points row for each criterion; the total, the rank, a points bar, remarks and a result line.

  The new layouts are right-to-left sheets; the formal report and the matrix print on one landscape page.
  The choice is remembered.
- **Criteria first.** Bids can only be added after the project's evaluation criteria are set. Until then, Bids received shows a notice with *Set criteria*, and *Add bid*, *Add several bids* and the Excel template open the criteria form first.
- **Bid columns follow the criteria.**
  - Always shown: bidder, bid amount and validity.
  - Shown only when a criterion uses them: duration, experience (documents), technical points, financial points, and each "Other" criterion's points.
  - Total score and rank are not asked; they are worked out from the criteria.
  - This applies to *Add bid*, the *Add several bids* table, the paste order and the Excel template.
  - Example: Price · Duration · Experience gives Bidder, Bid amount, Days, Validity and Experience (docs).
- **Bids table (add / update).** *Add several bids* (or *Bids table* once bids exist) opens a full-screen table listing the existing bids, which can be changed, plus empty rows for new ones.
  - **Document columns:** one tick-box column per document. Click a heading to rename it (e.g. in Dhivehi), ✕ removes the column and *+ Document* adds one. The list is kept per project and existing ticks follow a renamed heading.
  - **Tick / untick all:** a box under each heading (and under *Responsive*) ticks or unticks the whole column.
  - **Update, not duplicate:** importing an Excel file or pasting rows updates a bidder already in the table (matched by name) instead of adding them twice; the message says how many were added and updated. A row removed with ✕ is removed when saved.
  - **Excel template:** has one Yes/No column per document, using the project's names, and is read back the same way.
  - **Checklist PDF** (in the table and on Bids received): opens a printable landscape checklist with the council header, project and Iulaan number. It shows each bidder's amount, ✓ / ✗ for every document, the count (e.g. 7 / 9), responsive or not and remarks, with the Evaluation Committee's names to sign. Choose "Save as PDF" in the print window.
- **Compulsory documents.** Each document column in the bids table has a *Compulsory* tick (shown as ★ with a red heading), saved per project.
  - **Automatic Responsive:** a bid is ticked Responsive only when all compulsory documents are ticked. It updates as documents are ticked, as columns are made compulsory or not, and after an import. Rows that are not responsive are shaded.
  - **By hand:** Responsive can still be unticked for another reason (e.g. a late bid; type the reason in Remarks); that choice is kept. A bid imported as disqualified stays not responsive.
  - **Elsewhere:** the single *Add bid* form marks compulsory documents with ★ and switches Responsive as they are ticked. The checklist PDF marks compulsory headings with ★ in a darker colour and explains it in the legend.
- **Document columns come from the Excel template.**
  - The headings in the bids table are plain names: no rename, tick-all, ✕ or + Document. Only the *Compulsory* tick stays.
  - To change the documents, download the template, rename, add or remove document headings (any Yes/No column after *Responsive*), and upload it. Those headings become the project's document columns.
  - A heading ending in `*` is compulsory, and the downloaded template already marks compulsory documents with `*`.
  - A file without Yes/No document columns (e.g. the Bid Evaluation Form) keeps the current list.
- **Compulsory documents are set in the template only.** The bids table no longer has a *Compulsory* tick. A heading ending in `*` in the uploaded Excel template makes that document compulsory, shown with ★ and a red top line, and Responsive follows those documents.
- **Tick values in Excel.** Document and Responsive cells can be Yes / No, TRUE / FALSE (including Excel's tick-box cells), Y / N or ✓ / ✗. Empty, No, FALSE or ✗ means not submitted.
