import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { Application, ApplicationStatus } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

const STATUS_FILTERS: Array<'All' | ApplicationStatus> = [
  'All',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Selected',
  'Rejected',
];

export const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get<Application[]>('/applications/my');
        setApplications(resp.data);
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Failed to load your job applications.';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your submitted applications..." />;
  }

  const filteredApplications =
    statusFilter === 'All'
      ? applications
      : applications.filter((app) => app.status === statusFilter);

  const shortlistedCount = applications.filter(
    (a) => a.status === 'Shortlisted' || a.status === 'Selected'
  ).length;
  const activeReviewCount = applications.filter(
    (a) => a.status === 'Applied' || a.status === 'Under Review'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Applications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track submitted job applications, ATS match scores, and recruiter hiring decisions.
          </p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span>Browse Jobs</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Applications
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{applications.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              In Review
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{activeReviewCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Shortlisted / Selected
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{shortlistedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Applications Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {applications.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredApplications.length} of {applications.length} application
              {applications.length === 1 ? '' : 's'}
            </span>
          </div>
        )}

        {filteredApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="py-4 px-6 font-semibold">Job Title & Company</th>
                  <th className="py-4 px-4 font-semibold">Resume</th>
                  <th className="py-4 px-4 font-semibold">Match Score</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-4 font-semibold">Applied Date</th>
                  <th className="py-4 px-6 font-semibold">Recruiter Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">
                        {app.job?.title || `Position #${app.job_id}`}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {app.job?.company || 'Company'}
                        {app.job?.location ? ` • ${app.job.location}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {app.resume?.filename ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{app.resume.filename}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Resume #{app.resume_id}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {typeof app.match_score === 'number' ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm ${
                              app.match_score >= 75
                                ? 'text-emerald-600'
                                : app.match_score >= 50
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {app.match_score}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                app.match_score >= 75
                                  ? 'bg-emerald-500'
                                  : app.match_score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, app.match_score))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      {app.recruiter_notes ? (
                        <div className="inline-flex items-start gap-1.5 text-slate-700 text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{app.recruiter_notes}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No recruiter notes yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : applications.length > 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No applications match "{statusFilter}"
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className="mt-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Show All Applications
            </button>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No Applications Submitted Yet"
            description="You have not applied to any job openings yet. Explore available positions and submit your first AI-scored application."
            actionText="Browse Jobs"
            onAction={() => navigate('/jobs')}
          />
        )}
      </div>
    </div>
  );
};

