import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Briefcase,
  FileText,
  BarChart3,
  Search,
  Trash2,
  AlertTriangle,
  RefreshCw,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface AdminDashboardProps {
  view?: 'overview' | 'users';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ view = 'overview' }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation modal state
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.allSettled([
        api.get<User[]>('/users/'),
        api.get('/analytics/overview'),
      ]);

      if (usersRes.status === 'fulfilled') {
        setUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
      } else {
        throw usersRes.reason;
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.stats ?? null);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to load admin management portal.';
      setError(typeof msg === 'string' ? msg : 'Failed to load admin management portal.');
      showToast(typeof msg === 'string' ? msg : 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleToggleActive = async (targetUser: User) => {
    try {
      const updated = await api.put<User>(`/users/${targetUser.id}`, {
        is_active: !targetUser.is_active,
      });
      showToast(
        `User ${targetUser.full_name} is now ${updated.data.is_active ? 'active' : 'deactivated'}.`,
        'success'
      );
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated.data : u)));
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to toggle user status.';
      showToast(typeof msg === 'string' ? msg : 'Failed to toggle user status.', 'error');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deletingUser.id}`);
      showToast(`Removed user "${deletingUser.full_name}" from platform.`, 'info');
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to delete user.';
      showToast(typeof msg === 'string' ? msg : 'Failed to delete user.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.company_name || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading Admin control system..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>System Administration & Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {view === 'users' ? 'User & Recruiter Management' : 'Admin Master Console'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {view === 'users'
              ? 'Search accounts, filter by role, toggle account access, or remove users.'
              : 'Manage platform accounts, monitor user roles, and oversee all platform operations.'}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAdminData}
            className="px-3 py-1 rounded-lg bg-white border border-rose-200 font-semibold hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview Stat Cards + Quick Navigation (Overview view) */}
      {view === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                {stats?.total_users ?? users.length}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {stats?.job_seekers ?? 0} Candidates • {stats?.recruiters ?? 0} Recruiters
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Jobs</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">{stats?.active_jobs ?? 0}</div>
              <div className="mt-1 text-xs text-slate-400">Out of {stats?.total_jobs ?? 0} total jobs</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumes Indexed</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">{stats?.total_resumes ?? 0}</div>
              <div className="mt-1 text-xs text-slate-400">PDF & DOCX files parsed</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                {stats?.total_applications ?? 0}
              </div>
              <div className="mt-1 text-xs text-slate-400">Scored via NLP engine</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/admin/jobs"
              className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm flex items-center gap-3 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Manage All Jobs</div>
                <div className="text-[11px] text-slate-500">Create, edit, or delete job postings</div>
              </div>
            </Link>

            <Link
              to="/admin/applications"
              className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm flex items-center gap-3 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Candidate Pipeline</div>
                <div className="text-[11px] text-slate-500">Inspect resumes & hiring decisions</div>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm flex items-center gap-3 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Reports & Analytics</div>
                <div className="text-[11px] text-slate-500">View 4 compliance reports & CSV exports</div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* User Directory Table with Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user name, email, or company..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="font-semibold text-slate-500">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white"
            >
              <option value="All">All Roles</option>
              <option value="JOB_SEEKER">Job Seekers</option>
              <option value="RECRUITER">Recruiters</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Title / Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No user accounts match your current filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {u.full_name} {isSelf && <span className="text-[10px] text-indigo-600">(You)</span>}
                        </div>
                        <div className="text-slate-400 text-xs">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            u.role === 'ADMIN'
                              ? 'danger'
                              : u.role === 'RECRUITER'
                              ? 'primary'
                              : 'secondary'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {u.company_name || u.current_title || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleToggleActive(u)}
                          title={isSelf ? 'Cannot deactivate your own account' : 'Toggle active status'}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title={isSelf ? 'Cannot delete your own admin account' : 'Delete user'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete User Account?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently remove{' '}
                  <span className="font-semibold text-slate-800">{deletingUser.full_name}</span> (
                  {deletingUser.email}) and their associated records?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
