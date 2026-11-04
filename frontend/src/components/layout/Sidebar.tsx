import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Sparkles,
  Briefcase,
  Users,
  BarChart3,
  Search,
  FileCheck2,
  FolderKanban,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
    badge?: string;
  }

  const getLinks = (role: UserRole): NavItem[] => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
          { label: 'Manage Users', path: '/admin/users', icon: Users },
          { label: 'Manage All Jobs', path: '/admin/jobs', icon: Briefcase },
          { label: 'Candidate Pipeline', path: '/admin/applications', icon: FileCheck2 },
          { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
        ];
      case 'RECRUITER':
        return [
          { label: 'Recruiter Dashboard', path: '/recruiter', icon: LayoutDashboard },
          { label: 'Manage Job Postings', path: '/recruiter/jobs', icon: Briefcase },
          { label: 'Candidate Management', path: '/recruiter/candidates', icon: Users },
          { label: 'Interactive Matcher', path: '/matcher', icon: Sparkles },
          { label: 'Recruitment Reports', path: '/recruiter/reports', icon: BarChart3 },
        ];
      case 'JOB_SEEKER':
      default:
        return [
          { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
          { label: 'My Resumes', path: '/dashboard/resumes', icon: FileText },
          { label: 'ATS Resume Matcher', path: '/matcher', icon: Sparkles, badge: 'AI' },
          { label: 'Recommended Jobs', path: '/dashboard/recommendations', icon: FolderKanban },
          { label: 'Browse Jobs', path: '/jobs', icon: Search },
          { label: 'My Applications', path: '/dashboard/applications', icon: FileCheck2 },
        ];
    }
  };

  const navItems = getLinks(user.role);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        {/* User Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800 truncate">{user.full_name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Role</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider text-[10px]">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard' || item.path === '/recruiter' || item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        TalentMatch AI v1.0.0
        <div className="text-[10px] text-slate-400 mt-0.5">Explainable NLP Engine</div>
      </div>
    </aside>
  );
};
