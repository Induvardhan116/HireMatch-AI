from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class ResumeBase(BaseModel):
    filename: str
    file_type: str
    file_size: int

class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    is_primary: bool
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    summary: Optional[str] = None
    extracted_experience_years: float
    skills: List[str] = []
    categorized_skills: Dict[str, List[str]] = {}
    education: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    keywords: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResumeSkillsUpdateRequest(BaseModel):
    skills: List[str]
    categorized_skills: Optional[Dict[str, List[str]]] = None

class ResumeDetailResponse(ResumeResponse):
    extracted_text: str

class ResumeAnalysisRequest(BaseModel):
    resume_id: Optional[int] = None
    custom_resume_text: Optional[str] = None
    job_id: Optional[int] = None
    custom_job_description: Optional[str] = None
    custom_job_title: Optional[str] = None

