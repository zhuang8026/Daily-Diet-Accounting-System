# 每日飲食記帳系統（Daily Diet Accounting System）

記錄三餐、追蹤熱量與三大營養素，支援個人目標設定與趨勢報表，並提供管理員後台。

---

## 技術與版本

| 技術 | 版本 | 用途 |
|------|------|------|
| HTML5 / CSS3 / JavaScript (ES6 Modules) | — | 核心語言 |
| Bootstrap | 5.3.3 | UI 框架、RWD 排版 |
| Bootstrap Icons | 1.11.3 | 圖示庫 |
| Chart.js | 4.4.4 | 趨勢報表圖表 |
| bcryptjs | 2.4.3 | 密碼雜湊（cost=12） |
| serve | 14.2.3 | 本地靜態伺服器 |
| Playwright | 1.44.0 | E2E 自動化測試 |

---

## 技術架構

```
純前端 SPA（Single Page Application）
├── 無後端伺服器
├── 路由：Hash Router（#/dashboard）
├── 資料層：瀏覽器 localStorage（7 天自動過期）
├── 密碼安全：bcryptjs 雜湊，登入失敗 5 次鎖定 15 分鐘
└── 部署：GitHub Pages（靜態托管，零設定）
```

**頁面渲染流程**

```
index.html（SPA 殼層）
  └── js/app.js（Hash Router + Auth Guard）
        ├── 未登入 → #/login
        └── 已登入 → 對應頁面模組
```

**資料流**

```
使用者操作
  └── pages/*.js（UI 事件）
        └── *Service.js（業務邏輯）
              └── storage.js（localStorage 讀寫）
```

---

## 檔案結構

```
Daily-Diet-Accounting-System/
├── index.html                      # SPA 殼層，載入所有靜態資源
├── css/
│   └── style.css                   # 全域樣式、CSS Variables、RWD、Dark Mode
├── js/
│   ├── app.js                      # Hash Router、Auth Guard、版面渲染
│   ├── auth.js                     # 登入 / 註冊 / 登出 / Session
│   ├── seed.js                     # 首次載入初始化（食物資料 + Demo 帳號）
│   ├── storage.js                  # localStorage 封裝（含 7 天過期）
│   ├── utils.js                    # 共用工具（Toast、BMR 計算、UUID 等）
│   ├── recordService.js            # 飲食紀錄 CRUD
│   ├── foodService.js              # 食物資料庫 CRUD + 搜尋
│   ├── profileService.js           # 個人設定讀寫
│   ├── announcementService.js      # 公告 CRUD
│   ├── bcrypt.min.js               # bcryptjs 本地檔（避免 CDN 依賴）
│   └── pages/
│       ├── login.js                # 登入頁
│       ├── register.js             # 註冊頁
│       ├── dashboard.js            # 今日總覽
│       ├── foodSearch.js           # 食物搜尋 + 新增紀錄
│       ├── report.js               # 趨勢報表
│       ├── settings.js             # 個人設定
│       ├── about.js                # 關於本系統
│       └── admin/
│           ├── adminDashboard.js   # 後台統計儀表板
│           ├── adminFoods.js       # 食物管理
│           ├── adminRecords.js     # 飲食紀錄管理
│           ├── adminUsers.js       # 使用者管理
│           └── adminAnnouncements.js # 公告管理
├── docs/
│   ├── bdd.feature                 # BDD Gherkin 測試案例（TC-001 ~ TC-007）
│   └── use-case.drawio             # Use Case 圖（draw.io 格式）
├── tests/
│   ├── playwright.config.ts        # Playwright 設定
│   ├── auth.spec.ts                # 認證流程測試
│   ├── records.spec.ts             # 飲食紀錄測試
│   ├── adminFoods.spec.ts          # 食物管理測試
│   ├── report.spec.ts              # 報表測試
│   ├── rwd.spec.ts                 # 響應式設計測試
│   └── settings.spec.ts            # 個人設定測試
├── package.json
└── README.md
```

---

## 安裝步驟

### 環境需求

- Node.js 18 以上
- npm 9 以上

### 步驟

```bash
# 1. 進入專案目錄
cd Daily-Diet-Accounting-System

# 2. 安裝依賴（Playwright 測試工具）
npm install

# 3. 啟動本地伺服器
npm run serve

# 4. 開啟瀏覽器
# http://localhost:3000
```

> **注意**：請務必透過 HTTP 伺服器開啟，直接用 `file://` 開啟會因 ES6 Module 的 CORS 限制而無法運作。

---

## 資料來源（DB）

本系統無後端資料庫，所有資料存於**瀏覽器 localStorage**。

### 初始化資料（seed.js）

首次載入時自動寫入：

**食物資料庫（ddas_foods）**：10 筆預設食物

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

### localStorage 資料結構

| Key | 說明 |
|-----|------|
| `ddas_foods` | 食物資料庫（全使用者共用） |
| `ddas_users` | 使用者帳號清單 |
| `ddas_session` | 目前登入 Session |
| `ddas_records_{userId}` | 個人飲食紀錄 |
| `ddas_profile_{userId}` | 個人設定 |
| `ddas_announcements` | 系統公告 |
| `ddas_login_attempts_{email}` | 登入失敗次數（防暴力破解） |

> 資料過期時間：寫入後 **7 天**自動清除。

---

## 如何登入

系統提供兩組預設 Demo 帳號：

| 角色 | Email | 密碼 | 可用功能 |
|------|-------|------|---------|
| 一般使用者 | `demo@demo.com` | `Demo@123` | 今日總覽、食物搜尋、趨勢報表、個人設定 |
| 管理員 | `admin@demo.com` | `Admin@123` | 後台管理（使用者、食物、紀錄、公告） |

**登入失敗超過 5 次**，帳號將鎖定 15 分鐘。

### 若出現「帳號或密碼錯誤」

localStorage 可能殘留損壞的初始化資料，請清除後重試：

1. 按 **F12** 開啟開發者工具
2. 切換到 **Application** 分頁
3. 左側選單點選 **Local Storage** → 選擇網站來源
4. 全選所有項目並刪除
5. **重新整理頁面**，等待初始化完成（約 3–5 秒）
6. 重新登入

---

## 如何使用

### 一般使用者

| 頁面 | 路徑 | 功能 |
|------|------|------|
| 今日總覽 | `#/dashboard` | 查看當日熱量與三大營養素進度、新增飲食紀錄 |
| 食物搜尋 | `#/food-search` | 搜尋食物、依類別篩選、加入當日紀錄 |
| 趨勢報表 | `#/report` | 查看近 7 天 / 30 天熱量與營養素趨勢圖 |
| 個人設定 | `#/settings` | 設定身高體重、活動量、飲食目標與每日目標熱量 |

### 管理員

| 頁面 | 路徑 | 功能 |
|------|------|------|
| 統計儀表板 | `#/admin` | 查看全系統使用統計 |
| 食物管理 | `#/admin/foods` | 新增 / 編輯 / 刪除食物資料 |
| 飲食紀錄 | `#/admin/records` | 瀏覽所有使用者紀錄 |
| 使用者管理 | `#/admin/users` | 啟用 / 停用帳號 |
| 公告管理 | `#/admin/announcements` | 發布系統公告 |

### 自動化測試

```bash
# 執行所有 E2E 測試（需先啟動伺服器）
npm test

# 開啟 Playwright UI 模式
npm run test:ui
```
