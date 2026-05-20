import csv
import io
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Query, status

from utils.dependencies import get_current_user, require_admin
from utils.logger import write_log
from schemas import (
    Food,
    FoodCreate,
    FoodListResponse,
    FoodUpdate,
    MessageResponse,
    SessionUser,
)
from store import store

router = APIRouter()


def _food_dict_to_model(f: dict) -> Food:
    return Food(**f)


# IMPORTANT: /search and /import-csv must come BEFORE /{food_id}

@router.get("/search", response_model=list)
def search_foods(keyword: str = Query(default="")):
    if not keyword:
        return []
    kw_lower = keyword.lower()
    results = [
        f for f in store.foods if kw_lower in f["foodName"].lower()
    ]
    return [_food_dict_to_model(f) for f in results[:5]]


@router.post("/import-csv")
def import_csv(
    csvText: str = Form(...),
    current_user: SessionUser = Depends(require_admin),
):
    """Parse CSV text and bulk-import foods. First line is header and is skipped."""
    now_str = datetime.now(timezone.utc).isoformat()
    reader = csv.reader(io.StringIO(csvText.strip()))
    rows = list(reader)
    if not rows:
        return {"success": 0, "failed": 0, "errors": []}

    # Skip header row
    data_rows = rows[1:]
    success_count = 0
    failed_count = 0
    errors = []

    # Determine next food number
    existing_ids = [f["foodId"] for f in store.foods if f["foodId"].startswith("F")]
    max_num = 0
    for fid in existing_ids:
        try:
            num = int(fid[1:])
            if num > max_num:
                max_num = num
        except ValueError:
            pass

    for idx, row in enumerate(data_rows, start=2):  # start=2 because row 1 is header
        try:
            if len(row) < 8:
                raise ValueError(f"第 {idx} 行欄位不足（需要 8 欄）")
            food_name = row[0].strip()
            category = row[1].strip()
            serving_size = float(row[2].strip())
            serving_unit = row[3].strip()
            calories = int(row[4].strip())
            protein = float(row[5].strip())
            fat = float(row[6].strip())
            carb = float(row[7].strip())

            max_num += 1
            food_id = f"F{max_num:03d}"

            new_food = {
                "foodId": food_id,
                "foodName": food_name,
                "category": category,
                "servingSize": serving_size,
                "servingUnit": serving_unit,
                "caloriesPerServing": calories,
                "proteinPerServing": protein,
                "fatPerServing": fat,
                "carbPerServing": carb,
                "isCustom": False,
                "createdBy": "import",
                "createdAt": now_str,
                "updatedAt": now_str,
            }
            store.foods.append(new_food)
            success_count += 1
        except Exception as e:
            failed_count += 1
            errors.append(str(e))

    write_log(current_user.email, "IMPORT_FOOD_CSV", f"匯入 {success_count} 筆，失敗 {failed_count} 筆")
    return {"success": success_count, "failed": failed_count, "errors": errors}


@router.get("", response_model=FoodListResponse)
def list_foods(
    keyword: str = Query(default=""),
    category: str = Query(default=""),
    min_cal: int = Query(default=0),
    max_cal: int = Query(default=9999),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1),
):
    filtered = store.foods

    if keyword:
        kw_lower = keyword.lower()
        filtered = [f for f in filtered if kw_lower in f["foodName"].lower()]

    if category and category != "全部":
        filtered = [f for f in filtered if f["category"] == category]

    filtered = [f for f in filtered if min_cal <= f["caloriesPerServing"] <= max_cal]

    total = len(filtered)
    total_pages = max(1, (total + limit - 1) // limit)
    start = (page - 1) * limit
    end = start + limit
    page_items = filtered[start:end]

    return FoodListResponse(
        items=[_food_dict_to_model(f) for f in page_items],
        total=total,
        page=page,
        totalPages=total_pages,
    )


@router.get("/{food_id}", response_model=Food)
def get_food(food_id: str):
    food = next((f for f in store.foods if f["foodId"] == food_id), None)
    if not food:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="食物不存在")
    return _food_dict_to_model(food)


@router.post("", response_model=Food, status_code=status.HTTP_201_CREATED)
def create_food(body: FoodCreate, current_user: SessionUser = Depends(require_admin)):
    now_str = datetime.now(timezone.utc).isoformat()

    # Generate next food ID
    existing_ids = [f["foodId"] for f in store.foods if f["foodId"].startswith("F")]
    max_num = 0
    for fid in existing_ids:
        try:
            num = int(fid[1:])
            if num > max_num:
                max_num = num
        except ValueError:
            pass
    food_id = f"F{max_num + 1:03d}"

    new_food = {
        "foodId": food_id,
        "foodName": body.foodName,
        "category": body.category,
        "servingSize": body.servingSize,
        "servingUnit": body.servingUnit,
        "caloriesPerServing": body.caloriesPerServing,
        "proteinPerServing": body.proteinPerServing,
        "fatPerServing": body.fatPerServing,
        "carbPerServing": body.carbPerServing,
        "isCustom": body.isCustom,
        "createdBy": "admin",
        "createdAt": now_str,
        "updatedAt": now_str,
    }
    store.foods.append(new_food)
    write_log(current_user.email, "ADD_FOOD", f"{body.foodName} ({food_id})")
    return _food_dict_to_model(new_food)


@router.put("/{food_id}", response_model=Food)
def update_food(food_id: str, body: FoodUpdate, current_user: SessionUser = Depends(require_admin)):
    food = next((f for f in store.foods if f["foodId"] == food_id), None)
    if not food:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="食物不存在")

    now_str = datetime.now(timezone.utc).isoformat()
    updates = body.model_dump(exclude_none=True)
    store.foods = [
        {**f, **updates, "updatedAt": now_str} if f["foodId"] == food_id else f
        for f in store.foods
    ]
    updated = next(f for f in store.foods if f["foodId"] == food_id)
    write_log(current_user.email, "UPDATE_FOOD", f"{updated['foodName']} ({food_id})")
    return _food_dict_to_model(updated)


@router.delete("/{food_id}", response_model=MessageResponse)
def delete_food(food_id: str, current_user: SessionUser = Depends(require_admin)):
    food = next((f for f in store.foods if f["foodId"] == food_id), None)
    if not food:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="食物不存在")

    referenced = any(r.get("foodId") == food_id for r in store.records)
    if referenced:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此食物已被使用者飲食紀錄引用，無法刪除",
        )

    store.foods = [f for f in store.foods if f["foodId"] != food_id]
    write_log(current_user.email, "DELETE_FOOD", f"{food['foodName']} ({food_id})")
    return MessageResponse(success=True, message="食物已刪除")
