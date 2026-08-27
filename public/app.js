/* =========================================================
   藥師的私房紅茶｜前台 app.js
   功能：商品選擇 → 先選數量/甜度/冰塊 → 加入購物車
   ========================================================= */

const products = [
  { id: 1, category: "紅茶系列", name: "老樹麥香", subtitle: "古早味麥香紅茶", price: 30 },
  { id: 2, category: "紅茶系列", name: "菁玉紅茶", subtitle: "英式下午茶(伯爵)", price: 45 },
  { id: 3, category: "紅茶系列", name: "蜜香紅茶（不是加蜂蜜）", subtitle: "茶葉回甘帶有熟蜜的香氣", price: 45 },
  { id: 4, category: "紅茶系列", name: "觀音紅茶", subtitle: "帶有鐵觀音風味的紅茶", price: 45 },
  { id: 5, category: "紅茶系列", name: "紫霞仙子紅茶", subtitle: "阿薩姆基底，獨特果香，醇厚回甘", price: 50 },
  { id: 6, category: "紅茶系列", name: "藥師皇茶", subtitle: "獨特的山林木質香氣", price: 55 },
  { id: 7, category: "紅茶系列", name: "台茶十八號（紅玉）", subtitle: "茶香獨特，口感濃郁強烈", price: 75 },

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
    name: "蜜香鮮奶茶（不是加蜂蜜）",
    subtitle: "茶葉回甘帶有熟蜜的香氣",
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


  /*
    戰豆奶茶已經放在鮮奶茶系列
    不再使用 soyTea
  */

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


  /*
    綁定商品按鈕
  */

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


  /*
    分類按鈕
  */

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
   按下「＋ 選擇」後，
   先跳出數量 / 甜度 / 冰塊選擇
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
                <option
                  value="${value}"
                >
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
                <option
                  value="${value}"
                >
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


  /*
    更新數量顯示
  */

  const updateQuantity =
    () => {

      quantityElement.textContent =
        quantity;

    };


  /*
    關閉視窗
  */

  const close =
    () => {

      modal.remove();

    };


  /*
    減少數量
  */

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


  /*
    增加數量
  */

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


  /*
    關閉
  */

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


  /*
    點背景關閉
  */

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


  /*
    加入購物車
  */

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
   真正加入購物車
   相同商品＋相同甜度＋相同冰塊
   自動合併數量
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
   依杯數計算製作時間
   =========================================================

   1～2 杯     15 分鐘
   3～4 杯     20 分鐘
   5～6 杯     25 分鐘
   7～8 杯     30 分鐘
   9～10 杯    40 分鐘
   11～15 杯   50 分鐘
   16 杯以上   60 分鐘

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
   判斷營業日
   週三～週日營業
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
   建立指定日期時間
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

function nextBusinessDay(date) {

  const result =
    new Date(date);

  result.setDate(
    result.getDate() + 1
  );

  while (
    !isBusinessDay(result)
  ) {

    result.setDate(
      result.getDate() + 1
    );

  }

  return result;

}


/* =========================================================
   取得今天或下一個營業日
   ========================================================= */

function getFirstPickupDate() {

  const now =
    new Date();

  if (
    isBusinessDay(now)
  ) {

    return new Date(now);

  }

  return nextBusinessDay(now);

}


/* =========================================================
   取得可選取餐時間
   ========================================================= */

function getPickupOptions() {

  const now =
    new Date();

  const preparationMinutes =
    getPreparationMinutes();

  const options = [];

  let date =
    getFirstPickupDate();

  const maxDays = 14;


  for (
    let dayIndex = 0;
    dayIndex < maxDays;
    dayIndex++
  ) {

    if (
      !isBusinessDay(date)
    ) {

      date =
        nextBusinessDay(date);

      continue;

    }


    const timeSlots = [];


    /*
      營業時間：
      11:00～14:00
      17:00～20:30
    */

    const periods = [
      [11, 0, 14, 0],
      [17, 0, 20, 30]
    ];


    periods.forEach(
      period => {

        const start =
          createDateTime(
            date,
            period[0],
            period[1]
          );

        const end =
          createDateTime(
            date,
            period[2],
            period[3]
          );


        let current =
          new Date(start);


        while (
          current <= end
        ) {

          const minimumTime =
            new Date(
              now.getTime() +
              preparationMinutes *
                60 *
                1000
            );


          if (
            current >= minimumTime
          ) {

            timeSlots.push(
              new Date(current)
            );

          }


          current.setMinutes(
            current.getMinutes() + 10
          );

        }

      }
    );


    timeSlots.forEach(
      time => {

        options.push({
          value:
            `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}`,

          label:
            `${time.getMonth() + 1}/${time.getDate()} ${pad(time.getHours())}:${pad(time.getMinutes())}`
        });

      }
    );


    date =
      nextBusinessDay(date);

  }


  return options;

}


/* =========================================================
   更新購物車
   ========================================================= */

function updateCart() {

  const count =
    qs("#cartCount");

  if (count) {

    count.textContent =
      cart.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,
        0
      );

  }


  const cartItems =
    qs("#cartItems");

  const cartTotal =
    qs("#cartTotal");


  if (
    !cartItems ||
    !cartTotal
  ) {
    return;
  }


  if (
    cart.length === 0
  ) {

    cartItems.innerHTML =
      `
        <p
          style="
            text-align:center;
            color:#8a756b;
            padding:20px 0;
          "
        >
          目前尚未選擇商品
        </p>
      `;

    cartTotal.textContent =
      "$0";

    return;

  }


  let total = 0;


  cartItems.innerHTML =
    cart.map(
      (
        item,
        index
      ) => {

        const subtotal =
          item.price *
          item.quantity;

        total +=
          subtotal;


        return `
          <div
            style="
              padding:16px 0;
              border-bottom:1px solid #eadfd6;
            "
          >

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:12px;
              "
            >

              <div>

                <strong
                  style="
                    font-size:18px;
                  "
                >
                  ${item.name}
                </strong>

                <div
                  style="
                    margin-top:5px;
                    color:#8a756b;
                    font-size:14px;
                  "
                >
                  ${item.subtitle}
                </div>

                <div
                  style="
                    margin-top:6px;
                    color:#6f5d54;
                    font-size:14px;
                  "
                >
                  數量：${item.quantity}
                  ／甜度：${item.sweetness}
                  ／冰塊：${item.ice}
                </div>

              </div>


              <strong
                style="
                  color:#a93226;
                  font-size:18px;
                  white-space:nowrap;
                "
              >
                ${money(subtotal)}
              </strong>

            </div>


            <button
              type="button"
              data-remove="${index}"
              style="
                margin-top:10px;
                border:0;
                background:#f3e9e2;
                color:#8b332c;
                border-radius:9px;
                padding:7px 12px;
                cursor:pointer;
              "
            >
              刪除
            </button>

          </div>
        `;

      }
    ).join("");


  cartTotal.textContent =
    money(total);


  cartItems
    .querySelectorAll(
      "[data-remove]"
    )
    .forEach(
      button => {

        button.onclick = () => {

          cart.splice(
            Number(
              button.dataset.remove
            ),
            1
          );

          updateCart();

        };

      }
    );

}


/* =========================================================
   購物袋
   ========================================================= */

function changeBag(
  type,
  delta
) {

  if (
    type === "bag1"
  ) {

    bag1Count =
      Math.max(
        0,
        bag1Count + delta
      );

    const element =
      qs("#bag1Count");

    if (element) {
      element.textContent =
        bag1Count;
    }

  }


  if (
    type === "bag2"
  ) {

    bag2Count =
      Math.max(
        0,
        bag2Count + delta
      );

    const element =
      qs("#bag2Count");

    if (element) {
      element.textContent =
        bag2Count;
    }

  }

}


/* =========================================================
   Toast
   ========================================================= */

function toast(message) {

  const element =
    qs("#toast");

  if (!element) {
    return;
  }


  element.textContent =
    message;

  element.classList.add(
    "show"
  );


  clearTimeout(
    toast.timer
  );


  toast.timer =
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
   分類
   ========================================================= */

document
  .querySelectorAll(
    ".tabs button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          render(
            button.dataset.filter
          );

        }
      );

    }
  );


/* =========================================================
   購物車視窗
   ========================================================= */

const cartButton =
  qs("#cartButton");

const cartDialog =
  qs("#cartDialog");

const closeCart =
  qs("#closeCart");


if (
  cartButton &&
  cartDialog
) {

  cartButton.addEventListener(
    "click",
    () => {

      updateCart();

      cartDialog.showModal();

    }
  );

}


if (
  closeCart &&
  cartDialog
) {

  closeCart.addEventListener(
    "click",
    () => {

      cartDialog.close();

    }
  );

}


/* =========================================================
   點 dialog 背景關閉
   ========================================================= */

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
   初始化
   ========================================================= */

render("全部");

updateCart();
