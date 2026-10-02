from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database.connection import (
    submissions_collection,
    exams_collection,
    questions_collection,
    users_collection
)
from app.routes.auth import get_current_user


from app.database.connection import (
    submissions_collection,
    exams_collection,
    questions_collection,
    users_collection,
    exam_sessions_collection
)
from app.routes.auth import get_current_user


router = APIRouter(
    prefix="/api/submissions",
    tags=["Submissions"]
)


def verify_admin_user(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrative privileges required."
        )


class SubmissionCreate(BaseModel):
    exam_id: str
    answers: Dict[str, Any] = {} # question_id -> {selected: int} or int index
    violations: List[Dict[str, Any]] = []
    total_violations: int = 0
    risk_level: str = "Low"


@router.post("/")
def create_submission(
    submission: SubmissionCreate,
    current_user=Depends(get_current_user)
):
    student_id = str(current_user.get("sub", "student_user"))

    exam = None
    if ObjectId.is_valid(submission.exam_id):
        exam = exams_collection.find_one({"_id": ObjectId(submission.exam_id)})

    if not exam:
        if "dsa" in submission.exam_id.lower():
            exam = exams_collection.find_one({"subject": {"$regex": "Data Structures", "$options": "i"}})
        elif "cn" in submission.exam_id.lower():
            exam = exams_collection.find_one({"subject": {"$regex": "Networks", "$options": "i"}})
        elif "dbms" in submission.exam_id.lower():
            exam = exams_collection.find_one({"subject": {"$regex": "Database", "$options": "i"}})
        if not exam:
            exam = exams_collection.find_one()

    exam_obj_id = exam["_id"] if exam else submission.exam_id
    questions = list(questions_collection.find({"exam_id": exam_obj_id})) if exam else []

    correct_count = 0
    incorrect_count = 0
    skipped_count = 0
    total_score = 0
    earned_marks = 0

    for q in questions:
        q_id_str = str(q["_id"])
        q_marks = q.get("marks", 1)
        total_score += q_marks
        
        user_ans = submission.answers.get(q_id_str)
        if user_ans is None:
            skipped_count += 1
            continue

        selected_opt = user_ans.get("selected") if isinstance(user_ans, dict) else user_ans
        if selected_opt is None:
            skipped_count += 1
        elif selected_opt == q.get("correct_option"):
            correct_count += 1
            earned_marks += q_marks
        else:
            incorrect_count += 1

    if total_score == 0 and len(questions) > 0:
        total_score = len(questions)

    passing_marks = float(exam.get("passing_marks", total_score / 2)) if exam else float(total_score / 2)
    percentage_score = round((earned_marks / total_score * 100), 1) if total_score > 0 else 0.0
    pass_status = "PASSED" if earned_marks >= passing_marks else "FAILED"

    # Fetch user details
    user_doc = users_collection.find_one({"_id": student_id if isinstance(student_id, str) else student_id})
    if not user_doc and ObjectId.is_valid(student_id):
        user_doc = users_collection.find_one({"_id": ObjectId(student_id)})

    student_name = user_doc.get("name", "Student") if user_doc else current_user.get("name", "Student")
    student_email = user_doc.get("email", "") if user_doc else current_user.get("email", "student@exam.com")
    roll_no = user_doc.get("student_id", "") if user_doc else ""

    # Fetch session timing
    now = datetime.now(timezone.utc)
    session_doc = exam_sessions_collection.find_one({
        "$or": [
            {"exam_id": str(exam_obj_id), "student_id": student_id},
            {"exam_id": submission.exam_id, "student_id": student_id}
        ]
    })

    start_time = session_doc.get("start_time") or session_doc.get("entry_time") or now if session_doc else now
    if isinstance(start_time, str):
        try:
            start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        except Exception:
            start_time = now

    time_used_seconds = int((now - start_time).total_seconds()) if isinstance(start_time, datetime) else 0
    time_used_str = f"{time_used_seconds // 3600:02d}:{(time_used_seconds % 3600) // 60:02d}:{time_used_seconds % 60:02d}"

    all_violations = submission.violations or (session_doc.get("violations", []) if session_doc else [])

    submission_doc = {
        "exam_id": str(exam_obj_id),
        "exam_title": exam.get("title", "DSA Midterm Assessment") if exam else "DSA Midterm Assessment",
        "subject": exam.get("subject", "Data Structures & Algorithms") if exam else "Data Structures & Algorithms",
        "student_id": student_id,
        "student_name": student_name,
        "student_email": student_email,
        "roll_no": roll_no,
        "score": percentage_score,
        "earned_marks": earned_marks,
        "total_marks": total_score,
        "passing_marks": passing_marks,
        "status": pass_status,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "skipped_count": skipped_count,
        "total_questions": len(questions),
        "time_used": time_used_str,
        "start_time": start_time.isoformat() if hasattr(start_time, "isoformat") else str(start_time),
        "submitted_at": now,
        "violations": all_violations,
        "total_violations": len(all_violations),
        "risk_level": submission.risk_level
    }

    result = submissions_collection.insert_one(submission_doc)

    return {
        "message": "Exam submitted successfully",
        "submission_id": str(result.inserted_id),
        "score": percentage_score,
        "earned_marks": earned_marks,
        "total_marks": total_score,
        "passing_marks": passing_marks,
        "status": pass_status,
        "correct": correct_count,
        "incorrect": incorrect_count,
        "skipped": skipped_count,
        "total": len(questions),
        "time_used": time_used_str,
        "risk_level": submission.risk_level
    }


@router.get("/my")
def get_my_submissions(
    current_user=Depends(get_current_user)
):
    student_id = str(current_user.get("sub", ""))
    submissions = list(submissions_collection.find({"student_id": student_id}).sort("submitted_at", -1))
    result = []
    for s in submissions:
        result.append({
            "id": str(s["_id"]),
            "exam_id": str(s.get("exam_id", "")),
            "exam_title": s.get("exam_title", "Exam"),
            "subject": s.get("subject", "General"),
            "score": s.get("score", 0),
            "earned_marks": s.get("earned_marks", 0),
            "total_marks": s.get("total_marks", 100),
            "passing_marks": s.get("passing_marks", 50),
            "status": s.get("status", "PASSED"),
            "correct_count": s.get("correct_count", 0),
            "incorrect_count": s.get("incorrect_count", 0),
            "skipped_count": s.get("skipped_count", 0),
            "total_questions": s.get("total_questions", 0),
            "time_used": s.get("time_used", "00:20:00"),
            "start_time": s.get("start_time", ""),
            "total_violations": s.get("total_violations", len(s.get("violations", []))),
            "risk_level": s.get("risk_level", "Low"),
            "submitted_at": s.get("submitted_at").isoformat() if s.get("submitted_at") and hasattr(s.get("submitted_at"), "isoformat") else str(s.get("submitted_at", ""))
        })
    return {
        "count": len(result),
        "submissions": result
    }


@router.get("/all")
def get_all_submissions(
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    submissions = list(submissions_collection.find().sort("submitted_at", -1))
    result = []
    for s in submissions:
        result.append({
            "id": str(s["_id"]),
            "exam_id": str(s.get("exam_id", "")),
            "exam_title": s.get("exam_title", "Exam"),
            "subject": s.get("subject", "General"),
            "student_id": s.get("student_id", ""),
            "student_name": s.get("student_name", "Student"),
            "student_email": s.get("student_email", ""),
            "roll_no": s.get("roll_no", ""),
            "score": s.get("score", 0),
            "earned_marks": s.get("earned_marks", 0),
            "total_marks": s.get("total_marks", 100),
            "status": s.get("status", "PASSED"),
            "correct_count": s.get("correct_count", 0),
            "incorrect_count": s.get("incorrect_count", 0),
            "skipped_count": s.get("skipped_count", 0),
            "time_used": s.get("time_used", "00:15:00"),
            "total_violations": s.get("total_violations", len(s.get("violations", []))),
            "risk_level": s.get("risk_level", "Low"),
            "submitted_at": s.get("submitted_at").isoformat() if s.get("submitted_at") and hasattr(s.get("submitted_at"), "isoformat") else str(s.get("submitted_at", ""))
        })
    return {
        "count": len(result),
        "submissions": result
    }


@router.get("/exam/{exam_id}")
def get_submissions_for_exam_review(
    exam_id: str,
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    query = {"$or": [{"exam_id": exam_id}, {"exam_id": str(exam_id)}]}
    if ObjectId.is_valid(exam_id):
        query["$or"].append({"exam_id": ObjectId(exam_id)})

    submissions = list(submissions_collection.find(query).sort("submitted_at", -1))
    result = []
    for s in submissions:
        violations_timeline = []
        for v in s.get("violations", []):
            violations_timeline.append({
                "type": v.get("type") or v.get("description", "Security Alert"),
                "description": v.get("description") or v.get("type", "Security Event"),
                "timestamp": v.get("timestamp") or v.get("at") or "Logged during exam"
            })

        result.append({
            "id": str(s["_id"]),
            "student_id": s.get("student_id", ""),
            "student_name": s.get("student_name", "Student"),
            "student_email": s.get("student_email", ""),
            "roll_no": s.get("roll_no", ""),
            "score": s.get("score", 0),
            "earned_marks": s.get("earned_marks", 0),
            "total_marks": s.get("total_marks", 100),
            "passing_marks": s.get("passing_marks", 50),
            "status": s.get("status", "PASSED"),
            "correct_count": s.get("correct_count", 0),
            "incorrect_count": s.get("incorrect_count", 0),
            "skipped_count": s.get("skipped_count", 0),
            "time_used": s.get("time_used", "00:15:00"),
            "start_time": s.get("start_time", ""),
            "submitted_at": s.get("submitted_at").isoformat() if s.get("submitted_at") and hasattr(s.get("submitted_at"), "isoformat") else str(s.get("submitted_at", "")),
            "total_violations": s.get("total_violations", len(violations_timeline)),
            "risk_level": s.get("risk_level", "Low"),
            "violations_timeline": violations_timeline
        })

    return {
        "exam_id": exam_id,
        "count": len(result),
        "submissions": result
    }
