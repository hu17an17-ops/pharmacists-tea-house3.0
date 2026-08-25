const products = [
  {id:1, category:"紅茶系列", name:"老樹麥香", subtitle:"古早味麥香紅茶", price:30},
  {id:2, category:"紅茶系列", name:"菁玉紅茶", subtitle:"英式下午茶", price:45},
  {id:3, category:"紅茶系列", name:"蜜香紅茶", subtitle:"不是加蜂蜜｜茶葉回甘帶有熟蜜的香氣", price:45},
  {id:4, category:"紅茶系列", name:"觀音紅茶", subtitle:"帶有鐵觀音風味的紅茶", price:45},
  {id:5, category:"紅茶系列", name:"紫霞仙子紅茶", subtitle:"阿薩姆基底，獨特果香，醇厚回甘", price:50},
  {id:6, category:"紅茶系列", name:"藥師皇茶", subtitle:"獨特的山林木質香氣", price:55},
  {id:7, category:"紅茶系列", name:"台茶十八號（紅玉）", subtitle:"茶香獨特，口感濃郁強烈", price:75},

  {id:8, category:"鮮奶茶系列", name:"招牌鮮奶茶", subtitle:"特製奶茶茶湯，類似麥香奶茶", price:50},
  {id:9, category:"鮮奶茶系列", name:"菁玉鮮奶茶", subtitle:"英式鮮奶茶", price:50},
  {id:10, category:"鮮奶茶系列", name:"蜜香鮮奶茶", subtitle:"不是加蜂蜜｜茶葉回甘帶有熟蜜的香氣", price:50},
  {id:11, category:"鮮奶茶系列", name:"觀音鮮奶茶", subtitle:"讓人呼吸一口的特別風味", price:55},
  {id:12, category:"鮮奶茶系列", name:"阿薩姆鮮奶茶", subtitle:"阿薩姆奶品種獨特的甘醇芳香", price:55},
  {id:13, category:"鮮奶茶系列", name:"戰豆奶茶", subtitle:"非基改豆漿＋紅茶", price:50}
];


const cart = [];

const qs = s => document.querySelector(s);

const money = n => `$${n}`;


/* =========================================================
   商品卡片
   ========================================================= */

function card(p){

  return `
    <article class="card">

      <div>

        <h3>${p.name}</h3>

        <p>${p.subtitle}</p>

        <div class="price">
          ${money(p.price)}
        </div>

      </div>

      <button
        class="choose"
        data-add="${p.id}"
      >
        ＋ 選擇
      </button>

    </article>
  `;
}


/* =========================================================
   商品分類
   ========================================================= */

function render(filter="全部"){

  const groups = {
    "紅茶系列":"#blackTea",
    "鮮奶茶系列":"#milkTea"
  };


  Object.values(groups).forEach(
    sel => {
      const el = qs(sel);

      if(el){
        el.innerHTML="";
      }
    }
  );


  const soySection =
    qs("#soyTea")?.closest("section");


  if(soySection){
    soySection.style.display="none";
  }


  products
    .filter(
      p =>
        filter==="全部" ||
        p.category===filter
    )
    .forEach(p=>{

      const target =
        groups[p.category];

      if(target){

        qs(target)
          .insertAdjacentHTML(
            "beforeend",
            card(p)
          );

      }

    });


  document
    .querySelectorAll(".tabs button")
    .forEach(
      b =>
        b.classList.toggle(
          "active",
          b.dataset.filter===filter
        )
    );


  document
    .querySelectorAll("[data-add]")
    .forEach(
      b =>
        b.onclick=() =>
          add(
            Number(
              b.dataset.add
            )
          )
    );


  document
    .querySelectorAll(".section-title")
    .forEach(h=>{

      const group =
        h.nextElementSibling;

      h.parentElement.style.display =
        group &&
        group.children.length
          ? ""
          : "none";

    });

}


/* =========================================================
   加入購物車
   ========================================================= */

function add(id){

  const p =
    products.find(
      x => x.id===id
    );


  const found =
    cart.find(
      x =>
        x.id===id &&
        x.sweetness==="十分" &&
        x.ice==="正常冰"
    );


  if(found){

    found.quantity++;

  }else{

    cart.push({

      ...p,

      quantity:1,

      sweetness:"十分",

      ice:"正常冰"

    });

  }


  updateCart();

  toast(
    `${p.name} 已加入訂單`
  );

}


/* =========================================================
   購物車數量
   ========================================================= */

function updateCart(){

  qs("#cartCount").textContent =
    cart.reduce(
      (s,x) =>
        s+x.quantity,
      0
    );

}


/* =========================================================
   購物車內容
   ========================================================= */

function renderCart(){

  const box =
    qs("#cartItems");


  if(!cart.length){

    box.innerHTML =
      "<p>目前還沒有選擇商品。</p>";

    qs("#cartTotal")
      .textContent="$0";

    return;
  }


  box.innerHTML =
    cart
      .map(
        (x,i)=>`

        <div class="cart-row">

          <strong>
            ${x.name}
          </strong>

         　${money(x.price)}

          <div class="cart-controls">

            <button
              data-minus="${i}"
            >
              −
            </button>

            <span>
              ${x.quantity}
            </span>

            <button
              data-plus="${i}"
            >
              ＋
            </button>


            <select
              data-sweet="${i}"
            >

              ${
                [
                  "無糖",
                  "一分",
                  "三分",
                  "五分",
                  "八分",
                  "十分"
                ]
                .map(
                  v =>
                    `<option ${
                      x.sweetness===v
                        ?"selected"
                        :""
                    }>${v}</option>`
                )
                .join("")
              }

            </select>


            <select
              data-ice="${i}"
            >

              ${
                [
                  "去冰",
                  "微冰",
                  "少冰",
                  "正常冰"
                ]
                .map(
                  v =>
                    `<option ${
                      x.ice===v
                        ?"selected"
                        :""
                    }>${v}</option>`
                )
                .join("")
              }

            </select>

          </div>

        </div>

      `
      )
      .join("");


  const bagTotal =
    bag1Count * 1 +
    bag2Count * 2;


  const drinkTotal =
    cart.reduce(
      (s,x) =>
        s +
        x.price *
        x.quantity,
      0
    );


  qs("#cartTotal")
    .textContent =
      money(
        drinkTotal +
        bagTotal
      );


  document
    .querySelectorAll(
      "[data-minus]"
    )
    .forEach(
      b =>
        b.onclick=()=>{

          const i =
            +b.dataset.minus;

          cart[i].quantity--;


          if(
            cart[i].quantity<=0
          ){

            cart.splice(
              i,
              1
            );

          }


          renderCart();

          updateCart();

        }
    );


  document
    .querySelectorAll(
      "[data-plus]"
    )
    .forEach(
      b =>
        b.onclick=()=>{

          cart[
            +b.dataset.plus
          ].quantity++;


          renderCart();

          updateCart();

        }
    );


  document
    .querySelectorAll(
      "[data-sweet]"
    )
    .forEach(
      s =>
        s.onchange=()=>{

          cart[
            +s.dataset.sweet
          ].sweetness =
            s.value;

        }
    );


  document
    .querySelectorAll(
      "[data-ice]"
    )
    .forEach(
      s =>
        s.onchange=()=>{

          cart[
            +s.dataset.ice
          ].ice =
            s.value;

        }
    );

}


/* =========================================================
   提示訊息
   ========================================================= */

function toast(text){

  const t =
    qs("#toast");

  t.textContent =
    text;

  t.classList.add(
    "show"
  );


  setTimeout(
    () =>
      t.classList.remove(
        "show"
      ),
    1600
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
    b =>
      b.onclick=() =>
        render(
          b.dataset.filter
        )
  );


/* =========================================================
   開啟購物車
   ========================================================= */

qs("#cartButton").onclick=()=>{

  renderCart();

  qs("#cartDialog")
    .showModal();

};


/* =========================================================
   關閉購物車
   ========================================================= */

qs("#closeCart").onclick=()=>{

  qs("#cartDialog")
    .close();

};


/* =========================================================
   送出訂單
   ========================================================= */

qs("#orderForm").onsubmit =
  async e => {

    e.preventDefault();


    if(!cart.length){

      return toast(
        "請先選擇商品"
      );

    }


    const formElement =
      e.currentTarget;


    const form =
      new FormData(
        formElement
      );


    /* =====================================================
       ★★★ 取餐時間 ★★★
       從前台 input name="pickupDateTime"
       取得客人填寫的內容
       ===================================================== */

    const pickupDateTime =
      String(
        form.get(
          "pickupDateTime"
        ) || ""
      ).trim();


    /* =====================================================
       取餐時間必填
       ===================================================== */

    if(!pickupDateTime){

      return toast(
        "請填寫取餐時間"
      );

    }


    /* =====================================================
       建立送到 server 的訂單資料
       ===================================================== */

    const payload = {

      customer: {

        name:
          String(
            form.get("name") || ""
          ).trim(),

        phone:
          String(
            form.get("phone") || ""
          ).trim(),

        /* ★ 新增取餐時間 */

        pickupDateTime,

        note:
          String(
            form.get("note") || ""
          ).trim()

      },


      items:

        cart.map(
          ({
            id,
            name,
            price,
            quantity,
            sweetness,
            ice
          }) => ({

            id,

            name,

            price,

            quantity,

            sweetness,

            ice

          })
        ),


      bag1Count:
        bag1Count,


      bag2Count:
        bag2Count

    };


    /* =====================================================
       顯示送出中
       ===================================================== */

    const result =
      qs("#result");


    result.className="";

    result.textContent =
      "送出中…";


    try{

      const r =
        await fetch(
          "/api/orders",
          {
            method:"POST",

            headers:{
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
        await r.json();


      if(!r.ok){

        throw new Error(
          data.message ||
          "送出失敗"
        );

      }


      /* ===================================================
         訂單成功
         =================================================== */

      result.className =
        "success";


      result.innerHTML = `

        訂單已送出！

        <br>

        <strong>
          訂單編號：
          ${data.orderId}
        </strong>

        <br>

        取餐時間：
        <strong>
          ${pickupDateTime}
        </strong>

        <br>

        合計
        $${data.total}

        ，請到店取餐並現場付款。

      `;


      /* ===================================================
         清空購物車
         =================================================== */

      cart.length=0;


      updateCart();


      formElement.reset();


      bag1Count=0;

      bag2Count=0;


      const bag1 =
        qs("#bag1Count");

      const bag2 =
        qs("#bag2Count");


      if(bag1){

        bag1.textContent="0";

      }


      if(bag2){

        bag2.textContent="0";

      }


      renderCart();


    }catch(err){

      result.className =
        "error";


      result.textContent =
        err.message;

    }

  };


/* =========================================================
   購物袋
   ========================================================= */

let bag1Count = 0;

let bag2Count = 0;


function changeBag(
  type,
  amount
){

  if(
    type==="bag1"
  ){

    bag1Count =
      Math.max(
        0,
        bag1Count +
        amount
      );


    document
      .querySelector(
        "#bag1Count"
      )
      .textContent =
        bag1Count;

  }


  if(
    type==="bag2"
  ){

    bag2Count =
      Math.max(
        0,
        bag2Count +
        amount
      );


    document
      .querySelector(
        "#bag2Count"
      )
      .textContent =
        bag2Count;

  }


  renderCart();

}


/* =========================================================
   初始畫面
   ========================================================= */

render();


/* =========================================================
   初始購物袋金額
   ========================================================= */

const bagTotal =
  bag1Count * 1 +
  bag2Count * 2;


const drinkTotal =
  cart.reduce(
    (s,x) =>
      s +
      x.price *
      x.quantity,
    0
  );


qs("#cartTotal")
  .textContent =
    money(
      drinkTotal +
      bagTotal
    );
