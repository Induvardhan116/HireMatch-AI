import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  X,
  MessageSquare,
  Award,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { extractApiError, fetchManagedJobs } from '../services/jobService';
import { ApplicationStatus, Job } from '../types';
import { useToast } from '../context/ToastContext';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const CandidateManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal
  const [activeCandidate, setActiveCandidate] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Under Review');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Resume inspection modal
  const [inspectResume, setInspectResume] = useState<any | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [reportResult, jobsResult] = await Promise.allSettled([
      api.get('/analytics/reports/resume-screening', {
        params: selectedJobId !== 'All' ? { job_id: Number(selectedJobId) } : {},
      }),
      fetchManagedJobs(),
    ]);

    let failureMsg: string | null = null;

    if (reportResult.status === 'fulfilled') {
      setCandidates(Array.isArray(reportResult.value.data) ? reportResult.value.data : []);
    } else {
      console.error(reportResult.reason);
      setCandidates([]);
      failureMsg = extractApiError(reportResult.reason, 'Failed to load candidate applications.');
    }

    if (jobsResult.status === 'fulfilled') {
      setJobs(jobsResult.value);
    } else {
      console.error(jobsResult.reason);
      setJobs([]);
      if (!failureMsg) {
        failureMsg = extractApiError(jobsResult.reason, 'Failed to load job postings filter.');
      }
    }

    if (failureMsg) {
      setLoadError(failureMsg);
      showToast(failureMsg, 'error');
    }

    setLoading(false);
  }, [selectedJobId, showToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenDecision = async (cand: any) => {
    setActiveCandidate(cand);
    setNewStatus(cand.status as ApplicationStatus);
    setRecruiterNotes(typeof cand.recruiter_notes === 'string' ? cand.recruiter_notes : '');

    if (typeof cand.recruiter_notes !== 'string') {
      try {
        const resp = await api.get(`/applications/${cand.application_id}`);
        if (resp.data && typeof resp.data.recruiter_notes === 'string') {
          setRecruiterNotes(resp.data.recruiter_notes);
        }
      } catch (err) {
        console.error('Failed to prefill existing notes:', err);
      }
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;

    setUpdating(true);
    try {
      await api.patch(`/applications/${activeCandidate.application_id}/status`, {
        status: newStatus,
        recruiter_notes: recruiterNotes || undefined,
      });
      showToast(`Status updated to ${newStatus} for ${activeCandidate.candidate_name}`, 'success');
      setActiveCandidate(null);
      fetchApplications();
    } catch (err) {
      showToast('Failed to update candidate status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleInspectResume = async (cand: any) => {
    try {
      const resp = await api.get(`/applications/${cand.application_id}`);
      setInspectResume(resp.data);
    } catch (err) {
      showToast('Failed to load candidate resume details.', 'error');
    }
  };

  // Filter in memory for search & status
  const filteredCandidates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return candidates.filter((c) => {
      const matchesSearch =
        c.candidate_name?.toLowerCase().includes(query) ||
        c.candidate_email?.toLowerCase().includes(query) ||
        c.job_title?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading candidate applications..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Pipeline & Decisions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review candidates scored by our explainable ATS engine. Shortlist, select, or reject with notes.
        </p>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchApplications}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-100 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or email..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Job:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white"
            >
              <option value="All">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredCandidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="py-4 px-6">Candidate Details</th>
                  <th className="py-4 px-4">Applied Job</th>
                  <th className="py-4 px-4">ATS Match</th>
                  <th className="py-4 px-4">3-Factor Breakdown</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.application_id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">{cand.candidate_name}</div>
                      <div className="text-slate-400 text-xs">{cand.candidate_email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{cand.job_title}</div>
                      <div className="text-slate-400 text-[11px]">{cand.company}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-sm ${
                            cand.match_score >= 75
                              ? 'text-emerald-600'
                              : cand.match_score >= 50
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {cand.match_score}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              cand.match_score >= 75
                                ? 'bg-emerald-500'
                                : cand.match_score >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${cand.match_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[11px] text-slate-600">
                      <div>Skills: <span className="font-semibold text-indigo-700">{cand.skill_score}%</span></div>
                      <div>Keywords: <span className="font-semibold text-purple-700">{cand.keyword_score}%</span></div>
                      <div>Exp: <span className="font-semibold text-blue-700">{cand.experience_score}%</span></div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={cand.status} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleInspectResume(cand)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(cand)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-sm"
                      >
                        Decision
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No Candidates Found"
            description="No applications match the selected job requisition or filter criteria."
          />
        )}
      </div>

      {/* Recruiter Decision Modal */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Application Status</h3>
                <p className="text-xs text-slate-500">{activeCandidate.candidate_name} • {activeCandidate.job_title}</p>
              </div>
              <button
                onClick={() => setActiveCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recruitment Pipeline Stage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Under Review', 'Shortlisted', 'Selected', 'Rejected'] as ApplicationStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 px-3 rounded-xl font-semibold border transition text-left ${
                        newStatus === st
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'Selected' ? 'Selected (Offer)' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Recruiter Notes
                </label>
                <textarea
                  value={recruiterNotes}
                  onChange={(e) => setRecruiterNotes(e.target.value)}
                  placeholder="e.g. Cleared technical screen. Strong background in React and FastAPI. Scheduled for system design round."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCandidate(null)}
                  className="px-4 py-2 font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {updating ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Inspector Modal */}
      {inspectResume && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {inspectResume.applicant?.full_name} – Candidate Evaluation
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectResume.applicant?.email ? `${inspectResume.applicant.email} • ` : ''}
                  ATS Match Score: <strong className="text-indigo-600">{inspectResume.match_score}%</strong> • Applied for {inspectResume.job?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectResume(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Resume File Metadata */}
              {inspectResume.resume && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Resume: {inspectResume.resume.filename}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {inspectResume.resume.extracted_experience_years ?? 0} yrs experience
                    </span>
                  </div>
                  {inspectResume.resume.summary && (
                    <p className="text-slate-600 leading-relaxed">{inspectResume.resume.summary}</p>
                  )}
                </div>
              )}

              {/* Cover Note */}
              {inspectResume.cover_note && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <h4 className="font-bold text-indigo-950 mb-1">Candidate Cover Note</h4>
                  <p className="text-indigo-900">{inspectResume.cover_note}</p>
                </div>
              )}

              {/* Skills breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Matched Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {inspectResume.matched_skills?.map((s: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Missing Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {inspectResume.missing_skills?.map((s: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                      ✗ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Algorithm Improvement Suggestions</h4>
                <ul className="space-y-1 list-disc pl-4 text-slate-600">
                  {inspectResume.recommendations?.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Recruiter Notes */}
              {inspectResume.recruiter_notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1">Previous Recruiter Notes</h4>
                  <p className="text-slate-600">{inspectResume.recruiter_notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setInspectResume(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

