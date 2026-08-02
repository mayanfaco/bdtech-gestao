import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';

const TYPE_LABEL = {
  note: 'Observação', call: 'Ligação', message: 'Mensagem', meeting_logged: 'Reunião registrada',
  stage_change: 'Mudança de etapa', status_change: 'Mudança de status', file: 'Arquivo',
  proposal_created: 'Proposta criada', proposal_sent: 'Proposta enviada', contract_created: 'Contrato criado',
  task_created: 'Tarefa criada', email: 'E-mail', conversion: 'Conversão', system: 'Sistema',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Linha do tempo unificada de uma entidade (lead/opportunity/client/proposal/contract/task/calendar_event). */
export function ActivityTimeline({ entityType, entityId, refreshKey }) {
  const [items, setItems] = React.useState(null);

  React.useEffect(() => {
    if (!entityId) return;
    supabase.from('activity_log').select('*')
      .eq('entity_type', entityType).eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, [entityType, entityId, refreshKey]);

  if (items === null) return null;
  if (items.length === 0) {
    return <p style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <div className="bd-u-flex-col bd-u-gap-3">
      {items.map((it) => (
        <div key={it.id} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--bd-border-subtle)' }}>
          <Badge tone="neutral" style={{ flex: '0 0 auto' }}>{TYPE_LABEL[it.activity_type] ?? it.activity_type}</Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            {it.title && <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontSize: 14 }}>{it.title}</div>}
            {it.body && <div style={{ fontSize: 14, color: 'var(--bd-text-body)', marginTop: 2 }}>{it.body}</div>}
            <div style={{ fontSize: 12, color: 'var(--bd-text-subtle)', marginTop: 4 }}>{formatDate(it.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Formulário mínimo para registrar uma observação manual na timeline. */
export function QuickNote({ entityType, entityId, onAdded }) {
  const [body, setBody] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await supabase.from('activity_log').insert({
      entity_type: entityType, entity_id: entityId, activity_type: 'note', body,
    });
    setSaving(false);
    setBody('');
    onAdded?.();
  }

  return (
    <form onSubmit={submit} className="bd-u-flex bd-u-gap-2">
      <input
        className="bdctrl"
        placeholder="Registrar uma observação..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ flex: 1 }}
      />
      <button className="bdbtn bdbtn--outline bdbtn--sm" type="submit" disabled={saving}>Adicionar</button>
    </form>
  );
}
