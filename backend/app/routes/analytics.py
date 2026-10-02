import csv
import io
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response

from app.database.connection import (
    users_collection,
    exams_collection,
    submissions_collection,
    exam_sessions_collection
)
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics & Export"]
)


def verify_admin_user(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrative privileges required."
        )


@router.get("/dashboard")
def get_admin_analytics_dashboard(
    exam_id: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    # 1. Base MongoDB Counts
    total_registered_students = users_collection.count_documents({"role": {"$ne": "admin"}})
    total_exams = exams_collection.count_documents({})

    all_exams = list(exams_collection.find())
    now = datetime.now(timezone.utc)

    scheduled_exams = 0
    active_exams = 0
    completed_exams = 0

    for ex in all_exams:
        st = ex.get("start_time")
        et = ex.get("end_time")
        status = ex.get("status", "")

        if isinstance(st, str):
            try:
                st = datetime.fromisoformat(st.replace("Z", "+00:00"))
            except Exception:
                st = None
        if isinstance(et, str):
            try:
                et = datetime.fromisoformat(et.replace("Z", "+00:00"))
            except Exception:
                et = None

        if status == "completed" or (et and et < now):
            completed_exams += 1
        elif status == "active" or (st and et and st <= now <= et):
            active_exams += 1
        else:
            scheduled_exams += 1

    # Filtered submissions query
    sub_query = {}
    if exam_id and exam_id != "all":
        sub_query["exam_id"] = exam_id
    if student_id:
        sub_query["student_id"] = student_id

    submissions = list(submissions_collection.find(sub_query))

    total_submissions = len(submissions)
    total_score_sum = 0
    passed_count = 0
    total_violations = 0
    high_risk_count = 0

    score_buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    violation_type_counts = {}
    risk_distribution = {"Low": 0, "Moderate": 0, "High": 0}

    for sub in submissions:
        score = float(sub.get("score", 0))
        total_score_sum += score

        if score <= 20:
            score_buckets["0-20"] += 1
        elif score <= 40:
            score_buckets["21-40"] += 1
        elif score <= 60:
            score_buckets["41-60"] += 1
        elif score <= 80:
            score_buckets["61-80"] += 1
        else:
            score_buckets["81-100"] += 1

        total_marks = float(sub.get("total_marks", 100))
        passing_marks = float(sub.get("passing_marks", total_marks / 2))
        
        if score >= passing_marks:
            passed_count += 1

        v_count = int(sub.get("total_violations", len(sub.get("violations", []))))
        total_violations += v_count

        risk = sub.get("risk_level", "Low")
        if risk not in risk_distribution:
            risk_distribution[risk] = 0
        risk_distribution[risk] += 1

        if risk == "High" or v_count >= 3:
            high_risk_count += 1

        for v in sub.get("violations", []):
            v_type = v.get("type") or v.get("description", "Security Violation")
            if "phone" in str(v_type).lower():
                v_name = "Mobile Phone Detected"
            elif "multiple" in str(v_type).lower() or "face" in str(v_type).lower():
                v_name = "Multiple Persons Detected"
            elif "tab" in str(v_type).lower() or "window" in str(v_type).lower():
                v_name = "Tab Switch / Window Blur"
            else:
                v_name = str(v_type)

            violation_type_counts[v_name] = violation_type_counts.get(v_name, 0) + 1

    # Exam participation breakdown
    exam_participation = []
    for ex in all_exams[:10]:
        ex_id_str = str(ex["_id"])
        if subject and ex.get("subject") != subject:
            continue

        ex_subs = [s for s in submissions if s.get("exam_id") == ex_id_str]
        avg_s = round(sum(float(s.get("score", 0)) for s in ex_subs) / len(ex_subs), 1) if ex_subs else 0

        exam_participation.append({
            "exam_id": ex_id_str,
            "title": ex.get("title", "Exam"),
            "subject": ex.get("subject", "General"),
            "participants": len(ex_subs),
            "avg_score": avg_s
        })

    average_score = round(total_score_sum / total_submissions, 1) if total_submissions > 0 else 0.0
    pass_percentage = round((passed_count / total_submissions) * 100, 1) if total_submissions > 0 else 0.0

    return {
        "metrics": {
            "total_registered_students": total_registered_students,
            "total_exams": total_exams,
            "scheduled_exams": scheduled_exams,
            "active_exams": active_exams,
            "completed_exams": completed_exams,
            "total_submissions": total_submissions,
            "average_score": average_score,
            "pass_percentage": pass_percentage,
            "total_violations": total_violations,
            "students_requiring_review": high_risk_count
        },
        "visualizations": {
            "score_distribution": score_buckets,
            "exam_participation": exam_participation,
            "violation_types": violation_type_counts,
            "risk_distribution": risk_distribution,
            "exam_status_counts": {
                "Scheduled": scheduled_exams,
                "Active": active_exams,
                "Completed": completed_exams
            }
        }
    }


@router.get("/export")
def export_exam_results(
    exam_id: Optional[str] = Query(None),
    format: str = Query("csv", pattern="^(csv|excel|pdf)$"),
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    query = {}
    if exam_id and exam_id != "all":
        query["exam_id"] = exam_id

    submissions = list(submissions_collection.find(query))

    rows = []
    for sub in submissions:
        student_name = sub.get("student_name", "Student")
        student_email = sub.get("student_email", "")
        roll_no = sub.get("student_id", "")
        
        exam_title = sub.get("exam_title", "")
        subject = sub.get("subject", "")

        if not student_name or student_name == "Student":
            u_doc = users_collection.find_one({"_id": sub.get("student_id")})
            if not u_doc and ObjectId.is_valid(sub.get("student_id")):
                u_doc = users_collection.find_one({"_id": ObjectId(sub.get("student_id"))})
            if u_doc:
                student_name = u_doc.get("name", student_name)
                student_email = u_doc.get("email", student_email)
                roll_no = u_doc.get("student_id", roll_no)

        if not exam_title and sub.get("exam_id") and ObjectId.is_valid(sub.get("exam_id")):
            e_doc = exams_collection.find_one({"_id": ObjectId(sub.get("exam_id"))})
            if e_doc:
                exam_title = e_doc.get("title", "")
                subject = e_doc.get("subject", "")

        score = float(sub.get("score", 0))
        total_marks = float(sub.get("total_marks", 100))
        pct = round((score / total_marks) * 100, 1) if total_marks > 0 else score
        status = "PASSED" if score >= (total_marks / 2) else "FAILED"

        rows.append({
            "Student ID": roll_no or sub.get("student_id", "N/A"),
            "Student Name": student_name,
            "Email": student_email,
            "Exam Name": exam_title or "Examination",
            "Subject": subject or "General",
            "Score": score,
            "Total Marks": total_marks,
            "Percentage (%)": pct,
            "Correct Answers": sub.get("correct", 0),
            "Incorrect Answers": sub.get("incorrect", 0),
            "Skipped Questions": sub.get("skipped", 0),
            "Violations Count": sub.get("total_violations", len(sub.get("violations", []))),
            "Risk Level": sub.get("risk_level", "Low"),
            "Start Time": sub.get("start_time", ""),
            "Submission Time": sub.get("submission_time") or sub.get("created_at", ""),
            "Status": status
        })

    filename = f"Exam_Results_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if format == "csv":
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        else:
            output.write("No submission data available for export.\n")

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )

    elif format in ["excel", "pdf"]:
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        else:
            output.write("No submission data available.\n")
        output.seek(0)

        ext = "csv" if format == "csv" else ("xlsx" if format == "excel" else "pdf")
        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "excel" else "application/pdf"
        
        return Response(
            content=output.getvalue().encode("utf-8"),
            media_type=mime,
            headers={"Content-Disposition": f"attachment; filename={filename}.{ext}"}
        )
