import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { googleCalendarLink } from '../../lib/googleCalendarLink.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';

const TIPO_LABEL = {
  reuniao_comercial: 'Reunião comercial', reuniao_tecnica: 'Reunião técnica', apresentacao_proposta: 'Apresentação de proposta',
  follow_up: 'Follow-up', vistoria: 'Vistoria', visita_cliente: 'Visita ao cliente', reuniao_interna: 'Reunião interna',
  vencimento_proposta: 'Vencimento de proposta', vencimento_contrato: 'Vencimento de contrato',
  compromisso_administrativo: 'Compromisso administrativo', outro: 'Outro',
};
const STATUS_LABEL = { agendado: 'Agendado', confirmado: 'Confirmado', realizado: 'Realizado', reagendado: 'Reagendado', cancelado: 'Cancelado', nao_compareceu: 'Não compareceu' };

export default function EventoDetail() {
  const { id } = useParams();
  const [event, setEvent] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    supabase.from('calendar_events').select('*').eq('id', id).single().then(({ data }) => setEvent(data));
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  async function setStatus(status) {
    setBusy(true);
    await supabase.from('calendar_events').update({ status }).eq('id', id);
    setBusy(false);
    load();
  }

  if (!event) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div>
          <h1 style={{ fontSize: 24 }}>{event.titulo}</h1>
          <div style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>{TIPO_LABEL[event.tipo]}</div>
        </div>
        <div className="bd-u-flex bd-u-gap-3 bd-u-items-center">
          <Badge tone="brand">{STATUS_LABEL[event.status]}</Badge>
          <Button variant="outline" as={Link} to={`/calendario/${id}/editar`}>Editar</Button>
          <Button as="a" href={googleCalendarLink(event)} target="_blank" rel="noopener noreferrer">Adicionar ao Google Calendar</Button>
        </div>
      </div>

      <Card padding="lg">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <div><strong>Início:</strong> {new Date(event.data_inicio).toLocaleString('pt-BR')}</div>
          <div><strong>Fim:</strong> {event.data_fim ? new Date(event.data_fim).toLocaleString('pt-BR') : '—'}</div>
          <div><strong>Local:</strong> {event.local || '—'}</div>
          <div><strong>Link da reunião:</strong> {event.link_reuniao ? <a href={event.link_reuniao} target="_blank" rel="noopener noreferrer">{event.link_reuniao}</a> : '—'}</div>
        </div>
        {event.descricao && <p style={{ marginTop: 'var(--bd-space-4)' }}>{event.descricao}</p>}
      </Card>

      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        {event.status !== 'confirmado' && <Button size="sm" variant="outline" onClick={() => setStatus('confirmado')} loading={busy}>Confirmar</Button>}
        {event.status !== 'realizado' && <Button size="sm" onClick={() => setStatus('realizado')} loading={busy}>Marcar como realizado</Button>}
        {event.status !== 'reagendado' && <Button size="sm" variant="outline" onClick={() => setStatus('reagendado')} loading={busy}>Reagendar</Button>}
        {event.status !== 'nao_compareceu' && <Button size="sm" variant="outline" onClick={() => setStatus('nao_compareceu')} loading={busy}>Não compareceu</Button>}
        {event.status !== 'cancelado' && <Button size="sm" variant="ghost" onClick={() => setStatus('cancelado')} loading={busy}>Cancelar</Button>}
      </div>
    </div>
  );
}
