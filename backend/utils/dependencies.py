from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError

from utils.auth_utils import decode_token
from store import store
from schemas import SessionUser


def get_current_user(ddas_token: Optional[str] = Cookie(None)) -> SessionUser:
    if not ddas_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登入或 Token 已過期",
        )
    try:
        payload = decode_token(ddas_token)
        user_id = payload.get("userId")
        user = next((u for u in store.users if u["userId"] == user_id), None)
        if not user or not user["isActive"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="帳號無效或已停用",
            )
        return SessionUser(
            userId=user["userId"],
            displayName=user["displayName"],
            email=user["email"],
            role=user["role"],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 無效或已過期",
        )


def require_admin(
    current_user: SessionUser = Depends(get_current_user),
) -> SessionUser:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理員權限",
        )
    return current_user
