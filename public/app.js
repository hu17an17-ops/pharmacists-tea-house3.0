/* =========================================================
   藥師的私房紅茶
   前台 app.js
   ========================================================= */


/* =========================================================
   商品資料
   ========================================================= */

const products = [

  {
    id: 1,
    category: "紅茶系列",
    name: "老樹麥香",
    subtitle: "古早味傳統紅茶",
    price: 30
  },

  {
    id: 2,
    category: "紅茶系列",
    name: "菁玉紅茶",
    subtitle: "英式下午茶",
    price: 45
  },

  {
    id: 3,
    category: "紅茶系列",
    name: "蜜香紅茶",
    subtitle: "茶葉回甘帶有熟蜜的香氣",
    price: 45
  },

  {
    id: 4,
    category: "紅茶系列",
    name: "觀音紅茶",
    subtitle: "帶有微微自然風味的紅茶",
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


  /* =====================================================
     鮮奶茶系列
     戰豆奶茶也放在這裡
     ===================================================== */

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
    subtitle: "茶味較明顯的鮮奶茶",
    price: 50
  },

  {
    id: 10,
    category: "鮮奶茶系列",
    name: "蜜香鮮奶茶",
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
    subtitle: "阿薩姆奶品種獨特的甘醇芳香",
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


/* =========================================================
   購物袋
   ========================================================= */

let bag1Count = 0;

let bag2Count = 0;



/* =========================================================
   DOM 快速選取
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
   飲料圖片
   ========================================================= */

function drinkImg(name) {

  const isMilk =
    name.includes("鮮奶") ||
    name.includes("豆奶");


  const hue =
    isMilk
      ? "#ead1b2"
      : "#9d4a2b";


  const teaColor =
    isMilk
      ? "#c58b58"
      : "#6f2d1c";


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
        fill="${teaColor}"
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

  const blackTea =
    qs("#blackTea");

  const milkTea =
    qs("#milkTea");

  const soyTea =
    qs("#soyTea");


  /*
    清空商品區
  */

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
    分類對應

    戰豆奶茶現在屬於鮮奶茶系列，
    所以不再使用 #soyTea。
  */

  const groups = {

    "紅茶系列": "#blackTea",

    "鮮奶茶系列": "#milkTea"

  };


  /*
    放入商品
  */

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
    綁定加入購物車
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
    分類按鈕 active
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
   加入購物車
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


  /*
    同商品、同甜度、同冰度
    合併數量
  */

  const found =
    cart.find(
      item =>
        item.id === id &&
        item.sweetness === "十分" &&
        item.ice === "正常冰"
    );


  if (found) {

    found.quantity += 1;

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
        1,

      sweetness:
        "十分",

      ice:
        "正常冰"

    });

  }


  updateCart();

  toast(
    `${product.name} 已加入訂單`
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

   1～2 杯    15 分鐘
   3～4 杯    20 分鐘
   5～6 杯    25 分鐘
   7～8 杯    30 分鐘
   9～10 杯   40 分鐘
   11～15 杯  50 分鐘
   16 杯以上  60 分鐘
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
   判斷是否營業日
   =========================================================

   JavaScript：
   0 = 星期日
   1 = 星期一
   2 = 星期二
   3 = 星期三
   4 = 星期四
   5 = 星期五
   6 = 星期六

   店家：
   週三～週日營業
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

  const month =
    date.getMonth() + 1;


  const day =
    date.getDate();


  const weekdayNames = [
    "日",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六"
  ];


  const weekday =
    weekdayNames[
      date.getDay()
    ];


  return `${month}/${day}（週${weekday}）`;

}



/* =========================================================
   建立指定日期的時間
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
   取餐時間選單
   =========================================================

   規則：

   ① 今天
      → 依杯數計算最早時間

   ② 每天最晚 21:40

   ③ 今天過了 21:40
      → 不再顯示今天

   ④ 明天開始
      → 11:00～21:40

   ⑤ 週一、週二自動跳過

   ⑥ 提供未來 7 天內的營業日

   ⑦ 每 5 分鐘一個選項

   ⑧ 客人不能自行輸入
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


  /*
    如果目前還是 input，
    自動改成 select。
  */

  if (
    input.tagName.toLowerCase() !==
    "select"
  ) {

    select =
      document.createElement(
        "select"
      );


    /*
      保留原本的 class
    */

    if (input.className) {

      select.className =
        input.className;

    }


    /*
      保留原本 id
    */

    if (input.id) {

      select.id =
        input.id;

    } else {

      select.id =
        "pickupDateTime";

    }


    select.name =
      "pickupDateTime";


    select.required =
      true;


    input.replaceWith(
      select
    );

  }


  /*
    記住原本選擇
  */

  const oldValue =
    select.value;


  /*
    現在時間
  */

  const now =
    new Date();


  /*
    今天
  */

  const today =
    new Date(now);


  today.setHours(
    0,
    0,
    0,
    0
  );


  /*
    清空
  */

  select.innerHTML = "";


  /*
    預設提示
  */

  const firstOption =
    document.createElement(
      "option"
    );


  firstOption.value =
    "";


  firstOption.textContent =
    "請選擇取餐日期與時間";


  select.appendChild(
    firstOption
  );


  /*
    今天最早取餐時間
  */

  const preparationMinutes =
    getPreparationMinutes();


  let earliestToday =
    new Date(
      now.getTime() +
      preparationMinutes *
      60 *
      1000
    );


  /*
    向上對齊 5 分鐘
  */

  const minuteRemainder =
    earliestToday.getMinutes() % 5;


  if (
    minuteRemainder !== 0
  ) {

    earliestToday.setMinutes(
      earliestToday.getMinutes() +
      (
        5 -
        minuteRemainder
      )
    );

  }


  earliestToday.setSeconds(
    0
  );


  earliestToday.setMilliseconds(
    0
  );


  /*
    =====================================================
    建立未來 7 天
    =====================================================
  */

  for (
    let dayOffset = 0;
    dayOffset < 7;
    dayOffset++
  ) {

    const date =
      new Date(today);


    date.setDate(
      today.getDate() +
      dayOffset
    );


    /*
      跳過週一、週二
    */

    if (
      !isBusinessDay(date)
    ) {

      continue;

    }


    /*
      每天 11:00～21:40
    */

    let startHour =
      11;

    let startMinute =
      0;


    /*
      今天：

      必須按照杯數計算最早時間。
    */

    if (
      dayOffset === 0
    ) {

      /*
        如果現在已經超過
        21:40，
        今天不提供時間。
      */

      const todayLastTime =
        createDateTime(
          date,
          21,
          40
        );


      if (
        earliestToday >
        todayLastTime
      ) {

        continue;

      }


      /*
        如果最早時間早於 11:00，
        從 11:00 開始。
      */

      if (
        earliestToday >
        createDateTime(
          date,
          11,
          0
        )
      ) {

        startHour =
          earliestToday.getHours();

        startMinute =
          earliestToday.getMinutes();

      }

    }


    /*
      日期標題
    */

    const dateLabel =
      dayOffset === 0
        ? `${formatDate(date)}｜今天`
        : dayOffset === 1
          ? `${formatDate(date)}｜明天`
          : dayOffset === 2
            ? `${formatDate(date)}｜後天`
            : formatDate(date);


    /*
      日期分隔標題
    */

    const dateGroup =
      document.createElement(
        "optgroup"
      );


    dateGroup.label =
      dateLabel;


    /*
      每 5 分鐘建立一個時段
    */

    for (
      let hour = startHour;
      hour <= 21;
      hour++
    ) {

      let minuteStart =
        0;


      /*
        如果是起始小時，
        從 startMinute 開始。
      */

      if (
        hour === startHour
      ) {

        minuteStart =
          startMinute;

      }


      /*
        向上對齊到 5 分鐘
      */

      minuteStart =
        Math.ceil(
          minuteStart / 5
        ) * 5;


      for (
        let minute = minuteStart;
        minute <= 55;
        minute += 5
      ) {

        /*
          每天最後時間：
          21:40
        */

        if (
          hour === 21 &&
          minute > 40
        ) {

          continue;

        }


        const time =
          createDateTime(
            date,
            hour,
            minute
          );


        /*
          今天再做一次檢查，
          避免出現已經過去的時間。
        */

        if (
          dayOffset === 0 &&
          time < earliestToday
        ) {

          continue;

        }


        const month =
          date.getMonth() + 1;


        const day =
          date.getDate();


        const value =
          `${month}/${day} ${pad(hour)}:${pad(minute)}`;


        const option =
          document.createElement(
            "option"
          );


        option.value =
          value;


        option.textContent =
          `${pad(hour)}:${pad(minute)}`;


        dateGroup.appendChild(
          option
        );

      }

    }


    /*
      如果這一天有時間，
      才加入選單。
    */

    if (
      dateGroup.children.length > 0
    ) {

      select.appendChild(
        dateGroup
      );

    }

  }


  /*
    如果原本選擇的時間還存在，
    保留原本選擇。
  */

  if (oldValue) {

    const option =
      Array.from(
        select.options
      ).find(
        item =>
          item.value ===
          oldValue
      );


    if (option) {

      select.value =
        oldValue;

    }

  }


  /*
    外觀
  */

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

  const count =
    getDrinkCount();


  const cartCount =
    qs("#cartCount");


  if (cartCount) {

    cartCount.textContent =
      count;

  }


  /*
    購物車開啟時，
    杯數改變就重新計算取餐時間。
  */

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


  /*
    商品內容
  */

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


  /*
    飲料總額
  */

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


  /*
    購物袋總額
  */

  const bagTotal =
    bag1Count * 1 +
    bag2Count * 2;


  /*
    最終總額
  */

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
    減少數量
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
              cart[index].quantity <= 0
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
    增加數量
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

          };

      }
    );


  /*
    冰度
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
   送出訂單
   ========================================================= */

const orderForm =
  qs("#orderForm");


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
        重新計算一次取餐時間
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


      if (!phone) {

        toast(
          "請輸入電話"
        );

        return;

      }


      if (!pickupDateTime) {

        toast(
          "請選擇取餐日期與時間"
        );

        return;

      }


      /*
        杯數
      */

      const cups =
        getDrinkCount();


      /*
        製作時間
      */

      const preparationMinutes =
        getPreparationMinutes();


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


        /*
          額外資料
        */

        preparationMinutes,

        drinkCount:
          cups

      };


      const result =
        qs("#result");


      if (result) {

        result.className = "";

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

        if (result) {

          result.className =
            "success";


          result.innerHTML =

            `

            訂單已送出！

            <br>

            <strong>
              訂單編號：
              ${data.orderId || ""}
            </strong>

            <br>

            合計
            $${data.total || 0}

            ，請到店取餐並現場付款。

            `;

        }


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
    如果還是 input，
    改成 select。
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


  /*
    先建立選單
  */

  updatePickupTimeOptions();

}


initializePickupTimeField();



/* =========================================================
   每分鐘重新計算取餐時間
   ========================================================= */

setInterval(
  () => {

    /*
      只有購物車有飲料時，
      才需要重新計算。
    */

    if (
      cart.length > 0
    ) {

      updatePickupTimeOptions();

    }

  },
  60 * 1000
);
