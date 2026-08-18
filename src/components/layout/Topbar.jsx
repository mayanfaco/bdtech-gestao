import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { useUnreadNotifications } from '../../lib/notifications.js';
import { Avatar } from '../../design-system/components/navigation/Avatar.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { I } from './icons.jsx';

const CSS = `
.bd-topbar{height:72px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
  padding:0 28px;border-bottom:1px solid var(--bd-border-subtle);background:var(--bd-surface-card);
  position:sticky;top:0;z-index:var(--bd-z-sticky);gap:20px;}
.bd-topbar__menu{display:none;flex:0 0 auto;}
.bd-topbar__title{font-family:var(--bd-font-display);font-weight:700;font-size:20px;color:var(--bd-text-strong);
  flex:0 0 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bd-topbar__search{flex:1;max-width:360px;position:relative;}
.bd-topbar__search input{width:100%;padding:9px 12px 9px 36px;border-radius:var(--bd-radius-pill);
  border:1px solid var(--bd-border-default);background:var(--bd-surface-sunken);font-size:13px;color:var(--bd-text-strong);}
.bd-topbar__search input:focus{outline:none;border-color:var(--bd-primary-500);box-shadow:var(--bd-glow-brand);}
.bd-topbar__search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--bd-text-muted);}
.bd-topbar__badge{position:absolute;top:2px;right:2px;background:var(--bd-danger-500);color:#fff;font-size:10px;
  font-weight:700;border-radius:999px;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px;}
.bd-topbar__mobile-search-btn{display:none;}

.bd-topbar--dash{background:var(--bd-navy-900);border-bottom:1px solid rgba(255,255,255,.08);
  --bd-text-strong:#fff;--bd-text-muted:rgba(255,255,255,.55);
  --bd-border-subtle:rgba(255,255,255,.14);--bd-border-default:rgba(255,255,255,.18);
  --bd-surface-sunken:rgba(255,255,255,.08);--bd-state-hover:rgba(255,255,255,.10);}

@media (max-width: 900px) {
  .bd-topbar{padding:0 14px;gap:10px;}
  .bd-topbar__menu{display:inline-flex;}
  .bd-topbar__title{font-size:17px;}
  .bd-topbar__search{display:none;}
  .bd-topbar__search--mobile-open{display:flex;max-width:none;}
  .bd-topbar__mobile-search-btn{display:inline-flex;}
}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-topbar-css')) {
  const s = document.createElement('style'); s.id = 'bd-topbar-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

export function Topbar({ title, onMenuClick }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useUnreadNotifications();
  const [q, setQ] = React.useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const isDash = location.pathname === '/';

  function handleSearch(e) {
    e.preventDefault();
    if (q.trim()) { navigate(`/busca?q=${encodeURIComponent(q.trim())}`); setMobileSearchOpen(false); }
  }

  return (
    <header className={`bd-topbar${isDash ? ' bd-topbar--dash' : ''}`}>
      {!mobileSearchOpen && (
        <IconButton className="bd-topbar__menu" label="Abrir menu" variant="ghost" onClick={onMenuClick}>{I.menu}</IconButton>
      )}
      {!mobileSearchOpen && <div className="bd-topbar__title">{title}</div>}
      <form className={`bd-topbar__search${mobileSearchOpen ? ' bd-topbar__search--mobile-open' : ''}`} onSubmit={handleSearch}>
        {I.search}
        <input placeholder="Buscar clientes, propostas, contratos..." value={q} onChange={(e) => setQ(e.target.value)}
          autoFocus={mobileSearchOpen} />
      </form>
      {!mobileSearchOpen ? (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
          <IconButton className="bd-topbar__mobile-search-btn" label="Buscar" onClick={() => setMobileSearchOpen(true)}>{I.search}</IconButton>
          <div style={{ position: 'relative' }}>
            <IconButton label="Notificações" onClick={() => navigate('/notificacoes')}>{I.bell}</IconButton>
            {count > 0 && <span className="bd-topbar__badge">{count > 9 ? '9+' : count}</span>}
          </div>
          <Avatar name={user?.email ?? ''} size="sm" />
          <IconButton label="Sair" onClick={() => signOut()}>{I.logout}</IconButton>
        </div>
      ) : (
        <IconButton label="Fechar busca" onClick={() => setMobileSearchOpen(false)}>{I.close}</IconButton>
      )}
    </header>
  );
}
