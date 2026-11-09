import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AccessDeniedProps {
  userRole?: UserRole;
  allowedRoles?: string[];
}

export const AccessDeniedPage: React.FC<AccessDeniedProps> = ({ userRole, allowedRoles }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const getDashboardPath = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'RECRUITER': return '/recruiter';
      case 'JOB_SEEKER': return '/dashboard';
      default: return '/login';
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider mb-2">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Access Denied</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            You do not have the required role privileges to access this area.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-left space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span>Your Current Role:</span>
            <span className="font-bold text-slate-800 uppercase text-[11px] bg-slate-200 px-2 py-0.5 rounded">
              {userRole || 'Unverified'}
            </span>
          </div>
          {allowedRoles && (
            <div className="flex items-center justify-between text-slate-500">
              <span>Required Role:</span>
              <span className="font-bold text-indigo-700 uppercase text-[11px] bg-indigo-50 px-2 py-0.5 rounded">
                {allowedRoles.join(' or ')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => navigate(getDashboardPath(userRole))}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Authorized Dashboard</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sign In with Another Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

