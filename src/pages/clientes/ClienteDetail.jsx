import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Tabs } from '../../design-system/components/disclosure/Tabs.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { ActivityTimeline, QuickNote } from '../../components/crm/ActivityTimeline.jsx';
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE, CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE } from '../../lib/statusLabels.js';

const RELACIONAMENTO_LABEL = { prospect: 'Prospect', ativo: 'Ativo', inativo: 'Inativo' };
const RELACIONAMENTO_TONE = { prospect: 'warning', ativo: 'success', inativo: 'neutral' };

function ListRow({ to, title, badge }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
      <Card interactive>
        <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-4) var(--bd-space-5)' }}>
          <span>{title}</span>
          {badge}
        </div>
      </Card>
    </Link>
  );
}

export default function ClienteDetail() {
  const { id } = useParams();
  const [client, setClient] = React.useState(null);
  const [contacts, setContacts] = React.useState([]);
  const [opportunities, setOpportunities] = React.useState([]);
  const [proposals, setProposals] = React.useState([]);
  const [contracts, setContracts] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const load = React.useCallback(() => {
    supabase.from('clients').select('*').eq('id', id).single().then(({ data }) => setClient(data));
    supabase.from('client_contacts').select('*').eq('client_id', id).is('deleted_at', null).order('principal', { ascending: false }).then(({ data }) => setContacts(data ?? []));
    supabase.from('opportunities').select('*').eq('client_id', id).is('deleted_at', null).order('created_at', { ascending: false }).then(({ data }) => setOpportunities(data ?? []));
    supabase.from('proposals').select('*').eq('client_id', id).is('deleted_at', null).order('created_at', { ascending: false }).then(({ data }) => setProposals(data ?? []));
    supabase.from('contracts').select('*').eq('client_id', id).is('deleted_at', null).order('created_at', { ascending: false }).then(({ data }) => setContracts(data ?? []));
    supabase.from('calendar_events').select('*').eq('client_id', id).order('data_inicio', { ascending: false }).then(({ data }) => setEvents(data ?? []));
    supabase.from('tasks').select('*').eq('client_id', id).is('deleted_at', null).order('prazo', { ascending: true }).then(({ data }) => setTasks(data ?? []));
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  if (!client) return null;

  const tabs = [
    {
      label: 'Contatos',
      content: (
        <div className="bd-u-flex-col bd-u-gap-3">
          <Button as={Link} to={`/clientes/${id}/contatos/novo`} variant="outline" size="sm" style={{ alignSelf: 'flex-start' }}>Adicionar contato</Button>
          {contacts.length === 0 ? <EmptyState title="Nenhum contato cadastrado" /> : contacts.map((c) => (
            <Link key={c.id} to={`/clientes/${id}/contatos/${c.id}/editar`} style={{ textDecoration: 'none' }}>
              <Card interactive>
                <div style={{ padding: 'var(--bd-space-4) var(--bd-space-5)' }}>
                  <div className="bd-u-flex bd-u-items-center bd-u-gap-2">
                    <strong>{c.nome}</strong>
                    {c.principal && <Badge tone="brand">Principal</Badge>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
                    {[c.cargo, c.telefone, c.email].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ),
    },
    {
      label: 'Oportunidades',
      content: opportunities.length === 0 ? <EmptyState title="Nenhuma oportunidade para este cliente" /> : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {opportunities.map((o) => (
            <ListRow key={o.id} to={`/oportunidades/${o.id}`} title={o.titulo}
              badge={<Badge tone={o.status === 'ganha' ? 'success' : o.status === 'perdida' ? 'danger' : 'brand'}>{o.status}</Badge>} />
          ))}
        </div>
      ),
    },
    {
      label: 'Propostas',
      content: proposals.length === 0 ? <EmptyState title="Nenhuma proposta para este cliente" /> : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {proposals.map((p) => (
            <ListRow key={p.id} to={`/propostas/${p.id}`} title={`Proposta #${p.numero} — ${p.data_proposta}`}
              badge={<Badge tone={PROPOSAL_STATUS_TONE[p.status]}>{PROPOSAL_STATUS_LABEL[p.status]}</Badge>} />
          ))}
        </div>
      ),
    },
    {
      label: 'Contratos',
      content: contracts.length === 0 ? <EmptyState title="Nenhum contrato para este cliente" /> : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {contracts.map((c) => (
            <ListRow key={c.id} to={`/contratos/${c.id}`} title={`Contrato #${c.numero} — ${c.data_inicio} a ${c.data_termino}`}
              badge={<Badge tone={CONTRACT_STATUS_TONE[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</Badge>} />
          ))}
        </div>
      ),
    },
    {
      label: 'Reuniões',
      content: events.length === 0 ? <EmptyState title="Nenhuma reunião ou vistoria registrada" /> : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {events.map((ev) => (
            <ListRow key={ev.id} to={`/calendario/${ev.id}`} title={`${ev.titulo} — ${new Date(ev.data_inicio).toLocaleDateString('pt-BR')}`}
              badge={<Badge tone="neutral">{ev.status}</Badge>} />
          ))}
        </div>
      ),
    },
    {
      label: 'Tarefas',
      content: tasks.length === 0 ? <EmptyState title="Nenhuma tarefa vinculada" /> : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {tasks.map((t) => (
            <ListRow key={t.id} to={`/tarefas/${t.id}`} title={t.titulo} badge={<Badge tone="brand">{t.status}</Badge>} />
          ))}
        </div>
      ),
    },
    {
      label: 'Linha do tempo',
      content: (
        <div>
          <QuickNote entityType="client" entityId={id} onAdded={() => setRefreshKey((k) => k + 1)} />
          <div style={{ marginTop: 'var(--bd-space-4)' }}>
            <ActivityTimeline entityType="client" entityId={id} refreshKey={refreshKey} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div>
          <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
            <h1 style={{ fontSize: 24 }}>{client.nome}</h1>
            <Badge tone={RELACIONAMENTO_TONE[client.status_relacionamento]}>{RELACIONAMENTO_LABEL[client.status_relacionamento]}</Badge>
          </div>
          <div style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>
            {client.contato_nome}{client.contato_cargo ? ` — ${client.contato_cargo}` : ''}
          </div>
        </div>
        <Button variant="outline" as={Link} to={`/clientes/${id}/editar`}>Editar</Button>
      </div>

      <Card padding="lg">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <div><strong>CPF/CNPJ:</strong> {client.cpf_cnpj || client.cnpj || '—'}</div>
          <div><strong>Elevadores:</strong> {client.qtd_elevadores ?? '—'}</div>
          <div><strong>Endereço:</strong> {client.endereco || '—'} {client.cidade ? `— ${client.cidade}/${client.estado ?? ''}` : ''}</div>
          <div><strong>Síndico:</strong> {client.sindico_nome || '—'}</div>
          <div><strong>E-mail:</strong> {client.contato_email || '—'}</div>
          <div><strong>Telefone / WhatsApp:</strong> {[client.contato_telefone, client.whatsapp].filter(Boolean).join(' / ') || '—'}</div>
          <div><strong>Segmento:</strong> {client.segmento || '—'}</div>
          <div><strong>Site:</strong> {client.site || '—'}</div>
        </div>
      </Card>

      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        <Button variant="outline" size="sm" as={Link} to={`/oportunidades/nova?clientId=${id}`}>Criar oportunidade</Button>
        <Button variant="outline" size="sm" as={Link} to={`/propostas/nova?clienteId=${id}`}>Gerar proposta</Button>
        <Button variant="outline" size="sm" as={Link} to={`/contratos/novo?clienteId=${id}`}>Criar contrato</Button>
        <Button variant="outline" size="sm" as={Link} to={`/calendario/novo?clienteId=${id}`}>Agendar reunião</Button>
        <Button variant="outline" size="sm" as={Link} to={`/tarefas/nova?clientId=${id}`}>Criar tarefa</Button>
        <Button variant="outline" size="sm" as={Link} to={`/clientes/${id}/contatos/novo`}>Adicionar contato</Button>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
