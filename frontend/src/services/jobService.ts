import { api } from './api';
import { Job, UserRole } from '../types';

export interface JobFilterParams {
  search?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  skill?: string;
  active_only?: boolean;
}

export interface JobWritePayload {
  title: string;
  company: string;
  department?: string;
  location: string;
  job_type: string;
  experience_level: string;
  min_experience_years: number;
  salary_range?: string;
  description: string;
  requirements?: string;
  required_skills: string[];
  nice_to_have_skills: string[];
}

export function extractApiError(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => (typeof item?.msg === 'string' ? item.msg : JSON.stringify(item)))
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join('; ');
    }
  }
  if (typeof err?.message === 'string' && err.message.trim() && !err.message.startsWith('Request failed')) {
    return err.message;
  }
  return fallback;
}

function assertJobArray(data: unknown): Job[] {
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format while loading job postings.');
  }
  return data;
}

/**
 * Fetches jobs for /recruiter/jobs and /admin/jobs.
 * Uses GET /api/jobs/my, which returns recruiter-owned jobs (active & closed)
 * for RECRUITER and all platform jobs (active & closed) for ADMIN.
 */
export async function fetchManagedJobs(): Promise<Job[]> {
  const resp = await api.get<Job[]>('/jobs/my');
  return assertJobArray(resp.data);
}

/**
 * Fetches job postings for Interactive Matcher (/recruiter/matcher, /admin/matcher, /dashboard/matcher, /matcher).
 */
export async function fetchMatcherJobs(role?: UserRole): Promise<Job[]> {
  if (role === 'RECRUITER') {
    const resp = await api.get<Job[]>('/jobs/my');
    return assertJobArray(resp.data);
  }
  if (role === 'ADMIN') {
    const resp = await api.get<Job[]>('/jobs/', { params: { active_only: false } });
    return assertJobArray(resp.data);
  }
  const resp = await api.get<Job[]>('/jobs/');
  return assertJobArray(resp.data);
}

export async function fetchPublicJobs(filters: JobFilterParams = {}): Promise<Job[]> {
  const params: Record<string, string | boolean> = {};
  if (filters.search) params.search = filters.search;
  if (filters.location) params.location = filters.location;
  if (filters.job_type && filters.job_type !== 'All') params.job_type = filters.job_type;
  if (filters.experience_level && filters.experience_level !== 'All') {
    params.experience_level = filters.experience_level;
  }
  if (filters.skill) params.skill = filters.skill;
  if (typeof filters.active_only === 'boolean') params.active_only = filters.active_only;

  const resp = await api.get<Job[]>('/jobs/', { params });
  return assertJobArray(resp.data);
}

export async function createJobPosting(payload: JobWritePayload): Promise<Job> {
  const resp = await api.post<Job>('/jobs/', payload);
  return resp.data;
}

export async function updateJobPosting(jobId: number, payload: Partial<JobWritePayload> & { is_active?: boolean }): Promise<Job> {
  const resp = await api.put<Job>(`/jobs/${jobId}`, payload);
  return resp.data;
}

export async function deleteJobPosting(jobId: number): Promise<void> {
  await api.delete(`/jobs/${jobId}`);
}

