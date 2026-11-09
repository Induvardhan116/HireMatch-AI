import os
import io
import docx
import fitz # PyMuPDF
import httpx
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def create_sample_pdf(filepath: str, text: str):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text, fontsize=11)
    doc.save(filepath)
    doc.close()

def create_sample_docx(filepath: str, text: str):
    doc = docx.Document()
    for line in text.split("\n"):
        if line.strip():
            doc.add_paragraph(line.strip())
    doc.save(filepath)

def run_all_qa_tests():
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)
    print("=" * 70)
    print("TALENTMATCH AI - FULL STACK QA & INTEGRATION TEST SUITE")
    print("=" * 70)

    # 1. Health check & CORS
    print("\n[1] Testing Backend Health & Root Endpoints...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(" -> /api/health OK:", r.json())

    # 2. Authentication: Logins
    print("\n[2] Testing Authentication & RBAC Logins...")
    admin_login = client.post("/auth/login", json={"email": "admin@talentmatch.ai", "password": "talentmatch123"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    print(" -> Admin Login OK (Role: ADMIN)")

    recruiter_login = client.post("/auth/login", json={"email": "sarah.recruiter@cloudtech.com", "password": "talentmatch123"})
    assert recruiter_login.status_code == 200, f"Recruiter login failed: {recruiter_login.text}"
    recruiter_token = recruiter_login.json()["access_token"]
    print(" -> Recruiter Login OK (Role: RECRUITER)")

    seeker_login = client.post("/auth/login", json={"email": "elena.dev@gmail.com", "password": "talentmatch123"})
    assert seeker_login.status_code == 200, f"Seeker login failed: {seeker_login.text}"
    seeker_token = seeker_login.json()["access_token"]
    print(" -> Job Seeker Login OK (Role: JOB_SEEKER)")

    # 3. User Registration (New Candidate)
    print("\n[3] Testing New User Registration...")
    new_email = f"qa.candidate.{uuid.uuid4().hex[:6]}@example.com"
    reg_resp = client.post("/auth/register", json={
        "email": new_email,
        "password": "qa_password_123",
        "full_name": "QA Automated Candidate",
        "role": "JOB_SEEKER",
        "current_title": "Full-Stack QA Engineer"
    })
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    new_user_token = reg_resp.json()["access_token"]
    new_user_id = reg_resp.json()["user"]["id"]
    print(f" -> Registration OK for {new_email} (ID: {new_user_id})")

    # 4. Resume Upload - PDF & Extraction
    print("\n[4] Testing PDF Resume Upload & NLP Skill Extraction...")
    os.makedirs("./temp_test_resumes", exist_ok=True)
    pdf_path = "./temp_test_resumes/qa_sample_resume.pdf"
    sample_pdf_text = """
    Jane Doe - Cloud & Python Software Engineer
    Email: jane.doe@example.com | Phone: 555-0199
    
    PROFESSIONAL SUMMARY
    Senior Software Engineer with 5+ years experience building cloud applications with Python, FastAPI, Docker, and PostgreSQL.
    
    TECHNICAL SKILLS
    Languages & Frameworks: Python, FastAPI, React, TypeScript, Docker, Kubernetes, PostgreSQL, Git, CI/CD
    
    EXPERIENCE
    Senior Backend Developer (2021 - Present)
    - Developed high throughput REST APIs using FastAPI and SQLAlchemy.
    - Containerized services with Docker and orchestrated deployment via Kubernetes.
    
    EDUCATION
    Bachelor of Science in Computer Science, 2019
    """
    create_sample_pdf(pdf_path, sample_pdf_text)
    
    with open(pdf_path, "rb") as f:
        pdf_upload = client.post(
            "/resumes/upload",
            files={"file": ("qa_sample_resume.pdf", f, "application/pdf")},
            headers={"Authorization": f"Bearer {new_user_token}"}
        )
    assert pdf_upload.status_code == 201, f"PDF upload failed: {pdf_upload.text}"
    uploaded_pdf = pdf_upload.json()
    pdf_resume_id = uploaded_pdf["id"]
    print(f" -> PDF Uploaded (ID: {pdf_resume_id})")
    print(f" -> Extracted Skills: {uploaded_pdf['skills']}")
    print(f" -> Detected Exp Years: {uploaded_pdf['extracted_experience_years']}")
    assert "Python" in uploaded_pdf["skills"] or "FastAPI" in uploaded_pdf["skills"]
    assert uploaded_pdf["extracted_experience_years"] >= 4.0

    # 5. Resume Upload - DOCX & Extraction
    print("\n[5] Testing DOCX Resume Upload & Extraction...")
    docx_path = "./temp_test_resumes/qa_sample_resume.docx"
    sample_docx_text = """
    John Smith - Frontend UI Developer
    Email: john.smith@example.com
    SUMMARY
    Frontend engineer with 3 years experience creating React and TypeScript interfaces with Tailwind CSS and Next.js.
    SKILLS
    React, TypeScript, JavaScript, Tailwind CSS, HTML5, CSS3, Vite, Redux
    EXPERIENCE
    Frontend Engineer (2022 - 2025)
    Built responsive web apps in React.
    EDUCATION
    Bachelor of Engineering in Information Technology, 2022
    """
    create_sample_docx(docx_path, sample_docx_text)
    with open(docx_path, "rb") as f:
        docx_upload = client.post(
            "/resumes/upload",
            files={"file": ("qa_sample_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            headers={"Authorization": f"Bearer {new_user_token}"}
        )
    assert docx_upload.status_code == 201, f"DOCX upload failed: {docx_upload.text}"
    uploaded_docx = docx_upload.json()
    docx_resume_id = uploaded_docx["id"]
    print(f" -> DOCX Uploaded (ID: {docx_resume_id})")
    print(f" -> Extracted Skills: {uploaded_docx['skills']}")
    assert "React" in uploaded_docx["skills"] or "TypeScript" in uploaded_docx["skills"]

    # 6. Recruiter: Job Creation, Update, and Management
    print("\n[6] Testing Recruiter Job Lifecycle (Create, Update, List)...")
    job_payload = {
        "title": "QA Test Specialist Engineer",
        "company": "QualityFirst Tech",
        "department": "Platform Reliability",
        "location": "Remote (US)",
        "job_type": "Full-time",
        "experience_level": "Mid-Level",
        "min_experience_years": 3.0,
        "salary_range": "$115,000 - $135,000",
        "description": "Seeking a QA Engineer skilled in Python, FastAPI, Docker, and Automated Testing.",
        "requirements": "3+ years experience with automated testing and Python.",
        "required_skills": ["Python", "Docker", "FastAPI", "PostgreSQL"],
        "nice_to_have_skills": ["Kubernetes", "CI/CD"]
    }
    create_job_resp = client.post("/jobs/", json=job_payload, headers={"Authorization": f"Bearer {recruiter_token}"})
    assert create_job_resp.status_code == 201, f"Job creation failed: {create_job_resp.text}"
    created_job = create_job_resp.json()
    job_id = created_job["id"]
    print(f" -> Job Created OK (ID: {job_id}, Title: {created_job['title']})")

    # Update Job
    update_job_resp = client.put(f"/jobs/{job_id}", json={"salary_range": "$125,000 - $145,000"}, headers={"Authorization": f"Bearer {recruiter_token}"})
    assert update_job_resp.status_code == 200
    assert update_job_resp.json()["salary_range"] == "$125,000 - $145,000"
    print(" -> Job Update OK (New Salary Verified)")

    # 7. AI Resume Matching Analysis (Explainable 50/30/20)
    print("\n[7] Testing Explainable NLP Matching Engine...")
    match_resp = client.post("/resumes/analyze", json={
        "resume_id": pdf_resume_id,
        "job_id": job_id
    }, headers={"Authorization": f"Bearer {new_user_token}"})
    assert match_resp.status_code == 200, f"Match analysis failed: {match_resp.text}"
    match_data = match_resp.json()
    print(f" -> Total Match Score: {match_data['match_score']}%")
    print(f" -> Breakdown: Skill={match_data['breakdown']['skill_score']}%, Keyword={match_data['breakdown']['keyword_score']}%, Exp={match_data['breakdown']['experience_score']}%")
    print(f" -> Matched Skills: {match_data['matched_skills']}")
    print(f" -> Missing Skills: {match_data['missing_skills']}")
    print(f" -> Recommendations Count: {len(match_data['recommendations'])}")
    assert 0 <= match_data["match_score"] <= 100
    assert len(match_data["recommendations"]) > 0

    # 8. Job Recommendations for User
    print("\n[8] Testing Job Recommendations Endpoint...")
    rec_resp = client.get("/jobs/recommendations/me", headers={"Authorization": f"Bearer {new_user_token}"})
    assert rec_resp.status_code == 200, f"Job recommendations failed: {rec_resp.text}"
    recs = rec_resp.json()
    print(f" -> Retrieved {len(recs)} ranked job recommendations")
    assert len(recs) > 0
    top_rec = recs[0]
    print(f" -> Top Recommendation: {top_rec['title']} (Score: {top_rec.get('recommendation_score')}%)")

    # 9. Job Application & Duplicate Prevention
    print("\n[9] Testing Job Application Submission & Duplicate Check...")
    app_payload = {
        "job_id": job_id,
        "resume_id": pdf_resume_id,
        "cover_note": "Excited to apply for this QA role with Python and Docker background."
    }
    apply_resp = client.post("/applications/", json=app_payload, headers={"Authorization": f"Bearer {new_user_token}"})
    assert apply_resp.status_code == 201, f"Application submission failed: {apply_resp.text}"
    app_data = apply_resp.json()
    application_id = app_data["id"]
    print(f" -> Application Submitted OK (App ID: {application_id}, Status: {app_data['status']}, Score: {app_data['match_score']}%)")

    # Verify duplicate prevention
    dup_resp = client.post("/applications/", json=app_payload, headers={"Authorization": f"Bearer {new_user_token}"})
    assert dup_resp.status_code == 400, "Duplicate application was not blocked!"
    print(" -> Duplicate Application Blocked Successfully (HTTP 400)")

    # 10. Recruiter Decision Pipeline (Status Updates)
    print("\n[10] Testing Recruiter Candidate Decision Workflow...")
    # Update to Under Review
    status_resp1 = client.patch(f"/applications/{application_id}/status", json={
        "status": "Under Review",
        "recruiter_notes": "Reviewed candidate resume, skills match is high."
    }, headers={"Authorization": f"Bearer {recruiter_token}"})
    assert status_resp1.status_code == 200
    assert status_resp1.json()["status"] == "Under Review"
    print(" -> Status updated to 'Under Review'")

    # Update to Shortlisted
    status_resp2 = client.patch(f"/applications/{application_id}/status", json={
        "status": "Shortlisted",
        "recruiter_notes": "Shortlisted for technical assessment."
    }, headers={"Authorization": f"Bearer {recruiter_token}"})
    assert status_resp2.status_code == 200
    assert status_resp2.json()["status"] == "Shortlisted"
    print(" -> Status updated to 'Shortlisted'")

    # Update to Selected
    status_resp3 = client.patch(f"/applications/{application_id}/status", json={
        "status": "Selected",
        "recruiter_notes": "Candidate offered position."
    }, headers={"Authorization": f"Bearer {recruiter_token}"})
    assert status_resp3.status_code == 200
    assert status_resp3.json()["status"] == "Selected"
    print(" -> Status updated to 'Selected'")

    # 11. Admin User & Platform Management
    print("\n[11] Testing Admin User Management & Controls...")
    users_resp = client.get("/users/", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_resp.status_code == 200
    users_list = users_resp.json()
    print(f" -> Admin retrieved {len(users_list)} total users")
    
    # Toggle user active status
    user_toggle = client.put(f"/users/{new_user_id}", json={"is_active": True}, headers={"Authorization": f"Bearer {admin_token}"})
    assert user_toggle.status_code == 200
    print(" -> User status update verified via Admin endpoint")

    # 12. Four Mandatory Functional Reports & CSV Export
    print("\n[12] Testing 4 Mandatory Functional Reports & CSV Exports...")
    # Report 1: Resume Screening
    rep1 = client.get("/analytics/reports/resume-screening", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep1.status_code == 200
    rep1_csv = client.get("/analytics/reports/resume-screening?format=csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep1_csv.status_code == 200
    assert "text/csv" in rep1_csv.headers["content-type"]
    print(" -> Report 1 (Resume Screening): JSON OK, CSV OK (Length:", len(rep1_csv.text), "chars)")

    # Report 2: Candidate Skills Analysis
    rep2 = client.get("/analytics/reports/candidate-skills", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep2.status_code == 200
    rep2_csv = client.get("/analytics/reports/candidate-skills?format=csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep2_csv.status_code == 200
    print(" -> Report 2 (Candidate Skills Analysis): JSON OK, CSV OK")

    # Report 3: Job Application Report
    rep3 = client.get("/analytics/reports/job-applications", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep3.status_code == 200
    rep3_csv = client.get("/analytics/reports/job-applications?format=csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep3_csv.status_code == 200
    print(" -> Report 3 (Job Applications): JSON OK, CSV OK")

    # Report 4: Recruitment Summary Report
    rep4 = client.get("/analytics/reports/recruitment-summary", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep4.status_code == 200
    rep4_csv = client.get("/analytics/reports/recruitment-summary?format=csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep4_csv.status_code == 200
    print(" -> Report 4 (Recruitment Summary): JSON OK, CSV OK")

    # Cleanup temp test files
    try:
        os.remove(pdf_path)
        os.remove(docx_path)
        os.rmdir("./temp_test_resumes")
    except Exception:
        pass

    print("\n" + "=" * 70)
    print("ALL QA AND INTEGRATION TEST SCENARIOS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_qa_tests()

