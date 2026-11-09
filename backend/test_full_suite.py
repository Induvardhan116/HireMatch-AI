import requests
import os
import uuid
import sys

BASE_URL = "http://localhost:8000"

def test_suite():
    print("=" * 70)
    print("HIREMATCH AI - COMPREHENSIVE FULL-STACK VERIFICATION TEST SUITE")
    print("=" * 70)

    # 1. Health check
    resp = requests.get(f"{BASE_URL}/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()
    assert health_data["status"] == "healthy"
    print(" [PASS] Health check passed:", health_data)

    # TEST 1: Welcome & Authentication
    print("\n--- TEST 1: Welcome & Role-Based Authentication ---")
    
    # 1.1 Verify public registration as ADMIN is BLOCKED (HTTP 403)
    admin_attempt = {
        "email": f"hacker_{uuid.uuid4().hex[:6]}@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "full_name": "Unauthorized Admin Attempt",
        "role": "ADMIN"
    }
    resp = requests.post(f"{BASE_URL}/api/auth/register", json=admin_attempt)
    assert resp.status_code == 403, f"Admin registration should be forbidden! Got {resp.status_code}"
    print(" [PASS] Security check: Public Admin registration is blocked with HTTP 403 Forbidden.")

    # 1.2 Verify password mismatch is rejected
    mismatch_attempt = {
        "email": f"seeker_{uuid.uuid4().hex[:6]}@example.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!",
        "full_name": "Password Mismatch Test",
        "role": "JOB_SEEKER"
    }
    resp = requests.post(f"{BASE_URL}/api/auth/register", json=mismatch_attempt)
    assert resp.status_code == 400, f"Password mismatch should fail with 400! Got {resp.status_code}"
    print(" [PASS] Password validation: Mismatched passwords correctly rejected with HTTP 400.")

    # 1.3 Register valid Job Seeker
    unique_id = uuid.uuid4().hex[:6]
    candidate_email = f"candidate_{unique_id}@example.com"
    candidate_pass = "HireMatch2026!"
    candidate_payload = {
        "email": candidate_email,
        "password": candidate_pass,
        "confirm_password": candidate_pass,
        "full_name": f"Test Candidate {unique_id}",
        "role": "JOB_SEEKER",
        "current_title": "Full-Stack Software Engineer"
    }
    resp = requests.post(f"{BASE_URL}/api/auth/register", json=candidate_payload)
    assert resp.status_code == 201, f"Candidate registration failed: {resp.text}"
    candidate_data = resp.json()
    candidate_token = candidate_data["access_token"]
    candidate_headers = {"Authorization": f"Bearer {candidate_token}"}
    print(f" [PASS] Job Seeker registered: {candidate_data['user']['full_name']} ({candidate_email})")

    # 1.4 Register valid Recruiter
    recruiter_email = f"recruiter_{unique_id}@cloudcorp.com"
    recruiter_pass = "HireMatch2026!"
    recruiter_payload = {
        "email": recruiter_email,
        "password": recruiter_pass,
        "confirm_password": recruiter_pass,
        "full_name": f"Tech Recruiter {unique_id}",
        "role": "RECRUITER",
        "company_name": "CloudCorp Global"
    }
    resp = requests.post(f"{BASE_URL}/api/auth/register", json=recruiter_payload)
    assert resp.status_code == 201, f"Recruiter registration failed: {resp.text}"
    recruiter_data = resp.json()
    recruiter_token = recruiter_data["access_token"]
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    print(f" [PASS] Recruiter registered: {recruiter_data['user']['full_name']} ({recruiter_email})")

    # 1.5 Login Admin (Pre-seeded)
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@hirematch.ai",
        "password": "hirematch123"
    })
    if resp.status_code != 200:
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@talentmatch.ai",
            "password": "talentmatch123"
        })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    admin_data = resp.json()
    admin_token = admin_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f" [PASS] Admin logged in: {admin_data['user']['full_name']} ({admin_data['user']['role']})")

    # TEST 2: Resume Upload (PDF)
    print("\n--- TEST 2: Resume Upload (PDF) & Parsing ---")
    pdf_sample_path = "d:\\DEVv\\backend\\sample_resume.pdf"
    if not os.path.exists(pdf_sample_path):
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 72), "Elena Rostova\nFull-Stack Engineer\n\nSkills:\nPython, TypeScript, React, FastAPI, Docker, PostgreSQL, AWS\n\nExperience: 5 years building scalable web architectures.")
        doc.save(pdf_sample_path)
        doc.close()

    with open(pdf_sample_path, "rb") as f:
        resp = requests.post(
            f"{BASE_URL}/api/resumes/upload",
            headers=candidate_headers,
            files={"file": ("Elena_Rostova_Resume.pdf", f, "application/pdf")}
        )
    assert resp.status_code == 201, f"PDF upload failed: {resp.text}"
    pdf_resume = resp.json()
    print(f" [PASS] PDF uploaded: {pdf_resume['filename']} (ID: {pdf_resume['id']})")
    print(f"        Extracted Skills: {len(pdf_resume['skills'])} skills detected -> {pdf_resume['skills']}")
    print(f"        Categorized: {list(pdf_resume.get('categorized_skills', {}).keys())}")
    assert len(pdf_resume["skills"]) > 0, "No skills extracted from PDF!"

    # TEST 3: Resume Upload (DOCX)
    print("\n--- TEST 3: Resume Upload (DOCX) & Parsing ---")
    docx_sample_path = "d:\\DEVv\\backend\\sample_resume.docx"
    if not os.path.exists(docx_sample_path):
        import docx
        doc = docx.Document()
        doc.add_heading("Marcus Vance - Senior Backend Engineer", 0)
        doc.add_paragraph("Skills: Python, Go, Kubernetes, Terraform, Redis, GraphQL, CI/CD, Microservices")
        doc.add_paragraph("Experience: 7 years developing high-throughput distributed microservices.")
        doc.save(docx_sample_path)

    with open(docx_sample_path, "rb") as f:
        resp = requests.post(
            f"{BASE_URL}/api/resumes/upload",
            headers=candidate_headers,
            files={"file": ("Marcus_Vance_Resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
    assert resp.status_code == 201, f"DOCX upload failed: {resp.text}"
    docx_resume = resp.json()
    print(f" [PASS] DOCX uploaded: {docx_resume['filename']} (ID: {docx_resume['id']})")
    print(f"        Extracted Skills: {len(docx_resume['skills'])} skills detected -> {docx_resume['skills']}")
    assert len(docx_resume["skills"]) > 0, "No skills extracted from DOCX!"

    # TEST 4: Extracted Skills & Interactive Skill Editor
    print("\n--- TEST 4: Extracted Skills & Skill Editor ---")
    active_resume_id = pdf_resume["id"]
    updated_skills_payload = {
        "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "GraphQL", "Kubernetes"],
        "categorized_skills": {
            "Programming Languages": ["Python", "TypeScript"],
            "Frameworks & Libraries": ["FastAPI", "React"],
            "Databases & Storage": ["PostgreSQL"],
            "Cloud & DevOps": ["Docker", "Kubernetes"],
            "Other / Tools": ["GraphQL"]
        }
    }
    resp = requests.put(
        f"{BASE_URL}/api/resumes/{active_resume_id}/skills",
        headers=candidate_headers,
        json=updated_skills_payload
    )
    assert resp.status_code == 200, f"Skill update failed: {resp.text}"
    updated_resume = resp.json()
    print(" [PASS] Skills updated via candidate editor:")
    for cat, skl in updated_resume["categorized_skills"].items():
        print(f"        * {cat}: {skl}")
    assert "Kubernetes" in updated_resume["skills"], "Kubernetes skill was not saved!"

    # TEST 5: Job Recommendations & Matching Engine
    print("\n--- TEST 5: Job Recommendations & ATS Matching Engine ---")
    resp = requests.get(f"{BASE_URL}/api/jobs/recommendations/me", headers=candidate_headers)
    assert resp.status_code == 200, f"Recommendations failed: {resp.text}"
    recommendations = resp.json()
    assert len(recommendations) > 0, "No job recommendations returned!"
    print(f" [PASS] Retrieved {len(recommendations)} personalized job recommendations:")
    for job in recommendations[:3]:
        print(f"        * Job: {job['title']} at {job['company']}")
        print(f"          Skill Match: {job.get('skill_match_percentage')}% | ATS Score: {job.get('recommendation_score')}%")
        print(f"          Matched Skills: {job.get('matched_skills')}")
        print(f"          Missing Skills: {job.get('missing_skills')}")

    # TEST 6: Job Application Workflow (Recruiter Creates Job -> Candidate Applies -> Recruiter Reviews & Shortlists)
    print("\n--- TEST 6: Job Application Workflow ---")
    
    # 6.1 Recruiter creates a new job opening
    new_job_payload = {
        "title": f"Senior Cloud Platform Engineer {unique_id}",
        "company": "CloudCorp Global",
        "location": "Remote",
        "job_type": "Full-time",
        "experience_level": "Senior",
        "min_experience_years": 4.0,
        "salary_range": "$140,000 - $175,000",
        "description": "Lead the development of scalable cloud architectures, CI/CD pipelines, and microservices.",
        "requirements": "Proficiency in Python, FastAPI, Docker, Kubernetes, and PostgreSQL.",
        "required_skills": ["Python", "FastAPI", "Docker", "Kubernetes", "PostgreSQL"],
        "nice_to_have_skills": ["GraphQL", "AWS"]
    }
    resp = requests.post(f"{BASE_URL}/api/jobs/", headers=recruiter_headers, json=new_job_payload)
    assert resp.status_code == 201, f"Recruiter job creation failed: {resp.text}"
    recruiter_job = resp.json()
    print(f" [PASS] Recruiter created new job requisition: {recruiter_job['title']} (ID: {recruiter_job['id']})")

    # 6.2 Candidate applies to this job
    app_payload = {
        "job_id": recruiter_job["id"],
        "resume_id": active_resume_id,
        "cover_note": "Excited to apply for this Senior Cloud Platform Engineer role at CloudCorp Global!"
    }
    resp = requests.post(f"{BASE_URL}/api/applications/", headers=candidate_headers, json=app_payload)
    assert resp.status_code == 201, f"Application submission failed: {resp.text}"
    application = resp.json()
    print(f" [PASS] Application submitted! ID: {application['id']} for Job: {recruiter_job['title']}")
    print(f"        Initial Status: {application['status']} | Match Score: {application['match_score']}%")

    # 6.3 Test duplicate application rejection
    resp = requests.post(f"{BASE_URL}/api/applications/", headers=candidate_headers, json=app_payload)
    assert resp.status_code == 400, "Duplicate application should be rejected!"
    print(" [PASS] Duplicate application correctly prevented with HTTP 400.")

    # 6.4 Recruiter reviews applicants for their job and updates status to Shortlisted
    status_update_payload = {
        "status": "Shortlisted",
        "recruiter_notes": "Candidate demonstrates 100% skill alignment with Python, FastAPI, Docker, and Kubernetes. Advancing to technical interview."
    }
    resp = requests.patch(
        f"{BASE_URL}/api/applications/{application['id']}/status",
        headers=recruiter_headers,
        json=status_update_payload
    )
    assert resp.status_code == 200, f"Recruiter status update failed: {resp.text}"
    updated_app = resp.json()
    assert updated_app["status"] == "Shortlisted", "Status not updated to Shortlisted!"
    print(f" [PASS] Recruiter updated application {application['id']} to 'Shortlisted'.")
    print(f"        Recruiter Note: {updated_app['recruiter_notes']}")

    # 6.5 Candidate checks applications and sees Shortlisted status
    resp = requests.get(f"{BASE_URL}/api/applications/my", headers=candidate_headers)
    assert resp.status_code == 200
    my_apps = resp.json()
    candidate_view = next((a for a in my_apps if a["id"] == application["id"]), None)
    assert candidate_view is not None, "Application not found in candidate list!"
    assert candidate_view["status"] == "Shortlisted", "Candidate does not see updated Shortlisted status!"
    print(f" [PASS] Candidate verified updated application status in pipeline: '{candidate_view['status']}'.")

    # TEST 7: Admin Console & 4 Compliance Reports with CSV Export
    print("\n--- TEST 7: Admin Console & 4 Compliance Reports ---")
    resp = requests.get(f"{BASE_URL}/api/analytics/overview", headers=admin_headers)
    assert resp.status_code == 200, f"Admin overview failed: {resp.text}"
    overview = resp.json()
    print(f" [PASS] Admin Platform Stats: {overview['stats']['total_users']} Users, {overview['stats']['active_jobs']} Jobs, {overview['stats']['total_applications']} Applications")

    # 4 Reports Check
    reports = [
        ("resume-screening", "Resume Screening Report"),
        ("candidate-skills", "Candidate Skill Analysis Report"),
        ("job-applications", "Job Application Report"),
        ("recruitment-summary", "Recruitment Summary Report"),
    ]

    for endpoint, name in reports:
        # JSON
        resp = requests.get(f"{BASE_URL}/api/analytics/reports/{endpoint}", headers=admin_headers)
        assert resp.status_code == 200, f"{name} JSON failed: {resp.text}"
        
        # CSV Export
        csv_resp = requests.get(f"{BASE_URL}/api/analytics/reports/{endpoint}?format=csv", headers=admin_headers)
        assert csv_resp.status_code == 200, f"{name} CSV export failed: {csv_resp.text}"
        assert "text/csv" in csv_resp.headers.get("content-type", ""), f"Content-type should be CSV! Got {csv_resp.headers.get('content-type')}"
        lines_count = len(csv_resp.text.strip().split("\n"))
        print(f" [PASS] {name}: Verified JSON & CSV Export ({lines_count} lines exported)")

    print("\n" + "=" * 70)
    print(">>> ALL 7 TEST SUITES PASSED SUCCESSFULLY (100% OPERATIONAL) <<<")
    print("=" * 70)

if __name__ == "__main__":
    try:
        test_suite()
    except Exception as e:
        print(f"\n[FAIL] Test suite encountered an error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
