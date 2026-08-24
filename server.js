const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf8");

function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8")); }
  catch { return []; }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}
function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const file = path.normalize(path.join(PUBLIC_DIR, decoded));
  return file.startsWith(PUBLIC_DIR) ? file : null;
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, service: "Pharmacists Tea House" });
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    try {
      const body = await parseBody(req);
      const customer = body.customer || {};
      const items = Array.isArray(body.items) ? body.items : [];

      if (!customer.name || !customer.phone || items.length === 0) {
        return send(res, 400, { ok: false, message: "請填寫姓名、電話並至少選一杯茶。" });
      }

const bag1Count = Math.max(0, Number(body.bag1Count || 0));
const bag2Count = Math.max(0, Number(body.bag2Count || 0));

const bagTotal = bag1Count * 1 + bag2Count * 2;

const drinkTotal = items.reduce(
  (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
  0
);

const total = drinkTotal + bagTotal;
      const order = {
        id: `T${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        createdAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        status: "new",
        customer: {
          name: String(customer.name).trim().slice(0, 50),
          phone: String(customer.phone).trim().slice(0, 30),
          note: String(customer.note || "").trim().slice(0, 300)
        },
        items,
        total
      };

      const orders = readOrders();
      orders.unshift(order);
      writeOrders(orders);
      return send(res, 201, { ok: true, orderId: order.id, total });
    } catch {
      return send(res, 400, { ok: false, message: "訂單資料格式錯誤。" });
    }
  }

  if (req.method === "GET" && url.pathname === "/admin") {
    const adminKey = process.env.ADMIN_KEY || "change-me";
    if (url.searchParams.get("key") !== adminKey) {
      return send(res, 401, "Unauthorized", "text/plain; charset=utf-8");
    }
    const orders = readOrders();
    const rows = orders.map(o => `
      <tr>
        <td>${escapeHtml(o.id)}</td>
        <td>${escapeHtml(o.createdAt)}</td>
        <td>${escapeHtml(o.customer.name)}<br>${escapeHtml(o.customer.phone)}</td>
        <td>${o.items.map(i => `${escapeHtml(i.name)} × ${i.quantity}（${escapeHtml(i.sweetness)}／${escapeHtml(i.ice)}）`).join("<br>")}</td>
        <td>$${o.total}</td>
      </tr>`).join("");
    const html = `<!doctype html><html lang="zh-Hant"><meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>訂單管理</title>
      <style>
      @media (max-width: 700px) {
  main {
    max-width: none;
    margin: 20px 0;
    padding: 0 12px;
  }

  h1 {
    font-size: 24px;
    white-space: nowrap;
    margin: 10px 0 20px;
  }

  table {
    width: 100%;
    min-width: 0;
    table-layout: fixed;
  }

  th,
  td {
    padding: 12px 8px;
    font-size: 14px;
    word-break: break-word;
  }
}
      </style><main><h1>藥師的私房紅茶｜訂單</h1><table><thead><tr>
      <th>訂單</th><th>時間</th><th>客人</th><th>內容</th><th>總額</th>
      </tr></thead><tbody>${rows || "<tr><td colspan=5>目前沒有訂單</td></tr>"}</tbody></table></main>`;
    return send(res, 200, html, "text/html; charset=utf-8");
  }

  if (req.method === "GET") {
    const file = safeFilePath(url.pathname);
    if (!file) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) return send(res, 404, "Not Found", "text/plain; charset=utf-8");
      const ext = path.extname(file);
      const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".webp":"image/webp" };
      res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    return;
  }

  send(res, 404, "Not Found", "text/plain; charset=utf-8");
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

server.listen(PORT, () => console.log(`Tea House ordering system running on port ${PORT}`));
