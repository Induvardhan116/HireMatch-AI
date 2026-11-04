import enum
import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class ApplicationStatus(str, enum.Enum):
    APPLIED = "Applied"
    UNDER_REVIEW = "Under Review"
    SHORTLISTED = "Shortlisted"
    REJECTED = "Rejected"
    SELECTED = "Selected"

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint('job_id', 'user_id', name='uq_job_user_application'),
    )

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    
    # AI Match Details
    match_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    keyword_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    matched_skills = Column(Text, default="[]") # JSON list
    missing_skills = Column(Text, default="[]") # JSON list
    recommendations = Column(Text, default="[]") # JSON list
    
    cover_note = Column(Text, nullable=True)
    recruiter_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="applications")
    applicant = relationship("User", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")

    @property
    def matched_skills_list(self):
        try:
            return json.loads(self.matched_skills) if self.matched_skills else []
        except:
            return []

    @property
    def missing_skills_list(self):
        try:
            return json.loads(self.missing_skills) if self.missing_skills else []
        except:
            return []

    @property
    def recommendations_list(self):
        try:
            return json.loads(self.recommendations) if self.recommendations else []
        except:
            return []
