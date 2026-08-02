import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { ActivityTimeline, QuickNote } from '../../components/crm/ActivityTimeline.jsx';

const STATUS_LABEL = { novo: 'Novo', em_contato: 'Em contato', qualificado: 'Qualificado', convertido: 'Convertido', descartado: 'Descartado' };

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = React.useState(null);
  const [converting, setConverting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);

  const load = React.useCallback(() => {
    supabase.from('leads').select('*').eq('id', id).single().then(({ data }) => setLead(data));
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  async function handleConvert() {
    setConverting(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const clientPayload = {
      nome: lead.empresa || lead.nome,
      contato_nome: lead.nome,
      contato_cargo: lead.cargo,
      contato_email: lead.email,
      contato_telefone: lead.telefone,
      created_by: userData.user.id,
    };
    const { data: client, error: clientError } = await supabase.from('clients').insert(clientPayload).select().single();
    if (clientError) { setError(clientError.message); setConverting(false); return; }

    await supabase.from('leads').update({
      status: 'convertido', converted_client_id: client.id, converted_at: new Date().toISOString(),
    }).eq('id', id);

    await supabase.from('opportunities').update({ client_id: client.id }).eq('lead_id', id).is('client_id', null);

    await supabase.from('activity_log').insert([
      { entity_type: 'lead', entity_id: id, activity_type: 'conversion', title: 'Lead convertido em cliente' },
      { entity_type: 'client', entity_id: client.id, activity_type: 'conversion', title: 'Cliente criado a partir de lead' },
    ]);

    navigate(`/clientes/${client.id}`);
  }

  if (!lead) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div>
          <h1 style={{ fontSize: 24 }}>{lead.nome}</h1>
          <div style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>{lead.empresa || 'Sem empresa'}</div>
        </div>
        <div className="bd-u-flex bd-u-gap-3 bd-u-items-center">
          <Badge tone="brand">{STATUS_LABEL[lead.status]}</Badge>
          <Button variant="outline" as={Link} to={`/leads/${id}/editar`}>Editar</Button>
          {lead.status !== 'convertido' && (
            <Button onClick={handleConvert} loading={converting}>Converter em cliente</Button>
          )}
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Card padding="lg">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <div><strong>Telefone:</strong> {lead.telefone || '—'}</div>
          <div><strong>WhatsApp:</strong> {lead.whatsapp || '—'}</div>
          <div><strong>E-mail:</strong> {lead.email || '—'}</div>
          <div><strong>Cargo:</strong> {lead.cargo || '—'}</div>
          <div><strong>Cidade/UF:</strong> {[lead.cidade, lead.estado].filter(Boolean).join('/') || '—'}</div>
          <div><strong>Origem:</strong> {lead.origem || '—'}</div>
          <div><strong>Serviço de interesse:</strong> {lead.servico_interesse || '—'}</div>
          <div><strong>Próxima ação:</strong> {lead.proxima_acao || '—'} {lead.data_proximo_contato ? `(${lead.data_proximo_contato})` : ''}</div>
        </div>
        {lead.observacoes && <p style={{ marginTop: 'var(--bd-space-4)' }}>{lead.observacoes}</p>}
      </Card>

      <div className="bd-u-flex bd-u-gap-3">
        <Button variant="outline" size="sm" as={Link} to={`/oportunidades/nova?leadId=${id}`}>Criar oportunidade</Button>
        <Button variant="outline" size="sm" as={Link} to={`/calendario/novo?leadId=${id}`}>Agendar reunião</Button>
        <Button variant="outline" size="sm" as={Link} to={`/tarefas/nova?leadId=${id}`}>Criar tarefa</Button>
      </div>

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 'var(--bd-space-3)' }}>Linha do tempo</h2>
        <QuickNote entityType="lead" entityId={id} onAdded={() => setRefreshKey((k) => k + 1)} />
        <div style={{ marginTop: 'var(--bd-space-4)' }}>
          <ActivityTimeline entityType="lead" entityId={id} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
