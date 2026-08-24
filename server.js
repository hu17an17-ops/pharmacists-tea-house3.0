const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 10000;
const ROOT = __dirname;
const PUB = path.join(ROOT, "public");
const DATA = path.join(ROOT, "data");
const FILE = path.join(DATA, "orders.json");

fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]");

const clients = new Set();

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });

  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function body(req) {
  return new Promise((resolve, reject) => {
    let s = "";

    req.on("data", chunk => {
      s += chunk;

      if (s.length > 1e6) {
        reject(Error("too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(s ? JSON.parse(s) : {});
      } catch {
        reject(Error("bad json"));
      }
    });

    req.on("error", reject);
  });
}

function orders() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function safe(p) {
  const f = path.normalize(
    path.join(PUB, decodeURIComponent(p === "/" ? "/index.html" : p))
  );

  return f.startsWith(PUB) ? f : null;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

/* =========================
   即時訂單通知
========================= */

function notifyNewOrder(order) {
  const message = `data: ${JSON.stringify({
    type: "new-order",
    order
  })}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
}

/* =========================
   後台頁面
========================= */

function admin(os, adminKey) {
  return `<!doctype html>
<html lang="zh-Hant">

<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>訂單管理</title>

<style>

body{
  font-family:-apple-system,BlinkMacSystemFont,"Noto Sans TC",sans-serif;
  margin:0;
  background:#f7f1e8;
  color:#2b211d;
}

main{
  max-width:1400px;
  margin:30px auto;
  padding:0 20px;
}

h1{
  color:#8f2f27;
  font-size:28px;
  margin-bottom:10px;
}

.notice{
  position:fixed;
  top:20px;
  right:20px;
  z-index:9999;
  background:#8f2f27;
  color:white;
  padding:18px 22px;
  border-radius:14px;
  box-shadow:0 8px 30px rgba(0,0,0,.2);
  display:none;
  font-size:18px;
  font-weight:bold;
}

.notice.show{
  display:block;
  animation:pop .25s ease;
}

@keyframes pop{
  from{
    transform:translateY(-20px);
    opacity:0;
  }
  to{
    transform:translateY(0);
    opacity:1;
  }
}

.status{
  display:inline-block;
  padding:8px 12px;
  border-radius:20px;
  background:#e7f7e9;
  color:#217a2d;
  font-size:14px;
  margin-bottom:15px;
}

.status.off{
  background:#fff0e8;
  color:#b44b21;
}

button{
  border:0;
  border-radius:10px;
  padding:10px 14px;
  cursor:pointer;
  background:#8f2f27;
  color:white;
  margin-right:8px;
}

table{
  width:100%;
  border-collapse:collapse;
  background:white;
  border-radius:12px;
  overflow:hidden;
}

th,
td{
  padding:12px 10px;
  border-bottom:1px solid #ddd;
  text-align:left;
  vertical-align:top;
  word-break:break-word;
}

th{
  background:#eadfcf;
}

.new-order{
  animation:newOrder 1.2s ease;
}

@keyframes newOrder{
  0%{
    background:#fff3b0;
  }
  100%{
    background:white;
  }
}

@media(max-width:800px){

  main{
    margin:20px 0;
    padding:0 12px;
  }

  h1{
    font-size:24px;
    white-space:nowrap;
  }

  table{
    display:block;
    overflow:auto;
    white-space:nowrap;
  }

  .notice{
    left:12px;
    right:12px;
    top:12px;
    text-align:center;
  }

}

</style>
</head>

<body>

<div id="notice" class="notice">
  🔔 有新訂單！
</div>

<main>

<h1>藥師的私房紅茶｜訂單管理</h1>

<div id="connectionStatus" class="status">
  ● 即時通知連線中...
</div>

<div style="margin-bottom:15px">

<button id="soundButton">
  🔔 啟用通知音效
</button>

<button id="browserButton">
  📱 開啟瀏覽器通知
</button>

</div>

<p id="orderCount">
  共 ${os.length} 筆
</p>

<table>

<thead>
<tr>
<th>訂單</th>
<th>時間</th>
<th>客人</th>
<th>內容</th>
<th>總額</th>
<th>狀態</th>
</tr>
</thead>

<tbody id="ordersBody">

${os.map(o => {

  const c = o.customer || {};

  return `
<tr data-order-id="${esc(o.id)}">

<td>${esc(o.id)}</td>

<td>${esc(o.createdAt)}</td>

<td>
<b>${esc(c.name)}</b><br>
${esc(c.phone)}
${c.taxId ? `<br>統編：${esc(c.taxId)}` : ""}
${c.shoppingBag === "需要" ? `<br>購物袋：需要` : ""}
${c.pickupTime && c.pickupTime !== "undefined" ? `<br>到店：${esc(c.pickupTime)}` : ""}
${c.note ? `<br>備註：${esc(c.note)}` : ""}
</td>

<td>
${(o.items || [])
  .map(i => {
    const options = [
      i.size ? `尺寸：${esc(i.size)}` : "",
      (i.sweetness || i.sugar || i.sugarLevel)
        ? `甜度：${esc(i.sweetness || i.sugar || i.sugarLevel)}`
        : "",
      (i.ice || i.iceLevel || i.iceAmount)
        ? `冰塊：${esc(i.ice || i.iceLevel || i.iceAmount)}`
        : "",
      i.topping ? `加料：${esc(i.topping)}` : ""
    ].filter(Boolean);

    return `
      <div style="margin-bottom:6px">
        <b>${esc(i.name)} × ${i.quantity}</b>
        ${options.length ? `<br>${options.join("<br>")}` : ""}
      </div>
    `;
  })
  .join("")}
</td>

<td>
$${o.total}
</td>

<td>
${esc(o.status)}
</td>

</tr>
`;

}).join("")}

</tbody>

</table>

</main>

<script>

const ADMIN_KEY = ${JSON.stringify(adminKey)};

let soundEnabled = false;
let audioContext = null;

/* =========================
   通知音效
========================= */

function playNotificationSound(){

  if(!soundEnabled) return;

  try{

    if(!audioContext){
      audioContext = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
    }

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime
    );

    oscillator.frequency.setValueAtTime(
      660,
      audioContext.currentTime + 0.15
    );

    gain.gain.setValueAtTime(
      0.001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.25,
      audioContext.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.5
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(
      audioContext.currentTime + 0.5
    );

  }catch(e){

    console.log("通知音效無法播放",e);

  }

}

/* =========================
   啟用音效
========================= */

document
  .getElementById("soundButton")
  .addEventListener("click", async () => {

    soundEnabled = true;

    try{

      audioContext = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

      await audioContext.resume();

      playNotificationSound();

      document.getElementById(
        "soundButton"
      ).textContent = "🔔 通知音效已開啟";

    }catch(e){

      alert("請再點一次啟用通知音效");

    }

  });

/* =========================
   瀏覽器通知
========================= */

document
  .getElementById("browserButton")
  .addEventListener("click", async () => {

    if(!("Notification" in window)){

      alert("此瀏覽器不支援通知功能");
      return;

    }

    const permission =
      await Notification.requestPermission();

    if(permission === "granted"){

      document.getElementById(
        "browserButton"
      ).textContent = "📱 瀏覽器通知已開啟";

    }

  });

/* =========================
   顯示新訂單
========================= */

function showNewOrder(order){

  const notice =
    document.getElementById("notice");

  notice.textContent =
    "🔔 有新訂單！ " +
    order.id +
    "｜$" +
    order.total +
    "｜" +
    (order.customer?.name || "新客人");

  notice.classList.add("show");

  setTimeout(() => {
    notice.classList.remove("show");
  }, 6000);

  playNotificationSound();

  if(
    "Notification" in window &&
    Notification.permission === "granted"
  ){

    new Notification(
      "🔔 藥師的私房紅茶｜新訂單",
      {
        body:
          order.id +
          "\\n客人：" +
          (order.customer?.name || "") +
          "\\n金額：$" +
          order.total
      }
    );

  }

}

/* =========================
   新訂單加入表格
========================= */

function addOrder(order){

  const tbody =
    document.getElementById("ordersBody");

  const old =
    document.querySelector(
      '[data-order-id="' +
      CSS.escape(order.id) +
      '"]'
    );

  if(old) return;

  const c = order.customer || {};

  const tr =
    document.createElement("tr");

  tr.dataset.orderId = order.id;
  tr.className = "new-order";

  const items =
    (order.items || [])
      .map(i => {
        const options = [
          i.size ? "尺寸：" + escapeHtml(i.size) : "",
          (i.sweetness || i.sugar || i.sugarLevel)
            ? "甜度：" + escapeHtml(i.sweetness || i.sugar || i.sugarLevel)
            : "",
          (i.ice || i.iceLevel || i.iceAmount)
            ? "冰塊：" + escapeHtml(i.ice || i.iceLevel || i.iceAmount)
            : "",
          i.topping ? "加料：" + escapeHtml(i.topping) : ""
        ].filter(Boolean);

        return (
          "<div style=\"margin-bottom:6px\"><b>" +
          escapeHtml(i.name) +
          " × " +
          i.quantity +
          "</b>" +
          (options.length ? "<br>" + options.join("<br>") : "") +
          "</div>"
        );
      })
      .join("");

  tr.innerHTML = \`
<td>\${escapeHtml(order.id)}</td>

<td>\${escapeHtml(order.createdAt)}</td>

<td>
<b>\${escapeHtml(c.name)}</b><br>
\${escapeHtml(c.phone)}
\${c.taxId ? `<br>統編：\${escapeHtml(c.taxId)}` : ""}
\${c.shoppingBag === "需要" ? `<br>購物袋：需要` : ""}
\${c.pickupTime && c.pickupTime !== "undefined" ? `<br>到店：\${escapeHtml(c.pickupTime)}` : ""}
\${c.note ? `<br>備註：\${escapeHtml(c.note)}` : ""}
</td>

<td>
\${items}
</td>

<td>
$\${order.total}
</td>

<td>
\${escapeHtml(order.status)}
</td>
\`;

  tbody.prepend(tr);

  const count =
    tbody.querySelectorAll("tr").length;

  document.getElementById(
    "orderCount"
  ).textContent =
    "共 " + count + " 筆";

}

function escapeHtml(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}

/* =========================
   SSE 即時連線
========================= */

function connectRealtime(){

  const status =
    document.getElementById(
      "connectionStatus"
    );

  status.textContent =
    "● 即時通知連線中...";

  status.classList.remove("off");

  const stream =
    new EventSource(
      "/api/admin/stream?key=" +
      encodeURIComponent(ADMIN_KEY)
    );

  stream.onopen = () => {

    status.textContent =
      "● 即時通知已連線";

    status.classList.remove("off");

  };

  stream.onmessage = event => {

    try{

      const data =
        JSON.parse(event.data);

      if(data.type === "new-order"){

        addOrder(data.order);
        showNewOrder(data.order);

      }

    }catch(e){

      console.error(
        "訂單通知資料錯誤",
        e
      );

    }

  };

  stream.onerror = () => {

    status.textContent =
      "● 重新連線中...";

    status.classList.add("off");

    stream.close();

    setTimeout(
      connectRealtime,
      3000
    );

  };

}

connectRealtime();

</script>

</body>
</html>`;
}

/* =========================
   HTTP Server
========================= */

http.createServer(async (req, res) => {

  const u = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  /* OPTIONS */

  if(req.method === "OPTIONS"){
    return send(
      res,
      204,
      "",
      "text/plain"
    );
  }

  /* Health */

  if(
    req.method === "GET" &&
    u.pathname === "/api/health"
  ){

    return send(
      res,
      200,
      {
        ok:true,
        service:"Pharmacists Tea House"
      }
    );

  }

  /* =========================
     即時通知 SSE
  ========================= */

  if(
    req.method === "GET" &&
    u.pathname === "/api/admin/stream"
  ){

    const key =
      process.env.ADMIN_KEY || "change-me";

    if(
      u.searchParams.get("key") !== key
    ){

      return send(
        res,
        401,
        "Unauthorized",
        "text/plain"
      );

    }

    res.writeHead(200,{

      "Content-Type":
        "text/event-stream; charset=utf-8",

      "Cache-Control":
        "no-cache, no-store, must-revalidate",

      "Connection":
        "keep-alive",

      "Access-Control-Allow-Origin":
        "*"

    });

    res.write(
      `data: ${JSON.stringify({
        type:"connected"
      })}\n\n`
    );

    clients.add(res);

    const heartbeat =
      setInterval(() => {

        try{

          res.write(": heartbeat\\n\\n");

        }catch{

          clearInterval(heartbeat);
          clients.delete(res);

        }

      },25000);

    req.on("close",() => {

      clearInterval(heartbeat);
      clients.delete(res);

    });

    return;

  }

  /* =========================
     客人送出訂單
  ========================= */

  if(
    req.method === "POST" &&
    u.pathname === "/api/orders"
  ){

    try{

      const b = await body(req);

      const c =
        b.customer || {};

      const items =
        Array.isArray(b.items)
          ? b.items
          : [];

      if(
        !String(c.name || "").trim() ||
        !String(c.phone || "").trim() ||
        !items.length
      ){

        return send(
          res,
          400,
          {
            ok:false,
            message:
              "請填寫姓名、電話並至少選擇一杯茶。"
          }
        );

      }

      const si =
        items
          .map(i => ({

            name:
              String(
                i.name || ""
              )
              .trim()
              .slice(0,80),

            price:
              Number(
                i.price || 0
              ),

            quantity:
              Math.max(
                1,
                Math.min(
                  99,
                  Number(
                    i.quantity || 1
                  )
                )
              ),

            // 保留前端傳來的飲料客製選項
            sweetness:
              String(i.sweetness ?? i.sugar ?? i.sugarLevel ?? "")
                .trim().slice(0,30),

            ice:
              String(i.ice ?? i.iceLevel ?? i.iceAmount ?? "")
                .trim().slice(0,30),

            size:
              String(i.size ?? "")
                .trim().slice(0,30),

            topping:
              String(i.topping ?? "")
                .trim().slice(0,100)

          }))
          .filter(
            i =>
              i.name &&
              Number.isFinite(i.price)
          );

      const total =
        si.reduce(
          (sum,i) =>
            sum +
            i.price *
            i.quantity,
          0
        );

      const id =
        `TH${Date.now()
          .toString(36)
          .toUpperCase()}${crypto
          .randomBytes(2)
          .toString("hex")
          .toUpperCase()}`;

      const o = {

        id,

        createdAt:
          new Date().toISOString(),

        status:
          "new",

        fulfillment:
          "到店自取",

        payment:
          "現金",

        customer:{

          name:
            String(c.name)
              .trim()
              .slice(0,50),

          phone:
            String(c.phone)
              .trim()
              .slice(0,30),

          taxId:
            String(c.taxId || "")
              .trim()
              .slice(0,8),

          shoppingBag:
            c.shoppingBag === "需要"
              ? "需要"
              : "不需要",

          pickupTime:
            String(c.pickupTime || "").trim().slice(0,5),

          note:
            String(c.note || "")
              .trim()
              .slice(0,300)

        },

        items:si,

        total

      };

      const os =
        orders();

      os.unshift(o);

      fs.writeFileSync(
        FILE,
        JSON.stringify(
          os,
          null,
          2
        )
      );

      /* ★★★ 新增：立即通知所有後台 ★★★ */

      notifyNewOrder(o);

      return send(
        res,
        201,
        {
          ok:true,
          orderId:id,
          total
        }
      );

    }catch{

      return send(
        res,
        400,
        {
          ok:false,
          message:
            "訂單資料格式錯誤。"
        }
      );

    }

  }

  /* =========================
     後台
  ========================= */

  if(
    req.method === "GET" &&
    u.pathname === "/admin"
  ){

    const key =
      process.env.ADMIN_KEY ||
      "change-me";

    if(
      u.searchParams.get("key") !== key
    ){

      return send(
        res,
        401,
        "Unauthorized",
        "text/plain"
      );

    }

    return send(
      res,
      200,
      admin(
        orders(),
        key
      ),
      "text/html; charset=utf-8"
    );

  }

  /* =========================
     靜態檔案
  ========================= */

  if(req.method === "GET"){

    const f =
      safe(u.pathname);

    if(!f){

      return send(
        res,
        403,
        "Forbidden",
        "text/plain"
      );

    }

    fs.stat(
      f,
      (e,st) => {

        if(
          e ||
          !st.isFile()
        ){

          return send(
            res,
            404,
            "Not Found",
            "text/plain"
          );

        }

        const ext =
          path
            .extname(f)
            .toLowerCase();

        const types = {

          ".html":
            "text/html; charset=utf-8",

          ".js":
            "text/javascript; charset=utf-8",

          ".css":
            "text/css; charset=utf-8",

          ".jpg":
            "image/jpeg",

          ".png":
            "image/png",

          ".webp":
            "image/webp"

        };

        res.writeHead(
          200,
          {
            "Content-Type":
              types[ext] ||
              "application/octet-stream",

            "Cache-Control":
              "no-cache"
          }
        );

        fs.createReadStream(f)
          .pipe(res);

      }
    );

    return;

  }

  send(
    res,
    404,
    "Not Found",
    "text/plain"
  );

}).listen(
  PORT,
  () =>
    console.log(
      "Tea House ordering system running on port " +
      PORT
    )
);
