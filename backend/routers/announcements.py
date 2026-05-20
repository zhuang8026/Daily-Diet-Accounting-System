from datetime import date, datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from utils.dependencies import get_current_user, require_admin
from schemas import Announcement, AnnouncementCreate, AnnouncementUpdate, MessageResponse, SessionUser
from store import store

router = APIRouter()


def _ann_dict_to_model(a: dict) -> Announcement:
    return Announcement(**a)


# IMPORTANT: /active must come BEFORE /{ann_id}

@router.get("/active", response_model=Optional[Announcement])
def get_active_announcement():
    today = date.today().isoformat()
    for ann in store.announcements:
        if (
            ann.get("isActive")
            and ann.get("startDate", "") <= today <= ann.get("endDate", "")
        ):
            return _ann_dict_to_model(ann)
    return None


@router.get("", response_model=list)
def list_announcements(_: SessionUser = Depends(require_admin)):
    sorted_anns = sorted(
        store.announcements,
        key=lambda a: a.get("createdAt", ""),
        reverse=True,
    )
    return [_ann_dict_to_model(a) for a in sorted_anns]


@router.post("", response_model=Announcement, status_code=status.HTTP_201_CREATED)
def create_announcement(
    body: AnnouncementCreate,
    _: SessionUser = Depends(require_admin),
):
    now_str = datetime.now(timezone.utc).isoformat()
    new_ann = {
        "id": str(uuid4()),
        "title": body.title,
        "content": body.content,
        "startDate": body.startDate,
        "endDate": body.endDate,
        "isActive": body.isActive,
        "createdAt": now_str,
        "updatedAt": now_str,
    }
    store.announcements.append(new_ann)
    return _ann_dict_to_model(new_ann)


@router.put("/{ann_id}", response_model=Announcement)
def update_announcement(
    ann_id: str,
    body: AnnouncementUpdate,
    _: SessionUser = Depends(require_admin),
):
    ann = next((a for a in store.announcements if a["id"] == ann_id), None)
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="公告不存在")

    now_str = datetime.now(timezone.utc).isoformat()
    updates = body.model_dump(exclude_none=True)
    store.announcements = [
        {**a, **updates, "updatedAt": now_str} if a["id"] == ann_id else a
        for a in store.announcements
    ]
    updated = next(a for a in store.announcements if a["id"] == ann_id)
    return _ann_dict_to_model(updated)


@router.delete("/{ann_id}", response_model=MessageResponse)
def delete_announcement(ann_id: str, _: SessionUser = Depends(require_admin)):
    ann = next((a for a in store.announcements if a["id"] == ann_id), None)
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="公告不存在")

    store.announcements = [a for a in store.announcements if a["id"] != ann_id]
    return MessageResponse(success=True, message="公告已刪除")
