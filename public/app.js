const menu = [
  {
    cat: "紅茶系列",
    en: "Black Tea",
    items: [
      ["老樹麥香", "古早味傳統紅茶", 30],
      ["菁玉紅茶", "英式下午茶", 45],
      ["蜜香紅茶", "茶葉回甘帶有熟蜜的香氣", 45],
      ["觀音紅茶", "帶有微微自然風味的紅茶", 45],
      ["紫霞仙子紅茶", "阿薩姆基底，獨特果香，醇厚回甘", 50],
      ["藥師皇茶", "獨特的山林木質香氣", 55],
      ["台茶十八號（紅玉）", "茶香獨特，口感濃郁強烈", 75]
    ]
  },

  {
    cat: "鮮奶茶系列",
    en: "Milk Tea",
    items: [
      ["招牌鮮奶茶", "特製奶茶茶湯，類似麥香奶茶", 50],
      ["菁玉鮮奶茶", "茶味較明顯的鮮奶茶", 50],
      ["蜜香鮮奶茶", "茶葉回甘帶有熟蜜的香氣", 50],
      ["觀音鮮奶茶", "讓人耳目一新的特別風味", 55],
      ["阿薩姆鮮奶茶", "阿薩姆奶品種獨特的甘醇芳香", 55]
    ]
  }
];


const sweets = [
  "無糖",
  "一分糖（10%）",
  "三分糖（微糖）",
  "五分糖（半糖）",
  "八分糖（少糖）",
  "十分糖（正常糖）"
];


const ices = [
  "去冰",
  "三分冰",
  "八分冰",
  "正常冰"
];


let cart = [];

let selectedIce = "正常冰";

let selectedSweet = "十分糖（正常糖）";



/* =========================================================
   飲料圖片
   ========================================================= */

function drinkImg(name) {

  const hue =
    name.includes("鮮奶")
      ? "#ead1b2"
      : "#9d4a2b";


  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="120"
      height="140"
    >

      <rect
        width="120"
        height="140"
        rx="15"
        fill="${hue}"
      />

      <ellipse
        cx="60"
        cy="112"
        rx="38"
        ry="10"
        fill="#0002"
      />

      <path
        d="M35 28h50l-6 78q-19 12-38 0z"
        fill="#fff8"
      />

      <path
        d="M38 43h44l-4 57q-18 10-36 0z"
        fill="${
          name.includes("鮮奶")
            ? "#c58b58"
            : "#6f2d1c"
        }"
      />

      <path
        d="M43 20h35v9H43z"
        fill="#eee"
      />

      <path
        d="M79 25l15-18"
        stroke="#6d4b38"
        stroke-width="5"
      />

      <circle
        cx="50"
        cy="72"
        r="3"
        fill="#fff6"
      />

    </svg>
  `;


  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(svg)
  );

}



/* =========================================================
   導覽列
   ========================================================= */

function renderNav() {

  document.getElementById("nav").innerHTML =
    '<button class="active" onclick="filterCat(\'全部\',this)">🥤 全部飲品</button>' +

    menu
      .map(
        x =>
          `<button onclick="filterCat('${x.cat}',this)">🍃 ${x.cat}</button>`
      )
      .join("") +

    '<button onclick="showAbout()">ⓘ 關於我們</button>';

}



/* =========================================================
   商品列表
   ========================================================= */

function renderMenu(
  filter = "全部",
  q = ""
) {

  const box =
    document.getElementById("menu");


  box.innerHTML = "";


  menu
    .filter(
      s =>
        filter === "全部" ||
        s.cat === filter
    )
    .forEach(s => {

      const items =
        s.items.filter(
          i =>
            (i[0] + i[1])
              .toLowerCase()
              .includes(q.toLowerCase())
        );


      if (!items.length) {
        return;
      }


      const sec =
        document.createElement("section");


      sec.className =
        "section";


      sec.innerHTML =
        `
        <h2>
          ${s.cat}
          <small>${s.en}</small>
        </h2>

        <div class="grid">

          ${items
            .map(
              i =>
                `
                <article class="item">

                  <img
                    class="drink"
                    src="${drinkImg(i[0])}"
                  >

                  <div>

                    <h3>
                      ${i[0]}
                    </h3>

                    <div class="desc">
                      ${i[1]}
                    </div>

                    <div class="itemBottom">

                      <span class="price">
                        $${i[2]}
                      </span>

                      <button
                        class="add"
                        onclick='add("${i[0]}",${i[2]},"${i[1]}")'
                      >
                        ＋
                      </button>

                    </div>

                  </div>

                </article>
                `
            )
            .join("")}

        </div>
        `;


      box.appendChild(sec);

    });

}



/* =========================================================
   分類
   ========================================================= */

function filterCat(
  cat,
  el
) {

  document
    .querySelectorAll(".side button")
    .forEach(
      x =>
        x.classList.remove("active")
    );


  el.classList.add("active");


  renderMenu(
    cat,
    document.getElementById("search").value
  );

}



/* =========================================================
   冰甜度
   ========================================================= */

function renderOptions() {

  document.getElementById("iceChips").innerHTML =
    ices
      .map(
        x =>
          `
          <button
            class="chip ${
              x === selectedIce
                ? "selected"
                : ""
            }"
            onclick="selectGlobal('ice','${x}')"
          >
            ${x}
          </button>
          `
      )
      .join("");


  document.getElementById("sweetChips").innerHTML =
    sweets
      .map(
        x =>
          `
          <button
            class="chip ${
              x === selectedSweet
                ? "selected"
                : ""
            }"
            onclick="selectGlobal('sweet','${x}')"
          >
            ${x}
          </button>
          `
      )
      .join("");

}



/* =========================================================
   選擇冰甜度
   ========================================================= */

function selectGlobal(
  type,
  v
) {

  if (type === "ice") {

    selectedIce = v;

  } else {

    selectedSweet = v;

  }


  renderOptions();


  if (cart.length) {

    cart.forEach(x => {

      x.ice =
        selectedIce;

      x.sweet =
        selectedSweet;

    });


    renderCart();

  }

}



/* =========================================================
   加入購物車
   ========================================================= */

function add(
  name,
  price,
  desc
) {

  cart.push({

    name,

    price,

    desc,

    ice:
      selectedIce,

    sweet:
      selectedSweet,

    qty: 1

  });


  renderCart();


  toast(
    "已加入購物車"
  );

}



/* =========================================================
   購物車
   ========================================================= */

function renderCart() {

  const list =
    document.getElementById("cartList");


  const count =
    cart.reduce(
      (a, x) =>
        a + x.qty,
      0
    );


  const sub =
    cart.reduce(
      (a, x) =>
        a + x.price * x.qty,
      0
    );


  document.getElementById(
    "topCount"
  ).textContent =
    count;


  document.getElementById(
    "cartCount"
  ).textContent =
    `(${count})`;


  document.getElementById(
    "cups"
  ).textContent =
    count + " 杯";


  document.getElementById(
    "subtotal"
  ).textContent =
    "$" + sub;


  document.getElementById(
    "total"
  ).textContent =
    "$" + sub;


  document.getElementById(
    "checkout"
  ).disabled =
    !cart.length;


  document.getElementById(
    "checkout"
  ).textContent =
    cart.length
      ? "前往結帳"
      : "選擇商品";


  if (!cart.length) {

    list.innerHTML =
      `
      <div class="empty">
        尚未選擇任何飲品
        <br>
        快去選購喜歡的飲品吧！🍵
      </div>
      `;

    return;

  }


  list.innerHTML =
    cart
      .map(
        (x, i) =>
          `
          <div class="cartItem">

            <div
              style="
                display:flex;
                justify-content:space-between
              "
            >

              <span class="cartName">
                ${x.name}
              </span>

              <button
                class="remove"
                onclick="removeItem(${i})"
              >
                ✕
              </button>

            </div>


            <div class="opt">
              ${x.sweet}・${x.ice}
            </div>


            <div class="qrow">

              <button
                onclick="changeQty(${i},-1)"
              >
                −
              </button>

              <span>
                ${x.qty}
              </span>

              <button
                onclick="changeQty(${i},1)"
              >
                ＋
              </button>

              <b>
                $${x.price * x.qty}
              </b>

            </div>

          </div>
          `
      )
      .join("");

}



/* =========================================================
   修改數量
   ========================================================= */

function changeQty(
  i,
  d
) {

  cart[i].qty += d;


  if (cart[i].qty <= 0) {

    cart.splice(
      i,
      1
    );

  }


  renderCart();

}



/* =========================================================
   刪除商品
   ========================================================= */

function removeItem(i) {

  cart.splice(
    i,
    1
  );


  renderCart();

}



/* =========================================================
   取餐時間計算
   =========================================================

   1～2 杯   → 15 分鐘
   3～4 杯   → 20 分鐘
   5～6 杯   → 25 分鐘
   7～8 杯   → 30 分鐘
   9～10 杯  → 40 分鐘
   11～15 杯 → 50 分鐘
   16 杯以上 → 60 分鐘

   每 5 分鐘一個可選時段。
   客人不能自行輸入。
   ========================================================= */

function getPickupDelayMinutes() {

  const cupCount =
    cart.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          Number(item.qty || 0)
        ),
      0
    );


  if (cupCount <= 2) {

    return 15;

  }


  if (cupCount <= 4) {

    return 20;

  }


  if (cupCount <= 6) {

    return 25;

  }


  if (cupCount <= 8) {

    return 30;

  }


  if (cupCount <= 10) {

    return 40;

  }


  if (cupCount <= 15) {

    return 50;

  }


  return 60;

}



/* =========================================================
   時間補 0
   ========================================================= */

function padTime(
  number
) {

  return String(
    number
  ).padStart(
    2,
    "0"
  );

}



/* =========================================================
   產生取餐時間選項
   ========================================================= */

function buildPickupTimeOptions() {

  const select =
    document.getElementById(
      "pickupDateTime"
    );


  if (!select) {

    return;

  }


  const delay =
    getPickupDelayMinutes();


  const now =
    new Date();


  /*
    計算最早可以取餐的時間
  */

  const earliest =
    new Date(
      now.getTime() +
      delay * 60 * 1000
    );


  /*
    向上對齊到 5 分鐘。

    例如：
    14:36
    → 14:40

    14:41
    → 14:45
  */

  const remainder =
    earliest.getMinutes() % 5;


  if (remainder !== 0) {

    earliest.setMinutes(
      earliest.getMinutes() +
      (5 - remainder)
    );

  }


  earliest.setSeconds(
    0
  );

  earliest.setMilliseconds(
    0
  );


  /*
    保留原本選擇
  */

  const oldValue =
    select.value;


  select.innerHTML =
    `
    <option value="">
      請選擇取餐時間
    </option>
    `;


  /*
    提供未來 2 小時的選擇。
    共 24 個時段，每 5 分鐘一格。
  */

  for (
    let i = 0;
    i < 24;
    i++
  ) {

    const time =
      new Date(
        earliest.getTime() +
        i * 5 * 60 * 1000
      );


    const month =
      time.getMonth() + 1;


    const day =
      time.getDate();


    const hour =
      time.getHours();


    const minute =
      time.getMinutes();


    const value =
      `${month}/${day} ${padTime(hour)}:${padTime(minute)}`;


    const option =
      document.createElement(
        "option"
      );


    option.value =
      value;


    option.textContent =
      value;


    select.appendChild(
      option
    );

  }


  /*
    如果原本選擇的時間還存在，
    保留它。
  */

  if (oldValue) {

    const exists =
      Array.from(
        select.options
      ).some(
        option =>
          option.value ===
          oldValue
      );


    if (exists) {

      select.value =
        oldValue;

    }

  }

}



/* =========================================================
   確認訂單
   ========================================================= */

function openCheckout() {

  /*
    開啟確認訂單之前，
    先重新計算一次杯數與時間。
  */

  const delay =
    getPickupDelayMinutes();


  document.getElementById(
    "panel"
  ).innerHTML =

    `
    <h2>
      確認訂單
    </h2>


    <p style="color:var(--muted)">
      取餐方式：
      <b>到店自取</b>
      　
      付款方式：
      <b>僅收現金</b>
    </p>


    <div
      style="
        background:#fff;
        border:1px solid var(--line);
        border-radius:12px;
        padding:12px
      "
    >

      ${
        cart
          .map(
            x =>
              `
              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:8px 0;
                  border-bottom:1px solid #f2e8df
                "
              >

                <span>

                  <b>
                    ${x.name}
                  </b>

                  × ${x.qty}

                  <small
                    style="
                      display:block;
                      color:#888
                    "
                  >
                    ${x.sweet}・${x.ice}
                  </small>

                </span>

                <b>
                  $${x.price * x.qty}
                </b>

              </div>
              `
          )
          .join("")
      }

    </div>


    <div
      class="form"
      style="margin-top:15px"
    >

      <label>
        取餐人姓名
      </label>

      <input
        id="customer"
        placeholder="請輸入姓名"
      >


      <label>
        聯絡電話
      </label>

      <input
        id="phone"
        type="tel"
        inputmode="tel"
        placeholder="請輸入手機或電話"
      >


      <label>
        取餐時間
      </label>


      <!--
        重要：
        不使用 input。
        使用 select，
        客人不能自行輸入時間。
      -->

      <select
        id="pickupDateTime"
        aria-label="取餐日期與時間"
        style="
          width:100%;
          border:1px solid var(--line);
          border-radius:9px;
          padding:10px;
          background:#fff;
          outline:none;
          font-size:16px;
        "
      >

        <option value="">
          請選擇取餐時間
        </option>

      </select>


      <div
        style="
          margin-top:8px;
          padding:11px 12px;
          background:#fff8ef;
          border:1px solid #ead8c6;
          border-radius:10px;
          color:#7a675b;
          font-size:14px;
          line-height:1.6
        "
      >

        如訂購杯數較多，需較長製作時間，
        請提早訂購或來電詢問，謝謝。

      </div>


      <div
        style="
          margin-top:8px;
          padding:10px 12px;
          background:#f7f1ea;
          border-radius:10px;
          color:#6e5a4e;
          font-size:13px;
          line-height:1.6
        "
      >

        目前共
        <b>${cart.reduce((sum, item) => sum + item.qty, 0)} 杯</b>，
        系統預留製作時間約
        <b>${delay} 分鐘</b>。

        <br>

        請從下方選擇可取餐時間。

      </div>


      <label>
        訂單備注
      </label>

      <textarea
        id="remark"
        rows="3"
        placeholder="例如：到店後請告知取餐、其他需求…"
      ></textarea>


      <label>
        統一編號（選填）
      </label>

      <input
        id="taxId"
        placeholder="如需統編請填寫"
      >

    </div>


    <div class="actions">

      <button
        onclick="closeModal()"
      >
        返回修改
      </button>


      <button
        class="primary"
        onclick="placeOrder()"
      >
        送出訂單
      </button>

    </div>
    `;


  /*
    產生下拉選單
  */

  buildPickupTimeOptions();


  document
    .getElementById("modal")
    .classList.add("open");

}



/* =========================================================
   送出訂單
   ========================================================= */

async function placeOrder() {

  const name =
    document
      .getElementById("customer")
      .value
      .trim();


  const phone =
    document
      .getElementById("phone")
      .value
      .trim();


  const pickupSelect =
    document.getElementById(
      "pickupDateTime"
    );


  /*
    送出前再次重新產生時間，
    避免客人在確認視窗停留太久，
    導致原本的時間已經太接近。
  */

  const selectedPickupTime =
    pickupSelect
      ? pickupSelect.value
      : "";


  buildPickupTimeOptions();


  const pickupDateTime =
    document
      .getElementById(
        "pickupDateTime"
      )
      .value
      .trim();


  const note =
    document
      .getElementById("remark")
      .value
      .trim();


  const taxId =
    document
      .getElementById("taxId")
      .value
      .trim();


  if (!name || !phone) {

    toast(
      "請填寫取餐人姓名與電話"
    );

    return;

  }


  if (!pickupDateTime) {

    toast(
      "請選擇取餐時間"
    );

    return;

  }


  if (!cart.length) {

    toast(
      "請至少選擇一杯茶"
    );

    return;

  }


  /*
    再做一次最終檢查。

    如果客人停留時間太久，
    系統會重新計算現在最早可以取餐的時間。
  */

  const delay =
    getPickupDelayMinutes();


  const now =
    new Date();


  const earliest =
    new Date(
      now.getTime() +
      delay * 60 * 1000
    );


  const remainder =
    earliest.getMinutes() % 5;


  if (remainder !== 0) {

    earliest.setMinutes(
      earliest.getMinutes() +
      (5 - remainder)
    );

  }


  earliest.setSeconds(
    0
  );

  earliest.setMilliseconds(
    0
  );


  /*
    將客人選擇的 MM/DD HH:mm
    轉換成今年的 Date，
    用來確認沒有選到過早時間。
  */

  const match =
    pickupDateTime.match(
      /^(\d{1,2})\/(\d{1,2})\s+(\d{2}):(\d{2})$/
    );


  if (!match) {

    toast(
      "取餐時間格式錯誤，請重新選擇"
    );

    return;

  }


  const selectedMonth =
    Number(match[1]);


  const selectedDay =
    Number(match[2]);


  const selectedHour =
    Number(match[3]);


  const selectedMinute =
    Number(match[4]);


  const selectedDate =
    new Date(
      now.getFullYear(),
      selectedMonth - 1,
      selectedDay,
      selectedHour,
      selectedMinute,
      0,
      0
    );


  /*
    如果選到的時間早於系統允許時間，
    不允許送出。
  */

  if (
    selectedDate.getTime() <
    earliest.getTime()
  ) {

    toast(
      "取餐時間已不足製作時間，請重新選擇"
    );


    buildPickupTimeOptions();


    return;

  }


  const payload = {

    customer: {

      name,

      phone,

      pickupDateTime,

      note,

      taxId

    },


    items:

      cart.map(
        x => ({

          name:
            x.name,

          price:
            x.price,

          quantity:
            x.qty

        })
      )

  };


  try {

    const response =
      await fetch(
        "/api/orders",
        {

          method:
            "POST",

          headers:
            {
              "Content-Type":
                "application/json"
            },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.ok
    ) {

      throw new Error(
        data.message ||
        "訂單送出失敗"
      );

    }


    localStorage.setItem(
      "teaHouseOrderId",
      data.orderId
    );


    cart = [];


    closeModal();


    renderCart();


    showOrderStatus({

      id:
        data.orderId,

      status:
        "new",

      estimatedPickupTime:
        data.estimatedPickupTime

    });


    connectCustomerOrder(
      data.orderId
    );


  } catch (error) {

    console.error(
      error
    );


    toast(
      error.message ||
      "訂單送出失敗，請稍後再試"
    );

  }

}



/* =========================================================
   訂單狀態
   ========================================================= */

function showOrderStatus(
  order
) {

  const box =
    document.getElementById(
      "orderStatus"
    );


  const text =
    document.getElementById(
      "orderStatusText"
    );


  if (!box || !text) {

    return;

  }


  box.style.display =
    "block";


  if (
    order.status ===
      "confirmed" &&
    order.pickupTime
  ) {

    text.innerHTML =

      "🟢 店家已確認取餐時間<br>" +

      "<strong style='font-size:24px;color:#217a2d'>" +

      escapeHtml(
        order.pickupTime
      ) +

      "</strong><br>" +

      "請依確認時間到店取餐，謝謝！";


    return;

  }


  if (
    order.estimatedPickupTime
  ) {

    const t =
      new Date(
        order.estimatedPickupTime
      );


    const time =
      t.toLocaleTimeString(
        "zh-TW",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",

          hour12:
            false
        }
      );


    text.innerHTML =

      "⏳ 訂單已送出，等待店家確認<br>" +

      "系統預估約 <strong>" +

      time +

      "</strong> 可取餐";


  } else {

    text.textContent =
      "⏳ 訂單已送出，等待店家確認取餐時間";

  }

}



/* =========================================================
   HTML 安全處理
   ========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}



/* =========================================================
   客人即時訂單通知
   ========================================================= */

let customerOrderStream =
  null;



function connectCustomerOrder(
  orderId
) {

  if (
    customerOrderStream
  ) {

    customerOrderStream.close();

  }


  customerOrderStream =
    new EventSource(
      "/api/orders/" +
      encodeURIComponent(
        orderId
      ) +
      "/stream"
    );


  customerOrderStream.onmessage =
    event => {

      try {

        const data =
          JSON.parse(
            event.data
          );


        if (
          data.type ===
            "order-updated" &&
          data.order
        ) {

          showOrderStatus(
            data.order
          );


          if (
            data.order.status ===
              "confirmed" &&
            data.order.pickupTime
          ) {

            toast(
              "🔔 店家已確認取餐時間：" +
              data.order.pickupTime
            );

          }

        }

      } catch (error) {

        console.error(
          "客人訂單通知錯誤",
          error
        );

      }

    };


  customerOrderStream.onerror =
    () => {

      /*
        EventSource
        會自動重新連線
      */

    };

}



/* =========================================================
   恢復客人訂單
   ========================================================= */

function restoreCustomerOrder() {

  const orderId =
    localStorage.getItem(
      "teaHouseOrderId"
    );


  if (orderId) {

    connectCustomerOrder(
      orderId
    );

  }

}



/* =========================================================
   關於我們
   ========================================================= */

function showAbout() {

  document.getElementById(
    "panel"
  ).innerHTML =

    `
    <h2>
      關於藥師的私房紅茶
    </h2>

    <p>
      週三－週日 11:00－22:00
    </p>

    <p>
      📍 700 臺南市中西區小西門里府前路一段373號
    </p>

    <p>
      ☎ 06-2135250
    </p>

    <p>
      本店採現點現做，
      線上訂餐僅提供到店自取，
      付款方式為現金。
    </p>

    <div class="actions">

      <button
        class="primary"
        onclick="closeModal()"
      >
        關閉
      </button>

    </div>
    `;


  document
    .getElementById("modal")
    .classList.add("open");

}



/* =========================================================
   關閉視窗
   ========================================================= */

function closeModal() {

  document
    .getElementById("modal")
    .classList.remove("open");

}



/* =========================================================
   Toast
   ========================================================= */

function toast(t) {

  const e =
    document.getElementById(
      "toast"
    );


  if (!e) {

    return;

  }


  e.textContent =
    t;


  e.classList.add(
    "show"
  );


  setTimeout(
    () =>
      e.classList.remove(
        "show"
      ),
    1900
  );

}



/* =========================================================
   搜尋
   ========================================================= */

const searchElement =
  document.getElementById(
    "search"
  );


if (searchElement) {

  searchElement.addEventListener(
    "input",
    e =>
      renderMenu(
        "全部",
        e.target.value
      )
  );

}



/* =========================================================
   點擊 Modal 外部關閉
   ========================================================= */

const modalElement =
  document.getElementById(
    "modal"
  );


if (modalElement) {

  modalElement.addEventListener(
    "click",
    e => {

      if (
        e.target.id ===
        "modal"
      ) {

        closeModal();

      }

    }
  );

}



/* =========================================================
   初始化
   ========================================================= */

renderNav();

renderMenu();

renderOptions();

renderCart();

restoreCustomerOrder();
