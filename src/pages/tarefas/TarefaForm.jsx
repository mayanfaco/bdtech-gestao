import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useStaffOptions } from '../../lib/staffOptions.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { BackButton } from '../../components/BackButton.jsx';

const LINK_FIELDS = ['leadId', 'opportunityId', 'clientId', 'proposalId', 'contractId', 'calendarEventId'];
const LINK_COLUMN = {
  leadId: 'lead_id', opportunityId: 'opportunity_id', clientId: 'client_id',
  proposalId: 'proposal_id', contractId: 'contract_id', calendarEventId: 'calendar_event_id',
};

const EMPTY = { titulo: '', descricao: '', responsavel_user_id: '', prioridade: 'media', prazo: '', status: 'pendente' };

export default function TarefaForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const staffOptions = useStaffOptions();
  const [form, setForm] = React.useState(EMPTY);
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('tasks').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data, prazo: data.prazo ? data.prazo.slice(0, 16) : '' });
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const links = {};
    if (!isEdit) {
      for (const key of LINK_FIELDS) {
        const value = searchParams.get(key);
        if (value) links[LINK_COLUMN[key]] = value;
      }
    }
    const payload = {
      ...form, ...links,
      responsavel_user_id: form.responsavel_user_id || null,
      prazo: form.prazo || null,
    };
    const result = isEdit
      ? await supabase.from('tasks').update(payload).eq('id', id).select().single()
      : await supabase.from('tasks').insert(payload).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/tarefas/${result.data.id}`);
  }

  if (loading) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-3" style={{ maxWidth: 560 }}>
      <BackButton to={isEdit ? `/tarefas/${id}` : '/tarefas'} label={isEdit ? 'Voltar para a tarefa' : 'Voltar para Tarefas'} />
      <Card padding="lg">
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <Input label="Título" required value={form.titulo} onChange={set('titulo')} />
        <Textarea label="Descrição" rows={3} value={form.descricao} onChange={set('descricao')} />
        <Select label="Responsável" value={form.responsavel_user_id} onChange={set('responsavel_user_id')} placeholder="Selecione..." options={staffOptions} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Select label="Prioridade" value={form.prioridade} onChange={set('prioridade')}
            options={[{ value: 'baixa', label: 'Baixa' }, { value: 'media', label: 'Média' }, { value: 'alta', label: 'Alta' }, { value: 'urgente', label: 'Urgente' }]} />
          <Input label="Prazo" type="datetime-local" value={form.prazo} onChange={set('prazo')} />
        </div>
        {isEdit && (
          <Select label="Status" value={form.status} onChange={set('status')}
            options={[
              { value: 'pendente', label: 'Pendente' }, { value: 'em_andamento', label: 'Em andamento' },
              { value: 'aguardando_terceiros', label: 'Aguardando terceiros' },
              { value: 'concluida', label: 'Concluída' }, { value: 'cancelada', label: 'Cancelada' },
            ]} />
        )}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="bd-u-flex bd-u-gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Criar tarefa'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
      </Card>
    </div>
  );
}
