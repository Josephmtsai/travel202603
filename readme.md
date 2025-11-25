# 請依下面定建立網站 

Tech

1. 使用 vue 3 + vite 建立網站
2. 會使用github Page+github action auto commit code 以及推到github page 的branch上面
3. 使用PWA 將網站註冊到APP上


功能:

主要是要像日曆這樣 顯示五天的沖繩行程
行程格式如下

讀取此EXCEL 
https://docs.google.com/spreadsheets/d/1Q8VTiTPLl0EbonoV9_aWVxKR4cwNqtsxxmj4xx58sbo/edit?gid=237558355#gid=237558355

有兩個TAB 格式分別如下 如果點了DiningId會彈出對應的選擇 可
Itinerary

Day	Date	Time	Title	Desc	DiningID
D1	2026/03/07 (六)	14:15	抵達那霸機場 (OKA)	領行李、辦理入境	
D1	2026/03/07 (六)	15:15	搭乘接駁車取車	前往國內線航廈外搭車	
D1	2026/03/07 (六)	16:30	取車 & 導航設定	檢查車況、安裝汽座	
D1	2026/03/07 (六)	17:30	San-A Ishikawa City	中部超市補給 (水、零食)	
D1	2026/03/07 (六)	19:00	Check-in 蒙特利酒店	恩納村度假飯店入住	
D1	2026/03/07 (六)	19:30	晚餐：恩納村	點擊查看推薦清單	dinner_d1

Restaurants


DiningID	Name	Tag	Note	Link
dinner_d1	浜の家海鮮料理	首選/親子	榻榻米、奶油烤魚(無刺)、好停車	https://www.google.com/maps/search/?api=1&query=浜の家海鮮料理+恩納
dinner_d1	琉球亭	居酒屋	就在飯店對面、步行可達	https://www.google.com/maps/search/?api=1&query=琉球亭+恩納
dinner_d1	恩納蕎麥麵	快速	排骨麵、榻榻米座位	https://www.google.com/maps/search/?api=1&query=恩納そば
dinner_d2	燒肉五苑 名護店	燒肉	適合家庭、連鎖店、好停車	https://www.google.com/maps/search/?api=1&query=焼肉五苑+名護店
dinner_d2	暖暮拉麵 名護店	拉麵	九州第一名、通常需排隊	https://www.google.com/maps/search/?api=1&query=暖暮拉麵+名護

---

## 專案說明

- 前端框架：Vue 3 + Vite（程式碼位於 `app/` 目錄）
- 資料來源：Google Sheet `Itinerary` / `Restaurants` 兩個分頁，使用 CSV API 即時載入
- PWA：整合 `vite-plugin-pwa`，提供離線快取、Icon 與安裝提示
- 版控/部署：預設支援 GitHub Actions，自動建置並佈署至 `gh-pages` 分支供 GitHub Pages 使用

專案結構：

```
.
├─ readme.md                   # 需求說明＋操作指南
├─ Resturant.csv               # 餐廳資料的離線備份
└─ app/
   ├─ src/                     # Vue 原始碼
   ├─ public/                  # PWA icon、靜態資源
   ├─ package.json             # 專案依賴
   └─ vite.config.js           # 已啟用 PWA 與 GitHub Pages base
```

## 快速開始

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # 產生 dist/
```

> 開發模式下即可直接同步 Google Sheet 資料；若需離線 demo，可於 Sheet 設定「可公開閱讀」或暫時把資料貼到 `Resturant.csv` / Itinerary tab 中做測試。

## Google Sheet 資料來源

- Sheet ID：`1Q8VTiTPLl0EbonoV9_aWVxKR4cwNqtsxxmj4xx58sbo`
- 欄位需維持 `Day / Date / Time / Title / Desc / DiningID` 與 `DiningID / Name / Tag / Note / Link`
- `DiningID` 會自動關聯餐廳列表，行程卡上會出現「查看 XXX 推薦」按鈕並開啟 modal。

若需要更換資料來源，只要在 `src/App.vue` 中更新 `SHEET_ID` 或 `SHEETS` 常數即可。

## PWA 使用方式

- 首次載入成功後，瀏覽器將快取主要資源並支援離線顯示
- iOS/Android 可透過瀏覽器的「加入主畫面」把網站安裝成 App
- Icon 檔案位於 `app/public/pwa-192.png`、`pwa-512.png`，可依需求替換

## GitHub Pages 自動部署

`.github/workflows/deploy.yml` 已設定完成，流程：

1. 推送到 `main` branch（或手動點擊 workflow）即會觸發
2. 使用 Node.js 20 安裝 `app/` 內的依賴並執行 `npm run build`
3. 自動把 `app/dist` 發佈到 `gh-pages` 分支
4. 在 GitHub 專案設定中將 Pages 指向 `gh-pages` 即可完成部署

如需調整 Node 版本、分支或輸出路徑，可修改 workflow 對應欄位。

## 客製化建議

- 想顯示不同天數：只要在 Google Sheet 新增 Day 資料，前端會自動依照 `D1、D2...` 排序
- 行程卡／顏色：可在 `src/style.css` 調整，全部使用 CSS 變數與 BEM-ish class 命名
- 如需加上多語系，可在 `App.vue` 中補上 i18n 或建立其他元件拆分

有其他想法歡迎再提出 😊