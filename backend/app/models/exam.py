from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ExamCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    subject: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

    duration_minutes: int = Field(
        ...,
        ge=1,
        le=600
    )

    total_marks: int = Field(
        ...,
        ge=1
    )

    passing_marks: int = Field(
        ...,
        ge=0
    )

    total_questions: int = Field(
        ...,
        ge=1
    )

    start_time: datetime
    end_time: datetime
    randomize_questions: Optional[bool] = False
    randomize_options: Optional[bool] = False


class ExamResponse(BaseModel):
    id: str
    title: str
    subject: str
    description: Optional[str] = None
    duration_minutes: int
    total_marks: int
    passing_marks: int
    total_questions: int
    start_time: datetime
    end_time: datetime
    status: str
    randomize_questions: Optional[bool] = False
    randomize_options: Optional[bool] = False