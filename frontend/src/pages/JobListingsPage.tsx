import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Filter,
  Send,
  X,
  Sparkles,
  Building,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { extractApiError, fetchPublicJobs } from '../services/jobService';
import { Job, Resume } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const JobListingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [expLevelFilter, setExpLevelFilter] = useState('All');

  // Selected job for detail modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Apply modal
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<number | ''>('');
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPublicJobs({
        search: searchTerm,
        location: locationFilter,
        job_type: jobTypeFilter,
        experience_level: expLevelFilter,
      });
      setJobs(data);
    } catch (err) {
      console.error(err);
      const msg = extractApiError(err, 'Failed to load job listings.');
      setJobs([]);
      setLoadError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationFilter, jobTypeFilter, expLevelFilter, showToast]);

  useEffect(() => {
    fetchJobs();
  }, [jobTypeFilter, expLevelFilter]);

  // Load user resumes if logged in
  useEffect(() => {
    if (user) {
      api.get<Resume[]>('/resumes/').then((res) => {
        setResumes(res.data);
        if (res.data.length > 0) {
          const primary = res.data.find(r => r.is_primary) || res.data[0];
          setSelectedResumeId(primary.id);
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleApplyClick = (job: Job) => {
    if (!user) {
      showToast('Please log in or register to submit an application.', 'info');
      navigate('/login');
      return;
    }
    setApplyModalJob(job);
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob || !selectedResumeId) {
      showToast('Please select a resume to apply with.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/applications/', {
        job_id: applyModalJob.id,
        resume_id: Number(selectedResumeId),
        cover_note: coverNote || undefined,
      });
      showToast(`Application successfully sent for ${applyModalJob.title}!`, 'success');
      setApplyModalJob(null);
      setCoverNote('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Application submission failed.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Engineering & Tech Careers</h1>
        <p className="text-sm text-slate-500 mt-2">
          Discover verified roles scored against your technical skill profile with our explainable ATS engine.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, skill (e.g. React, Python), or company..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location or 'Remote'..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
            >
              Search Jobs
            </button>
          </div>
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filters:
          </span>

          <select
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none bg-white"
          >
            <option value="All">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Contract">Contract</option>
          </select>

          <select
            value={expLevelFilter}
            onChange={(e) => setExpLevelFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none bg-white"
          >
            <option value="All">All Experience Levels</option>
            <option value="Entry">Entry Level</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>

          {(searchTerm || locationFilter || jobTypeFilter !== 'All' || expLevelFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setLocationFilter('');
                setJobTypeFilter('All');
                setExpLevelFilter('All');
              }}
              className="text-xs text-rose-600 hover:underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchJobs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-100 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Job Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Searching available jobs..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Openings Match Your Query"
          description="Try broadening your search keywords or resetting filters to see all available roles."
          actionText="View All Jobs"
          onAction={() => {
            setSearchTerm('');
            setLocationFilter('');
            setJobTypeFilter('All');
            setExpLevelFilter('All');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{job.title}</h3>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{job.company}</p>
                  </div>
                  <Badge variant="primary">{job.job_type}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                  </span>
                  {job.salary_range && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" /> {job.salary_range}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.min_experience_years}+ yrs
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.required_skills?.slice(0, 6).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-[11px] font-medium rounded-lg bg-slate-100 text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.required_skills && job.required_skills.length > 6 && (
                    <span className="text-[11px] text-slate-400 self-center">
                      +{job.required_skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
                >
                  View Full Description
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyClick(job)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedJob.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedJob.company} • {selectedJob.location} • {selectedJob.experience_level}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">About the Role</h4>
                <p className="whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Qualifications & Requirements</h4>
                  <p className="whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.required_skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Min {selectedJob.min_experience_years} years experience required
              </span>
              <button
                onClick={() => {
                  const j = selectedJob;
                  setSelectedJob(null);
                  handleApplyClick(j);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
              >
                Apply for this Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply to {applyModalJob.title}</h3>
                <p className="text-xs text-slate-500">{applyModalJob.company} • {applyModalJob.location}</p>
              </div>
              <button
                onClick={() => setApplyModalJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitApplication} className="space-y-4">
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
                  placeholder="Share highlights or qualifications that make you an ideal match..."
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                <span className="font-semibold">Explainable Matching:</span> Your resume match score will be calculated using our 50/30/20 formula and delivered to the recruiter.
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
                  disabled={submitting || resumes.length === 0}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting Application...' : 'Send Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

