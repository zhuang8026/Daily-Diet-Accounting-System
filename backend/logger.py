import ctypes
import pathlib
from typing import List, Dict

_lib_path = pathlib.Path(__file__).parent.parent / "core" / "liblogger.so"

try:
    _lib = ctypes.CDLL(str(_lib_path))
    _lib.log_write.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p]
    _lib.log_write.restype = None
    _lib.log_read_all.argtypes = [ctypes.c_char_p, ctypes.c_int]
    _lib.log_read_all.restype = ctypes.c_int
    _AVAILABLE = True
except OSError:
    _AVAILABLE = False


def write_log(user: str, action: str, detail: str) -> None:
    if not _AVAILABLE:
        return
    _lib.log_write(
        user.encode("utf-8"),
        action.encode("utf-8"),
        detail.encode("utf-8"),
    )


def read_logs() -> List[Dict]:
    if not _AVAILABLE:
        return []

    buf_size = 1024 * 1024  # 1 MB
    buf = ctypes.create_string_buffer(buf_size)
    _lib.log_read_all(buf, ctypes.c_int(buf_size))

    raw = buf.value.decode("utf-8", errors="replace")
    lines = [line for line in raw.splitlines() if line.strip()]

    entries = []
    for line in reversed(lines):  # newest first
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
