import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { ErrorBoundary } from '../ErrorBoundary.jsx';
import { getPageTitle } from './pageTitles.js';

export function AppShell() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="bd-u-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="bd-u-flex-col" style={{ flex: 1, minWidth: 0 }}>
        <Topbar title={title} />
        <main style={{ padding: 'var(--bd-space-8)', flex: 1 }}>
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
