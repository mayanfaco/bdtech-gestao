import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Checkbox } from '../../design-system/components/forms/Checkbox.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

const EMPTY = { nome: '', cargo: '', telefone: '', whatsapp: '', email: '', departamento: '', principal: false, observacoes: '' };

export default function ClienteContatoForm() {
  const { id, contatoId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(contatoId);
  const [form, setForm] = React.useState(EMPTY);
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('client_contacts').select('*').eq('id', contatoId).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data });
      setLoading(false);
    });
  }, [contatoId, isEdit]);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, client_id: id };
    const result = isEdit
      ? await supabase.from('client_contacts').update(payload).eq('id', contatoId).select().single()
      : await supabase.from('client_contacts').insert(payload).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/clientes/${id}`);
  }

  if (loading) return null;

  return (
    <Card padding="lg" style={{ maxWidth: 560 }}>
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <Input label="Nome" required value={form.nome} onChange={set('nome')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Cargo" value={form.cargo} onChange={set('cargo')} />
          <Input label="Departamento" value={form.departamento} onChange={set('departamento')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Telefone" value={form.telefone} onChange={set('telefone')} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
        </div>
        <Input label="E-mail" type="email" value={form.email} onChange={set('email')} />
        <Checkbox label="Contato principal" checked={form.principal} onChange={(e) => setForm((f) => ({ ...f, principal: e.target.checked }))} />
        <Textarea label="Observações" rows={3} value={form.observacoes} onChange={set('observacoes')} />
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="bd-u-flex bd-u-gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Adicionar contato'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
