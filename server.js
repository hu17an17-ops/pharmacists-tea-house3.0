const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');

const env = n => String(process.env[n] || '').trim().replace(/\/+$/, '');
const SUPABASE_URL = () => env('SUPABASE_URL');
const SUPABASE_KEY = () => String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const hasSupabase = () => !!(SUPABASE_URL() && SUPABASE_KEY());

const LINE_ACCESS_TOKEN = () => String(process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();
const LINE_CHANNEL_SECRET = () => String(process.env.LINE_CHANNEL_SECRET || '').trim();
const LINE_ADMIN_USER_ID = () => String(process.env.LINE_ADMIN_USER_ID || '').trim();
const adminKey = () => String(process.env.ADMIN_KEY || 'change-me').trim();

/* =========================================================
   HTTP / LINE 基礎功能
   ========================================================= */

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature'
  });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyLineSignature(rawBody, signature) {
  const secret = LINE_CHANNEL_SECRET();
  if (!secret || !signature) return false;

  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  const a = Buffer.from(digest);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function linePush(text, to) {
  const token = LINE_ACCESS_TOKEN();
  const recipient = String(to || '').trim();
  if (!token || !recipient) return { skipped: true };

  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      to: recipient,
      messages: [{ type: 'text', text: String(text).slice(0, 5000) }]
    })
  });

  const raw = await r.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!r.ok) {
    throw new Error(
      data?.message ||
      data?.details?.[0]?.message ||
      `LINE API ${r.status}`
    );
  }

  return { ok: true };
}

function buildOrderMessage(order, title = '🔔 新訂單通知') {
  const lines = [
    title, '',
    `訂單編號：${order.id}`,
    `姓名：${order.customer.name}`,
    `電話：${order.customer.phone}`,
    `取餐時間：${order.customer.pickupDateTime}`, ''
  ];

  lines.push('訂購內容');

  for (const i of order.items || []) {
    let s = `${i.name || ''} × ${Number(i.quantity) || 0}`;
    if (String(i.sweetness || '').trim()) s += `｜甜度：${i.sweetness}`;
    if (String(i.ice || '').trim()) s += `｜冰塊：${i.ice}`;
    lines.push(s);
  }

  if (order.bag1Count || order.bag2Count) {
    lines.push('', '購物袋');
    if (order.bag1Count) lines.push(`1 杯袋 × ${order.bag1Count}`);
    if (order.bag2Count) lines.push(`2～8 杯袋 × ${order.bag2Count}`);
  }

  if (String(order.customer.note || '').trim()) {
    lines.push('', `備註：${order.customer.note}`);
  }

  if (String(order.customer.invoiceNumber || '').trim()) {
    lines.push(`統一編號：${order.customer.invoiceNumber}`);
  }

  lines.push('', `💰 合計：$${order.total}`, '', '💵 付款方式：現金');
  return lines.join('\n');
}

async function handleLineWebhook(req, res) {
  const raw = await readRawBody(req);
  const signature = req.headers['x-line-signature'];

  if (!LINE_CHANNEL_SECRET()) {
    console.error('LINE_CHANNEL_SECRET 未設定，無法驗證 Webhook。');
    return send(res, 500, { ok: false, message: 'LINE_CHANNEL_SECRET 未設定' });
  }

  if (!verifyLineSignature(raw, signature)) {
    console.warn('LINE Webhook signature 驗證失敗');
    return send(res, 400, { ok: false, message: 'Invalid signature' });
  }

  let payload = {};
  try {
    payload = JSON.parse(raw.toString('utf8') || '{}');
  } catch {
    return send(res, 400, { ok: false, message: 'Invalid JSON' });
  }

  // LINE 只用來接收 Webhook 事件；客人不在 LINE 裡點餐或等待自動回覆。
  send(res, 200, { ok: true });

  const events = Array.isArray(payload.events) ? payload.events : [];
  for (const event of events) {
    console.log('LINE webhook event:', {
      type: event.type,
      userId: event.source?.userId || undefined,
      mode: event.mode
    });
  }
}

async function supabase(endpoint, options = {}) {
  if (!hasSupabase()) {
    throw new Error('沒有設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  }

  const r = await fetch(`${SUPABASE_URL()}/rest/v1/${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      apikey: SUPABASE_KEY(),
      Authorization: `Bearer ${SUPABASE_KEY()}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await r.text();
  let data = null;

  try { data = text ? JSON.parse(text) : null; }
  catch { data = text; }

  if (!r.ok) {
    throw new Error(
      `Supabase API ${r.status}: ${data?.message || data?.error || text}`
    );
  }

  return data;
}

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeOrders(x) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(x, null, 2), 'utf8');
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function taiwanDateParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const get = t => parts.find(x => x.type === t)?.value || '';
  return { year: get('year'), month: get('month'), day: get('day') };
}

function makeOrderId(n) {
  n = Math.floor(num(n));
  if (!n) return '';

  if (n >= 2000010101 && n <= 9999123199) {
    return `PTH${n}`;
  }

  return `T${n.toString(36).toUpperCase()}${crypto
    .createHash('sha256')
    .update(String(n))
    .digest('hex')
    .slice(0, 6)
    .toUpperCase()}`;
}

async function getNextOrderNumber() {
  const { year, month, day } = taiwanDateParts();
  const base = Number(`${year}${month}${day}`) * 100;
  let latest = 0;

  try {
    const rows = await supabase(
      `orders?order_number=gte.${base + 1}&order_number=lt.${base + 1000}&order=order_number.desc&limit=1`
    );

    latest = Array.isArray(rows)
      ? num(rows[0]?.order_number) - base
      : 0;
  } catch {}

  if (!latest) {
    for (const row of readOrders()) {
      const n = Math.floor(num(row.orderNumber ?? row.order_number));
      if (n >= base + 1 && n < base + 1000) {
        latest = Math.max(latest, n - base);
      }
    }
  }

  if (latest >= 999) {
    throw new Error('今日訂單編號已超過 999 筆，請聯絡管理員。');
  }

  return base + latest + 1;
}

function resolveOrderNumber(value) {
  const raw = String(value ?? '').trim().toUpperCase();

  if (/^\d+$/.test(raw)) return Math.floor(num(raw));

  if (/^PTH\d{10,}$/.test(raw)) {
    return Number(raw.slice(3));
  }

  if (/^T[A-Z0-9]+$/.test(raw) && raw.length >= 8) {
    const n = parseInt(raw.slice(1, -6), 36);
    return makeOrderId(n) === raw ? n : 0;
  }

  return 0;
}

async function verifyLineIdToken(idToken) {
  const token = String(idToken || '').trim();
  const channelId = String(process.env.LINE_CHANNEL_ID || '').trim();

  if (!token || !channelId) return null;

  const r = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: token,
      client_id: channelId
    }).toString()
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok || !data.sub) {
    throw new Error(
      data.error_description || `LINE ID Token 驗證失敗 (${r.status})`
    );
  }

  return data;
}

async function createOrder(b) {
  const c = b.customer || {};
  const items = Array.isArray(b.items) ? b.items : [];

  const name = String(
    c.name || b.customer_name || ''
  ).trim().slice(0, 50);

  const phone = String(
    c.phone || b.customer_phone || ''
  ).trim().slice(0, 30);

  const pickup = String(
    c.pickupDateTime ||
    c.pickup_time ||
    b.pickup_time ||
    ''
  ).trim().slice(0, 50);

  const invoice = String(
    b.invoiceNumber ??
    b.invoice_number ??
    c.invoiceNumber ??
    c.invoice_number ??
    ''
  ).trim().slice(0, 30);

  const note = String(
    c.note ??
    c.notes ??
    b.notes ??
    ''
  ).trim().slice(0, 300);

  if (!name || !phone || !pickup || !items.length) {
    throw new Error('請填寫姓名、電話、取餐時間並至少選一杯茶。');
  }

  if (!/^\d{10}$/.test(phone)) {
    throw new Error('電話必須輸入10碼數字。');
  }

  const bag1 = Math.max(
    0,
    num(b.bag1Count ?? b.bag_1_count)
  );

  const bag2 = Math.max(
    0,
    num(b.bag2Count ?? b.bag_2_count)
  );

  const total =
    items.reduce(
      (sum, i) => sum + num(i.price) * num(i.quantity),
      0
    ) +
    bag1 +
    bag2 * 2;

  const orderNumber = await getNextOrderNumber();

  const order = {
    id: makeOrderId(orderNumber),
    orderNumber,
    createdAt: new Date().toISOString(),
    status: 'new',
    customer: {
      name,
      phone,
      pickupDateTime: pickup,
      invoiceNumber: invoice,
      note
    },
    items,
    bag1Count: bag1,
    bag2Count: bag2,
    total
  };

  let saved = null;

  if (hasSupabase()) {
    saved = await supabase('orders', {
      method: 'POST',
      body: {
        order_number: orderNumber,
        customer_name: name,
        customer_phone: phone,
        items,
        total_amount: Math.round(total),
        invoice_number: invoice || null,
        shopping_bag: !!(bag1 || bag2),
        bag1_count: bag1,
        bag2_count: bag2,
        pickup_time: pickup || null,
        notes: note || null,
        order_status: 'new'
      }
    });
  } else {
    const local = readOrders();
    local.unshift(order);
    writeOrders(local);
  }

  let lineUserId = '';

  try {
    const verified = await verifyLineIdToken(b.lineIdToken);
    lineUserId = String(verified?.sub || '').trim();
  } catch (e) {
    if (b.lineIdToken) {
      console.error('LINE 客人身分驗證失敗：', e.message);
    }
  }

  let adminLineNotified = false;
  let customerLineNotified = false;

  if (LINE_ADMIN_USER_ID()) {
    try {
      await linePush(buildOrderMessage(order), LINE_ADMIN_USER_ID());
      adminLineNotified = true;
    } catch (e) {
      console.error('官方 LINE 訂單通知失敗：', e.message);
    }
  }

  if (lineUserId) {
    try {
      await linePush(buildOrderMessage(order, '✅ 您的訂單已成立'), lineUserId);
      customerLineNotified = true;
    } catch (e) {
      console.error('客人 LINE 訂單通知失敗：', e.message);
    }
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber,
    total,
    supabase: hasSupabase(),
    supabaseOrderId: Array.isArray(saved)
      ? saved[0]?.id
      : saved?.id || null
  };
}

/* =========================================================
   靜態網站
   ========================================================= */

function safeFile(p) {
  let d;

  try {
    d = decodeURIComponent(
      p === '/' ? '/index.html' : p
    );
  } catch {
    return null;
  }

  const root = path.resolve(PUBLIC_DIR);
  const file = path.resolve(
    path.join(PUBLIC_DIR, d)
  );

  return file === root ||
    file.startsWith(root + path.sep)
    ? file
    : null;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const u = new URL(
    req.url,
    `http://${req.headers.host || 'localhost'}`
  );

  try {
    if (req.method === 'OPTIONS') {
      return send(res, 204, '');
    }

    // LINE Webhook 一定要放在一般 API / 靜態檔案之前。
    if (
      req.method === 'POST' &&
      u.pathname === '/webhook'
    ) {
      return await handleLineWebhook(req, res);
    }

    if (
      req.method === 'GET' &&
      u.pathname === '/api/health'
    ) {
      return send(res, 200, {
        ok: true,
        service: 'Pharmacists Tea House',
        supabase: hasSupabase(),
        line: Boolean(
          LINE_ACCESS_TOKEN() &&
          LINE_ADMIN_USER_ID()
        ),
        webhook: Boolean(
          LINE_ACCESS_TOKEN() &&
          LINE_CHANNEL_SECRET()
        ),
        customerLineNotification: Boolean(
          LINE_ACCESS_TOKEN() &&
          process.env.LINE_CHANNEL_ID
        )
      });
    }

    if (
      req.method === 'POST' &&
      u.pathname === '/api/orders'
    ) {
      try {
        const result = await createOrder(
          await readJsonBody(req)
        );

        return send(res, 201, result);
      } catch (e) {
        console.error('建立訂單失敗：', e);

        return send(res, 500, {
          ok: false,
          message: e.message || '訂單建立失敗'
        });
      }
    }

    if (
      req.method === 'GET' &&
      /^\/api\/orders\/[^/]+$/.test(u.pathname)
    ) {
      if (!hasSupabase()) {
        return send(res, 503, {
          ok: false,
          message: 'Supabase 尚未設定'
        });
      }

      const n = u.pathname.split('/').pop();
      const orderNumber = resolveOrderNumber(n);

      if (!orderNumber) {
        return send(res, 400, {
          ok: false,
          message: '訂單編號格式錯誤'
        });
      }

      const rows = await supabase(
        `orders?select=*&order_number=eq.${orderNumber}&limit=1`
      );

      if (!rows?.[0]) {
        return send(res, 404, {
          ok: false,
          message: '找不到訂單'
        });
      }

      return send(res, 200, {
        ok: true,
        order: rows[0]
      });
    }

    const file = safeFile(u.pathname);

    if (!file) {
      return send(res, 403, {
        ok: false,
        message: 'Forbidden'
      });
    }

    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        return send(
          res,
          404,
          'Not Found',
          'text/plain; charset=utf-8'
        );
      }

      const ext = path.extname(file).toLowerCase();

      res.writeHead(200, {
        'Content-Type':
          MIME[ext] ||
          'application/octet-stream',
        'Cache-Control':
          ext === '.html'
            ? 'no-store'
            : 'public,max-age=3600'
      });

      fs.createReadStream(file).pipe(res);
    });
  } catch (e) {
    console.error('伺服器錯誤', e);

    if (!res.headersSent) {
      send(res, 500, {
        ok: false,
        message:
          e.message ||
          '伺服器發生錯誤'
      });
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Website ordering + admin/customer LINE notifications enabled');
});
