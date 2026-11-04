from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class ResumeScreeningReportItem(BaseModel):
    application_id: int
    candidate_id: int
    candidate_name: str
    candidate_email: str
    job_id: int
    job_title: str
    company: str
    match_score: float
    skill_score: float
    keyword_score: float
    experience_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    status: str
    applied_at: datetime
    recommendations: List[str]

class SkillDistributionItem(BaseModel):
    skill: str
    candidate_count: int
    percentage: float

class CandidateSkillAnalysisReport(BaseModel):
    total_candidates: int
    total_unique_skills: int
    top_candidate_skills: List[SkillDistributionItem]
    top_in_demand_job_skills: List[SkillDistributionItem]
    common_skill_gaps: List[SkillDistributionItem]

class JobApplicationReportItem(BaseModel):
    application_id: int
    job_id: int
    job_title: str
    company: str
    department: Optional[str]
    candidate_name: str
    candidate_email: str
    status: str
    match_score: float
    applied_at: datetime
    last_updated: datetime

class RecruitmentSummaryReport(BaseModel):
    total_jobs: int
    active_jobs: int
    total_applications: int
    total_candidates: int
    shortlisted_candidates: int
    rejected_candidates: int
    selected_candidates: int
    under_review_candidates: int
    applied_candidates: int
    average_match_score: float
    applications_by_status: Dict[str, int]
    top_hiring_roles: List[Dict[str, Any]]
