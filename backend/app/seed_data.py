import json
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.resume import Resume
from app.models.application import Application, ApplicationStatus
from app.services.auth_service import get_password_hash
from app.services.matching_service import matching_engine

def seed_database(db: Session):
    """Populates realistic demonstration data if database is empty."""
    if db.query(User).first():
        return # Already seeded

    print("[TalentMatch AI] Seeding database with initial data...")

    # 1. Create Default Users (Password: 'talentmatch123' for all)
    pw = get_password_hash("talentmatch123")
    
    admin = User(
        email="admin@talentmatch.ai",
        hashed_password=pw,
        full_name="Alex Vance (Admin)",
        role=UserRole.ADMIN,
        current_title="System Director",
        is_active=True
    )
    
    recruiter1 = User(
        email="sarah.recruiter@cloudtech.com",
        hashed_password=pw,
        full_name="Sarah Jenkins",
        role=UserRole.RECRUITER,
        company_name="CloudScale Technologies",
        current_title="Principal Technical Recruiter",
        is_active=True
    )
    
    recruiter2 = User(
        email="david.talent@apexai.io",
        hashed_password=pw,
        full_name="David Patel",
        role=UserRole.RECRUITER,
        company_name="Apex AI Labs",
        current_title="Head of Talent Acquisition",
        is_active=True
    )
    
    seeker1 = User(
        email="elena.dev@gmail.com",
        hashed_password=pw,
        full_name="Elena Rostova",
        role=UserRole.JOB_SEEKER,
        current_title="Senior Full Stack Engineer",
        phone="+1 (555) 234-5678",
        bio="Passionate engineer with 6+ years designing scalable cloud architectures, React frontends, and Python microservices.",
        is_active=True
    )

    seeker2 = User(
        email="marcus.cloud@outlook.com",
        hashed_password=pw,
        full_name="Marcus Brody",
        role=UserRole.JOB_SEEKER,
        current_title="DevOps & Cloud Engineer",
        phone="+1 (555) 876-5432",
        bio="DevOps practitioner specialized in Kubernetes, Docker, Terraform, CI/CD pipelines, and AWS high-availability infrastructure.",
        is_active=True
    )

    seeker3 = User(
        email="ananya.data@yahoo.com",
        hashed_password=pw,
        full_name="Ananya Sharma",
        role=UserRole.JOB_SEEKER,
        current_title="Machine Learning & Data Engineer",
        phone="+1 (555) 345-6789",
        bio="Data scientist specializing in NLP, predictive analytics, Scikit-Learn, PyTorch, and distributed data pipelines.",
        is_active=True
    )

    db.add_all([admin, recruiter1, recruiter2, seeker1, seeker2, seeker3])
    db.commit()
    db.refresh(recruiter1)
    db.refresh(recruiter2)
    db.refresh(seeker1)
    db.refresh(seeker2)
    db.refresh(seeker3)

    # 2. Create Realistic Jobs
    job1 = Job(
        recruiter_id=recruiter1.id,
        title="Senior Full-Stack Engineer (React / Python)",
        company="CloudScale Technologies",
        department="Platform Engineering",
        location="San Francisco, CA (Hybrid)",
        job_type="Full-time",
        experience_level="Senior",
        min_experience_years=5.0,
        salary_range="$140,000 - $175,000",
        description="We are seeking an experienced Full Stack Engineer to lead architecture on our cloud-native web portal. You will build high-performance microservices in FastAPI, design elegant interfaces with React & TypeScript, and optimize SQL databases for millions of daily queries.",
        requirements="5+ years software engineering experience. Deep mastery of Python, FastAPI/Django, React, TypeScript, PostgreSQL, and Docker containerization. Solid understanding of REST APIs and microservice patterns.",
        required_skills=json.dumps(["Python", "React", "TypeScript", "FastAPI", "PostgreSQL", "Docker", "REST API"]),
        nice_to_have_skills=json.dumps(["Kubernetes", "AWS", "Redis", "CI/CD"]),
        is_active=True
    )

    job2 = Job(
        recruiter_id=recruiter1.id,
        title="DevOps & Infrastructure Engineer",
        company="CloudScale Technologies",
        department="Site Reliability",
        location="Remote (US / Canada)",
        job_type="Remote",
        experience_level="Mid-Level",
        min_experience_years=3.0,
        salary_range="$120,000 - $150,000",
        description="Join our Infrastructure team managing multi-region Kubernetes clusters. Automate zero-downtime CI/CD deployments using GitHub Actions, maintain infrastructure as code with Terraform, and implement proactive observability with Prometheus & Grafana.",
        requirements="3+ years in DevOps or SRE. Proven experience with Kubernetes, Docker, AWS, Terraform, Linux systems, and GitHub Actions. Strong scripting skills in Bash or Python.",
        required_skills=json.dumps(["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Linux", "GitHub Actions"]),
        nice_to_have_skills=json.dumps(["Python", "Prometheus", "Grafana", "Helm"]),
        is_active=True
    )

    job3 = Job(
        recruiter_id=recruiter2.id,
        title="Lead AI & NLP Engineer",
        company="Apex AI Labs",
        department="AI Research & Products",
        location="New York, NY (On-site)",
        job_type="Full-time",
        experience_level="Lead",
        min_experience_years=6.0,
        salary_range="$170,000 - $210,000",
        description="Lead research and implementation of next-generation NLP text matching, LLM integration, and document classification pipelines. Architect production ML model inference with Scikit-Learn, PyTorch, and FastAPI.",
        requirements="6+ years experience in Applied Machine Learning / NLP. Strong proficiency in Python, Scikit-Learn, PyTorch, TF-IDF, Transformer architectures, and vector embeddings.",
        required_skills=json.dumps(["Python", "Machine Learning", "NLP", "Scikit-Learn", "PyTorch", "FastAPI"]),
        nice_to_have_skills=json.dumps(["LLMs", "Docker", "PostgreSQL", "Data Analysis"]),
        is_active=True
    )

    job4 = Job(
        recruiter_id=recruiter2.id,
        title="Frontend UI/UX Developer",
        company="Apex AI Labs",
        department="Design & Web",
        location="Austin, TX (Hybrid)",
        job_type="Full-time",
        experience_level="Mid-Level",
        min_experience_years=3.0,
        salary_range="$110,000 - $135,000",
        description="Craft sleek, responsive user interfaces for our AI web applications. Collaborate with designers to translate Figma mockups into reusable React components using Tailwind CSS and TypeScript.",
        requirements="3+ years frontend web engineering. Expert in React, TypeScript, Tailwind CSS, Responsive Design, and modern state management.",
        required_skills=json.dumps(["React", "TypeScript", "Tailwind CSS", "JavaScript", "HTML5", "CSS3"]),
        nice_to_have_skills=json.dumps(["Vite", "Git", "REST API", "Jira"]),
        is_active=True
    )

    db.add_all([job1, job2, job3, job4])
    db.commit()
    db.refresh(job1)
    db.refresh(job2)
    db.refresh(job3)
    db.refresh(job4)

    # 3. Create Sample Resumes for Job Seekers
    elena_text = """
    Elena Rostova - Senior Full Stack Engineer
    San Francisco, CA | elena.dev@gmail.com | (555) 234-5678 | github.com/elenarostova
    
    PROFESSIONAL SUMMARY
    Senior Software Engineer with 6 years of hands-on experience designing and deploying cloud-native web applications. Proven track record building enterprise React/TypeScript SPAs and high-throughput Python FastAPI microservices. Led database optimization in PostgreSQL improving query times by 40%.
    
    CORE SKILLS
    Languages & Frameworks: Python, JavaScript, TypeScript, FastAPI, Django, React, Next.js, Node.js, HTML5, CSS3, Tailwind CSS
    Databases & Cloud: PostgreSQL, MySQL, Redis, Docker, AWS, Git, CI/CD, REST API, Microservices
    
    PROFESSIONAL EXPERIENCE
    Senior Full Stack Developer | Horizon Cloud (2021 - Present)
    - Architected scalable SaaS platform using React, TypeScript, and FastAPI supporting 250,000 active monthly users.
    - Designed relational PostgreSQL schemas with optimized indexing and SQLAlchemy ORM.
    - Containerized microservices with Docker and integrated GitHub Actions for continuous testing.
    
    Software Engineer | Nexus Interactive (2018 - 2021)
    - Developed customer-facing web dashboards using React, Redux, and REST APIs.
    - Created Python automation scripts and unit tests, raising test coverage to 92%.
    
    EDUCATION
    Bachelor of Science in Computer Science | University of California, Berkeley (2014 - 2018)
    """

    marcus_text = """
    Marcus Brody - DevOps & Cloud Infrastructure Engineer
    Seattle, WA | marcus.cloud@outlook.com | (555) 876-5432
    
    PROFESSIONAL SUMMARY
    DevOps and Cloud Engineer with 4 years of experience orchestrating Kubernetes clusters, AWS cloud infrastructure, and CI/CD pipelines. Passionate about automated testing, infrastructure as code with Terraform, and robust Linux system administration.
    
    TECHNICAL SKILLS
    Cloud & DevOps: Kubernetes, Docker, AWS, Terraform, Linux, CI/CD, GitHub Actions, Helm, Prometheus, Grafana, Bash
    Languages: Python, Bash, Shell, YAML, SQL
    
    WORK EXPERIENCE
    Cloud Operations Engineer | Strato Systems (2022 - Present)
    - Managed production Kubernetes (EKS) clusters across multi-AZ AWS environments.
    - Provisioned infrastructure using Terraform modules, eliminating configuration drift.
    - Built automated GitHub Actions CI/CD workflows for 15+ containerized microservices.
    
    DevOps Specialist | CloudWave Ltd (2020 - 2022)
    - Maintained Docker containers and Linux virtual servers with 99.98% uptime.
    - Configured monitoring dashboards in Grafana and alerting rules via Prometheus.
    
    EDUCATION
    Bachelor of Engineering in Information Technology | University of Washington (2016 - 2020)
    """

    resume1 = Resume(
        user_id=seeker1.id,
        filename="Elena_Rostova_Resume.pdf",
        file_path="uploads/seed_elena_resume.pdf",
        file_type="pdf",
        file_size=142850,
        extracted_text=elena_text.strip(),
        extracted_skills=json.dumps(["Python", "JavaScript", "TypeScript", "FastAPI", "Django", "React", "Next.js", "PostgreSQL", "Docker", "AWS", "REST API", "Tailwind CSS", "Git"]),
        extracted_education=json.dumps([{"degree": "Bachelor of Science", "field": "Computer Science", "year": "2018"}]),
        extracted_experience_years=6.0,
        extracted_experience_details=json.dumps([
            {"title": "Senior Full Stack Developer", "context": "Horizon Cloud - React, TypeScript, FastAPI"},
            {"title": "Software Engineer", "context": "Nexus Interactive - React, Python"}
        ]),
        extracted_keywords=json.dumps(["Microservices", "Scalable", "Architecture", "Optimization", "Database", "Containerized"]),
        summary="Senior Software Engineer with 6 years experience designing cloud-native web applications with React, TypeScript, and FastAPI.",
        is_primary=True
    )

    resume2 = Resume(
        user_id=seeker2.id,
        filename="Marcus_Brody_DevOps.pdf",
        file_path="uploads/seed_marcus_resume.pdf",
        file_type="pdf",
        file_size=125400,
        extracted_text=marcus_text.strip(),
        extracted_skills=json.dumps(["Kubernetes", "Docker", "AWS", "Terraform", "Linux", "CI/CD", "GitHub Actions", "Prometheus", "Grafana", "Python", "Git"]),
        extracted_education=json.dumps([{"degree": "Bachelor of Engineering", "field": "Information Technology", "year": "2020"}]),
        extracted_experience_years=4.0,
        extracted_experience_details=json.dumps([
            {"title": "Cloud Operations Engineer", "context": "Strato Systems - Kubernetes, Terraform, AWS"},
            {"title": "DevOps Specialist", "context": "CloudWave - Docker, Linux, Grafana"}
        ]),
        extracted_keywords=json.dumps(["Kubernetes", "Infrastructure", "Automation", "Monitoring", "Reliability", "Pipelines"]),
        summary="DevOps engineer with 4 years experience orchestrating Kubernetes, AWS, Terraform, and automated CI/CD deployments.",
        is_primary=True
    )

    db.add_all([resume1, resume2])
    db.commit()
    db.refresh(resume1)
    db.refresh(resume2)

    # 4. Generate Initial Applications with AI Match Scores
    # Elena applies for Job 1 (Senior Full-Stack Engineer) -> Super strong match!
    elena_job1_match = matching_engine.evaluate_match(
        resume_text=resume1.extracted_text,
        resume_skills=resume1.skills_list,
        candidate_years=resume1.extracted_experience_years,
        job_description=f"{job1.title}\n{job1.description}\n{job1.requirements}",
        job_required_skills=job1.skills_list,
        job_nice_skills=job1.nice_skills_list,
        job_min_years=job1.min_experience_years,
        job_title=job1.title,
        job_company=job1.company
    )

    app1 = Application(
        job_id=job1.id,
        user_id=seeker1.id,
        resume_id=resume1.id,
        status=ApplicationStatus.SHORTLISTED,
        match_score=elena_job1_match["match_score"],
        skill_score=elena_job1_match["breakdown"]["skill_score"],
        keyword_score=elena_job1_match["breakdown"]["keyword_score"],
        experience_score=elena_job1_match["breakdown"]["experience_score"],
        matched_skills=json.dumps(elena_job1_match["matched_skills"]),
        missing_skills=json.dumps(elena_job1_match["missing_skills"]),
        recommendations=json.dumps(elena_job1_match["recommendations"]),
        cover_note="I am very excited about the Senior Full-Stack role at CloudScale! My expertise in React and FastAPI aligns directly with your platform needs.",
        recruiter_notes="Candidate has outstanding match score and strong experience with FastAPI and React. Fast-tracked to technical interview round."
    )

    # Marcus applies for Job 2 (DevOps) -> Outstanding match!
    marcus_job2_match = matching_engine.evaluate_match(
        resume_text=resume2.extracted_text,
        resume_skills=resume2.skills_list,
        candidate_years=resume2.extracted_experience_years,
        job_description=f"{job2.title}\n{job2.description}\n{job2.requirements}",
        job_required_skills=job2.skills_list,
        job_nice_skills=job2.nice_skills_list,
        job_min_years=job2.min_experience_years,
        job_title=job2.title,
        job_company=job2.company
    )

    app2 = Application(
        job_id=job2.id,
        user_id=seeker2.id,
        resume_id=resume2.id,
        status=ApplicationStatus.UNDER_REVIEW,
        match_score=marcus_job2_match["match_score"],
        skill_score=marcus_job2_match["breakdown"]["skill_score"],
        keyword_score=marcus_job2_match["breakdown"]["keyword_score"],
        experience_score=marcus_job2_match["breakdown"]["experience_score"],
        matched_skills=json.dumps(marcus_job2_match["matched_skills"]),
        missing_skills=json.dumps(marcus_job2_match["missing_skills"]),
        recommendations=json.dumps(marcus_job2_match["recommendations"]),
        cover_note="I have spent the past 4 years managing production Kubernetes on AWS and writing clean Terraform modules.",
        recruiter_notes="Reviewing candidate's GitHub repositories and infrastructure projects."
    )

    db.add_all([app1, app2])
    db.commit()
    print("[TalentMatch AI] Database seeded successfully with demo users, jobs, and applications.")

