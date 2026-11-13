import io
import uuid
from datetime import timedelta
import docx
import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)


def _login(email: str, password: str, role: str | None = None):
    payload = {"email": email, "password": password}
    if role:
        payload["role"] = role
    return client.post("/api/auth/login", json=payload)


def _auth_headers(email: str, password: str, role: str | None = None) -> dict:
    resp = _login(email, password, role)
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _make_pdf_bytes(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def _make_docx_bytes(text: str) -> bytes:
    doc = docx.Document()
    for line in text.splitlines():
        if line.strip():
            doc.add_paragraph(line.strip())
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["database"] == "connected"


def test_login_demo_admin():
    response = _login("admin@talentmatch.ai", "talentmatch123", "ADMIN")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "admin@talentmatch.ai"
    assert me.json()["role"] == "ADMIN"


def test_login_demo_recruiter():
    response = _login("sarah.recruiter@cloudtech.com", "talentmatch123", "RECRUITER")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "RECRUITER"


def test_login_demo_job_seeker():
    response = _login("elena.dev@gmail.com", "talentmatch123", "JOB_SEEKER")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "JOB_SEEKER"


def test_login_role_mismatch_rejected():
    response = _login("elena.dev@gmail.com", "talentmatch123", "ADMIN")
    assert response.status_code == 403


def test_register_new_candidate_and_block_admin():
    rand_email = f"test.{uuid.uuid4().hex[:8]}@example.com"
    blocked = client.post(
        "/api/auth/register",
        json={
            "email": f"admin.{rand_email}",
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "full_name": "Blocked Admin",
            "role": "ADMIN",
        },
    )
    assert blocked.status_code == 403

    response = client.post(
        "/api/auth/register",
        json={
            "email": rand_email,
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "full_name": "Test Candidate",
            "role": "JOB_SEEKER",
            "current_title": "Software Developer",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == rand_email
    assert data["user"]["role"] == "JOB_SEEKER"


def test_jobs_list_public():
    response = client.get("/api/jobs/")
    assert response.status_code == 200
    jobs = response.json()
    assert len(jobs) >= 4
    first_job = jobs[0]
    assert "title" in first_job
    assert "required_skills" in first_job
    assert isinstance(first_job["required_skills"], list)


def test_resume_upload_list_set_primary_and_analyze():
    headers = _auth_headers("elena.dev@gmail.com", "talentmatch123", "JOB_SEEKER")

    # Upload PDF
    pdf_bytes = _make_pdf_bytes(
        "Elena Rostova\nSkills: Python, FastAPI, React, PostgreSQL, Docker\nExperience: 5 years"
    )
    pdf_resp = client.post(
        "/api/resumes/upload",
        headers=headers,
        files={"file": ("updated_cv.pdf", pdf_bytes, "application/pdf")},
    )
    assert pdf_resp.status_code == 201, pdf_resp.text
    pdf_resume = pdf_resp.json()
    assert "Python" in pdf_resume["skills"]

    # Upload DOCX
    docx_bytes = _make_docx_bytes(
        "Elena Rostova\nSkills: TypeScript, Kubernetes, AWS, Terraform\nExperience: 6 years"
    )
    docx_resp = client.post(
        "/api/resumes/upload",
        headers=headers,
        files={
            "file": (
                "cloud_cv.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert docx_resp.status_code == 201, docx_resp.text
    docx_resume = docx_resp.json()

    # List resumes and verify both exist
    list_resp = client.get("/api/resumes/", headers=headers)
    assert list_resp.status_code == 200
    listed_ids = [r["id"] for r in list_resp.json()]
    assert pdf_resume["id"] in listed_ids
    assert docx_resume["id"] in listed_ids

    # Set DOCX resume as active/primary
    prim_resp = client.patch(f"/api/resumes/{docx_resume['id']}/primary", headers=headers)
    assert prim_resp.status_code == 200
    assert prim_resp.json()["is_primary"] is True

    # Analyze selected resume against a job
    jobs = client.get("/api/jobs/").json()
    job_id = jobs[0]["id"]
    analyze_resp = client.post(
        "/api/resumes/analyze",
        json={"resume_id": pdf_resume["id"], "job_id": job_id},
        headers=headers,
    )
    assert analyze_resp.status_code == 200
    result = analyze_resp.json()
    assert 0 <= result["match_score"] <= 100
    assert "skill_score" in result["breakdown"]
    assert "keyword_score" in result["breakdown"]
    assert "experience_score" in result["breakdown"]
    assert isinstance(result["matched_skills"], list)
    assert isinstance(result["missing_skills"], list)


def test_applications_lifecycle():
    seeker_headers = _auth_headers("elena.dev@gmail.com", "talentmatch123", "JOB_SEEKER")
    resumes = client.get("/api/resumes/", headers=seeker_headers).json()
    assert len(resumes) > 0
    jobs = client.get("/api/jobs/").json()
    # Pick a job Elena hasn't applied to yet (job index -1 from seed)
    target_job = next(
        j for j in jobs if j["id"] not in {a["job_id"] for a in client.get("/api/applications/my", headers=seeker_headers).json()}
    )

    apply_resp = client.post(
        "/api/applications/",
        headers=seeker_headers,
        json={"job_id": target_job["id"], "resume_id": resumes[0]["id"], "cover_note": "Strong fit."},
    )
    assert apply_resp.status_code == 201, apply_resp.text

    # Duplicate application rejected
    dup_resp = client.post(
        "/api/applications/",
        headers=seeker_headers,
        json={"job_id": target_job["id"], "resume_id": resumes[0]["id"]},
    )
    assert dup_resp.status_code == 400

    my_apps = client.get("/api/applications/my", headers=seeker_headers)
    assert my_apps.status_code == 200
    assert any(a["job_id"] == target_job["id"] for a in my_apps.json())


def test_recruiter_job_crud_and_authorization():
    sarah_headers = _auth_headers("sarah.recruiter@cloudtech.com", "talentmatch123", "RECRUITER")
    david_headers = _auth_headers("david.talent@apexai.io", "talentmatch123", "RECRUITER")
    seeker_headers = _auth_headers("elena.dev@gmail.com", "talentmatch123", "JOB_SEEKER")
    admin_headers = _auth_headers("admin@talentmatch.ai", "talentmatch123", "ADMIN")

    job_payload = {
        "title": "Platform Security Engineer",
        "company": "CloudScale Technologies",
        "department": "Security",
        "location": "Remote",
        "job_type": "Full-time",
        "experience_level": "Senior",
        "min_experience_years": 4.0,
        "salary_range": "$150,000 - $180,000",
        "description": "Build zero-trust services in Python and FastAPI.",
        "requirements": "Python, FastAPI, PostgreSQL, Docker",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "nice_to_have_skills": ["Kubernetes"],
    }

    # Unauthenticated create -> 401
    assert client.post("/api/jobs/", json=job_payload).status_code == 401

    # Job Seeker create -> 403
    assert client.post("/api/jobs/", json=job_payload, headers=seeker_headers).status_code == 403

    # Recruiter Sarah creates a job -> 201
    create_resp = client.post("/api/jobs/", json=job_payload, headers=sarah_headers)
    assert create_resp.status_code == 201, create_resp.text
    created_job = create_resp.json()
    job_id = created_job["id"]

    # Sarah lists her own jobs -> contains created job, excludes David's jobs
    my_jobs_resp = client.get("/api/jobs/my", headers=sarah_headers)
    assert my_jobs_resp.status_code == 200
    my_jobs = my_jobs_resp.json()
    assert any(j["id"] == job_id for j in my_jobs)
    assert all(j["recruiter_id"] == created_job["recruiter_id"] for j in my_jobs)

    # Another recruiter (David) cannot edit or delete Sarah's job -> 403
    assert (
        client.put(f"/api/jobs/{job_id}", json={"title": "Hijacked"}, headers=david_headers).status_code
        == 403
    )
    assert client.delete(f"/api/jobs/{job_id}", headers=david_headers).status_code == 403

    # Job Seeker cannot edit or delete -> 403
    assert (
        client.put(f"/api/jobs/{job_id}", json={"title": "Hijacked"}, headers=seeker_headers).status_code
        == 403
    )
    assert client.delete(f"/api/jobs/{job_id}", headers=seeker_headers).status_code == 403

    # Sarah updates her own job -> 200
    update_resp = client.put(
        f"/api/jobs/{job_id}",
        json={"title": "Principal Security Engineer", "location": "Hybrid - NYC"},
        headers=sarah_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Principal Security Engineer"
    assert update_resp.json()["location"] == "Hybrid - NYC"

    # Candidate applies to Sarah's job, then Sarah deletes it -> cascade deletes safely (204)
    seeker_resumes = client.get("/api/resumes/", headers=seeker_headers).json()
    app_resp = client.post(
        "/api/applications/",
        headers=seeker_headers,
        json={"job_id": job_id, "resume_id": seeker_resumes[0]["id"]},
    )
    assert app_resp.status_code == 201

    del_resp = client.delete(f"/api/jobs/{job_id}", headers=sarah_headers)
    assert del_resp.status_code == 204
    assert client.get(f"/api/jobs/{job_id}").status_code == 404

    # Admin can create and delete platform jobs
    admin_create = client.post("/api/jobs/", json=job_payload, headers=admin_headers)
    assert admin_create.status_code == 201
    assert client.delete(f"/api/jobs/{admin_create.json()['id']}", headers=admin_headers).status_code == 204


def test_admin_reports():
    headers = _auth_headers("admin@talentmatch.ai", "talentmatch123", "ADMIN")

    r1 = client.get("/api/analytics/reports/resume-screening", headers=headers)
    assert r1.status_code == 200
    assert isinstance(r1.json(), list)

    r2 = client.get("/api/analytics/reports/candidate-skills", headers=headers)
    assert r2.status_code == 200
    assert "top_candidate_skills" in r2.json()

    r3 = client.get("/api/analytics/reports/job-applications", headers=headers)
    assert r3.status_code == 200

    r4 = client.get("/api/analytics/reports/recruitment-summary", headers=headers)
    assert r4.status_code == 200
    assert "total_jobs" in r4.json()


def test_admin_user_active_toggle_and_delete_protection():
    admin_headers = _auth_headers("admin@talentmatch.ai", "talentmatch123", "ADMIN")
    admin_me = client.get("/api/auth/me", headers=admin_headers).json()
    admin_id = admin_me["id"]

    # Register a temporary candidate user to toggle & delete without disturbing demo accounts
    temp_email = f"toggle.{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "email": temp_email,
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "full_name": "Toggle Test Candidate",
            "role": "JOB_SEEKER",
        },
    )
    assert reg_resp.status_code == 201
    temp_user = reg_resp.json()["user"]
    temp_id = temp_user["id"]
    temp_token = reg_resp.json()["access_token"]

    # Admin self-deactivation and self-deletion must be blocked
    self_deactivate = client.put(
        f"/api/users/{admin_id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert self_deactivate.status_code == 400
    assert client.delete(f"/api/users/{admin_id}", headers=admin_headers).status_code == 400

    # Deactivate temp user and confirm persistence across DB + /auth/me + /auth/login
    deactivate_resp = client.put(
        f"/api/users/{temp_id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert deactivate_resp.status_code == 200
    assert deactivate_resp.json()["is_active"] is False

    fetched = client.get(f"/api/users/{temp_id}", headers=admin_headers)
    assert fetched.status_code == 200
    assert fetched.json()["is_active"] is False

    blocked_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {temp_token}"})
    assert blocked_me.status_code == 400
    assert _login(temp_email, "securepassword123", "JOB_SEEKER").status_code in (400, 403)

    # Reactivate temp user and confirm login works again
    reactivate_resp = client.put(
        f"/api/users/{temp_id}",
        json={"is_active": True},
        headers=admin_headers,
    )
    assert reactivate_resp.status_code == 200
    assert reactivate_resp.json()["is_active"] is True
    assert _login(temp_email, "securepassword123", "JOB_SEEKER").status_code == 200

    # Delete temp user and confirm removal
    del_resp = client.delete(f"/api/users/{temp_id}", headers=admin_headers)
    assert del_resp.status_code == 204
    assert client.get(f"/api/users/{temp_id}", headers=admin_headers).status_code == 404


def test_rbac_matrix_and_jwt_validation():
    recruiter_headers = _auth_headers("sarah.recruiter@cloudtech.com", "talentmatch123", "RECRUITER")
    seeker_headers = _auth_headers("elena.dev@gmail.com", "talentmatch123", "JOB_SEEKER")

    # Users directory is ADMIN-only
    assert client.get("/api/users/").status_code == 401
    assert client.get("/api/users/", headers=recruiter_headers).status_code == 403
    assert client.get("/api/users/", headers=seeker_headers).status_code == 403
    assert client.put("/api/users/1", json={"is_active": True}, headers=recruiter_headers).status_code == 403
    assert client.delete("/api/users/1", headers=seeker_headers).status_code == 403

    # Reports endpoints deny unauthenticated and JOB_SEEKER users, allow RECRUITER
    for path in (
        "/api/analytics/reports/resume-screening",
        "/api/analytics/reports/candidate-skills",
        "/api/analytics/reports/job-applications",
        "/api/analytics/reports/recruitment-summary",
    ):
        assert client.get(path).status_code == 401
        assert client.get(path, headers=seeker_headers).status_code == 403
        assert client.get(path, headers=recruiter_headers).status_code == 200

    # Tampered & expired JWTs are rejected cleanly with 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"}).status_code == 401
    expired_token = create_access_token(
        data={"sub": "admin@talentmatch.ai", "role": "ADMIN"},
        expires_delta=timedelta(minutes=-5),
    )
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"}).status_code == 401


def test_recruiter_interactive_matcher_and_job_status_toggle():
    sarah_headers = _auth_headers("sarah.recruiter@cloudtech.com", "talentmatch123", "RECRUITER")

    # Recruiter sees candidate resumes for Interactive Matcher with candidate identity
    resumes_resp = client.get("/api/resumes/", headers=sarah_headers)
    assert resumes_resp.status_code == 200
    candidate_resumes = resumes_resp.json()
    assert len(candidate_resumes) >= 1
    assert any(r.get("candidate_name") for r in candidate_resumes)

    # Recruiter cannot mutate a candidate's primary resume -> 403
    first_resume_id = candidate_resumes[0]["id"]
    assert client.patch(f"/api/resumes/{first_resume_id}/primary", headers=sarah_headers).status_code == 403

    # Recruiter evaluates candidate resume against her own job posting
    my_jobs = client.get("/api/jobs/my", headers=sarah_headers).json()
    assert len(my_jobs) >= 1
    job_id = my_jobs[0]["id"]
    match_resp = client.post(
        "/api/resumes/analyze",
        json={"resume_id": first_resume_id, "job_id": job_id},
        headers=sarah_headers,
    )
    assert match_resp.status_code == 200
    assert 0 <= match_resp.json()["match_score"] <= 100

    # Recruiter can deactivate and reactivate her own job posting
    deact = client.put(f"/api/jobs/{job_id}", json={"is_active": False}, headers=sarah_headers)
    assert deact.status_code == 200 and deact.json()["is_active"] is False
    react = client.put(f"/api/jobs/{job_id}", json={"is_active": True}, headers=sarah_headers)
    assert react.status_code == 200 and react.json()["is_active"] is True


def test_admin_and_recruiter_job_listing_contracts():
    admin_headers = _auth_headers("admin@talentmatch.ai", "talentmatch123", "ADMIN")
    sarah_headers = _auth_headers("sarah.recruiter@cloudtech.com", "talentmatch123", "RECRUITER")
    seeker_headers = _auth_headers("elena.dev@gmail.com", "talentmatch123", "JOB_SEEKER")

    # Unauthorized /api/jobs/my -> 401 unauthenticated, 403 Job Seeker
    assert client.get("/api/jobs/my").status_code == 401
    assert client.get("/api/jobs/my", headers=seeker_headers).status_code == 403

    # Register a brand-new recruiter with 0 jobs -> /api/jobs/my returns 200 [] (empty list, not error)
    fresh_rec_email = f"empty.rec.{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post(
        "/api/auth/register",
        json={
            "email": fresh_rec_email,
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "full_name": "Empty Recruiter",
            "role": "RECRUITER",
            "company_name": "NewCo",
        },
    )
    assert reg.status_code == 201
    fresh_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    empty_jobs = client.get("/api/jobs/my", headers=fresh_headers)
    assert empty_jobs.status_code == 200
    assert empty_jobs.json() == []

    # Admin sees both active and inactive jobs on /api/jobs/my and /api/jobs/?active_only=false
    sarah_jobs = client.get("/api/jobs/my", headers=sarah_headers).json()
    sarah_job_id = sarah_jobs[0]["id"]
    assert client.put(f"/api/jobs/{sarah_job_id}", json={"is_active": False}, headers=sarah_headers).status_code == 200

    admin_my = client.get("/api/jobs/my", headers=admin_headers).json()
    admin_all = client.get("/api/jobs/?active_only=false", headers=admin_headers).json()
    assert any(j["id"] == sarah_job_id and j["is_active"] is False for j in admin_my)
    assert any(j["id"] == sarah_job_id and j["is_active"] is False for j in admin_all)

    # Restore job to active
    assert client.put(f"/api/jobs/{sarah_job_id}", json={"is_active": True}, headers=sarah_headers).status_code == 200
