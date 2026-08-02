import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_TONE } from '../../lib/statusLabels.js';
import { proposalNumberLabel, formatCurrency, modelo1Calculo, modelo2Calculo } from '../../lib/proposalCalculations.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { ActivityTimeline, QuickNote } from '../../components/crm/ActivityTimeline.jsx';

export default function PropostaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = React.useState(null);
  const [client, setClient] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    supabase.from('proposals').select('*').eq('id', id).single().then(({ data }) => {
      setProposal(data);
      if (data?.client_id) supabase.from('clients').select('nome').eq('id', data.client_id).single().then(({ data: c }) => setClient(c));
    });
  }, [id]);

  React.useEffect(() => { load(); }, [load, refreshKey]);

  async function setStatus(status, extra = {}) {
    setBusy(true);
    await supabase.from('proposals').update({ status, ...extra }).eq('id', id);
    setBusy(false);
    setRefreshKey((k) => k + 1);
  }

  async function handleRecusar() {
    const motivo = window.prompt('Motivo da recusa (opcional):') ?? '';
    setStatus('recusada', { motivo_recusa: motivo || null });
  }

  async function duplicar() {
    if (!proposal) return;
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const clone = { ...proposal };
    delete clone.id; delete clone.numero; delete clone.created_at; delete clone.updated_at;
    delete clone.status_changed_at; delete clone.sent_at; delete clone.viewed_at; delete clone.converted_at;
    delete clone.cancelled_at; delete clone.archived_at; delete clone.version_atual;
    const result = await supabase.from('proposals').insert({
      ...clone, status: 'rascunho', created_by: userData.user.id, data_proposta: new Date().toISOString().slice(0, 10),
    }).select().single();
    setBusy(false);
    if (!result.error) navigate(`/propostas/${result.data.id}`);
  }

  if (!proposal) return null;

  const m1 = modelo1Calculo({
    valorComDesconto: proposal.modelo1_valor_com_desconto, descontoPercentual: proposal.desconto_percentual, entradaPercentual: proposal.modelo1_entrada_percentual,
  });
  const m2 = modelo2Calculo({
    valorComDescontoMensal: proposal.modelo2_valor_com_desconto_mensal, descontoPercentual: proposal.desconto_percentual,
    entradaPercentual: proposal.modelo2_entrada_percentual, parcelasRestante: proposal.modelo2_parcelas_restante,
  });

  const isTerminal = ['recusada', 'expirada', 'cancelada', 'arquivada'].includes(proposal.status);
  const isExpiringSoon = proposal.data_validade && !isTerminal &&
    new Date(proposal.data_validade) > new Date() &&
    (new Date(proposal.data_validade) - new Date()) / 86400000 <= 5;
  const isExpired = proposal.data_validade && !isTerminal && new Date(proposal.data_validade) < new Date();

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div>
          <h1 style={{ fontSize: 24 }}>{proposalNumberLabel(proposal)}</h1>
          <div style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>{client?.nome ?? 'Sem cliente'}</div>
        </div>
        <div className="bd-u-flex bd-u-gap-3 bd-u-items-center">
          <Badge tone={PROPOSAL_STATUS_TONE[proposal.status]}>{PROPOSAL_STATUS_LABEL[proposal.status]}</Badge>
          <Button variant="outline" as={Link} to={`/propostas/${id}/versoes`}>Versões</Button>
          <Button variant="outline" as={Link} to={`/propostas/${id}/pdf`}>Imprimir / PDF</Button>
          <Button variant="outline" onClick={duplicar} loading={busy}>Duplicar</Button>
          <Button variant="outline" as={Link} to={`/propostas/${id}/editar`}>Editar</Button>
        </div>
      </div>

      {isExpired && <Alert tone="danger" title="Proposta vencida">A validade desta proposta já passou.</Alert>}
      {isExpiringSoon && <Alert tone="warning" title="Proposta vencendo">A validade termina em breve ({proposal.data_validade}).</Alert>}
      {proposal.status === 'enviada' && !proposal.viewed_at && (
        <Alert tone="info" title="Aguardando retorno">Proposta enviada, ainda sem resposta do cliente.</Alert>
      )}

      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        {proposal.status === 'rascunho' && <Button size="sm" onClick={() => setStatus('pronta_para_envio')} loading={busy}>Marcar pronta para envio</Button>}
        {proposal.status === 'pronta_para_envio' && <Button size="sm" onClick={() => setStatus('enviada')} loading={busy}>Marcar como enviada</Button>}
        {['enviada', 'visualizada'].includes(proposal.status) && (
          <Button size="sm" variant="outline" onClick={() => setStatus('visualizada', { viewed_at: proposal.viewed_at ?? new Date().toISOString() })} loading={busy}>Marcar visualizada</Button>
        )}
        {['enviada', 'visualizada', 'em_negociacao'].includes(proposal.status) && (
          <>
            <Button size="sm" variant="outline" onClick={() => setStatus('em_negociacao')} loading={busy}>Mover para negociação</Button>
            <Button size="sm" onClick={() => setStatus('aprovada')} loading={busy}>Aprovar</Button>
            <Button size="sm" variant="outline" onClick={handleRecusar} loading={busy}>Recusar</Button>
          </>
        )}
        {!isTerminal && proposal.status !== 'aprovada' && (
          <Button size="sm" variant="ghost" onClick={() => setStatus('cancelada')} loading={busy}>Cancelar</Button>
        )}
        {proposal.status === 'aprovada' && (
          <Button size="sm" as={Link} to={`/contratos/novo?propostaId=${id}&clienteId=${proposal.client_id ?? ''}`}>Converter em contrato</Button>
        )}
      </div>

      {proposal.motivo_recusa && (
        <Card padding="lg" style={{ borderColor: 'var(--bd-danger-500)' }}><strong>Motivo da recusa:</strong> {proposal.motivo_recusa}</Card>
      )}

      <Card padding="lg">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <div><strong>Data da proposta:</strong> {proposal.data_proposta}</div>
          <div><strong>Validade:</strong> {proposal.data_validade || '—'}</div>
          <div><strong>Elevadores:</strong> {proposal.qtd_elevadores ?? '—'}</div>
          <div><strong>Prazo de execução:</strong> {proposal.prazo_execucao || '—'}</div>
        </div>
        {proposal.descricao && <p style={{ marginTop: 'var(--bd-space-4)' }}>{proposal.descricao}</p>}
      </Card>

      {proposal.tipo_precificacao === 'modelo_fixo' && (
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Card padding="lg">
            <strong>Modelo 1 — Serviço Técnico Pontual</strong>
            <div style={{ marginTop: 8 }}>Valor: {formatCurrency(m1.valorTotal)}</div>
            <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
              Entrada {proposal.modelo1_entrada_percentual}% ({formatCurrency(m1.entradaValor)}) · Restante {m1.restantePercentual}% na entrega do laudo
            </div>
          </Card>
          <Card padding="lg">
            <strong>Modelo 2 — Serviço Técnico Continuado</strong>
            <div style={{ marginTop: 8 }}>Mensal: {formatCurrency(m2.valorMensal)} · Anual: {formatCurrency(m2.valorAnual)}</div>
            {m2.valorParcela != null && (
              <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
                {proposal.modelo2_parcelas_restante}x {formatCurrency(m2.valorParcela)}
              </div>
            )}
          </Card>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 'var(--bd-space-3)' }}>Linha do tempo e follow-up</h2>
        <div className="bd-u-flex bd-u-gap-3" style={{ marginBottom: 'var(--bd-space-3)' }}>
          <Button variant="outline" size="sm" as={Link} to={`/tarefas/nova?proposalId=${id}`}>Criar tarefa de follow-up</Button>
          <Button variant="outline" size="sm" as={Link} to={`/calendario/novo?proposalId=${id}`}>Agendar reunião</Button>
        </div>
        <QuickNote entityType="proposal" entityId={id} onAdded={() => setRefreshKey((k) => k + 1)} />
        <div style={{ marginTop: 'var(--bd-space-4)' }}>
          <ActivityTimeline entityType="proposal" entityId={id} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
