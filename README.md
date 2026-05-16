# 飲食與熱量紀錄系統（Daily Diet Accounting System）

記錄三餐、追蹤熱量與三大營養素，支援個人目標設定與趨勢報表，並提供管理員後台。

前後端分離架構：React SPA（`client/`）+ FastAPI（`backend/`）。

---

## 專案結構

```
Daily-Diet-Accounting-System/
├── client/      # 前端 React SPA（Vite）
└── backend/     # 後端 RESTful API（FastAPI）
```

各子目錄有獨立的 README：

- [client/README.md](./client/README.md)
- [backend/README.md](./backend/README.md)

---

## 技術棧

### 前端

| 技術 | 版本 |
|------|------|
| React + Vite | 18.3.1 / 5.4.8 |
| React Router DOM | 6.26.0 |
| Bootstrap 5 | 5.3.3 |
| Chart.js | 4.4.4 |
| axios | 1.7.7 |

### 後端

| 技術 | 版本 |
|------|------|
| Python | 3.11+ |
| FastAPI | 0.115.0 |
| uvicorn | 0.30.6 |
| JWT（python-jose） | 3.3.0 |
| bcrypt（passlib） | 1.7.4 |

---

## 快速啟動

### 0. 編譯 C log 系統（首次需執行）

```bash
cd core
make
cd ..
```

> 若未執行此步驟，管理員後台的操作紀錄功能將無法記錄資料。

### 1. 啟動後端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API：`http://localhost:8000`
- Swagger UI：`http://localhost:8000/docs`

### 2. 啟動前端

```bash
cd client
yarn install
yarn dev
```

- 應用程式：`http://localhost:5173`

> 兩個服務需**同時啟動**。

---

## Demo 帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 一般使用者 | `demo@demo.com` | `Demo@123` |
| 管理員 | `admin@demo.com` | `Admin@123` |

登入失敗超過 **5 次**，帳號鎖定 **15 分鐘**。

> 後端使用 In-Memory 儲存，重啟後資料重置為初始狀態。

---

## 系統架構

```
瀏覽器
  └── React SPA（port 5173）
        └── axios（apiClient.js）
              │  Authorization: Bearer <JWT>
              ▼
        FastAPI（port 8000）
              └── In-Memory Store（mock 初始資料）
```

**認證流程**：登入 → 後端簽發 JWT（24h）→ 前端存入 localStorage → 每次請求自動附加 Token → 401 時自動登出。

---

## 主要功能

| 功能 | 說明 |
|------|------|
| 今日飲食總覽 | 熱量環形圖、三大營養素進度條、依餐別管理紀錄 |
| 食物搜尋 | 關鍵字 / 類別 / 熱量範圍篩選，加入當日紀錄 |
| 趨勢報表 | 近 7 / 30 天折線圖與圓餅圖 |
| 個人設定 | BMR 自動計算建議熱量、三大營養素目標 |
| 管理員後台 | 使用者管理、食物管理、全紀錄查詢與匯出、公告管理 |
