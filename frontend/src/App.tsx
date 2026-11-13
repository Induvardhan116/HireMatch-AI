import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { getDashboardRoute } from './utils/navigation';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const JobListingsPage = lazy(() => import('./pages/JobListingsPage').then((m) => ({ default: m.JobListingsPage })));
const ResumeAnalysisPage = lazy(() => import('./pages/ResumeAnalysisPage').then((m) => ({ default: m.ResumeAnalysisPage })));
const JobSeekerDashboard = lazy(() => import('./pages/JobSeekerDashboard').then((m) => ({ default: m.JobSeekerDashboard })));
const ResumeUploadPage = lazy(() => import('./pages/ResumeUploadPage').then((m) => ({ default: m.ResumeUploadPage })));
const JobRecommendationsPage = lazy(() => import('./pages/JobRecommendationsPage').then((m) => ({ default: m.JobRecommendationsPage })));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage').then((m) => ({ default: m.MyApplicationsPage })));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard').then((m) => ({ default: m.RecruiterDashboard })));
const ManageJobsPage = lazy(() => import('./pages/ManageJobsPage').then((m) => ({ default: m.ManageJobsPage })));
const CandidateManagementPage = lazy(() => import('./pages/CandidateManagementPage').then((m) => ({ default: m.CandidateManagementPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const ReportsAnalyticsPage = lazy(() => import('./pages/ReportsAnalyticsPage').then((m) => ({ default: m.ReportsAnalyticsPage })));
const AccessDeniedPage = lazy(() => import('./pages/AccessDeniedPage').then((m) => ({ default: m.AccessDeniedPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Route Guard for unauthenticated pages (Login & Register):
// If the user is already authenticated, immediately redirects them to their canonical dashboard.
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-medium">Verifying session...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  return <>{children}</>;
};

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-medium">Verifying authenticated session...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but role is unauthorized for this route -> Access Denied (HTTP 403)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDeniedPage userRole={user.role} allowedRoles={allowedRoles} />;
  }

  return <>{children}</>;
};

// Shared Layout for pages accessible both publicly and inside an authenticated dashboard session
// Keeps the dashboard sidebar visible whenever the user is logged in.
const AuthAwareLayout: React.FC<{ children: React.ReactNode; constrainPublicWidth?: boolean }> = ({
  children,
  constrainPublicWidth = false,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-medium">Loading workspace...</p>
      </div>
    );
  }

  if (user) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      {constrainPublicWidth ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">{children}</main>
      ) : (
        children
      )}
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <LoadingSpinner message="Loading page..." />
          </div>
        }
      >
        <Routes>
          {/* Public Layout Pages */}
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <LandingPage />
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                  <Navbar />
                  <LoginPage />
                </div>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                  <Navbar />
                  <RegisterPage />
                </div>
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <AuthAwareLayout>
                <JobListingsPage />
              </AuthAwareLayout>
            }
          />
          <Route
            path="/matcher"
            element={
              <AuthAwareLayout constrainPublicWidth>
                <ResumeAnalysisPage />
              </AuthAwareLayout>
            }
          />

          {/* Job Seeker Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['JOB_SEEKER', 'ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<JobSeekerDashboard />} />
            <Route path="resumes" element={<ResumeUploadPage />} />
            <Route path="matcher" element={<ResumeAnalysisPage />} />
            <Route path="recommendations" element={<JobRecommendationsPage />} />
            <Route path="jobs" element={<JobListingsPage />} />
            <Route path="applications" element={<MyApplicationsPage />} />
          </Route>

          {/* Recruiter Protected Routes */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RecruiterDashboard />} />
            <Route path="jobs" element={<ManageJobsPage />} />
            <Route path="candidates" element={<CandidateManagementPage />} />
            <Route path="matcher" element={<ResumeAnalysisPage />} />
            <Route path="reports" element={<ReportsAnalyticsPage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard key="overview" view="overview" />} />
            <Route path="users" element={<AdminDashboard key="users" view="users" />} />
            <Route path="jobs" element={<ManageJobsPage />} />
            <Route path="applications" element={<CandidateManagementPage />} />
            <Route path="matcher" element={<ResumeAnalysisPage />} />
            <Route path="reports" element={<ReportsAnalyticsPage />} />
          </Route>

          {/* Not Found */}
          <Route
            path="*"
            element={
              <AuthAwareLayout>
                <NotFoundPage />
              </AuthAwareLayout>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
