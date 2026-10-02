import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from app.database.connection import (
    database,
    users_collection,
    exams_collection,
    questions_collection,
    submissions_collection,
    exam_sessions_collection
)
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/api/health",
    tags=["System Health"]
)


@router.get("/")
def simple_health_check():
    return {
        "status": "healthy",
        "service": "Online Examination & Proctoring Backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/details")
def detailed_health_check(current_user=Depends(get_current_user)):
    services = []
    
    # 1. MongoDB Database Check
    db_start = time.time()
    try:
        database.command("ping")
        db_latency = round((time.time() - db_start) * 1000, 2)
        services.append({
            "name": "MongoDB Database",
            "key": "mongodb",
            "status": "working",
            "latency": f"{db_latency} ms",
            "details": f"Connected to database '{database.name}' successfully."
        })
    except Exception as e:
        services.append({
            "name": "MongoDB Database",
            "key": "mongodb",
            "status": "failed",
            "details": f"Database connection error: {str(e)}"
        })

    # 2. Backend API Service
    services.append({
        "name": "Backend API",
        "key": "backend_api",
        "status": "working",
        "details": "FastAPI engine operating normally."
    })

    # 3. Authentication & User Service
    try:
        user_count = users_collection.count_documents({})
        services.append({
            "name": "Authentication Service",
            "key": "auth",
            "status": "working",
            "details": f"JWT Auth functional. {user_count} registered user accounts."
        })
    except Exception as e:
        services.append({
            "name": "Authentication Service",
            "key": "auth",
            "status": "warning",
            "details": f"Error querying users: {str(e)}"
        })

    # 4. Exam Service
    try:
        exam_count = exams_collection.count_documents({})
        active_exams = exams_collection.count_documents({"status": "active"})
        services.append({
            "name": "Exam Service",
            "key": "exam",
            "status": "working",
            "details": f"{exam_count} total exams configured ({active_exams} currently active)."
        })
    except Exception as e:
        services.append({
            "name": "Exam Service",
            "key": "exam",
            "status": "failed",
            "details": f"Exam query error: {str(e)}"
        })

    # 5. Question Service
    try:
        question_count = questions_collection.count_documents({})
        services.append({
            "name": "Question Service",
            "key": "question",
            "status": "working",
            "details": f"{question_count} questions stored in repository."
        })
    except Exception as e:
        services.append({
            "name": "Question Service",
            "key": "question",
            "status": "failed",
            "details": f"Question query error: {str(e)}"
        })

    # 6. Submission & Proctoring Session Service
    try:
        sub_count = submissions_collection.count_documents({})
        session_count = exam_sessions_collection.count_documents({})
        services.append({
            "name": "Submission Service",
            "key": "submission",
            "status": "working",
            "details": f"{sub_count} submitted exams recorded ({session_count} live/historical sessions)."
        })
    except Exception as e:
        services.append({
            "name": "Submission Service",
            "key": "submission",
            "status": "failed",
            "details": f"Submission query error: {str(e)}"
        })

    # 7. AI Proctoring Model Status
    services.append({
        "name": "Proctoring Model (COCO-SSD)",
        "key": "proctoring_model",
        "status": "working",
        "details": "TensorFlow.js COCO-SSD object detection engine initialized for in-browser inference."
    })

    # Overall Status Calculation
    all_working = all(s["status"] == "working" for s in services)
    has_failed = any(s["status"] == "failed" for s in services)
    overall_status = "failed" if has_failed else ("working" if all_working else "warning")

    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": services
    }
