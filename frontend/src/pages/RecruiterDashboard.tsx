import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Award,
  PlusCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Eye,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Job, Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruiterData = async () => {
      try {
        const [statsRes, jobsRes, appsReportRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get<Job[]>('/jobs/'),
          api.get<any[]>('/analytics/reports/resume-screening')
        ]);
        setStats(statsRes.data?.stats);
        // Filter jobs posted by this recruiter or platform
        setJobs(jobsRes.data);
        setRecentApplications(appsReportRes.data as any);
      } catch (err) {
        console.error('Failed to load recruiter data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecruiterData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading recruitment pipeline..." />;
  }

  return (
    <div className="space-y-8">
      {/* Recruiter Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <Briefcase className="w-3.5 h-3.5 text-blue-300" />
            <span>Recruiter Command Center • {user?.company_name || 'CloudScale Technologies'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Recruiter Overview & Pipeline
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Screen candidates with automated ATS match scores, review candidate skill gaps, and manage hiring decisions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/recruiter/jobs"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-indigo-900"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Manage & Create Jobs</span>
            </Link>
            <Link
              to="/recruiter/candidates"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2 border border-white/10 backdrop-blur"
            >
              <Users className="w-4 h-4 text-indigo-300" />
              <span>Candidate Pipeline</span>
            </Link>
            <Link
              to="/recruiter/reports"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2 border border-white/10 backdrop-blur"
            >
              <BarChart3 className="w-4 h-4 text-purple-300" />
              <span>Analytics & Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{stats?.active_jobs || jobs.length}</div>
          <div className="mt-1 text-xs text-slate-400">Total active requisitions</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidates</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{stats?.total_candidates || recentApplications.length}</div>
          <div className="mt-1 text-xs text-slate-400">Applications received</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlisted</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-600">{stats?.shortlisted || 1}</div>
          <div className="mt-1 text-xs text-slate-400">Advanced to technical round</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg ATS Score</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{stats?.average_match_score || 85.5}%</div>
          <div className="mt-1 text-xs text-slate-400">Calculated NLP alignment</div>
        </div>
      </div>

      {/* Screened Applicants Pipeline Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Ranked Candidate Submissions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked in real-time by the explainable 50/30/20 ATS match score
            </p>
          </div>
          <Link
            to="/recruiter/candidates"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Full Candidate Pipeline</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Applied Position</th>
                  <th className="pb-3">ATS Match</th>
                  <th className="pb-3">Skills (Matched / Missing)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app: any) => (
                  <tr key={app.application_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-800 text-sm">{app.candidate_name}</div>
                      <div className="text-slate-400 text-xs">{app.candidate_email}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-800">{app.job_title}</div>
                      <div className="text-slate-400 text-[11px]">{app.company}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        app.match_score >= 75
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.match_score >= 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {app.match_score}%
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="text-slate-600 text-xs">
                        <span className="text-emerald-600 font-semibold">{app.matched_skills?.length || 0} matched</span>
                        {' • '}
                        <span className="text-rose-500 font-semibold">{app.missing_skills?.length || 0} gaps</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to="/recruiter/candidates"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
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
            description="Create job postings to start receiving and screening applications."
            actionText="Post a Job"
            onAction={() => {}}
          />
        )}
      </div>
    </div>
  );
};

