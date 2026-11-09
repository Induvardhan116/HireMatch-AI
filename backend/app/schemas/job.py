from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.user import UserResponse

class JobBase(BaseModel):
    title: str
    company: str
    department: Optional[str] = None
    location: str
    job_type: str = "Full-time"
    experience_level: str = "Mid-Level"
    min_experience_years: float = 0.0
    salary_range: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    required_skills: List[str] = []
    nice_to_have_skills: List[str] = []

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    min_experience_years: Optional[float] = None
    salary_range: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    required_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    is_active: Optional[bool] = None

class JobResponse(JobBase):
    id: int
    recruiter_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    recruiter: Optional[UserResponse] = None
    applications_count: Optional[int] = 0

    class Config:
        from_attributes = True

