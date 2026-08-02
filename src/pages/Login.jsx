import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Input } from '../design-system/components/forms/Input.jsx';
import { Button } from '../design-system/components/buttons/Button.jsx';
import { Alert } from '../design-system/components/feedback/Alert.jsx';

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
    if (signInError) setError(`${signInError.message} (status ${signInError.status ?? '?'}, code ${signInError.code ?? '?'})`);
  }

  return (
    <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: 'var(--bd-space-6)' }}>
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ marginBottom: 'var(--bd-space-8)', justifyContent: 'center' }}>
          <img src="/src/design-system/assets/brand/bdtech-mark-navy.svg" alt="BDTECH" style={{ height: 44 }} />
          <div>
            <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 20, color: 'var(--bd-navy-900)', letterSpacing: '-.02em' }}>BDTECH</div>
            <div style={{ fontSize: 11, color: 'var(--bd-text-muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Gestão</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
          <Input id="email" label="E-mail" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="voce@bdtech.com.br" />
          <Input id="password" label="Senha" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" block loading={loading}>Entrar</Button>
        </form>
      </div>
    </div>
  );
}
