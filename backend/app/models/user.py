from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    student_id: str = Field(..., min_length=2, max_length=50)
    department: str
    year: int = Field(..., ge=1, le=6)