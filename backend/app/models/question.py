from typing import List

from pydantic import BaseModel, Field


class QuestionCreate(BaseModel):
    exam_id: str
    question_text: str = Field(
        ...,
        min_length=1
    )
    options: List[str] = Field(
        ...,
        min_length=2
    )
    correct_option: int = Field(
        ...,
        ge=0
    )
    marks: int = Field(
        ...,
        ge=1
    )
    difficulty: str = "medium"
    category: str = "general"