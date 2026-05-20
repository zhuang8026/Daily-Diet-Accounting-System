# PPT 生成 Prompt

---

## 任務說明

請幫我製作一份完整的技術簡報，主題為「每日飲食記帳系統（Daily Diet Accounting System，DDAS）」。

- **簡報對象**：老師與同學
- **主軸**：技術深度，條列為主，避免大段落文字
- **張數**：共 17 張投影片
- **語言**：繁體中文

**重要：請直接依序生成全部 17 張投影片，不要詢問確認，不要中途停頓。**

---

## 輸出格式規範

每張投影片輸出如下格式（以 `---` 分隔）：

```
## Slide N｜標題

**負責講者：Person X**

### 內容重點
- 條列一
- 條列二
  - 子項目

### 講者稿
（2–4 句說明話術，口語化，適合現場報告）
```

流程圖投影片的內容重點中，請在對應位置加入：
> 【請自行插入流程圖】

---

## 四人分工

| 講者 | 負責投影片 | 主軸 |
|---|---|---|
| Person A | Slide 1–3 | 開場、版本演進、用戶視角 |
| Person B | Slide 4–7 | 架構設計、四張流程圖 |
| Person C | Slide 8–12 | 功能展示、JWT 認證、資安設計 |
| Person D | Slide 13–17 | 技術深度、測試、總結 |

---

## 專案背景知識

**系統目的**：記錄三餐、追蹤每日熱量與三大營養素（蛋白質、脂肪、碳水），支援個人目標設定與趨勢報表，提供管理員後台。

**使用者角色**：
- 一般用戶：登入/註冊、飲食紀錄 CRUD、食物搜尋、趨勢報表、個人設定
- 管理員：繼承所有用戶功能，另有後台（食物 CRUD、用戶管理、公告管理、操作日誌）

**技術棧**：
- 前端：React 18 + Vite 5、React Router v6（HashRouter）、Bootstrap 5.3、Chart.js 4.4、axios、SCSS
- 後端：FastAPI（Python）、JWT（python-jose）、passlib[bcrypt]、uvicorn、in-memory store
- 測試：Playwright E2E（38 個測試案例，chromium + mobile 全數通過）
- 版本控制：Git，三個主要 branch

**版本演進**：

| Branch | 前端框架 | 資料層 | 認證機制 | 測試 |
|---|---|---|---|---|
| master | vanilla JS | localStorage | 前端 bcrypt | 無 |
| upgrade_react | React 18 + Vite | localStorage | 前端 bcrypt | 無 |
| python_c（現行） | React 18 + Vite | FastAPI in-memory | JWT + HttpOnly Cookie | Playwright |

**現行版（python_c）認證機制**：
- POST /auth/login → 後端驗證 → 簽發 JWT（HS256，24 小時）
- 後端以 `response.set_cookie(httponly=True, samesite="lax")` 回傳 Token，JavaScript 無法讀取
- 前端 axios 設定 `withCredentials: true` 自動帶出 Cookie，無需手動附加 Header
- 前端 localStorage 只存 `ddas_session`（顯示名稱等 UI 資訊），Token 本體不落地
- POST /auth/logout → 後端 `response.delete_cookie()` 清除 Cookie

**後端目錄結構**：
```
backend/
  main.py            # FastAPI 入口，掛載 CORS 與 Router
  config.py          # JWT 設定（secret、演算法、Cookie 參數）、CORS 來源
  schemas.py         # Pydantic v2 資料模型（6 個 domain）
  store.py           # in-memory 資料層 singleton（重啟後重置）
  utils/
    auth_utils.py    # JWT 簽發/驗證、密碼雜湊（bcrypt）
    dependencies.py  # FastAPI Depends：get_current_user（Cookie）、require_admin
    logger.py        # Thread-safe 操作日誌（threading.Lock，寫入 ddas.log）
  routers/
    auth.py          # POST /auth/login、/auth/register、/auth/logout、GET /auth/me
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
  assets/api/
    apiClient.js        # axios instance，withCredentials: true，401 自動導向登入
    auth.js             # 登入/註冊/登出
    recordService.js / foodService.js / profileService.js
  pages/
    Dashboard.jsx       # 每日飲食紀錄 + 熱量圓餅圖 + 進度條
    FoodSearch.jsx      # 食物搜尋（debounce 防抖）+ 類別篩選 + 快速紀錄
    Report.jsx          # 7/30 天趨勢折線圖（Chart.js）
    Settings.jsx        # 個人資料、BMR 計算、飲食目標設定
    admin/              # AdminDashboard / AdminFoods / AdminUsers / AdminLogs 等
```

**Seed 帳號**：
- 一般用戶：demo@demo.com / Demo@123
- 管理員：admin@demo.com / Admin@123

**資安機制（已實作）**：
- 密碼：bcrypt 雜湊（cost factor 10），強度驗證（長度 ≥ 6，至少 3 種字元類型）
- JWT：HS256，24 小時有效，含 exp claim
- HttpOnly Cookie：Token 不暴露給 JavaScript，防止 XSS 竊取
- 雙層授權：`get_current_user()`（Cookie 解碼 + isActive）、`require_admin()`（role 驗證）
- 帳號鎖定：登入失敗累計 5 次 → 第 5 次直接回傳 `{locked: true, message: "..."}` + 鎖定 15 分鐘
- Pydantic v2 型別驗證：所有 API 請求 422 自動攔截格式錯誤
- CORS 白名單：限制來源（localhost:5173、localhost:4173）
- 三層路由守衛：GuestOnly / RequireAuth / RequireAdmin
- server-side logout：POST /auth/logout 清除 Cookie，Token 完全失效
- Thread-safe logger：11 種敏感操作自動記錄，管理員可查閱

**資安風險（現存）**：
- 高風險：JWT_SECRET 硬編碼在 config.py → 應改為 `os.getenv("JWT_SECRET")` + .env 檔
- 高風險：密碼重設 API 未驗強度 → 應補上與 /register 相同的強度檢查
- 中風險：sanitizeInput() 只移除 HTML 標籤 → 應改用 DOMPurify
- 中風險：臨時密碼用 Math.random()（非密碼學安全）→ 應改用 crypto.getRandomValues()
- 低風險：密碼無長度上限 → 設定最大 128 字元防 DoS
- 已修復：Token 存於 localStorage（XSS 可竊取）→ 已改為 HttpOnly Cookie

**FoodSearch Debounce Stale Closure Bug 修復**：
- 問題：setTimeout callback 捕捉到舊的 keyword closure，輸入任何關鍵字都查不到結果
- 根本原因：React state 在 setTimeout closure 是快照值，不隨後續更新
- 修法：引入 `debouncedKeyword` state，useEffect cleanup 模式實作 debounce
- 驗證：Playwright 測試輸入「雞胸肉」正確篩出 1 筆

**Thread-safe Logger**：
- `utils/logger.py` 使用 `threading.Lock()` 防止並發寫入交錯
- 格式：`[YYYY-MM-DD HH:MM:SS] user | action | detail`
- 11 種事件：AUTH_LOGIN、AUTH_REGISTER、ADD_FOOD、UPDATE_FOOD、DELETE_FOOD、IMPORT_FOOD_CSV、DELETE_USER、UPDATE_USER_STATUS、UPDATE_USER_ROLE、RESET_PASSWORD、DELETE_RECORD

**Playwright E2E 測試**：
- 7 個 TC（TC-001～TC-007），6 個測試檔案
- 雙平台：chromium（Desktop Chrome）+ mobile（Pixel 5），共 38 個測試案例全數通過
- 涵蓋：登入/註冊/帳號鎖定、飲食紀錄 CRUD、管理員食物操作、趨勢報表切換、響應式佈局、個人設定

**流程圖說明（講者需對每張圖做 1–1.5 分鐘說明）**：
- user-flow：兩種角色（用戶/管理員）的功能節點與繼承關係
- system-flow：React 元件層次（main.jsx → Provider → Router → 路由守衛 → Layout → Pages → Service 層）
- data-flow（DFD）：資料在用戶操作與儲存層之間流動（注意：此圖為早期設計，資料存於 localStorage，現行版已改為後端 API）
- program-flow：程式從啟動到登入到 Dashboard 操作的完整執行路徑（注意：此圖為舊版，登入流程現行版改為 POST /auth/login → JWT + HttpOnly Cookie）

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
- 內容：三個 branch 的時間軸 + 對比表格（前端框架 / 資料層 / 認證機制 / 測試）
  - master：vanilla JS、localStorage、前端 bcrypt、無測試
  - upgrade_react：React 18 + Vite、localStorage、前端 bcrypt、無測試
  - python_c（現行）：React 18 + Vite、FastAPI in-memory、JWT + HttpOnly Cookie、Playwright
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
  - 架構示意：React SPA（client/）← axios + HttpOnly Cookie → FastAPI（backend/）→ in-memory store
  - 技術棧清單：前端 / 後端 / 測試 / 版本控制
  - 後端目錄分層：入口層（main.py）/ 設定層（config.py）/ 模型層（schemas.py）/ 資料層（store.py）/ 工具層（utils/）/ 路由層（routers/）/ Mock 層（mock/）
  - API 端點總覽：/auth、/foods、/records、/profile、/announcements、/admin
- 講者稿：說明前後端如何透過 HttpOnly Cookie 傳遞 JWT 進行通訊，後端各層的職責分工，以及 in-memory store 的設計取捨（適合 Demo，正式部署需替換為資料庫）

---

### Slide 6｜資料流設計（data-flow）
**負責講者：Person B**
- 標題：資料流設計（DFD）
- 內容：【請自行插入 data-flow 流程圖】+ 說明文字
  - 圖中流程：身份驗證 → 飲食紀錄管理 → 食物資料庫 → 個人設定 → 趨勢報表 → 公告管理
  - 管理員後台統一存取所有資料
  - 重要說明：此圖為早期設計（D1–D6 為 localStorage），現行版資料層已移至 FastAPI 後端 store.py
- 講者稿：說明用戶操作如何驅動資料讀寫，點出一般用戶與管理員的資料存取範圍差異，主動說明圖為早期架構，現行版已演進至前後端分離

---

### Slide 7｜程式執行流程（program-flow）
**負責講者：Person B**
- 標題：程式執行流程
- 內容：【請自行插入 program-flow 流程圖】+ 說明文字
  - 主要路徑：啟動 → Session 檢查 → 登入/註冊判斷 → 帳號鎖定分支 → 密碼驗證 → 角色分流 → Dashboard 操作循環 → 登出
  - 重要說明：此圖為舊版流程（前端 bcrypt + localStorage），現行版登入改為 POST /auth/login → 後端驗證 → JWT 以 HttpOnly Cookie 回傳
- 講者稿：走一遍主要執行路徑，重點說明帳號鎖定的分支邏輯與角色判斷後的路由分流，主動說明現行版的差異

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
  - AdminDashboard：今日活躍用戶數、本週紀錄總數、食物資料庫筆數、Top 10 食物排行
  - AdminFoods：食物 CRUD、CSV 批量匯入（逐行錯誤回報）
  - AdminUsers：用戶清單、啟用/停用帳號、角色變更（user/admin）、密碼重設
  - AdminLogs：操作審計日誌，顯示時間戳、操作者 email、操作類型（Badge 顯示）、詳情
- 講者稿：說明管理員後台的設計思路，強調 AdminLogs 對系統可稽核性的重要意義

---

### Slide 10｜技術亮點 — JWT + HttpOnly Cookie 認證與帳號鎖定
**負責講者：Person C**
- 標題：JWT + HttpOnly Cookie 認證機制與帳號鎖定
- 內容：
  - 登入流程（7 步驟）：
    1. POST /auth/login → 後端驗 email/password
    2. 成功 → 簽發 JWT（HS256，24 小時，payload 含 userId / email / role / exp）
    3. 後端 `response.set_cookie(httponly=True, samesite="lax")` 回傳，JavaScript 無法讀取
    4. 前端僅存 ddas_session（UI 顯示用）於 localStorage，Token 本體不落地
    5. 每次請求 axios `withCredentials: true` 自動帶出 Cookie
    6. POST /auth/logout → 後端 `delete_cookie()` 清除，Token 完全失效
    7. 401 回應 → 自動清除 ddas_session 並導向 /login
  - 雙層授權：
    - `get_current_user()`：從 Cookie 解碼 JWT + 驗 isActive（停用帳號即踢出）
    - `require_admin()`：額外驗 role === "admin"
  - 帳號鎖定：
    - 登入失敗累計 5 次 → 第 5 次直接回傳 `{locked: true, message: "帳號已鎖定，請於 15 分鐘後再試"}`
    - 前端解析並顯示提示，鎖定到期自動解除
- 講者稿：說明為什麼選用 HttpOnly Cookie 而非 localStorage 存放 Token（防 XSS 竊取），雙層授權的設計考量，以及帳號鎖定如何防止暴力破解

---

### Slide 11｜資安設計 — 已實作防禦機制
**負責講者：Person C**
- 標題：資安設計 — 已實作防禦機制（對應 OWASP Top 10）
- 內容：
  - 密碼安全：
    - bcrypt 雜湊（cost factor 10），絕不明文儲存
    - 密碼強度驗證：長度 ≥ 6，至少含大寫、小寫、數字、特殊符號中的 3 種
  - 認證授權：
    - JWT HS256 + exp claim，有效期 24 小時
    - HttpOnly Cookie 傳輸：Token 不暴露給 JavaScript，防止 XSS 竊取
    - 雙層保護：isActive 驗證 + role 驗證
    - 三層路由守衛：GuestOnly / RequireAuth / RequireAdmin
    - server-side logout：POST /auth/logout 清除 Cookie，Token 完全失效
  - 輸入驗證：
    - Pydantic v2 強制型別驗證，422 自動攔截格式錯誤
    - Email 格式驗證、角色值限制（user / admin）
  - 網路層：
    - CORS 白名單限制允許來源
    - 帳號鎖定防暴力破解（A07: Identification and Authentication Failures）
  - 可稽核性：
    - Thread-safe logger 記錄 11 種敏感操作
    - 管理員可即時查閱完整操作歷史
- 講者稿：說明系統從密碼儲存、認證授權、輸入驗證到操作可稽核性都有對應的多層次防護，並對照 OWASP Top 10 說明覆蓋範圍

---

### Slide 12｜資安設計 — 風險識別與改善計畫
**負責講者：Person C**
- 標題：資安設計 — 現存風險與改善方向
- 內容：
  - 已修復（本版本）：
    - Token 存於 localStorage（XSS 可竊取）→ 已改為 HttpOnly Cookie + server-side logout
  - 高風險（需立即處理）：
    - JWT_SECRET 硬編碼在 config.py → 改為 `os.getenv("JWT_SECRET")`，搭配 .env 檔
    - 密碼重設 API 未驗強度 → 補上與 /register 相同的強度檢查
  - 中風險（建議改善）：
    - sanitizeInput() 只移除 HTML 標籤，無法防 CSS injection → 改用 DOMPurify 套件
    - 臨時密碼使用 Math.random()（非密碼學安全）→ 改用 crypto.getRandomValues()
    - Email 驗證太弱 → 使用 email-validator 套件
  - 低風險（長期規劃）：
    - 密碼長度無上限 → 設定最大 128 字元防 bcrypt DoS
    - admin/records API 無分頁 → 加入 limit/offset 分頁機制
- 講者稿：展示對系統現存資安問題的清楚認識，說明哪些是 Demo 階段的設計取捨、哪些是正式部署前必須修復的項目，以及對應的解決方案

---

### Slide 13｜技術亮點 — React Stale Closure Bug 修復
**負責講者：Person D**
- 標題：React Stale Closure Bug 修復（FoodSearch Debounce）
- 內容：
  - 問題描述：FoodSearch 輸入關鍵字後查無結果，debounce 完全失效
  - 根本原因：setTimeout callback 在建立時封存了當時的 state 快照（空字串），後續 state 更新不影響已建立的 closure
  - 修法（三步驟）：
    1. 新增 `debouncedKeyword` state
    2. `useEffect([keyword])` 內用 setTimeout 延遲更新 debouncedKeyword，cleanup 函式 `clearTimeout` 取消上一次計時
    3. 主搜尋 `useEffect` 改依賴 `[debouncedKeyword, category, calMin, calMax, page]`
  - 結果：Playwright 測試驗證通過（輸入「雞胸肉」正確篩出 1 筆）
- 講者稿：這是開發過程中遇到的真實 bug，說明 React state 快照與 JavaScript closure 的互動陷阱，以及如何透過引入中間 state 解耦 debounce 邏輯，是理解 React hooks 執行機制的重要案例

---

### Slide 14｜技術亮點 — 後端架構分層設計
**負責講者：Person D**
- 標題：後端架構分層設計
- 內容：
  - 七層結構：
    - 入口層：main.py（FastAPI app、CORS middleware、Router 掛載）
    - 設定層：config.py（JWT secret、演算法、Cookie 參數、CORS 來源）
    - 模型層：schemas.py（Pydantic v2，6 個 domain）
    - 資料層：store.py（in-memory singleton，重啟後重置）
    - 工具層：utils/（auth_utils.py、dependencies.py、logger.py）
    - 路由層：routers/（6 個 router，對應 6 個功能域）
    - Mock 層：mock/（Seed 資料，啟動時注入 store）
  - 重構過程：
    - 問題：auth_utils.py、dependencies.py、logger.py 原本散落根目錄，層次不清
    - 解法：整合至 utils/ 子目錄，統一工具層職責
    - 執行：13 個 import 路徑更新，啟動與 API 測試全部通過
- 講者稿：說明後端分層設計的考量，每一層的單一職責如何讓程式碼更易維護，以及重構過程中如何確保不破壞現有功能

---

### Slide 15｜技術亮點 — Thread-safe Logger 與 Playwright E2E 測試
**負責講者：Person D**
- 標題：Thread-safe Logger 與 E2E 測試
- 內容：
  - Thread-safe Logger（utils/logger.py）：
    - 使用 `threading.Lock()` 確保 FastAPI 多執行緒並發時寫入不交錯
    - 格式：`[YYYY-MM-DD HH:MM:SS] user | action | detail`
    - 11 種操作類型自動記錄（AUTH_LOGIN、ADD_FOOD、DELETE_USER 等）
    - `read_logs()` 解析 + 倒序排列，AdminLogs.jsx 即時呈現
    - 日誌路徑：backend/ddas.log（.gitignore 排除，不進版本控制）
  - Playwright E2E 測試（client/tests/）：
    - 7 個 TC（TC-001～TC-007），6 個測試檔案
    - 雙平台：chromium（Desktop Chrome）+ mobile（Pixel 5），共 38 個測試案例全數通過
    - 涵蓋：登入/註冊/帳號鎖定、飲食紀錄 CRUD、管理員食物 CRUD、趨勢報表切換、響應式佈局、個人設定
    - webServer 使用 Vite dev server（port 5173），確保 HashRouter 路由與 CORS 正確
- 講者稿：說明為什麼需要 thread-safe logger（FastAPI 處理並發請求時可能同時觸發多個 write_log），以及 Playwright 如何透過真實瀏覽器操作驗證功能正確性，38 個案例全數通過代表功能與介面均符合規格

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
    - 部署：apiClient.js 改用 `import.meta.env.VITE_API_URL`，支援真實部署環境
    - 資安強化：JWT_SECRET 移至 .env、密碼重設加強度驗證、sanitizeInput 改用 DOMPurify
    - 文件更新：補齊四張流程圖至現行前後端分離架構
- 講者稿：展示對系統現況的清楚認識，區分哪些是 Demo 階段的合理取捨，哪些是正式上線前的必要工作，以及具體的改善路徑

---

### Slide 17｜結語
**負責講者：Person D**
- 標題：總結
- 內容：
  - 專案成果摘要：
    - 完整前後端分離系統（React 18 + FastAPI）
    - JWT + HttpOnly Cookie 認證 + 帳號鎖定 + 多層資安防護
    - Thread-safe 操作審計日誌（11 種事件）
    - Playwright E2E 測試 38 案例（chromium + mobile）全數通過
  - 技術收穫：
    - React Stale Closure 實戰修復
    - 後端分層架構設計與重構實踐
    - JWT + HttpOnly Cookie 認證機制實作
    - 資安設計思維（已實作 + 風險識別 + 問題修復）
  - Demo 帳號：
    - 一般用戶：demo@demo.com / Demo@123
    - 管理員：admin@demo.com / Admin@123
- 講者稿：簡短總結整個專案的技術廣度與深度，說明從 vanilla JS 一路演進到前後端分離的完整歷程，開放 QA

---

## 生成指令

請依照上方規格，**立即生成全部 17 張投影片的完整內容**，格式為 Markdown，每張用 `---` 分隔，每張包含：

1. `## Slide N｜標題`
2. `**負責講者：Person X**`
3. `### 內容重點`（條列，流程圖位置標示「【請自行插入流程圖】」）
4. `### 講者稿`（2–4 句口語化說明）

**請勿詢問確認，請勿中途停頓，直接從 Slide 1 生成至 Slide 17。**
