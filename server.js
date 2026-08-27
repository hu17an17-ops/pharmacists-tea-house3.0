const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { URL } = require('url');


/* =========================================================
   基本設定
   ========================================================= */

const PORT =
  process.env.PORT || 3000;

const PUBLIC_DIR =
  path.join(
    __dirname,
    'public'
  );

const DATA_DIR =
  path.join(
    __dirname,
    'data'
  );

const ORDERS_FILE =
  path.join(
    DATA_DIR,
    'orders.json'
  );


fs.mkdirSync(
  DATA_DIR,
  {
    recursive: true
  }
);


if (
  !fs.existsSync(
    ORDERS_FILE
  )
) {

  fs.writeFileSync(
    ORDERS_FILE,
    '[]',
    'utf8'
  );

}


/* =========================================================
   環境變數
   ========================================================= */

const env =
  n =>
    String(
      process.env[n] || ''
    )
      .trim()
      .replace(
        /\/+$/,
        ''
      );


const SUPABASE_URL =
  () =>
    env(
      'SUPABASE_URL'
    );


const SUPABASE_KEY =
  () =>
    String(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ''
    ).trim();


const hasSupabase =
  () =>
    Boolean(
      SUPABASE_URL() &&
      SUPABASE_KEY()
    );


const adminKey =
  () =>
    String(
      process.env.ADMIN_KEY ||
      'change-me'
    ).trim();


/* =========================================================
   LINE Login
   =========================================================

   注意：

   LINE Login Channel
   與
   Messaging API Channel

   是不同用途。

   LINE Login 必須使用：
   LINE_LOGIN_CHANNEL_ID
   LINE_LOGIN_CHANNEL_SECRET
   LINE_LOGIN_CALLBACK_URL

   ========================================================= */

const LINE_LOGIN_ENV_NOTE =
  true;


/* =========================================================
   Supabase
   ========================================================= */

async function supabase(
  endpoint,
  o = {}
) {

  if (
    !hasSupabase()
  ) {

    throw Error(
      '沒有設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY'
    );

  }


  const r =
    await fetch(
      `${SUPABASE_URL()}/rest/v1/${endpoint}`,
      {

        method:
          o.method ||
          'GET',

        headers: {

          apikey:
            SUPABASE_KEY(),

          Authorization:
            `Bearer ${SUPABASE_KEY()}`,

          'Content-Type':
            'application/json',

          Prefer:
            o.prefer ||
            'return=representation'

        },

        body:
          o.body === undefined
            ? undefined
            : JSON.stringify(
                o.body
              )

      }
    );


  const text =
    await r.text();


  let data =
    null;


  try {

    data =
      text
        ? JSON.parse(
            text
          )
        : null;

  } catch {

    data =
      text;

  }


  if (
    !r.ok
  ) {

    throw Error(
      `Supabase API ${r.status}: ${
        data?.message ||
        data?.error ||
        text
      }`
    );

  }


  return data;

}


/* =========================================================
   本機訂單
   ========================================================= */

function readOrders() {

  try {

    return JSON.parse(
      fs.readFileSync(
        ORDERS_FILE,
        'utf8'
      )
    );

  } catch {

    return [];

  }

}


function writeOrders(
  x
) {

  fs.writeFileSync(
    ORDERS_FILE,
    JSON.stringify(
      x,
      null,
      2
    ),
    'utf8'
  );

}


/* =========================================================
   HTTP Response
   ========================================================= */

function send(
  res,
  status,
  body,
  type =
    'application/json; charset=utf-8'
) {

  res.writeHead(
    status,
    {

      'Content-Type':
        type,

      'Cache-Control':
        'no-store',

      'Access-Control-Allow-Origin':
        '*',

      'Access-Control-Allow-Methods':
        'GET,POST,PUT,DELETE,OPTIONS',

      'Access-Control-Allow-Headers':
        'Content-Type'

    }
  );


  res.end(
    typeof body === 'string'
      ? body
      : JSON.stringify(
          body
        )
  );

}


/* =========================================================
   Request Body
   ========================================================= */

function body(
  req
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      let s = '';


      req.on(
        'data',
        c => {

          s += c;


          if (
            s.length >
            1048576
          ) {

            reject(
              Error(
                'Request body too large'
              )
            );


            req.destroy();

          }

        }
      );


      req.on(
        'end',
        () => {

          try {

            resolve(
              JSON.parse(
                s || '{}'
              )
            );

          } catch (
            e
          ) {

            reject(e);

          }

        }
      );


      req.on(
        'error',
        reject
      );

    }
  );

}


/* =========================================================
   HTML / 文字安全處理
   ========================================================= */

function esc(
  v
) {

  return String(
    v ?? ''
  ).replace(
    /[&<>"']/g,
    c =>
      ({
        '&':
          '&amp;',

        '<':
          '&lt;',

        '>':
          '&gt;',

        '"':
          '&quot;',

        "'":
          '&#39;'

      }[c])
  );

}


/* =========================================================
   數字
   ========================================================= */

function num(
  v
) {

  const n =
    Number(v);


  return Number.isFinite(
    n
  )
    ? n
    : 0;

}


/* =========================================================
   訂單編號
   =========================================================

   客人、後台、LINE
   全部使用同一組訂單編號。

   Supabase 仍然保留數字
   order_number。

   ========================================================= */

function makeOrderId(
  orderNumber
) {

  const n =
    Math.floor(
      num(
        orderNumber
      )
    );


  if (
    !n
  ) {

    return '';

  }


  const prefix =
    n
      .toString(36)
      .toUpperCase();


  const suffix =
    crypto
      .createHash(
        'sha256'
      )
      .update(
        String(n)
      )
      .digest(
        'hex'
      )
      .slice(
        0,
        6
      )
      .toUpperCase();


  return (
    `T${prefix}${suffix}`
  );

}


/* =========================================================
   解析訂單編號
   ========================================================= */

function resolveOrderNumber(
  value
) {

  const raw =
    String(
      value ?? ''
    )
      .trim()
      .toUpperCase();


  if (
    /^\d+$/.test(
      raw
    )
  ) {

    return Math.floor(
      num(
        raw
      )
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
    makeOrderId(n) ===
    raw
  )
    ? n
    : 0;

}


/* =========================================================
   Cookie
   ========================================================= */

function parseCookies(
  req
) {

  const header =
    String(
      req.headers.cookie ||
      ''
    );


  const out = {};


  for (
    const part of
      header.split(';')
  ) {

    const i =
      part.indexOf('=');


    if (
      i < 0
    ) {

      continue;

    }


    const key =
      part
        .slice(
          0,
          i
        )
        .trim();


    const value =
      part
        .slice(
          i + 1
        )
        .trim();


    if (
      key
    ) {

      out[key] =
        decodeURIComponent(
          value
        );

    }

  }


  return out;

}


function cookieValue(
  value
) {

  return encodeURIComponent(
    String(
      value ?? ''
    )
  );

}


/* =========================================================
   LINE Login 設定
   ========================================================= */

function lineLoginConfigured() {

  return Boolean(

    String(
      process.env.LINE_LOGIN_CHANNEL_ID ||
      ''
    ).trim() &&

    String(
      process.env.LINE_LOGIN_CHANNEL_SECRET ||
      ''
    ).trim() &&

    String(
      process.env.LINE_LOGIN_CALLBACK_URL ||
      ''
    ).trim()

  );

}


/* =========================================================
   LINE Messaging API 設定
   ========================================================= */

function lineMessagingConfigured() {

  return Boolean(

    String(
      process.env.LINE_CHANNEL_ACCESS_TOKEN ||
      ''
    ).trim() &&

    String(
      process.env.LINE_ADMIN_USER_ID ||
      ''
    ).trim()

  );

}


/* =========================================================
   LINE Session Secret
   ========================================================= */

function lineSessionSecret() {

  return String(

    process.env.LINE_SESSION_SECRET ||

    process.env.ADMIN_KEY ||

    'change-me'

  ).trim();

}


/* =========================================================
   建立 LINE Session
   ========================================================= */

function signLineSession(
  userId,
  issuedAt =
    Math.floor(
      Date.now() / 1000
    )
) {

  const raw =
    `${userId}.${issuedAt}`;


  const signature =
    crypto
      .createHmac(
        'sha256',
        lineSessionSecret()
      )
      .update(
        raw
      )
      .digest(
        'base64url'
      );


  return (
    `${raw}.${signature}`
  );

}


/* =========================================================
   驗證 LINE Session
   ========================================================= */

function verifyLineSession(
  value
) {

  const raw =
    String(
      value || ''
    );


  const parts =
    raw.split('.');


  if (
    parts.length !== 3
  ) {

    return '';

  }


  const userId =
    parts[0];


  const issuedAt =
    Number(
      parts[1]
    );


  const signature =
    parts[2];


  if (

    !/^U[0-9a-f]{32}$/i.test(
      userId
    ) ||

    !Number.isFinite(
      issuedAt
    ) ||

    !signature

  ) {

    return '';

  }


  const expected =
    crypto
      .createHmac(
        'sha256',
        lineSessionSecret()
      )
      .update(
        `${userId}.${issuedAt}`
      )
      .digest(
        'base64url'
      );


  if (

    expected.length !==
    signature.length ||

    !crypto.timingSafeEqual(
      Buffer.from(
        expected
      ),
      Buffer.from(
        signature
      )
    )

  ) {

    return '';

  }


  const maxAge =
    60 *
    60 *
    24 *
    30;


  if (
    Math.abs(
      Math.floor(
        Date.now() / 1000
      ) -
      issuedAt
    ) >
    maxAge
  ) {

    return '';

  }


  return userId;

}


/* =========================================================
   設定 LINE Session Cookie
   ========================================================= */

function setLineSession(
  res,
  userId
) {

  const value =
    signLineSession(
      userId
    );


  res.setHeader(
    'Set-Cookie',

    `line_session=${cookieValue(value)}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`
  );

}


/* =========================================================
   清除 LINE Session
   ========================================================= */

function clearLineSession(
  res
) {

  res.setHeader(
    'Set-Cookie',

    'line_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'
  );

}


/* =========================================================
   從 Request 取得 LINE User ID
   ========================================================= */

function lineUserIdFromRequest(
  req
) {

  const cookies =
    parseCookies(
      req
    );


  return verifyLineSession(
    cookies.line_session
  );

}


/* =========================================================
   安全 Return Path
   ========================================================= */

function safeReturnPath(
  value
) {

  const raw =
    String(
      value || '/'
    ).trim();


  if (

    !raw ||

    !raw.startsWith('/') ||

    raw.startsWith('//') ||

    raw.includes('\\')

  ) {

    return '/';

  }


  return raw;

}


/* =========================================================
   LINE Login Token
   ========================================================= */

async function lineLoginToken(
  code
) {

  const params =
    new URLSearchParams();


  params.set(
    'grant_type',
    'authorization_code'
  );


  params.set(
    'code',
    code
  );


  params.set(
    'redirect_uri',
    String(
      process.env.LINE_LOGIN_CALLBACK_URL ||
      ''
    ).trim()
  );


  params.set(
    'client_id',
    String(
      process.env.LINE_LOGIN_CHANNEL_ID ||
      ''
    ).trim()
  );


  params.set(
    'client_secret',
    String(
      process.env.LINE_LOGIN_CHANNEL_SECRET ||
      ''
    ).trim()
  );


  const r =
    await fetch(
      'https://api.line.me/oauth2/v2.1/token',
      {

        method:
          'POST',

        headers: {

          'Content-Type':
            'application/x-www-form-urlencoded'

        },

        body:
          params.toString()

      }
    );


  const text =
    await r.text();


  let data;


  try {

    data =
      text
        ? JSON.parse(
            text
          )
        : {};

  } catch {

    data = {
      raw:
        text
    };

  }


  if (
    !r.ok
  ) {

    throw Error(

      data.error_description ||

      data.error ||

      `LINE Login token ${r.status}`

    );

  }


  return data;

}


/* =========================================================
   LINE Profile
   ========================================================= */

async function lineProfile(
  accessToken
) {

  const r =
    await fetch(
      'https://api.line.me/v2/profile',
      {

        headers: {

          Authorization:
            `Bearer ${accessToken}`

        }

      }
    );


  const text =
    await r.text();


  let data;


  try {

    data =
      text
        ? JSON.parse(
            text
          )
        : {};

  } catch {

    data = {
      raw:
        text
    };

  }


  if (
    !r.ok
  ) {

    throw Error(

      data.message ||

      `LINE profile ${r.status}`

    );

  }


  return data;

}


/* =========================================================
   LINE Push Message
   ========================================================= */

async function linePushText(
  userId,
  text
) {

  if (
    !lineMessagingConfigured()
  ) {

    throw Error(
      '沒有設定 LINE_CHANNEL_ACCESS_TOKEN 或 LINE_ADMIN_USER_ID'
    );

  }


  const r =
    await fetch(
      'https://api.line.me/v2/bot/message/push',
      {

        method:
          'POST',

        headers: {

          Authorization:
            `Bearer ${String(
              process.env.LINE_CHANNEL_ACCESS_TOKEN
            ).trim()}`,

          'Content-Type':
            'application/json'

        },

        body:
          JSON.stringify({

            to:
              userId,

            messages: [

              {

                type:
                  'text',

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
    await r.text();


  if (
    !r.ok
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


    throw Error(

      data.message ||

      data.details ||

      `LINE push ${r.status}`

    );

  }

}


/* =========================================================
   LINE 新訂單通知
   ========================================================= */

async function notifyLine(
  order
) {

  const adminUserId =
    String(
      process.env.LINE_ADMIN_USER_ID ||
      ''
    ).trim();


  if (
    !adminUserId
  ) {

    throw Error(
      '沒有設定 LINE_ADMIN_USER_ID'
    );

  }


  const a = [

    '🔔 新訂單通知',

    '',

    `訂單編號：${order.id}`,

    `姓名：${order.customer.name}`,

    `電話：${order.customer.phone}`,

    `取餐時間：${order.customer.pickupDateTime}`,

    ''

  ];


  /*
    目前系統要求所有新訂單
    都必須有 LINE 綁定。
  */

  if (
    order.lineUserId
  ) {

    a.push(

      '🟢 LINE 已綁定',

      `LINE User ID：${order.lineUserId}`

    );

  } else {

    a.push(

      '🔴 異常：訂單沒有 LINE 綁定'

    );

  }


  a.push(

    '',

    '【訂購內容】'

  );


  for (
    const i of
      order.items || []
  ) {

    let s =
      `${i.name || ''} × ${num(
        i.quantity
      )}`;


    if (
      String(
        i.sweetness || ''
      ).trim()
    ) {

      s +=
        `｜甜度：${i.sweetness}`;

    }


    if (
      String(
        i.ice || ''
      ).trim()
    ) {

      s +=
        `｜冰塊：${i.ice}`;

    }


    a.push(
      s
    );

  }


  const b1 =
    num(
      order.bag1Count
    );


  const b2 =
    num(
      order.bag2Count
    );


  if (
    b1 ||
    b2
  ) {

    a.push(

      '',

      '【購物袋】'

    );


    if (
      b1
    ) {

      a.push(
        `1 杯袋 × ${b1}`
      );

    }


    if (
      b2
    ) {

      a.push(
        `2～8 杯袋 × ${b2}`
      );

    }

  }


  if (
    String(
      order.customer.note ||
      ''
    ).trim()
  ) {

    a.push(

      '',

      `備註：${order.customer.note}`

    );

  }


  if (
    String(
      order.customer.invoiceNumber ||
      ''
    ).trim()
  ) {

    a.push(

      `統一編號：${order.customer.invoiceNumber}`

    );

  }


  a.push(

    '',

    `💰 合計：$${order.total}`,

    '',

    '💵 付款方式：現金'

  );


  await linePushText(
    adminUserId,
    a.join('\n')
  );

}
/* =========================================================
   訂單資料標準化
   ========================================================= */

function normalize(row) {

  return {

    id:
      makeOrderId(
        row.order_number
      ),

    orderNumber:
      num(
        row.order_number
      ),

    createdAt:
      row.created_at,

    status:
      row.order_status ||
      'new',


    customer: {

      name:
        row.customer_name ||
        '',

      phone:
        row.customer_phone ||
        '',

      pickupDateTime:
        row.pickup_time ||
        '',

      invoiceNumber:
        row.invoice_number ||
        '',

      note:
        row.notes ||
        ''

    },


    items:
      Array.isArray(
        row.items
      )
        ? row.items
        : [],


    bag1Count:
      num(
        row.bag1_count
      ),

    bag2Count:
      num(
        row.bag2_count
      ),


    total:
      num(
        row.total_amount
      ),

    /*
      LINE 綁定資訊
    */

    lineUserId:
      row.line_user_id ||
      '',

    lineDisplayName:
      row.line_display_name ||
      ''

  };

}


/* =========================================================
   取得全部訂單
   ========================================================= */

async function getOrders() {

  const x =
    await supabase(
      'orders?select=*&order=created_at.desc&limit=100'
    );


  return Array.isArray(x)
    ? x
    : [];

}


/* =========================================================
   取得單筆訂單
   ========================================================= */

async function getOrder(
  n
) {

  const orderNumber =
    resolveOrderNumber(
      n
    );


  if (
    !orderNumber
  ) {

    return null;

  }


  const x =
    await supabase(

      `orders?select=*&order_number=eq.${encodeURIComponent(
        orderNumber
      )}&limit=1`

    );


  return (
    x?.[0] ||
    null
  );

}


/* =========================================================
   刪除訂單
   ========================================================= */

async function deleteOrder(
  n
) {

  const orderNumber =
    resolveOrderNumber(
      n
    );


  if (
    !orderNumber
  ) {

    throw Error(
      '訂單編號格式錯誤'
    );

  }


  return supabase(

    `orders?order_number=eq.${encodeURIComponent(
      orderNumber
    )}`,

    {

      method:
        'DELETE',

      prefer:
        'return=representation'

    }

  );

}


/* =========================================================
   修改訂單狀態
   ========================================================= */

async function statusOrder(
  n,
  status
) {

  const orderNumber =
    resolveOrderNumber(
      n
    );


  if (
    !orderNumber
  ) {

    throw Error(
      '訂單編號格式錯誤'
    );

  }


  const allowed = [

    'new',

    'confirmed',

    'preparing',

    'ready',

    'completed',

    'cancelled'

  ];


  if (
    !allowed.includes(
      status
    )
  ) {

    throw Error(
      '訂單狀態不正確'
    );

  }


  const x =
    await supabase(

      `orders?order_number=eq.${encodeURIComponent(
        orderNumber
      )}`,

      {

        method:
          'PATCH',

        body: {

          order_status:
            status

        }

      }

    );


  return (
    x?.[0] ||
    null
  );

}


/* =========================================================
   本機刪除訂單
   ========================================================= */

function deleteLocal(
  n
) {

  const orderNumber =
    resolveOrderNumber(
      n
    );


  const a =
    readOrders();


  const b =
    a.filter(
      x =>
        num(
          x.orderNumber ??
          x.order_number
        ) !==
        orderNumber
    );


  writeOrders(
    b
  );


  return (
    a.length -
    b.length
  );

}


/* =========================================================
   本機訂單轉成資料列
   ========================================================= */

function localAsRows() {

  return readOrders()
    .map(
      o => ({

        order_number:
          o.orderNumber,

        customer_name:
          o.customer?.name ||
          '',

        customer_phone:
          o.customer?.phone ||
          '',

        items:
          o.items ||
          [],

        total_amount:
          o.total ||
          0,

        invoice_number:
          o.customer?.invoiceNumber ||
          null,

        bag1_count:
          num(
            o.bag1Count
          ),

        bag2_count:
          num(
            o.bag2Count
          ),

        pickup_time:
          o.customer?.pickupDateTime ||
          null,

        notes:
          o.customer?.note ||
          null,

        order_status:
          o.status ||
          'new',

        created_at:
          o.createdAt,

        line_user_id:
          o.lineUserId ||
          '',

        line_display_name:
          o.lineDisplayName ||
          ''

      })
    );

}


/* =========================================================
   安全檔案路徑
   ========================================================= */

function safeFile(
  p
) {

  let d;


  try {

    d =
      decodeURIComponent(
        p === '/'
          ? '/index.html'
          : p
      );

  } catch {

    return null;

  }


  const root =
    path.resolve(
      PUBLIC_DIR
    );


  const file =
    path.resolve(
      path.join(
        PUBLIC_DIR,
        d
      )
    );


  return (

    file === root ||

    file.startsWith(
      root +
      path.sep
    )

  )
    ? file
    : null;

}


/* =========================================================
   管理後台
   ========================================================= */

function adminHtml(
  rows,
  key
) {

  const tr =
    rows
      .map(
        r => {

          const n =
            r.order_number ??
            '';


          const displayId =
            makeOrderId(
              n
            ) ||
            String(
              n
            );


          const created =
            r.created_at

              ? new Date(
                  r.created_at
                ).toLocaleString(
                  'zh-TW',
                  {
                    hour12:
                      false
                  }
                )

              : '';


          const name =
            r.customer_name ||
            '';


          const phone =
            r.customer_phone ||
            '';


          const pickup =
            r.pickup_time ||
            '';


          const total =
            num(
              r.total_amount
            );


          const status =
            r.order_status ||
            'new';


          let items =
            (
              Array.isArray(
                r.items
              )
                ? r.items
                : []
            )
              .map(
                i => {

                  let s =
                    `${esc(
                      i.name ||
                      ''
                    )} × ${num(
                      i.quantity
                    )}`;


                  if (
                    String(
                      i.sweetness ||
                      ''
                    ).trim()
                  ) {

                    s +=
                      `｜甜度：${esc(
                        i.sweetness
                      )}`;

                  }


                  if (
                    String(
                      i.ice ||
                      ''
                    ).trim()
                  ) {

                    s +=
                      `｜冰塊：${esc(
                        i.ice
                      )}`;

                  }


                  return s;

                }
              )
              .join(
                '<br>'
              );


          const b1 =
            num(
              r.bag1_count
            );


          const b2 =
            num(
              r.bag2_count
            );


          const note =
            String(
              r.notes ||
              ''
            ).trim();


          const invoice =
            String(
              r.invoice_number ||
              ''
            ).trim();


          if (
            b1 ||
            b2
          ) {

            items +=
              '<br><br><strong>購物袋：</strong>';


            if (
              b1
            ) {

              items +=
                `<br>1杯袋：${b1} 個`;

            }


            if (
              b2
            ) {

              items +=
                `<br>2～8杯袋：${b2} 個`;

            }

          }


          if (
            note
          ) {

            items +=
              `<br><br><strong>備註：</strong>${esc(
                note
              )}`;

          }


          if (
            invoice
          ) {

            items +=
              `<br><strong>統一編號：</strong>${esc(
                invoice
              )}`;

          }


          return `

<tr
  data-row="${esc(
    displayId
  )}"
>

<td>

<strong>
${esc(
  displayId
)}
</strong>

</td>


<td>

${esc(
  created
)}

</td>


<td>

${esc(
  name
)}

<br>

${esc(
  phone
)}

<br><br>

<strong>
取餐時間：
</strong>

${esc(
  pickup
)}

</td>


<td>

${items || '—'}

</td>


<td>

<strong>
$${total}
</strong>

</td>


<td>

<span class="status">

${esc(
  status
)}

</span>

</td>


<td>

<button
  class="delete-btn"
  type="button"
  data-order-number="${esc(
    displayId
  )}"
>

🗑️ 刪除

</button>

</td>

</tr>

`;

        }
      )
      .join(
        ''
      );


  return `

<!doctype html>

<html lang="zh-Hant">

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

*{
  box-sizing:border-box;
}


body{

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Noto Sans TC",
    sans-serif;

  margin:0;

  background:#f5f6f8;

  color:#2b211d;

}


main{

  max-width:1500px;

  margin:30px auto;

  padding:0 20px;

}


h1{

  color:#8f2f27;

  font-size:28px;

  margin-bottom:24px;

}


.info{

  background:#fff;

  border-radius:16px;

  padding:16px;

  margin-bottom:20px;

  box-shadow:
    0 2px 10px
    rgba(0,0,0,.05);

}


.table-wrap{

  width:100%;

  overflow-x:auto;

  background:#fff;

  border-radius:16px;

  box-shadow:
    0 2px 10px
    rgba(0,0,0,.05);

}


table{

  width:100%;

  min-width:1100px;

  border-collapse:collapse;

}


th,
td{

  padding:16px;

  border-bottom:
    1px solid #eee;

  text-align:left;

  vertical-align:top;

}


th{

  background:#eee4d8;

  color:#5b3028;

  white-space:nowrap;

}


tr:hover td{

  background:#fffaf5;

}


.status{

  display:inline-block;

  padding:5px 10px;

  border-radius:999px;

  background:#eee4d8;

}


.delete-btn{

  border:0;

  border-radius:10px;

  padding:12px 16px;

  background:#8f2f27;

  color:#fff;

  font-size:16px;

  font-weight:700;

  cursor:pointer;

  white-space:nowrap;

  touch-action:manipulation;

  -webkit-tap-highlight-color:transparent;

}


.delete-btn:active{

  transform:scale(.96);

}


.delete-btn:disabled{

  opacity:.55;

  cursor:wait;

}


.empty{

  padding:40px;

  text-align:center;

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
目前訂單數：
</strong>

${rows.length}

</div>


<div class="table-wrap">

<table>

<thead>

<tr>

<th>
訂單編號
</th>

<th>
建立時間
</th>

<th>
客人資料
</th>

<th>
訂購內容
</th>

<th>
金額
</th>

<th>
狀態
</th>

<th>
操作
</th>

</tr>

</thead>


<tbody>

${
  tr ||
  `
<tr>

<td
  colspan="7"
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


<script>

const ADMIN_KEY =
${JSON.stringify(
  key
)};


document
  .querySelectorAll(
    '.delete-btn'
  )
  .forEach(
    button => {

      button.addEventListener(
        'click',
        async () => {

          const orderNumber =
            button.dataset.orderNumber;


          if (
            !confirm(
              '確定要刪除這筆訂單嗎？'
            )
          ) {

            return;

          }


          button.disabled =
            true;


          try {

            const response =
              await fetch(
                '/api/admin/orders/' +
                encodeURIComponent(
                  orderNumber
                ),
                {

                  method:
                    'DELETE',

                  headers: {

                    'X-Admin-Key':
                      ADMIN_KEY

                  }

                }
              );


            const data =
              await response.json();


            if (
              !response.ok
            ) {

              throw new Error(
                data.error ||
                '刪除失敗'
              );

            }


            const row =
              button.closest(
                'tr'
              );


            if (
              row
            ) {

              row.remove();

            }


          } catch (
            error
          ) {

            alert(
              error.message ||
              '刪除失敗'
            );


            button.disabled =
              false;

          }

        }
      );

    }
  );

</script>


</body>

</html>

`;

}
/* =========================================================
   HTTP Server
   ========================================================= */

const MIME = {

  '.html':
    'text/html; charset=utf-8',

  '.js':
    'application/javascript; charset=utf-8',

  '.css':
    'text/css; charset=utf-8',

  '.json':
    'application/json; charset=utf-8',

  '.png':
    'image/png',

  '.jpg':
    'image/jpeg',

  '.jpeg':
    'image/jpeg',

  '.gif':
    'image/gif',

  '.svg':
    'image/svg+xml',

  '.ico':
    'image/x-icon',

  '.webp':
    'image/webp'

};


/* =========================================================
   Server
   ========================================================= */

const server =
  http.createServer(
    async (
      req,
      res
    ) => {

      const u =
        new URL(
          req.url,
          `http://${
            req.headers.host ||
            'localhost'
          }`
        );


      try {

        /* =================================================
           OPTIONS
           ================================================= */

        if (
          req.method ===
          'OPTIONS'
        ) {

          res.writeHead(
            204,
            {

              'Access-Control-Allow-Origin':
                '*',

              'Access-Control-Allow-Methods':
                'GET,POST,PUT,DELETE,OPTIONS',

              'Access-Control-Allow-Headers':
                'Content-Type'

            }
          );


          return res.end();

        }


        /* =================================================
           Health Check
           ================================================= */

        if (
          req.method ===
            'GET' &&

          u.pathname ===
            '/api/health'
        ) {

          return send(
            res,
            200,
            {

              ok:
                true,

              service:
                'Pharmacists Tea House',

              supabase:
                hasSupabase(),

              /*
                Telegram 已移除
              */

              telegram:
                false,

              /*
                LINE Login
              */

              lineLogin:
                lineLoginConfigured(),

              /*
                LINE Messaging API
              */

              lineMessaging:
                lineMessagingConfigured()

            }
          );

        }


        /* =================================================
           LINE Login
           ================================================= */

        if (
          req.method ===
            'GET' &&

          u.pathname ===
            '/api/line/login'
        ) {

          if (
            !lineLoginConfigured()
          ) {

            return send(
              res,
              503,
              {

                ok:
                  false,

                message:
                  'LINE Login 尚未設定。請先設定 LINE_LOGIN_CHANNEL_ID、LINE_LOGIN_CHANNEL_SECRET、LINE_LOGIN_CALLBACK_URL。'

              }
            );

          }


          /*
            OAuth state
          */

          const state =
            crypto
              .randomBytes(
                32
              )
              .toString(
                'base64url'
              );


          /*
            登入完成後要回哪裡
          */

          const returnTo =
            safeReturnPath(
              u.searchParams.get(
                'return'
              )
            );


          /*
            暫存 OAuth state
          */

          res.setHeader(
            'Set-Cookie',
            [

              `line_oauth_state=${cookieValue(
                state
              )}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`,

              `line_oauth_return=${cookieValue(
                returnTo
              )}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`

            ]
          );


          /*
            建立 LINE Login URL
          */

          const params =
            new URLSearchParams();


          params.set(
            'response_type',
            'code'
          );


          params.set(
            'client_id',
            String(
              process.env.LINE_LOGIN_CHANNEL_ID ||
              ''
            ).trim()
          );


          params.set(
            'redirect_uri',
            String(
              process.env.LINE_LOGIN_CALLBACK_URL ||
              ''
            ).trim()
          );


          params.set(
            'state',
            state
          );


          params.set(
            'scope',
            'profile openid'
          );


          const loginUrl =
            'https://access.line.me/oauth2/v2.1/authorize?' +
            params.toString();


          res.writeHead(
            302,
            {

              Location:
                loginUrl

            }
          );


          return res.end();

        }


        /* =================================================
           LINE Callback
           ================================================= */

        if (
          req.method ===
            'GET' &&

          u.pathname ===
            '/api/line/callback'
        ) {

          if (
            !lineLoginConfigured()
          ) {

            return send(
              res,
              503,
              {

                ok:
                  false,

                message:
                  'LINE Login 尚未設定'

              }
            );

          }


          const cookies =
            parseCookies(
              req
            );


          const expectedState =
            String(
              cookies.line_oauth_state ||
              ''
            );


          const state =
            String(
              u.searchParams.get(
                'state'
              ) ||
              ''
            );


          /*
            驗證 OAuth State
          */

          if (
            !expectedState ||
            !state ||
            expectedState !== state
          ) {

            clearLineSession(
              res
            );


            return send(
              res,
              400,
              {

                ok:
                  false,

                message:
                  'LINE 登入驗證失敗，請重新嘗試。'

              }
            );

          }


          /*
            客人取消 LINE Login
          */

          if (
            u.searchParams.get(
              'error'
            )
          ) {

            return send(
              res,
              400,
              {

                ok:
                  false,

                message:
                  'LINE 登入被取消或失敗。'

              }
            );

          }


          const code =
            String(
              u.searchParams.get(
                'code'
              ) ||
              ''
            ).trim();


          if (
            !code
          ) {

            return send(
              res,
              400,
              {

                ok:
                  false,

                message:
                  'LINE Login 沒有收到授權碼。'

              }
            );

          }


          try {

            /*
              取得 Access Token
            */

            const token =
              await lineLoginToken(
                code
              );


            /*
              取得 LINE Profile
            */

            const profile =
              await lineProfile(
                token.access_token
              );


            const userId =
              String(
                profile.userId ||
                ''
              ).trim();


            /*
              驗證 LINE User ID
            */

            if (
              !/^U[0-9a-f]{32}$/i.test(
                userId
              )
            ) {

              throw Error(
                'LINE 回傳的 User ID 格式不正確'
              );

            }


            /*
              登入後回到原本頁面
            */

            const returnTo =
              safeReturnPath(
                cookies.line_oauth_return ||
                '/'
              );


            /*
              建立正式 LINE Session
            */

            res.setHeader(
              'Set-Cookie',
              [

                `line_session=${cookieValue(
                  signLineSession(
                    userId
                  )
                )}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`,

                'line_oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',

                'line_oauth_return=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'

              ]
            );


            /*
              回網站
            */

            res.writeHead(
              302,
              {

                Location:
                  returnTo

              }
            );


            return res.end();


          } catch (
            e
          ) {

            console.error(
              'LINE Login callback 失敗',
              e
            );


            return send(
              res,
              500,
              {

                ok:
                  false,

                message:
                  e.message ||
                  'LINE 登入失敗'

              }
            );

          }

        }


        /* =================================================
           LINE /me
           ================================================= */

        if (
          req.method ===
            'GET' &&

          u.pathname ===
            '/api/line/me'
        ) {

          const lineUserId =
            lineUserIdFromRequest(
              req
            );


          /*
            尚未登入 LINE
          */

          if (
            !lineUserId
          ) {

            return send(
              res,
              200,
              {

                ok:
                  true,

                loggedIn:
                  false,

                bound:
                  false

              }
            );

          }


          let customer =
            null;


          /*
            讀取 LINE 對應的客人資料
          */

          try {

            customer =
              await getCustomerByLineUserId(
                lineUserId
              );

          } catch (
            e
          ) {

            console.error(
              '讀取 LINE 客戶資料失敗',
              e
            );

          }


          /*
            有 Session 就代表 LINE 已完成登入／綁定。
          */

          return send(
            res,
            200,
            {

              ok:
                true,

              loggedIn:
                true,

              bound:
                true,

              userId:
                lineUserId,

              displayName:
                customer?.line_display_name ||
                customer?.display_name ||
                '',

              hasCustomerProfile:
                Boolean(
                  customer?.name ||
                  customer?.phone
                ),

              customer

            }
          );

        }


        /* =================================================
           建立訂單
           ================================================= */

        if (
          req.method ===
            'POST' &&

          u.pathname ===
            '/api/orders'
        ) {

          /*
            =================================================
            第一關：LINE 強制驗證
            =================================================

            這是這次修改最重要的地方。

            不再相信前端送來的：

              lineUserId
              customer.lineUserId
              b.lineUserId

            唯一可信來源：

              HttpOnly line_session Cookie

            沒有 LINE Session：
            → 401
            → 不建立訂單
            → 不寫 Supabase
            → 不發 LINE 通知

            =================================================
          */

          const lineUserId =
            lineUserIdFromRequest(
              req
            );


          if (
            !lineUserId
          ) {

            return send(
              res,
              401,
              {

                ok:
                  false,

                code:
                  'LINE_BINDING_REQUIRED',

                message:
                  '請先完成 LINE 綁定後才能下單。'

              }
            );

          }


          /*
            =================================================
            第二關：確認 LINE 客戶資料
            =================================================
          */

          let lineCustomer =
            null;


          try {

            lineCustomer =
              await getCustomerByLineUserId(
                lineUserId
              );

          } catch (
            e
          ) {

            console.error(
              '取得 LINE 客戶資料失敗',
              e
            );

          }


          /*
            即使 LINE Session 存在，
            仍然要求 LINE User ID 有效。
          */

          if (
            !/^U[0-9a-f]{32}$/i.test(
              lineUserId
            )
          ) {

            return send(
              res,
              401,
              {

                ok:
                  false,

                code:
                  'INVALID_LINE_SESSION',

                message:
                  'LINE 綁定資訊無效，請重新綁定 LINE。'

              }
            );

          }


          /*
            =================================================
            讀取訂單
            =================================================
          */

          const b =
            await body(
              req
            );


          const c =
            b.customer ||
            {};


          const items =
            Array.isArray(
              b.items
            )
              ? b.items
              : [];


          /*
            姓名
          */

          const name =
            String(

              c.name ||

              b.customer_name ||

              ''

            )
              .trim()
              .slice(
                0,
                50
              );


          /*
            電話
          */

          const phone =
            String(

              c.phone ||

              b.customer_phone ||

              ''

            )
              .trim()
              .slice(
                0,
                30
              );


          /*
            取餐時間
          */

          const pickup =
            String(

              c.pickupDateTime ||

              c.pickup_time ||

              b.pickup_time ||

              ''

            )
              .trim()
              .slice(
                0,
                50
              );


          /*
            統一編號
          */

          const invoice =
            String(

              b.invoiceNumber ??
              b.invoice_number ??

              c.invoiceNumber ??
              c.invoice_number ??

              ''

            )
              .trim()
              .slice(
                0,
                30
              );


          /*
            備註
          */

          const note =
            String(

              c.note ??
              c.notes ??

              b.notes ??

              ''

            )
              .trim()
              .slice(
                0,
                300
              );


          /*
            =================================================
            基本欄位驗證
            =================================================
          */

          if (

            !name ||

            !phone ||

            !pickup ||

            !items.length

          ) {

            return send(
              res,
              400,
              {

                ok:
                  false,

                message:
                  '請填寫姓名、電話、取餐時間並至少選一杯茶。'

              }
            );

          }


          /*
            =================================================
            購物袋
            =================================================
          */

          const bag1 =
            Math.max(

              0,

              num(

                b.bag1Count ??
                b.bag_1_count

              )

            );


          const bag2 =
            Math.max(

              0,

              num(

                b.bag2Count ??
                b.bag_2_count

              )

            );


          /*
            =================================================
            計算總金額
            =================================================
          */

          const total =
            items.reduce(

              (
                sum,
                i
              ) =>

                sum +

                num(
                  i.price
                ) *

                num(
                  i.quantity
                ),

              0

            ) +

            bag1 +

            bag2 * 2;


          /*
            =================================================
            訂單編號
            =================================================
          */

          const orderNumber =
            Date.now();


          const id =
            makeOrderId(
              orderNumber
            );


          /*
            =================================================
            完整訂單物件
            =================================================
          */

          const order = {

            id,

            orderNumber,

            createdAt:
              new Date()
                .toISOString(),

            status:
              'new',


            /*
              LINE 綁定
            */

            lineUserId:
              lineUserId,

            lineDisplayName:
              lineCustomer?.line_display_name ||
              lineCustomer?.display_name ||
              '',


            customer: {

              name,

              phone,

              pickupDateTime:
                pickup,

              invoiceNumber:
                invoice,

              note

            },


            items,

            bag1Count:
              bag1,

            bag2Count:
              bag2,

            total

          };


          /* =================================================
             寫入 Supabase
             ================================================= */

          let saved;


          try {

            saved =
              await supabase(
                'orders',
                {

                  method:
                    'POST',

                  body: {

                    order_number:
                      orderNumber,

                    /*
                      這裡一定是
                      Server 驗證過的 LINE User ID
                    */

                    line_user_id:
                      lineUserId,

                    line_display_name:
                      order.lineDisplayName ||
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
                      invoice ||
                      null,

                    shopping_bag:
                      Boolean(
                        bag1 ||
                        bag2
                      ),

                    bag1_count:
                      bag1,

                    bag2_count:
                      bag2,

                    pickup_time:
                      pickup ||
                      null,

                    notes:
                      note ||
                      null,

                    order_status:
                      'new'

                  }

                }
              );

          } catch (
            e
          ) {

            console.error(
              'Supabase 寫入失敗',
              e
            );


            return send(
              res,
              500,
              {

                ok:
                  false,

                message:
                  '訂單無法寫入雲端資料庫，請稍後再試。'

              }
            );

          }


          /* =================================================
             本機備份
             ================================================= */

          try {

            const a =
              readOrders();


            a.unshift(
              order
            );


            writeOrders(
              a
            );

          } catch (
            e
          ) {

            console.error(
              '本機備份失敗',
              e
            );

          }


          /* =================================================
             LINE 官方帳號通知
             ================================================= */

          try {

            await notifyLine(
              order
            );

          } catch (
            e
          ) {

            console.error(
              'LINE 通知失敗',
              e.message
            );

          }


          /*
            =================================================
            注意：

            這裡故意沒有：

              await notify(order)

            因為 Telegram 已經移除。

            新訂單只通知 LINE。
            =================================================
          */


          return send(
            res,
            201,
            {

              ok:
                true,

              orderId:
                id,

              orderNumber:
                orderNumber,

              total:
                total,

              supabase:
                true,

              supabaseOrderId:

                Array.isArray(
                  saved
                )

                  ? saved[0]?.id

                  : saved?.id ||
                    null

            }
          );

        }


        /* =================================================
           查詢單筆訂單
           ================================================= */

        if (

          req.method ===
            'GET' &&

          /^\/api\/orders\/[^/]+$/.test(
            u.pathname
          )

        ) {

          if (
            !hasSupabase()
          ) {

            return send(
              res,
              503,
              {

                ok:
                  false,

                message:
                  'Supabase 尚未設定'

              }
            );

          }


          const n =
            u.pathname
              .split('/')
              .pop();


          const row =
            await getOrder(
              n
            );


          if (
            !row
          ) {

            return send(
              res,
              404,
              {

                ok:
                  false,

                message:
                  '找不到訂單'

              }
            );

          }


          return send(
            res,
            200,
            {

              ok:
                true,

              order:
                normalize(
                  row
                )

            }
          );

        }


        /* =================================================
           管理員刪除訂單
           ================================================= */

        if (

          req.method ===
            'DELETE' &&

          /^\/api\/admin\/orders\/[^/]+$/.test(
            u.pathname
          )

        ) {

          if (

            u.searchParams.get(
              'key'
            ) !==
            adminKey()

          ) {

            return send(
              res,
              401,
              {

                ok:
                  false,

                message:
                  'Unauthorized'

              }
            );

          }


          const n =
            u.pathname
              .split('/')
              .pop();


          if (
            !resolveOrderNumber(
              n
            )
          ) {

            return send(
              res,
              400,
              {

                ok:
                  false,

                message:
                  '訂單編號格式錯誤'

              }
            );

          }


          if (
            !hasSupabase()
          ) {

            return send(
              res,
              503,
              {

                ok:
                  false,

                message:
                  'Supabase 尚未設定'

              }
            );

          }


          try {

            const deleted =
              await deleteOrder(
                n
              );


            const local =
              deleteLocal(
                n
              );


            return send(
              res,
              200,
              {

                ok:
                  true,

                orderId:
                  makeOrderId(
                    resolveOrderNumber(
                      n
                    )
                  ),

                orderNumber:
                  resolveOrderNumber(
                    n
                  ),

                deletedFromSupabase:

                  Array.isArray(
                    deleted
                  )
                    ? deleted.length
                    : 0,

                deletedFromLocalBackup:
                  local

              }
            );


          } catch (
            e
          ) {

            console.error(
              '刪除訂單錯誤',
              e
            );


            return send(
              res,
              500,
              {

                ok:
                  false,

                message:
                  e.message ||
                  '刪除訂單失敗'

              }
            );

          }

        }


        /* =================================================
           修改訂單狀態
           ================================================= */

        if (

          req.method ===
            'PUT' &&

          /^\/api\/orders\/[^/]+\/status$/.test(
            u.pathname
          )

        ) {

          const n =
            u.pathname
              .split('/')[3];


          const b =
            await body(
              req
            );


          const row =
            await statusOrder(
              n,
              String(
                b.status ||
                ''
              ).trim()
            );


          if (
            !row
          ) {

            return send(
              res,
              404,
              {

                ok:
                  false,

                message:
                  '找不到訂單'

              }
            );

          }


          return send(
            res,
            200,
            {

              ok:
                true,

              order:
                normalize(
                  row
                )

            }
          );

        }


        /* =================================================
           管理後台
           ================================================= */

        if (

          req.method ===
            'GET' &&

          u.pathname ===
            '/admin'

        ) {

          const key =
            u.searchParams.get(
              'key'
            ) ||
            '';


          if (
            key !==
            adminKey()
          ) {

            return send(
              res,
              401,
              '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>Unauthorized</title><h1>Unauthorized</h1>',
              'text/html; charset=utf-8'
            );

          }


          let rows =
            [];


          try {

            if (
              hasSupabase()
            ) {

              rows =
                await getOrders();

            } else {

              rows =
                localAsRows();

            }

          } catch (
            e
          ) {

            console.error(
              '讀取訂單錯誤',
              e
            );


            rows =
              localAsRows();

          }


          return send(
            res,
            200,
            adminHtml(
              rows,
              key
            ),
            'text/html; charset=utf-8'
          );

        }


        /* =================================================
           靜態檔案
           ================================================= */

        const file =
          safeFile(
            u.pathname
          );


        if (
          !file
        ) {

          return send(
            res,
            403,
            {

              ok:
                false,

              message:
                'Forbidden'

            }
          );

        }


        fs.stat(
          file,
          (
            err,
            st
          ) => {

            if (
              err ||
              !st.isFile()
            ) {

              return send(
                res,
                404,
                'Not Found',
                'text/plain; charset=utf-8'
              );

            }


            const ext =
              path
                .extname(
                  file
                )
                .toLowerCase();


            res.writeHead(
              200,
              {

                'Content-Type':
                  MIME[ext] ||
                  'application/octet-stream',

                'Cache-Control':
                  ext ===
                  '.html'

                    ? 'no-store'

                    : 'public,max-age=3600'

              }
            );


            fs.createReadStream(
              file
            )
              .pipe(
                res
              );

          }
        );


      } catch (
        e
      ) {

        console.error(
          '伺服器錯誤',
          e
        );


        return send(
          res,
          500,
          {

            ok:
              false,

            message:
              e.message ||
              '伺服器發生錯誤'

          }
        );

      }

    }
  );


/* =========================================================
   啟動 Server
   ========================================================= */

server.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);
/* =========================================================
   靜態檔案
   ========================================================= */

const file =
  safeFile(
    u.pathname
  );


if (
  !file
) {

  return send(
    res,
    403,
    {

      ok:
        false,

      message:
        'Forbidden'

    }
  );

}


fs.stat(
  file,
  (
    err,
    st
  ) => {

    if (
      err ||
      !st.isFile()
    ) {

      return send(
        res,
        404,
        'Not Found',
        'text/plain; charset=utf-8'
      );

    }


    const ext =
      path
        .extname(
          file
        )
        .toLowerCase();


    res.writeHead(
      200,
      {

        'Content-Type':
          MIME[ext] ||
          'application/octet-stream',

        /*
          HTML 不快取，
          確保更新 app.js / 首頁後
          客人不會一直拿到舊版本。
        */

        'Cache-Control':
          ext ===
          '.html'

            ? 'no-store'

            : 'public,max-age=3600'

      }
    );


    fs.createReadStream(
      file
    )
      .pipe(
        res
      );

  }
);


/* =========================================================
   全域錯誤處理
   ========================================================= */

} catch (
  e
) {

  console.error(
    '伺服器錯誤',
    e
  );


  return send(
    res,
    500,
    {

      ok:
        false,

      message:
        e.message ||
        '伺服器發生錯誤'

    }
  );

}

});


/* =========================================================
   啟動 Server
   ========================================================= */

server.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);
