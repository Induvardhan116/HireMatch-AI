import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  MapPin,
  DollarSign,
  AlertCircle,
  X,
  Trash2,
  Eye,
  Plus,
  Save,
  Search,
  Filter,
  User as UserIcon,
  Phone,
  Mail,
  Send,
  Check,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Resume, Application, Job, User } from '../types';
import { Badge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

type DashboardSection = 'overview' | 'resumes' | 'skills' | 'recommendations' | 'search_jobs' | 'applications' | 'profile';

export const JobSeekerDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Resume Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Skills Editor State
  const [editableSkills, setEditableSkills] = useState<{ [category: string]: string[] }>({});
  const [newSkillCategory, setNewSkillCategory] = useState('Programming Languages');
  const [newSkillName, setNewSkillName] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  // Recommended Jobs Filter State
  const [recSearch, setRecSearch] = useState('');
  const [recLocation, setRecLocation] = useState('');
  const [recExpLevel, setRecExpLevel] = useState('All');
  const [recMinMatch, setRecMinMatch] = useState('All');

  // Search All Jobs State
  const [allJobsSearch, setAllJobsSearch] = useState('');
  const [allJobsLocation, setAllJobsLocation] = useState('');
  const [allJobsType, setAllJobsType] = useState('All');

  // Application Modal State
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.full_name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileTitle, setProfileTitle] = useState(user?.current_title || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Initialize data
  const fetchData = async () => {
    try {
      const [resumesRes, appsRes, statsRes, jobsRes] = await Promise.all([
        api.get<Resume[]>('/resumes/'),
        api.get<Application[]>('/applications/my'),
        api.get('/analytics/overview'),
        api.get<Job[]>('/jobs/'),
      ]);

      setResumes(resumesRes.data);
      setApplications(appsRes.data);
      setStats(statsRes.data?.stats);
      setAllJobs(jobsRes.data);

      if (resumesRes.data.length > 0) {
        const primary = resumesRes.data.find(r => r.is_primary) || resumesRes.data[0];
        setSelectedResume(primary);
        initializeSkillsEditor(primary);
      }

      // Fetch personalized recommendations
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to load job seeker data:', err);
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const recRes = await api.get<Job[]>('/jobs/recommendations/me');
      setRecommendedJobs(recRes.data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update skills editor when selected resume changes
  const initializeSkillsEditor = (resume: Resume) => {
    if (resume.categorized_skills && Object.keys(resume.categorized_skills).length > 0) {
      setEditableSkills(JSON.parse(JSON.stringify(resume.categorized_skills)));
    } else {
      // Fallback
      setEditableSkills({
        'Programming Languages': resume.skills || [],
        'Frameworks & Libraries': [],
        'Databases & Storage': [],
        'Cloud & DevOps': [],
        'Other / Tools': [],
      });
    }
  };

  const handleSelectResume = (res: Resume) => {
    setSelectedResume(res);
    initializeSkillsEditor(res);
  };

  // Upload handler
  const handleFileUpload = async (file: File) => {
    const validExts = ['.pdf', '.docx'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(fileExt)) {
      showToast('Please upload a PDF (.pdf) or Word document (.docx)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(25);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(65);
      const resp = await api.post<Resume>('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadProgress(100);
      showToast(`Resume "${file.name}" uploaded and parsed successfully!`, 'success');

      // Update resume state
      const updatedResumes = [resp.data, ...resumes.filter(r => r.id !== resp.data.id)];
      setResumes(updatedResumes);
      setSelectedResume(resp.data);
      initializeSkillsEditor(resp.data);

      // Re-fetch recommendations
      fetchRecommendations();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to parse resume file.';
      showToast(msg, 'error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteResume = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      showToast('Resume removed successfully.', 'info');
      const updated = resumes.filter(r => r.id !== id);
      setResumes(updated);
      if (selectedResume?.id === id) {
        const next = updated[0] || null;
        setSelectedResume(next);
        if (next) initializeSkillsEditor(next);
      }
      fetchRecommendations();
    } catch (err) {
      showToast('Failed to delete resume.', 'error');
    }
  };

  const handleViewRawText = async (id: number) => {
    try {
      const resp = await api.get(`/resumes/${id}`);
      setPreviewText(resp.data.extracted_text || 'No text content available.');
    } catch (err) {
      showToast('Failed to load raw extracted text.', 'error');
    }
  };

  // Skill Editor Operations
  const handleRemoveSkill = (category: string, skillToRemove: string) => {
    const updated = { ...editableSkills };
    if (updated[category]) {
      updated[category] = updated[category].filter(s => s !== skillToRemove);
      setEditableSkills(updated);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    const updated = { ...editableSkills };
    if (!updated[newSkillCategory]) {
      updated[newSkillCategory] = [];
    }
    if (!updated[newSkillCategory].some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      updated[newSkillCategory].push(trimmed);
      setEditableSkills(updated);
      setNewSkillName('');
      showToast(`Added "${trimmed}" to ${newSkillCategory}`, 'info');
    } else {
      showToast('Skill already exists in this category.', 'info');
    }
  };

  const handleSaveSkills = async () => {
    if (!selectedResume) {
      showToast('Please select a resume first.', 'error');
      return;
    }

    setSavingSkills(true);
    const flatSkills: string[] = [];
    Object.values(editableSkills).forEach(arr => {
      arr.forEach(s => {
        if (!flatSkills.includes(s)) flatSkills.push(s);
      });
    });

    try {
      const resp = await api.put<Resume>(`/resumes/${selectedResume.id}/skills`, {
        skills: flatSkills,
        categorized_skills: editableSkills,
      });

      showToast('Skills updated and saved to resume profile!', 'success');
      setSelectedResume(resp.data);
      setResumes(resumes.map(r => (r.id === resp.data.id ? resp.data : r)));

      // Re-trigger job recommendations with updated skills
      fetchRecommendations();
    } catch (err) {
      showToast('Failed to update skills.', 'error');
    } finally {
      setSavingSkills(false);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const resp = await api.put<User>('/auth/me', {
        full_name: profileName,
        phone: profilePhone || undefined,
        current_title: profileTitle || undefined,
        bio: profileBio || undefined,
      });
      updateUser(resp.data);
      showToast('Profile information updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Job Application Modal & Submission
  const handleOpenApplyModal = (job: Job) => {
    if (!selectedResume && resumes.length === 0) {
      showToast('Please upload a resume before applying to jobs.', 'info');
      setActiveSection('resumes');
      return;
    }
    setApplyingJob(job);
    setCoverNote('');
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    const resumeToUse = selectedResume || resumes[0];
    if (!resumeToUse) {
      showToast('No active resume found for submission.', 'error');
      return;
    }

    setSubmittingApp(true);
    try {
      const resp = await api.post<Application>('/applications/', {
        job_id: applyingJob.id,
        resume_id: resumeToUse.id,
        cover_note: coverNote || undefined,
      });

      showToast(`Application successfully submitted for ${applyingJob.title}!`, 'success');
      setApplications([resp.data, ...applications.filter(a => a.job_id !== applyingJob.id)]);
      setApplyingJob(null);
      setCoverNote('');

      // Refresh applications from server
      const appsRes = await api.get<Application[]>('/applications/my');
      setApplications(appsRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit application.';
      showToast(msg, 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  const isJobApplied = (jobId: number) => {
    return applications.some(a => a.job_id === jobId);
  };

  // Filtering recommended jobs
  const filteredRecommendations = recommendedJobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(recSearch.toLowerCase()) ||
      job.company.toLowerCase().includes(recSearch.toLowerCase()) ||
      job.required_skills?.some(s => s.toLowerCase().includes(recSearch.toLowerCase()));

    const matchesLocation =
      !recLocation || job.location.toLowerCase().includes(recLocation.toLowerCase());

    const matchesExp =
      recExpLevel === 'All' || job.experience_level === recExpLevel;

    const score = job.skill_match_percentage ?? job.recommendation_score ?? 0;
    const matchesMin =
      recMinMatch === 'All'
        ? true
        : recMinMatch === '85'
        ? score >= 85
        : recMinMatch === '70'
        ? score >= 70
        : recMinMatch === '50'
        ? score >= 50
        : true;

    return matchesSearch && matchesLocation && matchesExp && matchesMin;
  });

  // Filtering all jobs
  const filteredAllJobs = allJobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(allJobsSearch.toLowerCase()) ||
      job.company.toLowerCase().includes(allJobsSearch.toLowerCase()) ||
      job.description.toLowerCase().includes(allJobsSearch.toLowerCase());

    const matchesLocation =
      !allJobsLocation || job.location.toLowerCase().includes(allJobsLocation.toLowerCase());

    const matchesType =
      allJobsType === 'All' || job.job_type === allJobsType;

    return matchesSearch && matchesLocation && matchesType;
  });

  if (loading) {
    return <LoadingSpinner message="Loading your HireMatch AI career workspace..." />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Resume Optimization & Job Matching Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Your profile and active resume are matched against open engineering positions. Upload or refine your skills to maximize your ATS match score.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <label
              htmlFor="dashboard-resume-upload-quick"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-indigo-900 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Your Resume</span>
              <input
                id="dashboard-resume-upload-quick"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            <button
              onClick={() => setActiveSection('recommendations')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2 border border-white/10 backdrop-blur"
            >
              <Briefcase className="w-4 h-4 text-indigo-300" />
              <span>Recommended Jobs ({recommendedJobs.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('skills')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2 border border-white/10 backdrop-blur"
            >
              <Tag className="w-4 h-4 text-amber-300" />
              <span>Edit Extracted Skills</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Sparkles },
          { id: 'resumes', label: `My Resumes (${resumes.length})`, icon: FileText },
          { id: 'skills', label: 'Extracted Skills', icon: Tag },
          { id: 'recommendations', label: `Matching Jobs (${recommendedJobs.length})`, icon: Award },
          { id: 'search_jobs', label: 'Search All Jobs', icon: Search },
          { id: 'applications', label: `My Applications (${applications.length})`, icon: Clock },
          { id: 'profile', label: 'Candidate Profile', icon: UserIcon },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as DashboardSection)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{resumes.length}</div>
          <div className="mt-1 text-xs text-slate-400">PDF & DOCX stored</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Roles</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-purple-600">{recommendedJobs.length}</div>
          <div className="mt-1 text-xs text-slate-400">Compatible positions</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{applications.length}</div>
          <div className="mt-1 text-xs text-slate-400">Submitted to recruiters</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Match Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-600">
            {recommendedJobs.length > 0
              ? `${Math.round(
                  recommendedJobs.reduce((acc, j) => acc + (j.skill_match_percentage || j.recommendation_score || 0), 0) /
                    recommendedJobs.length
                )}%`
              : 'N/A'}
          </div>
          <div className="mt-1 text-xs text-slate-400">Algorithmic skill overlap</div>
        </div>
      </div>

      {/* Upload Progress Bar if uploading */}
      {uploading && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-2">
            <span>Parsing resume and categorizing skills...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* SECTION: OVERVIEW & RESUME REPOSITORY */}
      {(activeSection === 'overview' || activeSection === 'resumes') && (
        <div className="space-y-6">
          {/* Resume Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              id="resume-file-input-main"
              accept=".pdf,.docx"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800">
              {uploading ? 'Parsing and extracting resume content...' : 'Upload Your Resume'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
              Drag and drop your PDF or DOCX file here, or click to browse (Max 10MB).
            </p>

            <label
              htmlFor="resume-file-input-main"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm hover:shadow"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Extracting Text...' : 'Select File (PDF / DOCX)'}</span>
            </label>
          </div>

          {/* Resumes List & Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Resume Documents</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage uploaded files and select active ATS profile</p>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                {resumes.length} document{resumes.length === 1 ? '' : 's'} on file
              </div>
            </div>

            {resumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map(resume => {
                  const isSelected = selectedResume?.id === resume.id;
                  return (
                    <div
                      key={resume.id}
                      onClick={() => handleSelectResume(resume)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/60 border-indigo-400 shadow-sm ring-1 ring-indigo-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                            {resume.file_type}
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-slate-900 truncate" title={resume.filename}>
                              {resume.filename}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {(resume.file_size / 1024).toFixed(1)} KB • {new Date(resume.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteResume(resume.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {resume.skills?.length || 0} skills detected
                        </span>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleViewRawText(resume.id);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Text</span>
                        </button>
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-2 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Currently Selected for Matching</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No Resume Uploaded Yet"
                description="Upload your PDF or DOCX resume to start extracting categorized technical skills and matching jobs."
                actionText="Upload Resume"
                onAction={() => document.getElementById('resume-file-input-main')?.click()}
              />
            )}
          </div>
        </div>
      )}

      {/* SECTION: EXTRACTED SKILLS & SKILLS EDITOR */}
      {(activeSection === 'overview' || activeSection === 'skills') && selectedResume && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Extracted Technical Skills & Skill Editor</h2>
                <Badge variant="primary">{selectedResume.filename}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review skills extracted from your resume. Add new skills or remove inaccuracies, then click "Save Changes".
              </p>
            </div>

            <button
              onClick={handleSaveSkills}
              disabled={savingSkills}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSkills ? 'Saving...' : 'Save Skill Changes'}</span>
            </button>
          </div>

          {/* Add Skill Form */}
          <form onSubmit={handleAddSkill} className="flex flex-wrap gap-2.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                placeholder="Enter skill name (e.g. FastAPI, Kubernetes, GraphQL)..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <select
              value={newSkillCategory}
              onChange={e => setNewSkillCategory(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
            >
              <option value="Programming Languages">Programming Languages</option>
              <option value="Frameworks & Libraries">Frameworks & Libraries</option>
              <option value="Databases & Storage">Databases & Storage</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="Certifications">Certifications</option>
              <option value="Other / Tools">Other / Tools</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </form>

          {/* Categorized Skills Chips */}
          <div className="space-y-4">
            {Object.keys(editableSkills).length === 0 || Object.values(editableSkills).every(a => a.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No skills extracted yet. Use the form above to add skills.</p>
            ) : (
              Object.entries(editableSkills).map(([category, skillList]) => {
                if (skillList.length === 0) return null;
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>{category} ({skillList.length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {skillList.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(category, skill)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title={`Remove ${skill}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION: FIND JOBS BASED ON YOUR RESUME / RECOMMENDED JOBS */}
      {(activeSection === 'overview' || activeSection === 'recommendations') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold mb-1 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Explainable ATS Skill Match Formula Active</span>
              </div>
              <h2 className="text-base font-bold text-slate-900">Recommended Jobs Based on Your Resume</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formula: Skill Match = (Matching required skills / Total required skills) * 100
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Showing {filteredRecommendations.length} matched positions
            </div>
          </div>

          {/* Recommendation Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Keyword / Title
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={recSearch}
                  onChange={e => setRecSearch(e.target.value)}
                  placeholder="e.g. Python, Full-Stack"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={recLocation}
                  onChange={e => setRecLocation(e.target.value)}
                  placeholder="e.g. Remote, San Francisco"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Experience Level
              </label>
              <select
                value={recExpLevel}
                onChange={e => setRecExpLevel(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Experience Levels</option>
                <option value="Junior">Junior</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Minimum Match %
              </label>
              <select
                value={recMinMatch}
                onChange={e => setRecMinMatch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Match Scores</option>
                <option value="50">50% and above</option>
                <option value="70">70% and above</option>
                <option value="85">85% and above</option>
              </select>
            </div>
          </div>

          {/* Job Recommendation Cards */}
          {filteredRecommendations.length > 0 ? (
            <div className="space-y-4">
              {filteredRecommendations.map(job => {
                const matchPct = Math.round(job.skill_match_percentage ?? job.recommendation_score ?? 0);
                const applied = isJobApplied(job.id);

                return (
                  <div
                    key={job.id}
                    className="p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-white hover:shadow-md space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                          <Badge variant="primary">{job.experience_level}</Badge>
                          <Badge variant="neutral">{job.job_type}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{job.company}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </span>
                          {job.salary_range && (
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              {job.salary_range}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Min {job.min_experience_years} yrs exp
                          </span>
                        </div>
                      </div>

                      {/* Match Score Badge & Apply CTA */}
                      <div className="flex items-center gap-4 self-end lg:self-auto">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`text-xl font-extrabold ${
                              matchPct >= 75 ? 'text-emerald-600' : matchPct >= 50 ? 'text-amber-600' : 'text-slate-600'
                            }`}>
                              {matchPct}%
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">Match</span>
                          </div>
                          <p className="text-[10px] text-slate-400">Skill Alignment</p>
                        </div>

                        {applied ? (
                          <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Applied</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenApplyModal(job)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Apply Now</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Skill Breakdown: Matched vs Missing */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                          Required Skills:
                        </span>
                        {job.required_skills?.map((skill, idx) => {
                          const isMatched = job.matched_skills?.some(s => s.toLowerCase() === skill.toLowerCase());
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg border ${
                                isMatched
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isMatched ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <X className="w-3 h-3 text-rose-500" />
                              )}
                              <span>{skill}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Matching Skills Green vs Missing Skills Red Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-900 font-medium text-[11px]">
                            {job.matched_skills?.length || 0} matching skills in your resume
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-rose-900 font-medium text-[11px]">
                            {job.missing_skills?.length || 0} skills missing from requirements
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No Matching Jobs Found"
              description="Try adjusting your search criteria, or add more technical skills in the Extracted Skills editor."
              actionText="Reset Filters"
              onAction={() => {
                setRecSearch('');
                setRecLocation('');
                setRecExpLevel('All');
                setRecMinMatch('All');
              }}
            />
          )}
        </div>
      )}

      {/* SECTION: SEARCH ALL OPEN JOBS */}
      {activeSection === 'search_jobs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Explore Open Opportunities</h2>
            <p className="text-xs text-slate-500 mt-0.5">Browse and filter all available positions across employers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Search Keyword
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={allJobsSearch}
                  onChange={e => setAllJobsSearch(e.target.value)}
                  placeholder="Job title, tech stack..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={allJobsLocation}
                  onChange={e => setAllJobsLocation(e.target.value)}
                  placeholder="City, State, Remote..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Job Type
              </label>
              <select
                value={allJobsType}
                onChange={e => setAllJobsType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAllJobs.map(job => {
              const applied = isJobApplied(job.id);
              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                      <Badge variant="primary">{job.experience_level}</Badge>
                      <Badge variant="neutral">{job.job_type}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {job.company} • {job.location} • {job.salary_range || 'Competitive'}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-1">{job.description}</p>
                  </div>

                  <div className="shrink-0">
                    {applied ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenApplyModal(job)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: MY APPLICATIONS PIPELINE */}
      {(activeSection === 'overview' || activeSection === 'applications') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Application Pipeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking updated by recruiters</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {applications.length} active application{applications.length === 1 ? '' : 's'}
            </span>
          </div>

          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                    <th className="pb-3 font-semibold">Job Title & Company</th>
                    <th className="pb-3 font-semibold">Match Score</th>
                    <th className="pb-3 font-semibold">Current Status</th>
                    <th className="pb-3 font-semibold">Submitted Date</th>
                    <th className="pb-3 font-semibold text-right">Recruiter Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-slate-800 text-sm">{app.job?.title || 'Engineering Role'}</div>
                        <div className="text-slate-400 text-xs">{app.job?.company} • {app.job?.location}</div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${
                            app.match_score >= 75 ? 'text-emerald-600' : app.match_score >= 50 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {app.match_score}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                app.match_score >= 75 ? 'bg-emerald-500' : app.match_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${app.match_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right text-slate-500">
                        {app.recruiter_notes ? (
                          <span className="text-slate-700 italic text-[11px]">"{app.recruiter_notes}"</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Under assessment</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No Applications Submitted Yet"
              description="Explore open jobs matching your skill profile and submit your first AI-scored application."
              actionText="View Matching Jobs"
              onAction={() => setActiveSection('recommendations')}
            />
          )}
        </div>
      )}

      {/* SECTION: CANDIDATE PROFILE */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6 max-w-2xl">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Candidate Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage personal information and professional background</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Email is tied to your login account.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Role / Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={profileTitle}
                  onChange={e => setProfileTitle(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Bio / Summary
              </label>
              <textarea
                value={profileBio}
                onChange={e => setProfileBio(e.target.value)}
                rows={3}
                placeholder="Brief summary of your professional background, focus areas, and interests..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Updating Profile...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Raw Extracted Text Modal */}
      {previewText !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Raw Extracted Plaintext</h3>
              <button
                onClick={() => setPreviewText(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 flex-1">
              {previewText}
            </div>
            <div className="p-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setPreviewText(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Apply Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-slide-up">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply to {applyingJob.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{applyingJob.company} • {applyingJob.location}</p>
              </div>
              <button
                onClick={() => setApplyingJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Resume Attached:</span>
              </div>
              <p className="text-[11px] text-indigo-700">
                {selectedResume ? selectedResume.filename : resumes[0]?.filename}
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cover Note / Pitch (Optional)
                </label>
                <textarea
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  rows={4}
                  placeholder="Highlight your relevant experience, technical strengths, or passion for this role..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingApp ? 'Submitting Application...' : 'Confirm & Apply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
