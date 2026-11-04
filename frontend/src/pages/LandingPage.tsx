import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  FileSearch,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Briefcase,
  Users,
  Target,
  Zap,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LandingPage: React.FC = () => {
  const { user, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async (role: UserRole) => {
    await switchRoleDemo(role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'RECRUITER') navigate('/recruiter');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Announcement Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Explainable NLP ATS Resume Scoring & Job Matching Engine – Free & Open Source</span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Transparent AI-Powered Hiring Portal</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Optimize Your Resume for ATS with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Explainable AI</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Match candidate resumes against job descriptions with a verifiable 3-factor NLP scoring engine:
              <strong className="text-slate-800"> 50% Skills</strong>, <strong className="text-slate-800">30% Keyword Density</strong>, and <strong className="text-slate-800">20% Experience</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/matcher"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
              >
                <span>Try Resume Matcher</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/jobs"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-slate-500" />
                <span>Explore Open Jobs</span>
              </Link>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mt-12 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Instant 1-Click Evaluation Logins
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleDemoLogin('JOB_SEEKER')}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition border border-indigo-100 flex flex-col items-center gap-1"
                >
                  <span className="font-bold">Job Seeker</span>
                  <span className="text-[10px] text-indigo-500 font-normal">Elena (Candidate)</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('RECRUITER')}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition border border-blue-100 flex flex-col items-center gap-1"
                >
                  <span className="font-bold">Recruiter</span>
                  <span className="text-[10px] text-blue-500 font-normal">Sarah (CloudScale)</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition border border-purple-100 flex flex-col items-center gap-1"
                >
                  <span className="font-bold">Admin</span>
                  <span className="text-[10px] text-purple-500 font-normal">Alex (Full System)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Core Capabilities</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              A Complete Platform for Candidates, Recruiters & Admins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Explainable Match Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                No black-box mystery. Get clear breakdowns of matched skills, missing keywords, experience alignment, and actionable improvement tips.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>50% Weighted Skill Comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>30% TF-IDF Cosine Similarity</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>20% Experience Parity Formula</span>
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Recruiter Screening Suite</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Post jobs, automatically calculate match scores for every applicant, and fast-track top candidates through a 5-stage recruitment funnel.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Multi-stage candidate pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Rank applicants by ATS match score</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Recruiter notes & interview decisions</span>
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Advanced Analytics & Reports</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Four mandatory functional reports with interactive charts and 1-click CSV exports for candidate screening and market skill gaps.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Resume Screening Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Candidate Skill Analysis Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Recruitment Summary & CSV Export</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">TalentMatch AI</span>
            <span>– Enterprise Full-Stack DevOps Portal</span>
          </div>
          <div>
            Built with React, TypeScript, FastAPI, PyMuPDF, Scikit-Learn, Docker & Kubernetes.
          </div>
        </div>
      </footer>
    </div>
  );
};
