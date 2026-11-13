import React, { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
      <div className="flex-1 flex min-h-0 max-w-7xl w-full mx-auto relative">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<LoadingSpinner message="Loading dashboard view..." />}>
              {children ?? <Outlet />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
