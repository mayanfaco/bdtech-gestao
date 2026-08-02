import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useStaffOptions } from '../lib/staffOptions.js';
import { formatCurrency } from '../lib/proposalCalculations.js';
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE, CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE } from '../lib/statusLabels.js';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { FunnelChart } from '../components/dashboard/FunnelChart.jsx';
import { StatusBarChart } from '../components/dashboard/StatusBarChart.jsx';
import { MonthlyTrendChart } from '../components/dashboard/MonthlyTrendChart.jsx';
import { Card } from '../design-system/components/surfaces/Card.jsx';
import { Badge } from '../design-system/components/feedback/Badge.jsx';
import { Select } from '../design-system/components/forms/Select.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

const TONE_HEX = { brand: '#009FE0', success: '#16A34A', warning: '#F59E0B', danger: '#E5484D', neutral: '#647386' };
const PERIODO_OPTIONS = [
  { value: '30', label: 'Últimos 30 dias' }, { value: '90', label: 'Últimos 90 dias' },
  { value: '365', label: 'Último ano' }, { value: 'all', label: 'Todo o período' },
];
const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Dashboard() {
  const staffOptions = useStaffOptions();
  const [periodo, setPeriodo] = React.useState('90');
  const [responsavel, setResponsavel] = React.useState('');
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    Promise.all([
      supabase.from('leads').select('*').is('deleted_at', null),
      supabase.from('opportunities').select('*').is('deleted_at', null),
      supabase.from('proposals').select('*').is('deleted_at', null),
      supabase.from('contracts').select('*').is('deleted_at', null),
      supabase.from('tasks').select('*').is('deleted_at', null),
      supabase.from('calendar_events').select('*'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(15),
      supabase.from('clients').select('id, nome').is('deleted_at', null),
    ]).then(([leads, opportunities, proposals, contracts, tasks, events, activity, clients]) => {
      setData({
        leads: leads.data ?? [], opportunities: opportunities.data ?? [], proposals: proposals.data ?? [],
        contracts: contracts.data ?? [], tasks: tasks.data ?? [], events: events.data ?? [],
        activity: activity.data ?? [], clients: clients.data ?? [],
      });
    });
  }, []);

  if (!data) return null;

  const since = periodo === 'all' ? null : new Date(Date.now() - Number(periodo) * 86400000);
  const inPeriod = (dateStr) => !since || new Date(dateStr) >= since;
  const byResp = (row) => !responsavel || row.responsavel_user_id === responsavel;

  const leads = data.leads.filter((l) => inPeriod(l.created_at));
  const opportunities = data.opportunities.filter((o) => inPeriod(o.created_at) && byResp(o));
  const proposals = data.proposals.filter((p) => inPeriod(p.created_at) && byResp(p));
  const contracts = data.contracts.filter((c) => inPeriod(c.created_at) && byResp(c));
  const clientsById = Object.fromEntries(data.clients.map((c) => [c.id, c.nome]));

  const propostasPorStatus = proposals.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {});
  const enviadasOuMais = proposals.filter((p) => ['enviada', 'visualizada', 'em_negociacao', 'aprovada', 'recusada'].includes(p.status));
  const aprovadas = proposals.filter((p) => p.status === 'aprovada');
  const taxaConversao = enviadasOuMais.length ? Math.round((aprovadas.length / enviadasOuMais.length) * 100) : 0;
  const valorProposto = proposals.reduce((sum, p) => sum + (Number(p.valor_total) || Number(p.modelo1_valor_com_desconto) || 0), 0);
  const valorAprovado = aprovadas.reduce((sum, p) => sum + (Number(p.valor_total) || Number(p.modelo1_valor_com_desconto) || 0), 0);
  const ticketMedio = aprovadas.length ? valorAprovado / aprovadas.length : 0;
  const temposFechamento = aprovadas
    .filter((p) => p.converted_at)
    .map((p) => (new Date(p.converted_at) - new Date(p.created_at)) / 86400000);
  const tempoMedioFechamento = temposFechamento.length ? Math.round(temposFechamento.reduce((a, b) => a + b, 0) / temposFechamento.length) : null;
  const valorPipeline = opportunities.filter((o) => o.status === 'aberta').reduce((sum, o) => sum + (Number(o.valor_estimado) || 0), 0);
  const propostasSemRetorno = data.proposals.filter((p) => ['enviada', 'visualizada'].includes(p.status))
    .sort((a, b) => new Date(a.sent_at ?? a.status_changed_at) - new Date(b.sent_at ?? b.status_changed_at));

  const contratosAtivos = data.contracts.filter((c) => ['ativo', 'assinado'].includes(c.status));
  const valorContratado = contratosAtivos.reduce((sum, c) => sum + (Number(c.valor_total) || 0), 0);
  const now = new Date();
  const diasPara = (iso) => iso ? Math.ceil((new Date(iso) - now) / 86400000) : null;
  const vencendo = (dias) => data.contracts.filter((c) => ['ativo', 'assinado', 'proximo_vencimento'].includes(c.status) && diasPara(c.data_termino) != null && diasPara(c.data_termino) <= dias && diasPara(c.data_termino) >= 0);
  const contratosVencendoLista = data.contracts
    .filter((c) => ['ativo', 'assinado', 'proximo_vencimento'].includes(c.status) && diasPara(c.data_termino) != null && diasPara(c.data_termino) >= 0)
    .sort((a, b) => diasPara(a.data_termino) - diasPara(b.data_termino))
    .slice(0, 6);

  const tarefasPendentes = data.tasks.filter((t) => !['concluida', 'cancelada'].includes(t.status));
  const tarefasVencidas = tarefasPendentes.filter((t) => t.prazo && new Date(t.prazo) < now);
  const tarefasPrioritarias = tarefasPendentes.filter((t) => ['alta', 'urgente'].includes(t.prioridade)).slice(0, 6);
  const contratosAguardandoAcao = data.contracts.filter((c) => ['aguardando_dados', 'aguardando_revisao', 'aguardando_assinatura'].includes(c.status));

  const proximosEventos = data.events
    .filter((e) => new Date(e.data_inicio) >= now && new Date(e.data_inicio) <= new Date(now.getTime() + 7 * 86400000))
    .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
  const reunioesAgendadas = data.events.filter((e) => ['agendado', 'confirmado'].includes(e.status) && new Date(e.data_inicio) >= now);

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, y: d.getFullYear(), m: d.getMonth() };
  });
  const monthlyData = meses.map(({ label, y, m }) => ({
    label,
    propostas: data.proposals.filter((p) => { const dt = new Date(p.created_at); return dt.getFullYear() === y && dt.getMonth() === m; }).length,
    contratos: data.contracts.filter((c) => { const dt = new Date(c.created_at); return dt.getFullYear() === y && dt.getMonth() === m; }).length,
  }));

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        <div style={{ width: 200 }}>
          <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} options={PERIODO_OPTIONS} />
        </div>
        <div style={{ width: 200 }}>
          <Select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Todos os responsáveis" options={staffOptions} />
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-text-muted)', marginBottom: 'var(--bd-space-3)' }}>Comercial</h2>
        <div className="bd-u-grid-4 bd-u-gap-4">
          <StatCard label="Leads cadastrados" value={leads.length} />
          <StatCard label="Oportunidades abertas" value={opportunities.filter((o) => o.status === 'aberta').length} />
          <StatCard label="Propostas enviadas" value={(propostasPorStatus.enviada ?? 0) + (propostasPorStatus.visualizada ?? 0)} />
          <StatCard label="Taxa de conversão" value={`${taxaConversao}%`} hint="aprovadas ÷ enviadas" />
          <StatCard label="Valor total proposto" value={formatCurrency(valorProposto)} />
          <StatCard label="Valor total aprovado" value={formatCurrency(valorAprovado)} tone="var(--bd-success-700)" />
          <StatCard label="Ticket médio" value={formatCurrency(ticketMedio)} />
          <StatCard label="Valor do pipeline" value={formatCurrency(valorPipeline)} />
        </div>
      </div>

      <div className="bd-u-grid-2 bd-u-gap-4">
        <FunnelChart stages={[
          { label: 'Leads', value: leads.length },
          { label: 'Oportunidades', value: opportunities.length },
          { label: 'Propostas', value: proposals.length },
          { label: 'Contratos', value: contracts.length },
        ]} />
        <StatusBarChart title="Propostas por status"
          data={Object.entries(PROPOSAL_STATUS_LABEL).map(([key, label]) => ({ key, label, value: propostasPorStatus[key] ?? 0 })).filter((d) => d.value > 0)}
          toneColor={(key) => TONE_HEX[PROPOSAL_STATUS_TONE[key]]} />
      </div>

      <MonthlyTrendChart months={monthlyData} />

      <div>
        <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-text-muted)', marginBottom: 'var(--bd-space-3)' }}>Contratos</h2>
        <div className="bd-u-grid-4 bd-u-gap-4">
          <StatCard label="Contratos ativos" value={contratosAtivos.length} />
          <StatCard label="Aguardando assinatura" value={data.contracts.filter((c) => c.status === 'aguardando_assinatura').length} />
          <StatCard label="Encerrados / cancelados" value={data.contracts.filter((c) => ['encerrado', 'cancelado'].includes(c.status)).length} />
          <StatCard label="Valor total contratado" value={formatCurrency(valorContratado)} tone="var(--bd-success-700)" />
          <StatCard label="Vencendo em 30 dias" value={vencendo(30).length} tone={vencendo(30).length ? 'var(--bd-danger-500)' : undefined} />
          <StatCard label="Vencendo em 60 dias" value={vencendo(60).length} />
          <StatCard label="Vencendo em 90 dias" value={vencendo(90).length} />
          <StatCard label="Tempo médio de fechamento" value={tempoMedioFechamento != null ? `${tempoMedioFechamento} dias` : '—'} />
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-text-muted)', marginBottom: 'var(--bd-space-3)' }}>Produtividade</h2>
        <div className="bd-u-grid-4 bd-u-gap-4">
          <StatCard label="Reuniões agendadas" value={reunioesAgendadas.length} />
          <StatCard label="Compromissos da semana" value={proximosEventos.length} />
          <StatCard label="Tarefas pendentes" value={tarefasPendentes.length} />
          <StatCard label="Tarefas vencidas" value={tarefasVencidas.length} tone={tarefasVencidas.length ? 'var(--bd-danger-500)' : undefined} />
          <StatCard label="Propostas aguardando follow-up" value={propostasSemRetorno.length} />
          <StatCard label="Contratos aguardando ação" value={contratosAguardandoAcao.length} />
        </div>
      </div>

      <div className="bd-u-grid-2 bd-u-gap-4">
        <Card padding="lg">
          <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-3)' }}>Agenda da semana</h3>
          {proximosEventos.length === 0 ? <EmptyState title="Nenhum compromisso nos próximos 7 dias" /> : (
            <div className="bd-u-flex-col bd-u-gap-2">
              {proximosEventos.map((e) => (
                <Link key={e.id} to={`/calendario/${e.id}`} style={{ textDecoration: 'none', fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd-border-subtle)' }}>
                  <span style={{ color: 'var(--bd-text-body)' }}>{e.titulo}</span>
                  <span style={{ color: 'var(--bd-text-muted)' }}>{new Date(e.data_inicio).toLocaleDateString('pt-BR')}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-3)' }}>Tarefas prioritárias</h3>
          {tarefasPrioritarias.length === 0 ? <EmptyState title="Nenhuma tarefa de alta prioridade" /> : (
            <div className="bd-u-flex-col bd-u-gap-2">
              {tarefasPrioritarias.map((t) => (
                <Link key={t.id} to={`/tarefas/${t.id}`} style={{ textDecoration: 'none', fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd-border-subtle)' }}>
                  <span style={{ color: 'var(--bd-text-body)' }}>{t.titulo}</span>
                  <Badge tone={t.prioridade === 'urgente' ? 'danger' : 'warning'}>{t.prioridade}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-3)' }}>Propostas sem retorno</h3>
          {propostasSemRetorno.length === 0 ? <EmptyState title="Nenhuma proposta aguardando resposta" /> : (
            <div className="bd-u-flex-col bd-u-gap-2">
              {propostasSemRetorno.slice(0, 6).map((p) => (
                <Link key={p.id} to={`/propostas/${p.id}`} style={{ textDecoration: 'none', fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd-border-subtle)' }}>
                  <span style={{ color: 'var(--bd-text-body)' }}>{clientsById[p.client_id] ?? 'Sem cliente'}</span>
                  <Badge tone={PROPOSAL_STATUS_TONE[p.status]}>{PROPOSAL_STATUS_LABEL[p.status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-3)' }}>Contratos próximos do vencimento</h3>
          {contratosVencendoLista.length === 0 ? <EmptyState title="Nenhum contrato vencendo em breve" /> : (
            <div className="bd-u-flex-col bd-u-gap-2">
              {contratosVencendoLista.map((c) => (
                <Link key={c.id} to={`/contratos/${c.id}`} style={{ textDecoration: 'none', fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd-border-subtle)' }}>
                  <span style={{ color: 'var(--bd-text-body)' }}>{clientsById[c.client_id] ?? c.contratante_nome}</span>
                  <Badge tone={diasPara(c.data_termino) <= 30 ? 'danger' : 'warning'}>{diasPara(c.data_termino)} dias</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card padding="lg">
        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginBottom: 'var(--bd-space-3)' }}>Atividade recente</h3>
        {data.activity.length === 0 ? <EmptyState title="Nenhuma atividade registrada ainda" /> : (
          <div className="bd-u-flex-col bd-u-gap-2">
            {data.activity.map((a) => (
              <div key={a.id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bd-border-subtle)' }}>
                <span style={{ color: 'var(--bd-text-body)' }}>{a.title ?? a.activity_type}</span>
                <span style={{ color: 'var(--bd-text-subtle)' }}>{new Date(a.created_at).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
