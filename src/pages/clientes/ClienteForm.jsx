import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useStaffOptions } from '../../lib/staffOptions.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

const EMPTY = {
  tipo_pessoa: 'PJ', nome: '', razao_social: '', nome_fantasia: '', cpf_cnpj: '',
  inscricao_estadual: '', inscricao_municipal: '', endereco: '', cidade: '', estado: '', cep: '',
  sindico_nome: '', sindico_cpf: '',
  contato_nome: '', contato_cargo: '', contato_email: '', contato_telefone: '', whatsapp: '',
  site: '', segmento: '', responsavel_user_id: '', status_relacionamento: 'ativo',
  qtd_elevadores: '',
};

export default function ClienteForm() {
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
    supabase.from('clients').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data, cpf_cnpj: data.cpf_cnpj ?? data.cnpj ?? '', qtd_elevadores: data.qtd_elevadores ?? '' });
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      cnpj: form.cpf_cnpj,
      responsavel_user_id: form.responsavel_user_id || null,
      qtd_elevadores: form.qtd_elevadores ? Number(form.qtd_elevadores) : null,
    };
    const { data: userData } = await supabase.auth.getUser();
    const result = isEdit
      ? await supabase.from('clients').update(payload).eq('id', id).select().single()
      : await supabase.from('clients').insert({ ...payload, created_by: userData.user.id }).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/clientes/${result.data.id}`);
  }

  if (loading) return null;

  return (
    <Card padding="lg" style={{ maxWidth: 680 }}>
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Cliente / Empreendimento" required value={form.nome} onChange={set('nome')} />
          <Select label="Tipo de pessoa" value={form.tipo_pessoa} onChange={set('tipo_pessoa')}
            options={[{ value: 'PJ', label: 'Pessoa jurídica' }, { value: 'PF', label: 'Pessoa física' }]} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Razão social" value={form.razao_social} onChange={set('razao_social')} />
          <Input label="Nome fantasia" value={form.nome_fantasia} onChange={set('nome_fantasia')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="CPF/CNPJ" value={form.cpf_cnpj} onChange={set('cpf_cnpj')} />
          <Input label="Segmento" value={form.segmento} onChange={set('segmento')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Inscrição estadual" value={form.inscricao_estadual} onChange={set('inscricao_estadual')} />
          <Input label="Inscrição municipal" value={form.inscricao_municipal} onChange={set('inscricao_municipal')} />
        </div>
        <Input label="Endereço completo" value={form.endereco} onChange={set('endereco')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Cidade" value={form.cidade} onChange={set('cidade')} />
          <Input label="Estado" value={form.estado} onChange={set('estado')} maxLength={2} />
        </div>
        <Input label="CEP" value={form.cep} onChange={set('cep')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Síndico (nome completo)" value={form.sindico_nome} onChange={set('sindico_nome')} />
          <Input label="CPF do síndico" value={form.sindico_cpf} onChange={set('sindico_cpf')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Nome do contato principal" value={form.contato_nome} onChange={set('contato_nome')} />
          <Input label="Cargo do contato" value={form.contato_cargo} onChange={set('contato_cargo')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="E-mail do contato" type="email" value={form.contato_email} onChange={set('contato_email')} />
          <Input label="Telefone do contato" value={form.contato_telefone} onChange={set('contato_telefone')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
          <Input label="Site" value={form.site} onChange={set('site')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Select label="Responsável" value={form.responsavel_user_id} onChange={set('responsavel_user_id')} placeholder="Selecione..." options={staffOptions} />
          <Select label="Status do relacionamento" value={form.status_relacionamento} onChange={set('status_relacionamento')}
            options={[{ value: 'prospect', label: 'Prospect' }, { value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]} />
        </div>
        <Input label="Quantidade de elevadores" type="number" min="0" value={form.qtd_elevadores} onChange={set('qtd_elevadores')} />
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="bd-u-flex bd-u-gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
