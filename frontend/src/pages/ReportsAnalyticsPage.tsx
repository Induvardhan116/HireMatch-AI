import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  PieChart as PieIcon,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge, StatusBadge } from '../components/common/Badge';

type ReportTab = 'screening' | 'skills' | 'applications' | 'summary';

export const ReportsAnalyticsPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportTab>('screening');
  const [loading, setLoading] = useState(true);

  // Data states for the 4 reports
  const [screeningReport, setScreeningReport] = useState<any[]>([]);
  const [skillsReport, setSkillsReport] = useState<any | null>(null);
  const [applicationsReport, setApplicationsReport] = useState<any[]>([]);
  const [summaryReport, setSummaryReport] = useState<any | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [resScreening, resSkills, resApps, resSummary] = await Promise.all([
        api.get('/analytics/reports/resume-screening'),
        api.get('/analytics/reports/candidate-skills'),
        api.get('/analytics/reports/job-applications'),
        api.get('/analytics/reports/recruitment-summary'),
      ]);
      setScreeningReport(resScreening.data);
      setSkillsReport(resSkills.data);
      setApplicationsReport(resApps.data);
      setSummaryReport(resSummary.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch reporting analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = (endpoint: string, filename: string) => {
    const token = localStorage.getItem('tm_token');
    const url = `${api.defaults.baseURL}/analytics/reports/${endpoint}?format=csv`;

    // Trigger download via fetch with auth header
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Exported ${filename} successfully!`, 'success');
      })
      .catch(() => {
        showToast('Failed to export CSV report.', 'error');
      });
  };

  if (loading) {
    return <LoadingSpinner message="Aggregating recruitment data and calculating reports..." />;
  }

  // Chart color palette
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6'];

  // Status breakdown data for pie chart
  const statusPieData = summaryReport?.applications_by_status
    ? Object.entries(summaryReport.applications_by_status).map(([key, val]) => ({
        name: key,
        value: val,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>HireMatch AI Executive BI Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruitment Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access 4 functional compliance reports with interactive charts and instant CSV data export.
          </p>
        </div>

        {/* Export Button for Current Tab */}
        <button
          onClick={() => {
            const map: Record<ReportTab, { end: string; name: string }> = {
              screening: { end: 'resume-screening', name: 'resume_screening_report.csv' },
              skills: { end: 'candidate-skills', name: 'candidate_skills_report.csv' },
              applications: { end: 'job-applications', name: 'job_applications_report.csv' },
              summary: { end: 'recruitment-summary', name: 'recruitment_summary_report.csv' },
            };
            const current = map[activeTab];
            handleExportCSV(current.end, current.name);
          }}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Current Report to CSV</span>
        </button>
      </div>

      {/* Report Tabs Navigation */}
      <div className="flex p-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-3xl">
        <button
          onClick={() => setActiveTab('screening')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === 'screening'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Resume Screening
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === 'skills'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Skill Analysis
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === 'applications'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Job Applications
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === 'summary'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Recruitment Summary
        </button>
      </div>

      {/* REPORT 1: Resume Screening Report */}
      {activeTab === 'screening' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Resume Screening & Compatibility Report</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation of candidate ATS scores, matched technical skills, missing skills, and recommendations.
              </p>
            </div>
            <Badge variant="primary">{screeningReport.length} Evaluated Candidates</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Target Job</th>
                  <th className="pb-3">ATS Score</th>
                  <th className="pb-3">Matched Skills</th>
                  <th className="pb-3">Missing Skills</th>
                  <th className="pb-3">Recruiter Recommendations</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {screeningReport.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900">{item.candidate_name}</div>
                      <div className="text-slate-400 text-xs">{item.candidate_email}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-800">{item.job_title}</div>
                      <div className="text-slate-400 text-xs">{item.company}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`font-black text-sm ${
                        item.match_score >= 75 ? 'text-emerald-600' : item.match_score >= 50 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {item.match_score}%
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.matched_skills?.slice(0, 3).map((s: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.missing_skills?.slice(0, 3).map((s: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 max-w-xs text-slate-600 line-clamp-2">
                      {item.recommendations?.[0] || 'Profile aligns strongly with role.'}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: Candidate Skill Analysis Report */}
      {activeTab === 'skills' && skillsReport && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Candidate Skills Distribution */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Most Common Candidate Skills</h3>
              <p className="text-xs text-slate-500 mb-6">Distribution across all uploaded candidate resumes</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsReport.top_candidate_skills?.slice(0, 7) || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="candidate_count" name="Candidates" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: In-Demand Job Skills */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Top In-Demand Requisition Skills</h3>
              <p className="text-xs text-slate-500 mb-6">Required technical skills requested across active jobs</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsReport.top_in_demand_job_skills?.slice(0, 7) || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="candidate_count" name="Job Postings" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Skill Gaps Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Identified Candidate Skill Gaps</h3>
            <p className="text-xs text-slate-500 mb-4">
              Skills heavily demanded by open job descriptions but scarce in candidate pool
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Skill Gap Name</th>
                    <th className="pb-3 font-semibold">Market Scarcity Score</th>
                    <th className="pb-3 font-semibold">Candidate Pool Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {skillsReport.common_skill_gaps?.map((gap: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-800">{gap.skill}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {gap.percentage}% Gap
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        High talent shortage detected in active applicant pool
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: Job Application Report */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Job Application Tracking Log</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete record of submissions, departments, match scores, and status timelines.
              </p>
            </div>
            <Badge variant="primary">{applicationsReport.length} Submissions Logged</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="pb-3">App ID</th>
                  <th className="pb-3">Job Details</th>
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">ATS Score</th>
                  <th className="pb-3">Applied At</th>
                  <th className="pb-3">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicationsReport.map((app) => (
                  <tr key={app.application_id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono text-slate-400">#{app.application_id}</td>
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{app.job_title}</div>
                      <div className="text-slate-400 text-xs">{app.company} • {app.department || 'General'}</div>
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-slate-800">{app.candidate_name}</div>
                      <div className="text-slate-400 text-xs">{app.candidate_email}</div>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      {app.match_score}%
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-slate-400">
                      {app.last_updated ? new Date(app.last_updated).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: Recruitment Summary Report */}
      {activeTab === 'summary' && summaryReport && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Requisitions</span>
              <div className="mt-2 text-2xl font-black text-slate-900">{summaryReport.total_jobs}</div>
              <div className="text-[11px] text-slate-500 mt-1">{summaryReport.active_jobs} active postings</div>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Applications</span>
              <div className="mt-2 text-2xl font-black text-indigo-600">{summaryReport.total_applications}</div>
              <div className="text-[11px] text-slate-500 mt-1">From {summaryReport.total_candidates} unique candidates</div>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Shortlisted Candidates</span>
              <div className="mt-2 text-2xl font-black text-emerald-600">{summaryReport.shortlisted_candidates}</div>
              <div className="text-[11px] text-slate-500 mt-1">{summaryReport.selected_candidates} selected (hired)</div>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Avg Screening Score</span>
              <div className="mt-2 text-2xl font-black text-purple-600">{summaryReport.average_match_score}%</div>
              <div className="text-[11px] text-slate-500 mt-1">Across all submissions</div>
            </div>
          </div>

          {/* Breakdown Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Pie */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Applications by Pipeline Stage</h3>
              <p className="text-xs text-slate-500 mb-4">Stage distribution across candidate lifecycle</p>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Hiring Roles */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Top Requisitions by Demand</h3>
                <p className="text-xs text-slate-500 mb-4">Roles attracting highest volume of applicants</p>

                <div className="space-y-3">
                  {summaryReport.top_hiring_roles?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="font-bold text-slate-800">{item.role}</div>
                      <Badge variant="primary">{item.applications} Applications</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
                Data generated via HireMatch Executive Reporting API.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

