import React from 'react';
import { NavLink } from 'react-router-dom';
import { I } from './icons.jsx';

const CSS = `
.bd-sidebar{width:240px;flex:0 0 auto;background:var(--bd-navy-900);color:var(--bd-text-inverse);
  display:flex;flex-direction:column;min-height:100vh;position:sticky;top:0;}
.bd-sidebar__brand{display:flex;align-items:center;gap:12px;padding:24px 20px;border-bottom:1px solid rgba(255,255,255,.1);}
.bd-sidebar__brand-name{font-family:var(--bd-font-display);font-weight:800;font-size:18px;letter-spacing:-.02em;color:#fff;line-height:1.1;}
.bd-sidebar__brand-sub{font-size:10px;color:rgba(255,255,255,.55);letter-spacing:.08em;text-transform:uppercase;}
.bd-sidebar__nav{display:flex;flex-direction:column;gap:2px;padding:16px 12px;flex:1;}
.bd-sidebar__link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;
  color:rgba(255,255,255,.72);text-decoration:none;font-size:14px;font-weight:500;transition:var(--bd-transition-colors);}
.bd-sidebar__link:hover{background:rgba(255,255,255,.06);color:#fff;text-decoration:none;}
.bd-sidebar__link.active{background:var(--bd-gradient-cta);color:#fff;font-weight:600;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-sidebar-css')) {
  const s = document.createElement('style'); s.id = 'bd-sidebar-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: I.dashboard, end: true },
  { to: '/leads', label: 'Leads', icon: I.leads },
  { to: '/oportunidades', label: 'Oportunidades', icon: I.target },
  { to: '/clientes', label: 'Clientes', icon: I.users },
  { to: '/propostas', label: 'Propostas', icon: I.file },
  { to: '/contratos', label: 'Contratos', icon: I.contract },
  { to: '/calendario', label: 'Calendário', icon: I.calendar },
  { to: '/tarefas', label: 'Tarefas', icon: I.checklist },
  { to: '/configuracoes', label: 'Configurações', icon: I.settings },
];

export function Sidebar() {
  return (
    <aside className="bd-sidebar">
      <div className="bd-sidebar__brand">
        <img src="/src/design-system/assets/brand/bdtech-mark-white.svg" alt="BDTECH" style={{ height: 34 }} />
        <div>
          <div className="bd-sidebar__brand-name">BDTECH</div>
          <div className="bd-sidebar__brand-sub">Gestão</div>
        </div>
      </div>
      <nav className="bd-sidebar__nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `bd-sidebar__link${isActive ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
