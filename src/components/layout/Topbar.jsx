import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { useUnreadNotifications } from '../../lib/notifications.js';
import { Avatar } from '../../design-system/components/navigation/Avatar.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { I } from './icons.jsx';

const CSS = `
.bd-topbar{height:72px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;border-bottom:1px solid var(--bd-border-subtle);background:var(--bd-surface-card);
  position:sticky;top:0;z-index:var(--bd-z-sticky);gap:20px;}
.bd-topbar__title{font-family:var(--bd-font-display);font-weight:700;font-size:20px;color:var(--bd-text-strong);flex:0 0 auto;}
.bd-topbar__search{flex:1;max-width:360px;position:relative;}
.bd-topbar__search input{width:100%;padding:9px 12px 9px 36px;border-radius:var(--bd-radius-pill);
  border:1px solid var(--bd-border-default);background:var(--bd-surface-sunken);font-size:13px;color:var(--bd-text-strong);}
.bd-topbar__search input:focus{outline:none;border-color:var(--bd-primary-500);box-shadow:var(--bd-glow-brand);}
.bd-topbar__search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--bd-text-muted);}
.bd-topbar__badge{position:absolute;top:2px;right:2px;background:var(--bd-danger-500);color:#fff;font-size:10px;
  font-weight:700;border-radius:999px;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-topbar-css')) {
  const s = document.createElement('style'); s.id = 'bd-topbar-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

export function Topbar({ title }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { count } = useUnreadNotifications();
  const [q, setQ] = React.useState('');

  function handleSearch(e) {
    e.preventDefault();
    if (q.trim()) navigate(`/busca?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="bd-topbar">
      <div className="bd-topbar__title">{title}</div>
      <form className="bd-topbar__search" onSubmit={handleSearch}>
        {I.search}
        <input placeholder="Buscar clientes, propostas, contratos..." value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
        <div style={{ position: 'relative' }}>
          <IconButton label="Notificações" onClick={() => navigate('/notificacoes')}>{I.bell}</IconButton>
          {count > 0 && <span className="bd-topbar__badge">{count > 9 ? '9+' : count}</span>}
        </div>
        <Avatar name={user?.email ?? ''} size="sm" />
        <IconButton label="Sair" onClick={() => signOut()}>{I.logout}</IconButton>
      </div>
    </header>
  );
}
