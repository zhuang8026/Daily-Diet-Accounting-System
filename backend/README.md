# DDAS Backend — FastAPI

每日飲食記帳系統（Daily Diet Accounting System）的後端 API 服務。

> 完整 API 規格請見 [API_SPEC.txt](./docs/API_SPEC.txt)

---

## 技術棧

| 套件 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 執行環境 |
| FastAPI | 0.115.0 | Web 框架 |
| uvicorn[standard] | 0.30.6 | ASGI 伺服器 |
| python-jose[cryptography] | 3.3.0 | JWT 簽發與驗證（HS256） |
| passlib[bcrypt] | 1.7.4 | 密碼雜湊 |
| python-multipart | 0.0.12 | multipart/form-data 解析（CSV 上傳） |

---

## 快速啟動

```bash
# 1. 建立虛擬環境（建議）
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. 安裝依賴
pip install -r requirements.txt

# 3. 啟動伺服器
uvicorn main:app --reload --port 8000
```

- API 根路徑：`http://localhost:8000`
- Swagger UI：`http://localhost:8000/docs`
- ReDoc：`http://localhost:8000/redoc`
- 健康檢查：`GET http://localhost:8000/` → `{"status": "ok"}`

---

## 檔案結構

```
backend/
├── main.py              # FastAPI 應用程式入口，CORS 與 Router 掛載
├── config.py            # JWT 設定（secret、演算法、有效期）、CORS 來源
├── schemas.py           # Pydantic v2 請求/回應模型（camelCase）
├── store.py             # In-Memory 資料儲存 Singleton（重啟後重置）
├── requirements.txt
├── utils/
│   ├── auth_utils.py    # JWT 簽發（create_token）與驗證（decode_token）
│   ├── dependencies.py  # FastAPI 依賴注入：get_current_user、require_admin
│   └── logger.py        # 操作日誌讀寫（ddas.log）
├── docs/
│   └── API_SPEC.txt     # 完整 API 規格書
├── routers/
│   ├── auth.py          # POST /auth/login、/auth/register
│   ├── foods.py         # GET/POST/PUT/DELETE /foods、/foods/search、CSV 匯入
│   ├── records.py       # GET/POST/PUT/DELETE /records、每日/區間摘要
│   ├── profile.py       # GET/PUT /profile、/profile/targets
│   ├── announcements.py # GET /announcements（當前生效公告）
│   └── admin.py         # /admin/stats、users、foods、records、announcements
└── mock/
    ├── users.py         # Mock 使用者（demo、admin）
    ├── foods.py         # Mock 食物資料（10 筆）
    └── records.py       # Mock 飲食紀錄（載入 client/src/assets/api/demoRecords.json）
```

---

## 架構說明

### In-Memory Store

`store.py` 在程序啟動時從 `mock/` 載入初始資料，所有後續讀寫均操作同一個 `store` singleton。**伺服器重啟後資料重置**，適用於開發與展示。

```
store.users          # list[dict]
store.foods          # list[dict]
store.records        # list[dict]
store.announcements  # list[dict]
store.login_attempts # dict — email → {count, locked_until}
```

### JWT 認證

- 演算法：HS256，有效期 24 小時
- Payload：`userId`、`email`、`role`、`exp`
- 所有需要登入的端點使用 `Depends(get_current_user)`
- 管理員端點額外使用 `Depends(require_admin)`
- Secret key 設定於 `config.py`（正式環境請替換）

### CORS

預設允許 `http://localhost:5173`（Vite dev）與 `http://localhost:4173`（Vite preview）。

---

## Demo 帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 一般使用者 | `demo@demo.com` | `Demo@123` |
| 管理員 | `admin@demo.com` | `Admin@123` |

登入失敗超過 **5 次**，帳號鎖定 **15 分鐘**。

---

## API 端點總覽

| 前綴 | 說明 | 需要驗證 |
|------|------|---------|
| `POST /auth/login` | 登入，回傳 JWT | 否 |
| `POST /auth/register` | 註冊新帳號 | 否 |
| `GET/POST/PUT/DELETE /foods` | 食物 CRUD + 搜尋 + CSV 匯入 | 是 |
| `GET/POST/PUT/DELETE /records` | 飲食紀錄 CRUD + 摘要查詢 | 是 |
| `GET/PUT /profile` | 個人資料與目標設定 | 是 |
| `GET /announcements` | 當前生效公告 | 是 |
| `GET /admin/*` | 管理員統計、使用者/食物/紀錄/公告管理 | 管理員 |

完整端點文件詳見 [API_SPEC.txt](./docs/API_SPEC.txt) 或啟動後瀏覽 `/docs`。

---

## 正式部署注意事項

1. **替換 JWT Secret**：將 `config.py` 的 `JWT_SECRET` 改為強隨機字串（建議 32 字元以上）
2. **限制 CORS**：`CORS_ORIGINS` 改為正式前端域名
3. **引入資料庫**：將 `store.py` 替換為 SQLAlchemy / 其他 ORM 實作，確保資料持久化
4. **HTTPS**：正式環境需透過反向代理（Nginx / Caddy）啟用 TLS
