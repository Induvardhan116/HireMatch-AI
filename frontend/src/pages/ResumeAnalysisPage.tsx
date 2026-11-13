import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
  RefreshCw,
  Search,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { extractApiError, fetchMatcherJobs } from '../services/jobService';
import { Resume, Job, MatchAnalysisResult } from '../types';
import { ScoreMeter } from '../components/common/ScoreMeter';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ResumeAnalysisPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const requestedJobIdParam = searchParams.get('jobId');
  const requestedJobId = requestedJobIdParam ? Number(requestedJobIdParam) : NaN;
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Input modes: 'select' or 'custom'
  const [resumeMode, setResumeMode] = useState<'select' | 'custom'>('select');
  const [jobMode, setJobMode] = useState<'select' | 'custom'>('select');

  // Selected values
  const [selectedResumeId, setSelectedResumeId] = useState<number | ''>('');
  const [customResumeText, setCustomResumeText] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobDesc, setCustomJobDesc] = useState('');
  const [settingPrimary, setSettingPrimary] = useState(false);

  // Results
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MatchAnalysisResult | null>(null);
  const hasAutoAnalyzedRef = useRef(false);

  const isRecruiterOrAdmin = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  const loadResources = useCallback(async () => {
    if (authLoading) return;
    setLoadingInitial(true);
    setJobsError(null);
    setResumesError(null);

    let loadFailureMessage: string | null = null;

    try {
      const jobList = await fetchMatcherJobs(user?.role);
      setJobs(jobList);
      if (jobList.length > 0) {
        const matchedRequested = Number.isFinite(requestedJobId)
          ? jobList.find((j) => j.id === requestedJobId)
          : undefined;
        if (matchedRequested) {
          setSelectedJobId(matchedRequested.id);
          setJobMode('select');
        } else {
          setSelectedJobId((prev) => (prev && jobList.some((j) => j.id === prev) ? prev : jobList[0].id));
        }
      } else {
        setSelectedJobId('');
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      const msg = extractApiError(err, 'Failed to load job postings.');
      setJobs([]);
      setSelectedJobId('');
      setJobsError(msg);
      loadFailureMessage = msg;
    }

    if (user) {
      try {
        const resumesRes = await api.get<Resume[]>('/resumes/');
        const resumeList = Array.isArray(resumesRes.data) ? resumesRes.data : [];
        setResumes(resumeList);
        if (resumeList.length > 0) {
          const primary = resumeList.find((r) => r.is_primary) || resumeList[0];
          setSelectedResumeId(primary.id);
          setResumeMode('select');
        } else {
          setSelectedResumeId('');
        }
      } catch (err: any) {
        const msg = extractApiError(err, 'Failed to load candidate resumes.');
        setResumes([]);
        setSelectedResumeId('');
        setResumesError(msg);
        if (!loadFailureMessage) {
          loadFailureMessage = msg;
        }
      }
    } else {
      setResumes([]);
      setSelectedResumeId('');
      setResumeMode('custom');
    }

    if (loadFailureMessage) {
      showToast(loadFailureMessage, 'error');
    }

    setLoadingInitial(false);
  }, [authLoading, user?.id, user?.role, requestedJobId, showToast]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleSetActiveResume = async (resumeId: number) => {
    setSettingPrimary(true);
    try {
      await api.patch<Resume>(`/resumes/${resumeId}/primary`);
      const resumesRes = await api.get<Resume[]>('/resumes/');
      setResumes(resumesRes.data);
      setSelectedResumeId(resumeId);
      showToast('Active ATS resume updated!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to set active resume.', 'error');
    } finally {
      setSettingPrimary(false);
    }
  };

  const handleRunAnalysis = useCallback(async () => {
    setAnalysisError(null);
    // Validation
    if (resumeMode === 'select' && !selectedResumeId) {
      showToast('Please select a resume or switch to paste custom resume text.', 'error');
      return;
    }
    if (resumeMode === 'custom' && !customResumeText.trim()) {
      showToast('Please paste resume text to analyze.', 'error');
      return;
    }
    if (jobMode === 'select' && !selectedJobId) {
      showToast('Please select a target job position.', 'error');
      return;
    }
    if (jobMode === 'custom' && !customJobDesc.trim()) {
      showToast('Please paste a job description.', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const payload: any = {};
      if (resumeMode === 'select') {
        payload.resume_id = Number(selectedResumeId);
      } else {
        payload.custom_resume_text = customResumeText;
      }

      if (jobMode === 'select') {
        payload.job_id = Number(selectedJobId);
      } else {
        payload.custom_job_description = customJobDesc;
        payload.custom_job_title = customJobTitle || 'Custom Target Role';
      }

      const resp = await api.post<MatchAnalysisResult>('/resumes/analyze', payload);
      setAnalysisResult(resp.data);
      showToast('Match analysis calculated successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to compute match analysis.';
      setAnalysisError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      showToast(typeof msg === 'string' ? msg : 'Match analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [resumeMode, selectedResumeId, customResumeText, jobMode, selectedJobId, customJobDesc, customJobTitle]);

  // Run automatically on initial load when user has a selected resume and job
  useEffect(() => {
    if (
      !hasAutoAnalyzedRef.current &&
      selectedResumeId &&
      selectedJobId &&
      !analysisResult &&
      !analysisError &&
      !loadingInitial &&
      !analyzing
    ) {
      hasAutoAnalyzedRef.current = true;
      handleRunAnalysis();
    }
  }, [loadingInitial, selectedResumeId, selectedJobId, analysisResult, analysisError, analyzing, handleRunAnalysis]);

  const selectedResumeObj = resumes.find((r) => r.id === Number(selectedResumeId)) || null;

  if (loadingInitial) {
    return <LoadingSpinner message="Initializing ATS Matcher engine..." />;
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Explainable NLP ATS Analyzer</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Match Analysis</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Evaluate how well your resume matches target job postings. Our explainable algorithm scores 50% technical skills, 30% keyword TF-IDF similarity, and 20% experience duration.
        </p>
      </div>

      {/* Input Selection Panel (Jobscan Style: Left Resume, Right Job) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Resume Source */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>1. Candidate Resume</span>
              </h3>
              <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setResumeMode('select')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    resumeMode === 'select' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Saved File
                </button>
                <button
                  type="button"
                  onClick={() => setResumeMode('custom')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    resumeMode === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {resumeMode === 'select' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-600">
                    {isRecruiterOrAdmin
                      ? `Select Candidate Resume (${resumes.length})`
                      : `Choose Uploaded Resume (${resumes.length})`}
                  </label>
                  {user?.role === 'JOB_SEEKER' && (
                    <Link
                      to="/dashboard/resumes"
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload New</span>
                    </Link>
                  )}
                </div>

                {resumesError ? (
                  <div className="p-4 bg-rose-50 rounded-xl text-xs text-rose-700 border border-rose-200 flex items-center justify-between gap-2">
                    <span>{resumesError}</span>
                    <button
                      type="button"
                      onClick={loadResources}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 font-semibold text-[11px] hover:bg-rose-100"
                    >
                      Retry
                    </button>
                  </div>
                ) : !user ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100 space-y-2">
                    <p>Sign in to select from your saved resumes, or use "Paste Text".</p>
                    <Link
                      to="/login"
                      className="inline-block px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-[11px]"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : resumes.length > 0 ? (
                  <>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {isRecruiterOrAdmin && r.candidate_name ? `${r.candidate_name} — ` : ''}
                          {r.filename} {r.is_primary && !isRecruiterOrAdmin ? '(Active)' : ''} ({r.extracted_experience_years} yrs exp, {r.skills?.length || 0} skills)
                        </option>
                      ))}
                    </select>

                    {selectedResumeObj && (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {isRecruiterOrAdmin && selectedResumeObj.candidate_name
                              ? `${selectedResumeObj.candidate_name} (${selectedResumeObj.filename})`
                              : `Selected: ${selectedResumeObj.filename}`}
                          </span>
                          {!isRecruiterOrAdmin && (
                            selectedResumeObj.is_primary ? (
                              <Badge variant="success" size="sm">Active Resume</Badge>
                            ) : (
                              <button
                                type="button"
                                disabled={settingPrimary}
                                onClick={() => handleSetActiveResume(selectedResumeObj.id)}
                                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 transition disabled:opacity-50"
                              >
                                {settingPrimary ? 'Setting...' : 'Set Active'}
                              </button>
                            )
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedResumeObj.skills?.slice(0, 8).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-600"
                            >
                              {s}
                            </span>
                          ))}
                          {selectedResumeObj.skills && selectedResumeObj.skills.length > 8 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{selectedResumeObj.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100 space-y-2">
                    <p>
                      {isRecruiterOrAdmin
                        ? 'No candidate resumes available yet. Switch to "Paste Text" to screen a custom resume.'
                        : 'No resumes uploaded yet. Switch to "Paste Text" or upload a PDF/DOCX resume.'}
                    </p>
                    {user?.role === 'JOB_SEEKER' && (
                      <Link
                        to="/dashboard/resumes"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px]"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Resume</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Paste Resume Text</label>
                <textarea
                  value={customResumeText}
                  onChange={(e) => setCustomResumeText(e.target.value)}
                  placeholder="Paste your raw resume text, skills, and work history here..."
                  rows={5}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Right: Job Description Source */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>2. Target Job Description</span>
              </h3>
              <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setJobMode('select')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    jobMode === 'select' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Platform Job
                </button>
                <button
                  type="button"
                  onClick={() => setJobMode('custom')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    jobMode === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Custom JD
                </button>
              </div>
            </div>

            {jobMode === 'select' ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-600">
                  {user?.role === 'RECRUITER'
                    ? `Choose Your Job Posting (${jobs.length})`
                    : `Choose Job Posting (${jobs.length})`}
                </label>

                {jobsError ? (
                  <div className="p-4 bg-rose-50 rounded-xl text-xs text-rose-700 border border-rose-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{jobsError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={loadResources}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 font-semibold text-[11px] hover:bg-rose-100 shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                ) : jobs.length > 0 ? (
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(Number(e.target.value))}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} @ {j.company} ({j.location}){!j.is_active ? ' [Closed]' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100 space-y-2">
                    <p>
                      {user?.role === 'RECRUITER'
                        ? 'You have not posted any jobs yet. Create a job posting or switch to "Custom JD".'
                        : 'No job postings found. Switch to "Custom JD" to paste a job description.'}
                    </p>
                    {isRecruiterOrAdmin && (
                      <Link
                        to={user?.role === 'ADMIN' ? '/admin/jobs?create=1' : '/recruiter/jobs?create=1'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px]"
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>Post a Job</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Job Title</label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Paste Job Description</label>
                  <textarea
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                    placeholder="Paste job requirements, required technologies, qualifications..."
                    rows={4}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {analysisError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running NLP Comparison...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Calculate ATS Match Score</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Row: Overall Score & 3-Factor Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Circular Gauge Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total ATS Compatibility</span>
              <ScoreMeter
                score={analysisResult.match_score}
                size={210}
                label={analysisResult.job_title || 'Target Job Match'}
                sublabel={analysisResult.job_company || 'Verified NLP Metric'}
              />
            </div>

            {/* Breakdown Cards (50% Skills, 30% Keywords, 20% Experience) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Explainable Scoring Breakdown</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Formula: (Skill × 50%) + (Keyword × 30%) + (Experience × 20%)
                    </p>
                  </div>
                  <Badge variant="primary">NLP Transparent</Badge>
                </div>

                <div className="space-y-4">
                  {/* Factor 1: Skills (50%) */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        Technical Skills Alignment (50% Weight)
                      </span>
                      <span className="font-bold text-slate-900">{analysisResult.breakdown.skill_score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${analysisResult.breakdown.skill_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Factor 2: Keywords (30%) */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        TF-IDF & Keyword Density (30% Weight)
                      </span>
                      <span className="font-bold text-slate-900">{analysisResult.breakdown.keyword_score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-1000"
                        style={{ width: `${analysisResult.breakdown.keyword_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Factor 3: Experience (20%) */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Experience Duration Parity (20% Weight)
                      </span>
                      <span className="font-bold text-slate-900">{analysisResult.breakdown.experience_score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                        style={{ width: `${analysisResult.breakdown.experience_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>{analysisResult.breakdown.explanation}</span>
              </div>
            </div>
          </div>

          {/* Second Row: Matched Skills vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Matched Skills ({analysisResult.matched_skills.length})</span>
                </h3>
                <Badge variant="success">Found in Resume</Badge>
              </div>

              {analysisResult.matched_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysisResult.matched_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No direct skills matched yet.</p>
              )}
            </div>

            {/* Missing Skills */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Missing Required Skills ({analysisResult.missing_skills.length})</span>
                </h3>
                <Badge variant="danger">High Impact Gap</Badge>
              </div>

              {analysisResult.missing_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysisResult.missing_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-800 border border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-semibold">
                  Fantastic! All required technical skills were detected in your resume.
                </p>
              )}
            </div>
          </div>

          {/* Third Row: Keyword Comparison Table & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Comparison */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Target Keyword Frequency</h3>
              <p className="text-xs text-slate-500 mb-4">
                Evaluation of key terminology appearing in the job description
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2 font-semibold">Keyword</th>
                      <th className="pb-2 font-semibold">In Resume</th>
                      <th className="pb-2 font-semibold text-right">Resume Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysisResult.keyword_analysis?.slice(0, 8).map((kw, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-semibold text-slate-800">{kw.keyword}</td>
                        <td className="py-2.5">
                          {kw.in_resume ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" /> Missing
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-600">
                          {kw.frequency_in_resume}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Improvement Recommendations */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Actionable Optimization Tips</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Step-by-step edits to optimize your resume before submitting
                </p>

                <div className="space-y-3">
                  {analysisResult.recommendations?.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-950 flex items-start gap-3 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Evaluated via HireMatch NLP Engine</span>
                <span className="font-semibold text-indigo-600">Score: {analysisResult.match_score}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

