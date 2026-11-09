import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.resume import Resume
from app.models.application import Application, ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate, ApplicationResponse
from app.services.auth_service import get_current_user, require_roles
from app.services.matching_service import matching_engine
from app.routers.jobs import job_to_response
from app.routers.resumes import resume_to_response

router = APIRouter(prefix="/api/applications", tags=["Job Applications"])

def application_to_response(app: Application) -> dict:
    return {
        "id": app.id,
        "job_id": app.job_id,
        "user_id": app.user_id,
        "resume_id": app.resume_id,
        "status": app.status,
        "match_score": app.match_score,
        "skill_score": app.skill_score,
        "keyword_score": app.keyword_score,
        "experience_score": app.experience_score,
        "matched_skills": app.matched_skills_list,
        "missing_skills": app.missing_skills_list,
        "recommendations": app.recommendations_list,
        "cover_note": app.cover_note,
        "recruiter_notes": app.recruiter_notes,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "job": job_to_response(app.job) if app.job else None,
        "applicant": app.applicant,
        "resume": resume_to_response(app.resume) if app.resume else None
    }

@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Prevent duplicate applications
    existing = db.query(Application).filter(
        Application.job_id == app_in.job_id,
        Application.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted an application for this position."
        )
        
    # 2. Verify Job
    job = db.query(Job).filter(Job.id == app_in.job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Active job not found")
        
    # 3. Verify Resume
    resume = db.query(Resume).filter(
        Resume.id == app_in.resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Selected resume not found")
        
    # 4. Compute AI Match Score for this application
    match_result = matching_engine.evaluate_match(
        resume_text=resume.extracted_text,
        resume_skills=resume.skills_list,
        candidate_years=resume.extracted_experience_years,
        job_description=f"{job.title}\n{job.description}\n{job.requirements or ''}",
        job_required_skills=job.skills_list,
        job_nice_skills=job.nice_skills_list,
        job_min_years=job.min_experience_years,
        job_title=job.title,
        job_company=job.company,
        candidate_name=current_user.full_name
    )
    
    bd = match_result["breakdown"]
    application = Application(
        job_id=job.id,
        user_id=current_user.id,
        resume_id=resume.id,
        status=ApplicationStatus.APPLIED,
        match_score=match_result["match_score"],
        skill_score=bd["skill_score"],
        keyword_score=bd["keyword_score"],
        experience_score=bd["experience_score"],
        matched_skills=json.dumps(match_result["matched_skills"]),
        missing_skills=json.dumps(match_result["missing_skills"]),
        recommendations=json.dumps(match_result["recommendations"]),
        cover_note=app_in.cover_note
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return application_to_response(application)

@router.get("/my", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    return [application_to_response(a) for a in apps]

@router.get("/job/{job_id}", response_model=List[ApplicationResponse])
def get_job_applications(
    job_id: int,
    status_filter: Optional[ApplicationStatus] = None,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if current_user.role != UserRole.ADMIN and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view candidates for this job")
        
    query = db.query(Application).filter(Application.job_id == job_id)
    if status_filter:
        query = query.filter(Application.status == status_filter)
        
    apps = query.order_by(Application.match_score.desc()).all()
    return [application_to_response(a) for a in apps]

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Check permissions
    if current_user.role == UserRole.JOB_SEEKER and app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this application")
    elif current_user.role == UserRole.RECRUITER and app.job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this application")
        
    return application_to_response(app)

@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if current_user.role != UserRole.ADMIN and app.job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this candidate's status")
        
    app.status = status_update.status
    if status_update.recruiter_notes is not None:
        app.recruiter_notes = status_update.recruiter_notes
        
    db.commit()
    db.refresh(app)
    return application_to_response(app)

