import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.resume import Resume
from app.models.application import Application
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.services.auth_service import get_current_user, require_roles
from app.services.matching_service import matching_engine

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

def job_to_response(job: Job) -> dict:
    return {
        "id": job.id,
        "recruiter_id": job.recruiter_id,
        "title": job.title,
        "company": job.company,
        "department": job.department,
        "location": job.location,
        "job_type": job.job_type,
        "experience_level": job.experience_level,
        "min_experience_years": job.min_experience_years,
        "salary_range": job.salary_range,
        "description": job.description,
        "requirements": job.requirements,
        "required_skills": job.skills_list,
        "nice_to_have_skills": job.nice_skills_list,
        "is_active": job.is_active,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "applications_count": len(job.applications) if job.applications else 0
    }

@router.get("/", response_model=List[JobResponse])
def get_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    skill: Optional[str] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if active_only:
        query = query.filter(Job.is_active == True)
        
    if search:
        s = f"%{search}%"
        query = query.filter((Job.title.ilike(s)) | (Job.company.ilike(s)) | (Job.description.ilike(s)))
        
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
        
    if job_type and job_type != "All":
        query = query.filter(Job.job_type == job_type)
        
    if experience_level and experience_level != "All":
        query = query.filter(Job.experience_level == experience_level)
        
    if skill:
        query = query.filter(Job.required_skills.ilike(f"%{skill}%"))
        
    jobs = query.options(joinedload(Job.applications)).order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return [job_to_response(j) for j in jobs]

@router.get("/recommendations/me")
def get_job_recommendations_for_user(
    resume_id: Optional[int] = None,
    search: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    min_match: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ranks active jobs against candidate's resume skills and experience.
    Returns matched jobs with instant match percentage and highlighted skills.
    """
    if resume_id:
        primary_resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        ).first()
    else:
        primary_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()
    
    query = db.query(Job).filter(Job.is_active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Job.title.ilike(s)) | (Job.company.ilike(s)) | (Job.description.ilike(s)))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if experience_level and experience_level != "All":
        query = query.filter(Job.experience_level == experience_level)
        
    active_jobs = query.all()
    recommendations = []
    
    if not primary_resume:
        for job in active_jobs:
            resp = job_to_response(job)
            resp["recommendation_score"] = 0.0
            resp["skill_match_percentage"] = 0.0
            resp["matched_skills"] = []
            resp["missing_skills"] = job.skills_list
            recommendations.append(resp)
        return recommendations
        
    resume_skills = primary_resume.skills_list
    resume_text = primary_resume.extracted_text
    exp_years = primary_resume.extracted_experience_years
    
    for job in active_jobs:
        match_result = matching_engine.evaluate_match(
            resume_text=resume_text,
            resume_skills=resume_skills,
            candidate_years=exp_years,
            job_description=f"{job.title}\n{job.description}\n{job.requirements or ''}",
            job_required_skills=job.skills_list,
            job_nice_skills=job.nice_skills_list,
            job_min_years=job.min_experience_years,
            job_title=job.title,
            job_company=job.company
        )
        
        # Calculate raw skill percentage: matching required / total required * 100
        req_skills_lower = {s.lower().strip() for s in job.skills_list}
        r_skills_lower = {s.lower().strip() for s in resume_skills}
        matched_req = [s for s in job.skills_list if s.lower().strip() in r_skills_lower]
        raw_skill_pct = round((len(matched_req) / max(len(job.skills_list), 1)) * 100.0, 1) if job.skills_list else 100.0

        resp = job_to_response(job)
        resp["recommendation_score"] = match_result["match_score"]
        resp["skill_match_percentage"] = raw_skill_pct
        resp["matched_skills"] = match_result["matched_skills"]
        resp["missing_skills"] = match_result["missing_skills"]
        resp["score_breakdown"] = match_result["breakdown"]
        
        if min_match is None or match_result["match_score"] >= min_match or raw_skill_pct >= min_match:
            recommendations.append(resp)
        
    # Sort recommendations by highest match score
    recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
    return recommendations


@router.get("/my", response_model=List[JobResponse])
def get_my_jobs(
    active_only: Optional[bool] = None,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Returns job postings owned by the authenticated recruiter, or all jobs for admin."""
    query = db.query(Job).options(joinedload(Job.applications))
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Job.recruiter_id == current_user.id)
    if active_only is not None:
        query = query.filter(Job.is_active == active_only)
    jobs = query.order_by(Job.created_at.desc()).all()
    return [job_to_response(j) for j in jobs]


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_response(job)

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    job = Job(
        recruiter_id=current_user.id,
        title=job_in.title,
        company=job_in.company or current_user.company_name or "Company",
        department=job_in.department,
        location=job_in.location,
        job_type=job_in.job_type,
        experience_level=job_in.experience_level,
        min_experience_years=job_in.min_experience_years,
        salary_range=job_in.salary_range,
        description=job_in.description,
        requirements=job_in.requirements,
        required_skills=json.dumps(job_in.required_skills),
        nice_to_have_skills=json.dumps(job_in.nice_to_have_skills),
        is_active=True
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job_to_response(job)

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if current_user.role != UserRole.ADMIN and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this job posting")
        
    update_data = job_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ["required_skills", "nice_to_have_skills"] and isinstance(value, list):
            setattr(job, field, json.dumps(value))
        else:
            setattr(job, field, value)
            
    db.commit()
    db.refresh(job)
    return job_to_response(job)

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if current_user.role != UserRole.ADMIN and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job posting")
        
    db.delete(job)
    db.commit()
    return None

