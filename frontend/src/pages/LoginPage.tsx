import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, switchRoleDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const user = await login(email, password);
      showToast(`Welcome back, ${user.full_name}!`, 'success');
      navigate(getDashboardPath(user.role));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await switchRoleDemo(role);
      showToast(`Logged in as demo ${role.toLowerCase().replace('_', ' ')}!`, 'success');
      navigate(getDashboardPath(role));
    } catch (err: any) {
      setError('Failed to log in with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to TalentMatch AI</h2>
          <p className="text-sm text-slate-500 mt-1">Access your resume analyses, jobs, and recruitment portal</p>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
          <p className="text-xs font-bold text-indigo-900 mb-2.5 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Instant Demo Accounts (1-Click)</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('JOB_SEEKER')}
              className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 transition border border-indigo-200 shadow-sm"
            >
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('RECRUITER')}
              className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 transition border border-indigo-200 shadow-sm"
            >
              Recruiter
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('ADMIN')}
              className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 transition border border-indigo-200 shadow-sm"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-medium">Or continue with credentials</span>
          </div>
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
              Email Address
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
            </div>
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
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
