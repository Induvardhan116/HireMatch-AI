import os
import uuid
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.resume import ResumeResponse, ResumeDetailResponse, ResumeAnalysisRequest
from app.schemas.matching import MatchAnalysisResult
from app.services.auth_service import get_current_user
from app.services.resume_parser import parse_resume
from app.services.matching_service import matching_engine

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword"
}

def resume_to_response(resume: Resume) -> dict:
    return {
        "id": resume.id,
        "user_id": resume.user_id,
        "filename": resume.filename,
        "file_type": resume.file_type,
        "file_size": resume.file_size,
        "is_primary": resume.is_primary,
        "summary": resume.summary,
        "extracted_experience_years": resume.extracted_experience_years,
        "skills": resume.skills_list,
        "education": resume.education_list,
        "experience": resume.experience_list,
        "keywords": resume.keywords_list,
        "created_at": resume.created_at,
        "updated_at": resume.updated_at
    }

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or DOCX file."
        )
        
    # Read file content
    contents = await file.read()
    file_size = len(contents)
    
    # Validate size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
        
    # Generate unique filename on disk
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    
    with open(file_path, "wb") as f:
        f.write(contents)
        
    # Extract data using parser
    try:
        parsed_data = parse_resume(file_path, file_ext.replace(".", ""))
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract resume text: {str(e)}"
        )
        
    # Check if user already has primary resume
    existing_count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    is_primary = (existing_count == 0)
    
    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_type="pdf" if "pdf" in file_ext else "docx",
        file_size=file_size,
        extracted_text=parsed_data["extracted_text"],
        extracted_skills=json.dumps(parsed_data["skills"]),
        extracted_education=json.dumps(parsed_data["education"]),
        extracted_experience_years=parsed_data["experience_years"],
        extracted_experience_details=json.dumps(parsed_data["experience_details"]),
        extracted_keywords=json.dumps(parsed_data["keywords"]),
        summary=parsed_data["summary"],
        is_primary=is_primary
    )
    
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    return resume_to_response(resume)

@router.get("/", response_model=List[ResumeResponse])
def get_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        resumes = db.query(Resume).order_by(Resume.created_at.desc()).all()
    else:
        resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
        
    return [resume_to_response(r) for r in resumes]

@router.get("/{resume_id}", response_model=ResumeDetailResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.RECRUITER] and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this resume")
        
    resp = resume_to_response(resume)
    resp["extracted_text"] = resume.extracted_text
    return resp

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if current_user.role != UserRole.ADMIN and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resume")
        
    # Remove file from disk
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass
            
    db.delete(resume)
    db.commit()
    return None

@router.post("/analyze", response_model=MatchAnalysisResult)
def analyze_resume_against_job(
    request: ResumeAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explainable NLP Resume vs Job matching endpoint.
    Supports comparing an existing resume ID or paste-in custom resume text
    against an existing job ID or paste-in custom job description.
    """
    resume_text = ""
    resume_skills = []
    candidate_years = 2.0
    candidate_name = current_user.full_name

    # 1. Resolve Resume
    if request.resume_id:
        resume = db.query(Resume).filter(Resume.id == request.resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        resume_text = resume.extracted_text
        resume_skills = resume.skills_list
        candidate_years = resume.extracted_experience_years
        candidate_name = resume.user.full_name if resume.user else current_user.full_name
    elif request.custom_resume_text:
        resume_text = request.custom_resume_text
        from app.services.resume_parser import extract_skills, extract_experience_years
        resume_skills = extract_skills(resume_text)
        candidate_years = extract_experience_years(resume_text)
    else:
        # Default to user's primary or latest resume
        resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.is_primary.desc(), Resume.created_at.desc()).first()
        if not resume:
            raise HTTPException(status_code=400, detail="Please provide a resume ID or resume text to analyze")
        resume_text = resume.extracted_text
        resume_skills = resume.skills_list
        candidate_years = resume.extracted_experience_years

    # 2. Resolve Job Description
    job_description = ""
    job_required_skills = []
    job_nice_skills = []
    job_min_years = 0.0
    job_title = request.custom_job_title or "Target Position"
    job_company = "Target Organization"

    if request.job_id:
        job = db.query(Job).filter(Job.id == request.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        job_description = f"{job.title}\n{job.description}\n{job.requirements or ''}"
        job_required_skills = job.skills_list
        job_nice_skills = job.nice_skills_list
        job_min_years = job.min_experience_years
        job_title = job.title
        job_company = job.company
    elif request.custom_job_description:
        job_description = request.custom_job_description
        from app.services.resume_parser import extract_skills
        job_required_skills = extract_skills(job_description)
    else:
        raise HTTPException(status_code=400, detail="Please select a job or paste a job description")

    # Run Explainable NLP Matching Engine
    result = matching_engine.evaluate_match(
        resume_text=resume_text,
        resume_skills=resume_skills,
        candidate_years=candidate_years,
        job_description=job_description,
        job_required_skills=job_required_skills,
        job_nice_skills=job_nice_skills,
        job_min_years=job_min_years,
        job_title=job_title,
        job_company=job_company,
        candidate_name=candidate_name
    )
    
    return result
