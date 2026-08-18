import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useStaffOptions } from '../../lib/staffOptions.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Checkbox } from '../../design-system/components/forms/Checkbox.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { BackButton } from '../../components/BackButton.jsx';

const TIPO_OPTIONS = [
  { value: 'reuniao_comercial', label: 'Reunião comercial' },
  { value: 'reuniao_tecnica', label: 'Reunião técnica' },
  { value: 'apresentacao_proposta', label: 'Apresentação de proposta' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'vistoria', label: 'Vistoria' },
  { value: 'visita_cliente', label: 'Visita ao cliente' },
  { value: 'reuniao_interna', label: 'Reunião interna' },
  { value: 'vencimento_proposta', label: 'Vencimento de proposta' },
  { value: 'vencimento_contrato', label: 'Vencimento de contrato' },
  { value: 'compromisso_administrativo', label: 'Compromisso administrativo' },
  { value: 'outro', label: 'Outro' },
];

const LINK_FIELDS = ['clienteId', 'clientId', 'leadId', 'oportunidadeId', 'propostaId', 'contratoId'];
const LINK_COLUMN = {
  clienteId: 'client_id', clientId: 'client_id', leadId: 'lead_id',
  oportunidadeId: 'opportunity_id', propostaId: 'proposal_id', contratoId: 'contract_id',
};

const EMPTY = {
  titulo: '', tipo: 'reuniao_comercial', data_inicio: '', data_fim: '', all_day: false,
  local: '', link_reuniao: '', descricao: '', lembrete_minutos: '30', responsavel_user_id: '', status: 'agendado',
};

export default function EventoForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const staffOptions = useStaffOptions();
  const [form, setForm] = React.useState({ ...EMPTY, data_inicio: searchParams.get('data') ?? '' });
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('calendar_events').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data, data_inicio: data.data_inicio?.slice(0, 16) ?? '', data_fim: data.data_fim?.slice(0, 16) ?? '' });
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
      lembrete_minutos: form.lembrete_minutos ? Number(form.lembrete_minutos) : null,
      data_inicio: form.data_inicio ? new Date(form.data_inicio).toISOString() : null,
      data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : null,
    };
    const result = isEdit
      ? await supabase.from('calendar_events').update(payload).eq('id', id).select().single()
      : await (async () => {
        const { data: userData } = await supabase.auth.getUser();
        return supabase.from('calendar_events').insert({ ...payload, created_by: userData.user.id }).select().single();
      })();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/calendario/${result.data.id}`);
  }

  if (loading) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-3" style={{ maxWidth: 600 }}>
      <BackButton to={isEdit ? `/calendario/${id}` : '/calendario'} label={isEdit ? 'Voltar para o evento' : 'Voltar para Calendário'} />
      <Card padding="lg">
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <Input label="Título" required value={form.titulo} onChange={set('titulo')} />
        <Select label="Tipo" value={form.tipo} onChange={set('tipo')} options={TIPO_OPTIONS} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Início" type="datetime-local" required value={form.data_inicio} onChange={set('data_inicio')} />
          <Input label="Fim" type="datetime-local" value={form.data_fim} onChange={set('data_fim')} />
        </div>
        <Checkbox label="Dia inteiro" checked={form.all_day} onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Localização" value={form.local} onChange={set('local')} />
          <Input label="Link da reunião" value={form.link_reuniao} onChange={set('link_reuniao')} />
        </div>
        <Textarea label="Descrição" rows={3} value={form.descricao} onChange={set('descricao')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Select label="Responsável" value={form.responsavel_user_id} onChange={set('responsavel_user_id')} placeholder="Selecione..." options={staffOptions} />
          <Input label="Lembrete (minutos antes)" type="number" min="0" value={form.lembrete_minutos} onChange={set('lembrete_minutos')} />
        </div>
        {isEdit && (
          <Select label="Status" value={form.status} onChange={set('status')}
            options={[
              { value: 'agendado', label: 'Agendado' }, { value: 'confirmado', label: 'Confirmado' },
              { value: 'realizado', label: 'Realizado' }, { value: 'reagendado', label: 'Reagendado' },
              { value: 'cancelado', label: 'Cancelado' }, { value: 'nao_compareceu', label: 'Não compareceu' },
            ]} />
        )}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="bd-u-flex bd-u-gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Criar evento'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
      </Card>
    </div>
  );
}
