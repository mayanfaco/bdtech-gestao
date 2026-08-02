import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { usePipelineStages } from '../../lib/pipelineStages.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Stepper } from '../../design-system/components/navigation/Stepper.jsx';
import { ActivityTimeline, QuickNote } from '../../components/crm/ActivityTimeline.jsx';
import { LossReasonModal } from '../../components/crm/LossReasonModal.jsx';

function formatCurrency(v) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function OportunidadeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const stages = usePipelineStages();
  const [opp, setOpp] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [showLossModal, setShowLossModal] = React.useState(false);

  const load = React.useCallback(() => {
    supabase.from('opportunities').select('*, clients(id, nome)').eq('id', id).single().then(({ data }) => setOpp(data));
  }, [id]);

  React.useEffect(() => { load(); }, [load, refreshKey]);

  if (!opp || stages === null) return null;

  const currentIndex = stages.findIndex((s) => s.id === opp.stage_id);
  const wonStage = stages.find((s) => s.is_won);
  const lostStage = stages.find((s) => s.is_lost);

  async function markWon() {
    await supabase.from('opportunities').update({ stage_id: wonStage.id }).eq('id', id);
    setRefreshKey((k) => k + 1);
  }

  async function confirmLoss(motivo) {
    await supabase.from('opportunities').update({ stage_id: lostStage.id, motivo_perda: motivo }).eq('id', id);
    setShowLossModal(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div>
          <h1 style={{ fontSize: 24 }}>{opp.titulo}</h1>
          <div style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>{opp.clients?.nome || 'Sem cliente vinculado'}</div>
        </div>
        <div className="bd-u-flex bd-u-gap-3 bd-u-items-center">
          {opp.status === 'ganha' && <Badge tone="success">Ganha</Badge>}
          {opp.status === 'perdida' && <Badge tone="danger">Perdida</Badge>}
          <Button variant="outline" as={Link} to={`/oportunidades/${id}/editar`}>Editar</Button>
          {opp.status === 'aberta' && (
            <>
              <Button variant="outline" onClick={markWon}>Marcar como ganha</Button>
              <Button variant="outline" onClick={() => setShowLossModal(true)}>Marcar como perdida</Button>
            </>
          )}
        </div>
      </div>

      {opp.status === 'aberta' && (
        <Stepper steps={stages.filter((s) => !s.is_won && !s.is_lost).map((s) => ({ label: s.label }))} current={currentIndex} />
      )}

      {opp.status === 'perdida' && opp.motivo_perda && (
        <Card padding="lg" variant="default" style={{ borderColor: 'var(--bd-danger-500)' }}>
          <strong>Motivo da perda:</strong> {opp.motivo_perda}
        </Card>
      )}

      <Card padding="lg">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <div><strong>Valor estimado:</strong> {formatCurrency(opp.valor_estimado)}</div>
          <div><strong>Probabilidade:</strong> {opp.probabilidade_percentual != null ? `${opp.probabilidade_percentual}%` : '—'}</div>
          <div><strong>Previsão de fechamento:</strong> {opp.previsao_fechamento || '—'}</div>
          <div><strong>Origem:</strong> {opp.origem || '—'}</div>
        </div>
        {opp.descricao && <p style={{ marginTop: 'var(--bd-space-4)' }}>{opp.descricao}</p>}
      </Card>

      <div className="bd-u-flex bd-u-gap-3">
        <Button variant="outline" size="sm" as={Link} to={`/propostas/nova?oportunidadeId=${id}&clienteId=${opp.client_id ?? ''}`}>Criar proposta</Button>
        <Button variant="outline" size="sm" as={Link} to={`/calendario/novo?oportunidadeId=${id}`}>Agendar reunião</Button>
        <Button variant="outline" size="sm" as={Link} to={`/tarefas/nova?oportunidadeId=${id}`}>Criar tarefa</Button>
      </div>

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 'var(--bd-space-3)' }}>Linha do tempo</h2>
        <QuickNote entityType="opportunity" entityId={id} onAdded={() => setRefreshKey((k) => k + 1)} />
        <div style={{ marginTop: 'var(--bd-space-4)' }}>
          <ActivityTimeline entityType="opportunity" entityId={id} refreshKey={refreshKey} />
        </div>
      </div>

      {showLossModal && <LossReasonModal onConfirm={confirmLoss} onCancel={() => setShowLossModal(false)} />}
    </div>
  );
}
