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
   Supabase 設定
   Render Environment Variables：

   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY

   ========================================================= */

function getSupabaseUrl() {
  return String(process.env.SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
}

function getSupabaseKey() {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    .trim();
}

function hasSupabaseConfig() {
  return Boolean(
    getSupabaseUrl() &&
    getSupabaseKey()
  );
}


/* =========================================================
   Supabase API
   ========================================================= */

async function supabaseRequest(
  endpoint,
  options = {}
) {
  const baseUrl = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!baseUrl || !key) {
    throw new Error(
      "沒有設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const response = await fetch(
    `${baseUrl}/rest/v1/${endpoint}`,
    {
      method: options.method || "GET",

      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer":
          options.prefer ||
          "return=representation"
      },

      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body)
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      data.message
        ? data.message
        : typeof data === "object" &&
          data &&
          data.error
          ? data.error
          : text;

    throw new Error(
      `Supabase API ${response.status}: ${message}`
    );
  }

  return data;
}


/* =========================================================
   本機 orders.json 備份
   ========================================================= */

function readOrders() {
  try {
    return JSON.parse(
      fs.readFileSync(
        ORDERS_FILE,
        "utf8"
      )
    );
  } catch {
    return [];
  }
}


function writeOrders(orders) {
  fs.writeFileSync(
    ORDERS_FILE,
    JSON.stringify(
      orders,
      null,
      2
    ),
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
  res.writeHead(
    status,
    {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type"
    }
  );

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
  let decoded;

  try {
    decoded = decodeURIComponent(
      urlPath === "/"
        ? "/index.html"
        : urlPath
    );
  } catch {
    return null;
  }

  const file = path.normalize(
    path.join(
      PUBLIC_DIR,
      decoded
    )
  );

  const publicRoot =
    path.resolve(PUBLIC_DIR);

  const resolved =
    path.resolve(file);

  if (
    resolved === publicRoot ||
    resolved.startsWith(
      publicRoot + path.sep
    )
  ) {
    return resolved;
  }

  return null;
}


/* =========================================================
   讀取 POST JSON
   ========================================================= */

function parseBody(req) {
  return new Promise(
    (resolve, reject) => {
      let raw = "";

      req.on(
        "data",
        chunk => {
          raw += chunk;

          if (
            raw.length >
            1024 * 1024
          ) {
            reject(
              new Error(
                "Request body too large"
              )
            );

            req.destroy();
          }
        }
      );

      req.on(
        "end",
        () => {
          try {
            resolve(
              JSON.parse(
                raw || "{}"
              )
            );
          } catch (error) {
            reject(error);
          }
        }
      );

      req.on(
        "error",
        reject
      );
    }
  );
}


/* =========================================================
   Telegram API
   ========================================================= */

async function telegramApi(
  method,
  body = {}
) {
  const token =
    String(
      process.env.TELEGRAM_BOT_TOKEN ||
      ""
    ).trim();

  if (!token) {
    throw new Error(
      "沒有設定 TELEGRAM_BOT_TOKEN"
    );
  }

  const response =
    await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      `Telegram API ${response.status}: ${
        data.description ||
        "Unknown error"
      }`
    );
  }

  return data.result;
}


/* =========================================================
   Telegram 訂單通知
   ========================================================= */

async function sendTelegramOrderNotification(
  order
) {
  const chatId =
    String(
      process.env.TELEGRAM_CHAT_ID ||
      ""
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
    `取餐時間：${
      order.customer.pickupDateTime ||
      "未填寫"
    }`
  ];

  if (
    order.customer.invoiceNumber
  ) {
    lines.push(
      `統一編號：${order.customer.invoiceNumber}`
    );
  }

  lines.push("");
  lines.push("【訂購內容】");

  for (
    const item of order.items || []
  ) {
    const name =
      String(
        item.name || ""
      ).trim();

    const quantity =
      Number(
        item.quantity || 0
      );

    let text =
      `${name} × ${quantity}`;

    const sweetness =
      String(
        item.sweetness || ""
      ).trim();

    if (sweetness) {
      text +=
        `｜甜度：${sweetness}`;
    }

    const ice =
      String(
        item.ice || ""
      ).trim();

    if (ice) {
      text +=
        `｜冰塊：${ice}`;
    }

    lines.push(text);
  }


  /* =======================================================
     購物袋
     ======================================================= */

  const bag1Count =
    Number(
      order.bag1Count || 0
    );

  const bag2Count =
    Number(
      order.bag2Count || 0
    );

  if (
    bag1Count > 0 ||
    bag2Count > 0
  ) {
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
    lines.push(
      `備註：${note}`
    );
  }


  /* =======================================================
     總金額
     ======================================================= */

  lines.push("");
  lines.push(
    `💰 合計：$${order.total}`
  );

  lines.push("");
  lines.push(
    "💵 付款方式：現金"
  );

  const message =
    lines
      .join("\n")
      .slice(0, 4000);

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
   取得統一編號
   ========================================================= */

function getInvoiceNumber(
  body,
  customer
) {
  return String(
    body.invoiceNumber ??
    body.invoice_number ??
    customer.invoiceNumber ??
    customer.invoice_number ??
    ""
  )
    .trim()
    .slice(0, 30);
}


/* =========================================================
   取得購物袋數量
   ========================================================= */

function getBag1Count(body) {
  return Math.max(
    0,
    Number(
      body.bag1Count ??
      body.bag_1_count ??
      0
    )
  );
}


function getBag2Count(body) {
  return Math.max(
    0,
    Number(
      body.bag2Count ??
      body.bag_2_count ??
      0
    )
  );
}


/* =========================================================
   建立 Supabase 訂單資料
   ========================================================= */

function buildSupabaseOrder(
  order
) {
  return {
    order_number:
      Number(
        order.orderNumber
      ),

    customer_name:
      order.customer.name,

    customer_phone:
      order.customer.phone,

    items:
      order.items,

    total_amount:
      Math.round(
        Number(order.total || 0)
      ),

    invoice_number:
      order.customer.invoiceNumber ||
      null,

    shopping_bag:
      Boolean(
        Number(
          order.bag1Count || 0
        ) > 0 ||
        Number(
          order.bag2Count || 0
        ) > 0
      ),

    // 分開保存兩種購物袋數量，讓後台可以顯示實際數量
    bag1_count:
      Math.max(
        0,
        Number(
          order.bag1Count || 0
        )
      ),

    bag2_count:
      Math.max(
        0,
        Number(
          order.bag2Count || 0
        )
      ),

    pickup_time:
      order.customer.pickupDateTime ||
      null,

    notes:
      order.customer.note ||
      null,

    order_status:
      order.status || "new"
  };
}


/* =========================================================
   寫入 Supabase
   ========================================================= */

async function saveOrderToSupabase(
  order
) {
  const row =
    buildSupabaseOrder(
      order
    );

  const result =
    await supabaseRequest(
      "orders",
      {
        method: "POST",

        prefer:
          "return=representation",

        body: row
      }
    );

  console.log(
    `✅ Supabase 訂單寫入成功：${order.id}`
  );

  return Array.isArray(result)
    ? result[0]
    : result;
}


/* =========================================================
   從 Supabase 取得訂單
   ========================================================= */

async function getSupabaseOrders() {
  const result =
    await supabaseRequest(
      "orders?select=*&order=created_at.desc&limit=100",
      {
        method: "GET"
      }
    );

  return Array.isArray(result)
    ? result
    : [];
}


/* =========================================================
   從 Supabase 找指定訂單
   ========================================================= */

async function getSupabaseOrderByNumber(
  orderNumber
) {
  const number =
    Number(orderNumber);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  const result =
    await supabaseRequest(
      `orders?select=*&order_number=eq.${encodeURIComponent(
        number
      )}&limit=1`,
      {
        method: "GET"
      }
    );

  if (
    Array.isArray(result) &&
    result.length > 0
  ) {
    return result[0];
  }

  return null;
}


/* =========================================================
   更新 Supabase 訂單狀態
   ========================================================= */

async function updateSupabaseOrderStatus(
  orderNumber,
  status
) {
  const number =
    Number(orderNumber);

  if (
    !Number.isFinite(number)
  ) {
    throw new Error(
      "訂單編號格式錯誤"
    );
  }

  const allowedStatuses = [
    "new",
    "confirmed",
    "preparing",
    "ready",
    "completed",
    "cancelled"
  ];

  const cleanStatus =
    String(
      status || ""
    ).trim();

  if (
    !allowedStatuses.includes(
      cleanStatus
    )
  ) {
    throw new Error(
      "訂單狀態不正確"
    );
  }

  const result =
    await supabaseRequest(
      `orders?order_number=eq.${encodeURIComponent(
        number
      )}`,
      {
        method: "PATCH",

        prefer:
          "return=representation",

        body: {
          order_status:
            cleanStatus
        }
      }
    );

  return Array.isArray(result)
    ? result[0] || null
    : result;
}


/* =========================================================
   將 Supabase 訂單轉成前端 / 後台格式
   ========================================================= */

function normalizeSupabaseOrder(
  row
) {
  const orderNumber =
    Number(
      row.order_number
    );

  return {
    id:
      `T${orderNumber}`,

    orderNumber,

    createdAt:
      row.created_at,

    status:
      row.order_status ||
      "new",

    customer: {
      name:
        row.customer_name ||
        "",

      phone:
        row.customer_phone ||
        "",

      pickupDateTime:
        row.pickup_time ||
        "",

      invoiceNumber:
        row.invoice_number ||
        "",

      note:
        row.notes ||
        ""
    },

    items:
      Array.isArray(row.items)
        ? row.items
        : [],

    bag1Count:
      Math.max(
        0,
        Number(
          row.bag1_count || 0
        )
      ),

    bag2Count:
      Math.max(
        0,
        Number(
          row.bag2_count || 0
        )
      ),

    total:
      Number(
        row.total_amount || 0
      )
  };
}


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
   HTTP Server
   ========================================================= */

const server =
  http.createServer(
    async (
      req,
      res
    ) => {

      const url =
        new URL(
          req.url,
          `http://${
            req.headers.host ||
            "localhost"
          }`
        );


      /* =====================================================
         OPTIONS
         ===================================================== */

      if (
        req.method ===
        "OPTIONS"
      ) {
        res.writeHead(
          204,
          {
            "Access-Control-Allow-Origin":
              "*",

            "Access-Control-Allow-Methods":
              "GET,POST,PUT,OPTIONS",

            "Access-Control-Allow-Headers":
              "Content-Type"
          }
        );

        return res.end();
      }


      /* =====================================================
         Health Check
         ===================================================== */

      if (
        req.method === "GET" &&
        url.pathname ===
          "/api/health"
      ) {
        return send(
          res,
          200,
          {
            ok: true,

            service:
              "Pharmacists Tea House",

            supabase:
              hasSupabaseConfig(),

            telegram:
              Boolean(
                process.env.TELEGRAM_BOT_TOKEN &&
                process.env.TELEGRAM_CHAT_ID
              )
          }
        );
      }


      /* =====================================================
         客人送出訂單
         ===================================================== */

      if (
        req.method === "POST" &&
        url.pathname ===
          "/api/orders"
      ) {

        try {

          const body =
            await parseBody(
              req
            );

          const customer =
            body.customer ||
            {};

          const items =
            Array.isArray(
              body.items
            )
              ? body.items
              : [];


          /* =================================================
             基本資料
             ================================================= */

          const name =
            String(
              customer.name ||
              body.customer_name ||
              ""
            )
              .trim()
              .slice(0, 50);

          const phone =
            String(
              customer.phone ||
              body.customer_phone ||
              ""
            )
              .trim()
              .slice(0, 30);

          const pickupDateTime =
            String(
              customer.pickupDateTime ||
              customer.pickup_time ||
              body.pickup_time ||
              ""
            )
              .trim()
              .slice(0, 50);

          const invoiceNumber =
            getInvoiceNumber(
              body,
              customer
            );

          const note =
            String(
              customer.note ??
              customer.notes ??
              body.notes ??
              ""
            )
              .trim()
              .slice(0, 300);


          if (
            !name ||
            !phone ||
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
            getBag1Count(
              body
            );

          const bag2Count =
            getBag2Count(
              body
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
              (
                sum,
                item
              ) => {

                const price =
                  Number(
                    item.price ||
                    0
                  );

                const quantity =
                  Number(
                    item.quantity ||
                    0
                  );

                return (
                  sum +
                  price *
                    quantity
                );
              },
              0
            );


          const total =
            drinkTotal +
            bagTotal;


          /* =================================================
             產生數字訂單編號

             Supabase order_number 是 bigint，
             所以不能使用 Txxxxxx 字串。

             Date.now() 本身就是安全的數字範圍。
             ================================================= */

          const orderNumber =
            Date.now();


          /* =================================================
             前端原本使用的訂單 ID
             ================================================= */

          const displayOrderId =
            `T${orderNumber
              .toString(36)
              .toUpperCase()}${crypto
              .randomBytes(2)
              .toString("hex")
              .toUpperCase()}`;


          /* =================================================
             建立完整訂單
             ================================================= */

          const order = {

            id:
              displayOrderId,

            orderNumber,

            createdAt:
              new Date()
                .toISOString(),

            status:
              "new",

            customer: {

              name,

              phone,

              pickupDateTime,

              invoiceNumber,

              note
            },

            items,

            bag1Count,

            bag2Count,

            total
          };


          /* =================================================
             先寫入 Supabase

             這是正式訂單資料庫。
             ================================================= */

          let supabaseOrder;

          try {

            supabaseOrder =
              await saveOrderToSupabase(
                order
              );

          } catch (
            supabaseError
          ) {

            /*
              Supabase 暫時故障時，不讓客人整張訂單送不出去。
              先保存本機備份，後台仍可從本機備份讀取。
              同時把實際錯誤記錄到 Render log。
            */
            console.error(
              "❌ Supabase 寫入失敗，改用本機訂單備份：",
              supabaseError
            );

            supabaseOrder = null;
          }


          /* =================================================
             同時保存本機 orders.json

             這只是備份，不再當主要資料庫。
             ================================================= */

          try {

            const orders =
              readOrders();

            orders.unshift(
              order
            );

            writeOrders(
              orders
            );

          } catch (
            localError
          ) {

            console.error(
              "⚠️ 本機備份失敗：",
              localError
            );
          }


          /* =================================================
             訂單成功後 → Telegram
             ================================================= */

          try {

            await sendTelegramOrderNotification(
              order
            );

          } catch (
            telegramError
          ) {

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

              orderId:
                displayOrderId,

              orderNumber,

              total,

              supabase:
                Boolean(supabaseOrder),

              supabaseOrderId:
                supabaseOrder?.id ||
                null
            }
          );


        } catch (
          error
        ) {

          console.error(
            "❌ 建立訂單錯誤：",
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
         查詢單筆訂單

         GET /api/orders/:orderNumber
         ===================================================== */

      if (
        req.method === "GET" &&
        url.pathname.startsWith(
          "/api/orders/"
        )
      ) {

        try {

          const orderNumber =
            url.pathname
              .split("/")
              .pop();

          if (
            !orderNumber
          ) {

            return send(
              res,
              400,
              {
                ok: false,
                message:
                  "缺少訂單編號"
              }
            );
          }


          if (
            !hasSupabaseConfig()
          ) {

            return send(
              res,
              503,
              {
                ok: false,
                message:
                  "Supabase 尚未設定"
              }
            );
          }


          const row =
            await getSupabaseOrderByNumber(
              orderNumber
            );


          if (!row) {

            return send(
              res,
              404,
              {
                ok: false,
                message:
                  "找不到訂單"
              }
            );
          }


          return send(
            res,
            200,
            {
              ok: true,

              order:
                normalizeSupabaseOrder(
                  row
                )
            }
          );


        } catch (
          error
        ) {

          console.error(
            "❌ 查詢訂單錯誤：",
            error
          );

          return send(
            res,
            500,
            {
              ok: false,

              message:
                "查詢訂單失敗"
            }
          );
        }
      }


      /* =====================================================
         更新訂單狀態

         PUT /api/orders/:orderNumber/status

         body:
         {
           "status": "completed"
         }

         ===================================================== */

      if (
        req.method === "PUT" &&
        url.pathname.match(
          /^\/api\/orders\/[^/]+\/status$/
        )
      ) {

        try {

          const parts =
            url.pathname
              .split("/");

          const orderNumber =
            parts[3];

          const body =
            await parseBody(
              req
            );

          const status =
            String(
              body.status ||
              ""
            ).trim();


          const updated =
            await updateSupabaseOrderStatus(
              orderNumber,
              status
            );


          if (!updated) {

            return send(
              res,
              404,
              {
                ok: false,

                message:
                  "找不到訂單"
              }
            );
          }


          return send(
            res,
            200,
            {
              ok: true,

              order:
                normalizeSupabaseOrder(
                  updated
                )
            }
          );


        } catch (
          error
        ) {

          console.error(
            "❌ 更新訂單狀態錯誤：",
            error
          );

          return send(
            res,
            400,
            {
              ok: false,

              message:
                error.message ||
                "更新訂單狀態失敗"
            }
          );
        }
      }


      /* =====================================================
         後台訂單

         /admin?key=你的ADMIN_KEY
         ===================================================== */

      if (
        req.method === "GET" &&
        url.pathname ===
          "/admin"
      ) {

        const adminKey =
          process.env.ADMIN_KEY ||
          "change-me";


        if (
          url.searchParams.get(
            "key"
          ) !== adminKey
        ) {

          return send(
            res,
            401,
            "Unauthorized",
            "text/plain; charset=utf-8"
          );
        }


        let orders = [];


        /* =================================================
           優先從 Supabase 讀取
           ================================================= */

        try {

          if (
            hasSupabaseConfig()
          ) {

            orders =
              await getSupabaseOrders();

          }

        } catch (
          supabaseError
        ) {

          console.error(
            "⚠️ 後台讀取 Supabase 失敗：",
            supabaseError
          );
        }


        /* =================================================
           Supabase 失敗時使用本機備份
           ================================================= */

        if (
          orders.length === 0
        ) {

          try {

            const localOrders =
              readOrders();

            if (
              localOrders.length >
              0
            ) {

              orders =
                localOrders.map(
                  order => ({
                    order_number:
                      order.orderNumber ||
                      null,

                    customer_name:
                      order.customer?.name ||
                      "",

                    customer_phone:
                      order.customer?.phone ||
                      "",

                    items:
                      order.items ||
                      [],

                    total_amount:
                      order.total ||
                      0,

                    invoice_number:
                      order.customer?.invoiceNumber ||
                      null,

                    shopping_bag:
                      Boolean(
                        order.bag1Count ||
                        order.bag2Count
                      ),

                    bag1_count:
                      Math.max(
                        0,
                        Number(
                          order.bag1Count || 0
                        )
                      ),

                    bag2_count:
                      Math.max(
                        0,
                        Number(
                          order.bag2Count || 0
                        )
                      ),

                    pickup_time:
                      order.customer?.pickupDateTime ||
                      null,

                    notes:
                      order.customer?.note ||
                      null,

                    order_status:
                      order.status ||
                      "new",

                    created_at:
                      order.createdAt
                  })
                );
            }

          } catch (
            localError
          ) {

            console.error(
              "⚠️ 讀取本機訂單失敗：",
              localError
            );
          }
        }


        /* =================================================
           建立後台表格
           ================================================= */

        const rows =
          orders
            .map(
              row => {

                const orderNumber =
                  row.order_number ||
                  "";

                const createdAt =
                  row.created_at ||
                  "";

                const customerName =
                  row.customer_name ||
                  "";

                const customerPhone =
                  row.customer_phone ||
                  "";

                const pickupTime =
                  row.pickup_time ||
                  "";

                const invoiceNumber =
                  row.invoice_number ||
                  "";

                const notes =
                  row.notes ||
                  "";

                const status =
                  row.order_status ||
                  "new";

                const total =
                  Number(
                    row.total_amount ||
                    0
                  );

                const bag1Count =
                  Math.max(
                    0,
                    Number(
                      row.bag1_count || 0
                    )
                  );

                const bag2Count =
                  Math.max(
                    0,
                    Number(
                      row.bag2_count || 0
                    )
                  );


                /* =========================================
                   飲料內容
                   ========================================= */

                let itemsHtml =
                  (
                    Array.isArray(
                      row.items
                    )
                      ? row.items
                      : []
                  )
                    .map(
                      item => {

                        let text =
                          `${escapeHtml(
                            item.name ||
                            ""
                          )} × ${
                            Number(
                              item.quantity ||
                              0
                            )
                          }`;


                        const sweetness =
                          String(
                            item.sweetness ||
                            ""
                          ).trim();

                        const ice =
                          String(
                            item.ice ||
                            ""
                          ).trim();


                        if (
                          sweetness
                        ) {

                          text +=
                            `｜甜度：${escapeHtml(
                              sweetness
                            )}`;
                        }


                        if (
                          ice
                        ) {

                          text +=
                            `｜冰塊：${escapeHtml(
                              ice
                            )}`;
                        }


                        return text;
                      }
                    )
                    .join(
                      "<br>"
                    );


                /* =========================================
                   購物袋
                   ========================================= */

                if (
                  bag1Count > 0 ||
                  bag2Count > 0
                ) {

                  itemsHtml +=
                    "<br><br><strong>購物袋：</strong>";

                  if (
                    bag1Count > 0
                  ) {
                    itemsHtml +=
                      `<br>1杯袋：${bag1Count} 個`;
                  }

                  if (
                    bag2Count > 0
                  ) {
                    itemsHtml +=
                      `<br>2～8杯袋：${bag2Count} 個`;
                  }
                }


                /* =========================================
                   備註
                   ========================================= */

                if (
                  notes
                ) {

                  itemsHtml +=
                    `<br><br><strong>備註：</strong>${escapeHtml(
                      notes
                    )}`;
                }


                /* =========================================
                   統一編號
                   ========================================= */

                if (
                  invoiceNumber
                ) {

                  itemsHtml +=
                    `<br><strong>統一編號：</strong>${escapeHtml(
                      invoiceNumber
                    )}`;
                }


                return `
<tr>

<td>
  <strong>
    ${escapeHtml(
      orderNumber
    )}
  </strong>
</td>

<td>
  ${escapeHtml(
    createdAt
  )}
</td>

<td>
  ${escapeHtml(
    customerName
  )}
  <br>
  ${escapeHtml(
    customerPhone
  )}
  <br><br>
  <strong>
    取餐時間：
  </strong>
  ${escapeHtml(
    pickupTime ||
    "未填寫"
  )}
</td>

<td>
  ${itemsHtml}
</td>

<td>
  <strong>
    $${total}
  </strong>
</td>

<td>
  ${escapeHtml(
    status
  )}
</td>

</tr>
`;
              }
            )
            .join("");


        const html = `
<!doctype html>

<html
  lang="zh-Hant"
>

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
  藥師的私房紅茶｜訂單管理
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Noto Sans TC",
    sans-serif;

  margin: 0;

  background:
    #f5f6f8;

  color:
    #2b211d;
}

main {

  max-width:
    1500px;

  margin:
    30px auto;

  padding:
    0 20px;
}

h1 {

  color:
    #8f2f27;

  font-size:
    28px;

  margin-bottom:
    24px;
}

.info {

  background:
    white;

  border-radius:
    16px;

  padding:
    16px;

  margin-bottom:
    20px;

  box-shadow:
    0 2px 10px
    rgba(0,0,0,.05);
}

.table-wrap {

  width: 100%;

  overflow-x:
    auto;

  background:
    white;

  border-radius:
    16px;

  box-shadow:
    0 2px 10px
    rgba(0,0,0,.05);
}

table {

  width:
    100%;

  min-width:
    1100px;

  border-collapse:
    collapse;
}

th,
td {

  padding:
    16px;

  border-bottom:
    1px solid #eee;

  text-align:
    left;

  vertical-align:
    top;
}

th {

  background:
    #eee4d8;

  color:
    #5b3028;

  white-space:
    nowrap;
}

tr:hover td {

  background:
    #fffaf5;
}

.status {

  display:
    inline-block;

  padding:
    5px 10px;

  border-radius:
    999px;

  background:
    #eee4d8;
}

.empty {

  padding:
    40px;

  text-align:
    center;
}

</style>

</head>

<body>

<main>

<h1>
  藥師的私房紅茶｜訂單管理
</h1>

<div class="info">

  <strong>
    訂單數量：
  </strong>

  ${orders.length}

  筆

  <br>

  <small>
    資料來源：
    ${
      hasSupabaseConfig()
        ? "Supabase"
        : "本機備份"
    }
  </small>

</div>

<div class="table-wrap">

<table>

<thead>

<tr>

<th>
  訂單
</th>

<th>
  建立時間
</th>

<th>
  客人
</th>

<th>
  訂購內容
</th>

<th>
  總額
</th>

<th>
  狀態
</th>

</tr>

</thead>

<tbody>

${
  rows ||
  `
<tr>
<td
  colspan="6"
  class="empty"
>
  目前沒有訂單
</td>
</tr>
`
}

</tbody>

</table>

</div>

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

      if (
        req.method === "GET"
      ) {

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
          (
            err,
            stat
          ) => {

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
              path.extname(
                file
              ).toLowerCase();


            const types = {

              ".html":
                "text/html; charset=utf-8",

              ".css":
                "text/css; charset=utf-8",

              ".js":
                "text/javascript; charset=utf-8",

              ".json":
                "application/json; charset=utf-8",

              ".svg":
                "image/svg+xml",

              ".jpg":
                "image/jpeg",

              ".jpeg":
                "image/jpeg",

              ".png":
                "image/png",

              ".webp":
                "image/webp",

              ".ico":
                "image/x-icon"
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
        "Not Found",
        "text/plain; charset=utf-8"
      );

    }
  );


/* =========================================================
   啟動
   ========================================================= */

server.listen(
  PORT,
  () => {

    console.log(
      `Tea House ordering system running on port ${PORT}`
    );

    console.log(
      `Supabase enabled: ${hasSupabaseConfig()}`
    );

    console.log(
      `Telegram enabled: ${Boolean(
        process.env.TELEGRAM_BOT_TOKEN &&
        process.env.TELEGRAM_CHAT_ID
      )}`
    );
  }
);
