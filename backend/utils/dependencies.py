from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from utils.auth_utils import decode_token
from store import store
from schemas import SessionUser

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> SessionUser:
    try:
        payload = decode_token(credentials.credentials)
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
