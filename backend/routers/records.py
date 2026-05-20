from datetime import date, datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from utils.dependencies import get_current_user
from schemas import (
    DailySummary,
    MessageResponse,
    RangeSummaryItem,
    Record,
    RecordCreate,
    RecordUpdate,
    SessionUser,
)
from store import store

router = APIRouter()


def _record_dict_to_model(r: dict) -> Record:
    return Record(**r)


# IMPORTANT: /summary/daily and /summary/range must come BEFORE /{record_id}

@router.get("/summary/daily", response_model=DailySummary)
def daily_summary(
    date_str: str = Query(alias="date"),
    current_user: SessionUser = Depends(get_current_user),
):
    user_records = [
        r for r in store.records
        if r["userId"] == current_user.userId and r["recordDate"] == date_str
    ]
    total_calories = sum(r["calories"] for r in user_records)
    total_protein = sum(r["protein"] for r in user_records)
    total_fat = sum(r["fat"] for r in user_records)
    total_carb = sum(r["carbohydrate"] for r in user_records)
    return DailySummary(
        totalCalories=int(total_calories),
        totalProtein=round(total_protein, 2),
        totalFat=round(total_fat, 2),
        totalCarb=round(total_carb, 2),
    )


@router.get("/summary/range", response_model=list)
def range_summary(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: SessionUser = Depends(get_current_user),
):
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    days = []
    current = start
    while current <= end:
        days.append(current.isoformat())
        current += timedelta(days=1)

    user_records = [r for r in store.records if r["userId"] == current_user.userId]

    result = []
    for day in days:
        day_records = [r for r in user_records if r["recordDate"] == day]
        has_data = len(day_records) > 0
        total_calories = sum(r["calories"] for r in day_records)
        total_protein = sum(r["protein"] for r in day_records)
        total_fat = sum(r["fat"] for r in day_records)
        total_carb = sum(r["carbohydrate"] for r in day_records)
        result.append(
            RangeSummaryItem(
                date=day,
                totalCalories=int(total_calories),
                totalProtein=round(total_protein, 2),
                totalFat=round(total_fat, 2),
                totalCarb=round(total_carb, 2),
                hasData=has_data,
            )
        )
    return result


@router.get("", response_model=list)
def list_records(
    date_str: Optional[str] = Query(default=None, alias="date"),
    meal_type: Optional[str] = Query(default=None),
    current_user: SessionUser = Depends(get_current_user),
):
    records = [r for r in store.records if r["userId"] == current_user.userId]
    if date_str:
        records = [r for r in records if r["recordDate"] == date_str]
    if meal_type:
        records = [r for r in records if r["mealType"] == meal_type]
    return [_record_dict_to_model(r) for r in records]


@router.post("", response_model=Record, status_code=status.HTTP_201_CREATED)
def create_record(body: RecordCreate, current_user: SessionUser = Depends(get_current_user)):
    now_str = datetime.now(timezone.utc).isoformat()
    new_record = {
        "recordId": str(uuid4()),
        "userId": current_user.userId,
        "mealType": body.mealType,
        "recordDate": body.recordDate,
        "foodName": body.foodName,
        "foodId": body.foodId,
        "servingAmount": body.servingAmount,
        "calories": body.calories,
        "protein": body.protein,
        "fat": body.fat,
        "carbohydrate": body.carbohydrate,
        "note": body.note,
        "createdAt": now_str,
        "updatedAt": now_str,
    }
    store.records.append(new_record)
    return _record_dict_to_model(new_record)


@router.put("/{record_id}", response_model=Record)
def update_record(
    record_id: str,
    body: RecordUpdate,
    current_user: SessionUser = Depends(get_current_user),
):
    record = next((r for r in store.records if r["recordId"] == record_id), None)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="紀錄不存在")
    if record["userId"] != current_user.userId:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="無權限修改此紀錄")

    now_str = datetime.now(timezone.utc).isoformat()
    updates = body.model_dump(exclude_none=True)
    store.records = [
        {**r, **updates, "updatedAt": now_str} if r["recordId"] == record_id else r
        for r in store.records
    ]
    updated = next(r for r in store.records if r["recordId"] == record_id)
    return _record_dict_to_model(updated)


@router.delete("/{record_id}", response_model=MessageResponse)
def delete_record(
    record_id: str,
    current_user: SessionUser = Depends(get_current_user),
):
    record = next((r for r in store.records if r["recordId"] == record_id), None)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="紀錄不存在")
    if record["userId"] != current_user.userId:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="無權限刪除此紀錄")

    store.records = [r for r in store.records if r["recordId"] != record_id]
    return MessageResponse(success=True, message="紀錄已刪除")
