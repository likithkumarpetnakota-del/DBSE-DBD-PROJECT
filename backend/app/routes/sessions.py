from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database.connection import (
    exam_sessions_collection,
    exams_collection,
    users_collection
)
from app.routes.auth import get_current_user


router = APIRouter(
    prefix="/api/exam-sessions",
    tags=["Exam Sessions"]
)


class SessionStart(BaseModel):
    exam_id: str


class SessionHeartbeat(BaseModel):
    status: Optional[str] = "In Progress"
    violation_count: int = 0
    risk_level: str = "Low"
    violations: List[Dict[str, Any]] = []


class SessionViolation(BaseModel):
    violation: Optional[Dict[str, Any]] = None
    type: Optional[str] = None
    description: Optional[str] = None
    violation_count: int = 0
    risk_level: str = "Low"


from app.routes.notifications import create_notification


class SessionAnswers(BaseModel):
    answers: Dict[str, Any]
    current_index: Optional[int] = 0


@router.post("/start")
def start_exam_session(
    body: SessionStart,
    current_user=Depends(get_current_user)
):
    student_id = str(current_user.get("sub", "student_user"))

    user_doc = None
    if ObjectId.is_valid(student_id):
        user_doc = users_collection.find_one({"_id": ObjectId(student_id)})
    if not user_doc:
        user_doc = users_collection.find_one({"_id": student_id})

    student_name = user_doc.get("name", "Student") if user_doc else current_user.get("name", "Student")
    student_email = user_doc.get("email", "") if user_doc else current_user.get("email", "student@exam.com")
    roll_no = user_doc.get("student_id", "") if user_doc else ""

    exam_title = "Online Examination"
    duration_mins = 30
    if ObjectId.is_valid(body.exam_id):
        exam = exams_collection.find_one({"_id": ObjectId(body.exam_id)})
        if exam:
            exam_title = exam.get("title", exam_title)
            duration_mins = int(exam.get("duration_minutes", 30))

    now = datetime.now(timezone.utc)

    existing = exam_sessions_collection.find_one({
        "$or": [
            {"exam_id": body.exam_id, "student_id": student_id},
            {"exam_id": str(body.exam_id), "student_id": student_id}
        ]
    })

    if existing:
        current_status = existing.get("status", "Joined")
        if current_status == "Submitted":
            new_status = "Submitted"
        elif current_status == "Locked":
            new_status = "Locked"
        else:
            new_status = "In Progress"

        exam_sessions_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "status": new_status,
                "last_ping": now,
                "updated_at": now
            }}
        )
        return {
            "session_id": str(existing["_id"]),
            "status": new_status,
            "entry_time": existing.get("entry_time", now).isoformat() if hasattr(existing.get("entry_time"), "isoformat") else str(existing.get("entry_time")),
            "answers": existing.get("answers", {}),
            "current_index": existing.get("current_index", 0)
        }
    else:
        new_doc = {
            "exam_id": body.exam_id,
            "student_id": student_id,
            "student_name": student_name,
            "student_email": student_email,
            "roll_no": roll_no,
            "exam_title": exam_title,
            "duration_minutes": duration_mins,
            "entry_time": now,
            "start_time": now,
            "last_ping": now,
            "status": "In Progress",
            "answers": {},
            "current_index": 0,
            "violation_count": 0,
            "violations": [],
            "risk_level": "Low",
            "created_at": now,
            "updated_at": now
        }
        res = exam_sessions_collection.insert_one(new_doc)
        
        # Trigger real admin notification
        create_notification(
            title="Student Joined Exam",
            message=f"{student_name} ({student_email}) has entered exam '{exam_title}'.",
            type_name="joined",
            recipient_role="admin",
            link="/admin/exams"
        )

        return {
            "session_id": str(res.inserted_id),
            "status": "In Progress",
            "entry_time": now.isoformat(),
            "answers": {},
            "current_index": 0
        }


@router.post("/{session_id}/answers")
def auto_save_session_answers(
    session_id: str,
    body: SessionAnswers,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = exam_sessions_collection.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    student_id = str(current_user.get("sub", ""))
    if session.get("student_id") and str(session.get("student_id")) != student_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify another student's session.")

    now = datetime.now(timezone.utc)
    exam_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "answers": body.answers,
            "current_index": body.current_index or 0,
            "last_ping": now,
            "updated_at": now
        }}
    )
    return {"ok": True, "saved_count": len(body.answers)}


@router.post("/{session_id}/heartbeat")
def heartbeat_exam_session(
    session_id: str,
    body: SessionHeartbeat,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = exam_sessions_collection.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    now = datetime.now(timezone.utc)
    current_status = session.get("status", "In Progress")

    if current_status not in ["Submitted", "Locked"]:
        if body.violation_count >= 5:
            new_status = "Locked"
            create_notification(
                title="Session Auto-Locked",
                message=f"Student {session.get('student_name', 'Student')} reached maximum 5 security violations and was locked.",
                type_name="locked",
                recipient_role="admin"
            )
        else:
            new_status = body.status or "In Progress"
    else:
        new_status = current_status

    exam_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "last_ping": now,
            "status": new_status,
            "violation_count": body.violation_count,
            "risk_level": body.risk_level,
            "violations": body.violations,
            "updated_at": now
        }}
    )
    return {"status": new_status, "ok": True}


@router.post("/{session_id}/violation")
def record_session_violation(
    session_id: str,
    body: SessionViolation,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = exam_sessions_collection.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    now = datetime.now(timezone.utc)
    v_count = body.violation_count
    new_status = session.get("status", "In Progress")
    if v_count >= 5:
        new_status = "Locked"

    violation_entry = body.violation
    if not violation_entry:
        violation_entry = {
            "type": body.type or "violation",
            "description": body.description or "Security violation",
            "timestamp": now.isoformat()
        }

    exam_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {"violations": violation_entry},
            "$set": {
                "violation_count": v_count,
                "risk_level": body.risk_level,
                "status": new_status,
                "last_ping": now,
                "updated_at": now
            }
        }
    )
    return {"status": new_status, "violation_count": v_count}


@router.post("/{session_id}/submit")
def submit_exam_session(
    session_id: str,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session = exam_sessions_collection.find_one({"_id": ObjectId(session_id)})
    now = datetime.now(timezone.utc)
    exam_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "status": "Submitted",
            "submission_time": now,
            "last_ping": now,
            "updated_at": now
        }}
    )

    if session:
        create_notification(
            title="Exam Submitted",
            message=f"Student {session.get('student_name', 'Student')} submitted exam '{session.get('exam_title', 'Exam')}'.",
            type_name="submitted",
            recipient_role="admin",
            link="/admin/review"
        )

    return {"status": "Submitted", "ok": True}


@router.get("/exam/{exam_id}")
def get_exam_live_sessions(
    exam_id: str,
    current_user=Depends(get_current_user)
):
    query = {"$or": [{"exam_id": exam_id}, {"exam_id": str(exam_id)}]}
    if ObjectId.is_valid(exam_id):
        query["$or"].append({"exam_id": ObjectId(exam_id)})

    sessions = list(exam_sessions_collection.find(query))
    now = datetime.now(timezone.utc)
    disconnect_threshold = timedelta(seconds=35)

    participants = []
    writing_cnt = 0
    submitted_cnt = 0
    locked_cnt = 0
    disconnected_cnt = 0
    joined_cnt = len(sessions)

    for s in sessions:
        last_ping = s.get("last_ping")
        status = s.get("status", "Joined")

        if status in ["In Progress", "Joined"] and last_ping:
            if isinstance(last_ping, datetime):
                if last_ping.tzinfo is None:
                    last_ping = last_ping.replace(tzinfo=timezone.utc)
                if now - last_ping > disconnect_threshold:
                    status = "Disconnected"

        if status == "In Progress":
            writing_cnt += 1
        elif status == "Submitted":
            submitted_cnt += 1
        elif status == "Locked":
            locked_cnt += 1
        elif status == "Disconnected":
            disconnected_cnt += 1

        participants.append({
            "session_id": str(s["_id"]),
            "student_id": str(s.get("student_id", "")),
            "student_name": s.get("student_name", "Student"),
            "student_email": s.get("student_email", ""),
            "roll_no": s.get("roll_no", ""),
            "status": status,
            "entry_time": s.get("entry_time").isoformat() if hasattr(s.get("entry_time"), "isoformat") else str(s.get("entry_time")),
            "submission_time": s.get("submission_time").isoformat() if hasattr(s.get("submission_time"), "isoformat") else str(s.get("submission_time", "")) if s.get("submission_time") else None,
            "violation_count": s.get("violation_count", 0),
            "violations": s.get("violations", []),
            "risk_level": s.get("risk_level", "Low"),
            "last_ping": s.get("last_ping").isoformat() if hasattr(s.get("last_ping"), "isoformat") else str(s.get("last_ping", ""))
        })

    return {
        "exam_id": exam_id,
        "total_joined": joined_cnt,
        "writing": writing_cnt,
        "in_progress": writing_cnt,
        "submitted": submitted_cnt,
        "locked": locked_cnt,
        "disconnected": disconnected_cnt,
        "participants": participants,
        "sessions": participants
    }


@router.get("/my/{exam_id}")
def get_my_exam_session(
    exam_id: str,
    current_user=Depends(get_current_user)
):
    student_id = str(current_user.get("sub", ""))
    session = exam_sessions_collection.find_one({
        "$or": [
            {"exam_id": exam_id, "student_id": student_id},
            {"exam_id": str(exam_id), "student_id": student_id}
        ]
    })
    if not session:
        return {"session": None}

    now = datetime.now(timezone.utc)
    st = session.get("start_time") or session.get("entry_time") or now
    if isinstance(st, datetime) and st.tzinfo is None:
        st = st.replace(tzinfo=timezone.utc)
    elif isinstance(st, str):
        try:
            st = datetime.fromisoformat(st.replace("Z", "+00:00"))
        except Exception:
            st = now

    duration_mins = int(session.get("duration_minutes", 30))
    elapsed_seconds = int((now - st).total_seconds()) if isinstance(st, datetime) else 0
    total_seconds = duration_mins * 60
    remaining_seconds = max(0, total_seconds - elapsed_seconds)

    return {
        "session": {
            "session_id": str(session["_id"]),
            "status": session.get("status"),
            "entry_time": st.isoformat() if hasattr(st, "isoformat") else str(st),
            "remaining_seconds": remaining_seconds,
            "duration_minutes": duration_mins,
            "answers": session.get("answers", {}),
            "current_index": session.get("current_index", 0),
            "violation_count": session.get("violation_count", 0),
            "risk_level": session.get("risk_level", "Low")
        }
    }
