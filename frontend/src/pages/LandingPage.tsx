import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  FileSearch,
  ArrowRight,
  BarChart3,
  Briefcase,
  Users,
  Zap,
  Target,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { RoleSelectionModal } from '../components/common/RoleSelectionModal';
import { getDashboardRoute } from '../utils/navigation';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.hash]);

  const handleGetStarted = () => {
    if (user) {
      navigate(getDashboardRoute(user.role));
    } else {
      setIsRoleModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Welcome to HireMatch AI – Explainable ATS Resume Screening & Job Recommendation Portal</span>
      </div>

      {/* 1. HOME / HERO SECTION */}
      <section id="home" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next-Gen Career Optimization & Recruitment</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Optimize Your Resume & Land Top Tech Jobs with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">HireMatch AI</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Scan resumes against job descriptions using our transparent 3-factor NLP engine:
              <strong className="text-slate-800"> 50% Technical Skills</strong>, <strong className="text-slate-800">30% TF-IDF Keywords</strong>, and <strong className="text-slate-800">20% Experience Parity</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
              >
                <span>{user ? 'Open Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                to="/jobs"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-slate-500" />
                <span>Browse All Jobs</span>
              </Link>
            </div>

            {/* Role Gateway Cards */}
            <div className="mt-12 p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm max-w-xl mx-auto">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                {user ? 'Your Active Account Portal' : 'Role-Based Portals (Requires Valid Authentication)'}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <Link
                  to={user ? getDashboardRoute(user.role) : "/login?role=JOB_SEEKER"}
                  className="px-3 py-2.5 text-xs font-semibold rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition border border-indigo-100 flex flex-col items-center gap-1 shadow-sm"
                >
                  <span className="font-bold">Job Seeker</span>
                  <span className="text-[10px] text-indigo-500 font-normal">
                    {user?.role === 'JOB_SEEKER' ? 'Go to Dashboard' : 'Candidate Sign In'}
                  </span>
                </Link>
                <Link
                  to={user ? getDashboardRoute(user.role) : "/login?role=RECRUITER"}
                  className="px-3 py-2.5 text-xs font-semibold rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition border border-blue-100 flex flex-col items-center gap-1 shadow-sm"
                >
                  <span className="font-bold">Recruiter</span>
                  <span className="text-[10px] text-blue-500 font-normal">
                    {user?.role === 'RECRUITER' ? 'Go to Dashboard' : 'Recruiter Sign In'}
                  </span>
                </Link>
                <Link
                  to={user ? getDashboardRoute(user.role) : "/login?role=ADMIN"}
                  className="px-3 py-2.5 text-xs font-semibold rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition border border-purple-100 flex flex-col items-center gap-1 shadow-sm"
                >
                  <span className="font-bold">Admin</span>
                  <span className="text-[10px] text-purple-500 font-normal">
                    {user?.role === 'ADMIN' ? 'Go to Dashboard' : 'Admin Sign In'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section id="about" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>About HireMatch AI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Bridging the Gap Between Talent & Opportunity with Transparent NLP
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Traditional Applicant Tracking Systems (ATS) act as black-box filters, rejecting qualified candidates without feedback. HireMatch AI was engineered to demystify resume screening.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                We empower candidates with clear insights into their keyword coverage and skill alignment, while providing recruiters with structured talent pipelines and automated 5-stage recruitment workflows.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-2xl font-black text-indigo-600">100%</div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">Explainable Matching</div>
                  <div className="text-[11px] text-slate-400">Zero opaque algorithms</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-2xl font-black text-emerald-600">Free & Open</div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">Zero Paid APIs Required</div>
                  <div className="text-[11px] text-slate-400">Pure Python NLP & React</div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                <span>How HireMatch AI Evaluates Your Resume</span>
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                  <div className="font-bold text-amber-300 text-sm mb-1">1. Skill Overlap (50%)</div>
                  <p className="text-slate-300">
                    Matches exact technical skills, frameworks, databases, and DevOps tools against job requisitions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                  <div className="font-bold text-blue-300 text-sm mb-1">2. TF-IDF & Keyword Density (30%)</div>
                  <p className="text-slate-300">
                    Computes cosine similarity between your resume text and target job description using Scikit-Learn.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                  <div className="font-bold text-emerald-300 text-sm mb-1">3. Experience Duration (20%)</div>
                  <p className="text-slate-300">
                    Compares candidate years of experience against the role's minimum requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Platform Capabilities</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need for Intelligent Hiring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-100">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">PDF & DOCX Skill Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Upload resumes in PDF or Word DOCX. Our parser extracts programming languages, frameworks, databases, and DevOps tools into clean categorized tags.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>PyMuPDF & python-docx extraction</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Interactive skill review & editor</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Resume-Based Job Matching</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Automatically search and rank database jobs matching your skills. See match percentages, identified matched skills, missing skills, and apply with 1-click.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Real-time match percentage calculation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Filter by score, title, and location</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 border border-purple-100">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Reports & Multi-Role Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Dedicated dashboards for Candidates, Recruiters, and Admins. Includes 4 functional compliance reports with interactive charts and CSV exports.
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>5-stage candidate workflow tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>1-click CSV data report downloads</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONTACT SECTION */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Get in Touch</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Contact HireMatch AI
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Have questions about ATS algorithms, enterprise deployments, or recruiter onboarding?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Email Support</h4>
              <p className="text-xs text-slate-500">support@hirematch.ai</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Talent Inquiries</h4>
              <p className="text-xs text-slate-500">+1 (800) 555-HIRE</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Headquarters</h4>
              <p className="text-xs text-slate-500">San Francisco, CA (Open Source)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">HireMatch AI</span>
            <span>– Enterprise Full-Stack ATS & Recruitment Portal</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} HireMatch AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
};
