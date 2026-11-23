import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, SIDEBAR_WIDTH_PX } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { ErrorBoundary } from '../ErrorBoundary.jsx';
import { getPageTitle } from './pageTitles.js';
import { TutorialProvider } from '../../lib/tutorial.jsx';
import { AjudaFlutuante } from '../funis/AjudaFlutuante.jsx';

const CSS = `
.bd-appshell__content{margin-left:${SIDEBAR_WIDTH_PX}px;min-height:100vh;}
.bd-appshell__main{padding:var(--bd-space-8);padding-bottom:110px;flex:1;min-width:0;}
@media (max-width: 900px) {
  .bd-appshell__content{margin-left:0;}
  .bd-appshell__main{padding:var(--bd-space-5);padding-bottom:96px;}
}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-appshell-css')) {
  const s = document.createElement('style'); s.id = 'bd-appshell-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

export function AppShell() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const [navOpen, setNavOpen] = React.useState(false);

  React.useEffect(() => { setNavOpen(false); }, [location.pathname]);

  return (
    <TutorialProvider>
    <div style={{ minHeight: '100vh' }}>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="bd-u-flex-col bd-appshell__content">
        <Topbar title={title} onMenuClick={() => setNavOpen(true)} />
        <main className="bd-appshell__main">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <AjudaFlutuante />
    </div>
    </TutorialProvider>
  );
}
