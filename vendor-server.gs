/**
 * Milandhoo Council - online vendor quotations.
 *
 * A Google Apps Script web app that keeps the RFQs sent to vendors and the
 * quotes they submit in this spreadsheet, so the procurement program can give
 * vendors a short link and record their reply automatically.
 * Setup: see VENDOR-SERVER-SETUP.md.
 */

// The same key goes in the program under Settings > Online vendor replies > Office key.
var OFFICE_KEY = 'CHANGE-ME';

var SHEET = 'RFQs';
var CHUNK = 40000;       // a sheet cell holds at most 50,000 characters
var MAX_REPLY = 800000;  // signature and stamp images included

function doGet(e) { return handle_(e.parameter || {}); }

function doPost(e) {
  var q;
  try { q = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, error: 'Bad request' }); }
  return handle_(q);
}

function handle_(q) {
  try { return out_(route_(q)); }
  catch (x) { return out_({ ok: false, error: String(x.message || x), code: x.code || '' }); }
}

function route_(q) {
  var a = q.a;

  // Vendor: open the RFQ behind a short link.
  if (a === 'rfq') {
    var r = rows_()[id_(q.id)];
    if (!r) fail_('This link is not valid');
    return { ok: true, rfq: JSON.parse(r.rfq), replied: !!r.repliedAt, repliedAt: r.repliedAt || null };
  }

  // Vendor: submit the quote (once).
  if (a === 'reply') {
    var id = id_(q.id), reply = q.reply, s = JSON.stringify(reply || null);
    if (!reply || typeof reply !== 'object' || reply.t !== 'reply') fail_('This is not a quotation');
    if (s.length > MAX_REPLY) fail_('The quotation is too large. Use a smaller signature or stamp picture.');
    return locked_(function () {
      var r = rows_()[id];
      if (!r) fail_('This link is not valid');
      if (r.repliedAt) fail_('A quotation was already submitted for this request', 'replied');
      var cells = [txt_(new Date().toISOString())];
      for (var i = 0; i < s.length; i += CHUNK) cells.push(txt_(s.slice(i, i + CHUNK)));
      sheet_().getRange(r.row, 4, 1, cells.length).setValues([cells]);
      return { ok: true };
    });
  }

  // Everything below is for the council office only.
  if (OFFICE_KEY === 'CHANGE-ME') fail_('Set OFFICE_KEY in the server script first');
  if (String(q.key || '') !== OFFICE_KEY) fail_('Wrong office key');

  if (a === 'ping') return { ok: true };

  if (a === 'publish') {
    var pid = id_(q.id), rs = JSON.stringify(q.rfq || null);
    if (!q.rfq || q.rfq.t !== 'rfq') fail_('This is not an RFQ');
    if (rs.length > CHUNK) fail_('The RFQ is too large');
    return locked_(function () {
      if (!rows_()[pid]) sheet_().appendRow([txt_(pid), txt_(new Date().toISOString()), txt_(rs), '']);
      return { ok: true };
    });
  }

  if (a === 'replies') {
    var all = rows_(), out = {};
    (q.ids || []).slice(0, 500).forEach(function (x) {
      var r = all[String(x)];
      if (r && r.repliedAt) out[x] = { at: r.repliedAt, reply: JSON.parse(r.reply) };
    });
    return { ok: true, replies: out };
  }

  fail_('Unknown request');
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['Link id', 'Created', 'RFQ', 'Replied at', 'Reply (continues to the right)']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Every stored text starts with "~" so the sheet never turns it into a number, date or formula.
function txt_(s) { return '~' + s; }
function val_(v) { return typeof v === 'string' && v.charAt(0) === '~' ? v.slice(1) : ''; }

function rows_() {
  var sh = sheet_(), v = sh.getDataRange().getValues(), m = {};
  for (var i = 1; i < v.length; i++) {
    var id = val_(v[i][0]);
    if (!id) continue;
    var reply = '';
    for (var c = 4; c < v[i].length && val_(v[i][c]); c++) reply += val_(v[i][c]);
    m[id] = { row: i + 1, rfq: val_(v[i][2]), repliedAt: val_(v[i][3]), reply: reply };
  }
  return m;
}

function id_(x) {
  x = String(x || '');
  if (!/^[a-z0-9]{6,16}$/.test(x)) fail_('This link is not valid');
  return x;
}

function locked_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function fail_(msg, code) { var e = new Error(msg); e.code = code || ''; throw e; }

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
