import pathlib
import threading
from datetime import datetime
from typing import Dict, List

# 日誌檔案路徑（固定於 backend/ 目錄下）
_LOG_PATH = pathlib.Path(__file__).parent / "ddas.log"

# 多執行緒寫入鎖，防止並發時日誌交錯
_lock = threading.Lock()


def write_log(user: str, action: str, detail: str) -> None:
    """
    追加一行日誌到 ddas.log。
    格式：[YYYY-MM-DD HH:MM:SS] user | action | detail
    對應 C 的 log_write(user, action, detail)
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {user} | {action} | {detail}\n"
    with _lock:
        with _LOG_PATH.open("a", encoding="utf-8") as fp:
            fp.write(line)


def read_logs() -> List[Dict]:
    """
    讀取 ddas.log 全部內容，解析後以最新到最舊順序回傳。
    對應 C 的 log_read_all(output, max_size)。

    每筆回傳格式：
        {"timestamp": str, "user": str, "action": str, "detail": str}
    """
    if not _LOG_PATH.exists():
        return []

    with _lock:
        raw = _LOG_PATH.read_text(encoding="utf-8", errors="replace")

    lines = [line for line in raw.splitlines() if line.strip()]

    entries: List[Dict] = []
    for line in reversed(lines):  # 最新到最舊
        try:
            bracket_end = line.index("]")
            timestamp = line[1:bracket_end]
            rest = line[bracket_end + 2:]
            parts = [p.strip() for p in rest.split("|", 2)]
            if len(parts) == 3:
                entries.append({
                    "timestamp": timestamp,
                    "user": parts[0],
                    "action": parts[1],
                    "detail": parts[2],
                })
        except (ValueError, IndexError):
            continue

    return entries
