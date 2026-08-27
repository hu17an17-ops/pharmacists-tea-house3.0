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
   冰度 / 甜度
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
   快速選取 DOM
   ========================================================= */

function qs(selector) {

  return document.querySelector(selector);

}



/* =========================================================
   金額格式
   ========================================================= */

function money(number) {

  return `$${number}`;

}



/* =========================================================
   商品圖片
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
  */

  const groups = {

    "紅茶系列": "#blackTea",

    "鮮奶茶系列": "#milkTea",


  };


  /*
    依分類顯示商品
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
    商品數量為 0 的區塊自動隱藏
  */

  document
    .querySelectorAll(".section-title")
    .forEach(title => {

      const group =
        title.nextElementSibling;


      if (
        group &&
        group.children.length > 0
      ) {

        title.parentElement.style.display =
          "";

      } else {

        title.parentElement.style.display =
          "none";

      }

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
    如果同商品、同甜度、同冰度，
    就增加數量。
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
   飲料總杯數
   ========================================================= */

function getDrinkCount() {

  return cart.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        Number(
          item.quantity || 0
        )
      ),
    0
  );

}



/* =========================================================
   取餐時間製作時間
   =========================================================

   1～2 杯   → 15 分鐘
   3～4 杯   → 20 分鐘
   5～6 杯   → 25 分鐘
   7～8 杯   → 30 分鐘
   9～10 杯  → 40 分鐘
   11～15 杯 → 50 分鐘
   16 杯以上 → 60 分鐘
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
   產生取餐時間
   ========================================================= */

function updatePickupTimeOptions() {

  const input =
    document.querySelector(
      '[name="pickupDateTime"]'
    );


  if (!input) {

    return;

  }


  /*
    如果目前還是 input，
    把它換成 select。

    因此不需要修改 index.html。
  */

  let select;


  if (
    input.tagName.toLowerCase() ===
    "select"
  ) {

    select =
      input;

  } else {

    select =
      document.createElement(
        "select"
      );


    /*
      完整保留原本 input 的屬性
    */

    Array.from(
      input.attributes
    ).forEach(attribute => {

      if (
        attribute.name !==
          "placeholder" &&
        attribute.name !==
          "type"
      ) {

        select.setAttribute(
          attribute.name,
          attribute.value
        );

      }

    });


    select.id =
      "pickupDateTime";


    select.name =
      "pickupDateTime";


    select.required =
      true;


    /*
      保留原本的 class，
      如果有的話。
    */

    if (input.className) {

      select.className =
        input.className;

    }


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
    計算製作時間
  */

  const preparationMinutes =
    getPreparationMinutes();


  /*
    現在時間
  */

  const now =
    new Date();


  /*
    最早可取餐時間
  */

  const earliest =
    new Date(
      now.getTime() +
      preparationMinutes *
      60 *
      1000
    );


  /*
    對齊到下一個 5 分鐘。

    例如：
    14:46
    → 14:50

    14:51
    → 14:55
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
    清空選項
  */

  select.innerHTML = "";


  /*
    第一個提示
  */

  const firstOption =
    document.createElement(
      "option"
    );


  firstOption.value =
    "";


  firstOption.textContent =
    `請選擇取餐時間（至少 ${preparationMinutes} 分鐘後）`;


  select.appendChild(
    firstOption
  );


  /*
    提供未來 2 小時。

    每 5 分鐘一個時段。
  */

  for (
    let i = 0;
    i < 24;
    i++
  ) {

    const time =
      new Date(
        earliest.getTime() +
        i *
        5 *
        60 *
        1000
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
      `${month}/${day} ${pad(hour)}:${pad(minute)}`;


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
    如果原本選擇還存在，
    保留原本選擇。
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


  /*
    取餐時間外觀微調
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
   購物車數量
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
    如果購物車已經開啟，
    杯數改變時重新計算取餐時間。
  */

  if (
    document.querySelector(
      "#cartDialog"
    )?.open
  ) {

    updatePickupTimeOptions();

  }

}



/* =========================================================
   顯示購物車內容
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
        (item, index) =>

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
                          item.sweetness === value
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
                          item.ice === value
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
    飲料金額
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
    購物袋金額
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
    減少
  */

  document
    .querySelectorAll(
      "[data-minus]"
    )
    .forEach(button => {

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

    });


  /*
    增加
  */

  document
    .querySelectorAll(
      "[data-plus]"
    )
    .forEach(button => {

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

    });


  /*
    甜度
  */

  document
    .querySelectorAll(
      "[data-sweet]"
    )
    .forEach(select => {

      select.onchange =
        () => {

          const index =
            Number(
              select.dataset.sweet
            );


          cart[index].sweetness =
            select.value;

        };

    });


  /*
    冰度
  */

  document
    .querySelectorAll(
      "[data-ice]"
    )
    .forEach(select => {

      select.onchange =
        () => {

          const index =
            Number(
              select.dataset.ice
            );


          cart[index].ice =
            select.value;

        };

    });

}



/* =========================================================
   購物車按鈕
   ========================================================= */

const cartButton =
  qs("#cartButton");


if (cartButton) {

  cartButton.onclick =
    () => {

      renderCart();

      /*
        打開之前重新計算
      */

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


      if (!cart.length) {

        toast(
          "請先選擇商品"
        );

        return;

      }


      /*
        送出之前再重新計算一次。
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
          "請選擇取餐時間"
        );

        return;

      }


      /*
        最終重新取得杯數
      */

      const cups =
        getDrinkCount();


      /*
        最終製作時間
      */

      const preparationMinutes =
        getPreparationMinutes();


      /*
        建立送給後端的訂單
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
          額外傳送製作資訊。
          舊版後端即使不使用也不會影響。
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
          顯示訂單結果
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
          重新顯示空購物車
        */

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
  .forEach(button => {

    button.onclick =
      () => {

        render(
          button.dataset.filter
        );

      };

  });



/* =========================================================
   初始化
   ========================================================= */

render();

updateCart();

renderCart();


/*
  一開始先把取餐時間 input
  轉成不能手動輸入的 select。

  此時購物車是 0 杯，
  所以先不計算真正時間。
*/

function initializePickupTimeField() {

  const input =
    document.querySelector(
      '[name="pickupDateTime"]'
    );


  if (!input) {

    return;

  }


  if (
    input.tagName.toLowerCase() !==
    "select"
  ) {

    const select =
      document.createElement(
        "select"
      );


    select.id =
      "pickupDateTime";


    select.name =
      "pickupDateTime";


    select.required =
      true;


    input.replaceWith(
      select
    );

  }

}


initializePickupTimeField();



/* =========================================================
   每分鐘更新一次
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
