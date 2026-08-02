import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';

export default function GoogleCalendarConfig() {
  const [connection, setConnection] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.from('google_calendar_connections').select('*').maybeSingle().then(({ data }) => {
      setConnection(data);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  const isConnected = connection?.is_active;

  return (
    <div className="bd-u-flex-col bd-u-gap-6" style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 22 }}>Integração com Google Calendar</h1>

      {!isConnected ? (
        <Alert tone="warning" title="Integração ainda não configurada">
          Para conectar sua conta Google de verdade (criar/editar/cancelar eventos automaticamente, sincronizar alterações), é preciso ativar a integração no backend primeiro. Até lá, use o botão "Adicionar ao Google Calendar" em cada evento — ele já funciona sem nenhuma configuração.
        </Alert>
      ) : (
        <Alert tone="success" title={`Conectado como ${connection.primary_calendar_id ?? ''}`}>
          Último sincronismo: {connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString('pt-BR') : 'nunca'}.
        </Alert>
      )}

      {connection?.last_sync_error && (
        <Alert tone="danger" title="Erro na última sincronização">{connection.last_sync_error}</Alert>
      )}

      <Card padding="lg">
        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 8 }}>Como ativar</h3>
        <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: 'var(--bd-text-body)' }}>
          <li>Criar um projeto no <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a> e ativar a Calendar API.</li>
          <li>Gerar credenciais OAuth (Client ID e Client Secret) para uma aplicação Web.</li>
          <li>Configurar as três Edge Functions em <code>supabase/functions/</code> (já estão escritas no projeto) via Supabase CLI: <code>supabase functions deploy google-oauth-start google-oauth-callback google-calendar-sync</code>.</li>
          <li>Definir os segredos: <code>supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REDIRECT_URI=...</code></li>
        </ol>
        <Button disabled style={{ marginTop: 16 }}>Conectar conta Google (requer os passos acima)</Button>
      </Card>
    </div>
  );
}
