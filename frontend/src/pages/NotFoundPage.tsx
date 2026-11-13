import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/navigation';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-600">Error 404</div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Page Not Found</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The route you requested does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          {user && (
            <Link
              to={getDashboardRoute(user.role)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

