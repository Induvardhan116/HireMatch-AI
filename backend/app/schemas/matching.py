from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class KeywordMatchItem(BaseModel):
    keyword: str
    in_resume: bool
    frequency_in_resume: int = 0
    importance: str = "medium" # high, medium, low

class ScoreBreakdown(BaseModel):
    overall_score: float # 0 - 100
    skill_score: float # 0 - 100 (weight 50%)
    keyword_score: float # 0 - 100 (weight 30%)
    experience_score: float # 0 - 100 (weight 20%)
    weights: Dict[str, float] = {
        "skills": 0.50,
        "keywords": 0.30,
        "experience": 0.20
    }
    scoring_formula: str = "Overall Score = (Skill Score * 0.50) + (Keyword Score * 0.30) + (Experience Score * 0.20)"
    explanation: str

class MatchAnalysisResult(BaseModel):
    match_score: float
    breakdown: ScoreBreakdown
    matched_skills: List[str]
    missing_skills: List[str]
    job_required_skills: List[str]
    resume_skills: List[str]
    keyword_analysis: List[KeywordMatchItem]
    experience_details: Dict[str, Any]
    recommendations: List[str]
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    candidate_name: Optional[str] = None
