import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';

const TABLES = ['clients', 'client_contacts', 'leads', 'opportunities', 'proposals', 'contracts', 'calendar_events', 'tasks'];
const TABLE_LABEL = {
  clients: 'Clientes', client_contacts: 'Contatos', leads: 'Leads', opportunities: 'Oportunidades',
  proposals: 'Propostas', contracts: 'Contratos', calendar_events: 'Eventos de agenda', tasks: 'Tarefas',
};

export default function DadosDemoConfig() {
  const [counts, setCounts] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    const entries = await Promise.all(TABLES.map(async (t) => {
      const { count } = await supabase.from(t).select('id', { count: 'exact', head: true }).eq('is_demo', true);
      return [t, count ?? 0];
    }));
    setCounts(Object.fromEntries(entries));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function wipe() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.rpc('wipe_demo_data');
    setBusy(false);
    if (error) setMessage(`Erro: ${error.message}`);
    else { setMessage('Dados de demonstração removidos.'); load(); }
  }

  if (counts === null) return null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="bd-u-flex-col bd-u-gap-4" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 22 }}>Dados de demonstração</h1>
      <Card padding="lg">
        <div className="bd-u-grid-2 bd-u-gap-3">
          {TABLES.map((t) => (
            <div key={t} className="bd-u-flex bd-u-justify-between"><span>{TABLE_LABEL[t]}</span><strong>{counts[t]}</strong></div>
          ))}
        </div>
      </Card>

      {message && <Alert tone={message.startsWith('Erro') ? 'danger' : 'success'}>{message}</Alert>}

      {total > 0 && (
        <Card padding="lg" style={{ borderColor: 'var(--bd-danger-500)' }}>
          <strong>Remover todos os dados de demonstração</strong>
          <p style={{ fontSize: 13, color: 'var(--bd-text-muted)', margin: '6px 0 12px' }}>
            Apaga só os registros marcados como demonstração — dados reais nunca são afetados. Digite <strong>REMOVER</strong> para confirmar.
          </p>
          <div className="bd-u-flex bd-u-gap-3">
            <input className="bdctrl" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} style={{ maxWidth: 200 }} />
            <Button variant="outline" disabled={confirmText !== 'REMOVER'} loading={busy} onClick={wipe}>Remover dados de demonstração</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
