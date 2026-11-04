import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Job, Resume } from '../types';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const JobRecommendationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  // Application Modal state
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<number | ''>('');
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, resumesRes] = await Promise.all([
          api.get<Job[]>('/jobs/recommendations/me'),
          api.get<Resume[]>('/resumes/')
        ]);
        setRecommendations(recRes.data);
        setResumes(resumesRes.data);
        if (resumesRes.data.length > 0) {
          const primary = resumesRes.data.find(r => r.is_primary) || resumesRes.data[0];
          setSelectedResumeId(primary.id);
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load personalized job recommendations.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob || !selectedResumeId) {
      showToast('Please select a resume to submit.', 'error');
      return;
    }

    setApplying(true);
    try {
      await api.post('/applications/', {
        job_id: applyModalJob.id,
        resume_id: Number(selectedResumeId),
        cover_note: coverNote || undefined,
      });
      showToast(`Application successfully submitted for ${applyModalJob.title}!`, 'success');
      setApplyModalJob(null);
      setCoverNote('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit application.';
      showToast(msg, 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating your personalized job recommendations..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Ranked by Explainable ATS Compatibility</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recommended Jobs for You</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Roles automatically analyzed against your active resume skills, keywords, and experience level.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Matching Jobs Found"
          description="Try uploading a resume with more technical skills or browse all open positions."
          actionText="Browse All Jobs"
          onAction={() => {}}
        />
      ) : (
        <div className="space-y-4">
          {recommendations.map((job) => {
            const score = Math.round(job.recommendation_score || 0);
            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left: Job Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <Badge variant="primary">{job.experience_level}</Badge>
                    <Badge variant="neutral">{job.job_type}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{job.company}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                    </span>
                    {job.salary_range && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" /> {job.salary_range}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Min {job.min_experience_years} yrs exp
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills Alignment */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Required:</span>
                    {job.required_skills?.map((skill, idx) => {
                      const isMatched = job.matched_skills?.includes(skill);
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg border ${
                            isMatched
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isMatched && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <span>{skill}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Score Badge & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-center sm:text-right">
                    <div
                      className={`text-2xl font-black ${
                        score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-slate-500'
                      }`}
                    >
                      {score}%
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ATS Match</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/matcher"
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                    >
                      Detailed Scan
                    </Link>
                    <button
                      onClick={() => setApplyModalJob(job)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm hover:shadow flex items-center gap-1.5"
                    >
                      <span>Easy Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Easy Apply Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply for Position</h3>
                <p className="text-xs text-slate-500">{applyModalJob.title} @ {applyModalJob.company}</p>
              </div>
              <button
                onClick={() => setApplyModalJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Resume to Submit *
                </label>
                {resumes.length > 0 ? (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                    required
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename} ({r.extracted_experience_years} yrs exp)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-600">Please upload a resume first before applying.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cover Note / Pitch (Optional)
                </label>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Share a short note on why you're a standout fit for this role..."
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                <span className="font-semibold">Note:</span> Your ATS match score will be calculated and provided directly to the hiring recruiter.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying || resumes.length === 0}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{applying ? 'Submitting Application...' : 'Confirm & Submit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
