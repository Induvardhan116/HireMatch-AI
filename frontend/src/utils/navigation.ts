import { UserRole } from '../types';

/**
 * Returns the canonical dashboard route for an authenticated user based strictly on their verified database role.
 *
 * JOB_SEEKER -> /dashboard
 * RECRUITER  -> /recruiter
 * ADMIN      -> /admin
 */
export const getDashboardRoute = (role?: UserRole | string | null): string => {
  if (!role) return '/login';
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'RECRUITER':
      return '/recruiter';
    case 'JOB_SEEKER':
      return '/dashboard';
    default:
      return '/';
  }
};

