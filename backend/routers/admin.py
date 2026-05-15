from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from auth_utils import hash_password
from dependencies import require_admin
from logger import write_log, read_logs
from schemas import AdminRecord, AdminStats, AdminUser, LogEntry, MessageResponse, SessionUser
from store import store

router = APIRouter()


@router.get("/stats", response_model=AdminStats)
def get_stats(_: SessionUser = Depends(require_admin)):
    today = date.today().isoformat()
    week_start = (date.today() - timedelta(days=6)).isoformat()

    today_records = [r for r in store.records if r["recordDate"] == today]
    week_records = [r for r in store.records if week_start <= r["recordDate"] <= today]

    today_active_count = len({r["userId"] for r in today_records})
    today_record_count = len(today_records)
    week_record_count = len(week_records)
    food_db_count = len(store.foods)

    # Top 10 foods in last 7 days
    food_name_counts = Counter(r["foodName"] for r in week_records)
    top_foods = [
        {"name": name, "count": count}
        for name, count in food_name_counts.most_common(10)
    ]

    # Today's users with record counts
    user_record_counts = Counter(r["userId"] for r in today_records)
    today_users = []
    for user_id, count in user_record_counts.items():
        user = next((u for u in store.users if u["userId"] == user_id), None)
        if user:
            today_users.append(
                {
                    "userId": user_id,
                    "displayName": user["displayName"],
                    "email": user["email"],
                    "count": count,
                }
            )

    return AdminStats(
        todayActiveCount=today_active_count,
        todayRecordCount=today_record_count,
        weekRecordCount=week_record_count,
        foodDbCount=food_db_count,
        topFoods=top_foods,
        todayUsers=today_users,
    )


@router.get("/users", response_model=list)
def list_users(_: SessionUser = Depends(require_admin)):
    result = []
    for u in store.users:
        result.append(
            AdminUser(
                userId=u["userId"],
                displayName=u["displayName"],
                email=u["email"],
                role=u["role"],
                isActive=u["isActive"],
                createdAt=u["createdAt"],
                lastLoginAt=u.get("lastLoginAt"),
            )
        )
    return result


@router.put("/users/{user_id}/status", response_model=MessageResponse)
def toggle_user_status(
    user_id: str,
    isActive: bool = Body(..., embed=True),
    current_user: SessionUser = Depends(require_admin),
):
    if user_id == current_user.userId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能停用自己的帳號",
        )
    user = next((u for u in store.users if u["userId"] == user_id), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用者不存在")

    now_str = datetime.now(timezone.utc).isoformat()
    store.users = [
        {**u, "isActive": isActive, "updatedAt": now_str} if u["userId"] == user_id else u
        for u in store.users
    ]
    action = "啟用" if isActive else "停用"
    write_log(current_user.email, "UPDATE_USER_STATUS", f"{user['displayName']} <{user['email']}> → {action}")
    return MessageResponse(success=True, message=f"使用者已{action}")


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: str,
    current_user: SessionUser = Depends(require_admin),
):
    if user_id == current_user.userId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能刪除自己的帳號",
        )
    user = next((u for u in store.users if u["userId"] == user_id), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用者不存在")

    store.users = [u for u in store.users if u["userId"] != user_id]
    store.records = [r for r in store.records if r["userId"] != user_id]
    write_log(current_user.email, "DELETE_USER", f"{user['displayName']} <{user['email']}>")
    return MessageResponse(success=True, message="使用者及其飲食紀錄已刪除")


@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: str,
    newPassword: str = Body(..., embed=True),
    current_user: SessionUser = Depends(require_admin),
):
    user = next((u for u in store.users if u["userId"] == user_id), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用者不存在")

    now_str = datetime.now(timezone.utc).isoformat()
    new_hash = hash_password(newPassword)
    store.users = [
        {**u, "passwordHash": new_hash, "updatedAt": now_str} if u["userId"] == user_id else u
        for u in store.users
    ]
    write_log(current_user.email, "RESET_PASSWORD", f"{user['displayName']} <{user['email']}>")
    return {"tempPassword": newPassword, "message": "密碼已重設"}


@router.put("/users/{user_id}/role", response_model=MessageResponse)
def change_user_role(
    user_id: str,
    role: str = Body(..., embed=True),
    current_user: SessionUser = Depends(require_admin),
):
    if user_id == current_user.userId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能變更自己的角色")
    if role not in ("user", "admin"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="角色必須為 user 或 admin")
    user = next((u for u in store.users if u["userId"] == user_id), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用者不存在")
    now_str = datetime.now(timezone.utc).isoformat()
    store.users = [
        {**u, "role": role, "updatedAt": now_str} if u["userId"] == user_id else u
        for u in store.users
    ]
    write_log(current_user.email, "UPDATE_USER_ROLE", f"{user['displayName']} <{user['email']}> → {role}")
    return MessageResponse(success=True, message=f"角色已變更為 {role}")


@router.delete("/records/{record_id}", response_model=MessageResponse)
def admin_delete_record(
    record_id: str,
    current_user: SessionUser = Depends(require_admin),
):
    record = next((r for r in store.records if r["recordId"] == record_id), None)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="紀錄不存在")
    store.records = [r for r in store.records if r["recordId"] != record_id]
    write_log(current_user.email, "DELETE_RECORD", f"{record['foodName']} ({record_id[:8]}...)")
    return MessageResponse(success=True, message="紀錄已刪除")


@router.get("/records", response_model=list)
def get_all_records(
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    meal_type: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
    user_email: Optional[str] = Query(default=None),
    _: SessionUser = Depends(require_admin),
):
    records = list(store.records)

    if start_date:
        records = [r for r in records if r["recordDate"] >= start_date]
    if end_date:
        records = [r for r in records if r["recordDate"] <= end_date]
    if meal_type:
        records = [r for r in records if r["mealType"] == meal_type]
    if user_id:
        records = [r for r in records if r["userId"] == user_id]
    if user_email:
        email_lower = user_email.lower()
        matched_user_ids = {
            u["userId"] for u in store.users if u["email"].lower() == email_lower
        }
        records = [r for r in records if r["userId"] in matched_user_ids]

    # Sort by createdAt desc
    records = sorted(records, key=lambda r: r.get("createdAt", ""), reverse=True)


    result = []
    for r in records:
        user = next((u for u in store.users if u["userId"] == r["userId"]), None)
        display_name = user["displayName"] if user else ""
        user_email_val = user["email"] if user else ""
        result.append(
            AdminRecord(
                recordId=r["recordId"],
                userId=r["userId"],
                mealType=r["mealType"],
                recordDate=r["recordDate"],
                foodName=r["foodName"],
                foodId=r.get("foodId"),
                servingAmount=r["servingAmount"],
                calories=r["calories"],
                protein=r["protein"],
                fat=r["fat"],
                carbohydrate=r["carbohydrate"],
                note=r.get("note", ""),
                createdAt=r["createdAt"],
                updatedAt=r["updatedAt"],
                displayName=display_name,
                userEmail=user_email_val,
            )
        )
    return result


@router.get("/logs", response_model=list)
def get_logs(_: SessionUser = Depends(require_admin)):
    entries = read_logs()
    return [LogEntry(**e) for e in entries]
