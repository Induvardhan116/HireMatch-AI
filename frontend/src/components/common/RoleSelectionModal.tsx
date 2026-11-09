import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, ShieldCheck, X, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardRoute } from '../../utils/navigation';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [adminNotice, setAdminNotice] = useState(false);

  if (!isOpen) return null;

  // If already authenticated, redirect to verified dashboard instead of registration
  if (user) {
    onClose();
    navigate(getDashboardRoute(user.role));
    return null;
  }

  const handleSelectRole = (role: 'JOB_SEEKER' | 'RECRUITER') => {
    onClose();
    navigate(`/register?role=${role}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl transition hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Join HireMatch AI</h3>
          <p className="text-xs text-slate-500 mt-1">Select your account type to proceed with registration</p>
        </div>

        <div className="space-y-3">
          {/* Option 1: Job Seeker */}
          <div
            onClick={() => handleSelectRole('JOB_SEEKER')}
            className="p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">Job Seeker</h4>
                <p className="text-[11px] text-slate-500">Upload resume, extract skills, and match with tech roles</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>

          {/* Option 2: Recruiter */}
          <div
            onClick={() => handleSelectRole('RECRUITER')}
            className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">Recruiter</h4>
                <p className="text-[11px] text-slate-500">Post job openings, screen resumes, and review applicants</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
          </div>

          {/* Option 3: Admin (Restricted Security Option) */}
          <div
            onClick={() => setAdminNotice(!adminNotice)}
            className="p-4 rounded-2xl border border-dashed border-slate-300 hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition">Administrator</h4>
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Protected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">System oversight, platform users, and reports</p>
              </div>
            </div>
            <span className="text-xs text-purple-600 font-semibold">{adminNotice ? 'Hide' : 'Info'}</span>
          </div>

          {/* Admin Policy Notice */}
          {adminNotice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 mb-0.5">Admin Security Policy</p>
                <p>
                  Public registration for Admin accounts is strictly prohibited. Admin accounts must be created by an existing administrator or provisioned during system initialization.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="mt-2 text-indigo-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Already an admin? Log in with your admin credentials</span> &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
