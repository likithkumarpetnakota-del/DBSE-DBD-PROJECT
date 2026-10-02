from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.database.connection import notifications_collection, users_collection
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

class NotificationCreate(BaseModel):
    recipient_id: Optional[str] = None
    recipient_role: Optional[str] = "student"  # 'student' or 'admin'
    title: str
    message: str
    type: str  # 'exam_scheduled', 'exam_starting', 'exam_unlocked', 'unlock_approved', 'unlock_rejected', 'submitted', 'joined', 'locked', 'unlock_request', 'review_required'
    link: Optional[str] = None


def create_notification(
    title: str,
    message: str,
    type_name: str,
    recipient_id: Optional[str] = None,
    recipient_role: str = "student",
    link: Optional[str] = None
):
    try:
        now = datetime.now(timezone.utc)
        doc = {
            "title": title,
            "message": message,
            "type": type_name,
            "recipient_id": str(recipient_id) if recipient_id else None,
            "recipient_role": recipient_role,
            "link": link or "",
            "read": False,
            "created_at": now,
            "timestamp": now.isoformat()
        }
        notifications_collection.insert_one(doc)
    except Exception as e:
        print("Failed to insert notification:", e)


@router.get("/")
def get_notifications(
    current_user=Depends(get_current_user),
    limit: int = Query(25, ge=1, le=100)
):
    user_id = str(current_user.get("sub", ""))
    role = current_user.get("role", "student")

    query = {
        "$or": [
            {"recipient_id": user_id},
            {"recipient_role": role, "recipient_id": None}
        ]
    }

    if role == "admin":
        query["$or"].append({"recipient_role": "admin"})

    items = list(notifications_collection.find(query).sort("created_at", -1).limit(limit))

    result = []
    unread_count = 0

    for item in items:
        if not item.get("read", False):
            unread_count += 1
        result.append({
            "id": str(item["_id"]),
            "title": item.get("title", ""),
            "message": item.get("message", ""),
            "type": item.get("type", "info"),
            "read": item.get("read", False),
            "link": item.get("link", ""),
            "timestamp": item.get("timestamp") or (item["created_at"].isoformat() if hasattr(item.get("created_at"), "isoformat") else str(item.get("created_at"))),
            "recipient_role": item.get("recipient_role", "student")
        })

    return {
        "notifications": result,
        "unread_count": unread_count
    }


@router.post("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: str,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    res = notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )

    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"ok": True, "message": "Notification marked as read"}


@router.post("/read-all")
def mark_all_notifications_as_read(
    current_user=Depends(get_current_user)
):
    user_id = str(current_user.get("sub", ""))
    role = current_user.get("role", "student")

    query = {
        "$or": [
            {"recipient_id": user_id},
            {"recipient_role": role, "recipient_id": None}
        ]
    }

    notifications_collection.update_many(query, {"$set": {"read": True}})
    return {"ok": True, "message": "All notifications marked as read"}
