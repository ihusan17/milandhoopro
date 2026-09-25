// Milandhoo Council - online vendor quotations (EdgeOne Pages edge function, served at /api/mq).
//
// Keeps the RFQs sent to vendors and the quotes they submit in Pages KV, so the
// program can give vendors a short link (?q=<id>) and record their reply by itself.
// Needs a KV namespace bound to this Pages project with the variable name MQ_KV.
// Optional: an environment variable OFFICE_KEY; the same key then goes in the
// program under Settings > Online vendor replies.
// Setup: see VENDOR-SERVER-SETUP.md.

const MAX_RFQ = 50000;
const MAX_REPLY = 800000; // signature and stamp images included

export async function onRequest(context) {
  const { request } = context;
  const env = context.env || {};
  try {
    let q;
    if (request.method === 'POST') q = JSON.parse(await request.text());
    else if (request.method === 'GET') q = Object.fromEntries(new URL(request.url).searchParams);
    else throw fail('Method not allowed');
    return out(await route(q || {}, env));
  } catch (x) {
    return out({ ok: false, error: String((x && x.message) || x), code: (x && x.code) || '' });
  }
}

async function route(q, env) {
  const K = store(env);
  const a = q.a;

  // Vendor: open the RFQ behind a short link.
  if (a === 'rfq') {
    const id = checkId(q.id);
    const rfq = await K.get('r_' + id);
    if (!rfq) throw fail('This link is not valid', 'missing');
    const at = await K.get('s_' + id);
    return { ok: true, rfq: JSON.parse(rfq), replied: !!at, repliedAt: at || null };
  }

  // Vendor: submit the quote (once).
  if (a === 'reply') {
    const id = checkId(q.id);
    const reply = q.reply;
    const s = JSON.stringify(reply || null);
    if (!reply || typeof reply !== 'object' || reply.t !== 'reply') throw fail('This is not a quotation');
    if (s.length > MAX_REPLY) throw fail('The quotation is too large. Use a smaller signature or stamp picture.');
    if (!(await K.get('r_' + id))) throw fail('This link is not valid');
    if (await K.get('s_' + id)) throw fail('A quotation was already submitted for this request', 'replied');
    const at = new Date().toISOString();
    await K.put('a_' + id, s);
    await K.put('s_' + id, at); // written last: "s_" present means the reply is stored
    return { ok: true };
  }

  // Everything below is for the council office.
  const key = String(env.OFFICE_KEY || '');
  if (key && String(q.key || '') !== key) throw fail('Wrong office key (Settings > Online vendor replies)');

  if (a === 'ping') return { ok: true, keyed: !!key };

  if (a === 'publish') {
    const id = checkId(q.id);
    const s = JSON.stringify(q.rfq || null);
    if (!q.rfq || q.rfq.t !== 'rfq') throw fail('This is not an RFQ');
    if (s.length > MAX_RFQ) throw fail('The RFQ is too large');
    if (!(await K.get('r_' + id))) await K.put('r_' + id, s);
    return { ok: true };
  }

  if (a === 'replies') {
    const replies = {};
    for (const x of (Array.isArray(q.ids) ? q.ids : []).slice(0, 100)) {
      let id;
      try { id = checkId(x); } catch { continue; }
      const at = await K.get('s_' + id);
      if (!at) continue;
      const r = await K.get('a_' + id);
      if (r) replies[id] = { at, reply: JSON.parse(r) };
    }
    return { ok: true, replies };
  }

  throw fail('Unknown request');
}

function store(env) {
  // EdgeOne exposes a bound KV namespace as a global variable of the bound name.
  if (typeof MQ_KV !== 'undefined') return MQ_KV; // eslint-disable-line no-undef
  if (env.MQ_KV) return env.MQ_KV;
  throw fail('The KV store is not connected: bind a KV namespace to this project as MQ_KV');
}

function checkId(x) {
  x = String(x || '');
  if (!/^[a-z0-9]{6,16}$/.test(x)) throw fail('This link is not valid');
  return x;
}

function fail(msg, code) {
  const e = new Error(msg);
  e.code = code || '';
  return e;
}

function out(o) {
  return new Response(JSON.stringify(o), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
