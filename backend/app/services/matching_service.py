import math
import re
from typing import Dict, List, Any, Set
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings
from app.services.resume_parser import extract_skills, extract_keywords

class MatchEngine:
    """
    Explainable NLP-based Resume & Job Description Matching Engine.
    
    Formula:
    Match Score = (Skill Score * WEIGHT_SKILLS) + 
                  (Keyword Score * WEIGHT_KEYWORDS) + 
                  (Experience Score * WEIGHT_EXPERIENCE)
    
    Where:
    - Skill Score (50%): Exact and partial matching of required and nice-to-have technical skills.
    - Keyword Score (30%): TF-IDF Vectorization with Cosine Similarity between Resume and Job text.
    - Experience Score (20%): Mathematical alignment between candidate experience years and job requirements.
    """
    
    def __init__(
        self,
        weight_skills: float = settings.WEIGHT_SKILLS,
        weight_keywords: float = settings.WEIGHT_KEYWORDS,
        weight_experience: float = settings.WEIGHT_EXPERIENCE
    ):
        self.w_skills = weight_skills
        self.w_keywords = weight_keywords
        self.w_experience = weight_experience
        
        # Ensure weights normalize to 1.0
        total_weight = self.w_skills + self.w_keywords + self.w_experience
        if total_weight > 0:
            self.w_skills /= total_weight
            self.w_keywords /= total_weight
            self.w_experience /= total_weight

    def calculate_skill_score(
        self, 
        resume_skills: List[str], 
        required_skills: List[str], 
        nice_skills: List[str] = None
    ) -> Dict[str, Any]:
        if nice_skills is None:
            nice_skills = []
            
        r_skills_lower = {s.lower().strip() for s in resume_skills}
        req_skills_lower = [s.strip() for s in required_skills if s.strip()]
        nice_skills_lower = [s.strip() for s in nice_skills if s.strip()]
        
        matched_req = []
        missing_req = []
        for s in req_skills_lower:
            if s.lower() in r_skills_lower:
                matched_req.append(s)
            else:
                missing_req.append(s)
                
        matched_nice = []
        missing_nice = []
        for s in nice_skills_lower:
            if s.lower() in r_skills_lower:
                matched_nice.append(s)
            else:
                missing_nice.append(s)
                
        # Scoring: Required skills carry 80% of skill portion, nice skills carry 20%
        req_score = (len(matched_req) / len(req_skills_lower)) if req_skills_lower else 1.0
        nice_score = (len(matched_nice) / len(nice_skills_lower)) if nice_skills_lower else 1.0
        
        if req_skills_lower and nice_skills_lower:
            combined_skill_score = (req_score * 0.80 + nice_score * 0.20) * 100.0
        elif req_skills_lower:
            combined_skill_score = req_score * 100.0
        elif nice_skills_lower:
            combined_skill_score = nice_score * 100.0
        else:
            combined_skill_score = 75.0 # fallback when no explicit skills specified
            
        return {
            "score": round(min(max(combined_skill_score, 0.0), 100.0), 1),
            "matched_skills": matched_req + matched_nice,
            "missing_skills": missing_req + missing_nice,
            "req_match_ratio": f"{len(matched_req)}/{len(req_skills_lower)}" if req_skills_lower else "N/A"
        }

    def calculate_keyword_score(
        self,
        resume_text: str,
        job_description: str
    ) -> Dict[str, Any]:
        """Calculates TF-IDF Cosine Similarity and analyzes domain keyword presence."""
        cleaned_resume = resume_text.strip()
        cleaned_job = job_description.strip()
        
        if not cleaned_resume or not cleaned_job:
            return {"score": 0.0, "cosine_similarity": 0.0, "keyword_items": []}
            
        try:
            vectorizer = TfidfVectorizer(
                stop_words='english',
                ngram_range=(1, 2),
                max_features=200
            )
            tfidf_matrix = vectorizer.fit_transform([cleaned_job, cleaned_resume])
            cosine_sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
        except Exception:
            cosine_sim = 0.40 # Safe default
            
        # Cosine similarity between resumes & JDs typically ranges between 0.10 and 0.75
        # We normalize 0.15 -> 0% to 0.70 -> 100% for realistic SaaS scoring
        normalized_sim = ((cosine_sim - 0.10) / 0.55) * 100.0
        final_keyword_score = min(max(normalized_sim, 10.0), 100.0)
        
        # Extract top keywords from JD to evaluate resume coverage
        job_keywords = extract_keywords(cleaned_job, top_n=12)
        resume_text_lower = cleaned_resume.lower()
        
        keyword_analysis = []
        for kw in job_keywords:
            count = len(re.findall(rf"\b{re.escape(kw.lower())}\b", resume_text_lower))
            keyword_analysis.append({
                "keyword": kw,
                "in_resume": count > 0,
                "frequency_in_resume": count,
                "importance": "high" if count > 2 else "medium"
            })
            
        return {
            "score": round(final_keyword_score, 1),
            "cosine_similarity": round(cosine_sim, 3),
            "keyword_items": keyword_analysis
        }

    def calculate_experience_score(
        self,
        candidate_years: float,
        min_required_years: float
    ) -> Dict[str, Any]:
        """Evaluates experience parity."""
        if min_required_years <= 0.0:
            return {
                "score": 100.0,
                "candidate_years": candidate_years,
                "required_years": min_required_years,
                "difference": candidate_years,
                "status": "Qualified (No minimum requirement)"
            }
            
        ratio = candidate_years / min_required_years
        if ratio >= 1.0:
            # Full score if meets or exceeds requirement
            score = 100.0
            status = f"Fully qualified (+{round(candidate_years - min_required_years, 1)} yrs beyond min)"
        elif ratio >= 0.75:
            # Close enough for mid-to-senior roles
            score = 85.0
            status = f"Close match ({candidate_years} yrs vs {min_required_years} yrs required)"
        elif ratio >= 0.50:
            score = 65.0
            status = f"Partial match ({candidate_years} yrs vs {min_required_years} yrs required)"
        else:
            score = max(round(ratio * 70.0, 1), 25.0)
            status = f"Under required experience ({candidate_years} yrs vs {min_required_years} yrs required)"
            
        return {
            "score": round(score, 1),
            "candidate_years": round(candidate_years, 1),
            "required_years": round(min_required_years, 1),
            "difference": round(candidate_years - min_required_years, 1),
            "status": status
        }

    def generate_recommendations(
        self,
        missing_skills: List[str],
        matched_skills: List[str],
        keyword_analysis: List[Dict[str, Any]],
        experience_info: Dict[str, Any],
        overall_score: float
    ) -> List[str]:
        recommendations = []
        
        # Skill-based recommendations
        if missing_skills:
            top_missing = missing_skills[:4]
            recommendations.append(
                f"Incorporate missing core skills into your professional summary or work history: {', '.join(top_missing)}."
            )
            
        # Keyword recommendations
        missing_keywords = [k["keyword"] for k in keyword_analysis if not k["in_resume"]][:4]
        if missing_keywords:
            recommendations.append(
                f"Boost ATS visibility by integrating industry terms found in the job description: {', '.join(missing_keywords)}."
            )
            
        # Experience recommendations
        if experience_info.get("difference", 0) < 0:
            gap = abs(experience_info.get("difference", 0))
            recommendations.append(
                f"The job requires {experience_info.get('required_years')} years of experience. Highlight freelance projects, open-source contributions, or certifications to bridge the {gap}-year gap."
            )
        else:
            recommendations.append(
                "Quantify your career achievements with metrics (e.g., 'Improved API latency by 35%', 'Managed cloud infrastructure scaling to 100k users')."
            )
            
        # General formatting recommendations
        if overall_score < 60:
            recommendations.append(
                "Tailor your resume headline directly to the target job title to increase initial recruiter scan alignment."
            )
        else:
            recommendations.append(
                "Your resume aligns strongly with this position! Ensure your latest projects emphasize modern tech stacks and collaborative team impact."
            )
            
        return recommendations

    def evaluate_match(
        self,
        resume_text: str,
        resume_skills: List[str],
        candidate_years: float,
        job_description: str,
        job_required_skills: List[str],
        job_nice_skills: List[str] = None,
        job_min_years: float = 0.0,
        job_title: str = "Position",
        job_company: str = "Company",
        candidate_name: str = "Candidate"
    ) -> Dict[str, Any]:
        """Runs the complete explainable NLP scoring pipeline."""
        import re
        
        # 1. Skill evaluation
        skill_res = self.calculate_skill_score(resume_skills, job_required_skills, job_nice_skills)
        
        # 2. Keyword evaluation
        keyword_res = self.calculate_keyword_score(resume_text, job_description)
        
        # 3. Experience evaluation
        exp_res = self.calculate_experience_score(candidate_years, job_min_years)
        
        # Weighted Overall Score
        overall_score = (
            (skill_res["score"] * self.w_skills) +
            (keyword_res["score"] * self.w_keywords) +
            (exp_res["score"] * self.w_experience)
        )
        overall_score = round(min(max(overall_score, 0.0), 100.0), 1)
        
        # Recommendations
        recommendations = self.generate_recommendations(
            missing_skills=skill_res["missing_skills"],
            matched_skills=skill_res["matched_skills"],
            keyword_analysis=keyword_res["keyword_items"],
            experience_info=exp_res,
            overall_score=overall_score
        )
        
        breakdown = {
            "overall_score": overall_score,
            "skill_score": skill_res["score"],
            "keyword_score": keyword_res["score"],
            "experience_score": exp_res["score"],
            "weights": {
                "skills": round(self.w_skills, 2),
                "keywords": round(self.w_keywords, 2),
                "experience": round(self.w_experience, 2)
            },
            "scoring_formula": "Overall Score = (Skill Score * 0.50) + (Keyword Score * 0.30) + (Experience Score * 0.20)",
            "explanation": (
                f"Score breakdown: Skill match ({skill_res['score']}% weighted at 50%), "
                f"Keyword density & TF-IDF similarity ({keyword_res['score']}% weighted at 30%), "
                f"and Experience qualification ({exp_res['score']}% weighted at 20%)."
            )
        }
        
        return {
            "match_score": overall_score,
            "breakdown": breakdown,
            "matched_skills": skill_res["matched_skills"],
            "missing_skills": skill_res["missing_skills"],
            "job_required_skills": job_required_skills + (job_nice_skills or []),
            "resume_skills": resume_skills,
            "keyword_analysis": keyword_res["keyword_items"],
            "experience_details": exp_res,
            "recommendations": recommendations,
            "job_title": job_title,
            "job_company": job_company,
            "candidate_name": candidate_name
        }

matching_engine = MatchEngine()
