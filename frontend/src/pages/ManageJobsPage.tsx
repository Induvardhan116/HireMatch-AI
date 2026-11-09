import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  X,
  CheckCircle2,
  Users,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { Job } from '../types';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const ManageJobsPage: React.FC = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [expLevel, setExpLevel] = useState('Mid-Level');
  const [minExpYears, setMinExpYears] = useState<number>(3.0);
  const [salaryRange, setSalaryRange] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [niceSkillsInput, setNiceSkillsInput] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  const fetchJobs = async () => {
    try {
      const resp = await api.get<Job[]>('/jobs/', { params: { active_only: false } });
      setJobs(resp.data);
    } catch (err) {
      showToast('Failed to load jobs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openCreateModal = () => {
    setEditingJob(null);
    setTitle('');
    setCompany('CloudScale Technologies');
    setDepartment('Engineering');
    setLocation('Remote');
    setJobType('Full-time');
    setExpLevel('Mid-Level');
    setMinExpYears(3.0);
    setSalaryRange('$120,000 - $150,000');
    setSkillsInput('Python, React, TypeScript, Docker, PostgreSQL');
    setNiceSkillsInput('AWS, Kubernetes, CI/CD');
    setDescription('');
    setRequirements('');
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setTitle(job.title);
    setCompany(job.company);
    setDepartment(job.department || '');
    setLocation(job.location);
    setJobType(job.job_type);
    setExpLevel(job.experience_level);
    setMinExpYears(job.min_experience_years);
    setSalaryRange(job.salary_range || '');
    setSkillsInput(job.required_skills?.join(', ') || '');
    setNiceSkillsInput(job.nice_to_have_skills?.join(', ') || '');
    setDescription(job.description);
    setRequirements(job.requirements || '');
    setIsModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location) {
      showToast('Please fill in Title, Location, and Description.', 'error');
      return;
    }

    const parseSkills = (str: string) =>
      str.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

    const payload = {
      title,
      company,
      department: department || undefined,
      location,
      job_type: jobType,
      experience_level: expLevel,
      min_experience_years: Number(minExpYears),
      salary_range: salaryRange || undefined,
      description,
      requirements: requirements || undefined,
      required_skills: parseSkills(skillsInput),
      nice_to_have_skills: parseSkills(niceSkillsInput),
    };

    setSubmitting(true);
    try {
      if (editingJob) {
        const resp = await api.put<Job>(`/jobs/${editingJob.id}`, payload);
        showToast('Job posting updated successfully!', 'success');
        setJobs(jobs.map((j) => (j.id === editingJob.id ? resp.data : j)));
      } else {
        const resp = await api.post<Job>('/jobs/', payload);
        showToast('New job requisition created successfully!', 'success');
        setJobs([resp.data, ...jobs]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save job posting.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      showToast('Job posting deleted.', 'info');
      setJobs(jobs.filter((j) => j.id !== id));
    } catch (err) {
      showToast('Failed to delete job posting.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading job management workspace..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Job Postings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, edit, and organize requisitions with customized skill taxonomies.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm hover:shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="py-4 px-6 font-semibold">Job Title & Company</th>
                  <th className="py-4 px-4 font-semibold">Location & Type</th>
                  <th className="py-4 px-4 font-semibold">Min Experience</th>
                  <th className="py-4 px-4 font-semibold">Required Skills</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                      <div className="text-slate-400 text-xs">{job.company} • {job.department || 'General'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-700 font-medium">{job.location}</div>
                      <Badge variant="neutral" size="sm" className="mt-1">{job.job_type}</Badge>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {job.min_experience_years} years ({job.experience_level})
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills?.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600"
                          >
                            {s}
                          </span>
                        ))}
                        {job.required_skills && job.required_skills.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{job.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {job.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Closed</Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(job)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Edit job"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No Job Postings Yet"
            description="Create your first job requisition to begin screening applicants with ATS scores."
            actionText="Create Job"
            onAction={openCreateModal}
          />
        )}
      </div>

      {/* Create / Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingJob ? 'Edit Job Posting' : 'Create New Job Requisition'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. CloudScale Technologies"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco or Remote"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Experience Level
                  </label>
                  <select
                    value={expLevel}
                    onChange={(e) => setExpLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Entry">Entry Level</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min Experience (Years)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={minExpYears}
                    onChange={(e) => setMinExpYears(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Salary Range (Optional)
                  </label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. $130k - $160k"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Required Technical Skills (Comma separated) *
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. Python, FastAPI, React, PostgreSQL, Docker"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nice-to-Have Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={niceSkillsInput}
                  onChange={(e) => setNiceSkillsInput(e.target.value)}
                  placeholder="e.g. AWS, Kubernetes, Terraform, GraphQL"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Job Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of team responsibilities, daily work, and project scope..."
                  rows={4}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Requirements & Qualifications
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Specific degree requirements, years of experience, or industry background..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingJob ? 'Update Requisition' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

