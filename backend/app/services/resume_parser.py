import re
import os
import pymupdf as fitz
import docx
from typing import Dict, List, Any, Tuple
from collections import Counter

# Comprehensive skill taxonomy spanning modern engineering, data, cloud, and product
SKILL_TAXONOMY = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "sql", "bash", "shell", "powershell", "html", "css", "sass", "scss",
    # Frontend
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "redux", "tailwind", "tailwind css", "bootstrap", "material-ui", "webpack", "vite", "graphql", "rest api", "html5", "css3",
    # Backend & Frameworks
    "fastapi", "django", "flask", "node.js", "express", "express.js", "spring", "spring boot", "asp.net", ".net core", "laravel", "rails", "ruby on rails", "nestjs",
    # Databases & Caching
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "mariadb", "oracle", "neo4j", "supabase", "prisma", "sqlalchemy",
    # Cloud & DevOps
    "docker", "kubernetes", "k8s", "aws", "amazon web services", "azure", "gcp", "google cloud", "terraform", "ansible", "jenkins", "github actions", "gitlab ci", "ci/cd", "helm", "linux", "nginx", "apache", "prometheus", "grafana", "datadog",
    # Data Science & AI / ML
    "machine learning", "deep learning", "ai", "artificial intelligence", "nlp", "natural language processing", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "scipy", "hugging face", "llm", "large language models", "langchain", "opencv", "data analysis", "data engineering", "spark", "hadoop", "kafka", "tableau", "power bi",
    # Methodologies & Soft Skills
    "agile", "scrum", "kanban", "git", "github", "gitlab", "jira", "unit testing", "tdd", "integration testing", "system architecture", "microservices", "leadership", "communication", "problem solving", "mentoring", "project management"
}

# Common education keywords
DEGREE_PATTERNS = [
    r"\b(ph\.?d|doctorate|doctor of philosophy)\b",
    r"\b(master(?:'s)?|m\.?s\.?|m\.?tech|m\.?sc|m\.?eng|mba)\b",
    r"\b(bachelor(?:'s)?|b\.?s\.?|b\.?tech|b\.?sc|b\.?e\.?|ba)\b",
    r"\b(associate(?:'s)?|diploma)\b"
]

FIELD_PATTERNS = [
    r"computer science", r"information technology", r"software engineering",
    r"data science", r"electrical engineering", r"electronics",
    r"cybersecurity", r"artificial intelligence", r"mathematics", r"statistics"
]

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text() + "\n"
    return text.strip()

def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        if para.text:
            full_text.append(para.text)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text:
                    full_text.append(cell.text)
    return "\n".join(full_text).strip()

def extract_text(file_path: str, file_type: str) -> str:
    if file_type.lower() in ["pdf", "application/pdf"]:
        return extract_text_from_pdf(file_path)
    elif file_type.lower() in ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        return extract_text_from_docx(file_path)
    else:
        # Fallback text reading
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception as e:
            raise ValueError(f"Unsupported file format or unreadable file: {str(e)}")

def extract_skills(text: str) -> List[str]:
    text_lower = " " + text.lower() + " "
    matched_skills = set()
    
    for skill in SKILL_TAXONOMY:
        # Escape for regex
        escaped_skill = re.escape(skill)
        # Match boundary
        pattern = rf"(?<![a-zA-Z0-9_#+]){escaped_skill}(?![a-zA-Z0-9_#+])"
        if re.search(pattern, text_lower):
            # Canonical display format
            matched_skills.add(format_skill_name(skill))
            
    return sorted(list(matched_skills))

def format_skill_name(skill: str) -> str:
    mapping = {
        "javascript": "JavaScript", "typescript": "TypeScript", "python": "Python",
        "react": "React", "react.js": "React", "vue": "Vue.js", "vue.js": "Vue.js",
        "next.js": "Next.js", "node.js": "Node.js", "express": "Express.js",
        "express.js": "Express.js", "fastapi": "FastAPI", "django": "Django",
        "flask": "Flask", "c++": "C++", "c#": "C#", "sql": "SQL", "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB", "redis": "Redis",
        "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes", "aws": "AWS",
        "amazon web services": "AWS", "azure": "Azure", "gcp": "GCP", "google cloud": "Google Cloud",
        "ci/cd": "CI/CD", "github actions": "GitHub Actions", "terraform": "Terraform",
        "html": "HTML5", "html5": "HTML5", "css": "CSS3", "css3": "CSS3",
        "tailwind": "Tailwind CSS", "tailwind css": "Tailwind CSS", "machine learning": "Machine Learning",
        "deep learning": "Deep Learning", "ai": "AI", "nlp": "NLP", "scikit-learn": "Scikit-Learn",
        "tensorflow": "TensorFlow", "pytorch": "PyTorch", "llm": "LLMs", "git": "Git",
        "jira": "Jira", "agile": "Agile", "scrum": "Scrum"
    }
    return mapping.get(skill.lower(), skill.title())

def extract_experience_years(text: str) -> float:
    """Estimates years of experience using multiple pattern matching heuristics."""
    text_lower = text.lower()
    
    # 1. Look for explicit mentions like "5+ years of experience", "3 years experience"
    exp_patterns = [
        r"(\d+(?:\.\d+)?)\+?\s*(?:to\s*\d+\s*)?years?(?:\s*of)?\s*(?:experience|exp)",
        r"(?:experience|exp):\s*(\d+(?:\.\d+)?)\+?\s*years?",
        r"(\d+(?:\.\d+)?)\s*yrs?\s*(?:of)?\s*(?:experience|exp)"
    ]
    
    found_years = []
    for pattern in exp_patterns:
        matches = re.findall(pattern, text_lower)
        for m in matches:
            try:
                val = float(m)
                if 0.5 <= val <= 40:
                    found_years.append(val)
            except ValueError:
                pass
                
    if found_years:
        return max(found_years)
        
    # 2. Look for year ranges like "2018 - 2023", "2019 - Present"
    year_ranges = re.findall(r"\b(20[0-2][0-9]|199[0-9])\s*[-–—to]+\s*(20[0-2][0-9]|present|current|now)\b", text_lower)
    total_span = 0.0
    current_year = 2026
    
    spans = []
    for start_yr, end_yr in year_ranges:
        try:
            start = int(start_yr)
            end = current_year if end_yr in ["present", "current", "now"] else int(end_yr)
            if end >= start and (end - start) <= 30:
                spans.append(end - start)
        except ValueError:
            pass
            
    if spans:
        # Sum of non-overlapping spans roughly estimated by max start-to-end or sum capped
        return float(min(sum(spans), 25.0))
        
    return 1.0 # default fallback

def extract_education(text: str) -> List[Dict[str, str]]:
    text_lines = text.split("\n")
    education_records = []
    
    degree_map = {
        "ph.d": "Ph.D. / Doctorate",
        "doctorate": "Ph.D. / Doctorate",
        "master": "Master's Degree (M.S. / M.Tech / MBA)",
        "m.s": "Master's Degree (M.S.)",
        "m.tech": "Master of Technology (M.Tech)",
        "mba": "Master of Business Administration (MBA)",
        "bachelor": "Bachelor's Degree (B.S. / B.Tech)",
        "b.s": "Bachelor of Science (B.S.)",
        "b.tech": "Bachelor of Technology (B.Tech)",
        "b.e": "Bachelor of Engineering (B.E.)",
        "diploma": "Diploma"
    }
    
    for line in text_lines:
        line_clean = line.strip()
        if len(line_clean) < 4 or len(line_clean) > 200:
            continue
            
        line_lower = line_clean.lower()
        matched_degree = None
        for deg_key, deg_label in degree_map.items():
            if deg_key in line_lower:
                matched_degree = deg_label
                break
                
        if matched_degree:
            # Check field
            matched_field = "Computer Science / Information Technology"
            for field in FIELD_PATTERNS:
                if re.search(field, line_lower):
                    matched_field = field.title()
                    break
                    
            # Check graduation year
            yr_match = re.search(r"\b(20[0-2][0-9]|199[0-9])\b", line_clean)
            grad_year = yr_match.group(1) if yr_match else None
            
            education_records.append({
                "degree": matched_degree,
                "field": matched_field,
                "raw_text": line_clean[:120],
                "year": grad_year
            })
            
    if not education_records:
        # Generic degree detection if keywords exist anywhere
        text_lower = text.lower()
        if "master" in text_lower or "m.tech" in text_lower or "m.s." in text_lower:
            education_records.append({"degree": "Master's Degree", "field": "Relevant Engineering / Science Field", "year": "N/A"})
        elif "bachelor" in text_lower or "b.tech" in text_lower or "b.s." in text_lower or "degree" in text_lower:
            education_records.append({"degree": "Bachelor's Degree", "field": "Relevant Engineering / Science Field", "year": "N/A"})
            
    return education_records[:3] # keep top 3

def extract_experience_details(text: str) -> List[Dict[str, Any]]:
    """Identifies work experiences / project sections."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    experiences = []
    
    # Common job titles
    job_titles = [
        "software engineer", "full stack developer", "frontend developer", "backend developer",
        "devops engineer", "cloud architect", "data engineer", "data scientist",
        "machine learning engineer", "solutions architect", "system administrator",
        "intern", "technical lead", "engineering manager", "qa engineer", "product manager"
    ]
    
    for i, line in enumerate(lines[:100]):
        line_lower = line.lower()
        for title in job_titles:
            if title in line_lower:
                snippet = " ".join(lines[i:min(i+4, len(lines))])
                experiences.append({
                    "title": title.title(),
                    "context": snippet[:200]
                })
                break
        if len(experiences) >= 5:
            break
            
    return experiences

def extract_keywords(text: str, top_n: int = 15) -> List[str]:
    """Extracts top significant domain keywords using word frequency excluding common stopwords."""
    stopwords = {
        "the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with",
        "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "all", "have",
        "new", "more", "an", "was", "we", "will", "home", "can", "us", "about", "if", "page",
        "my", "has", "search", "free", "but", "our", "one", "other", "do", "no", "information",
        "time", "they", "site", "he", "up", "may", "what", "which", "their", "news", "out",
        "use", "any", "there", "see", "only", "so", "his", "when", "contact", "here", "business",
        "who", "web", "also", "now", "help", "get", "pm", "view", "online", "c", "e", "first",
        "am", "been", "would", "how", "were", "me", "s", "services", "some", "these", "click",
        "its", "like", "service", "than", "find", "price", "date", "back", "top", "people",
        "had", "list", "name", "just", "over", "state", "year", "day", "into", "email", "two",
        "health", "n", "world", "re", "next", "used", "go", "b", "work", "last", "most", "products",
        "music", "buy", "data", "make", "them", "should", "product", "system", "post", "her",
        "city", "t", "add", "policy", "number", "such", "please", "available", "copyright",
        "support", "message", "after", "best", "software", "then", "jan", "feb", "mar", "apr", "may",
        "jun", "jul", "aug", "sep", "oct", "nov", "dec", "present", "years", "year", "experience"
    }
    
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    filtered = [w for w in words if w not in stopwords and len(w) > 2]
    counts = Counter(filtered)
    
    top_items = [word.capitalize() for word, _ in counts.most_common(top_n)]
    return top_items

def parse_resume(file_path: str, file_type: str) -> Dict[str, Any]:
    """Comprehensive parser pipeline for PDF and DOCX files."""
    extracted_text = extract_text(file_path, file_type)
    skills = extract_skills(extracted_text)
    exp_years = extract_experience_years(extracted_text)
    education = extract_education(extracted_text)
    exp_details = extract_experience_details(extracted_text)
    keywords = extract_keywords(extracted_text, top_n=20)
    
    # Generate clean summary
    first_lines = [l.strip() for l in extracted_text.split("\n") if len(l.strip()) > 30][:3]
    summary = " ".join(first_lines)
    if len(summary) > 400:
        summary = summary[:397] + "..."
    elif not summary:
        summary = f"Professional with {exp_years} years of demonstrated experience specializing in {', '.join(skills[:4])}."
        
    return {
        "extracted_text": extracted_text,
        "skills": skills,
        "experience_years": exp_years,
        "education": education,
        "experience_details": exp_details,
        "keywords": keywords,
        "summary": summary
    }
