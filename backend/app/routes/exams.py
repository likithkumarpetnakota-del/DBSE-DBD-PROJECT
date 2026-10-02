from datetime import datetime, timezone

from bson import ObjectId

from fastapi import APIRouter, Depends, HTTPException

from app.database.connection import exams_collection, exam_sessions_collection
from app.models.exam import ExamCreate
from app.routes.auth import get_current_user
from app.routes.notifications import create_notification


router = APIRouter(
    prefix="/api/exams",
    tags=["Exams"]
)


def verify_admin_user(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrative privileges required."
        )


def compute_exam_status(start_time, end_time, current_status: str = "scheduled") -> str:
    now = datetime.now(timezone.utc)
    if isinstance(start_time, str):
        try:
            start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        except Exception:
            pass
    if isinstance(end_time, str):
        try:
            end_time = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        except Exception:
            pass

    if isinstance(start_time, datetime) and isinstance(end_time, datetime):
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        if end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)

        if now < start_time:
            return "SCHEDULED"
        elif start_time <= now <= end_time:
            return "ACTIVE"
        else:
            return "COMPLETED"

    return current_status.upper() if current_status else "SCHEDULED"


# ============================================================
# CREATE EXAM (ADMIN ONLY)
# ============================================================

@router.post("/")
def create_exam(
    exam: ExamCreate,
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    # Validate time
    if exam.end_time <= exam.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )

    # Validate marks
    if exam.passing_marks > exam.total_marks:
        raise HTTPException(
            status_code=400,
            detail="Passing marks cannot exceed total marks"
        )

    now = datetime.now(timezone.utc)
    status = compute_exam_status(exam.start_time, exam.end_time)

    exam_document = {
        "title": exam.title,
        "subject": exam.subject,
        "description": exam.description,
        "duration_minutes": exam.duration_minutes,
        "total_marks": exam.total_marks,
        "passing_marks": exam.passing_marks,
        "total_questions": exam.total_questions,
        "start_time": exam.start_time,
        "end_time": exam.end_time,
        "status": status.lower(),
        "randomize_questions": bool(exam.randomize_questions),
        "randomize_options": bool(exam.randomize_options),
        "created_by": str(current_user.get("sub", "")),
        "created_at": now,
        "updated_at": now
    }

    result = exams_collection.insert_one(exam_document)
    exam_id_str = str(result.inserted_id)

    # Trigger real notification for students
    create_notification(
        title="New Exam Scheduled",
        message=f"A new exam '{exam.title}' ({exam.subject}) has been scheduled.",
        type_name="exam_scheduled",
        recipient_role="student",
        link=f"/exam/{exam_id_str}"
    )

    return {
        "message": "Exam created successfully",
        "exam_id": exam_id_str
    }


# ============================================================
# GET ALL EXAMS
# ============================================================

@router.get("/")
def get_exams(
    current_user=Depends(get_current_user)
):
    exams = list(exams_collection.find())
    result = []

    for exam in exams:
        st = exam.get("start_time")
        et = exam.get("end_time")
        computed_status = compute_exam_status(st, et, exam.get("status", "scheduled"))

        result.append({
            "id": str(exam["_id"]),
            "title": exam["title"],
            "subject": exam["subject"],
            "description": exam.get("description"),
            "duration_minutes": exam["duration_minutes"],
            "total_marks": exam["total_marks"],
            "passing_marks": exam["passing_marks"],
            "total_questions": exam.get("total_questions", 1),
            "start_time": exam.get("start_time").isoformat() if hasattr(exam.get("start_time"), "isoformat") else str(exam.get("start_time", "")),
            "end_time": exam.get("end_time").isoformat() if hasattr(exam.get("end_time"), "isoformat") else str(exam.get("end_time", "")),
            "status": computed_status.lower(),
            "randomize_questions": bool(exam.get("randomize_questions", False)),
            "randomize_options": bool(exam.get("randomize_options", False))
        })

    return {
        "count": len(result),
        "exams": result
    }


# ============================================================
# GET SINGLE EXAM
# ============================================================

@router.get("/{exam_id}")
def get_exam(
    exam_id: str,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(exam_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid exam ID"
        )

    exam = exams_collection.find_one({"_id": ObjectId(exam_id)})

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    st = exam.get("start_time")
    et = exam.get("end_time")
    computed_status = compute_exam_status(st, et, exam.get("status", "scheduled"))

    return {
        "id": str(exam["_id"]),
        "title": exam["title"],
        "subject": exam["subject"],
        "description": exam.get("description"),
        "duration_minutes": exam["duration_minutes"],
        "total_marks": exam["total_marks"],
        "passing_marks": exam["passing_marks"],
        "total_questions": exam.get("total_questions", 1),
        "start_time": exam.get("start_time").isoformat() if hasattr(exam.get("start_time"), "isoformat") else str(exam.get("start_time", "")),
        "end_time": exam.get("end_time").isoformat() if hasattr(exam.get("end_time"), "isoformat") else str(exam.get("end_time", "")),
        "status": computed_status.lower(),
        "randomize_questions": bool(exam.get("randomize_questions", False)),
        "randomize_options": bool(exam.get("randomize_options", False))
    }


# ============================================================
# DELETE EXAM (ADMIN ONLY & EDIT PROTECTION)
# ============================================================

@router.delete("/{exam_id}")
def delete_exam(
    exam_id: str,
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    if not ObjectId.is_valid(exam_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid exam ID"
        )

    # Protect exams that have active student session attempts
    active_attempts = exam_sessions_collection.count_documents({
        "exam_id": exam_id,
        "status": {"$in": ["In Progress", "Joined", "Locked"]}
    })

    if active_attempts > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete exam: {active_attempts} active student attempts are currently in progress."
        )

    result = exams_collection.delete_one({"_id": ObjectId(exam_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    return {
        "message": "Exam deleted successfully"
    }