/* =========================================================
   LINE LIFF
   ========================================================= */

const LIFF_ID = "2011294905-ICLoZzNA";

let liffInitPromise = Promise.resolve();
let lineIdToken = "";
let lineEnvironment = false;

/*
 * 重要：這裡「絕對不呼叫 liff.login()」。
 *
 * 客人從官方 LINE 的 LIFF 入口進來時，LIFF 會在 LINE 內完成初始化，
 * 我們只取得目前使用者的 ID Token，讓下單完成後 Server 可以通知本人。
 *
 * 如果客人直接輸入 Render 網址，網站仍可正常點餐；只是沒有 LINE 身分，
 * 因此無法把完成通知推回該客人的 LINE。
 */
if (window.liff) {
  liffInitPromise = liff
    .init({ liffId: LIFF_ID })
    .then(() => {
      try {
        lineEnvironment = liff.isInClient();
        if (liff.isLoggedIn()) {
          lineIdToken = liff.getIDToken() || "";
        }
      } catch (e) {
        console.warn("LINE LIFF 使用者資訊取得失敗：", e);
        lineIdToken = "";
      }
    })
    .catch(e => {
      console.warn("LINE LIFF 初始化失敗：", e);
      lineIdToken = "";
      lineEnvironment = false;
    });
}


/* =========================================================
   藥師的私房紅茶｜前台 app.js
   ========================================================= */

const products = [

  {
    id: 1,
    category: "紅茶系列",
    name: "老樹麥香",
    subtitle: "古早味麥香紅茶",
    price: 30
  },

  {
    id: 2,
    category: "紅茶系列",
    name: "菁玉紅茶",
    subtitle: "英式下午茶(伯爵)",
    price: 45
  },

  {
    id: 3,
    category: "紅茶系列",
    name: "蜜香紅茶",
    subtitle: "（不是加蜂蜜）茶葉回甘帶有熟蜜的香氣",
    price: 45
  },

  {
    id: 4,
    category: "紅茶系列",
    name: "觀音紅茶",
    subtitle: "帶有鐵觀音風味的紅茶",
    price: 45
  },

  {
    id: 5,
    category: "紅茶系列",
    name: "紫霞仙子紅茶",
    subtitle: "阿薩姆基底，獨特果香，醇厚回甘",
    price: 50
  },

  {
    id: 6,
    category: "紅茶系列",
    name: "藥師皇茶",
    subtitle: "獨特的山林木質香氣",
    price: 55
  },

  {
    id: 7,
    category: "紅茶系列",
    name: "台茶十八號（紅玉）",
    subtitle: "茶香獨特，口感濃郁強烈",
    price: 75
  },

  {
    id: 8,
    category: "鮮奶茶系列",
    name: "招牌鮮奶茶",
    subtitle: "特製奶茶茶湯，類似麥香奶茶",
    price: 50
  },

  {
    id: 9,
    category: "鮮奶茶系列",
    name: "菁玉鮮奶茶",
    subtitle: "英式鮮奶茶(伯爵)",
    price: 50
  },

  {
    id: 10,
    category: "鮮奶茶系列",
    name: "蜜香鮮奶茶",
    subtitle: "（不是加蜂蜜）茶葉回甘帶有熟蜜的香氣",
    price: 50
  },

  {
    id: 11,
    category: "鮮奶茶系列",
    name: "觀音鮮奶茶",
    subtitle: "讓人耳目一新的特別風味",
    price: 55
  },

  {
    id: 12,
    category: "鮮奶茶系列",
    name: "阿薩姆鮮奶茶",
    subtitle: "阿薩姆品種獨特的甘醇芳香",
    price: 55
  },

  {
    id: 13,
    category: "鮮奶茶系列",
    name: "戰豆奶茶",
    subtitle: "非基改豆漿＋紅茶",
    price: 50
  }

];


/* =========================================================
   甜度 / 冰度
   ========================================================= */

const sweetnessOptions = [
  "無糖",
  "一分",
  "三分",
  "五分",
  "八分",
  "十分"
];

const iceOptions = [
  "去冰",
  "微冰",
  "少冰",
  "正常冰"
];


/* =========================================================
   購物車
   ========================================================= */

const cart = [];

let bag1Count = 0;
let bag2Count = 0;


/* =========================================================
   DOM
   ========================================================= */

function qs(selector) {
  return document.querySelector(selector);
}


/* =========================================================
   金額
   ========================================================= */

function money(number) {
  return `$${number}`;
}


/* =========================================================
   商品卡片
   ========================================================= */

function productCard(product) {

  return `
    <article class="card">

      <div>

        <h3>
          ${product.name}
        </h3>

        <p>
          ${product.subtitle}
        </p>

        <div class="price">
          ${money(product.price)}
        </div>

      </div>

      <button
        class="choose"
        data-add="${product.id}"
        type="button"
      >
        ＋ 選擇
      </button>

    </article>
  `;

}


/* =========================================================
   商品列表
   ========================================================= */

function render(filter = "全部") {

  const blackTea = qs("#blackTea");
  const milkTea = qs("#milkTea");
  const blackTeaSection = qs("#blackTeaSection");
  const milkTeaSection = qs("#milkTeaSection");

  if (blackTea) {
    blackTea.innerHTML = "";
  }

  if (milkTea) {
    milkTea.innerHTML = "";
  }

  // 分類切換時，連同「系列標題區塊」一起顯示／隱藏。
  // 避免選「紅茶系列」時底下仍出現「鮮奶茶系列」，反之亦然。
  if (blackTeaSection) {
    blackTeaSection.style.display =
      filter === "全部" || filter === "紅茶系列" ? "" : "none";
  }

  if (milkTeaSection) {
    milkTeaSection.style.display =
      filter === "全部" || filter === "鮮奶茶系列" ? "" : "none";
  }


  const groups = {
    "紅茶系列": "#blackTea",
    "鮮奶茶系列": "#milkTea"
  };


  products
    .filter(
      product =>
        filter === "全部" ||
        product.category === filter
    )
    .forEach(
      product => {

        const target =
          groups[product.category];

        const container =
          qs(target);

        if (!container) {
          return;
        }

        container.insertAdjacentHTML(
          "beforeend",
          productCard(product)
        );

      }
    );


  document
    .querySelectorAll("[data-add]")
    .forEach(button => {

      button.onclick = () => {

        add(
          Number(
            button.dataset.add
          )
        );

      };

    });


  document
    .querySelectorAll(".tabs button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.filter === filter
      );

    });

}


/* =========================================================
   商品選擇
   ========================================================= */

function add(id) {

  const product =
    products.find(
      item =>
        item.id === id
    );

  if (!product) {
    return;
  }

  showProductOptions(product);

}


/* =========================================================
   商品選項視窗
   ========================================================= */

function showProductOptions(product) {

  const oldModal =
    document.querySelector(
      "#productOptionsModal"
    );

  if (oldModal) {
    oldModal.remove();
  }


  let quantity = 1;


  const modal =
    document.createElement(
      "div"
    );

  modal.id =
    "productOptionsModal";


  modal.innerHTML = `

    <div
      style="
        position:fixed;
        inset:0;
        z-index:9999;
        background:rgba(0,0,0,.55);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        box-sizing:border-box;
      "
    >

      <div
        role="dialog"
        aria-modal="true"
        style="
          width:min(520px,100%);
          max-height:90vh;
          overflow:auto;
          background:#fff;
          border-radius:24px;
          padding:24px;
          box-shadow:0 20px 60px rgba(0,0,0,.3);
          box-sizing:border-box;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:12px;
            margin-bottom:20px;
          "
        >

          <div>

            <h2
              style="
                margin:0 0 6px;
                font-size:25px;
                color:#2b211d;
              "
            >
              ${product.name}
            </h2>

            <div
              style="
                color:#8a756b;
                font-size:15px;
              "
            >
              ${product.subtitle}
            </div>

            <div
              style="
                margin-top:8px;
                color:#a93226;
                font-size:22px;
                font-weight:700;
              "
            >
              ${money(product.price)}／杯
            </div>

          </div>

          <button
            type="button"
            data-product-options-close
            aria-label="關閉"
            style="
              border:0;
              background:#f1ebe6;
              width:42px;
              height:42px;
              border-radius:50%;
              font-size:25px;
              cursor:pointer;
              flex:none;
            "
          >
            ×
          </button>

        </div>


        <!-- 數量 -->

        <div
          style="
            padding:16px;
            background:#faf6f1;
            border-radius:16px;
          "
        >

          <div
            style="
              font-weight:700;
              font-size:18px;
              color:#2b211d;
              margin-bottom:12px;
            "
          >
            數量
          </div>

          <div
            style="
              display:flex;
              align-items:center;
              gap:16px;
            "
          >

            <button
              type="button"
              data-option-minus
              style="
                width:54px;
                height:50px;
                border:1px solid #dccfc2;
                border-radius:12px;
                background:#fff;
                font-size:26px;
                cursor:pointer;
              "
            >
              −
            </button>

            <strong
              data-option-quantity
              style="
                min-width:42px;
                text-align:center;
                font-size:23px;
              "
            >
              1
            </strong>

            <button
              type="button"
              data-option-plus
              style="
                width:54px;
                height:50px;
                border:1px solid #dccfc2;
                border-radius:12px;
                background:#fff;
                font-size:26px;
                cursor:pointer;
              "
            >
              ＋
            </button>

          </div>

        </div>


        <!-- 甜度 -->

        <label
          style="
            display:block;
            font-weight:700;
            font-size:18px;
            color:#2b211d;
            margin:18px 0 8px;
          "
        >
          甜度
        </label>

        <select
          data-option-sweetness
          style="
            width:100%;
            padding:14px;
            box-sizing:border-box;
            border:1px solid #dccfc2;
            border-radius:12px;
            background:#fff;
            font-size:17px;
          "
        >

          ${sweetnessOptions
            .map(
              value =>
                `
                <option value="${value}">
                  ${value}
                </option>
                `
            )
            .join("")}

        </select>


        <!-- 冰塊 -->

        <label
          style="
            display:block;
            font-weight:700;
            font-size:18px;
            color:#2b211d;
            margin:18px 0 8px;
          "
        >
          冰塊
        </label>

        <select
          data-option-ice
          style="
            width:100%;
            padding:14px;
            box-sizing:border-box;
            border:1px solid #dccfc2;
            border-radius:12px;
            background:#fff;
            font-size:17px;
          "
        >

          ${iceOptions
            .map(
              value =>
                `
                <option value="${value}">
                  ${value}
                </option>
                `
            )
            .join("")}

        </select>


        <!-- 按鈕 -->

        <div
          style="
            display:flex;
            gap:12px;
            margin-top:24px;
          "
        >

          <button
            type="button"
            data-product-options-cancel
            style="
              flex:1;
              padding:15px;
              border:1px solid #dccfc2;
              border-radius:14px;
              background:#fff;
              color:#5b4a42;
              font-size:18px;
              font-weight:700;
              cursor:pointer;
            "
          >
            取消
          </button>

          <button
            type="button"
            data-product-options-add
            style="
              flex:1;
              padding:15px;
              border:0;
              border-radius:14px;
              background:#a93226;
              color:#fff;
              font-size:18px;
              font-weight:700;
              cursor:pointer;
            "
          >
            加入購物車
          </button>

        </div>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  const quantityElement =
    modal.querySelector(
      "[data-option-quantity]"
    );

  const sweetnessSelect =
    modal.querySelector(
      "[data-option-sweetness]"
    );

  const iceSelect =
    modal.querySelector(
      "[data-option-ice]"
    );


  const updateQuantity =
    () => {

      quantityElement.textContent =
        quantity;

    };


  const close =
    () => {

      modal.remove();

    };


  modal
    .querySelector(
      "[data-option-minus]"
    )
    .onclick = () => {

      quantity =
        Math.max(
          1,
          quantity - 1
        );

      updateQuantity();

    };


  modal
    .querySelector(
      "[data-option-plus]"
    )
    .onclick = () => {

      quantity =
        Math.min(
          99,
          quantity + 1
        );

      updateQuantity();

    };


  modal
    .querySelector(
      "[data-product-options-close]"
    )
    .onclick = close;


  modal
    .querySelector(
      "[data-product-options-cancel]"
    )
    .onclick = close;


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modal.firstElementChild
      ) {

        close();

      }

    }
  );


  modal
    .querySelector(
      "[data-product-options-add]"
    )
    .onclick = () => {

      addConfiguredProduct(
        product,
        quantity,
        sweetnessSelect.value,
        iceSelect.value
      );

      close();

    };

}


/* =========================================================
   加入購物車
   ========================================================= */

function addConfiguredProduct(
  product,
  quantity,
  sweetness,
  ice
) {

  const found =
    cart.find(
      item =>
        item.id === product.id &&
        item.sweetness === sweetness &&
        item.ice === ice
    );


  if (found) {

    found.quantity +=
      quantity;

  } else {

    cart.push({

      id:
        product.id,

      name:
        product.name,

      subtitle:
        product.subtitle,

      price:
        product.price,

      quantity:
        quantity,

      sweetness:
        sweetness,

      ice:
        ice

    });

  }


  updateCart();

  renderCart();

  toast(
    `${product.name} × ${quantity} 已加入訂單`
  );

}


/* =========================================================
   計算飲料杯數
   ========================================================= */

function getDrinkCount() {

  return cart.reduce(
    (
      sum,
      item
    ) => {

      return (
        sum +
        Math.max(
          0,
          Number(
            item.quantity || 0
          )
        )
      );

    },
    0
  );

}


/* =========================================================
   製作時間
   ========================================================= */

function getPreparationMinutes() {

  const cups =
    getDrinkCount();


  if (cups <= 2) {
    return 15;
  }

  if (cups <= 4) {
    return 20;
  }

  if (cups <= 6) {
    return 25;
  }

  if (cups <= 8) {
    return 30;
  }

  if (cups <= 10) {
    return 40;
  }

  if (cups <= 15) {
    return 50;
  }

  return 60;

}


/* =========================================================
   時間補 0
   ========================================================= */

function pad(number) {

  return String(
    number
  ).padStart(
    2,
    "0"
  );

}


/* =========================================================
   營業日
   週三～週日
   週一、週二公休
   ========================================================= */

function isBusinessDay(date) {

  const day =
    date.getDay();

  return (
    day !== 1 &&
    day !== 2
  );

}


/* =========================================================
   日期顯示
   ========================================================= */

function formatDate(date) {

  const weekdayNames = [
    "日",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六"
  ];

  return `
    ${date.getMonth() + 1}/${date.getDate()}
    （週${weekdayNames[date.getDay()]}）
  `;

}


/* =========================================================
   建立日期時間
   ========================================================= */

function createDateTime(
  date,
  hour,
  minute
) {

  const result =
    new Date(date);

  result.setHours(
    hour,
    minute,
    0,
    0
  );

  return result;

}


/* =========================================================
   取得下一個營業日
   ========================================================= */

function getNextBusinessDay(
  date
) {

  const result =
    new Date(date);

  do {

    result.setDate(
      result.getDate() + 1
    );

  } while (
    !isBusinessDay(result)
  );

  return result;

}


/* =========================================================
   取餐時間
   ========================================================= */

function updatePickupTimeOptions() {

  const input =
    document.querySelector(
      '[name="pickupDateTime"]'
    );


  if (!input) {
    return;
  }


  let select =
    input;


  if (
    input.tagName.toLowerCase() !==
    "select"
  ) {

    select =
      document.createElement(
        "select"
      );


    if (input.className) {

      select.className =
        input.className;

    }


    select.id =
      input.id ||
      "pickupDateTime";


    select.name =
      "pickupDateTime";


    select.required =
      true;


    input.replaceWith(
      select
    );

  }


  const oldValue =
    select.value;


  const now =
    new Date();


  const today =
    new Date(now);


  today.setHours(
    0,
    0,
    0,
    0
  );


  select.innerHTML =
    "";


  const firstOption =
    document.createElement(
      "option"
    );


  firstOption.value =
    "";


  firstOption.textContent =
    "請選擇今天的取餐時間";


  select.appendChild(
    firstOption
  );


  if (
    !isBusinessDay(today)
  ) {

    firstOption.textContent =
      "今日公休，無法下單";

    return;

  }


  const orderCutoff =
    createDateTime(
      today,
      21,
      30
    );


  if (
    now > orderCutoff
  ) {

    firstOption.textContent =
      "今日已停止接單";

    return;

  }


  const preparationMinutes =
    getPreparationMinutes();


  let earliestToday =
    new Date(
      now.getTime() +
      preparationMinutes *
      60000
    );


  const remainder =
    earliestToday.getMinutes() %
    5;


  if (
    remainder !== 0
  ) {

    earliestToday.setMinutes(
      earliestToday.getMinutes() +
      (5 - remainder)
    );

  }


  earliestToday.setSeconds(
    0,
    0
  );


  /*
    最早取餐時間：
    10 杯以內 → 11:30
    超過 10 杯 → 12:00

    同時保留原本的製作時間計算：
    如果下單當下已經晚於上述時間，
    就以「目前時間＋製作時間」為準。
  */

  const drinkCount =
    getDrinkCount();

  const earliestHour =
    drinkCount <= 10
      ? 11
      : 12;

  const earliestMinute =
    drinkCount <= 10
      ? 30
      : 0;

  const openingTime =
    createDateTime(
      today,
      earliestHour,
      earliestMinute
    );


  if (
    earliestToday <
    openingTime
  ) {

    earliestToday =
      openingTime;

  }


  const lastPickupTime =
    createDateTime(
      today,
      21,
      40
    );


  if (
    earliestToday >
    lastPickupTime
  ) {

    firstOption.textContent =
      "今日已無可預約取餐時間";

    return;

  }


  const dateGroup =
    document.createElement(
      "optgroup"
    );


  dateGroup.label =
    `${formatDate(today)}｜今天`;


  for (
    let time =
      new Date(
        earliestToday
      );

    time <=
    lastPickupTime;

    time.setMinutes(
      time.getMinutes() + 5
    )
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      `${today.getMonth() + 1}/${today.getDate()} ${pad(time.getHours())}:${pad(time.getMinutes())}`;


    option.textContent =
      `${pad(time.getHours())}:${pad(time.getMinutes())}`;


    dateGroup.appendChild(
      option
    );

  }


  select.appendChild(
    dateGroup
  );


  if (oldValue) {

    const option =
      Array
        .from(
          select.options
        )
        .find(
          item =>
            item.value ===
            oldValue
        );


    if (option) {

      select.value =
        oldValue;

    }

  }


  select.style.width =
    "100%";

  select.style.padding =
    "12px";

  select.style.borderRadius =
    "10px";

  select.style.border =
    "1px solid #dccfc2";

  select.style.background =
    "#fff";

  select.style.fontSize =
    "16px";

}


/* =========================================================
   更新購物車數量
   ========================================================= */

function updateCart() {

  const cartCount =
    qs("#cartCount");


  if (cartCount) {

    cartCount.textContent =
      getDrinkCount();

  }


  const dialog =
    qs("#cartDialog");


  if (
    dialog &&
    dialog.open
  ) {

    updatePickupTimeOptions();

  }

}


/* =========================================================
   顯示購物車
   ========================================================= */

function renderCart() {

  const box =
    qs("#cartItems");


  if (!box) {
    return;
  }


  if (!cart.length) {

    box.innerHTML =
      `
      <p>
        目前還沒有選擇商品。
      </p>
      `;


    const total =
      qs("#cartTotal");


    if (total) {

      total.textContent =
        "$0";

    }


    return;

  }


  box.innerHTML =
    cart
      .map(
        (
          item,
          index
        ) =>

          `
          <div class="cart-row">

            <strong>
              ${item.name}
            </strong>

            　
            ${money(item.price)}

            <div class="cart-controls">

              <button
                type="button"
                data-minus="${index}"
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                type="button"
                data-plus="${index}"
              >
                ＋
              </button>

              <select
                data-sweet="${index}"
              >

                ${sweetnessOptions
                  .map(
                    value =>
                      `
                      <option
                        value="${value}"
                        ${
                          item.sweetness ===
                          value
                            ? "selected"
                            : ""
                        }
                      >
                        ${value}
                      </option>
                      `
                  )
                  .join("")}

              </select>

              <select
                data-ice="${index}"
              >

                ${iceOptions
                  .map(
                    value =>
                      `
                      <option
                        value="${value}"
                        ${
                          item.ice ===
                          value
                            ? "selected"
                            : ""
                        }
                      >
                        ${value}
                      </option>
                      `
                  )
                  .join("")}

              </select>

            </div>

          </div>
          `
      )
      .join("");


  const drinkTotal =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  const bagTotal =
    bag1Count * 1 +
    bag2Count * 2;


  const total =
    drinkTotal +
    bagTotal;


  const totalElement =
    qs("#cartTotal");


  if (totalElement) {

    totalElement.textContent =
      money(total);

  }


  /*
    減少
  */

  document
    .querySelectorAll(
      "[data-minus]"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const index =
              Number(
                button.dataset.minus
              );


            cart[index].quantity -=
              1;


            if (
              cart[index].quantity <=
              0
            ) {

              cart.splice(
                index,
                1
              );

            }


            renderCart();

            updateCart();

          };

      }
    );


  /*
    增加
  */

  document
    .querySelectorAll(
      "[data-plus]"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const index =
              Number(
                button.dataset.plus
              );


            cart[index].quantity +=
              1;


            renderCart();

            updateCart();

          };

      }
    );


  /*
    甜度
  */

  document
    .querySelectorAll(
      "[data-sweet]"
    )
    .forEach(
      select => {

        select.onchange =
          () => {

            const index =
              Number(
                select.dataset.sweet
              );


            cart[index].sweetness =
              select.value;

            renderCart();

          };

      }
    );


  /*
    冰塊
  */

  document
    .querySelectorAll(
      "[data-ice]"
    )
    .forEach(
      select => {

        select.onchange =
          () => {

            const index =
              Number(
                select.dataset.ice
              );


            cart[index].ice =
              select.value;

            renderCart();

          };

      }
    );

}


/* =========================================================
   開啟購物車
   ========================================================= */

const cartButton =
  qs("#cartButton");


if (cartButton) {

  cartButton.onclick =
    () => {

      renderCart();

      updatePickupTimeOptions();


      const dialog =
        qs("#cartDialog");


      if (
        dialog &&
        typeof dialog.showModal ===
          "function"
      ) {

        dialog.showModal();

      }

    };

}


/* =========================================================
   關閉購物車
   ========================================================= */

const closeCart =
  qs("#closeCart");


if (closeCart) {

  closeCart.onclick =
    () => {

      const dialog =
        qs("#cartDialog");


      if (dialog) {

        dialog.close();

      }

    };

}


/* =========================================================
   點擊 Dialog 外部關閉
   ========================================================= */

const cartDialog =
  qs("#cartDialog");


if (cartDialog) {

  cartDialog.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        cartDialog
      ) {

        cartDialog.close();

      }

    }
  );

}


/* =========================================================
   購物袋
   ========================================================= */

function changeBag(
  type,
  amount
) {

  if (
    type ===
    "bag1"
  ) {

    bag1Count =
      Math.max(
        0,
        bag1Count +
        amount
      );


    const element =
      qs("#bag1Count");


    if (element) {

      element.textContent =
        bag1Count;

    }

  }


  if (
    type ===
    "bag2"
  ) {

    bag2Count =
      Math.max(
        0,
        bag2Count +
        amount
      );


    const element =
      qs("#bag2Count");


    if (element) {

      element.textContent =
        bag2Count;

    }

  }


  renderCart();

}


/* =========================================================
   下單完成通知
   ========================================================= */
function showOrderSuccess(orderId, total, pickupDateTime) {
  const modal = qs("#orderSuccessModal");
  const orderIdEl = qs("#successOrderId");
  const pickupEl = qs("#successPickupTime");
  const totalEl = qs("#successOrderTotal");

  if (!modal) return;

  if (orderIdEl) orderIdEl.textContent = orderId || "—";
  if (pickupEl) pickupEl.textContent = pickupDateTime || "—";
  if (totalEl) totalEl.textContent = money(Number(total) || 0);

  // 關閉購物車確認視窗，完成通知改用原生 <dialog> 的 Top Layer，
  // 因此會真正浮在整個網頁最上層，不會被排到頁面最下面。
  const cartDialog = qs("#cartDialog");
  if (cartDialog && typeof cartDialog.close === "function" && cartDialog.open) {
    cartDialog.close();
  }

  if (typeof modal.showModal === "function") {
    if (!modal.open) modal.showModal();
  } else {
    // 舊瀏覽器 fallback
    modal.setAttribute("open", "");
    modal.classList.add("show");
  }

  document.body.style.overflow = "hidden";
}

function hideOrderSuccess() {
  const modal = qs("#orderSuccessModal");
  if (!modal) return;

  if (typeof modal.close === "function" && modal.open) {
    modal.close();
  } else {
    modal.removeAttribute("open");
    modal.classList.remove("show");
  }

  document.body.style.overflow = "";
}

const closeSuccessModal = qs("#closeSuccessModal");
if (closeSuccessModal) {
  closeSuccessModal.onclick = hideOrderSuccess;
}

const successModal = qs("#orderSuccessModal");
if (successModal) {
  // 點擊原生 dialog backdrop 時關閉；按鈕則正常關閉。
  successModal.addEventListener("click", event => {
    if (event.target === successModal) hideOrderSuccess();
  });
}


/* =========================================================
   送出訂單
   ========================================================= */

const orderForm =
  qs("#orderForm");

const phoneInput = orderForm && orderForm.querySelector('[name="phone"]');




if (orderForm) {

  orderForm.onsubmit =
    async event => {

      event.preventDefault();


      /*
        沒有商品不能送出
      */

      if (!cart.length) {

        toast(
          "請先選擇商品"
        );

        return;

      }


      /*
        今日最後下單時間 21:30
      */

      const currentTime =
        new Date();


      const currentDate =
        new Date(
          currentTime
        );


      currentDate.setHours(
        0,
        0,
        0,
        0
      );


      const cutoff =
        createDateTime(
          currentDate,
          21,
          30
        );


      if (
        currentTime >
        cutoff
      ) {

        toast(
          "今日已停止接單，最後下單時間為 21:30"
        );

        return;

      }


      /*
        重新計算取餐時間
      */

      updatePickupTimeOptions();


      const formData =
        new FormData(
          orderForm
        );


      const name =
        String(
          formData.get("name") ||
          ""
        ).trim();


      const phone =
        String(
          formData.get("phone") ||
          ""
        ).trim();


      const pickupDateTime =
        String(
          formData.get(
            "pickupDateTime"
          ) ||
          ""
        ).trim();


      const note =
        String(
          formData.get("note") ||
          ""
        ).trim();


      /*
        基本檢查
      */

      if (!name) {

        toast(
          "請輸入姓名"
        );

        return;

      }


      if (!/^\d{10}$/.test(phone)) {
        const phoneInput = orderForm.querySelector('[name="phone"]');
        if (phoneInput) {
          phoneInput.setCustomValidity(" ");
          phoneInput.reportValidity();
          phoneInput.setCustomValidity("");
        }
        return;
      }


      if (!pickupDateTime) {

        toast(
          "請選擇取餐日期與時間"
        );

        return;

      }


      /*
        如果是從 LINE LIFF 開啟，先等 LIFF 初始化完成。
        一般瀏覽器則直接繼續，不影響原本點餐。
      */
      try {
        await liffInitPromise;
      } catch (e) {
        console.warn("LIFF 初始化等待失敗，繼續一般點餐流程：", e);
      }

      /*
        訂單資料
      */

      const payload = {

        customer: {

          name,

          phone,

          pickupDateTime,

          note

        },


        items:

          cart.map(
            item => ({

              id:
                item.id,

              name:
                item.name,

              price:
                item.price,

              quantity:
                item.quantity,

              sweetness:
                item.sweetness,

              ice:
                item.ice

            })
          ),


        bag1Count,

        bag2Count,


        preparationMinutes:
          getPreparationMinutes(),


        drinkCount:
          getDrinkCount(),

        lineIdToken:
          lineIdToken || ""

      };


      const result =
        qs("#result");


      if (result) {

        result.className =
          "";

        result.textContent =
          "送出中…";

      }


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
          !response.ok
        ) {

          throw new Error(
            data.message ||
            "訂單送出失敗"
          );

        }


        /*
          顯示成功
        */

        /*
          改成跳出「完成下單通知」視窗，
          不再只把成功訊息顯示在訂單視窗底部。
        */
        if (result) {
          result.className = "";
          result.textContent = "";
        }

        showOrderSuccess(
          data.orderId || data.orderNumber || "",
          data.total || 0,
          pickupDateTime
        );


        /*
          清空購物車
        */

        cart.length =
          0;


        bag1Count =
          0;


        bag2Count =
          0;


        updateCart();


        /*
          重設表單
        */

        orderForm.reset();


        /*
          購物袋歸零
        */

        const bag1 =
          qs("#bag1Count");


        const bag2 =
          qs("#bag2Count");


        if (bag1) {

          bag1.textContent =
            "0";

        }


        if (bag2) {

          bag2.textContent =
            "0";

        }


        renderCart();


      } catch (error) {

        console.error(
          "訂單送出錯誤：",
          error
        );


        if (result) {

          result.className =
            "error";


          result.textContent =
            error.message ||
            "訂單送出失敗";

        } else {

          toast(
            error.message ||
            "訂單送出失敗"
          );

        }

      }

    };

}


/* =========================================================
   Toast
   ========================================================= */

function toast(text) {

  const element =
    qs("#toast");


  if (!element) {

    return;

  }


  element.textContent =
    text;


  element.classList.add(
    "show"
  );


  setTimeout(
    () => {

      element.classList.remove(
        "show"
      );

    },
    1800
  );

}


/* =========================================================
   分類按鈕
   ========================================================= */

document
  .querySelectorAll(
    ".tabs button"
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          render(
            button.dataset.filter
          );

        };

    }
  );


/* =========================================================
   初始化商品
   ========================================================= */

render();

updateCart();

renderCart();


/* =========================================================
   初始化取餐時間
   ========================================================= */

function initializePickupTimeField() {

  const input =
    document.querySelector(
      '[name="pickupDateTime"]'
    );


  if (!input) {

    return;

  }


  /*
    如果 HTML 原本是 input
    改成 select
  */

  if (
    input.tagName.toLowerCase() !==
    "select"
  ) {

    const select =
      document.createElement(
        "select"
      );


    /*
      保留 class
    */

    if (input.className) {

      select.className =
        input.className;

    }


    /*
      保留 id
    */

    select.id =
      input.id ||
      "pickupDateTime";


    select.name =
      "pickupDateTime";


    select.required =
      true;


    input.replaceWith(
      select
    );

  }


  updatePickupTimeOptions();

}


initializePickupTimeField();


/* =========================================================
   每分鐘重新計算取餐時間
   ========================================================= */

setInterval(
  () => {

    if (
      cart.length > 0
    ) {

      updatePickupTimeOptions();

    }

  },
  60 * 1000
);
