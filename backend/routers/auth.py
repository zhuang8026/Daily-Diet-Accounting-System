import re
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status, Depends

from auth_utils import hash_password, verify_password, create_access_token
from dependencies import get_current_user
from logger import write_log
from schemas import LoginRequest, RegisterRequest, TokenResponse, SessionUser, MessageResponse
from store import store

router = APIRouter()


def _validate_password_strength(password: str) -> bool:
    """Return True if password has length >= 6 and at least 3 of 4 character types."""
    if len(password) < 6:
        return False
    types = 0
    if re.search(r'[A-Z]', password):
        types += 1
    if re.search(r'[a-z]', password):
        types += 1
    if re.search(r'\d', password):
        types += 1
    if re.search(r'[^A-Za-z0-9]', password):
        types += 1
    return types >= 3


def _validate_email(email: str) -> bool:
    """Simple check: contains @ and has a . after @."""
    if "@" not in email:
        return False
    local, _, domain = email.partition("@")
    return "." in domain


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    email_lower = body.email.strip().lower()
    user = next((u for u in store.users if u["email"].lower() == email_lower), None)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="帳號或密碼錯誤")

    # Check lockout
    attempt_info = store.login_attempts.get(email_lower)
    if attempt_info:
        locked_until = attempt_info.get("locked_until")
        if locked_until and attempt_info.get("count", 0) >= 5:
            locked_dt = datetime.fromisoformat(locked_until)
            now = datetime.now(timezone.utc)
            if locked_dt.tzinfo is None:
                locked_dt = locked_dt.replace(tzinfo=timezone.utc)
            if now < locked_dt:
                remaining_minutes = int((locked_dt - now).total_seconds() / 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "locked": True,
                        "message": f"帳號已鎖定，請於 {remaining_minutes} 分鐘後再試",
                    },
                )
            else:
                # Lock expired — reset
                store.login_attempts[email_lower] = {"count": 0, "locked_until": None}

    if not verify_password(body.password, user["passwordHash"]):
        # Increment failure counter
        info = store.login_attempts.get(email_lower, {"count": 0, "locked_until": None})
        info["count"] = info.get("count", 0) + 1
        if info["count"] >= 5:
            info["locked_until"] = (
                datetime.now(timezone.utc) + timedelta(minutes=15)
            ).isoformat()
        store.login_attempts[email_lower] = info
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="帳號或密碼錯誤")

    # Success — clear attempts, update lastLoginAt
    store.login_attempts[email_lower] = {"count": 0, "locked_until": None}
    now_str = datetime.now(timezone.utc).isoformat()
    store.users = [
        {**u, "lastLoginAt": now_str} if u["userId"] == user["userId"] else u
        for u in store.users
    ]

    token = create_access_token(
        {"userId": user["userId"], "email": user["email"], "role": user["role"]}
    )
    session_user = SessionUser(
        userId=user["userId"],
        displayName=user["displayName"],
        email=user["email"],
        role=user["role"],
    )
    # write_log(email_lower, "AUTH_LOGIN", f"{user['displayName']} 登入成功")
    return TokenResponse(access_token=token, user=session_user)


@router.post("/register", response_model=MessageResponse)
def register(body: RegisterRequest):
    email = body.email.strip().lower()

    if not _validate_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email 格式不正確")

    if not _validate_password_strength(body.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密碼強度不足：至少 6 個字元，且包含大寫、小寫、數字、特殊符號中的至少 3 種",
        )

    display_name = body.displayName.strip()
    if not display_name or len(display_name) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="顯示名稱必須為 1～30 個字元",
        )

    existing = next((u for u in store.users if u["email"].lower() == email), None)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="此 Email 已被使用")

    now_str = datetime.now(timezone.utc).isoformat()
    new_user = {
        "userId": str(uuid4()),
        "displayName": display_name,
        "email": email,
        "passwordHash": hash_password(body.password),
        "gender": None,
        "age": None,
        "heightCm": None,
        "weightKg": None,
        "activityLevel": "moderate",
        "dietGoal": "maintain",
        "targetCalories": 2000,
        "targetProtein": 120.0,
        "targetFat": 67.0,
        "targetCarb": 250.0,
        "role": "user",
        "isActive": True,
        "createdAt": now_str,
        "updatedAt": now_str,
        "lastLoginAt": None,
    }
    store.users.append(new_user)
    write_log(email, "AUTH_REGISTER", f"{display_name} 註冊新帳號")
    return MessageResponse(success=True, message="註冊成功，請登入")


@router.get("/me", response_model=SessionUser)
def me(current_user: SessionUser = Depends(get_current_user)):
    return current_user
