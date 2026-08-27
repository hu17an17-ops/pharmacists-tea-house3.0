const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

/* =========================================================
   基本設定
   ========================================================= */

const PORT = Number(process.env.PORT || 3000);

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");

const ORDERS_FILE = path.join(
  DATA_DIR,
  "orders.json"
);

const LINE_CUSTOMERS_FILE = path.join(
  DATA_DIR,
  "line-customers.json"
);

fs.mkdirSync(
  DATA_DIR,
  { recursive: true }
);

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(
    ORDERS_FILE,
    "[]",
    "utf8"
  );
}

if (!fs.existsSync(LINE_CUSTOMERS_FILE)) {
  fs.writeFileSync(
    LINE_CUSTOMERS_FILE,
    "[]",
    "utf8"
  );
}

/* =========================================================
   Environment
   ========================================================= */

function env(name) {
  return String(
    process.env[name] || ""
  ).trim();
}

const SUPABASE_URL = () =>
  env("SUPABASE_URL").replace(
    /\/+$/,
    ""
  );

const SUPABASE_KEY = () =>
  env("SUPABASE_SERVICE_ROLE_KEY") ||
  env("SUPABASE_ANON_KEY");

const ADMIN_KEY = () =>
  env("ADMIN_KEY") ||
  "change-me";

const LINE_LOGIN_CHANNEL_ID = () =>
  env("LINE_LOGIN_CHANNEL_ID");

const LINE_LOGIN_CHANNEL_SECRET = () =>
  env("LINE_LOGIN_CHANNEL_SECRET");

const LINE_LOGIN_CALLBACK_URL = () =>
  env("LINE_LOGIN_CALLBACK_URL");

const LINE_CHANNEL_ACCESS_TOKEN = () =>
  env("LINE_CHANNEL_ACCESS_TOKEN");

const LINE_ADMIN_USER_ID = () =>
  env("LINE_ADMIN_USER_ID");

const LINE_SESSION_SECRET = () =>
  env("LINE_SESSION_SECRET") ||
  ADMIN_KEY();

function hasSupabase() {
  return Boolean(
    SUPABASE_URL() &&
    SUPABASE_KEY()
  );
}

function lineLoginConfigured() {
  return Boolean(
    LINE_LOGIN_CHANNEL_ID() &&
    LINE_LOGIN_CHANNEL_SECRET() &&
    LINE_LOGIN_CALLBACK_URL()
  );
}

function lineMessagingConfigured() {
  return Boolean(
    LINE_CHANNEL_ACCESS_TOKEN() &&
    LINE_ADMIN_USER_ID()
  );
}

/* =========================================================
   JSON / File helpers
   ========================================================= */

function readJsonFile(
  filename,
  fallback
) {
  try {
    const text =
      fs.readFileSync(
        filename,
        "utf8"
      );

    const value =
      JSON.parse(text);

    return value;
  } catch {
    return fallback;
  }
}

function writeJsonFile(
  filename,
  value
) {
  fs.writeFileSync(
    filename,
    JSON.stringify(
      value,
      null,
      2
    ),
    "utf8"
  );
}

/* =========================================================
   Orders
   ========================================================= */

function readOrders() {
  const orders =
    readJsonFile(
      ORDERS_FILE,
      []
    );

  return Array.isArray(orders)
    ? orders
    : [];
}

function writeOrders(
  orders
) {
  writeJsonFile(
    ORDERS_FILE,
    orders
  );
}

/* =========================================================
   LINE Customers
   ========================================================= */

function readLineCustomers() {
  const customers =
    readJsonFile(
      LINE_CUSTOMERS_FILE,
      []
    );

  return Array.isArray(
    customers
  )
    ? customers
    : [];
}

function writeLineCustomers(
  customers
) {
  writeJsonFile(
    LINE_CUSTOMERS_FILE,
    customers
  );
}

function findLineCustomer(
  lineUserId
) {
  if (!lineUserId) {
    return null;
  }

  const customers =
    readLineCustomers();

  return (
    customers.find(
      customer =>
        String(
          customer.lineUserId || ""
        ) ===
        String(lineUserId)
    ) ||
    null
  );
}

function saveLineCustomer(
  customer
) {
  if (
    !customer ||
    !customer.lineUserId
  ) {
    return;
  }

  const customers =
    readLineCustomers();

  const index =
    customers.findIndex(
      item =>
        String(
          item.lineUserId || ""
        ) ===
        String(
          customer.lineUserId
        )
    );

  const value = {
    ...customer,
    updatedAt:
      new Date().toISOString()
  };

  if (index >= 0) {
    customers[index] = {
      ...customers[index],
      ...value
    };
  } else {
    customers.push(value);
  }

  writeLineCustomers(
    customers
  );
}

/* =========================================================
   Supabase
   ========================================================= */

async function supabase(
  endpoint,
  options = {}
) {
  if (!hasSupabase()) {
    throw new Error(
      "沒有設定 Supabase 環境變數"
    );
  }

  const response =
    await fetch(
      `${SUPABASE_URL()}/rest/v1/${endpoint}`,
      {
        method:
          options.method ||
          "GET",

        headers: {
          apikey:
            SUPABASE_KEY(),

          Authorization:
            `Bearer ${SUPABASE_KEY()}`,

          "Content-Type":
            "application/json",

          Prefer:
            options.prefer ||
            "return=representation"
        },

        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(
                options.body
              )
      }
    );

  const text =
    await response.text();

  let data;

  try {
    data =
      text
        ? JSON.parse(text)
        : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase ${response.status}: ${
        data?.message ||
        data?.error ||
        text
      }`
    );
  }

  return data;
}

/* =========================================================
   HTTP helpers
   ========================================================= */

function send(
  res,
  status,
  data,
  contentType =
    "application/json; charset=utf-8"
) {
  res.writeHead(
    status,
    {
      "Content-Type":
        contentType,

      "Cache-Control":
        "no-store",

      "Access-Control-Allow-Origin":
        "*",

      "Access-Control-Allow-Methods":
        "GET,POST,PUT,DELETE,OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type, X-Admin-Key"
    }
  );

  if (
    typeof data ===
    "string"
  ) {
    res.end(data);
  } else {
    res.end(
      JSON.stringify(data)
    );
  }
}

function redirect(
  res,
  location
) {
  res.writeHead(
    302,
    {
      Location:
        location
    }
  );

  res.end();
}

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
            2 * 1024 * 1024
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
          } catch {
            reject(
              new Error(
                "JSON 格式錯誤"
              )
            );
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

function esc(value) {
  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char])
  );
}

function num(value) {
  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : 0;
}

/* =========================================================
   Cookie
   ========================================================= */

function parseCookies(req) {
  const header =
    String(
      req.headers.cookie || ""
    );

  const cookies = {};

  for (
    const part of
    header.split(";")
  ) {
    const index =
      part.indexOf("=");

    if (index < 0) {
      continue;
    }

    const key =
      part
        .slice(0, index)
        .trim();

    const value =
      part
        .slice(index + 1)
        .trim();

    if (!key) {
      continue;
    }

    try {
      cookies[key] =
        decodeURIComponent(
          value
        );
    } catch {
      cookies[key] =
        value;
    }
  }

  return cookies;
}

function cookieValue(
  value
) {
  return encodeURIComponent(
    String(
      value ?? ""
    )
  );
}

/* =========================================================
   LINE Session
   ========================================================= */

function createLineSession(
  userId
) {
  const issuedAt =
    Math.floor(
      Date.now() / 1000
    );

  const raw =
    `${userId}.${issuedAt}`;

  const signature =
    crypto
      .createHmac(
        "sha256",
        LINE_SESSION_SECRET()
      )
      .update(raw)
      .digest("base64url");

  return (
    `${raw}.${signature}`
  );
}

function verifyLineSession(
  value
) {
  const raw =
    String(value || "");

  const parts =
    raw.split(".");

  if (
    parts.length !== 3
  ) {
    return "";
  }

  const userId =
    parts[0];

  const issuedAt =
    Number(parts[1]);

  const signature =
    parts[2];

  if (
    !userId ||
    !Number.isFinite(
      issuedAt
    ) ||
    !signature
  ) {
    return "";
  }

  const expected =
    crypto
      .createHmac(
        "sha256",
        LINE_SESSION_SECRET()
      )
      .update(
        `${userId}.${issuedAt}`
      )
      .digest("base64url");

  if (
    expected.length !==
    signature.length
  ) {
    return "";
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(
        expected
      ),
      Buffer.from(
        signature
      )
    )
  ) {
    return "";
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );

  const maxAge =
    60 * 60 * 24 * 30;

  if (
    Math.abs(
      now - issuedAt
    ) > maxAge
  ) {
    return "";
  }

  return userId;
}

function getLineUserId(
  req
) {
  const cookies =
    parseCookies(req);

  return verifyLineSession(
    cookies.line_session
  );
}

function setLineSession(
  res,
  userId
) {
  const session =
    createLineSession(
      userId
    );

  res.setHeader(
    "Set-Cookie",
    `line_session=${cookieValue(
      session
    )}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`
  );
}

function clearLineSession(
  res
) {
  res.setHeader(
    "Set-Cookie",
    "line_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax"
  );
}

/* =========================================================
   LINE OAuth state
   ========================================================= */

function safeReturnPath(
  value
) {
  const raw =
    String(
      value || "/"
    ).trim();

  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\")
  ) {
    return "/";
  }

  return raw;
}

/* =========================================================
   LINE Login Token
   ========================================================= */

async function exchangeLineCode(
  code
) {
  const params =
    new URLSearchParams();

  params.set(
    "grant_type",
    "authorization_code"
  );

  params.set(
    "code",
    code
  );

  params.set(
    "redirect_uri",
    LINE_LOGIN_CALLBACK_URL()
  );

  params.set(
    "client_id",
    LINE_LOGIN_CHANNEL_ID()
  );

  params.set(
    "client_secret",
    LINE_LOGIN_CHANNEL_SECRET()
  );

  const response =
    await fetch(
      "https://api.line.me/oauth2/v2.1/token",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body:
          params.toString()
      }
    );

  const text =
    await response.text();

  let data = {};

  try {
    data =
      text
        ? JSON.parse(
            text
          )
        : {};
  } catch {}

  if (
    !response.ok
  ) {
    throw new Error(
      data.error_description ||
      data.error ||
      `LINE Token ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   LINE Profile
   ========================================================= */

async function getLineProfile(
  accessToken
) {
  const response =
    await fetch(
      "https://api.line.me/v2/profile",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

  const text =
    await response.text();

  let data = {};

  try {
    data =
      text
        ? JSON.parse(
            text
          )
        : {};
  } catch {}

  if (
    !response.ok
  ) {
    throw new Error(
      data.message ||
      `LINE Profile ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   LINE Messaging API
   ========================================================= */

async function linePushText(
  userId,
  text
) {
  if (
    !LINE_CHANNEL_ACCESS_TOKEN()
  ) {
    throw new Error(
      "沒有設定 LINE_CHANNEL_ACCESS_TOKEN"
    );
  }

  const response =
    await fetch(
      "https://api.line.me/v2/bot/message/push",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${LINE_CHANNEL_ACCESS_TOKEN()}`,

          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            to:
              userId,

            messages: [
              {
                type:
                  "text",

                text:
                  String(
                    text
                  ).slice(
                    0,
                    5000
                  )
              }
            ]
          })
      }
    );

  const textBody =
    await response.text();

  if (
    !response.ok
  ) {
    let data = {};

    try {
      data =
        textBody
          ? JSON.parse(
              textBody
            )
          : {};
    } catch {}

    throw new Error(
      data.message ||
      `LINE Push ${response.status}`
    );
  }
}
/* =========================================================
   LINE 新訂單完整通知
   ========================================================= */

async function notifyLineNewOrder(
  order
) {
  if (
    !LINE_ADMIN_USER_ID() ||
    !LINE_CHANNEL_ACCESS_TOKEN()
  ) {
    throw new Error(
      "LINE 官方通知尚未完成設定"
    );
  }

  const lines = [];

  lines.push(
    "🔔 新訂單通知",
    "",
    `訂單編號：${order.id}`,
    `客人姓名：${order.customer.name}`,
    `客人電話：${order.customer.phone}`,
    `取餐時間：${order.customer.pickupDateTime}`
  );

  lines.push(
    "",
    "【訂購內容】"
  );

  for (
    const item of order.items
  ) {
    let text =
      `${item.name} × ${item.quantity}`;

    if (
      String(
        item.sweetness || ""
      ).trim()
    ) {
      text +=
        `｜甜度：${item.sweetness}`;
    }

    if (
      String(
        item.ice || ""
      ).trim()
    ) {
      text +=
        `｜冰塊：${item.ice}`;
    }

    if (
      number(
        item.price
      ) > 0
    ) {
      text +=
        `｜$${number(
          item.price
        )}`;
    }

    lines.push(text);
  }

  if (
    number(
      order.bag1Count
    ) > 0 ||
    number(
      order.bag2Count
    ) > 0
  ) {
    lines.push(
      "",
      "【購物袋】"
    );

    if (
      number(
        order.bag1Count
      ) > 0
    ) {
      lines.push(
        `1 杯袋 × ${number(
          order.bag1Count
        )}`
      );
    }

    if (
      number(
        order.bag2Count
      ) > 0
    ) {
      lines.push(
        `2～8 杯袋 × ${number(
          order.bag2Count
        )}`
      );
    }
  }

  if (
    String(
      order.customer.note || ""
    ).trim()
  ) {
    lines.push(
      "",
      `備註：${order.customer.note}`
    );
  }

  if (
    String(
      order.customer.invoiceNumber || ""
    ).trim()
  ) {
    lines.push(
      `統一編號：${order.customer.invoiceNumber}`
    );
  }

  lines.push(
    "",
    `💰 訂單總額：$${number(
      order.total
    )}`,
    "",
    "💵 付款方式：現金"
  );

  if (
    order.lineUserId
  ) {
    lines.push(
      "",
      "🟢 LINE 已綁定",
      `LINE User ID：${order.lineUserId}`
    );
  }

  await linePushText(
    LINE_ADMIN_USER_ID(),
    lines.join("\n")
  );
}


/* =========================================================
   訂單編號
   ========================================================= */

function makeOrderId(
  orderNumber
) {
  const n =
    Math.floor(
      number(
        orderNumber
      )
    );

  if (
    !n
  ) {
    return "";
  }

  const encoded =
    n.toString(36)
      .toUpperCase();

  const suffix =
    crypto
      .createHash(
        "sha256"
      )
      .update(
        String(n)
      )
      .digest("hex")
      .slice(
        0,
        6
      )
      .toUpperCase();

  return (
    `T${encoded}${suffix}`
  );
}

function resolveOrderNumber(
  value
) {
  const raw =
    String(
      value ?? ""
    )
      .trim()
      .toUpperCase();

  if (
    /^\d+$/.test(raw)
  ) {
    return Math.floor(
      number(raw)
    );
  }

  if (
    !/^T[A-Z0-9]+$/.test(
      raw
    ) ||
    raw.length < 8
  ) {
    return 0;
  }

  const encoded =
    raw.slice(
      1,
      -6
    );

  const n =
    parseInt(
      encoded,
      36
    );

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return 0;
  }

  return (
    makeOrderId(n) === raw
      ? n
      : 0
  );
}


/* =========================================================
   訂單資料整理
   ========================================================= */

function normalizeItems(
  items
) {
  if (
    !Array.isArray(
      items
    )
  ) {
    return [];
  }

  return items
    .map(
      item => {

        const quantity =
          Math.max(
            0,
            Math.floor(
              number(
                item.quantity
              )
            )
          );

        const price =
          Math.max(
            0,
            number(
              item.price
            )
          );

        return {
          name:
            String(
              item.name ||
              ""
            )
              .trim()
              .slice(
                0,
                200
              ),

          quantity,

          price,

          sweetness:
            String(
              item.sweetness ||
              ""
            )
              .trim()
              .slice(
                0,
                50
              ),

          ice:
            String(
              item.ice ||
              ""
            )
              .trim()
              .slice(
                0,
                50
              )
        };
      }
    )
    .filter(
      item =>
        item.name &&
        item.quantity > 0
    );
}


/* =========================================================
   建立訂單
   ========================================================= */

async function createOrder(
  data,
  lineUserId
) {
  const customer =
    data.customer ||
    {};

  const name =
    String(
      customer.name ||
      data.customer_name ||
      ""
    )
      .trim()
      .slice(
        0,
        100
      );

  const phone =
    String(
      customer.phone ||
      data.customer_phone ||
      ""
    )
      .trim()
      .slice(
        0,
        50
      );

  const pickupDateTime =
    String(
      customer.pickupDateTime ||
      customer.pickup_time ||
      data.pickupDateTime ||
      data.pickup_time ||
      ""
    )
      .trim()
      .slice(
        0,
        100
      );

  const invoiceNumber =
    String(
      customer.invoiceNumber ||
      customer.invoice_number ||
      data.invoiceNumber ||
      data.invoice_number ||
      ""
    )
      .trim()
      .slice(
        0,
        30
      );

  const note =
    String(
      customer.note ||
      customer.notes ||
      data.note ||
      data.notes ||
      ""
    )
      .trim()
      .slice(
        0,
        1000
      );

  const items =
    normalizeItems(
      data.items
    );

  const bag1Count =
    Math.max(
      0,
      Math.floor(
        number(
          data.bag1Count ??
          data.bag_1_count
        )
      )
    );

  const bag2Count =
    Math.max(
      0,
      Math.floor(
        number(
          data.bag2Count ??
          data.bag_2_count
        )
      )
    );

  if (
    !name
  ) {
    throw new Error(
      "請填寫姓名"
    );
  }

  if (
    !phone
  ) {
    throw new Error(
      "請填寫電話"
    );
  }

  if (
    !pickupDateTime
  ) {
    throw new Error(
      "請選擇取餐時間"
    );
  }

  if (
    !items.length
  ) {
    throw new Error(
      "請至少選擇一項商品"
    );
  }

  const itemsTotal =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          item.price *
          item.quantity
        ),
      0
    );

  const total =
    itemsTotal +
    bag1Count +
    bag2Count * 2;

  const orderNumber =
    Date.now();

  const id =
    makeOrderId(
      orderNumber
    );

  const lineCustomer =
    findLineCustomer(
      lineUserId
    );

  const lineDisplayName =
    lineCustomer?.displayName ||
    lineCustomer?.lineDisplayName ||
    "";

  const order = {
    id,

    orderNumber,

    createdAt:
      new Date()
        .toISOString(),

    status:
      "new",

    lineUserId,

    lineDisplayName,

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

  /* -------------------------------------------------------
     Supabase
     ------------------------------------------------------- */

  if (
    hasSupabase()
  ) {
    await supabase(
      "orders",
      {
        method:
          "POST",

        body: {
          order_number:
            orderNumber,

          line_user_id:
            lineUserId,

          line_display_name:
            lineDisplayName ||
            null,

          customer_name:
            name,

          customer_phone:
            phone,

          items,

          total_amount:
            Math.round(
              total
            ),

          invoice_number:
            invoiceNumber ||
            null,

          bag1_count:
            bag1Count,

          bag2_count:
            bag2Count,

          pickup_time:
            pickupDateTime,

          notes:
            note ||
            null,

          order_status:
            "new"
        }
      }
    );
  }

  /* -------------------------------------------------------
     本機備份
     ------------------------------------------------------- */

  const orders =
    readOrders();

  orders.unshift(
    order
  );

  writeOrders(
    orders
  );

  /* -------------------------------------------------------
     LINE 官方帳號新訂單通知
     ------------------------------------------------------- */

  try {
    await notifyLineNewOrder(
      order
    );
  } catch (
    error
  ) {
    console.error(
      "LINE 新訂單通知失敗：",
      error
    );
  }

  return order;
}


/* =========================================================
   取得所有訂單
   ========================================================= */

async function getAllOrders() {

  if (
    hasSupabase()
  ) {

    const rows =
      await supabase(
        "orders?select=*&order=created_at.desc&limit=500"
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  }

  return readOrders();
}


/* =========================================================
   取得單筆訂單
   ========================================================= */

async function getOrderByNumber(
  value
) {

  const orderNumber =
    resolveOrderNumber(
      value
    );

  if (
    !orderNumber
  ) {
    return null;
  }

  if (
    hasSupabase()
  ) {

    const rows =
      await supabase(
        `orders?select=*&order_number=eq.${encodeURIComponent(
          orderNumber
        )}&limit=1`
      );

    return (
      Array.isArray(
        rows
      ) &&
      rows.length
    )
      ? rows[0]
      : null;
  }

  const orders =
    readOrders();

  return (
    orders.find(
      order =>
        number(
          order.orderNumber
        ) ===
        orderNumber
    ) ||
    null
  );
}


/* =========================================================
   修改訂單狀態
   ========================================================= */

async function updateOrderStatus(
  value,
  status
) {

  const orderNumber =
    resolveOrderNumber(
      value
    );

  if (
    !orderNumber
  ) {
    throw new Error(
      "訂單編號錯誤"
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

  if (
    !allowedStatuses.includes(
      status
    )
  ) {
    throw new Error(
      "訂單狀態錯誤"
    );
  }

  if (
    hasSupabase()
  ) {

    const rows =
      await supabase(
        `orders?order_number=eq.${encodeURIComponent(
          orderNumber
        )}`,
        {
          method:
            "PATCH",

          body: {
            order_status:
              status
          }
        }
      );

    return (
      Array.isArray(
        rows
      )
        ? rows[0]
        : null
    );
  }

  const orders =
    readOrders();

  const index =
    orders.findIndex(
      order =>
        number(
          order.orderNumber
        ) ===
        orderNumber
    );

  if (
    index < 0
  ) {
    return null;
  }

  orders[index].status =
    status;

  writeOrders(
    orders
  );

  return orders[index];
}


/* =========================================================
   刪除訂單
   ========================================================= */

async function deleteOrder(
  value
) {

  const orderNumber =
    resolveOrderNumber(
      value
    );

  if (
    !orderNumber
  ) {
    throw new Error(
      "訂單編號錯誤"
    );
  }

  if (
    hasSupabase()
  ) {

    return await supabase(
      `orders?order_number=eq.${encodeURIComponent(
        orderNumber
      )}`,
      {
        method:
          "DELETE",

        prefer:
          "return=representation"
      }
    );
  }

  const orders =
    readOrders();

  const remaining =
    orders.filter(
      order =>
        number(
          order.orderNumber
        ) !==
        orderNumber
    );

  writeOrders(
    remaining
  );

  return [];
}


/* =========================================================
   管理員驗證
   ========================================================= */

function isAdmin(
  req,
  url
) {

  const headerKey =
    String(
      req.headers[
        "x-admin-key"
      ] ||
      ""
    ).trim();

  const queryKey =
    String(
      url.searchParams.get(
        "key"
      ) ||
      ""
    ).trim();

  const key =
    headerKey ||
    queryKey;

  return (
    Boolean(
      key
    ) &&
    key ===
      ADMIN_KEY()
  );
}


/* =========================================================
   MIME
   ========================================================= */

function getMimeType(
  filename
) {

  const ext =
    path.extname(
      filename
    ).toLowerCase();

  const types = {

    ".html":
      "text/html; charset=utf-8",

    ".htm":
      "text/html; charset=utf-8",

    ".js":
      "application/javascript; charset=utf-8",

    ".css":
      "text/css; charset=utf-8",

    ".json":
      "application/json; charset=utf-8",

    ".png":
      "image/png",

    ".jpg":
      "image/jpeg",

    ".jpeg":
      "image/jpeg",

    ".gif":
      "image/gif",

    ".svg":
      "image/svg+xml",

    ".webp":
      "image/webp",

    ".ico":
      "image/x-icon",

    ".txt":
      "text/plain; charset=utf-8"

  };

  return (
    types[ext] ||
    "application/octet-stream"
  );
}


/* =========================================================
   靜態檔案
   ========================================================= */

function serveStatic(
  req,
  res,
  url
) {

  let pathname =
    decodeURIComponent(
      url.pathname
    );

  if (
    pathname === "/"
  ) {
    pathname =
      "/index.html";
  }

  const relative =
    pathname
      .replace(
        /^\/+/,
        ""
      );

  const filePath =
    path.resolve(
      PUBLIC_DIR,
      relative
    );

  const publicRoot =
    path.resolve(
      PUBLIC_DIR
    );

  if (
    filePath !==
      publicRoot &&
    !filePath.startsWith(
      publicRoot +
      path.sep
    )
  ) {

    return send(
      res,
      403,
      {
        ok: false,
        message:
          "Forbidden"
      }
    );
  }

  fs.stat(
    filePath,
    (
      error,
      stat
    ) => {

      if (
        error ||
        !stat.isFile()
      ) {

        return send(
          res,
          404,
          {
            ok: false,
            message:
              "找不到頁面"
          }
        );
      }

      res.writeHead(
        200,
        {
          "Content-Type":
            getMimeType(
              filePath
            ),

          "Cache-Control":
            "no-cache"
        }
      );

      fs.createReadStream(
        filePath
      ).pipe(
        res
      );
    }
  );
}
/* =========================================================
   Server
   ========================================================= */

const server =
  http.createServer(
    async (
      req,
      res
    ) => {

      try {

        const u =
          new URL(
            req.url ||
              "/",
            `http://${req.headers.host || "localhost"}`
          );

        /* ---------------------------------------------------
           CORS / OPTIONS
           --------------------------------------------------- */

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
                "GET,POST,PUT,DELETE,OPTIONS",

              "Access-Control-Allow-Headers":
                "Content-Type, X-Admin-Key",

              "Access-Control-Max-Age":
                "86400"
            }
          );

          return res.end();
        }


        /* ===================================================
           Health
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname ===
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
                hasSupabase(),

              lineLogin:
                lineLoginConfigured(),

              lineMessaging:
                lineMessagingConfigured(),

              telegram:
                false
            }
          );
        }


        /* ===================================================
           LINE Login
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname ===
            "/api/line/login"
        ) {

          if (
            !lineLoginConfigured()
          ) {

            return send(
              res,
              503,
              {
                ok: false,

                code:
                  "LINE_LOGIN_NOT_CONFIGURED",

                message:
                  "LINE 綁定功能尚未完成設定，請聯絡店家。"
              }
            );
          }

          const returnPath =
            safeReturnPath(
              u.searchParams.get(
                "return"
              ) ||
              "/"
            );

          const state =
            crypto
              .randomBytes(
                32
              )
              .toString(
                "base64url"
              );

          res.setHeader(
            "Set-Cookie",
            [
              `line_oauth_state=${cookieValue(
                state
              )}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`,

              `line_oauth_return=${cookieValue(
                returnPath
              )}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
            ]
          );

          const params =
            new URLSearchParams();

          params.set(
            "response_type",
            "code"
          );

          params.set(
            "client_id",
            LINE_LOGIN_CHANNEL_ID()
          );

          params.set(
            "redirect_uri",
            LINE_LOGIN_CALLBACK_URL()
          );

          params.set(
            "state",
            state
          );

          params.set(
            "scope",
            "profile openid"
          );

          const loginUrl =
            "https://access.line.me/oauth2/v2.1/authorize?" +
            params.toString();

          return redirect(
            res,
            loginUrl
          );
        }


        /* ===================================================
           LINE Callback
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname ===
            "/api/line/callback"
        ) {

          const cookies =
            parseCookies(
              req
            );

          const savedState =
            String(
              cookies.line_oauth_state ||
                ""
            );

          const state =
            String(
              u.searchParams.get(
                "state"
              ) ||
                ""
            );

          if (
            !savedState ||
            !state ||
            savedState !== state
          ) {

            return send(
              res,
              400,
              {
                ok: false,

                message:
                  "LINE 綁定驗證失敗，請重新操作。"
              }
            );
          }

          const code =
            String(
              u.searchParams.get(
                "code"
              ) ||
                ""
            ).trim();

          if (
            !code
          ) {

            return send(
              res,
              400,
              {
                ok: false,

                message:
                  "LINE 沒有回傳授權碼。"
              }
            );
          }

          try {

            const token =
              await exchangeLineCode(
                code
              );

            const profile =
              await getLineProfile(
                token.access_token
              );

            const lineUserId =
              String(
                profile.userId ||
                  ""
              ).trim();

            if (
              !lineUserId
            ) {

              throw new Error(
                "LINE User ID 無效"
              );
            }

            saveLineCustomer(
              {
                lineUserId,

                displayName:
                  String(
                    profile.displayName ||
                      ""
                  ),

                pictureUrl:
                  String(
                    profile.pictureUrl ||
                      ""
                  ),

                statusMessage:
                  String(
                    profile.statusMessage ||
                      ""
                  ),

                updatedAt:
                  new Date()
                    .toISOString()
              }
            );

            setLineSession(
              res,
              lineUserId
            );

            res.setHeader(
              "Set-Cookie",
              [
                "line_oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax",

                "line_oauth_return=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax"
              ]
            );

            const returnPath =
              safeReturnPath(
                cookies.line_oauth_return ||
                  "/"
              );

            return redirect(
              res,
              returnPath
            );

          } catch (
            error
          ) {

            console.error(
              "LINE Callback Error:",
              error
            );

            return send(
              res,
              500,
              {
                ok: false,

                message:
                  "LINE 綁定失敗，請重新操作。"
              }
            );
          }
        }


        /* ===================================================
           LINE 狀態
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname ===
            "/api/line/status"
        ) {

          const lineUserId =
            getLineUserId(
              req
            );

          const customer =
            lineUserId
              ? findLineCustomer(
                  lineUserId
                )
              : null;

          return send(
            res,
            200,
            {
              ok: true,

              bound:
                Boolean(
                  lineUserId
                ),

              lineUserId:
                lineUserId ||
                null,

              displayName:
                customer?.displayName ||
                "",

              name:
                customer?.name ||
                "",

              phone:
                customer?.phone ||
                ""
            }
          );
        }


        /* ===================================================
           LINE 我的資料
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname ===
            "/api/line/me"
        ) {

          const lineUserId =
            getLineUserId(
              req
            );

          if (
            !lineUserId
          ) {

            return send(
              res,
              401,
              {
                ok: false,

                code:
                  "LINE_BINDING_REQUIRED",

                message:
                  "請先綁定 LINE。"
              }
            );
          }

          const customer =
            findLineCustomer(
              lineUserId
            );

          return send(
            res,
            200,
            {
              ok: true,

              lineUserId,

              customer:
                customer ||
                {
                  lineUserId
                }
            }
          );
        }


        /* ===================================================
           LINE 登出
           =================================================== */

        if (
          req.method === "POST" &&
          u.pathname ===
            "/api/line/logout"
        ) {

          clearLineSession(
            res
          );

          return send(
            res,
            200,
            {
              ok: true
            }
          );
        }


        /* ===================================================
           儲存 LINE 客人資料
           =================================================== */

        if (
          req.method === "POST" &&
          u.pathname ===
            "/api/line/customer"
        ) {

          const lineUserId =
            getLineUserId(
              req
            );

          if (
            !lineUserId
          ) {

            return send(
              res,
              401,
              {
                ok: false,

                code:
                  "LINE_BINDING_REQUIRED",

                message:
                  "請先綁定 LINE。"
              }
            );
          }

          let body;

          try {

            body =
              await parseBody(
                req
              );

          } catch {

            return send(
              res,
              400,
              {
                ok: false,

                message:
                  "資料格式錯誤。"
              }
            );
          }

          const existing =
            findLineCustomer(
              lineUserId
            ) ||
            {};

          const customer = {

            ...existing,

            lineUserId,

            name:
              String(
                body.name ||
                  existing.name ||
                  ""
              )
                .trim()
                .slice(
                  0,
                  100
                ),

            phone:
              String(
                body.phone ||
                  existing.phone ||
                  ""
              )
                .trim()
                .slice(
                  0,
                  50
                ),

            updatedAt:
              new Date()
                .toISOString()
          };

          saveLineCustomer(
            customer
          );

          return send(
            res,
            200,
            {
              ok: true,

              customer
            }
          );
        }


        /* ===================================================
           建立訂單
           =================================================== */

        if (
          req.method === "POST" &&
          u.pathname ===
            "/api/orders"
        ) {

          /*
           * 非常重要：
           *
           * 不接受前端自己傳來的 lineUserId
           * 作為綁定證明。
           *
           * 必須由 HttpOnly LINE Session
           * 驗證客人真的已經綁定 LINE。
           */

          const lineUserId =
            getLineUserId(
              req
            );

          if (
            !lineUserId
          ) {

            return send(
              res,
              401,
              {
                ok: false,

                code:
                  "LINE_BINDING_REQUIRED",

                message:
                  "請先綁定 LINE，才能完成下單。"
              }
            );
          }

          let body;

          try {

            body =
              await parseBody(
                req
              );

          } catch {

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

          try {

            const order =
              await createOrder(
                body,
                lineUserId
              );

            return send(
              res,
              201,
              {
                ok: true,

                orderId:
                  order.id,

                orderNumber:
                  order.orderNumber,

                total:
                  order.total,

                lineBound:
                  true
              }
            );

          } catch (
            error
          ) {

            console.error(
              "建立訂單失敗:",
              error
            );

            return send(
              res,
              500,
              {
                ok: false,

                code:
                  "ORDER_CREATE_FAILED",

                message:
                  error.message ||
                  "訂單建立失敗，請稍後再試。"
              }
            );
          }
        }


        /* ===================================================
           Admin：訂單列表
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname ===
            "/api/admin/orders"
        ) {

          if (
            !isAdmin(
              req,
              u
            )
          ) {

            return send(
              res,
              401,
              {
                ok: false,

                message:
                  "未授權"
              }
            );
          }

          const orders =
            await getAllOrders();

          return send(
            res,
            200,
            {
              ok: true,

              orders
            }
          );
        }


        /* ===================================================
           Admin：單筆訂單
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname.startsWith(
            "/api/admin/orders/"
          )
        ) {

          if (
            !isAdmin(
              req,
              u
            )
          ) {

            return send(
              res,
              401,
              {
                ok: false,

                message:
                  "未授權"
              }
            );
          }

          const value =
            decodeURIComponent(
              u.pathname.slice(
                "/api/admin/orders/"
                  .length
              )
            );

          const order =
            await getOrderByNumber(
              value
            );

          if (
            !order
          ) {

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

              order
            }
          );
        }


        /* ===================================================
           Admin：修改訂單狀態
           =================================================== */

        if (
          req.method === "PUT" &&
          u.pathname.startsWith(
            "/api/admin/orders/"
          ) &&
          u.pathname.endsWith(
            "/status"
          )
        ) {

          if (
            !isAdmin(
              req,
              u
            )
          ) {

            return send(
              res,
              401,
              {
                ok: false,

                message:
                  "未授權"
              }
            );
          }

          const prefix =
            "/api/admin/orders/";

          const suffix =
            "/status";

          const value =
            decodeURIComponent(
              u.pathname.slice(
                prefix.length,
                -suffix.length
              )
            );

          let body;

          try {

            body =
              await parseBody(
                req
              );

          } catch {

            return send(
              res,
              400,
              {
                ok: false,

                message:
                  "資料格式錯誤"
              }
            );
          }

          try {

            const order =
              await updateOrderStatus(
                value,
                String(
                  body.status ||
                    ""
                )
              );

            if (
              !order
            ) {

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

                order
              }
            );

          } catch (
            error
          ) {

            return send(
              res,
              400,
              {
                ok: false,

                message:
                  error.message
              }
            );
          }
        }


        /* ===================================================
           Admin：刪除訂單
           =================================================== */

        if (
          req.method === "DELETE" &&
          u.pathname.startsWith(
            "/api/admin/orders/"
          )
        ) {

          if (
            !isAdmin(
              req,
              u
            )
          ) {

            return send(
              res,
              401,
              {
                ok: false,

                message:
                  "未授權"
              }
            );
          }

          const value =
            decodeURIComponent(
              u.pathname.slice(
                "/api/admin/orders/"
                  .length
              )
            );

          try {

            await deleteOrder(
              value
            );

            return send(
              res,
              200,
              {
                ok: true
              }
            );

          } catch (
            error
          ) {

            return send(
              res,
              400,
              {
                ok: false,

                message:
                  error.message
              }
            );
          }
        }


        /* ===================================================
           Admin：管理頁
           =================================================== */

        if (
          req.method === "GET" &&
          u.pathname ===
            "/admin"
        ) {

          const key =
            u.searchParams.get(
              "key"
            );

          if (
            key &&
            key ===
              ADMIN_KEY()
          ) {

            return send(
              res,
              200,
              adminHtml(),
              "text/html; charset=utf-8"
            );
          }

          return send(
            res,
            401,
            {
              ok: false,

              message:
                "請使用管理員金鑰進入後台。"
            }
          );
        }


        /* ===================================================
           靜態檔案
           =================================================== */

        if (
          req.method === "GET"
        ) {

          return serveStatic(
            req,
            res,
            u
          );
        }


        /* ===================================================
           Not Found
           =================================================== */

        return send(
          res,
          404,
          {
            ok: false,

            message:
              "找不到 API"
          }
        );

      } catch (
        error
      ) {

        console.error(
          "Server Error:",
          error
        );

        return send(
          res,
          500,
          {
            ok: false,

            message:
              "伺服器發生錯誤，請稍後再試。"
          }
        );
      }
    }
  );


/* =========================================================
   Admin HTML
   ========================================================= */

function adminHtml() {

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">

<title>訂單管理</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 20px;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: #f5f5f5;
  color: #222;
}

h1 {
  margin-top: 0;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 9px 14px;
  cursor: pointer;
}

button:hover {
  opacity: .85;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

th,
td {
  border-bottom: 1px solid #ddd;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #eee;
}

.status {
  font-weight: 700;
}

.controls {
  margin-bottom: 15px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
}

@media (
  max-width: 700px
) {

  body {
    padding: 10px;
  }

  table {
    font-size: 13px;
  }

  th,
  td {
    padding: 7px;
  }

}

</style>
</head>

<body>

<h1>訂單管理</h1>

<div class="controls">
  <button
    onclick="loadOrders()">
    重新整理
  </button>
</div>

<div id="app">
  載入中...
</div>

<script>

const params =
  new URLSearchParams(
    location.search
  );

const adminKey =
  params.get("key") || "";

async function loadOrders() {

  const app =
    document.getElementById(
      "app"
    );

  app.innerHTML =
    "載入中...";

  try {

    const response =
      await fetch(
        "/api/admin/orders?key=" +
        encodeURIComponent(
          adminKey
        )
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {

      throw new Error(
        data.message ||
        "載入失敗"
      );
    }

    const orders =
      Array.isArray(
        data.orders
      )
        ? data.orders
        : [];

    if (
      !orders.length
    ) {

      app.innerHTML =
        '<div class="card">目前沒有訂單。</div>';

      return;
    }

    app.innerHTML = \`
      <div class="card">
        <strong>
          共 \${orders.length} 筆訂單
        </strong>
      </div>

      <div style="overflow:auto">

      <table>

        <thead>

          <tr>

            <th>訂單</th>
            <th>客人</th>
            <th>取餐時間</th>
            <th>商品</th>
            <th>金額</th>
            <th>狀態</th>
            <th>操作</th>

          </tr>

        </thead>

        <tbody>

          \${orders.map(
            order => {

              const orderNumber =
                order.order_number ||
                order.orderNumber ||
                "";

              const orderId =
                order.id ||
                "";

              const name =
                order.customer_name ||
                order.customer?.name ||
                "";

              const phone =
                order.customer_phone ||
                order.customer?.phone ||
                "";

              const pickup =
                order.pickup_time ||
                order.customer?.pickupDateTime ||
                "";

              const total =
                order.total_amount ??
                order.total ??
                0;

              const status =
                order.order_status ||
                order.status ||
                "new";

              const items =
                Array.isArray(
                  order.items
                )
                  ? order.items
                  : [];

              return \`
                <tr>

                  <td>
                    <strong>
                      \${escapeHtml(
                        orderId ||
                        orderNumber
                      )}
                    </strong>
                    <br>
                    \${escapeHtml(
                      String(
                        order.created_at ||
                        order.createdAt ||
                        ""
                      )
                    )}
                  </td>

                  <td>
                    \${escapeHtml(
                      name
                    )}
                    <br>
                    \${escapeHtml(
                      phone
                    )}
                  </td>

                  <td>
                    \${escapeHtml(
                      pickup
                    )}
                  </td>

                  <td>
                    \${items.map(
                      item =>
                        escapeHtml(
                          item.name ||
                          ""
                        ) +
                        " × " +
                        Number(
                          item.quantity ||
                          0
                        )
                    ).join("<br>")}
                  </td>

                  <td>
                    $ \${Number(
                      total || 0
                    )}
                  </td>

                  <td class="status">
                    \${escapeHtml(
                      status
                    )}
                  </td>

                  <td>

                    <select
                      onchange="
                        updateStatus(
                          '\${encodeURIComponent(
                            orderNumber ||
                            orderId
                          )}',
                          this.value
                        )
                      ">

                      \${[
                        "new",
                        "confirmed",
                        "preparing",
                        "ready",
                        "completed",
                        "cancelled"
                      ].map(
                        value =>
                          \`
                          <option
                            value="\${value}"
                            \${value === status
                              ? "selected"
                              : ""}>
                            \${value}
                          </option>
                          \`
                      ).join("")}

                    </select>

                    <br><br>

                    <button
                      onclick="
                        deleteOrder(
                          '\${encodeURIComponent(
                            orderNumber ||
                            orderId
                          )}'
                        )
                      ">
                      刪除
                    </button>

                  </td>

                </tr>
              \`;
            }
          ).join("")}

        </tbody>

      </table>

      </div>
    \`;

  } catch (
    error
  ) {

    app.innerHTML =
      \`
      <div class="card">
        載入失敗：
        \${escapeHtml(
          error.message
        )}
      </div>
      \`;

  }

}

async function updateStatus(
  orderNumber,
  status
) {

  try {

    const response =
      await fetch(
        "/api/admin/orders/" +
        orderNumber +
        "/status?key=" +
        encodeURIComponent(
          adminKey
        ),
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              status
            })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {

      throw new Error(
        data.message ||
        "修改失敗"
      );
    }

    await loadOrders();

  } catch (
    error
  ) {

    alert(
      error.message
    );

  }

}

async function deleteOrder(
  orderNumber
) {

  if (
    !confirm(
      "確定要刪除這筆訂單嗎？"
    )
  ) {

    return;

  }

  try {

    const response =
      await fetch(
        "/api/admin/orders/" +
        orderNumber +
        "?key=" +
        encodeURIComponent(
          adminKey
        ),
        {
          method:
            "DELETE"
        }
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {

      throw new Error(
        data.message ||
        "刪除失敗"
      );
    }

    await loadOrders();

  } catch (
    error
  ) {

    alert(
      error.message
    );

  }

}

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char])
  );

}

loadOrders();

</script>

</body>
</html>`;
}


/* =========================================================
   啟動
   ========================================================= */

server.listen(
  PORT,
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "🍵 Pharmacists Tea House"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `http://localhost:${PORT}`
    );

    console.log(
      "======================================"
    );

    console.log(
      "Supabase:",
      hasSupabase()
        ? "ON"
        : "OFF"
    );

    console.log(
      "LINE Login:",
      lineLoginConfigured()
        ? "ON"
        : "OFF"
    );

    console.log(
      "LINE Messaging:",
      lineMessagingConfigured()
        ? "ON"
        : "OFF"
    );

    console.log(
      "Telegram:",
      "OFF"
    );

  }
);
