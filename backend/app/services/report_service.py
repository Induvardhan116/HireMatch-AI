import io
import csv
import json
from collections import Counter
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, UserRole
from app.models.job import Job
from app.models.resume import Resume
from app.models.application import Application, ApplicationStatus

class ReportService:

    @staticmethod
    def get_resume_screening_report(db: Session, recruiter_id: int = None, job_id: int = None) -> List[Dict[str, Any]]:
        query = db.query(Application).join(Job).join(User, Application.user_id == User.id)
        
        if recruiter_id:
            query = query.filter(Job.recruiter_id == recruiter_id)
        if job_id:
            query = query.filter(Application.job_id == job_id)
            
        applications = query.order_by(Application.match_score.desc()).all()
        report_data = []
        for app in applications:
            report_data.append({
                "application_id": app.id,
                "candidate_id": app.user_id,
                "candidate_name": app.applicant.full_name if app.applicant else "Unknown",
                "candidate_email": app.applicant.email if app.applicant else "Unknown",
                "job_id": app.job_id,
                "job_title": app.job.title if app.job else "Unknown",
                "company": app.job.company if app.job else "Unknown",
                "match_score": app.match_score,
                "skill_score": app.skill_score,
                "keyword_score": app.keyword_score,
                "experience_score": app.experience_score,
                "matched_skills": app.matched_skills_list,
                "missing_skills": app.missing_skills_list,
                "status": app.status.value,
                "applied_at": app.created_at.isoformat() if app.created_at else "",
                "recommendations": app.recommendations_list
            })
        return report_data

    @staticmethod
    def get_candidate_skill_analysis_report(db: Session) -> Dict[str, Any]:
        resumes = db.query(Resume).all()
        total_candidates = db.query(User).filter(User.role == UserRole.JOB_SEEKER).count()
        
        all_candidate_skills = []
        for r in resumes:
            all_candidate_skills.extend(r.skills_list)
            
        candidate_skill_counts = Counter(all_candidate_skills)
        top_candidate_skills = []
        total_resumes_count = max(len(resumes), 1)
        
        for skill, count in candidate_skill_counts.most_common(15):
            top_candidate_skills.append({
                "skill": skill,
                "candidate_count": count,
                "percentage": round((count / total_resumes_count) * 100.0, 1)
            })
            
        # Analyze in-demand skills from active jobs
        jobs = db.query(Job).filter(Job.is_active == True).all()
        all_job_skills = []
        for j in jobs:
            all_job_skills.extend(j.skills_list)
            
        job_skill_counts = Counter(all_job_skills)
        top_job_skills = []
        total_jobs_count = max(len(jobs), 1)
        for skill, count in job_skill_counts.most_common(15):
            top_job_skills.append({
                "skill": skill,
                "candidate_count": count,
                "percentage": round((count / total_jobs_count) * 100.0, 1)
            })
            
        # Common skill gaps: skills high in demand by jobs but scarce in candidate pool
        skill_gaps = []
        for skill, job_count in job_skill_counts.most_common(20):
            cand_count = candidate_skill_counts.get(skill, 0)
            gap_diff = job_count - cand_count
            if gap_diff > 0 or cand_count < (job_count * 0.5):
                skill_gaps.append({
                    "skill": skill,
                    "candidate_count": gap_diff if gap_diff > 0 else 1,
                    "percentage": round(100.0 - ((cand_count / max(job_count, 1)) * 100.0), 1)
                })
                
        return {
            "total_candidates": total_candidates,
            "total_unique_skills": len(candidate_skill_counts),
            "top_candidate_skills": top_candidate_skills,
            "top_in_demand_job_skills": top_job_skills,
            "common_skill_gaps": skill_gaps[:10]
        }

    @staticmethod
    def get_job_application_report(db: Session, recruiter_id: int = None) -> List[Dict[str, Any]]:
        query = db.query(Application).join(Job).join(User, Application.user_id == User.id)
        if recruiter_id:
            query = query.filter(Job.recruiter_id == recruiter_id)
            
        applications = query.order_by(Application.created_at.desc()).all()
        results = []
        for app in applications:
            results.append({
                "application_id": app.id,
                "job_id": app.job_id,
                "job_title": app.job.title if app.job else "Unknown",
                "company": app.job.company if app.job else "Unknown",
                "department": app.job.department if app.job else "Engineering",
                "candidate_name": app.applicant.full_name if app.applicant else "Unknown",
                "candidate_email": app.applicant.email if app.applicant else "Unknown",
                "status": app.status.value,
                "match_score": app.match_score,
                "applied_at": app.created_at.isoformat() if app.created_at else "",
                "last_updated": app.updated_at.isoformat() if app.updated_at else ""
            })
        return results

    @staticmethod
    def get_recruitment_summary_report(db: Session, recruiter_id: int = None) -> Dict[str, Any]:
        job_query = db.query(Job)
        app_query = db.query(Application).join(Job)
        
        if recruiter_id:
            job_query = job_query.filter(Job.recruiter_id == recruiter_id)
            app_query = app_query.filter(Job.recruiter_id == recruiter_id)
            
        total_jobs = job_query.count()
        active_jobs = job_query.filter(Job.is_active == True).count()
        
        applications = app_query.all()
        total_apps = len(applications)
        
        status_counts = {
            ApplicationStatus.APPLIED.value: 0,
            ApplicationStatus.UNDER_REVIEW.value: 0,
            ApplicationStatus.SHORTLISTED.value: 0,
            ApplicationStatus.REJECTED.value: 0,
            ApplicationStatus.SELECTED.value: 0,
        }
        
        total_score = 0.0
        unique_candidate_ids = set()
        
        for app in applications:
            status_val = app.status.value
            status_counts[status_val] = status_counts.get(status_val, 0) + 1
            total_score += app.match_score
            unique_candidate_ids.add(app.user_id)
            
        avg_score = round(total_score / total_apps, 1) if total_apps > 0 else 0.0
        
        # Top hiring roles
        job_counts = Counter([app.job.title for app in applications if app.job])
        top_roles = [{"role": role, "applications": count} for role, count in job_counts.most_common(5)]
        
        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_apps,
            "total_candidates": len(unique_candidate_ids),
            "shortlisted_candidates": status_counts[ApplicationStatus.SHORTLISTED.value],
            "rejected_candidates": status_counts[ApplicationStatus.REJECTED.value],
            "selected_candidates": status_counts[ApplicationStatus.SELECTED.value],
            "under_review_candidates": status_counts[ApplicationStatus.UNDER_REVIEW.value],
            "applied_candidates": status_counts[ApplicationStatus.APPLIED.value],
            "average_match_score": avg_score,
            "applications_by_status": status_counts,
            "top_hiring_roles": top_roles
        }

    @staticmethod
    def export_csv(data: List[Dict[str, Any]], fieldnames: List[str]) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for row in data:
            # Flatten lists if present
            row_copy = {}
            for k, v in row.items():
                if isinstance(v, list):
                    row_copy[k] = "; ".join([str(item) for item in v])
                else:
                    row_copy[k] = v
            writer.writerow(row_copy)
        return output.getvalue()

