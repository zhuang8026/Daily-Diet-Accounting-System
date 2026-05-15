# DDAS Client — React SPA

每日飲食記帳系統（Daily Diet Accounting System）的前端應用程式。

> 後端 API 請見 [../backend/README.md](../backend/README.md)

---

## 技術棧

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

---

## 架構

```
App.jsx（HashRouter + Providers + 路由守衛）
  └── Layout.jsx（Header / Sidebar / BottomNav）
        └── Pages（Dashboard / FoodSearch / Report / Settings / Admin*）
              └── assets/api/（Service 層，透過 axios 呼叫後端）
                    └── apiClient.js（axios 實例，含 JWT 攔截器與 401 自動登出）
```

**Context**

| Context | 提供內容 |
|---------|---------|
| `AuthContext` | `session`、`refresh()`、`logout()` |
| `ToastContext` | `showToast(message, type)` |

**JWT 流程**

1. 登入成功 → 後端回傳 `access_token`
2. 存入 localStorage：`ddas_token`（JWT）、`ddas_session`（使用者資訊）
3. axios 攔截器自動附加 `Authorization: Bearer <token>`
4. 收到 401 → 清除 localStorage，跳轉 `#/login`

---

## 檔案結構

```
client/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                      # 入口點
    ├── App.jsx                       # 路由設定、守衛元件
    ├── router/
    │   └── index.js
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ToastContext.jsx
    ├── components/
    │   ├── Layout.jsx
    │   ├── Header.jsx
    │   ├── Sidebar.jsx
    │   └── BottomNav.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── About.jsx
    │   ├── Dashboard.jsx
    │   ├── FoodSearch.jsx
    │   ├── Report.jsx
    │   ├── Settings.jsx
    │   └── admin/
    │       ├── AdminDashboard.jsx
    │       ├── AdminFoods.jsx
    │       ├── AdminRecords.jsx
    │       ├── AdminUsers.jsx
    │       └── AdminAnnouncements.jsx
    └── assets/
        ├── scss/
        │   ├── _variables.scss
        │   ├── _root.scss
        │   └── index.scss
        └── api/
            ├── apiClient.js          # axios 實例（JWT 攔截器）
            ├── utils.js              # 工具函式（UUID、日期、BMR 計算等）
            ├── auth.js               # 登入 / 註冊 / 登出
            ├── recordService.js      # 飲食紀錄 CRUD
            ├── foodService.js        # 食物資料庫 CRUD + 搜尋
            ├── profileService.js     # 個人設定讀寫
            └── announcementService.js
```

---

## 快速啟動

```bash
cd client
yarn install
yarn dev
# → http://localhost:5173
```

### 建置正式版本

```bash
yarn build    # 輸出至 dist/
yarn preview  # 本地預覽（port 4173）
```

> **注意**：前端需搭配後端服務才能正常運作，請先啟動 `backend/`。

> **GitHub Pages 部署**：`yarn build` 產生的 `dist/` 即為部署所需，base path 已設為 `/Daily-Diet-Accounting-System/`。

---

## 頁面功能

### 一般使用者

| 頁面 | 路由 | 說明 |
|------|------|------|
| 今日總覽 | `#/dashboard` | 熱量環形圖、三大營養素進度、依餐別新增／編輯／刪除紀錄 |
| 食物搜尋 | `#/food-search` | 依名稱、類別、熱量範圍搜尋，加入當日紀錄 |
| 趨勢報表 | `#/report` | 近 7 / 30 天熱量折線圖、營養素圓餅圖、摘要統計 |
| 個人設定 | `#/settings` | 身高、體重、活動量、飲食目標，自動計算建議熱量 |

### 管理員（role=admin）

| 頁面 | 路由 | 說明 |
|------|------|------|
| 統計儀表板 | `#/admin` | 全系統使用者數、今日紀錄數、活躍使用者 |
| 食物管理 | `#/admin/foods` | 新增／編輯／刪除食物、CSV 批次匯入 |
| 飲食紀錄 | `#/admin/records` | 查詢所有使用者紀錄、篩選、CSV/JSON 匯出 |
| 使用者管理 | `#/admin/users` | 啟用／停用帳號、變更角色、重設臨時密碼 |
| 公告管理 | `#/admin/announcements` | 發布、編輯、刪除系統公告 |

---

## localStorage

| Key | 說明 |
|-----|------|
| `ddas_token` | JWT Access Token |
| `ddas_session` | 當前登入使用者資訊（userId、displayName、role） |

所有業務資料（食物、紀錄、公告）均存於後端，不在 localStorage。
