import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { I } from './icons.jsx';
import { useTutorial } from '../../lib/tutorial.jsx';
import logotypeWhite from '../../design-system/assets/brand/bdtech-logotype-white.svg';

const SIDEBAR_WIDTH = 240;

const CSS = `
.bd-sidebar{width:${SIDEBAR_WIDTH}px;flex:0 0 auto;background:var(--bd-navy-900);color:var(--bd-text-inverse);
  display:flex;flex-direction:column;height:100vh;position:fixed;top:0;left:0;z-index:var(--bd-z-nav);overflow-y:auto;
  transition:transform var(--bd-duration-base) var(--bd-ease-standard);}
.bd-sidebar__brand{position:relative;display:flex;align-items:center;justify-content:center;
  padding:30px 20px;border-bottom:1px solid rgba(255,255,255,.1);}
.bd-sidebar__close{display:none;position:absolute;right:16px;top:50%;transform:translateY(-50%);}
.bd-sidebar--dash::after{content:"";position:fixed;top:0;bottom:0;left:${SIDEBAR_WIDTH}px;width:2px;z-index:1;
  background:var(--bd-gradient-accent-line);}
.bd-sidebar__nav{display:flex;flex-direction:column;gap:2px;padding:16px 12px;flex:1;}
.bd-sidebar__link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;
  color:rgba(255,255,255,.72);text-decoration:none;font-size:14px;font-weight:500;transition:var(--bd-transition-colors);}
.bd-sidebar__link:hover{background:rgba(255,255,255,.06);color:#fff;text-decoration:none;}
.bd-sidebar__link.active{background:var(--bd-gradient-cta);color:#fff;font-weight:600;}
.bd-sidebar__backdrop{display:none;}
.bd-sidebar__grupo{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.42);padding:14px 14px 4px;}
.bd-sidebar__extra{margin-left:auto;display:inline-flex;align-items:center;opacity:.7;}
.bd-sidebar__pill{margin-left:auto;font-size:11px;font-weight:800;background:rgba(255,255,255,.16);border-radius:999px;padding:2px 8px;}

@media (max-width: 900px) {
  .bd-sidebar{transform:translateX(-100%);z-index:var(--bd-z-modal, 1000);}
  .bd-sidebar--open{transform:translateX(0);box-shadow:0 0 40px rgba(0,0,0,.4);}
  .bd-sidebar--dash::after{display:none;}
  .bd-sidebar__close{display:inline-flex;align-items:center;justify-content:center;
    width:32px;height:32px;border-radius:8px;background:transparent;border:none;color:#fff;cursor:pointer;}
  .bd-sidebar__close:hover{background:rgba(255,255,255,.1);}
  .bd-sidebar__backdrop{display:block;position:fixed;inset:0;background:rgba(1,25,51,.55);
    z-index:calc(var(--bd-z-modal, 1000) - 1);}
}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-sidebar-css')) {
  const s = document.createElement('style'); s.id = 'bd-sidebar-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

// Menu em grupos curtos: primeiro o que se usa todo dia para vender.
// Menu em grupos curtos: primeiro o que se usa todo dia para vender.
const NAV = [
  { to: '/', label: 'Início', icon: I.home, end: true },
  { grupo: 'Vender' },
  { to: '/funis', label: 'Funis', icon: I.funnel, area: 'prospeccao' },
  { to: '/onde-prospectar', label: 'Onde prospectar', icon: I.map, area: 'prospeccao' },
  { to: '/guia', label: 'Guia de vendas', icon: I.book },
  { grupo: 'Gestão' },
  { to: '/clientes', label: 'Clientes', icon: I.users },
  { to: '/propostas', label: 'Propostas', icon: I.file },
  { to: '/contratos', label: 'Contratos', icon: I.contract },
  { to: '/recebimentos', label: 'Recebimentos', icon: I.money },
  { to: '/recibos', label: 'Recibos', icon: I.receipt },
  { to: '/calendario', label: 'Calendário', icon: I.calendar },
  { to: '/tarefas', label: 'Tarefas', icon: I.checklist },
  { to: '/relatorios', label: 'Relatórios', icon: I.dashboard },
  { grupo: 'Para mim' },
  { to: '/meu-lar', label: 'Meu Lar', icon: I.lar, area: 'lar' },
  { to: '/tutorial', label: 'Tutorial', icon: I.school, tutorial: true },
  { to: '/configuracoes', label: 'Configurações', icon: I.settings },
];

export const SIDEBAR_WIDTH_PX = SIDEBAR_WIDTH;

export function Sidebar({ open = false, onClose }) {
  const location = useLocation();
  const isDash = location.pathname === '/relatorios';
  const tutorial = useTutorial();
  return (
    <>
      {open && <div className="bd-sidebar__backdrop" onClick={onClose} />}
      <aside className={`bd-sidebar${isDash ? ' bd-sidebar--dash' : ''}${open ? ' bd-sidebar--open' : ''}`}>
        <div className="bd-sidebar__brand">
          <img src={logotypeWhite} alt="BDTECH" style={{ height: 36, width: 'auto' }} />
          <button type="button" className="bd-sidebar__close" aria-label="Fechar menu" onClick={onClose}>{I.close}</button>
        </div>
        <nav className="bd-sidebar__nav">
          {NAV.map((item) => (item.grupo ? (
            <div key={item.grupo} className="bd-sidebar__grupo">{item.grupo}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `bd-sidebar__link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.area && !tutorial.liberado(item.area) && <span className="bd-sidebar__extra" title="Libera no tutorial">{I.lock}</span>}
              {item.tutorial && tutorial.concluidas < tutorial.total && (
                <span className="bd-sidebar__pill">{tutorial.concluidas}/{tutorial.total}</span>
              )}
            </NavLink>
          )))}
        </nav>
      </aside>
    </>
  );
}
