from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.application import ApplicationStatus
from app.schemas.user import UserResponse
from app.schemas.job import JobResponse
from app.schemas.resume import ResumeResponse

class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: int
    cover_note: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    recruiter_notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    user_id: int
    resume_id: int
    status: ApplicationStatus
    match_score: float
    skill_score: float
    keyword_score: float
    experience_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    recommendations: List[str] = []
    cover_note: Optional[str] = None
    recruiter_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    job: Optional[JobResponse] = None
    applicant: Optional[UserResponse] = None
    resume: Optional[ResumeResponse] = None

    class Config:
        from_attributes = True
