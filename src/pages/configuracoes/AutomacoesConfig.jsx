import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Switch } from '../../design-system/components/forms/Switch.jsx';

export default function AutomacoesConfig() {
  const [rules, setRules] = React.useState(null);

  const load = React.useCallback(() => {
    supabase.from('automation_rules').select('*').order('key').then(({ data }) => setRules(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function updateRule(id, patch) {
    await supabase.from('automation_rules').update(patch).eq('id', id);
    load();
  }

  if (rules === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-4" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 22 }}>Automações</h1>
      <p style={{ fontSize: 13, color: 'var(--bd-text-muted)', margin: 0 }}>
        Prazos usados pelas tarefas e alertas automáticos do sistema.
      </p>
      <div className="bd-u-flex-col bd-u-gap-2">
        {rules.map((r) => (
          <Card key={r.id} padding="md">
            <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-3">
              <span style={{ flex: 1 }}>{r.label}</span>
              <Input type="number" min="0" value={r.dias_prazo} onChange={(e) => updateRule(r.id, { dias_prazo: Number(e.target.value) })} style={{ width: 90 }} />
              <span style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>dias</span>
              <Switch checked={r.ativo} onChange={(e) => updateRule(r.id, { ativo: e.target.checked })} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
