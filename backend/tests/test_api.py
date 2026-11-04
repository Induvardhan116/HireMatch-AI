import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_demo_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@talentmatch.ai",
        "password": "talentmatch123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_login_demo_recruiter():
    response = client.post("/api/auth/login", json={
        "email": "sarah.recruiter@cloudtech.com",
        "password": "talentmatch123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "RECRUITER"

def test_login_demo_job_seeker():
    response = client.post("/api/auth/login", json={
        "email": "elena.dev@gmail.com",
        "password": "talentmatch123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "JOB_SEEKER"

def test_register_new_candidate():
    import uuid
    rand_email = f"test.{uuid.uuid4().hex[:8]}@example.com"
    response = client.post("/api/auth/register", json={
        "email": rand_email,
        "password": "securepassword123",
        "full_name": "Test Candidate",
        "role": "JOB_SEEKER",
        "current_title": "Software Developer"
    })
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

def test_analyze_resume_endpoint():
    # Login as job seeker
    login_resp = client.post("/api/auth/login", json={
        "email": "elena.dev@gmail.com",
        "password": "talentmatch123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get first job
    jobs = client.get("/api/jobs/").json()
    job_id = jobs[0]["id"]
    
    # Analyze
    analyze_resp = client.post("/api/resumes/analyze", json={
        "job_id": job_id
    }, headers=headers)
    assert analyze_resp.status_code == 200
    result = analyze_resp.json()
    assert "match_score" in result
    assert 0 <= result["match_score"] <= 100
    assert "breakdown" in result
    assert "skill_score" in result["breakdown"]
    assert "keyword_score" in result["breakdown"]
    assert "experience_score" in result["breakdown"]
    assert "matched_skills" in result
    assert "missing_skills" in result
    assert "recommendations" in result

def test_admin_reports():
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@talentmatch.ai",
        "password": "talentmatch123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Report 1
    r1 = client.get("/api/analytics/reports/resume-screening", headers=headers)
    assert r1.status_code == 200
    assert isinstance(r1.json(), list)

    # Report 2
    r2 = client.get("/api/analytics/reports/candidate-skills", headers=headers)
    assert r2.status_code == 200
    assert "top_candidate_skills" in r2.json()

    # Report 3
    r3 = client.get("/api/analytics/reports/job-applications", headers=headers)
    assert r3.status_code == 200

    # Report 4
    r4 = client.get("/api/analytics/reports/recruitment-summary", headers=headers)
    assert r4.status_code == 200
    assert "total_jobs" in r4.json()
