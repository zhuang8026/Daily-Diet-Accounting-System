# PPT 生成 Prompt

---

請幫我製作一份完整的技術簡報，主題為「每日飲食記帳系統（Daily Diet Accounting System，DDAS）」。這是一個個人作品集專案，簡報對象為老師與同學，以技術深度為主軸，流程圖為輔助說明工具，並包含完整的資安設計分析。

請依照以下規格，逐張生成每一張投影片的標題、內容重點、說明文字（講者稿），共 17 張投影片。流程圖投影片請留空白佔位區，標示「【請自行插入流程圖】」即可。

---

## 整體規格

- 語言：繁體中文
- 風格：簡潔技術風，條列為主，避免大段落文字
- 每張投影片包含：①標題 ②內容重點（條列） ③講者稿（2–4 句說明話術）
- 技術亮點部分（Slide 10–13）與資安部分（Slide 11–12）需最詳細，是簡報核心

---

## 四人分工說明

| 講者 | 負責投影片 | 張數 | 主軸 |
|---|---|---|---|
| Person A | Slide 1–3 | 3 張 | 開場、故事、用戶視角 |
| Person B | Slide 4–7 | 4 張 | 架構設計、四張流程圖 |
| Person C | Slide 8–12 | 5 張 | 功能展示、JWT 認證、資安設計 |
| Person D | Slide 13–17 | 5 張 | 技術深度、測試、總結 |

---

## 專案背景知識（供生成參考）

**系統名稱**：每日飲食記帳系統（DDAS）
**系統目的**：記錄三餐、追蹤每日熱量與三大營養素（蛋白質、脂肪、碳水），支援個人目標設定與趨勢報表，並提供管理員後台。

**使用者角色**：
- 一般用戶：登入/註冊、飲食紀錄 CRUD、食物搜尋、趨勢報表、個人設定
- 管理員：繼承所有用戶功能，另有後台管理（食物 CRUD、用戶管理、公告管理、操作日誌）

**技術棧**：
- 前端：React 18 + Vite 5、React Router v6（HashRouter）、Bootstrap 5.3、Chart.js 4.4、axios、SCSS
- 後端：FastAPI（Python）、JWT（python-jose）、passlib[bcrypt]、uvicorn、in-memory store
- 測試：Playwright E2E
- 版本控制：Git，三個主要 branch

**版本演進**：
- master branch：原始 vanilla JS SPA，所有資料存於 localStorage（ddas_users、ddas_session、ddas_records_{userId} 等）
- upgrade_react branch：完整遷移至 React 18 + Vite 5，引入 Component 架構、Context API、axios
- python_c branch（現行版）：新增 FastAPI 後端，資料層從 localStorage 改為後端 in-memory store，認證改為 JWT Bearer Token

**後端目錄結構**：
```
backend/
  main.py            # FastAPI 入口，掛載 CORS 與 Router
  config.py          # JWT 設定、CORS 來源
  schemas.py         # Pydantic v2 資料模型（6 個 domain，239 行）
  store.py           # in-memory 資料層 singleton
  utils/
    auth_utils.py    # JWT 簽發/驗證、密碼雜湊（bcrypt）
    dependencies.py  # FastAPI Depends：get_current_user、require_admin
    logger.py        # Thread-safe 操作日誌（寫入 ddas.log）
  routers/
    auth.py          # POST /auth/login、/auth/register、GET /auth/me
    foods.py         # 食物 CRUD + 搜尋 + CSV 匯入
    records.py       # 飲食紀錄 CRUD + 日摘要 + 區間摘要
    profile.py       # 個人設定讀寫
    announcements.py # 公告管理
    admin.py         # 後台統計、用戶管理、日誌查詢
  mock/
    users.py         # Seed 帳號（demo / admin）
    foods.py         # 10 筆初始食物資料
    records.py       # 載入 demoRecords.json
```

**前端目錄結構**：
```
client/src/
  main.jsx              # 入口，載入 Bootstrap + SCSS
  App.jsx               # HashRouter + AuthProvider + ToastProvider
  router/index.js       # 路由定義（guestRoutes / authRoutes / adminRoutes）
  context/
    AuthContext.jsx     # 全域登入狀態，讀取 localStorage ddas_session
    ToastContext.jsx    # 全域 Toast 通知
  components/
    Layout.jsx          # 登入後共用外框（Header + Sidebar + BottomNav + Outlet）
    Header.jsx          # 頂部導覽、登出
    Sidebar.jsx         # 桌面左側導覽
    BottomNav.jsx       # 手機底部導覽
  assets/api/
    apiClient.js        # axios instance，自動附 JWT Bearer header，401 自動導向登入
    auth.js             # 登入/註冊/登出/getCurrentSession
    recordService.js    # 飲食紀錄 API 呼叫
    foodService.js      # 食物 API 呼叫
    profileService.js   # 個人設定 API 呼叫
    announcementService.js
  pages/
    Dashboard.jsx       # 每日飲食紀錄 + 熱量圓餅圖 + 進度條
    FoodSearch.jsx      # 食物搜尋（debounce）+ 類別篩選 + 快速紀錄
    Report.jsx          # 7/30 天趨勢折線圖
    Settings.jsx        # 個人資料、BMR 計算、飲食目標設定
    Login.jsx / Register.jsx
    admin/
      AdminDashboard.jsx   # 平台統計、Top 食物、今日活躍用戶
      AdminFoods.jsx       # 食物 CRUD + CSV 批量匯入
      AdminRecords.jsx     # 全用戶紀錄查詢 + 篩選 + 匯出
      AdminUsers.jsx       # 用戶管理（啟用/停用/角色變更/密碼重設）
      AdminAnnouncements.jsx
      AdminLogs.jsx        # 操作審計日誌（讀取 ddas.log）
```

**Seed 帳號**：
- 一般用戶：demo@demo.com / Demo@123
- 管理員：admin@demo.com / Admin@123

**重要技術細節**：

1. JWT 認證流程：
   - POST /auth/login → 後端驗證 email/password → 回傳 JWT access_token
   - 前端存入 localStorage（ddas_token、ddas_session）
   - 每次 API 請求 apiClient.js 自動附加 Authorization: Bearer <token>
   - 401 回應 → 自動清除 token 並導向 /login

2. 帳號鎖定機制：
   - 同一 email 登入失敗累計 5 次 → 鎖定 15 分鐘
   - 鎖定期間回傳 HTTP 401，detail 包含 {locked: true, message: "...剩餘分鐘數"}
   - 前端顯示倒數提示，鎖定到期後自動解除

3. 資安機制完整清單（已實作）：
   - 密碼儲存：bcrypt 雜湊（cost factor 10），絕不明文儲存
   - JWT：HS256 簽發，有效期 24 小時，含 exp claim
   - 雙層授權：get_current_user() 驗 JWT + isActive；require_admin() 額外驗 role
   - 帳號鎖定：失敗 5 次 → 鎖定 15 分鐘，防止暴力破解
   - 密碼強度驗證：長度 ≥ 6，至少含大寫、小寫、數字、特殊符號中的 3 種
   - Pydantic v2 型別驗證：所有 API 請求強制型別檢查，422 自動攔截格式錯誤
   - CORS 白名單：限制允許來源（localhost:5173、localhost:4173）
   - 路由守衛三層：GuestOnly / RequireAuth / RequireAdmin
   - 401 攔截器：過期 token 自動清除並導向登入頁
   - 操作審計日誌：11 種敏感操作自動記錄，管理員可查閱

4. 資安風險（現存待改善）：
   高風險：
   - JWT_SECRET 硬編碼在 config.py（"ddas-dev-secret-key-change-in-production"），任何人看到程式碼即可偽造 token
   - Token 存於 localStorage，XSS 攻擊可竊取，HttpOnly Cookie 更安全
   - 管理員重設密碼 API 未驗證新密碼強度，可設為 "123"
   中風險：
   - sanitizeInput() 只移除 HTML 標籤，無法防 CSS injection 與 on* 事件屬性，應改用 DOMPurify
   - 臨時密碼使用 Math.random() 非密碼學安全亂數，應改用 crypto.getRandomValues()
   - Email 驗證太弱（僅檢查含 @ 和 .），abc@a. 可通過
   低風險：
   - 密碼長度無上限，超長密碼可消耗過多 bcrypt 計算資源
   - admin/records API 無分頁，大量資料可被利用做 DoS

5. FoodSearch Debounce Stale Closure Bug 修復：
   - 原始問題：在 setTimeout callback 內呼叫 loadFoods()，callback 捕捉到舊的 keyword closure，導致搜尋完全無效
   - 根本原因：React state 在 setTimeout closure 裡是快照值，不會更新
   - 修法：引入 debouncedKeyword state，useEffect([keyword]) cleanup 模式實作 debounce，主搜尋 useEffect 改依賴 [debouncedKeyword, category, calMin, calMax, page]
   - 驗證：Playwright 測試輸入「雞胸肉」正確篩出 1 筆

6. Thread-safe Logger：
   - backend/utils/logger.py 使用 threading.Lock() 防止並發寫入時日誌交錯
   - 日誌格式：[YYYY-MM-DD HH:MM:SS] user | action | detail
   - 11 種寫入事件：AUTH_LOGIN、AUTH_REGISTER、ADD_FOOD、UPDATE_FOOD、DELETE_FOOD、IMPORT_FOOD_CSV、DELETE_USER、UPDATE_USER_STATUS、UPDATE_USER_ROLE、RESET_PASSWORD、DELETE_RECORD
   - read_logs() 解析後以最新到最舊順序回傳，前端 AdminLogs.jsx 直接顯示

7. 後端架構分層設計（utils/ 重構）：
   - 原本 auth_utils.py、dependencies.py、logger.py 散落在根目錄
   - 重構後集中至 utils/ 子目錄，統一工具層職責
   - store.py 保留根目錄（in-memory 資料層，非工具）
   - schemas.py 保留根目錄（Pydantic 資料模型）
   - 重構後更新 13 個 import 路徑，啟動與 API 測試全部通過

8. Playwright E2E 測試：
   - 6 個測試檔案：auth.spec.ts、records.spec.ts、adminFoods.spec.ts、report.spec.ts、rwd.spec.ts、settings.spec.ts
   - 驗證登入流程、飲食紀錄 CRUD、管理員操作、響應式佈局、FoodSearch debounce 修復

**流程圖說明（講者需對每張圖做 1–1.5 分鐘說明）**：
- user-flow：展示兩種角色（用戶/管理員）的功能節點與繼承關係
- system-flow：展示 React 元件層次（main.jsx → Provider → Router → 路由守衛 → Layout → Pages → Service 層）
- data-flow（DFD）：展示資料如何在用戶操作與儲存層之間流動（注意：此圖為早期設計，資料存於 localStorage，現行版已改為後端 API）
- program-flow：展示程式從啟動到登入到 Dashboard 操作的完整執行路徑（注意：登入流程現行版改為 JWT + 後端驗證）

---

## 投影片內容規格（逐張）

### Slide 1｜專案介紹
**負責講者：Person A**
- 標題：每日飲食記帳系統（DDAS）
- 內容：系統目的（記三餐、追蹤熱量與三大營養素）、兩種使用者角色、核心功能清單（用戶側 5 項 + 管理員側 5 項）、技術棧快覽
- 講者稿：簡短介紹這個系統解決什麼問題，目標用戶是誰，整體功能範圍

---

### Slide 2｜開發歷程
**負責講者：Person A**
- 標題：版本演進
- 內容：三個 branch 的時間軸與對比表格
- 對比表格維度：前端框架、資料層、認證機制、測試
  - master：vanilla JS、localStorage、前端 bcrypt、無測試
  - upgrade_react：React 18 + Vite、localStorage、前端 bcrypt、無測試
  - python_c（現行）：React 18 + Vite、FastAPI in-memory、JWT Bearer、Playwright
- 講者稿：說明為什麼從 vanilla JS 遷移到 React，以及為什麼需要加入 FastAPI 後端，每一步的動機與收穫

---

### Slide 3｜使用者角色與功能範圍（user-flow）
**負責講者：Person A**
- 標題：使用者角色與功能範圍
- 內容：【請自行插入 user-flow 流程圖】+ 兩種角色功能條列說明
  - 一般用戶：帳號管理、飲食紀錄 CRUD、食物搜尋篩選、趨勢報表、個人設定
  - 管理員（繼承用戶所有功能）：統計總覽、食物資料庫管理、用戶帳號管理、全用戶紀錄查詢、公告管理、操作日誌
- 講者稿：說明兩種角色的差異，管理員繼承用戶所有功能並擁有後台管理權限，點出流程圖中的關鍵功能節點

---

### Slide 4｜前端元件架構（system-flow）
**負責講者：Person B**
- 標題：前端元件架構
- 內容：【請自行插入 system-flow 流程圖】+ 各層職責說明
  - 啟動層：main.jsx（載入 Bootstrap、SCSS）
  - Provider 層：AuthProvider（全域登入狀態）、ToastProvider（全域通知）
  - 路由層：HashRouter → AppRoutes → 三種守衛（GuestOnly / RequireAuth / RequireAdmin）
  - 頁面層：Layout.jsx（Header + Sidebar + BottomNav）+ 7 個一般頁面 + 6 個管理員頁面
  - Service 層：6 個 service 檔案，統一呼叫後端 API
- 講者稿：說明 React 的元件層次設計，重點點出三種路由守衛的角色與差異，Service 層如何解耦 UI 與 API 呼叫

---

### Slide 5｜系統整體架構
**負責講者：Person B**
- 標題：系統整體架構（前後端分離）
- 內容：
  - 架構示意（文字版）：React SPA（client/）← axios JWT → FastAPI（backend/）→ in-memory store
  - 技術棧清單：前端 / 後端 / 測試 / 版本控制
  - 後端目錄分層：入口層（main.py）/ 設定層（config.py）/ 模型層（schemas.py）/ 資料層（store.py）/ 工具層（utils/）/ 路由層（routers/）/ Mock 層（mock/）
  - API 端點總覽：/auth、/foods、/records、/profile、/announcements、/admin
- 講者稿：說明前後端如何透過 JWT Bearer Token 通訊，後端各層的職責分工，以及 in-memory store 的設計取捨

---

### Slide 6｜資料流設計（data-flow）
**負責講者：Person B**
- 標題：資料流設計（DFD）
- 內容：【請自行插入 data-flow 流程圖】+ 說明文字
  - 圖中角色：一般用戶、管理員
  - 圖中流程：身份驗證 → 飲食紀錄管理 → 食物資料庫 → 個人設定 → 趨勢報表 → 公告管理
  - 管理員後台統一存取所有資料
  - 重要說明：此圖為早期設計（D1–D6 為 localStorage 資料儲存），現行版資料層已移至 FastAPI 後端 store.py
- 講者稿：說明用戶操作如何驅動資料讀寫，點出一般用戶與管理員的資料存取範圍差異，主動說明架構演進

---

### Slide 7｜程式執行流程（program-flow）
**負責講者：Person B**
- 標題：程式執行流程
- 內容：【請自行插入 program-flow 流程圖】+ 說明文字
  - 主要路徑：啟動 → Session 檢查 → 登入/註冊判斷 → 帳號鎖定分支 → 密碼驗證 → 角色分流 → Dashboard 操作循環 → 登出
  - 重要說明：此圖為舊版流程（前端 bcrypt + localStorage），現行版登入改為 POST /auth/login → 後端驗證 → JWT 回傳
- 講者稿：走一遍主要執行路徑，重點說明帳號鎖定的分支邏輯，以及角色判斷後的路由分流，主動說明現行版的差異

---

### Slide 8｜核心功能展示 — 用戶側
**負責講者：Person C**
- 標題：核心功能 — 用戶側
- 內容：四個頁面截圖佔位區 + 各頁面功能說明
  - Dashboard：每日飲食紀錄清單、熱量圓餅圖（Chart.js）、三大營養素進度條、Modal 新增/編輯紀錄
  - FoodSearch：關鍵字搜尋（debounce 防抖）、類別篩選、熱量範圍篩選、分頁、快速加入紀錄
  - Report：7 / 30 天趨勢折線圖（Chart.js）、熱量與三大營養素趨勢分析
  - Settings：身高體重性別年齡輸入、BMR 自動計算、活動量選擇、每日熱量目標設定
- 講者稿：簡介各頁面主要功能，說明 Dashboard 是核心使用場景，可搭配 live demo

---

### Slide 9｜核心功能展示 — 管理員側
**負責講者：Person C**
- 標題：核心功能 — 管理員側
- 內容：四個頁面截圖佔位區 + 各頁面功能說明
  - AdminDashboard：今日活躍用戶數、本週紀錄總數、食物資料庫筆數、Top 10 食物排行、今日用戶紀錄
  - AdminFoods：食物 CRUD、CSV 批量匯入（逐行錯誤回報）
  - AdminUsers：用戶清單、啟用/停用帳號、角色變更（user/admin）、密碼重設
  - AdminLogs：操作審計日誌，顯示時間戳、操作者 email、操作類型（Badge 顯示）、詳情
- 講者稿：說明管理員後台的設計思路，強調 AdminLogs 對系統可稽核性的重要意義

---

### Slide 10｜技術亮點 — JWT 認證 + 帳號鎖定
**負責講者：Person C**
- 標題：JWT 認證機制與帳號鎖定
- 內容：
  - JWT 登入流程：
    1. POST /auth/login → 後端驗 email/password
    2. 成功 → 簽發 JWT（HS256，24 小時有效，payload 含 userId / email / role / exp）
    3. 前端存入 localStorage（ddas_token、ddas_session）
    4. 每次請求 apiClient.js 自動附加 Authorization: Bearer <token>
    5. 401 回應 → 自動清除 token 並導向 /login
  - 雙層授權：
    - get_current_user()：解碼 JWT + 驗 isActive（停用帳號即踢出）
    - require_admin()：額外驗 role === "admin"
  - 帳號鎖定：
    - 失敗累計 5 次 → 鎖定 15 分鐘
    - HTTP 401 回傳 {locked: true, message: "剩餘 N 分鐘"}
    - 前端解析並顯示倒數，鎖定到期自動解除
- 講者稿：說明為什麼選擇 JWT 而非 Session，雙層授權的設計考量，帳號鎖定如何防止暴力破解，以及 axios 攔截器如何讓所有頁面共用同一套認證邏輯

---

### Slide 11｜資安設計 — 已實作防禦機制
**負責講者：Person C**
- 標題：資安設計 — 已實作防禦機制
- 內容：
  - 密碼安全：
    - bcrypt 雜湊（cost factor 10），絕不明文儲存
    - 密碼強度驗證：長度 ≥ 6，至少含大寫、小寫、數字、特殊符號中的 3 種
  - 認證授權：
    - JWT HS256 + exp claim，有效期 24 小時
    - 雙層保護：isActive 驗證 + role 驗證
    - 三層路由守衛：GuestOnly / RequireAuth / RequireAdmin
    - 401 攔截器自動清除過期 token
  - 輸入驗證：
    - Pydantic v2 強制型別驗證，422 自動攔截格式錯誤
    - Email 格式驗證、角色值限制（user / admin）
  - 網路層：
    - CORS 白名單限制允許來源
    - 帳號鎖定防暴力破解
  - 可稽核性：
    - Thread-safe logger 記錄 11 種敏感操作
    - 管理員可即時查閱完整操作歷史
- 講者稿：說明系統在設計階段就考慮了多層次資安防護，從密碼儲存、認證授權、輸入驗證到操作可稽核性都有對應機制

---

### Slide 12｜資安設計 — 風險識別與改善計畫
**負責講者：Person C**
- 標題：資安設計 — 現存風險與改善方向
- 內容：
  - 高風險（需立即處理）：
    - JWT_SECRET 硬編碼在 config.py → 改為 os.getenv("JWT_SECRET")，搭配 .env 檔
    - Token 存於 localStorage，XSS 攻擊可竊取 → 正式環境應改為 HttpOnly Cookie
    - 密碼重設 API 未驗強度 → 補上與 /register 相同的強度檢查
  - 中風險（建議改善）：
    - sanitizeInput() 只移除 HTML 標籤，無法防 CSS injection → 改用 DOMPurify 套件
    - 臨時密碼使用 Math.random()（非密碼學安全）→ 改用 crypto.getRandomValues()
    - Email 驗證太弱 → 使用 email-validator 套件
  - 低風險（長期規劃）：
    - 密碼長度無上限 → 設定最大 128 字元防 DoS
    - admin/records 無分頁 → 加入 limit/offset 分頁機制
- 講者稿：展示對系統現存資安問題的清楚認識，說明哪些是 Demo 階段的設計取捨，哪些是正式部署前必須修復的項目，以及對應的解決方案

---

### Slide 13｜技術亮點 — FoodSearch Debounce Stale Closure 修復
**負責講者：Person D**
- 標題：React Stale Closure Bug 修復（FoodSearch Debounce）
- 內容：
  - 問題描述：在 setTimeout callback 內呼叫 loadFoods()，因 React state 快照特性，callback 永遠捕捉到初始的空字串 keyword，導致輸入任何關鍵字都查不到結果
  - 根本原因：JavaScript closure 在 setTimeout 建立時封存了當時的 state 值，後續 state 更新不影響已建立的 closure
  - 修法（三步驟）：
    1. 新增 debouncedKeyword state
    2. useEffect([keyword]) 內用 setTimeout 延遲更新 debouncedKeyword，cleanup 函式 clearTimeout 取消上一次計時
    3. 主搜尋 useEffect 改為依賴 [debouncedKeyword, category, calMin, calMax, page]
  - 結果：Playwright 測試驗證通過（輸入「雞胸肉」正確篩出 1 筆）
- 講者稿：這是開發過程中遇到的真實 bug，說明 React state 快照與 JavaScript closure 的互動陷阱，以及如何透過引入中間 state 解耦 debounce 邏輯與搜尋邏輯，是理解 React hooks 執行機制的重要案例

---

### Slide 14｜技術亮點 — 後端架構分層設計
**負責講者：Person D**
- 標題：後端架構分層設計
- 內容：
  - 七層結構：
    - 入口層：main.py（FastAPI app、CORS middleware、Router 掛載）
    - 設定層：config.py（JWT secret、演算法、有效期、CORS 來源）
    - 模型層：schemas.py（Pydantic v2，6 個 domain，239 行）
    - 資料層：store.py（in-memory singleton，重啟後重置）
    - 工具層：utils/（auth_utils.py、dependencies.py、logger.py）
    - 路由層：routers/（6 個 router，對應 6 個功能域）
    - Mock 層：mock/（Seed 資料，啟動時注入 store）
  - 重構過程：
    - 問題：auth_utils.py、dependencies.py、logger.py 原本散落根目錄，層次不清
    - 解法：整合至 utils/ 子目錄，統一工具層職責
    - 執行：13 個 import 路徑更新，啟動測試與 API 測試全部通過
- 講者稿：說明後端分層設計的考量，每一層的單一職責如何讓程式碼更易維護，以及重構過程中如何確保不破壞現有功能

---

### Slide 15｜技術亮點 — Thread-safe Logger + Playwright E2E 測試
**負責講者：Person D**
- 標題：Thread-safe Logger 與 E2E 測試
- 內容：
  - Thread-safe Logger（utils/logger.py）：
    - 使用 threading.Lock() 確保 FastAPI 多執行緒並發時寫入不交錯
    - 日誌格式：[YYYY-MM-DD HH:MM:SS] user | action | detail
    - 11 種操作類型自動記錄（AUTH_LOGIN、ADD_FOOD、DELETE_USER 等）
    - read_logs() 解析 + 倒序排列，AdminLogs.jsx 即時呈現
    - 日誌路徑：backend/ddas.log（.gitignore 排除，不進版本控制）
  - Playwright E2E 測試（client/tests/）：
    - 6 個測試檔案：auth.spec.ts / records.spec.ts / adminFoods.spec.ts / report.spec.ts / rwd.spec.ts / settings.spec.ts
    - 涵蓋：登入/註冊流程、飲食紀錄 CRUD、管理員食物操作、趨勢報表、響應式佈局、個人設定
    - 驗證 FoodSearch debounce stale closure 修復成效
- 講者稿：說明為什麼需要 thread-safe logger（FastAPI ASGI 伺服器處理並發請求時可能同時觸發多個 write_log），以及 Playwright 如何透過真實瀏覽器操作驗證功能正確性

---

### Slide 16｜已知問題與未來規劃
**負責講者：Person D**
- 標題：已知問題與未來規劃
- 內容：
  - 現況限制：
    - in-memory store：後端重啟後資料清空，不適合正式部署
    - apiClient.js baseURL 硬編碼 localhost:8000，GitHub Pages 部署後 API 全失敗
    - JWT_SECRET 硬編碼（資安高風險，需移至環境變數）
    - data-flow / program-flow 流程圖為早期版本，未反映現行架構
  - 未來規劃：
    - 資料層：store.py 替換為 SQLAlchemy + SQLite / PostgreSQL，確保資料持久化
    - 部署：apiClient.js 改用 import.meta.env.VITE_API_URL，支援真實部署環境
    - 資安強化：JWT_SECRET 移至 .env、密碼重設加強度驗證、sanitizeInput 改用 DOMPurify
    - 文件更新：更新四張流程圖至現行前後端分離架構
- 講者稿：展示對系統現況的清楚認識，區分哪些是 Demo 階段的合理取捨，哪些是正式上線前的必要工作

---

### Slide 17｜結語
**負責講者：Person D**
- 標題：總結
- 內容：
  - 專案成果摘要：
    - 完整前後端分離系統（React 18 + FastAPI）
    - JWT 認證 + 帳號鎖定 + 多層資安防護
    - Thread-safe 操作審計日誌
    - Playwright E2E 測試覆蓋 6 大功能模組
  - 技術收穫：
    - React Stale Closure 實戰修復
    - 後端分層架構設計與重構實踐
    - 前後端整合與 JWT 認證機制
    - 資安設計思維（已實作 + 風險識別）
  - Demo 帳號：
    - 一般用戶：demo@demo.com / Demo@123
    - 管理員：admin@demo.com / Admin@123
- 講者稿：簡短總結整個專案的技術廣度與深度，開放 QA

---

請依照以上規格，生成每一張投影片的完整內容，格式為 Markdown，每張投影片用 `---` 分隔，包含：標題、負責講者標示、內容重點（條列）、講者稿。
