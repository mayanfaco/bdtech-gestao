import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Checkbox } from '../../design-system/components/forms/Checkbox.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';

export default function PipelineStagesConfig() {
  const [stages, setStages] = React.useState(null);

  const load = React.useCallback(() => {
    supabase.from('pipeline_stages').select('*').order('order_index').then(({ data }) => setStages(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function updateStage(id, patch) {
    await supabase.from('pipeline_stages').update(patch).eq('id', id);
    load();
  }

  async function addStage() {
    const maxOrder = Math.max(-1, ...stages.map((s) => s.order_index));
    await supabase.from('pipeline_stages').insert({ key: `etapa_${Date.now()}`, label: 'Nova etapa', order_index: maxOrder + 1 });
    load();
  }

  if (stages === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-4" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 22 }}>Etapas do funil (Kanban)</h1>
      <div className="bd-u-flex-col bd-u-gap-2">
        {stages.map((s) => (
          <Card key={s.id} padding="md">
            <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
              <Input value={s.label} onChange={(e) => updateStage(s.id, { label: e.target.value })} style={{ flex: 1 }} />
              <Checkbox label="Ganho" checked={s.is_won} onChange={(e) => updateStage(s.id, { is_won: e.target.checked, is_lost: e.target.checked ? false : s.is_lost })} />
              <Checkbox label="Perdido" checked={s.is_lost} onChange={(e) => updateStage(s.id, { is_lost: e.target.checked, is_won: e.target.checked ? false : s.is_won })} />
              <Checkbox label="Ativa" checked={s.active} onChange={(e) => updateStage(s.id, { active: e.target.checked })} />
            </div>
          </Card>
        ))}
      </div>
      <Button variant="outline" onClick={addStage} style={{ alignSelf: 'flex-start' }}>Adicionar etapa</Button>
    </div>
  );
}
