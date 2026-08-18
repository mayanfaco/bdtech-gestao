import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Input } from '../design-system/components/forms/Input.jsx';
import { Button } from '../design-system/components/buttons/Button.jsx';
import { Alert } from '../design-system/components/feedback/Alert.jsx';
import logotypeWhite from '../design-system/assets/brand/bdtech-logotype-white.svg';

const CSS = `
.bd-login-page{position:relative;min-height:100vh;overflow:hidden;background:var(--bd-navy-900);
  display:flex;align-items:center;justify-content:center;padding:var(--bd-space-6);}
.bd-login-page::before{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
  background-size:42px 42px;}
.bd-login-page__glow{position:absolute;top:-10%;left:50%;transform:translateX(-50%);width:70%;height:60%;
  background:var(--bd-gradient-glow);pointer-events:none;}
.bd-login-wrap{position:relative;width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;text-align:center;}
.bd-login-badge{width:64px;height:64px;border-radius:var(--bd-radius-lg);display:flex;align-items:center;justify-content:center;
  background:rgba(0,159,224,.10);border:1px solid rgba(0,159,224,.45);color:var(--bd-accent-400);margin-bottom:var(--bd-space-5);
  box-shadow:0 0 16px 2px rgba(0,159,224,.4),0 0 32px 8px rgba(0,159,224,.18);}
.bd-login-title{font-family:var(--bd-font-display);font-weight:800;font-size:28px;color:#fff;margin:var(--bd-space-2) 0 6px;}
.bd-login-sub{font-size:14px;color:rgba(255,255,255,.5);margin-bottom:var(--bd-space-8);}
.bd-login-card{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.10);
  border-radius:var(--bd-radius-lg);padding:var(--bd-space-8);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
  box-shadow:0 20px 50px rgba(1,25,51,.45);
  --bd-surface-card: rgba(255,255,255,.04);
  --bd-border-default: rgba(255,255,255,.16);
  --bd-text-strong: rgba(255,255,255,.92);
  --bd-text-subtle: rgba(255,255,255,.32);}
.bd-login-card .bdfield__label{text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:.07em;color:rgba(255,255,255,.5);}
.bd-login-card .bdctrl{height:50px;}
.bd-login-footer{margin-top:var(--bd-space-8);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(255,255,255,.32);}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-login-css')) {
  const s = document.createElement('style'); s.id = 'bd-login-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

function ShieldCheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export default function Login() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) setError('E-mail ou senha inválidos.');
  }

  return (
    <div className="bd-login-page">
      <div className="bd-login-page__glow" />
      <div className="bd-login-wrap">
        <div className="bd-login-badge"><ShieldCheckIcon /></div>
        <img src={logotypeWhite} alt="BDTECH" style={{ height: 30, width: 'auto', marginBottom: 'var(--bd-space-5)' }} />
        <h1 className="bd-login-title">Acesso da Equipe</h1>
        <p className="bd-login-sub">Login único · dados sincronizados na nuvem</p>

        <div className="bd-login-card">
          <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4" style={{ textAlign: 'left' }}>
            <Input id="email" label="E-mail" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="voce@bdtech.com.br" />
            <Input id="password" label="Senha" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            {error && <Alert tone="danger">{error}</Alert>}
            <Button type="submit" block loading={loading}>Entrar</Button>
          </form>
        </div>

        <div className="bd-login-footer">BDTECH · Engenharia e Consultoria em Elevadores</div>
      </div>
    </div>
  );
}
