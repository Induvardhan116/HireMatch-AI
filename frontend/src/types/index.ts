export type UserRole = 'ADMIN' | 'RECRUITER' | 'JOB_SEEKER';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  bio?: string;
  current_title?: string;
  company_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Resume {
  id: number;
  user_id: number;
  filename: string;
  file_type: string;
  file_size: number;
  is_primary: boolean;
  summary?: string;
  extracted_experience_years: number;
  skills: string[];
  categorized_skills?: Record<string, string[]>;
  education: Array<{ degree: string; field: string; year?: string; raw_text?: string }>;
  experience: Array<{ title: string; context: string }>;
  keywords: string[];
  created_at: string;
  updated_at: string;
  extracted_text?: string;
}

export interface Job {
  id: number;
  recruiter_id: number;
  title: string;
  company: string;
  department?: string;
  location: string;
  job_type: string;
  experience_level: string;
  min_experience_years: number;
  salary_range?: string;
  description: string;
  requirements?: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  applications_count?: number;
  // Recommendations augmentation
  recommendation_score?: number;
  skill_match_percentage?: number;
  matched_skills?: string[];
  missing_skills?: string[];
}

export type ApplicationStatus = 'Applied' | 'Under Review' | 'Shortlisted' | 'Rejected' | 'Selected';

export interface Application {
  id: number;
  job_id: number;
  user_id: number;
  resume_id: number;
  status: ApplicationStatus;
  match_score: number;
  skill_score: number;
  keyword_score: number;
  experience_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  cover_note?: string;
  recruiter_notes?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
  applicant?: User;
  resume?: Resume;
}

export interface KeywordMatchItem {
  keyword: string;
  in_resume: boolean;
  frequency_in_resume: number;
  importance: 'high' | 'medium' | 'low';
}

export interface ScoreBreakdown {
  overall_score: number;
  skill_score: number;
  keyword_score: number;
  experience_score: number;
  weights: {
    skills: number;
    keywords: number;
    experience: number;
  };
  scoring_formula: string;
  explanation: string;
}

export interface MatchAnalysisResult {
  match_score: number;
  breakdown: ScoreBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  job_required_skills: string[];
  resume_skills: string[];
  keyword_analysis: KeywordMatchItem[];
  experience_details: {
    score: number;
    candidate_years: number;
    required_years: number;
    difference: number;
    status: string;
  };
  recommendations: string[];
  job_title?: string;
  job_company?: string;
  candidate_name?: string;
}

export interface ResumeScreeningReportItem {
  application_id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string;
  job_id: number;
  job_title: string;
  company: string;
  match_score: number;
  skill_score: number;
  keyword_score: number;
  experience_score: number;
  matched_skills: string[];
  missing_skills: string[];
  status: string;
  applied_at: string;
  recommendations: string[];
}

export interface SkillDistributionItem {
  skill: string;
  candidate_count: number;
  percentage: number;
}

export interface CandidateSkillAnalysisReport {
  total_candidates: number;
  total_unique_skills: number;
  top_candidate_skills: SkillDistributionItem[];
  top_in_demand_job_skills: SkillDistributionItem[];
  common_skill_gaps: SkillDistributionItem[];
}

export interface JobApplicationReportItem {
  application_id: number;
  job_id: number;
  job_title: string;
  company: string;
  department?: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  match_score: number;
  applied_at: string;
  last_updated: string;
}

export interface RecruitmentSummaryReport {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  total_candidates: number;
  shortlisted_candidates: number;
  rejected_candidates: number;
  selected_candidates: number;
  under_review_candidates: number;
  applied_candidates: number;
  average_match_score: number;
  applications_by_status: Record<string, number>;
  top_hiring_roles: Array<{ role: string; applications: number }>;
}

