# 飲食與熱量紀錄系統（Daily Diet Accounting System）

記錄三餐、追蹤熱量與三大營養素，支援個人目標設定與趨勢報表，並提供管理員後台。

---

## 技術與版本

### 前端（client/）

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架（函式元件 + Hooks） |
| React DOM | 18.3.1 | DOM 渲染 |
| React Router DOM | 6.26.0 | Hash Router、路由守衛 |
| Vite | 5.4.8 | 建構工具、本地開發伺服器 |
| Bootstrap | 5.3.3 | UI 框架、RWD 排版 |
| Bootstrap Icons | 1.11.3 | 圖示庫 |
| Chart.js | 4.4.4 | 趨勢折線圖、甜甜圈圖 |
| react-chartjs-2 | 5.2.0 | Chart.js 的 React 封裝 |
| Sass | 1.99.0 | SCSS 預處理器 |
| axios | 1.7.7 | HTTP 客戶端，呼叫後端 API |

### 後端（backend/）

| 技術 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 執行環境 |
| FastAPI | 0.115.0 | Web 框架、自動產生 OpenAPI 文件 |
| uvicorn | 0.30.0 | ASGI 伺服器 |
| python-jose[cryptography] | 3.3.0 | JWT 簽發與驗證 |
| passlib[bcrypt] | 1.7.4 | 密碼雜湊（bcrypt） |
| pydantic | 2.x | 請求/回應資料驗證（camelCase） |

---

## 技術架構

```
前後端分離架構
├── 前端：React SPA（port 5173）
│   ├── 路由：Hash Router（#/dashboard）
│   ├── 狀態管理：React Context API（AuthContext、ToastContext）
│   ├── API 層：axios（apiClient.js）— 自動附加 JWT Bearer Token
│   └── 部署：GitHub Pages（yarn build → dist/）
└── 後端：FastAPI（port 8000）
    ├── 認證：JWT（HS256，24 小時有效）
    ├── 密碼安全：bcrypt 雜湊，登入失敗 5 次鎖定 15 分鐘
    ├── 資料層：In-Memory Mock Store（重啟後重置，供開發/展示用）
    └── API 文件：http://localhost:8000/docs（Swagger UI）
```

**元件與資料流**

```
App.jsx（HashRouter + Providers + 路由守衛）
  └── Layout.jsx（Header / Sidebar / BottomNav）
        └── Pages（Dashboard / FoodSearch / Report / Settings / Admin*）
              └── assets/api/（Service 層，透過 axios 呼叫後端）
                    └── apiClient.js（axios 實例，含 JWT 攔截器與 401 自動登出）
```

**Context 架構**

| Context | 提供內容 |
|---------|---------|
| `AuthContext` | `session`、`refresh()`、`logout()` |
| `ToastContext` | `showToast(message, type)` |

**JWT 認證流程**

1. 登入成功 → 後端回傳 `access_token`（JWT）
2. 前端將 `ddas_token`、`ddas_session` 存入 localStorage
3. 後續所有 API 請求由 axios 攔截器自動加入 `Authorization: Bearer <token>`
4. Token 過期或 401 回應 → 自動清除 localStorage 並跳轉登入頁

---

## 檔案結構

```
Daily-Diet-Accounting-System/
├── client/                               # 前端 React SPA
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── router/
│       │   └── index.js
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ToastContext.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   └── BottomNav.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── About.jsx
│       │   ├── Dashboard.jsx
│       │   ├── FoodSearch.jsx
│       │   ├── Report.jsx
│       │   ├── Settings.jsx
│       │   └── admin/
│       │       ├── AdminDashboard.jsx
│       │       ├── AdminFoods.jsx
│       │       ├── AdminRecords.jsx
│       │       ├── AdminUsers.jsx
│       │       └── AdminAnnouncements.jsx
│       └── assets/
│           ├── scss/
│           │   ├── _variables.scss
│           │   ├── _root.scss
│           │   └── index.scss
│           └── api/
│               ├── apiClient.js          # axios 實例（JWT 攔截器）
│               ├── utils.js              # 工具函式（UUID、日期、BMR 計算等）
│               ├── auth.js               # 登入 / 註冊 / 登出
│               ├── recordService.js      # 飲食紀錄 CRUD
│               ├── foodService.js        # 食物資料庫 CRUD + 搜尋
│               ├── profileService.js     # 個人設定讀寫
│               └── announcementService.js
├── backend/                              # 後端 FastAPI
│   ├── main.py                           # FastAPI 應用程式入口
│   ├── requirements.txt
│   ├── API_SPEC.txt                      # 完整 API 規格書
│   ├── auth/
│   │   └── jwt_utils.py                  # JWT 簽發、驗證、依賴注入
│   ├── routers/
│   │   ├── auth.py                       # POST /auth/login、/auth/register
│   │   ├── foods.py                      # GET/POST/PUT/DELETE /foods
│   │   ├── records.py                    # GET/POST/PUT/DELETE /records
│   │   ├── profile.py                    # GET/PUT /profile
│   │   ├── announcements.py              # GET /announcements
│   │   └── admin.py                      # GET/PUT/DELETE /admin/*
│   ├── schemas/
│   │   └── models.py                     # Pydantic v2 請求/回應模型
│   ├── mock/
│   │   ├── users.py                      # Mock 使用者資料
│   │   ├── foods.py                      # Mock 食物資料（56 筆）
│   │   └── records.py                    # Mock 飲食紀錄（載入 demoRecords.json）
│   └── store.py                          # In-Memory 資料儲存 Singleton
├── docs/
│   ├── bdd.feature
│   ├── flow/
│   │   ├── drawio/
│   │   └── pdf/
│   └── SRS/
└── tests/
    ├── playwright.config.ts
    └── *.spec.ts
```

---

## 安裝步驟

### 環境需求

- Node.js 22 以上 / yarn
- Python 3.11 以上

### 啟動後端

```bash
# 進入後端目錄
cd backend

# 建立虛擬環境（建議）
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 啟動 API 伺服器
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → API 文件：http://localhost:8000/docs
```

### 啟動前端

```bash
# 進入前端目錄
cd client

# 安裝依賴
yarn install

# 啟動開發伺服器
yarn dev
# → http://localhost:5173
```

> 前後端需**同時啟動**，前端才能正常呼叫 API。

### 建置前端正式版本

```bash
cd client
yarn build      # 輸出至 dist/
yarn preview    # 本地預覽正式版本（port 4173）
```

> **GitHub Pages 部署**：`yarn build` 產生的 `dist/` 內容即為部署所需，base path 已自動設為 `/Daily-Diet-Accounting-System/`。

---

## Demo 帳號

| 角色 | Email | 密碼 | 可用功能 |
|------|-------|------|---------|
| 一般使用者 | `demo@demo.com` | `Demo@123` | 今日總覽、食物搜尋、趨勢報表、個人設定 |
| 管理員 | `admin@demo.com` | `Admin@123` | 所有功能 + 管理員後台 |

登入失敗超過 **5 次**，帳號將鎖定 **15 分鐘**。

> **注意**：後端使用 In-Memory 資料儲存，重啟伺服器後資料將重置為初始狀態。

---

## localStorage 使用說明

| Key | 說明 |
|-----|------|
| `ddas_token` | JWT Access Token（Bearer）|
| `ddas_session` | 當前登入使用者資訊（userId、displayName、role） |

所有業務資料（食物、紀錄、公告、使用者）均存於後端 In-Memory Store，不再使用 localStorage 儲存。

---

## 如何使用

### 一般使用者

| 頁面 | 路由 | 功能說明 |
|------|------|---------|
| 今日總覽 | `#/dashboard` | 查看當日熱量環形圖與三大營養素進度、依餐別新增／編輯／刪除紀錄、瀏覽歷史日期 |
| 食物搜尋 | `#/food-search` | 依名稱、類別、熱量範圍搜尋食物，加入當日飲食紀錄 |
| 趨勢報表 | `#/report` | 近 7 天 / 30 天熱量趨勢折線圖、三大營養素比例圓餅圖、摘要統計 |
| 個人設定 | `#/settings` | 設定身高、體重、活動量、飲食目標，Mifflin-St Jeor 公式自動計算建議熱量 |

### 管理員

| 頁面 | 路由 | 功能說明 |
|------|------|---------|
| 統計儀表板 | `#/admin` | 全系統使用者數、今日紀錄數、活躍使用者等統計 |
| 食物管理 | `#/admin/foods` | 新增／編輯／刪除食物、CSV 批次匯入 |
| 飲食紀錄 | `#/admin/records` | 查詢所有使用者紀錄、篩選、CSV/JSON 匯出 |
| 使用者管理 | `#/admin/users` | 啟用／停用帳號、變更角色、重設臨時密碼 |
| 公告管理 | `#/admin/announcements` | 發布、編輯、刪除系統公告 |

---

## 若無法登入

1. 確認後端伺服器已啟動（`uvicorn main:app --reload --port 8000`）
2. 若看到 `401 Unauthorized` 錯誤，代表 Token 已過期，重新登入即可
3. 若 localStorage 有殘留舊版資料，請清除後重試：
   - 按 **F12** → **Application** → **Local Storage** → 刪除 `ddas_token` 與 `ddas_session`
   - 重新整理頁面，重新登入
