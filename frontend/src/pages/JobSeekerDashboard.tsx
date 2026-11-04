import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Resume, Application } from '../types';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const JobSeekerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumesRes, appsRes, statsRes] = await Promise.all([
          api.get<Resume[]>('/resumes/'),
          api.get<Application[]>('/applications/my'),
          api.get('/analytics/overview')
        ]);
        setResumes(resumesRes.data);
        setApplications(appsRes.data);
        setStats(statsRes.data?.stats);
      } catch (err) {
        console.error('Failed to load job seeker dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your career dashboard..." />;
  }

  const primaryResume = resumes.find(r => r.is_primary) || resumes[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Resume Optimization Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Your profile is currently matched against active engineering roles. Upload tailored resumes to optimize your ATS keyword scores.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/matcher"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-indigo-900"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analyze Resume vs Job</span>
            </Link>
            <Link
              to="/dashboard/recommendations"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2 border border-white/10 backdrop-blur"
            >
              <Briefcase className="w-4 h-4 text-indigo-300" />
              <span>View Recommended Jobs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{stats?.resumes_uploaded || resumes.length}</div>
          <div className="mt-1 text-xs text-slate-400">PDF & DOCX stored</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{stats?.total_applications || applications.length}</div>
          <div className="mt-1 text-xs text-slate-400">Submitted to companies</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlisted</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-600">{stats?.interviews_shortlisted || 0}</div>
          <div className="mt-1 text-xs text-slate-400">Interviews & offers</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg ATS Match</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {stats?.average_match_score || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-400">Calculated NLP score</div>
        </div>
      </div>

      {/* Primary Resume Highlight */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Active Resume Profile</h2>
              {primaryResume && <Badge variant="success">Primary ATS Profile</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Used for calculating automated job recommendations</p>
          </div>
          <Link
            to="/dashboard/resumes"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Upload New Resume</span>
          </Link>
        </div>

        {primaryResume ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                  {primaryResume.file_type}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{primaryResume.filename}</h4>
                  <p className="text-xs text-slate-400">
                    {(primaryResume.file_size / 1024).toFixed(1)} KB • Detected {primaryResume.extracted_experience_years} years experience
                  </p>
                </div>
              </div>
              <Link
                to="/matcher"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition self-start sm:self-auto flex items-center gap-1"
              >
                <span>Test Match</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Extracted Technical Skills ({primaryResume.skills?.length || 0})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {primaryResume.skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No Resume Uploaded Yet"
            description="Upload your PDF or DOCX resume to start unlocking automatic skill extraction and ATS match scores."
            actionText="Upload Resume"
            onAction={() => {}}
          />
        )}
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Application Tracking Pipeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status updates from recruiters</p>
          </div>
          <Link
            to="/jobs"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>Browse More Jobs</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="pb-3 font-semibold">Job Title & Company</th>
                  <th className="pb-3 font-semibold">ATS Match Score</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Applied Date</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-800 text-sm">{app.job?.title || 'Engineering Role'}</div>
                      <div className="text-slate-400 text-xs">{app.job?.company} • {app.job?.location}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${
                          app.match_score >= 75 ? 'text-emerald-600' : app.match_score >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {app.match_score}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              app.match_score >= 75 ? 'bg-emerald-500' : app.match_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${app.match_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/jobs`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
                      >
                        View Job
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No Applications Submitted Yet"
            description="Explore open jobs matching your skill profile and submit your first AI-scored application."
            actionText="Find Matching Jobs"
            onAction={() => {}}
          />
        )}
      </div>
    </div>
  );
};
