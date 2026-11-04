from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.resume import Resume
from app.models.application import Application, ApplicationStatus
from app.services.auth_service import get_current_user, require_roles
from app.services.report_service import ReportService
from app.schemas.reports import (
    CandidateSkillAnalysisReport,
    RecruitmentSummaryReport
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reports"])

@router.get("/overview")
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns contextual KPI metrics depending on user role."""
    if current_user.role == UserRole.ADMIN:
        total_users = db.query(User).count()
        job_seekers = db.query(User).filter(User.role == UserRole.JOB_SEEKER).count()
        recruiters = db.query(User).filter(User.role == UserRole.RECRUITER).count()
        total_jobs = db.query(Job).count()
        active_jobs = db.query(Job).filter(Job.is_active == True).count()
        total_resumes = db.query(Resume).count()
        total_applications = db.query(Application).count()
        
        return {
            "role": "ADMIN",
            "stats": {
                "total_users": total_users,
                "job_seekers": job_seekers,
                "recruiters": recruiters,
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "total_resumes": total_resumes,
                "total_applications": total_applications
            }
        }
        
    elif current_user.role == UserRole.RECRUITER:
        my_jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()
        job_ids = [j.id for j in my_jobs]
        
        total_jobs = len(my_jobs)
        active_jobs = sum(1 for j in my_jobs if j.is_active)
        
        applications = db.query(Application).filter(Application.job_id.in_(job_ids)).all() if job_ids else []
        total_candidates = len(applications)
        shortlisted = sum(1 for a in applications if a.status == ApplicationStatus.SHORTLISTED)
        selected = sum(1 for a in applications if a.status == ApplicationStatus.SELECTED)
        under_review = sum(1 for a in applications if a.status == ApplicationStatus.UNDER_REVIEW)
        avg_score = round(sum(a.match_score for a in applications) / total_candidates, 1) if total_candidates > 0 else 0.0
        
        return {
            "role": "RECRUITER",
            "stats": {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "total_candidates": total_candidates,
                "shortlisted": shortlisted,
                "selected": selected,
                "under_review": under_review,
                "average_match_score": avg_score
            }
        }
        
    else: # JOB_SEEKER
        my_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
        my_apps = db.query(Application).filter(Application.user_id == current_user.id).all()
        
        avg_score = round(sum(a.match_score for a in my_apps) / len(my_apps), 1) if my_apps else 0.0
        shortlisted = sum(1 for a in my_apps if a.status == ApplicationStatus.SHORTLISTED)
        selected = sum(1 for a in my_apps if a.status == ApplicationStatus.SELECTED)
        
        return {
            "role": "JOB_SEEKER",
            "stats": {
                "resumes_uploaded": len(my_resumes),
                "total_applications": len(my_apps),
                "interviews_shortlisted": shortlisted,
                "offers_selected": selected,
                "average_match_score": avg_score
            }
        }

# REPORT 1: Resume Screening Report
@router.get("/reports/resume-screening")
def get_resume_screening_report(
    job_id: Optional[int] = None,
    format: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    recruiter_id = None if current_user.role == UserRole.ADMIN else current_user.id
    report_items = ReportService.get_resume_screening_report(db, recruiter_id=recruiter_id, job_id=job_id)
    
    if format == "csv":
        fieldnames = [
            "application_id", "candidate_name", "candidate_email", "job_title", "company",
            "match_score", "skill_score", "keyword_score", "experience_score",
            "matched_skills", "missing_skills", "status", "applied_at"
        ]
        csv_data = ReportService.export_csv(report_items, fieldnames)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=resume_screening_report.csv"}
        )
        
    return report_items

# REPORT 2: Candidate Skill Analysis Report
@router.get("/reports/candidate-skills", response_model=CandidateSkillAnalysisReport)
def get_candidate_skill_analysis_report(
    format: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    report_data = ReportService.get_candidate_skill_analysis_report(db)
    
    if format == "csv":
        fieldnames = ["skill", "candidate_count", "percentage"]
        csv_data = ReportService.export_csv(report_data["top_candidate_skills"], fieldnames)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=candidate_skills_report.csv"}
        )
        
    return report_data

# REPORT 3: Job Application Report
@router.get("/reports/job-applications")
def get_job_application_report(
    format: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    recruiter_id = None if current_user.role == UserRole.ADMIN else current_user.id
    items = ReportService.get_job_application_report(db, recruiter_id=recruiter_id)
    
    if format == "csv":
        fieldnames = [
            "application_id", "job_title", "company", "department",
            "candidate_name", "candidate_email", "status", "match_score",
            "applied_at", "last_updated"
        ]
        csv_data = ReportService.export_csv(items, fieldnames)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=job_applications_report.csv"}
        )
        
    return items

# REPORT 4: Recruitment Summary Report
@router.get("/reports/recruitment-summary", response_model=RecruitmentSummaryReport)
def get_recruitment_summary_report(
    format: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    recruiter_id = None if current_user.role == UserRole.ADMIN else current_user.id
    report_data = ReportService.get_recruitment_summary_report(db, recruiter_id=recruiter_id)
    
    if format == "csv":
        # Format key metrics as a CSV table
        metrics = [
            {"metric": "Total Jobs", "value": report_data["total_jobs"]},
            {"metric": "Active Jobs", "value": report_data["active_jobs"]},
            {"metric": "Total Applications", "value": report_data["total_applications"]},
            {"metric": "Total Candidates", "value": report_data["total_candidates"]},
            {"metric": "Shortlisted Candidates", "value": report_data["shortlisted_candidates"]},
            {"metric": "Rejected Candidates", "value": report_data["rejected_candidates"]},
            {"metric": "Selected Candidates", "value": report_data["selected_candidates"]},
            {"metric": "Average Match Score", "value": report_data["average_match_score"]}
        ]
        csv_data = ReportService.export_csv(metrics, ["metric", "value"])
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=recruitment_summary.csv"}
        )
        
    return report_data
