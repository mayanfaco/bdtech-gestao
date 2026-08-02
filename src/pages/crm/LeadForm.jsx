import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useStaffOptions } from '../../lib/staffOptions.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

const EMPTY = {
  nome: '', empresa: '', telefone: '', whatsapp: '', email: '', cargo: '',
  cidade: '', estado: '', origem: '', servico_interesse: '', responsavel_user_id: '',
  observacoes: '', etiquetas: '', proxima_acao: '', data_proximo_contato: '',
};

export default function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const staffOptions = useStaffOptions();
  const [form, setForm] = React.useState(EMPTY);
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('leads').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data, etiquetas: (data.etiquetas ?? []).join(', ') });
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      etiquetas: form.etiquetas.split(',').map((t) => t.trim()).filter(Boolean),
      responsavel_user_id: form.responsavel_user_id || null,
      data_proximo_contato: form.data_proximo_contato || null,
    };
    const result = isEdit
      ? await supabase.from('leads').update(payload).eq('id', id).select().single()
      : await supabase.from('leads').insert(payload).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/leads/${result.data.id}`);
  }

  if (loading) return null;

  return (
    <Card padding="lg" style={{ maxWidth: 640 }}>
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Nome" required value={form.nome} onChange={set('nome')} />
          <Input label="Empresa" value={form.empresa} onChange={set('empresa')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Telefone" value={form.telefone} onChange={set('telefone')} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="E-mail" type="email" value={form.email} onChange={set('email')} />
          <Input label="Cargo" value={form.cargo} onChange={set('cargo')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Cidade" value={form.cidade} onChange={set('cidade')} />
          <Input label="Estado" value={form.estado} onChange={set('estado')} maxLength={2} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Origem" placeholder="Indicação, site, Instagram..." value={form.origem} onChange={set('origem')} />
          <Input label="Serviço de interesse" value={form.servico_interesse} onChange={set('servico_interesse')} />
        </div>
        <Select label="Responsável" value={form.responsavel_user_id} onChange={set('responsavel_user_id')}
          placeholder="Selecione..." options={staffOptions} />
        <Input label="Etiquetas" placeholder="separadas por vírgula" value={form.etiquetas} onChange={set('etiquetas')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Próxima ação" value={form.proxima_acao} onChange={set('proxima_acao')} />
          <Input label="Data do próximo contato" type="date" value={form.data_proximo_contato} onChange={set('data_proximo_contato')} />
        </div>
        <Textarea label="Observações" rows={3} value={form.observacoes} onChange={set('observacoes')} />
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="bd-u-flex bd-u-gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Cadastrar lead'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
