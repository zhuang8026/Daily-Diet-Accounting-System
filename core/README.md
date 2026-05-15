# core — C 語言函式庫

每日飲食記帳系統（DDAS）的 C 語言核心模組，目前實作操作日誌（Log）功能。

---

## 檔案結構

```
core/
├── logger.h       # 函式宣告（header）
├── logger.c       # 函式實作
├── Makefile       # 編譯腳本
└── liblogger.so   # 編譯產物（執行 make 後產生，不納入版控）
```

---

## 函式說明

### `log_write`

```c
void log_write(const char* user, const char* action, const char* detail);
```

將一筆操作紀錄以追加模式（`"a"`）寫入 `ddas.log`。

| 參數 | 說明 |
|------|------|
| `user` | 操作者（通常為 Email） |
| `action` | 操作類型（如 `ADD_FOOD`、`DELETE_USER`） |
| `detail` | 操作詳情（如食物名稱、目標使用者） |

寫入格式：
```
[YYYY-MM-DD HH:MM:SS] user | action | detail
```

範例輸出：
```
[2026-05-15 14:30:01] admin@demo.com | ADD_FOOD | 燕麥片 (F011)
[2026-05-15 14:32:10] admin@demo.com | DELETE_USER | Demo 使用者 <demo@demo.com>
```

---

### `log_read_all`

```c
int log_read_all(char* output, int max_size);
```

以讀取模式（`"r"`）開啟 `ddas.log`，用 `fgets` 逐行讀入 `output` buffer。

| 參數 | 說明 |
|------|------|
| `output` | 呼叫端提供的字元 buffer |
| `max_size` | buffer 最大容量（bytes） |
| 回傳值 | 讀取到的行數；檔案不存在時回傳 0 |

---

## 編譯

需要 gcc，執行：

```bash
cd core
make
# → 產生 liblogger.so
```

清除編譯產物：

```bash
make clean
```

---

## 與後端整合

`backend/logger.py` 透過 Python `ctypes` 載入 `liblogger.so`：

```python
import ctypes, pathlib

_lib = ctypes.CDLL(str(pathlib.Path(__file__).parent.parent / "core" / "liblogger.so"))

_lib.log_write.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p]
_lib.log_write.restype = None
```

後端啟動時自動載入，無需手動執行。

---

## Log 檔案位置

`ddas.log` 建立於**執行 uvicorn 時的當前目錄**（即 `backend/`）：

```
backend/ddas.log
```

已加入 `.gitignore`，不納入版控。伺服器重啟後 log 檔案仍然保留。

---

## 支援的 Action 類型

| Action | 觸發時機 |
|--------|---------|
| `AUTH_LOGIN` | 使用者登入成功 |
| `AUTH_REGISTER` | 新使用者註冊 |
| `ADD_FOOD` | 管理員新增食物 |
| `UPDATE_FOOD` | 管理員修改食物 |
| `DELETE_FOOD` | 管理員刪除食物 |
| `IMPORT_FOOD_CSV` | 管理員 CSV 批次匯入 |
| `DELETE_USER` | 管理員刪除使用者 |
| `UPDATE_USER_STATUS` | 管理員啟用／停用帳號 |
| `UPDATE_USER_ROLE` | 管理員變更使用者角色 |
| `RESET_PASSWORD` | 管理員重設使用者密碼 |
| `DELETE_RECORD` | 管理員刪除飲食紀錄 |
