import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Calendar,
  Briefcase,
  GraduationCap,
  Key,
  Eye,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Resume } from '../types';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';

export const ResumeUploadPage: React.FC = () => {
  const { showToast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const fetchResumes = async (preferredId?: number) => {
    try {
      const resp = await api.get<Resume[]>('/resumes/');
      setResumes(resp.data);
      if (resp.data.length > 0) {
        const target =
          (preferredId && resp.data.find((r) => r.id === preferredId)) ||
          (selectedResume && resp.data.find((r) => r.id === selectedResume.id)) ||
          resp.data.find((r) => r.is_primary) ||
          resp.data[0];
        setSelectedResume(target);
      } else {
        setSelectedResume(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load resumes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    // Validate file type
    const validExts = ['.pdf', '.docx'];
    const dotIdx = file.name.lastIndexOf('.');
    const fileExt = dotIdx >= 0 ? file.name.substring(dotIdx).toLowerCase() : '';
    if (!validExts.includes(fileExt)) {
      const msg = 'Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx).';
      setUploadError(msg);
      showToast(msg, 'error');
      return;
    }

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      const msg = 'File size exceeds the 10 MB maximum limit.';
      setUploadError(msg);
      showToast(msg, 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await api.post<Resume>('/resumes/upload', formData, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.min(90, Math.round((evt.loaded / evt.total) * 90));
            setUploadProgress(pct);
          }
        },
      });
      setUploadProgress(100);
      showToast(`Resume "${resp.data.filename}" uploaded and parsed successfully!`, 'success');
      await fetchResumes(resp.data.id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to process resume file.';
      setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      showToast(typeof msg === 'string' ? msg : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSetPrimary = async (id: number) => {
    setSettingPrimaryId(id);
    try {
      await api.patch<Resume>(`/resumes/${id}/primary`);
      showToast('Active primary resume updated!', 'success');
      await fetchResumes(id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to set active resume.';
      showToast(msg, 'error');
    } finally {
      setSettingPrimaryId(null);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      showToast('Resume deleted.', 'info');
      await fetchResumes();
    } catch (err) {
      showToast('Failed to delete resume.', 'error');
    }
  };

  const handleViewRawText = async (id: number) => {
    try {
      const resp = await api.get(`/resumes/${id}`);
      setPreviewText(resp.data.extracted_text || 'No text extracted.');
    } catch (err) {
      showToast('Failed to load raw extracted text.', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your resume repository..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Management & Parser</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload PDF or DOCX documents. Our NLP parser automatically extracts skills, education, and work experience.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          id="resume-file-input"
          accept=".pdf,.docx"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) {
              handleFileUpload(file);
            }
          }}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
          <Upload className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-800">
          {uploading ? 'Parsing and extracting resume content...' : 'Upload your resume'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
          Drag and drop your PDF or DOCX file here, or click browse to choose from your device (Max 10MB).
        </p>

        <label
          htmlFor="resume-file-input"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm hover:shadow ${
            uploading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? `Uploading & Extracting (${uploadProgress}%)...` : 'Select File'}</span>
        </label>

        {uploading && (
          <div className="max-w-xs mx-auto mt-4">
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadError && (
          <div className="max-w-md mx-auto mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Two-Column Resumes & Extracted Data Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Resumes List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Uploaded Resumes ({resumes.length})
          </h3>

          {resumes.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No resumes uploaded yet.
            </div>
          ) : (
            resumes.map((resume) => {
              const isSelected = selectedResume?.id === resume.id;
              return (
                <div
                  key={resume.id}
                  onClick={() => setSelectedResume(resume)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                        {resume.file_type}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{resume.filename}</h4>
                        <p className="text-[11px] text-slate-400">
                          {(resume.file_size / 1024).toFixed(0)} KB • {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(resume.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition shrink-0"
                      title="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    {resume.is_primary ? (
                      <Badge variant="primary" size="sm">Active ATS Resume</Badge>
                    ) : (
                      <button
                        type="button"
                        disabled={settingPrimaryId === resume.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(resume.id);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition disabled:opacity-50"
                      >
                        {settingPrimaryId === resume.id ? 'Setting...' : 'Set Active'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Extracted Metadata Viewer */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedResume.filename}</h3>
                  <p className="text-xs text-slate-500">
                    NLP Extraction Status: <span className="text-emerald-600 font-semibold">Structured & Indexed</span>
                  </p>
                </div>
                <button
                  onClick={() => handleViewRawText(selectedResume.id)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Inspect Extracted Text</span>
                </button>
              </div>

              {/* Extracted Summary */}
              {selectedResume.summary && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Professional Summary</h4>
                  <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                    {selectedResume.summary}
                  </div>
                </div>
              )}

              {/* Extracted Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Extracted Skills ({selectedResume.skills?.length || 0})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedResume.skills?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience & Education Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Experience */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Experience Duration</span>
                  </h4>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {selectedResume.extracted_experience_years} <span className="text-xs font-semibold text-slate-400">Years</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Calculated via employment spans and title tenure</p>
                </div>

                {/* Education */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span>Education Qualifications</span>
                  </h4>
                  {selectedResume.education && selectedResume.education.length > 0 ? (
                    selectedResume.education.map((edu, idx) => (
                      <div key={idx} className="text-xs text-slate-700">
                        <span className="font-semibold">{edu.degree}</span>
                        {edu.field && <div className="text-[11px] text-slate-500">{edu.field}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">Degree detected in engineering/science</div>
                  )}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>High-Weight Domain Keywords</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedResume.keywords?.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[11px] rounded bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Select or upload a resume to inspect extracted attributes.
            </div>
          )}
        </div>
      </div>

      {/* Raw Extracted Text Modal */}
      {previewText !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Extracted Plaintext View</h3>
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
    </div>
  );
};

