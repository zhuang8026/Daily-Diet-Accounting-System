from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from utils.dependencies import get_current_user
from schemas import ProfileUpdate, SessionUser, UserProfile
from store import store

router = APIRouter()


def _user_to_profile(u: dict) -> UserProfile:
    return UserProfile(
        userId=u["userId"],
        displayName=u["displayName"],
        email=u["email"],
        gender=u.get("gender"),
        age=u.get("age"),
        heightCm=u.get("heightCm"),
        weightKg=u.get("weightKg"),
        activityLevel=u.get("activityLevel", "moderate"),
        dietGoal=u.get("dietGoal", "maintain"),
        targetCalories=u.get("targetCalories", 2000),
        targetProtein=u.get("targetProtein", 120.0),
        targetFat=u.get("targetFat", 67.0),
        targetCarb=u.get("targetCarb", 250.0),
    )


@router.get("", response_model=UserProfile)
def get_profile(current_user: SessionUser = Depends(get_current_user)):
    user = next((u for u in store.users if u["userId"] == current_user.userId), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用者不存在")
    return _user_to_profile(user)


@router.put("", response_model=UserProfile)
def update_profile(
    body: ProfileUpdate,
    current_user: SessionUser = Depends(get_current_user),
):
    user = next((u for u in store.users if u["userId"] == current_user.userId), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用者不存在")

    now_str = datetime.now(timezone.utc).isoformat()
    updates = body.model_dump(exclude_none=True)
    store.users = [
        {**u, **updates, "updatedAt": now_str} if u["userId"] == current_user.userId else u
        for u in store.users
    ]
    updated_user = next(u for u in store.users if u["userId"] == current_user.userId)
    return _user_to_profile(updated_user)


@router.get("/targets")
def get_targets(current_user: SessionUser = Depends(get_current_user)):
    user = next((u for u in store.users if u["userId"] == current_user.userId), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="使用者不存在")
    return {
        "targetCalories": user.get("targetCalories", 2000),
        "targetProtein": user.get("targetProtein", 120.0),
        "targetFat": user.get("targetFat", 67.0),
        "targetCarb": user.get("targetCarb", 250.0),
    }
