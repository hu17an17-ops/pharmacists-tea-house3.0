# 藥師的私房紅茶｜線上點餐系統

這是一個重新獨立製作、**不依賴 Supabase** 的 Node.js 線上點餐系統。

## 已包含

- 紅茶系列 7 款
- 鮮奶茶系列 5 款
- 戰豆奶茶 1 款（歸入鮮奶茶系列）
- 甜度、冰度選擇（冰度包含去冰、微冰、少冰、正常冰）
- 購物車
- 姓名、電話、備註
- 送出訂單與訂單編號
- `/admin?key=你的ADMIN_KEY` 訂單管理頁
- 手機版優先設計
- 已移除「古早茶香・每日現泡」介紹文字
- 不再使用 Supabase，因此不會因資料庫漏一筆商品而讓商品從網站消失

## Render

Build Command:
`npm install`

Start Command:
`node server.js`

Environment Variables:
`ADMIN_KEY=請自行設定一組密碼`

> 注意：目前訂單儲存在 Render 本機 `data/orders.json`。Render 免費服務若重建/更換實例，檔案可能不永久保存。
> 如果正式營業要長期保存訂單，下一版建議接 PostgreSQL / Supabase Database。

## 本版視覺更新

- 使用新版「藥師的私房紅茶」主視覺 Banner（`public/hero-banner.jpg`）。
- 重新設計首頁頂部、到店自取資訊卡與商品分類區，保留原有點餐、購物車與訂單 API。
- Server 已補上 JPG/JPEG/PNG/WebP 靜態圖片 MIME type，避免新增圖片後無法正確載入。
