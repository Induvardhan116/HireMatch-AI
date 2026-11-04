import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=False)
    job_type = Column(String(50), default="Full-time") # Full-time, Remote, Hybrid, Contract
    experience_level = Column(String(50), default="Mid-Level") # Entry, Mid-Level, Senior, Lead
    min_experience_years = Column(Float, default=0.0)
    salary_range = Column(String(100), nullable=True)
    
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    
    required_skills = Column(Text, default="[]") # JSON list of strings
    nice_to_have_skills = Column(Text, default="[]") # JSON list of strings
    keywords = Column(Text, default="[]") # JSON list of extracted keywords
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    recruiter = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    @property
    def skills_list(self):
        try:
            return json.loads(self.required_skills) if self.required_skills else []
        except:
            return []

    @property
    def nice_skills_list(self):
        try:
            return json.loads(self.nice_to_have_skills) if self.nice_to_have_skills else []
        except:
            return []
