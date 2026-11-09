import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JobListingsPage } from './pages/JobListingsPage';
import { ResumeAnalysisPage } from './pages/ResumeAnalysisPage';
import { JobSeekerDashboard } from './pages/JobSeekerDashboard';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { JobRecommendationsPage } from './pages/JobRecommendationsPage';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { ManageJobsPage } from './pages/ManageJobsPage';
import { CandidateManagementPage } from './pages/CandidateManagementPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { getDashboardRoute } from './utils/navigation';

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

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
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
                <div className="min-h-screen bg-slate-50 flex flex-col">
                  <Navbar />
                  <JobListingsPage />
                </div>
              }
            />
            <Route
              path="/matcher"
              element={
                <div className="min-h-screen bg-slate-50 flex flex-col">
                  <Navbar />
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <ResumeAnalysisPage />
                  </main>
                </div>
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
              <Route path="recommendations" element={<JobRecommendationsPage />} />
              <Route path="applications" element={<JobSeekerDashboard />} />
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
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminDashboard />} />
              <Route path="jobs" element={<ManageJobsPage />} />
              <Route path="applications" element={<CandidateManagementPage />} />
              <Route path="reports" element={<ReportsAnalyticsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
