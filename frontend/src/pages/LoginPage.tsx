import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, Shield, Briefcase, User as UserIcon, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { getDashboardRoute } from '../utils/navigation';

export const LoginPage: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If already authenticated, never display login form -> redirect to canonical dashboard
  if (!isLoading && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  const [selectedRole, setSelectedRole] = useState<UserRole>('JOB_SEEKER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync role from query param if provided (e.g. ?role=RECRUITER)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'RECRUITER') {
      setSelectedRole('RECRUITER');
    } else if (roleParam === 'ADMIN') {
      setSelectedRole('ADMIN');
    } else if (roleParam === 'JOB_SEEKER') {
      setSelectedRole('JOB_SEEKER');
    }
  }, [searchParams]);

  const getDashboardPath = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'RECRUITER': return '/recruiter';
      case 'JOB_SEEKER': return '/dashboard';
      default: return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Authenticate strictly with backend database and verify role alignment
      const authenticatedUser = await login(email, password, selectedRole);
      showToast(`Welcome back, ${authenticatedUser.full_name}!`, 'success');
      navigate(getDashboardPath(authenticatedUser.role));
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        'Authentication failed. Please verify your credentials and selected role.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      showToast(typeof msg === 'string' ? msg : 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fill form inputs (DOES NOT bypass login; user must submit)
  const handleFillCredentials = (demoEmail: string, demoPass: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSelectedRole(demoRole);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to HireMatch AI</h2>
          <p className="text-sm text-slate-500 mt-1">
            Authenticate to access your verified career or recruiter dashboard
          </p>
        </div>

        {/* Role Selector Tabs (Sets selectedRole state for backend verification; DOES NOT bypass login) */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Your Account Role *
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('JOB_SEEKER');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'JOB_SEEKER'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Job Seeker</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('RECRUITER');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'RECRUITER'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Recruiter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('ADMIN');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            The backend verifies that your database account role matches the selected role.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="name@company.com"
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
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating with backend...</span>
            ) : (
              <>
                <span>
                  Sign In as {selectedRole === 'JOB_SEEKER' ? 'Job Seeker' : selectedRole === 'RECRUITER' ? 'Recruiter' : 'Administrator'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Helper (Fills fields only; user MUST click Sign In) */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sample Test Credentials:</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span>Job Seeker: <code className="text-slate-700 font-semibold">elena.dev@gmail.com</code></span>
              <button
                type="button"
                onClick={() => handleFillCredentials('elena.dev@gmail.com', 'hirematch123', 'JOB_SEEKER')}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Fill
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Recruiter: <code className="text-slate-700 font-semibold">sarah.recruiter@cloudtech.com</code></span>
              <button
                type="button"
                onClick={() => handleFillCredentials('sarah.recruiter@cloudtech.com', 'hirematch123', 'RECRUITER')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Fill
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Admin: <code className="text-slate-700 font-semibold">admin@hirematch.ai</code></span>
              <button
                type="button"
                onClick={() => handleFillCredentials('admin@hirematch.ai', 'hirematch123', 'ADMIN')}
                className="text-purple-600 hover:text-purple-800 font-semibold"
              >
                Fill
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
};
