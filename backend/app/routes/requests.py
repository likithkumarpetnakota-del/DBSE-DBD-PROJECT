from datetime import datetime, timezone
from typing import Dict, Any, List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database.connection import (
    requests_collection,
    submissions_collection,
    exams_collection,
    users_collection
)
from app.routes.auth import get_current_user


router = APIRouter(
    prefix="/api/requests",
    tags=["Unlock Requests"]
)


class UnlockRequestCreate(BaseModel):
    exam_id: str
    reason: str = Field(..., min_length=5, max_length=1000)


@router.post("/")
def create_unlock_request(
    req: UnlockRequestCreate,
    current_user=Depends(get_current_user)
):
    exam = None
    if ObjectId.is_valid(req.exam_id):
        exam = exams_collection.find_one({"_id": ObjectId(req.exam_id)})
    
    if not exam:
        # Fallback lookup by title or first available exam
        if "dsa" in req.exam_id.lower():
            exam = exams_collection.find_one({"subject": {"$regex": "Data Structures", "$options": "i"}})
        elif "cn" in req.exam_id.lower():
            exam = exams_collection.find_one({"subject": {"$regex": "Networks", "$options": "i"}})
        elif "dbms" in req.exam_id.lower():
            exam = exams_collection.find_one({"subject": {"$regex": "Database", "$options": "i"}})
        
        if not exam:
            exam = exams_collection.find_one()

    exam_title = exam.get("title", "Midterm Assessment") if exam else "DSA Midterm Assessment"
    subject = exam.get("subject", "General") if exam else "Data Structures & Algorithms"
    actual_exam_id = str(exam["_id"]) if exam else req.exam_id

    user_doc = users_collection.find_one({"_id": current_user["sub"] if isinstance(current_user["sub"], str) else current_user["sub"]})
    if not user_doc and ObjectId.is_valid(current_user["sub"]):
        user_doc = users_collection.find_one({"_id": ObjectId(current_user["sub"])})

    student_name = user_doc.get("name", "Student") if user_doc else "Student"
    student_email = user_doc.get("email", "") if user_doc else ""

    # Expire any old requests for this student & exam so previous approvals cannot be reused
    requests_collection.update_many(
        {"student_id": current_user["sub"], "$or": [{"exam_id": actual_exam_id}, {"exam_id": req.exam_id}]},
        {"$set": {"status": "expired"}}
    )

    request_doc = {

        "exam_id": actual_exam_id,
        "exam_title": exam_title,
        "subject": subject,
        "student_id": current_user["sub"],
        "student_name": student_name,
        "student_email": student_email,
        "reason": req.reason,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc)
    }

    result = requests_collection.insert_one(request_doc)

    return {
        "message": "Unlock request submitted successfully to admin",
        "request_id": str(result.inserted_id)
    }



@router.get("/pending")
def get_pending_requests(
    current_user=Depends(get_current_user)
):
    requests = list(requests_collection.find({"status": "pending"}).sort("requested_at", -1))
    result = []
    for r in requests:
        result.append({
            "id": str(r["_id"]),
            "exam_id": str(r["exam_id"]),
            "exam_title": r.get("exam_title"),
            "subject": r.get("subject"),
            "student_id": r.get("student_id"),
            "student_name": r.get("student_name"),
            "student_email": r.get("student_email"),
            "reason": r.get("reason"),
            "status": r.get("status"),
            "requested_at": r.get("requested_at").isoformat() if r.get("requested_at") and hasattr(r.get("requested_at"), "isoformat") else str(r.get("requested_at"))
        })
    return {
        "count": len(result),
        "requests": result
    }


@router.get("/my")
def get_my_requests(
    current_user=Depends(get_current_user)
):
    requests = list(requests_collection.find({"student_id": current_user["sub"]}))
    result = []
    for r in requests:
        result.append({
            "id": str(r["_id"]),
            "exam_id": str(r["exam_id"]),
            "exam_title": r.get("exam_title"),
            "reason": r.get("reason"),
            "status": r.get("status"),
            "requested_at": r.get("requested_at").isoformat() if r.get("requested_at") and hasattr(r.get("requested_at"), "isoformat") else str(r.get("requested_at"))
        })
    return {
        "count": len(result),
        "requests": result
    }


@router.post("/{request_id}/approve")
def approve_request(
    request_id: str,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")

    req_doc = requests_collection.find_one({"_id": ObjectId(request_id)})
    if not req_doc:
        raise HTTPException(status_code=404, detail="Unlock request not found")

    # Update request status to approved
    requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "approved",
            "approved_at": datetime.now(timezone.utc),
            "approved_by": current_user["sub"]
        }}
    )

    # Remove any banned/lock submission so the student can attempt the exam again
    submissions_collection.delete_many({
        "student_id": req_doc.get("student_id"),
        "exam_id": req_doc.get("exam_id")
    })

    return {
        "message": "Unlock request approved! Access granted for student.",
        "student_id": req_doc.get("student_id"),
        "exam_id": str(req_doc.get("exam_id"))
    }


@router.post("/{request_id}/consume")
def consume_request(
    request_id: str,
    current_user=Depends(get_current_user)
):
    if ObjectId.is_valid(request_id):
        requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "consumed", "consumed_at": datetime.now(timezone.utc)}}
        )
    return {"message": "Approval consumed"}

