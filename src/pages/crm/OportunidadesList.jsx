import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { usePipelineStages } from '../../lib/pipelineStages.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';

export default function OportunidadesList() {
  const stages = usePipelineStages();
  const [opportunities, setOpportunities] = React.useState(null);

  React.useEffect(() => {
    supabase.from('opportunities').select('*, clients(nome), leads(nome)').is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOpportunities(data ?? []));
  }, []);

  if (stages === null || opportunities === null) return null;
  const stageById = Object.fromEntries(stages.map((s) => [s.id, s]));

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <Button variant="outline" as={Link} to="/oportunidades">Ver como Kanban</Button>
        <Button as={Link} to="/oportunidades/nova">Nova oportunidade</Button>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState title="Nenhuma oportunidade ainda" />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {opportunities.map((o) => (
            <Link key={o.id} to={`/oportunidades/${o.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-5) var(--bd-space-6)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)' }}>{o.titulo}</div>
                    <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
                      {o.clients?.nome || o.leads?.nome || 'Sem cliente vinculado'}
                    </div>
                  </div>
                  <Badge tone={o.status === 'ganha' ? 'success' : o.status === 'perdida' ? 'danger' : 'brand'}>
                    {stageById[o.stage_id]?.label ?? o.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
