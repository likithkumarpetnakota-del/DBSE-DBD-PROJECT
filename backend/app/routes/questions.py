from bson import ObjectId
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.database.connection import (
    questions_collection,
    exams_collection
)
from app.models.question import QuestionCreate
import random
from app.routes.auth import get_current_user
from app.utils.question_parser import parse_question_file


router = APIRouter(
    prefix="/api/questions",
    tags=["Questions"]
)


def verify_admin_user(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Administrative privileges required."
        )


class QuestionsBatchImport(BaseModel):
    exam_id: str
    questions: List[Dict[str, Any]]


# ============================================================
# CREATE QUESTION (ADMIN ONLY)
# ============================================================

@router.post("/")
def create_question(
    question: QuestionCreate,
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    if not ObjectId.is_valid(question.exam_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid exam ID"
        )

    exam = exams_collection.find_one({"_id": ObjectId(question.exam_id)})
    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found"
        )

    if question.correct_option >= len(question.options):
        raise HTTPException(
            status_code=400,
            detail="Correct option index is invalid"
        )

    question_document = {
        "exam_id": ObjectId(question.exam_id),
        "question_text": question.question_text,
        "options": question.options,
        "correct_option": question.correct_option,
        "marks": question.marks,
        "difficulty": question.difficulty,
        "category": question.category,
        "created_by": str(current_user.get("sub", ""))
    }

    result = questions_collection.insert_one(question_document)

    exams_collection.update_one(
        {"_id": ObjectId(question.exam_id)},
        {"$inc": {"total_questions": 1}}
    )

    return {
        "message": "Question created successfully",
        "question_id": str(result.inserted_id)
    }


# ============================================================
# PREVIEW QUESTION FILE IMPORT (ADMIN ONLY)
# ============================================================

@router.post("/import/preview")
async def preview_question_import(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 5 MB")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        extracted = parse_question_file(file_bytes, file.filename)
        return {
            "filename": file.filename,
            "count": len(extracted),
            "questions": extracted
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse question file: {str(e)}")


# ============================================================
# COMMIT REVIEWED QUESTION IMPORT TO MONGODB (ADMIN ONLY)
# ============================================================

@router.post("/import")
def commit_question_import(
    body: QuestionsBatchImport,
    current_user=Depends(get_current_user)
):
    verify_admin_user(current_user)

    if not ObjectId.is_valid(body.exam_id):
        raise HTTPException(status_code=400, detail="Invalid exam ID")

    exam = exams_collection.find_one({"_id": ObjectId(body.exam_id)})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if not body.questions or len(body.questions) == 0:
        raise HTTPException(status_code=400, detail="No questions provided for import")

    inserted_count = 0
    total_marks_added = 0

    for q in body.questions:
        q_text = str(q.get("question_text", "")).strip()
        options = q.get("options", [])
        if not q_text or not isinstance(options, list) or len(options) < 2:
            continue

        correct_opt = int(q.get("correct_option", 0))
        if correct_opt >= len(options):
            correct_opt = 0

        q_marks = int(q.get("marks", 1))

        doc = {
            "exam_id": ObjectId(body.exam_id),
            "question_text": q_text,
            "options": options,
            "correct_option": correct_opt,
            "marks": q_marks,
            "difficulty": q.get("difficulty", "Medium"),
            "category": q.get("category", exam.get("subject", "General")),
            "created_by": str(current_user.get("sub", ""))
        }
        questions_collection.insert_one(doc)
        inserted_count += 1
        total_marks_added += q_marks

    exams_collection.update_one(
        {"_id": ObjectId(body.exam_id)},
        {"$inc": {"total_questions": inserted_count, "total_marks": total_marks_added}}
    )

    return {
        "message": f"Successfully imported {inserted_count} questions",
        "imported_count": inserted_count
    }


# ============================================================
# GET QUESTIONS FOR AN EXAM (WITH RANDOMIZATION & HIDDEN ANSWERS)
# ============================================================

@router.get("/exam/{exam_id}")
def get_exam_questions(
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
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = list(questions_collection.find({"exam_id": ObjectId(exam_id)}))
    is_admin = current_user.get("role") == "admin"

    randomize_q = bool(exam.get("randomize_questions", False))
    randomize_opt = bool(exam.get("randomize_options", False))

    user_seed = hash(f"{current_user.get('sub', '')}_{exam_id}")

    if randomize_q and not is_admin:
        rng = random.Random(user_seed)
        rng.shuffle(questions)

    result = []

    for question in questions:
        q_id_str = str(question["_id"])
        opts = list(question.get("options", []))
        correct_idx = question.get("correct_option", 0)

        # Handle option randomization per student
        if randomize_opt and not is_admin and len(opts) > 1:
            q_seed = hash(f"{user_seed}_{q_id_str}")
            rng = random.Random(q_seed)
            indexed_opts = list(enumerate(opts))
            rng.shuffle(indexed_opts)
            
            opts = [item[1] for item in indexed_opts]

        item = {
            "id": q_id_str,
            "exam_id": str(question["exam_id"]),
            "question_text": question["question_text"],
            "options": opts,
            "marks": question.get("marks", 1),
            "difficulty": question.get("difficulty", "Medium"),
            "category": question.get("category", "General")
        }

        # IMPORTANT: correct_option is exposed ONLY to admins for editing
        if is_admin:
            item["correct_option"] = correct_idx

        result.append(item)

    return {
        "count": len(result),
        "questions": result
    }