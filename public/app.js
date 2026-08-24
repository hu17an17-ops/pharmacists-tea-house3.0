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

function card(p){
  return `<article class="card">
    <div><h3>${p.name}</h3><p>${p.subtitle}</p><div class="price">${money(p.price)}</div></div>
    <button class="choose" data-add="${p.id}">＋ 選擇</button>
  </article>`;
}
function render(filter="全部"){
  const groups = { "紅茶系列":"#blackTea", "鮮奶茶系列":"#milkTea" };
  Object.values(groups).forEach(sel=>qs(sel).innerHTML="");
  const soySection = qs("#soyTea")?.closest("section");
  if (soySection) soySection.style.display = "none";
  products.filter(p=>filter==="全部" || p.category===filter).forEach(p=>{
    const target = groups[p.category];
    if(target) qs(target).insertAdjacentHTML("beforeend", card(p));
  });
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.filter===filter));
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(Number(b.dataset.add)));
  document.querySelectorAll(".section-title").forEach((h)=>{
    const group = h.nextElementSibling;
    h.parentElement.style.display = group && group.children.length ? "" : "none";
  });
}
function add(id){
  const p=products.find(x=>x.id===id);
  const found=cart.find(x=>x.id===id && x.sweetness==="十份" && x.ice==="十份");
  if(found) found.quantity++;
  else cart.push({...p,quantity:1,sweetness:"十分",ice:"正常冰"});
  updateCart();
  toast(`${p.name} 已加入訂單`);
}
function updateCart(){
  qs("#cartCount").textContent=cart.reduce((s,x)=>s+x.quantity,0);
}
function renderCart(){
  const box=qs("#cartItems");
  if(!cart.length){box.innerHTML="<p>目前還沒有選擇商品。</p>";qs("#cartTotal").textContent="$0";return}
  box.innerHTML=cart.map((x,i)=>`<div class="cart-row">
    <strong>${x.name}</strong>　${money(x.price)}
    <div class="cart-controls">
      <button data-minus="${i}">−</button><span>${x.quantity}</span><button data-plus="${i}">＋</button>
      <select data-sweet="${i}">${["無糖","一分","三分","五分","八分","十分"].map(v=>`<option ${x.sweetness===v?"selected":""}>${v}</option>`).join("")}</select>
      <select data-ice="${i}">${["去冰","微冰","少冰","正常冰"].map(v=>`<option ${x.ice===v?"selected":""}>${v}</option>`).join("")}</select>
    </div>
  </div>`).join("");
  qs("#cartTotal").textContent=money(cart.reduce((s,x)=>s+x.price*x.quantity,0));
  document.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{const i=+b.dataset.minus;cart[i].quantity--;if(cart[i].quantity<=0)cart.splice(i,1);renderCart();updateCart()});
  document.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{cart[+b.dataset.plus].quantity++;renderCart();updateCart()});
  document.querySelectorAll("[data-sweet]").forEach(s=>s.onchange=()=>cart[+s.dataset.sweet].sweetness=s.value);
  document.querySelectorAll("[data-ice]").forEach(s=>s.onchange=()=>cart[+s.dataset.ice].ice=s.value);
}
function toast(text){const t=qs("#toast");t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1600)}

document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>render(b.dataset.filter));
qs("#cartButton").onclick=()=>{renderCart();qs("#cartDialog").showModal()};
qs("#closeCart").onclick=()=>qs("#cartDialog").close();

qs("#orderForm").onsubmit=async e=>{
  e.preventDefault();
  if(!cart.length) return toast("請先選擇商品");
const formElement=e.currentTarget;
const form=new FormData(formElement);
  const payload={
    customer:{name:form.get("name"),phone:form.get("phone"),note:form.get("note")},
    items:cart.map(({id,name,price,quantity,sweetness,ice})=>({id,name,price,quantity,sweetness,ice}))
  };
  const result=qs("#result"); result.className=""; result.textContent="送出中…";
  try{
    const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok) throw new Error(data.message||"送出失敗");
    result.className="success";
    result.innerHTML=`訂單已送出！<br><strong>訂單編號：${data.orderId}</strong><br>合計 $${data.total}，請到店取餐並現場付款。`;
    cart.length=0;updateCart();formElement.reset();renderCart();
  }catch(err){result.className="error";result.textContent=err.message}
};

render();
