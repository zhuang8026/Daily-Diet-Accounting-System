# 飲食與熱量紀錄系統（Daily Diet Accounting System）

記錄三餐、追蹤熱量與三大營養素，支援個人目標設定與趨勢報表，並提供管理員後台。

---

## 技術與版本

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
| bcryptjs | 2.4.3 | 密碼雜湊（cost=12） |

---

## 技術架構

```
純前端 SPA（Single Page Application）
├── 無後端伺服器
├── 路由：Hash Router（#/dashboard）
├── 狀態管理：React Context API（AuthContext、ToastContext）
├── 資料層：瀏覽器 localStorage（7 天自動過期）
├── 密碼安全：bcryptjs 雜湊，登入失敗 5 次鎖定 15 分鐘
└── 部署：GitHub Pages（npm run build → dist/）
```

**元件與資料流**

```
App.jsx（HashRouter + Providers + 路由守衛）
  └── Layout.jsx（Header / Sidebar / BottomNav）
        └── Pages（Dashboard / FoodSearch / Report / Settings / Admin*）
              └── assets/api/（純函式，讀寫 localStorage）
                    └── storage.js（localStorage 封裝，含 7 天過期）
```

**Context 架構**

| Context | 提供內容 |
|---------|---------|
| `AuthContext` | `session`、`refresh()`、`logout()` |
| `ToastContext` | `showToast(message, type)` |

---

## 檔案結構

```
Daily-Diet-Accounting-System/
├── index.html                        # Vite SPA 殼層
├── vite.config.js                    # Vite 設定（dev: /，build: /Daily-Diet-Accounting-System/）
├── package.json
├── src/
│   ├── main.jsx                      # 入口點，載入 Bootstrap CSS/JS 與全域 SCSS
│   ├── App.jsx                       # 路由設定、守衛元件、初始化
│   ├── router/
│   │   └── index.js                  # 路由設定
│   ├── context/
│   │   ├── AuthContext.jsx           # 登入 Session 管理
│   │   └── ToastContext.jsx          # 全域 Toast 通知
│   ├── components/
│   │   ├── Layout.jsx                # 頁面框架（Outlet wrapper）
│   │   ├── Header.jsx                # 頂部導覽列
│   │   ├── Sidebar.jsx               # 側邊選單（桌機）
│   │   └── BottomNav.jsx             # 底部導覽（手機）
│   ├── pages/
│   │   ├── Login.jsx                 # 登入頁
│   │   ├── Register.jsx              # 註冊頁
│   │   ├── About.jsx                 # 關於本系統
│   │   ├── Dashboard.jsx             # 今日飲食總覽
│   │   ├── FoodSearch.jsx            # 食物搜尋
│   │   ├── Report.jsx                # 趨勢報表
│   │   ├── Settings.jsx              # 個人目標設定
│   │   └── admin/
│   │       ├── AdminDashboard.jsx    # 後台統計儀表板
│   │       ├── AdminFoods.jsx        # 食物資料管理
│   │       ├── AdminRecords.jsx      # 飲食紀錄管理
│   │       ├── AdminUsers.jsx        # 使用者管理
│   │       └── AdminAnnouncements.jsx # 公告管理
│   └── assets/
│       ├── scss/
│       │   ├── _variables.scss       # SCSS 變數（顏色、尺寸等，由 Vite 全域注入）
│       │   ├── _root.scss            # CSS Custom Properties（:root）
│       │   └── index.scss            # 全域樣式、元件、RWD
│       └── api/
│           ├── storage.js            # localStorage 封裝（含 7 天過期）
│           ├── utils.js              # 工具函式（UUID、日期、BMR 計算等）
│           ├── auth.js               # 登入 / 註冊 / 登出
│           ├── seed.js               # 首次載入初始化（食物資料 + Demo 帳號）
│           ├── recordService.js      # 飲食紀錄 CRUD
│           ├── foodService.js        # 食物資料庫 CRUD + 搜尋
│           ├── profileService.js     # 個人設定讀寫
│           └── announcementService.js # 公告 CRUD
├── docs/
│   ├── bdd.feature                   # BDD Gherkin 測試案例
│   ├── flow/
│   │   ├── drawio/
│   │   │   ├── system-flow.drawio    # 系統架構圖
│   │   │   ├── program-flow.drawio   # 程式流程圖
│   │   │   ├── data-flow(DFD).drawio # DFD 資料流程圖
│   │   │   └── user-flow.drawio      # 使用者行為描述圖（Use Case）
│   │   └── pdf/                      # 各圖 PDF 匯出版本
│   └── SRS/
│       ├── SRS.html                  # 系統需求規格書（HTML）
│       ├── 飲食與熱量紀錄系統_需求規格書.docx  # 系統需求規格書（Word）
│       └── 飲食與熱量紀錄系統_需求規格書.txt   # 系統需求規格書（純文字）
└── tests/
    ├── playwright.config.ts
    ├── auth.spec.ts
    ├── records.spec.ts
    ├── adminFoods.spec.ts
    ├── report.spec.ts
    ├── rwd.spec.ts
    └── settings.spec.ts
```

---

## 安裝步驟

### 環境需求

- Node.js 22 以上
- npm 10 以上

### 本地開發

```bash
# 1. 進入專案目錄
cd Daily-Diet-Accounting-System

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev

# 4. 開啟瀏覽器
# http://localhost:5173
```

### 建置與預覽

```bash
# 建置正式版本（輸出至 dist/）
npm run build

# 本地預覽正式版本
npm run preview
```

> **GitHub Pages 部署**：`npm run build` 產生的 `dist/` 內容即為部署所需，base path 已自動設為 `/Daily-Diet-Accounting-System/`。

---

## 資料來源

本系統無後端資料庫，所有資料存於**瀏覽器 localStorage**。

### 初始資料（seed.js）

首次載入時自動建立：

**食物資料庫（ddas_foods）**

| ID | 食物名稱 | 類別 | 熱量（kcal） |
|----|---------|------|------------|
| F001 | 白飯 | 主食 | 280 |
| F002 | 雞胸肉（水煮） | 肉類 | 165 |
| F003 | 全脂牛奶 | 乳製品 | 150 |
| F004 | 花椰菜（燙熟） | 蔬菜 | 35 |
| F005 | 香蕉 | 水果 | 105 |
| F006 | 水煮蛋 | 蛋類 | 78 |
| F007 | 地瓜（烤） | 主食 | 112 |
| F008 | 無糖豆漿 | 飲料 | 80 |
| F009 | 鮭魚（烤） | 肉類 | 208 |
| F010 | 洋芋片 | 零食 | 160 |

**Demo 帳號（ddas_users）**

| 角色 | Email | 密碼 |
|------|-------|------|
| 一般使用者 | `demo@demo.com` | `Demo@123` |
| 管理員 | `admin@demo.com` | `Admin@123` |

### localStorage 資料結構

| Key | 說明 |
|-----|------|
| `ddas_foods` | 食物資料庫（全使用者共用） |
| `ddas_users` | 使用者帳號清單 |
| `ddas_session` | 目前登入 Session |
| `ddas_records_{userId}` | 個人飲食紀錄 |
| `ddas_profile_{userId}` | 個人設定與目標 |
| `ddas_announcements` | 系統公告 |
| `ddas_login_attempts_{email}` | 登入失敗次數（防暴力破解） |

> 所有資料寫入後 **7 天**自動過期清除。

---

## 如何登入

| 角色 | Email | 密碼 | 可用功能 |
|------|-------|------|---------|
| 一般使用者 | `demo@demo.com` | `Demo@123` | 今日總覽、食物搜尋、趨勢報表、個人設定 |
| 管理員 | `admin@demo.com` | `Admin@123` | 所有功能 + 管理員後台 |

登入失敗超過 **5 次**，帳號將鎖定 **15 分鐘**。

### 若無法登入（帳號或密碼錯誤）

localStorage 可能殘留損壞資料，請依下列步驟清除後重試：

1. 按 **F12** 開啟開發者工具
2. 切換到 **Application** 分頁
3. 左側選單 **Local Storage** → 選擇網站來源
4. 全選所有項目並刪除
5. **重新整理頁面**，等待初始化完成（約 3–5 秒）
6. 重新登入

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
| 使用者管理 | `#/admin/users` | 啟用／停用帳號、變更角色、重設密碼 |
| 公告管理 | `#/admin/announcements` | 發布、編輯、刪除系統公告 |
