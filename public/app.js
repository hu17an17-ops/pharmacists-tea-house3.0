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


/*
  LINE 綁定為下單必要條件。

  流程：
  1. 客人進入網站
  2. 點「現在點餐」
  3. 前往 LINE Login
  4. 完成 LINE 綁定
  5. 回到點餐頁
  6. 才能開始選擇商品
  7. 下單時再次由前端與後端確認 LINE 身分
*/

let lineLoggedIn = false;
let lineCustomerProfile = null;
let lineBindingReady = false;

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
  const soyTea = qs("#soyTea");

  if (blackTea) {
    blackTea.innerHTML = "";
  }

  if (milkTea) {
    milkTea.innerHTML = "";
  }

  if (soyTea) {
    soyTea.innerHTML = "";
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


  const openingTime =
    createDateTime(
      today,
      11,
      0
    );


  /*
    如果目前還沒到 11:00
    最早取餐從 11:00 開始
  */

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
   計算購物車小計
   ========================================================= */

function getCartSubtotal() {

  return cart.reduce(
    (
      total,
      item
    ) => {

      return (
        total +
        Number(item.price || 0) *
        Number(item.quantity || 0)
      );

    },
    0
  );

}


/* =========================================================
   購物袋費用
   ========================================================= */

function getBagTotal() {

  return (
    Number(bag1Count || 0) * 1 +
    Number(bag2Count || 0) * 2
  );

}


/* =========================================================
   訂單總金額
   ========================================================= */

function getGrandTotal() {

  return (
    getCartSubtotal() +
    getBagTotal()
  );

}


/* =========================================================
   取得客人姓名
   ========================================================= */

function getCustomerName() {

  const input =
    document.querySelector(
      '[name="customerName"]'
    );


  if (!input) {

    return "";

  }


  return input.value.trim();

}


/* =========================================================
   取得客人電話
   ========================================================= */

function getCustomerPhone() {

  const input =
    document.querySelector(
      '[name="customerPhone"]'
    );


  if (!input) {

    return "";

  }


  return input.value.trim();

}


/* =========================================================
   Toast
   ========================================================= */

function toast(
  message
) {

  const old =
    document.querySelector(
      "#appToast"
    );


  if (old) {

    old.remove();

  }


  const element =
    document.createElement(
      "div"
    );


  element.id =
    "appToast";


  element.textContent =
    message;


  element.style.position =
    "fixed";

  element.style.left =
    "50%";

  element.style.bottom =
    "28px";

  element.style.transform =
    "translateX(-50%)";

  element.style.zIndex =
    "20000";

  element.style.padding =
    "13px 20px";

  element.style.borderRadius =
    "14px";

  element.style.background =
    "#2b211d";

  element.style.color =
    "#fff";

  element.style.fontSize =
    "15px";

  element.style.fontWeight =
    "600";

  element.style.boxShadow =
    "0 8px 25px rgba(0,0,0,.2)";


  document.body.appendChild(
    element
  );


  setTimeout(
    () => {

      element.remove();

    },
    2500
  );

}


/* =========================================================
   LINE 登入 / 綁定狀態
   ========================================================= */

async function loadLineStatus() {

  try {

    const response =
      await fetch(
        "/api/line/status",
        {
          method:
            "GET",

          credentials:
            "same-origin",

          cache:
            "no-store"
        }
      );


    if (!response.ok) {

      lineLoggedIn =
        false;

      lineCustomerProfile =
        null;

      lineBindingReady =
        false;

      return {
        loggedIn:
          false,

        bound:
          false
      };

    }


    const data =
      await response.json();


    /*
      相容不同後端欄位名稱
    */

    lineLoggedIn =
      Boolean(
        data.loggedIn ||
        data.login ||
        data.isLoggedIn ||
        data.user
      );


    lineCustomerProfile =
      data.profile ||
      data.customer ||
      data.user ||
      null;


    lineBindingReady =
      Boolean(
        data.bound ||
        data.binding ||
        data.isBound ||
        data.lineBound ||
        data.lineUserId ||
        lineCustomerProfile
      );


    /*
      如果後端明確告知未登入，
      以後端結果為準
    */

    if (
      data.loggedIn === false
    ) {

      lineLoggedIn =
        false;

      lineBindingReady =
        false;

    }


    /*
      如果後端明確告知未綁定，
      以後端結果為準
    */

    if (
      data.bound === false ||
      data.isBound === false
    ) {

      lineBindingReady =
        false;

    }


    return data;


  } catch (
    error
  ) {

    console.error(
      "LINE 狀態取得失敗：",
      error
    );


    lineLoggedIn =
      false;

    lineCustomerProfile =
      null;

    lineBindingReady =
      false;


    return {
      loggedIn:
        false,

      bound:
        false,

      error:
        error.message
    };

  }

}


/* =========================================================
   前往 LINE 綁定
   ========================================================= */

function redirectToLineBinding() {

  const returnTo =
    window.location.pathname +
    window.location.search;


  const url =
    "/api/line/login?return=" +
    encodeURIComponent(
      returnTo
    );


  window.location.href =
    url;

}


/* =========================================================
   確認 LINE 是否已綁定
   ========================================================= */

async function ensureLineBinding() {

  /*
    每次進入點餐流程都重新確認。
    不只相信瀏覽器記憶。
  */

  const status =
    await loadLineStatus();


  const loggedIn =
    Boolean(
      status &&
      (
        status.loggedIn ||
        status.login ||
        status.isLoggedIn
      )
    );


  const bound =
    Boolean(
      status &&
      (
        status.bound ||
        status.binding ||
        status.isBound ||
        status.lineBound ||
        status.lineUserId
      )
    );


  if (
    !loggedIn ||
    !bound
  ) {

    lineLoggedIn =
      false;

    lineBindingReady =
      false;

    lineCustomerProfile =
      null;


    redirectToLineBinding();


    return false;

  }


  lineLoggedIn =
    true;


  lineBindingReady =
    true;


  lineCustomerProfile =
    status.profile ||
    status.customer ||
    status.user ||
    lineCustomerProfile;


  return true;

}


/* =========================================================
   下單前驗證 LINE
   ========================================================= */

async function validateOrder() {

  /*
    沒有 LINE 綁定，
    絕對不允許送出訂單。
  */

  const ready =
    await ensureLineBinding();


  if (!ready) {

    return false;

  }


  return true;

}


/* =========================================================
   建立完整訂單資料
   ========================================================= */

function buildOrderPayload() {

  const customerName =
    getCustomerName();


  const customerPhone =
    getCustomerPhone();


  const pickupInput =
    document.querySelector(
      '[name="pickupDateTime"]'
    );


  const noteInput =
    document.querySelector(
      '[name="note"]'
    );


  const paymentInput =
    document.querySelector(
      '[name="payment"]'
    );


  const invoiceInput =
    document.querySelector(
      '[name="invoice"]'
    );


  const pickupDateTime =
    pickupInput
      ? pickupInput.value.trim()
      : "";


  const note =
    noteInput
      ? noteInput.value.trim()
      : "";


  const payment =
    paymentInput
      ? paymentInput.value
      : "";


  const invoice =
    invoiceInput
      ? invoiceInput.value.trim()
      : "";


  const items =
    cart.map(
      item => ({

        productId:
          item.id,

        id:
          item.id,

        name:
          item.name,

        subtitle:
          item.subtitle,

        price:
          Number(
            item.price
          ),

        quantity:
          Number(
            item.quantity
          ),

        sweetness:
          item.sweetness,

        ice:
          item.ice,

        subtotal:
          Number(
            item.price
          ) *
          Number(
            item.quantity
          )

      })
    );


  return {

    /*
      客人資料
    */

    customerName:
      customerName,

    customerPhone:
      customerPhone,


    /*
      LINE 身分
      後端仍會再次從 Session 驗證。
    */

    lineUserId:
      lineCustomerProfile &&
      (
        lineCustomerProfile.userId ||
        lineCustomerProfile.lineUserId ||
        lineCustomerProfile.sub
      )
        ? (
            lineCustomerProfile.userId ||
            lineCustomerProfile.lineUserId ||
            lineCustomerProfile.sub
          )
        : "",


    lineDisplayName:
      lineCustomerProfile &&
      (
        lineCustomerProfile.displayName ||
        lineCustomerProfile.name
      )
        ? (
            lineCustomerProfile.displayName ||
            lineCustomerProfile.name
          )
        : "",


    /*
      取餐
    */

    pickupDateTime:
      pickupDateTime,


    /*
      備註 / 付款 / 發票
    */

    note:
      note,

    payment:
      payment,

    invoice:
      invoice,


    /*
      商品明細
    */

    items:
      items,


    /*
      購物袋
    */

    bag1Count:
      Number(
        bag1Count || 0
      ),

    bag2Count:
      Number(
        bag2Count || 0
      ),

    bagTotal:
      getBagTotal(),


    /*
      金額
    */

    subtotal:
      getCartSubtotal(),

    total:
      getGrandTotal(),

    amount:
      getGrandTotal()

  };

}


/* =========================================================
   驗證訂單資料
   ========================================================= */

function validateOrderFields(
  payload
) {

  if (
    !payload.customerName
  ) {

    alert(
      "請填寫您的姓名。"
    );

    return false;

  }


  if (
    !payload.customerPhone
  ) {

    alert(
      "請填寫您的聯絡電話。"
    );

    return false;

  }


  if (
    !payload.items ||
    !payload.items.length
  ) {

    alert(
      "請先選擇商品。"
    );

    return false;

  }


  if (
    !payload.pickupDateTime
  ) {

    alert(
      "請選擇取餐時間。"
    );

    return false;

  }


  return true;

}


/* =========================================================
   送出訂單
   ========================================================= */

async function submitOrder(
  event
) {

  if (event) {

    event.preventDefault();

  }


  /*
    第一層：
    確認 LINE 綁定
  */

  const lineReady =
    await validateOrder();


  if (!lineReady) {

    return false;

  }


  /*
    第二層：
    建立完整訂單
  */

  const payload =
    buildOrderPayload();


  /*
    第三層：
    前端欄位驗證
  */

  if (
    !validateOrderFields(
      payload
    )
  ) {

    return false;

  }


  setSubmitLoading(
    true
  );


  try {

    const response =
      await fetch(
        "/api/orders",
        {

          method:
            "POST",

          credentials:
            "same-origin",

          headers: {

            "Content-Type":
              "application/json",

            "Accept":
              "application/json"

          },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    let data =
      null;


    try {

      data =
        await response.json();

    } catch (
      error
    ) {

      data =
        null;

    }


    /*
      後端要求重新綁 LINE
    */

    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        (
          data &&
          data.error
        ) ||
        "請先完成 LINE 綁定後才能下單。"
      );


      redirectToLineBinding();


      return false;

    }


    /*
      後端其他錯誤
    */

    if (
      !response.ok
    ) {

      throw new Error(
        (
          data &&
          (
            data.error ||
            data.message
          )
        ) ||
        "訂單送出失敗，請稍後再試。"
      );

    }


    /*
      訂單成功
    */

    const orderNumber =
      data &&
      (
        data.orderNumber ||
        data.orderNo ||
        data.order_id ||
        data.id
      );


    let message =
      "訂單已成功送出！";


    if (
      orderNumber
    ) {

      message +=
        `\n訂單編號：${orderNumber}`;

    }


    message +=
      "\n店家已收到您的訂單。";


    alert(
      message
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


    renderCart();

    updateCart();


    /*
      更新購物袋顯示
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


    /*
      更新總金額
    */

    const total =
      qs("#cartTotal");


    if (total) {

      total.textContent =
        "$0";

    }


    /*
      關閉購物車
    */

    const dialog =
      qs("#cartDialog");


    if (
      dialog &&
      typeof dialog.close ===
      "function"
    ) {

      dialog.close();

    }


    return true;


  } catch (
    error
  ) {

    console.error(
      "送出訂單錯誤：",
      error
    );


    alert(
      error.message ||
      "訂單送出失敗，請稍後再試。"
    );


    return false;


  } finally {

    setSubmitLoading(
      false
    );

  }

}


/* =========================================================
   送單按鈕 Loading
   ========================================================= */

function setSubmitLoading(
  loading
) {

  const buttons =
    document.querySelectorAll(
      'button[type="submit"], input[type="submit"]'
    );


  buttons.forEach(
    button => {

      if (
        loading
      ) {

        if (
          !button.dataset.originalText
        ) {

          button.dataset.originalText =
            button.textContent;

        }


        button.disabled =
          true;


        button.textContent =
          "訂單送出中…";

      } else {

        button.disabled =
          false;


        if (
          button.dataset.originalText
        ) {

          button.textContent =
            button.dataset.originalText;

        }

      }

    }
  );

}


/* =========================================================
   LINE 綁定後顯示點餐內容
   ========================================================= */

function showOrderingContent() {

  const startSection =
    document.getElementById(
      "startOrderSection"
    );


  const menuContent =
    document.getElementById(
      "menuContent"
    );


  const blackTeaSection =
    document.getElementById(
      "blackTeaSection"
    );


  const milkTeaSection =
    document.getElementById(
      "milkTeaSection"
    );


  const soyTeaSection =
    document.getElementById(
      "soyTeaSection"
    );


  const cartButton =
    document.getElementById(
      "cartButton"
    );


  if (startSection) {

    startSection.style.display =
      "none";

  }


  if (menuContent) {

    menuContent.style.display =
      "";

  }


  if (blackTeaSection) {

    blackTeaSection.style.display =
      "";

  }


  if (milkTeaSection) {

    milkTeaSection.style.display =
      "";

  }


  if (soyTeaSection) {

    soyTeaSection.style.display =
      "";

  }


  if (cartButton) {

    cartButton.style.display =
      "";

  }


  render();

  renderCart();

  updateCart();

  updatePickupTimeOptions();

}


/* =========================================================
   未綁定 LINE 時隱藏點餐內容
   ========================================================= */

function hideOrderingContent() {

  const startSection =
    document.getElementById(
      "startOrderSection"
    );


  const menuContent =
    document.getElementById(
      "menuContent"
    );


  const blackTeaSection =
    document.getElementById(
      "blackTeaSection"
    );


  const milkTeaSection =
    document.getElementById(
      "milkTeaSection"
    );


  const soyTeaSection =
    document.getElementById(
      "soyTeaSection"
    );


  const cartButton =
    document.getElementById(
      "cartButton"
    );


  if (startSection) {

    startSection.style.display =
      "";

  }


  if (menuContent) {

    menuContent.style.display =
      "none";

  }


  if (blackTeaSection) {

    blackTeaSection.style.display =
      "none";

  }


  if (milkTeaSection) {

    milkTeaSection.style.display =
      "none";

  }


  if (soyTeaSection) {

    soyTeaSection.style.display =
      "none";

  }


  if (cartButton) {

    cartButton.style.display =
      "none";

  }

}


/* =========================================================
   首頁「現在點餐」
   點擊後自然進入 LINE 綁定
   ========================================================= */

function bindStartOrderButton() {

  const button =
    document.getElementById(
      "startOrderButton"
    );


  if (!button) {

    return;

  }


  button.onclick =
    async () => {

      button.disabled =
        true;


      const oldText =
        button.textContent;


      button.textContent =
        "正在準備點餐…";


      try {

        /*
          如果已經綁定，
          直接進入點餐。
        */

        const status =
          await loadLineStatus();


        const loggedIn =
          Boolean(
            status &&
            (
              status.loggedIn ||
              status.login ||
              status.isLoggedIn
            )
          );


        const bound =
          Boolean(
            status &&
            (
              status.bound ||
              status.binding ||
              status.isBound ||
              status.lineBound ||
              status.lineUserId
            )
          );


        if (
          loggedIn &&
          bound
        ) {

          lineLoggedIn =
            true;

          lineBindingReady =
            true;

          lineCustomerProfile =
            status.profile ||
            status.customer ||
            status.user ||
            null;


          showOrderingContent();


          return;

        }


        /*
          尚未綁定：
          自然導向 LINE Login
        */

        redirectToLineBinding();


      } catch (
        error
      ) {

        console.error(
          "LINE 綁定流程錯誤：",
          error
        );


        /*
          即使狀態查詢失敗，
          仍然可以嘗試進入 LINE Login。
        */

        redirectToLineBinding();

      } finally {

        /*
          如果沒有離開頁面，
          才恢復按鈕。
        */

        if (
          document.body.contains(
            button
          )
        ) {

          button.disabled =
            false;

          button.textContent =
            oldText;

        }

      }

    };

}


/* =========================================================
   頁面初始化
   ========================================================= */

async function initializeApp() {

  /*
    一開始先隱藏點餐區。
    確認 LINE 後才顯示。
  */

  hideOrderingContent();


  /*
    綁定首頁現在點餐
  */

  bindStartOrderButton();


  /*
    初始化購物車
  */

  renderCart();

  updateCart();


  /*
    取餐時間
  */

  updatePickupTimeOptions();


  /*
    檢查 LINE
  */

  try {

    const status =
      await loadLineStatus();


    const loggedIn =
      Boolean(
        status &&
        (
          status.loggedIn ||
          status.login ||
          status.isLoggedIn
        )
      );


    const bound =
      Boolean(
        status &&
        (
          status.bound ||
          status.binding ||
          status.isBound ||
          status.lineBound ||
          status.lineUserId
        )
      );


    if (
      loggedIn &&
      bound
    ) {

      lineLoggedIn =
        true;


      lineBindingReady =
        true;


      lineCustomerProfile =
        status.profile ||
        status.customer ||
        status.user ||
        null;


      showOrderingContent();

    } else {

      lineLoggedIn =
        false;


      lineBindingReady =
        false;


      hideOrderingContent();

    }

  } catch (
    error
  ) {

    console.error(
      "初始化 LINE 狀態失敗：",
      error
    );


    lineLoggedIn =
      false;


    lineBindingReady =
      false;


    hideOrderingContent();

  }

}


/* =========================================================
   DOM Ready
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeApp();

  }
);


/* =========================================================
   頁面從 LINE 回來
   ========================================================= */

window.addEventListener(
  "pageshow",
  async () => {

    try {

      const status =
        await loadLineStatus();


      const loggedIn =
        Boolean(
          status &&
          (
            status.loggedIn ||
            status.login ||
            status.isLoggedIn
          )
        );


      const bound =
        Boolean(
          status &&
          (
            status.bound ||
            status.binding ||
            status.isBound ||
            status.lineBound ||
            status.lineUserId
          )
        );


      if (
        loggedIn &&
        bound
      ) {

        lineLoggedIn =
          true;


        lineBindingReady =
          true;


        lineCustomerProfile =
          status.profile ||
          status.customer ||
          status.user ||
          null;


        showOrderingContent();

      }

    } catch (
      error
    ) {

      console.error(
        "重新確認 LINE 狀態失敗：",
        error
      );

    }

  }
);


/* =========================================================
   所有下單表單都強制經過 LINE 驗證
   ========================================================= */

document.addEventListener(
  "submit",
  event => {

    const form =
      event.target;


    if (
      !form ||
      form.dataset.lineHandled ===
      "true"
    ) {

      return;

    }


    /*
      如果這就是訂單表單，
      統一交給 submitOrder。
    */

    const isOrderForm =
      form.id === "orderForm" ||
      form.matches(
        "[data-order-form]"
      );


    if (!isOrderForm) {

      return;

    }


    form.dataset.lineHandled =
      "true";


    /*
      submitOrder 會負責：
      LINE 驗證
      → 欄位驗證
      → POST /api/orders
    */

    submitOrder(
      event
    ).finally(
      () => {

        form.dataset.lineHandled =
          "false";

      }
    );

  },
  true
);


/* =========================================================
   全域狀態
   ========================================================= */

window.appState = {

  get cart() {

    return cart;

  },


  get lineLoggedIn() {

    return lineLoggedIn;

  },


  get lineBindingReady() {

    return lineBindingReady;

  },


  get lineCustomerProfile() {

    return lineCustomerProfile;

  },


  get bag1Count() {

    return bag1Count;

  },


  get bag2Count() {

    return bag2Count;

  },


  get subtotal() {

    return getCartSubtotal();

  },


  get bagTotal() {

    return getBagTotal();

  },


  get total() {

    return getGrandTotal();

  },


  refreshLineStatus() {

    return loadLineStatus();

  },


  requireLineBinding() {

    return ensureLineBinding();

  }

};
