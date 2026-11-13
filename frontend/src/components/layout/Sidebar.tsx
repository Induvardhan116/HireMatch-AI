import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Users,
  BarChart3,
  Search,
  FileCheck2,
  FolderKanban,
  FileText,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
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
          { label: 'Interactive Matcher', path: '/admin/matcher', icon: Sparkles },
          { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
        ];
      case 'RECRUITER':
        return [
          { label: 'Recruiter Dashboard', path: '/recruiter', icon: LayoutDashboard },
          { label: 'Manage Job Postings', path: '/recruiter/jobs', icon: Briefcase },
          { label: 'Candidate Management', path: '/recruiter/candidates', icon: Users },
          { label: 'Interactive Matcher', path: '/recruiter/matcher', icon: Sparkles },
          { label: 'Recruitment Reports', path: '/recruiter/reports', icon: BarChart3 },
        ];
      case 'JOB_SEEKER':
      default:
        return [
          { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
          { label: 'My Resumes', path: '/dashboard/resumes', icon: FileText },
          { label: 'ATS Resume Matcher', path: '/dashboard/matcher', icon: Sparkles, badge: 'AI' },
          { label: 'Recommended Jobs', path: '/dashboard/recommendations', icon: FolderKanban },
          { label: 'Browse Jobs', path: '/dashboard/jobs', icon: Search },
          { label: 'My Applications', path: '/dashboard/applications', icon: FileCheck2 },
        ];
    }
  };

  const navItems = getLinks(user.role);

  const navList = (
    <div className="flex flex-col justify-between h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-3 md:hidden">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Navigation</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
                onClick={onClose}
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
        HireMatch AI v1.0.0
        <div className="text-[10px] text-slate-400 mt-0.5">Explainable NLP Engine</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Persistent Sticky Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200 h-full overflow-y-auto shrink-0">
        {navList}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-white h-full overflow-y-auto shadow-2xl border-r border-slate-200">
            {navList}
          </aside>
        </div>
      )}
    </>
  );
};
