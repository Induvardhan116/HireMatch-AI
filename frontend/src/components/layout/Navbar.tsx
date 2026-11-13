import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleSelectionModal } from '../common/RoleSelectionModal';
import { getDashboardRoute } from '../../utils/navigation';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleGoHome = () => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isDashboardActive =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/recruiter') ||
    location.pathname.startsWith('/admin');

  return (
    <>
      <nav className="sticky top-0 z-40 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 md:gap-8">
              {onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  aria-label="Toggle dashboard sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <Link to="/" onClick={handleGoHome} className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    HireMatch <span className="text-indigo-600">AI</span>
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1">
                    Intelligent ATS & Matching
                  </span>
                </div>
              </Link>

              {/* Main Nav Links: Home, About, Features, Contact */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  onClick={handleGoHome}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    location.pathname === '/' && !location.hash
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToSection('about')}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
                >
                  Features
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('contact')}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
                >
                  Contact
                </button>
                <Link
                  to="/jobs"
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    location.pathname === '/jobs'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Find Jobs
                </Link>
                {user && (
                  <Link
                    to={getDashboardRoute(user.role)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      isDashboardActive
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
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/"
                onClick={handleGoHome}
                className="md:hidden px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
              >
                Home
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    type="button"
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
                        to="/"
                        onClick={handleGoHome}
                        className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        Home
                      </Link>
                      <Link
                        to={getDashboardRoute(user.role)}
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
                        Resume Matcher
                      </Link>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        type="button"
                        onClick={handleLogout}
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
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                  >
                    Login
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(true)}
                    className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-xl transition"
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm hover:shadow"
                  >
                    Get Started
                  </button>
                  {!onToggleSidebar && (
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                      aria-label="Toggle menu"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu for Public Nav Links */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-3 pt-2 border-t border-slate-100 space-y-1">
              <Link
                to="/"
                onClick={handleGoHome}
                className="block px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Home
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="block w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="block w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Contact
              </button>
              <Link
                to="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Find Jobs
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Role Selection Modal for Sign Up / Get Started */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </>
  );
};
