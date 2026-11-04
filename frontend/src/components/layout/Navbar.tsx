import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, User as UserIcon, LogOut, ChevronDown, ShieldCheck, Briefcase, FileSearch, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, switchRoleDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);

  const getDashboardPath = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'RECRUITER': return '/recruiter';
      case 'JOB_SEEKER': return '/dashboard';
      default: return '/login';
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setRoleSwitchOpen(false);
    await switchRoleDemo(role);
    navigate(getDashboardPath(role));
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                  TalentMatch <span className="text-indigo-600">AI</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1">
                  Explainable NLP ATS
                </span>
              </div>
            </Link>

            {/* Main Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/jobs"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/jobs'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Find Jobs
              </Link>
              <Link
                to="/matcher"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/matcher'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileSearch className="w-4 h-4 text-indigo-500" />
                Resume Matcher
              </Link>
              {user && (
                <Link
                  to={getDashboardPath(user.role)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname.startsWith('/dashboard') ||
                    location.pathname.startsWith('/recruiter') ||
                    location.pathname.startsWith('/admin')
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitchOpen(!roleSwitchOpen)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 shadow-sm"
                title="Switch demo role immediately"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>Demo Switch</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleSwitchOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Active Role</p>
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('JOB_SEEKER')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>Job Seeker (Elena)</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Candidate</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('RECRUITER')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>Recruiter (Sarah)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Recruiter</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('ADMIN')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>Admin (Alex)</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Admin</span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <div className="font-semibold text-slate-800 leading-tight">{user.full_name}</div>
                    <div className="text-[10px] text-indigo-600 font-medium capitalize">
                      {user.role.replace('_', ' ').toLowerCase()}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1">
                        <span className="inline-block text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={getDashboardPath(user.role)}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/matcher"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Interactive Matcher
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm hover:shadow"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
