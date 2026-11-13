import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User as UserIcon, Building, Briefcase, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { getDashboardRoute } from '../utils/navigation';

export const RegisterPage: React.FC = () => {
  const { user, register, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<UserRole>('JOB_SEEKER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync role from query parameter if provided, strictly disallowing ADMIN
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'RECRUITER') {
      setRole('RECRUITER');
    } else if (roleParam === 'JOB_SEEKER') {
      setRole('JOB_SEEKER');
    } else if (roleParam === 'ADMIN') {
      setError('Admin accounts cannot be registered publicly. Please sign in with administrator credentials.');
      setRole('JOB_SEEKER');
    }
  }, [searchParams]);

  // If already authenticated, never display registration form -> redirect to canonical dashboard
  if (!isLoading && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !fullName || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const user = await register({
        email,
        password,
        confirm_password: confirmPassword,
        full_name: fullName,
        role,
        current_title: role === 'JOB_SEEKER' ? (currentTitle || undefined) : undefined,
        company_name: role === 'RECRUITER' ? companyName : undefined,
      });

      showToast(`Welcome to HireMatch AI, ${user.full_name}!`, 'success');

      if (user.role === 'RECRUITER') {
        navigate('/recruiter', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Email might already be taken.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
          <p className="text-sm text-slate-500 mt-1">HireMatch AI Resume Screening & Matching Portal</p>
        </div>

        {/* Role Toggle Selector (Job Seeker / Recruiter only) */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('JOB_SEEKER');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              role === 'JOB_SEEKER'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I'm a Job Seeker
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('RECRUITER');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              role === 'RECRUITER'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I'm a Recruiter
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Elena Rostova"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                minLength={6}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {role === 'JOB_SEEKER' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Role / Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. CloudScale Technologies"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in here
          </Link>
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Admin accounts must be provisioned by a platform administrator.</span>
        </div>
      </div>
    </div>
  );
};
