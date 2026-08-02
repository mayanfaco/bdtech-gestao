import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useStaffOptions } from '../../lib/staffOptions.js';
import { usePipelineStages } from '../../lib/pipelineStages.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

const EMPTY = {
  client_id: '', lead_id: '', servico_tipo: '', titulo: '', descricao: '',
  valor_estimado: '', probabilidade_percentual: '', previsao_fechamento: '',
  responsavel_user_id: '', origem: '', stage_id: '', proxima_acao: '', proxima_acao_data: '',
};

export default function OportunidadeForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const staffOptions = useStaffOptions();
  const stages = usePipelineStages();
  const [clients, setClients] = React.useState([]);
  const [form, setForm] = React.useState({
    ...EMPTY,
    client_id: searchParams.get('clientId') ?? '',
    lead_id: searchParams.get('leadId') ?? '',
  });
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    supabase.from('clients').select('id, nome').is('deleted_at', null).order('nome')
      .then(({ data }) => setClients((data ?? []).map((c) => ({ value: c.id, label: c.nome }))));
  }, []);

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('opportunities').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data });
      setLoading(false);
    });
  }, [id, isEdit]);

  React.useEffect(() => {
    if (!isEdit && stages?.length && !form.stage_id) {
      setForm((f) => ({ ...f, stage_id: stages[0].id }));
    }
  }, [stages, isEdit, form.stage_id]);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      client_id: form.client_id || null,
      lead_id: form.lead_id || null,
      responsavel_user_id: form.responsavel_user_id || null,
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      probabilidade_percentual: form.probabilidade_percentual ? Number(form.probabilidade_percentual) : null,
      previsao_fechamento: form.previsao_fechamento || null,
      proxima_acao_data: form.proxima_acao_data || null,
    };
    const result = isEdit
      ? await supabase.from('opportunities').update(payload).eq('id', id).select().single()
      : await supabase.from('opportunities').insert(payload).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/oportunidades/${result.data.id}`);
  }

  if (loading || stages === null) return null;

  return (
    <Card padding="lg" style={{ maxWidth: 640 }}>
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <Input label="Título" required value={form.titulo} onChange={set('titulo')} />
        <Select label="Cliente" value={form.client_id} onChange={set('client_id')} placeholder="Selecione (opcional)" options={clients} />
        <Input label="Tipo de serviço" value={form.servico_tipo} onChange={set('servico_tipo')} />
        <Textarea label="Descrição da necessidade" rows={3} value={form.descricao} onChange={set('descricao')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Valor estimado (R$)" type="number" step="0.01" value={form.valor_estimado} onChange={set('valor_estimado')} />
          <Input label="Probabilidade (%)" type="number" min="0" max="100" value={form.probabilidade_percentual} onChange={set('probabilidade_percentual')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Previsão de fechamento" type="date" value={form.previsao_fechamento} onChange={set('previsao_fechamento')} />
          <Input label="Origem" value={form.origem} onChange={set('origem')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Select label="Responsável" value={form.responsavel_user_id} onChange={set('responsavel_user_id')} placeholder="Selecione..." options={staffOptions} />
          <Select label="Etapa" value={form.stage_id} onChange={set('stage_id')}
            options={stages.map((s) => ({ value: s.id, label: s.label }))} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Próxima ação" value={form.proxima_acao} onChange={set('proxima_acao')} />
          <Input label="Data da próxima ação" type="date" value={form.proxima_acao_data} onChange={set('proxima_acao_data')} />
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="bd-u-flex bd-u-gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Criar oportunidade'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
