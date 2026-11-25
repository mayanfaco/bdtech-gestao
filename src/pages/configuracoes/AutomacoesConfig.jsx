import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Switch } from '../../design-system/components/forms/Switch.jsx';

// Ordem de exibição: primeiro as regras dos funis (as mais usadas), depois as antigas.
const ORDEM = [
  'prospeccao_sem_resposta_dias',
  'followup_toque_1', 'followup_toque_2', 'followup_toque_3', 'followup_toque_4', 'followup_toque_5', 'followup_toque_6',
  'followup_proposta_inicio_dias', 'geladeira_reativar_dias',
];
const posicao = (key) => { const i = ORDEM.indexOf(key); return i === -1 ? 100 : i; };

export default function AutomacoesConfig() {
  const [rules, setRules] = React.useState(null);
  const [empresa, setEmpresa] = React.useState(null);

  const load = React.useCallback(() => {
    supabase.from('automation_rules').select('*').order('key')
      .then(({ data }) => setRules((data ?? []).sort((a, b) => posicao(a.key) - posicao(b.key) || a.key.localeCompare(b.key))));
    supabase.from('company_settings').select('id, exigir_tutorial').limit(1).maybeSingle()
      .then(({ data, error }) => setEmpresa(error ? null : data));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function updateRule(id, patch) {
    await supabase.from('automation_rules').update(patch).eq('id', id);
    load();
  }

  async function setExigir(v) {
    if (!empresa?.id) return;
    const { error } = await supabase.from('company_settings').update({ exigir_tutorial: v }).eq('id', empresa.id);
    if (error) { alert(error.message); return; }
    load();
  }

  if (rules === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-4" style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: 22 }}>Automações</h1>
      <p style={{ fontSize: 13, color: 'var(--bd-text-muted)', margin: 0 }}>
        Prazos usados pelos funis, tarefas e alertas automáticos do sistema. Os toques do follow-up contam a partir da primeira mensagem.
      </p>

      {empresa && typeof empresa.exigir_tutorial === 'boolean' && (
        <Card padding="md">
          <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-3">
            <span style={{ flex: 1 }}>
              <strong>Exigir o tutorial</strong>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--bd-text-muted)' }}>
                Ligado: os funis e o Meu Lar só abrem depois da fase correspondente do tutorial.
              </span>
            </span>
            <Switch checked={empresa.exigir_tutorial} onChange={(e) => setExigir(e.target.checked)} />
          </div>
        </Card>
      )}

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
