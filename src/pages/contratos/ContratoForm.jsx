import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useStaffOptions } from '../../lib/staffOptions.js';
import { numeroPorExtenso } from '../../lib/numeroPorExtenso.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

const EMPTY = {
  client_id: '', proposal_id: '', modelo: 'modelo1',
  contratante_nome: '', contratante_cnpj: '', contratante_endereco: '', contratante_sindico_nome: '', contratante_sindico_cpf: '',
  contratada_razao_social: '', contratada_cnpj: '', contratada_endereco: '', contratada_representante: '', contratada_cpf: '',
  escopo_servico: '', data_inicio: '', data_termino: '',
  valor_total: '', valor_total_extenso: '',
  parcela1_valor: '', parcela1_data: '', parcela2_valor: '', parcela2_data: '',
  parcelas_mensais_valor: '', parcelas_mensais_inicio: '',
  comarca_foro: 'Fortaleza/CE', cidade_assinatura: 'Fortaleza', data_assinatura: new Date().toISOString().slice(0, 10),
  responsavel_user_id: '',
};

export default function ContratoForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const staffOptions = useStaffOptions();
  const [clients, setClients] = React.useState([]);
  const [form, setForm] = React.useState({
    ...EMPTY,
    client_id: searchParams.get('clienteId') ?? searchParams.get('clientId') ?? '',
    proposal_id: searchParams.get('propostaId') ?? '',
  });
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [extensoTocado, setExtensoTocado] = React.useState(false);

  React.useEffect(() => {
    supabase.from('clients').select('id, nome').is('deleted_at', null).order('nome')
      .then(({ data }) => setClients(data ?? []));
  }, []);

  // Pré-preenche Contratada a partir das configurações da empresa (só na criação).
  React.useEffect(() => {
    if (isEdit) return;
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => {
      if (!data) return;
      setForm((f) => ({
        ...f,
        contratada_razao_social: f.contratada_razao_social || data.razao_social,
        contratada_cnpj: f.contratada_cnpj || data.cnpj,
        contratada_endereco: f.contratada_endereco || data.endereco,
        contratada_representante: f.contratada_representante || data.representante_legal,
        contratada_cpf: f.contratada_cpf || data.representante_cpf,
      }));
    });
  }, [isEdit]);

  // Pré-preenche Contratante a partir do cliente selecionado (só na criação).
  React.useEffect(() => {
    if (isEdit || !form.client_id) return;
    supabase.from('clients').select('*').eq('id', form.client_id).single().then(({ data }) => {
      if (!data) return;
      setForm((f) => ({
        ...f,
        contratante_nome: data.nome,
        contratante_cnpj: data.cpf_cnpj || data.cnpj || '',
        contratante_endereco: data.endereco || '',
        contratante_sindico_nome: data.sindico_nome || '',
        contratante_sindico_cpf: data.sindico_cpf || '',
      }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.client_id, isEdit]);

  // Pré-preenche a partir de uma proposta aprovada (só na criação).
  React.useEffect(() => {
    if (isEdit || !form.proposal_id) return;
    supabase.from('proposals').select('*').eq('id', form.proposal_id).single().then(({ data }) => {
      if (!data) return;
      const anual = data.modelo2_valor_com_desconto_mensal ? data.modelo2_valor_com_desconto_mensal * 12 : null;
      const valor = data.tipo_precificacao === 'modelo_fixo'
        ? (anual ?? data.modelo1_valor_com_desconto ?? '')
        : '';
      setForm((f) => ({
        ...f,
        client_id: f.client_id || data.client_id || '',
        modelo: anual ? 'modelo2' : 'modelo1',
        escopo_servico: f.escopo_servico || data.escopo || data.titulo || data.servico_tipo || '',
        valor_total: f.valor_total || valor,
      }));
    });
  }, [form.proposal_id, isEdit]);

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('contracts').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data });
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function handleValorChange(e) {
    const valor = e.target.value;
    setForm((f) => ({ ...f, valor_total: valor, valor_total_extenso: extensoTocado ? f.valor_total_extenso : numeroPorExtenso(Number(valor)) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      client_id: form.client_id || null,
      proposal_id: form.proposal_id || null,
      modelo: form.modelo,
      contratante_nome: form.contratante_nome,
      contratante_cnpj: form.contratante_cnpj,
      contratante_endereco: form.contratante_endereco,
      contratante_sindico_nome: form.contratante_sindico_nome,
      contratante_sindico_cpf: form.contratante_sindico_cpf,
      contratada_razao_social: form.contratada_razao_social,
      contratada_cnpj: form.contratada_cnpj,
      contratada_endereco: form.contratada_endereco,
      contratada_representante: form.contratada_representante,
      contratada_cpf: form.contratada_cpf,
      escopo_servico: form.escopo_servico,
      data_inicio: form.data_inicio || null,
      data_termino: form.data_termino || null,
      valor_total: form.valor_total ? Number(form.valor_total) : null,
      valor_total_extenso: form.valor_total_extenso,
      parcela1_valor: form.parcela1_valor ? Number(form.parcela1_valor) : null,
      parcela1_data: form.parcela1_data || null,
      parcela2_valor: form.parcela2_valor ? Number(form.parcela2_valor) : null,
      parcela2_data: form.parcela2_data || null,
      parcelas_mensais_valor: form.parcelas_mensais_valor ? Number(form.parcelas_mensais_valor) : null,
      parcelas_mensais_inicio: form.parcelas_mensais_inicio || null,
      comarca_foro: form.comarca_foro,
      cidade_assinatura: form.cidade_assinatura,
      data_assinatura: form.data_assinatura || null,
      responsavel_user_id: form.responsavel_user_id || null,
    };

    const result = isEdit
      ? await supabase.from('contracts').update(payload).eq('id', id).select().single()
      : await (async () => {
        const { data: userData } = await supabase.auth.getUser();
        return supabase.from('contracts').insert({ ...payload, created_by: userData.user.id }).select().single();
      })();

    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/contratos/${result.data.id}`);
  }

  if (loading) return null;

  return (
    <Card padding="lg" style={{ maxWidth: 760 }}>
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>Contratante — Condomínio</h3>
        <Select label="Cliente" value={form.client_id} onChange={set('client_id')} placeholder="Selecione..." options={clients.map((c) => ({ value: c.id, label: c.nome }))} />
        <Input label="Nome do condomínio" required value={form.contratante_nome} onChange={set('contratante_nome')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="CNPJ" value={form.contratante_cnpj} onChange={set('contratante_cnpj')} />
          <Input label="Endereço completo" value={form.contratante_endereco} onChange={set('contratante_endereco')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Síndico (nome completo)" value={form.contratante_sindico_nome} onChange={set('contratante_sindico_nome')} />
          <Input label="CPF do síndico" value={form.contratante_sindico_cpf} onChange={set('contratante_sindico_cpf')} />
        </div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Contratada — BDTECH</h3>
        <Input label="Razão social" value={form.contratada_razao_social} onChange={set('contratada_razao_social')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="CNPJ" value={form.contratada_cnpj} onChange={set('contratada_cnpj')} />
          <Input label="Endereço completo" value={form.contratada_endereco} onChange={set('contratada_endereco')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Representante legal" value={form.contratada_representante} onChange={set('contratada_representante')} />
          <Input label="CPF do representante" value={form.contratada_cpf} onChange={set('contratada_cpf')} />
        </div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Objeto e prazo</h3>
        <Select label="Modelo" value={form.modelo} onChange={set('modelo')}
          options={[{ value: 'modelo1', label: 'Modelo 1 — Serviço Técnico Pontual' }, { value: 'modelo2', label: 'Modelo 2 — Serviço Técnico Continuado' }]} />
        <Textarea label="Escopo do serviço" rows={2} value={form.escopo_servico} onChange={set('escopo_servico')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Data de início" type="date" value={form.data_inicio} onChange={set('data_inicio')} />
          <Input label="Data de término" type="date" value={form.data_termino} onChange={set('data_termino')} />
        </div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Pagamento</h3>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Valor total (R$)" type="number" step="0.01" value={form.valor_total} onChange={handleValorChange} />
          <Input label="Valor total por extenso" value={form.valor_total_extenso}
            onChange={(e) => { setExtensoTocado(true); setForm((f) => ({ ...f, valor_total_extenso: e.target.value })); }} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="1ª parcela (R$)" type="number" step="0.01" value={form.parcela1_valor} onChange={set('parcela1_valor')} />
          <Input label="Data da 1ª parcela" type="date" value={form.parcela1_data} onChange={set('parcela1_data')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="2ª parcela (R$)" type="number" step="0.01" value={form.parcela2_valor} onChange={set('parcela2_valor')} />
          <Input label="Data da 2ª parcela" type="date" value={form.parcela2_data} onChange={set('parcela2_data')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Parcelas mensais restantes (R$)" type="number" step="0.01" value={form.parcelas_mensais_valor} onChange={set('parcelas_mensais_valor')} />
          <Input label="Início das mensais" type="date" value={form.parcelas_mensais_inicio} onChange={set('parcelas_mensais_inicio')} />
        </div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Foro e assinatura</h3>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Comarca / foro" value={form.comarca_foro} onChange={set('comarca_foro')} />
          <Input label="Cidade da assinatura" value={form.cidade_assinatura} onChange={set('cidade_assinatura')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Data da assinatura" type="date" value={form.data_assinatura} onChange={set('data_assinatura')} />
          <Select label="Responsável" value={form.responsavel_user_id} onChange={set('responsavel_user_id')} placeholder="Selecione..." options={staffOptions} />
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        <div className="bd-u-flex bd-u-gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Salvar como rascunho'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
