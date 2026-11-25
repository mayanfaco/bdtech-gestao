import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useStaffOptions } from '../../lib/staffOptions.js';
import { numeroPorExtenso } from '../../lib/numeroPorExtenso.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { ContratoDocumentPreview } from '../../components/contratos/ContratoDocumentPreview.jsx';
import { injectDocumentEditorLayoutCss } from '../../components/documentEditorLayoutCss.js';
import { BackButton } from '../../components/BackButton.jsx';
import '../../print.css';

injectDocumentEditorLayoutCss();

const hoje = new Date();
const DATA_INICIO_PADRAO = hoje.toISOString().slice(0, 10);
const DATA_TERMINO_PADRAO = new Date(hoje.getFullYear() + 1, hoje.getMonth(), hoje.getDate()).toISOString().slice(0, 10);

const EMPTY = {
  client_id: '', proposal_id: '', modelo: 'modelo1',
  contratante_nome: '', contratante_cnpj: '', contratante_endereco: '', contratante_sindico_nome: '', contratante_sindico_cpf: '',
  contratada_razao_social: '', contratada_cnpj: '', contratada_endereco: '', contratada_representante: '', contratada_cpf: '',
  escopo_servico: '', data_inicio: DATA_INICIO_PADRAO, data_termino: DATA_TERMINO_PADRAO,
  valor_total: '', valor_total_extenso: '',
  parcela1_valor: '', parcela1_data: '',
  parcelas_mensais_quantidade: '', parcelas_mensais_inicio: '',
  comarca_foro: 'Fortaleza/CE', cidade_assinatura: 'Fortaleza', data_assinatura: new Date().toISOString().slice(0, 10),
  responsavel_user_id: '',
  testemunha1_nome: '', testemunha1_cpf: '', testemunha2_nome: '', testemunha2_cpf: '',
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
      parcelas_mensais_quantidade: form.parcelas_mensais_quantidade ? Number(form.parcelas_mensais_quantidade) : null,
      // Contrato antigo sem quantidade informada mantém o valor mensal já gravado.
      parcelas_mensais_valor: valorParcela ?? form.parcelas_mensais_valor ?? null,
      parcelas_mensais_inicio: form.parcelas_mensais_inicio || null,
      comarca_foro: form.comarca_foro,
      cidade_assinatura: form.cidade_assinatura,
      data_assinatura: form.data_assinatura || null,
      responsavel_user_id: form.responsavel_user_id || null,
      testemunha1_nome: form.testemunha1_nome || null,
      testemunha1_cpf: form.testemunha1_cpf || null,
      testemunha2_nome: form.testemunha2_nome || null,
      testemunha2_cpf: form.testemunha2_cpf || null,
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

  const quantidadeParcelas = Number(form.parcelas_mensais_quantidade) || 0;
  const restante = (Number(form.valor_total) || 0) - (Number(form.parcela1_valor) || 0);
  const valorParcela = quantidadeParcelas > 0 ? Math.round((restante / quantidadeParcelas) * 100) / 100 : null;

  return (
    <div className="bd-u-flex-col bd-u-gap-3">
      <BackButton to={isEdit ? `/contratos/${id}` : '/contratos'} label={isEdit ? 'Voltar para o contrato' : 'Voltar para Contratos'} />
      <div className="bd-doc-editor">
      <form onSubmit={handleSubmit} className="bd-doc-editor__form">
      <div className="bd-doc-editor__form-scroll bd-u-flex-col bd-u-gap-4">
        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>Contratante — Condomínio</h3>
        <Select label="Cliente" required value={form.client_id} onChange={set('client_id')} placeholder="Selecione..." options={clients.map((c) => ({ value: c.id, label: c.nome }))} />
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
        <Input label="Razão social" required value={form.contratada_razao_social} onChange={set('contratada_razao_social')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="CNPJ" required value={form.contratada_cnpj} onChange={set('contratada_cnpj')} />
          <Input label="Endereço completo" required value={form.contratada_endereco} onChange={set('contratada_endereco')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Representante legal" required value={form.contratada_representante} onChange={set('contratada_representante')} />
          <Input label="CPF do representante" required value={form.contratada_cpf} onChange={set('contratada_cpf')} />
        </div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Objeto e prazo</h3>
        <Select label="Modelo" value={form.modelo} onChange={set('modelo')}
          options={[{ value: 'modelo1', label: 'Modelo 1 — Serviço Técnico Pontual' }, { value: 'modelo2', label: 'Modelo 2 — Serviço Técnico Continuado' }]} />
        <Textarea label="Escopo do serviço" rows={2} required value={form.escopo_servico} onChange={set('escopo_servico')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Data de início" type="date" required value={form.data_inicio} onChange={set('data_inicio')} />
          <Input label="Data de término" type="date" required value={form.data_termino} onChange={set('data_termino')} />
        </div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Pagamento</h3>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Valor total (R$)" type="number" step="0.01" required value={form.valor_total} onChange={handleValorChange} />
          <Input label="Valor total por extenso" value={form.valor_total_extenso}
            onChange={(e) => { setExtensoTocado(true); setForm((f) => ({ ...f, valor_total_extenso: e.target.value })); }} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="1ª parcela — sinal (R$)" type="number" step="0.01" value={form.parcela1_valor} onChange={set('parcela1_valor')} />
          <Input label="Vencimento da entrada" type="date" required={Number(form.parcela1_valor) > 0} value={form.parcela1_data} onChange={set('parcela1_data')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Parcelas restantes" type="number" min="1" step="1" value={form.parcelas_mensais_quantidade} onChange={set('parcelas_mensais_quantidade')}
            hint={valorParcela != null ? `Valor de cada parcela: ${formatCurrency(valorParcela)}` : 'Ex.: 11 = restante dividido em 11 parcelas mensais'} />
          <Input label="1º vencimento das parcelas" type="date" required={quantidadeParcelas > 0} value={form.parcelas_mensais_inicio} onChange={set('parcelas_mensais_inicio')}
            hint="As outras vencem no mesmo dia dos meses seguintes. Dá para alterar cada uma depois." />
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

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Testemunhas</h3>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Testemunha 1 — nome" value={form.testemunha1_nome} onChange={set('testemunha1_nome')} />
          <Input label="Testemunha 1 — CPF" value={form.testemunha1_cpf} onChange={set('testemunha1_cpf')} />
        </div>
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Testemunha 2 — nome" value={form.testemunha2_nome} onChange={set('testemunha2_nome')} />
          <Input label="Testemunha 2 — CPF" value={form.testemunha2_cpf} onChange={set('testemunha2_cpf')} />
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
      </div>
      <div className="bd-doc-editor__form-footer">
        <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Salvar contrato'}</Button>
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
      </div>
      </form>

      <div className="bd-doc-editor__preview">
        <ContratoDocumentPreview contract={{ ...form, parcelas_mensais_valor: valorParcela ?? form.parcelas_mensais_valor }} />
      </div>
      </div>
    </div>
  );
}
