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

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
}


/* =========================================================
   訂單資料
   ========================================================= */

function readOrders() {
  try {
    return JSON.parse(
      fs.readFileSync(ORDERS_FILE, "utf8")
    );
  } catch {
    return [];
  }
}


function writeOrders(orders) {
  fs.writeFileSync(
    ORDERS_FILE,
    JSON.stringify(orders, null, 2),
    "utf8"
  );
}


/* =========================================================
   HTTP 回應
   ========================================================= */

function send(
  res,
  status,
  body,
  type = "application/json; charset=utf-8"
) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(
    typeof body === "string"
      ? body
      : JSON.stringify(body)
  );
}


/* =========================================================
   靜態檔案
   ========================================================= */

function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(
    urlPath === "/"
      ? "/index.html"
      : urlPath
  );

  const file = path.normalize(
    path.join(PUBLIC_DIR, decoded)
  );

  return file.startsWith(PUBLIC_DIR)
    ? file
    : null;
}


/* =========================================================
   讀取 POST JSON
   ========================================================= */

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", chunk => {
      raw += chunk;

      if (raw.length > 1024 * 1024) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(
          JSON.parse(raw || "{}")
        );
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}


/* =========================================================
   Telegram API
   ========================================================= */

async function telegramApi(
  method,
  body = {}
) {
  const token = String(
    process.env.TELEGRAM_BOT_TOKEN || ""
  ).trim();

  if (!token) {
    throw new Error(
      "沒有設定 TELEGRAM_BOT_TOKEN"
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram API ${response.status}: ${
        data.description || "Unknown error"
      }`
    );
  }

  return data.result;
}


/* =========================================================
   發送 Telegram 訂單通知
   ========================================================= */

async function sendTelegramOrderNotification(order) {

  const chatId = String(
    process.env.TELEGRAM_CHAT_ID || ""
  ).trim();

  if (!chatId) {
    throw new Error(
      "沒有設定 TELEGRAM_CHAT_ID"
    );
  }


  const lines = [
    "🔔 新訂單通知",
    "",
    `訂單編號：${order.id}`,
    `姓名：${order.customer.name}`,
    `電話：${order.customer.phone}`,
    `取餐時間：${order.customer.pickupDateTime || "未填寫"}`,
    "",
    "【訂購內容】"
  ];


  /* =======================================================
     飲料內容
     ======================================================= */

  for (const item of order.items || []) {

    const name =
      String(item.name || "").trim();

    const quantity =
      Number(item.quantity || 0);

    let text =
      `${name} × ${quantity}`;


    const sweetness =
      String(item.sweetness || "").trim();

    if (sweetness) {
      text += `｜甜度：${sweetness}`;
    }


    const ice =
      String(item.ice || "").trim();

    if (ice) {
      text += `｜冰塊：${ice}`;
    }


    lines.push(text);
  }


  /* =======================================================
     購物袋
     ======================================================= */

  const bag1Count =
    Number(order.bag1Count || 0);

  const bag2Count =
    Number(order.bag2Count || 0);

  if (bag1Count > 0 || bag2Count > 0) {

    lines.push("");
    lines.push("【購物袋】");

    if (bag1Count > 0) {
      lines.push(
        `1 杯袋 × ${bag1Count}`
      );
    }

    if (bag2Count > 0) {
      lines.push(
        `2～8 杯袋 × ${bag2Count}`
      );
    }
  }


  /* =======================================================
     備註
     ======================================================= */

  const note =
    String(
      order.customer.note || ""
    ).trim();

  if (note) {
    lines.push("");
    lines.push(`備註：${note}`);
  }


  /* =======================================================
     總金額
     ======================================================= */

  lines.push("");
  lines.push(
    `💰 合計：$${order.total}`
  );


  const message =
    lines.join("\n").slice(0, 4000);


  await telegramApi(
    "sendMessage",
    {
      chat_id: chatId,
      text: message
    }
  );


  console.log(
    `✅ Telegram 通知成功：${order.id}`
  );

  return true;
}


/* =========================================================
   HTTP Server
   ========================================================= */

const server = http.createServer(
  async (req, res) => {

    const url = new URL(
      req.url,
      `http://${
        req.headers.host || "localhost"
      }`
    );


    /* =====================================================
       OPTIONS
       ===================================================== */

    if (req.method === "OPTIONS") {

      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type"
      });

      return res.end();
    }


    /* =====================================================
       Health Check
       ===================================================== */

    if (
      req.method === "GET" &&
      url.pathname === "/api/health"
    ) {

      return send(
        res,
        200,
        {
          ok: true,
          service:
            "Pharmacists Tea House"
        }
      );
    }


    /* =====================================================
       客人送出訂單
       ===================================================== */

    if (
      req.method === "POST" &&
      url.pathname === "/api/orders"
    ) {

      try {

        const body =
          await parseBody(req);

        const customer =
          body.customer || {};

        const items =
          Array.isArray(body.items)
            ? body.items
            : [];


        /* =================================================
           基本驗證
           ================================================= */

        const pickupDateTime =
          String(
            customer.pickupDateTime || ""
          )
            .trim()
            .slice(0, 50);

        if (
          !customer.name ||
          !customer.phone ||
          !pickupDateTime ||
          items.length === 0
        ) {

          return send(
            res,
            400,
            {
              ok: false,
              message:
                "請填寫姓名、電話、取餐時間並至少選一杯茶。"
            }
          );
        }


        /* =================================================
           購物袋
           ================================================= */

        const bag1Count =
          Math.max(
            0,
            Number(
              body.bag1Count || 0
            )
          );

        const bag2Count =
          Math.max(
            0,
            Number(
              body.bag2Count || 0
            )
          );


        /* =================================================
           購物袋金額

           1 杯袋 $1
           2～8 杯袋 $2
           ================================================= */

        const bagTotal =
          bag1Count * 1 +
          bag2Count * 2;


        /* =================================================
           飲料總額
           ================================================= */

        const drinkTotal =
          items.reduce(
            (sum, item) => {

              return (
                sum +
                Number(
                  item.price || 0
                ) *
                Number(
                  item.quantity || 0
                )
              );

            },
            0
          );


        const total =
          drinkTotal + bagTotal;


        /* =================================================
           建立訂單
           ================================================= */

        const order = {

          id:
            `T${Date.now()
              .toString(36)
              .toUpperCase()}${crypto
              .randomBytes(2)
              .toString("hex")
              .toUpperCase()}`,

          createdAt:
            new Date(
              Date.now() +
              8 * 60 * 60 * 1000
            ).toISOString(),

          status: "new",

          customer: {

            name:
              String(
                customer.name
              )
                .trim()
                .slice(0, 50),

            phone:
              String(
                customer.phone
              )
                .trim()
                .slice(0, 30),

            pickupDateTime,

            note:
              String(
                customer.note || ""
              )
                .trim()
                .slice(0, 300)
          },

          items,

          /* 購物袋數量 */
          bag1Count,
          bag2Count,

          /* 總金額 */
          total
        };


        /* =================================================
           儲存訂單
           ================================================= */

        const orders =
          readOrders();

        orders.unshift(order);

        writeOrders(orders);


        /* =================================================
           訂單成功後 → Telegram
           ================================================= */

        try {

          await sendTelegramOrderNotification(
            order
          );

        } catch (telegramError) {

          console.error(
            "❌ Telegram 通知失敗：",
            telegramError.message
          );
        }


        /* =================================================
           回覆前端
           ================================================= */

        return send(
          res,
          201,
          {
            ok: true,
            orderId: order.id,
            total
          }
        );


      } catch (error) {

        console.error(
          "建立訂單錯誤：",
          error
        );

        return send(
          res,
          400,
          {
            ok: false,
            message:
              "訂單資料格式錯誤。"
          }
        );
      }
    }


    /* =====================================================
       後台訂單
       ===================================================== */

    if (
      req.method === "GET" &&
      url.pathname === "/admin"
    ) {

      const adminKey =
        process.env.ADMIN_KEY ||
        "change-me";


      if (
        url.searchParams.get("key") !==
        adminKey
      ) {

        return send(
          res,
          401,
          "Unauthorized",
          "text/plain; charset=utf-8"
        );
      }


      const orders =
        readOrders();


      const rows =
        orders
          .map(order => {

            /* =================================================
               飲料內容
               ================================================= */

            let items =
              (order.items || [])
                .map(item => {

                  let text =
                    `${escapeHtml(
                      item.name || ""
                    )} × ${
                      Number(
                        item.quantity || 0
                      )
                    }`;


                  const sweetness =
                    String(
                      item.sweetness || ""
                    ).trim();

                  const ice =
                    String(
                      item.ice || ""
                    ).trim();


                  if (sweetness) {

                    text +=
                      `｜甜度：${
                        escapeHtml(
                          sweetness
                        )
                      }`;
                  }


                  if (ice) {

                    text +=
                      `｜冰塊：${
                        escapeHtml(
                          ice
                        )
                      }`;
                  }


                  return text;

                })
                .join("<br>");


            /* =================================================
               購物袋內容
               ================================================= */

            const bag1Count =
              Number(
                order.bag1Count || 0
              );

            const bag2Count =
              Number(
                order.bag2Count || 0
              );


            let bagHtml = "";


            if (
              bag1Count > 0 ||
              bag2Count > 0
            ) {

              bagHtml +=
                `<br><br><strong>購物袋：</strong><br>`;

              if (bag1Count > 0) {

                bagHtml +=
                  `1 杯袋 × ${bag1Count}<br>`;
              }

              if (bag2Count > 0) {

                bagHtml +=
                  `2～8 杯袋 × ${bag2Count}`;
              }
            }


            /* =================================================
               備註
               ================================================= */

            const note =
              String(
                order.customer?.note || ""
              ).trim();


            let noteHtml = "";


            if (note) {

              noteHtml =
                `<br><br><strong>備註：</strong>${escapeHtml(
                  note
                )}`;
            }


            return `

<tr>

<td>
${escapeHtml(order.id)}
</td>

<td>
${escapeHtml(order.createdAt)}
</td>

<td>
${escapeHtml(
  order.customer.name
)}
<br>
${escapeHtml(
  order.customer.phone
)}
<br>
<strong>取餐時間：</strong>
${escapeHtml(
  order.customer.pickupDateTime || "未填寫"
)}
</td>

<td>
${items}
${bagHtml}
${noteHtml}
</td>

<td>
$${order.total}
</td>

</tr>

`;

          })
          .join("");


      const html = `

<!doctype html>

<html lang="zh-Hant">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
訂單管理
</title>

<style>

body {

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Noto Sans TC",
    sans-serif;

  margin: 0;

  background: #f5f6f8;

  color: #2b211d;
}


main {

  max-width: 1400px;

  margin: 30px auto;

  padding: 0 20px;
}


h1 {

  color: #8f2f27;

  font-size: 28px;

  margin-bottom: 24px;
}


table {

  width: 100%;

  min-width: 850px;

  border-collapse: collapse;

  background: white;

  border-radius: 16px;

  overflow: hidden;
}


th,
td {

  padding: 16px;

  border-bottom:
    1px solid #eee;

  text-align: left;

  vertical-align: top;
}


th {

  background: #eee4d8;
}


strong {

  font-weight: 700;
}

</style>

</head>


<body>

<main>

<h1>
藥師的私房紅茶｜訂單
</h1>


<table>

<thead>

<tr>

<th>訂單</th>

<th>時間</th>

<th>客人</th>

<th>內容</th>

<th>總額</th>

</tr>

</thead>


<tbody>

${
  rows ||
  "<tr><td colspan='5'>目前沒有訂單</td></tr>"
}

</tbody>

</table>

</main>

</body>

</html>

`;


      return send(
        res,
        200,
        html,
        "text/html; charset=utf-8"
      );
    }


    /* =====================================================
       靜態檔案
       ===================================================== */

    if (req.method === "GET") {

      const file =
        safeFilePath(
          url.pathname
        );


      if (!file) {

        return send(
          res,
          403,
          "Forbidden",
          "text/plain; charset=utf-8"
        );
      }


      fs.stat(
        file,
        (err, stat) => {

          if (
            err ||
            !stat.isFile()
          ) {

            return send(
              res,
              404,
              "Not Found",
              "text/plain; charset=utf-8"
            );
          }


          const ext =
            path.extname(file);


          const types = {

            ".html":
              "text/html; charset=utf-8",

            ".css":
              "text/css",

            ".js":
              "text/javascript",

            ".svg":
              "image/svg+xml",

            ".jpg":
              "image/jpeg",

            ".jpeg":
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
                "application/octet-stream"
            }
          );


          fs.createReadStream(
            file
          ).pipe(res);

        }
      );

      return;
    }


    /* =====================================================
       404
       ===================================================== */

    return send(
      res,
      404,
      "Not Found"
    );

  }
);


/* =========================================================
   HTML Escape
   ========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    char =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char])
  );
}


/* =========================================================
   啟動
   ========================================================= */

server.listen(
  PORT,
  () => {

    console.log(
      `Tea House ordering system running on port ${PORT}`
    );

  }
);
