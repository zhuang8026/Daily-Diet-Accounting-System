import ctypes
import pathlib
from typing import List, Dict

_lib_path = pathlib.Path(__file__).parent.parent / "core" / "liblogger.so"

# 載入 liblogger.so
try:
    _lib = ctypes.CDLL(str(_lib_path))
    _lib.log_write.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p]
    _lib.log_write.restype = None
    _lib.log_read_all.argtypes = [ctypes.c_char_p, ctypes.c_int]
    _lib.log_read_all.restype = ctypes.c_int
    _AVAILABLE = True
except OSError:
    _AVAILABLE = False

# 寫入日誌
def write_log(user: str, action: str, detail: str) -> None:
    if not _AVAILABLE:
        return
    
    # 呼叫 C 語言的 log_write 函式
    _lib.log_write(
        user.encode("utf-8"),
        action.encode("utf-8"),
        detail.encode("utf-8"),
    )


# 讀取日誌
def read_logs() -> List[Dict]:
    if not _AVAILABLE:
        return []

    buf_size = 1024 * 1024  # 1 MB
    buf = ctypes.create_string_buffer(buf_size) # 建立字串緩衝區

    # 呼叫 C 語言的 log_read_all 函式
    _lib.log_read_all(buf, ctypes.c_int(buf_size))

    raw = buf.value.decode("utf-8", errors="replace")
    lines = [line for line in raw.splitlines() if line.strip()]

    entries = []
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
