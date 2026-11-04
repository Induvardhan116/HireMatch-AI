import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=False) # "pdf" or "docx"
    file_size = Column(Integer, nullable=False) # bytes
    
    # Extracted data
    extracted_text = Column(Text, nullable=False)
    extracted_skills = Column(Text, default="[]") # JSON list of strings
    extracted_education = Column(Text, default="[]") # JSON list of dicts/strings
    extracted_experience_years = Column(Float, default=0.0)
    extracted_experience_details = Column(Text, default="[]") # JSON list of experiences
    extracted_keywords = Column(Text, default="[]") # JSON list of top keywords
    summary = Column(Text, nullable=True)
    is_primary = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")

    @property
    def skills_list(self):
        try:
            return json.loads(self.extracted_skills) if self.extracted_skills else []
        except:
            return []

    @property
    def education_list(self):
        try:
            return json.loads(self.extracted_education) if self.extracted_education else []
        except:
            return []

    @property
    def experience_list(self):
        try:
            return json.loads(self.extracted_experience_details) if self.extracted_experience_details else []
        except:
            return []

    @property
    def keywords_list(self):
        try:
            return json.loads(self.extracted_keywords) if self.extracted_keywords else []
        except:
            return []
