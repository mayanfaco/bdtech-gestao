import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { supabase } from '../../lib/supabaseClient.js';
import { usePipelineStages } from '../../lib/pipelineStages.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { LossReasonModal } from '../../components/crm/LossReasonModal.jsx';

function formatCurrency(v) {
  if (v == null) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function OpportunityCard({ opp }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 10 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bd-surface-card)', border: '1px solid var(--bd-border-default)',
        borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-4)', marginBottom: 'var(--bd-space-3)',
        boxShadow: 'var(--bd-shadow-sm)', cursor: 'grab',
      }}
      onClick={() => navigate(`/oportunidades/${opp.id}`)}
      {...listeners}
      {...attributes}
    >
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--bd-text-strong)' }}>{opp.titulo}</div>
      <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 4 }}>
        {opp.clients?.nome || opp.leads?.nome || 'Sem cliente vinculado'}
      </div>
      {opp.valor_estimado != null && (
        <div style={{ fontSize: 13, color: 'var(--bd-primary-600)', fontWeight: 600, marginTop: 6 }}>
          {formatCurrency(opp.valor_estimado)}
        </div>
      )}
    </div>
  );
}

function StageColumn({ stage, opportunities }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '0 0 260px', background: isOver ? 'var(--bd-primary-50)' : 'var(--bd-surface-sunken)',
        borderRadius: 'var(--bd-radius-lg)', padding: 'var(--bd-space-3)', minHeight: 200,
        transition: 'background var(--bd-duration-fast)',
      }}
    >
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginBottom: 'var(--bd-space-3)', padding: '0 var(--bd-space-2)' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--bd-text-strong)' }}>{stage.label}</span>
        <Badge tone="neutral">{opportunities.length}</Badge>
      </div>
      {opportunities.map((o) => <OpportunityCard key={o.id} opp={o} />)}
    </div>
  );
}

export default function OportunidadesKanban() {
  const stages = usePipelineStages();
  const [opportunities, setOpportunities] = React.useState(null);
  const [pendingLoss, setPendingLoss] = React.useState(null); // { oppId, stageId }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const load = React.useCallback(() => {
    supabase.from('opportunities').select('*, clients(nome), leads(nome)').is('deleted_at', null)
      .then(({ data }) => setOpportunities(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function moveOpportunity(oppId, stageId, motivoPerda) {
    const payload = { stage_id: stageId };
    if (motivoPerda) payload.motivo_perda = motivoPerda;
    const { error } = await supabase.from('opportunities').update(payload).eq('id', oppId);
    if (!error) load();
    else alert(error.message);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    const opp = opportunities.find((o) => o.id === active.id);
    const targetStage = stages.find((s) => s.id === over.id);
    if (!opp || !targetStage || opp.stage_id === targetStage.id) return;
    if (targetStage.is_lost) {
      setPendingLoss({ oppId: opp.id, stageId: targetStage.id });
    } else {
      moveOpportunity(opp.id, targetStage.id);
    }
  }

  if (stages === null || opportunities === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div className="bd-u-flex bd-u-gap-3">
          <Button variant="outline" as={Link} to="/oportunidades/lista">Ver como lista</Button>
        </div>
        <Button as={Link} to="/oportunidades/nova">Nova oportunidade</Button>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState title="Nenhuma oportunidade ainda" text="Crie uma oportunidade a partir de um lead ou diretamente aqui."
          action={<Button as={Link} to="/oportunidades/nova">Nova oportunidade</Button>} />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 'var(--bd-space-4)', overflowX: 'auto', paddingBottom: 8 }}>
            {stages.map((stage) => (
              <StageColumn key={stage.id} stage={stage} opportunities={opportunities.filter((o) => o.stage_id === stage.id)} />
            ))}
          </div>
        </DndContext>
      )}

      {pendingLoss && (
        <LossReasonModal
          onConfirm={(motivo) => { moveOpportunity(pendingLoss.oppId, pendingLoss.stageId, motivo); setPendingLoss(null); }}
          onCancel={() => setPendingLoss(null)}
        />
      )}
    </div>
  );
}
