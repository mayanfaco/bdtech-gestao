import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { modelo1Calculo, modelo2Calculo, formatCurrency } from '../../lib/proposalCalculations.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { PropostaDocumentPreview } from '../../components/propostas/PropostaDocumentPreview.jsx';
import { injectDocumentEditorLayoutCss } from '../../components/documentEditorLayoutCss.js';
import { BackButton } from '../../components/BackButton.jsx';
import '../../print.css';

injectDocumentEditorLayoutCss();

// Id sintético para o contato que vem gravado direto no cadastro do cliente
// (cliente.contato_nome), quando ele não tem um contato próprio em client_contacts.
// Não é uma FK real — na hora de salvar vira null, e o documento usa o contato
// do próprio cliente como fallback.
const INLINE_CONTACT_ID = '__inline__';

const EMPTY = {
  client_id: '', contact_id: '', servico_tipo: 'Pontual',
  titulo: '', descricao: '', escopo: '', qtd_elevadores: '1', data_proposta: new Date().toISOString().slice(0, 10),
  desconto_percentual: '0', tipo_precificacao: 'modelo_fixo',
  modelo1_valor_com_desconto: '', modelo1_entrada_percentual: '50', modelo1_parcelas_restante: '1',
  modelo2_valor_com_desconto_mensal: '', modelo2_entrada_percentual: '0', modelo2_parcelas_restante: '12',
  condicoes_pagamento: '', prazo_execucao: '', data_validade: '', responsavel_user_id: '',
};

export default function PropostaForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [clients, setClients] = React.useState([]);
  const [contacts, setContacts] = React.useState([]);
  const [settings, setSettings] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [form, setForm] = React.useState({
    ...EMPTY,
    client_id: searchParams.get('clienteId') ?? searchParams.get('clientId') ?? '',
  });
  const [opportunityId] = React.useState(searchParams.get('oportunidadeId') ?? '');
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    supabase.from('clients').select('id, nome, razao_social, cpf_cnpj, qtd_elevadores, contato_nome, contato_cargo').is('deleted_at', null).order('nome')
      .then(({ data }) => setClients(data ?? []));
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  // Ao trocar o cliente, carrega os contatos e já seleciona um automaticamente:
  // o contato principal (ou o primeiro) cadastrado; se o cliente não tiver
  // contatos separados, usa o contato principal gravado no próprio cliente.
  React.useEffect(() => {
    if (!form.client_id) { setContacts([]); return; }
    supabase.from('client_contacts').select('id, nome, cargo, principal').eq('client_id', form.client_id).is('deleted_at', null)
      .order('principal', { ascending: false })
      .then(({ data }) => {
        const rows = data ?? [];
        const cliente = clients.find((c) => c.id === form.client_id);
        const opts = [...rows];
        if (cliente?.contato_nome && !rows.some((r) => r.nome === cliente.contato_nome)) {
          opts.push({ id: INLINE_CONTACT_ID, nome: cliente.contato_nome, cargo: cliente.contato_cargo });
        }
        setContacts(opts);
        if (!isEdit) {
          setForm((f) => (opts.some((o) => o.id === f.contact_id) ? f : { ...f, contact_id: opts[0]?.id ?? '' }));
        }
      });
  }, [form.client_id, clients, isEdit]);

  // Herda a quantidade de elevadores do cadastro do cliente — sem isto a
  // proposta saía sempre com "01 elevador", ignorando o que está registrado
  // no condomínio. Só vale para proposta nova; ao editar, respeita o que já
  // foi salvo. Não re-dispara depois, então uma alteração manual permanece.
  React.useEffect(() => {
    if (isEdit || !form.client_id) return;
    const cliente = clients.find((c) => c.id === form.client_id);
    if (cliente?.qtd_elevadores != null) {
      setForm((f) => ({ ...f, qtd_elevadores: String(cliente.qtd_elevadores) }));
    }
  }, [form.client_id, clients, isEdit]);

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('proposals').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data, data_validade: data.data_validade ?? '' });
      setLoading(false);
    });
    supabase.from('proposal_items').select('*').eq('proposal_id', id).order('ordem').then(({ data }) => setItems(data ?? []));
  }, [id, isEdit]);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function addItem() {
    setItems((it) => [...it, { descricao: '', quantidade: 1, valor_unitario: 0, ordem: it.length }]);
  }
  function updateItem(index, field, value) {
    setItems((it) => it.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function removeItem(index) {
    setItems((it) => it.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      client_id: form.client_id || null,
      contact_id: (form.contact_id && form.contact_id !== INLINE_CONTACT_ID) ? form.contact_id : null,
      servico_tipo: form.servico_tipo,
      qtd_elevadores: form.qtd_elevadores ? Number(form.qtd_elevadores) : null,
      data_proposta: form.data_proposta,
      desconto_percentual: Number(form.desconto_percentual) || 0,
      tipo_precificacao: form.tipo_precificacao,
      modelo1_valor_com_desconto: form.modelo1_valor_com_desconto ? Number(form.modelo1_valor_com_desconto) : null,
      modelo1_entrada_percentual: form.modelo1_entrada_percentual ? Number(form.modelo1_entrada_percentual) : null,
      modelo1_parcelas_restante: form.modelo1_parcelas_restante ? Number(form.modelo1_parcelas_restante) : null,
      modelo2_valor_com_desconto_mensal: form.modelo2_valor_com_desconto_mensal ? Number(form.modelo2_valor_com_desconto_mensal) : null,
      modelo2_entrada_percentual: form.modelo2_entrada_percentual ? Number(form.modelo2_entrada_percentual) : null,
      modelo2_parcelas_restante: form.modelo2_parcelas_restante ? Number(form.modelo2_parcelas_restante) : null,
      responsavel_user_id: form.responsavel_user_id || userData.user.id,
    };

    let proposalId = id;
    if (isEdit) {
      const result = await supabase.from('proposals').update(payload).eq('id', id).select().single();
      if (result.error) { setError(result.error.message); setSaving(false); return; }
    } else {
      const result = await supabase.from('proposals').insert({
        ...payload,
        created_by: userData.user.id,
        opportunity_id: opportunityId || null,
        texto_overrides: settings ?? {},
      }).select().single();
      if (result.error) { setError(result.error.message); setSaving(false); return; }
      proposalId = result.data.id;
      if (opportunityId) {
        await supabase.from('activity_log').insert({
          entity_type: 'opportunity', entity_id: opportunityId, activity_type: 'proposal_created',
          title: 'Proposta criada a partir da oportunidade',
        });
      }
    }

    if (form.tipo_precificacao === 'itemizado') {
      await supabase.from('proposal_items').delete().eq('proposal_id', proposalId);
      if (items.length) {
        await supabase.from('proposal_items').insert(items.map((it, i) => ({
          proposal_id: proposalId, descricao: it.descricao, quantidade: it.quantidade, valor_unitario: it.valor_unitario, ordem: i,
        })));
      }
    }

    setSaving(false);
    navigate(`/propostas/${proposalId}`);
  }

  if (loading) return null;

  const m1 = modelo1Calculo({
    valorComDesconto: form.modelo1_valor_com_desconto, descontoPercentual: form.desconto_percentual,
    entradaPercentual: form.modelo1_entrada_percentual, parcelasRestante: form.modelo1_parcelas_restante,
  });
  const m2 = modelo2Calculo({
    valorComDescontoMensal: form.modelo2_valor_com_desconto_mensal, descontoPercentual: form.desconto_percentual,
    entradaPercentual: form.modelo2_entrada_percentual, parcelasRestante: form.modelo2_parcelas_restante,
  });
  const selectedClient = clients.find((c) => c.id === form.client_id);
  const selectedContact = contacts.find((c) => c.id === form.contact_id);

  return (
    <div className="bd-u-flex-col bd-u-gap-3">
      <BackButton to={isEdit ? `/propostas/${id}` : '/propostas'} label={isEdit ? 'Voltar para a proposta' : 'Voltar para Propostas'} />
      <div className="bd-doc-editor">
      <form onSubmit={handleSubmit} className="bd-doc-editor__form">
        <div className="bd-doc-editor__form-scroll bd-u-flex-col bd-u-gap-4">
          <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>Dados do cliente</h3>
          <Select label="Cliente / Empreendimento" required value={form.client_id} onChange={set('client_id')}
            placeholder="Selecione..." options={clients.map((c) => ({ value: c.id, label: c.nome }))} />
          <Select label="Contato" value={form.contact_id} onChange={set('contact_id')} placeholder="Selecione..."
            options={contacts.map((c) => ({ value: c.id, label: c.nome }))} />
          <Input label="Quantidade de elevadores" type="number" min="0" required value={form.qtd_elevadores} onChange={set('qtd_elevadores')} />
          <div className="bd-u-grid-2 bd-u-gap-4">
            <Input label="Data da proposta" type="date" value={form.data_proposta} onChange={set('data_proposta')} />
            <Select label="Tipo de serviço" value={form.servico_tipo} onChange={set('servico_tipo')}
              options={[{ value: 'Pontual', label: 'Pontual' }, { value: 'Anual', label: 'Anual' }]} />
          </div>

          <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Precificação</h3>
          <Select label="Tipo de precificação" value={form.tipo_precificacao} onChange={set('tipo_precificacao')}
            options={[{ value: 'modelo_fixo', label: 'Modelos BDTECH (pontual / anual)' }, { value: 'itemizado', label: 'Itens personalizados' }]} />

          {form.tipo_precificacao === 'modelo_fixo' ? (
            <>
              <Input label="Desconto (%) — vale para os dois modelos" type="number" min="0" max="100" step="0.01"
                value={form.desconto_percentual} onChange={set('desconto_percentual')} />

              <div style={{ background: 'var(--bd-surface-sunken)', borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-4)' }}>
                <strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-text-muted)' }}>Modelo 1 — Pontual</strong>
                <div className="bd-u-flex-col bd-u-gap-3" style={{ marginTop: 'var(--bd-space-3)' }}>
                  <Input label="Valor com desconto (R$)" type="number" step="0.01" value={form.modelo1_valor_com_desconto} onChange={set('modelo1_valor_com_desconto')}
                    hint={m1.valorInicial != null ? `Valor inicial: ${formatCurrency(m1.valorInicial)}` : undefined} />
                  <Input label="Entrada na assinatura (%)" type="number" min="0" max="100" value={form.modelo1_entrada_percentual} onChange={set('modelo1_entrada_percentual')}
                    hint={`Restante: ${m1.restantePercentual}% (${formatCurrency(m1.restanteValor)})`} />
                  <Input label="Número de parcelas do restante" type="number" min="1" value={form.modelo1_parcelas_restante} onChange={set('modelo1_parcelas_restante')}
                    hint={Number(form.modelo1_parcelas_restante) > 1 && m1.valorParcela != null ? `Valor de cada parcela: ${formatCurrency(m1.valorParcela)}` : '1 = pagamento único na entrega do laudo'} />
                </div>
              </div>

              <div style={{ background: 'var(--bd-surface-sunken)', borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-4)' }}>
                <strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-text-muted)' }}>Modelo 2 — Continuado</strong>
                <div className="bd-u-flex-col bd-u-gap-3" style={{ marginTop: 'var(--bd-space-3)' }}>
                  <Input label="Valor total do contrato com desconto (R$)" type="number" step="0.01" value={form.modelo2_valor_com_desconto_mensal} onChange={set('modelo2_valor_com_desconto_mensal')}
                    hint={m2.valorInicialMensal != null ? `Valor inicial: ${formatCurrency(m2.valorInicialMensal)}` : undefined} />
                  <Input label="Entrada no fechamento (%)" type="number" min="0" max="100" value={form.modelo2_entrada_percentual} onChange={set('modelo2_entrada_percentual')} />
                  <Input label="Número de parcelas do restante" type="number" min="1" value={form.modelo2_parcelas_restante} onChange={set('modelo2_parcelas_restante')}
                    hint={m2.valorParcela != null ? `Valor de cada parcela: ${formatCurrency(m2.valorParcela)}` : undefined} />
                </div>
              </div>
            </>
          ) : (
            <div className="bd-u-flex-col bd-u-gap-2">
              {items.map((it, i) => (
                <div key={i} className="bd-u-flex bd-u-gap-2 bd-u-items-center">
                  <Input placeholder="Descrição" value={it.descricao} onChange={(e) => updateItem(i, 'descricao', e.target.value)} style={{ flex: 2 }} />
                  <Input type="number" placeholder="Qtd" value={it.quantidade} onChange={(e) => updateItem(i, 'quantidade', Number(e.target.value))} style={{ width: 70 }} />
                  <Input type="number" placeholder="Valor unit." value={it.valor_unitario} onChange={(e) => updateItem(i, 'valor_unitario', Number(e.target.value))} style={{ width: 100 }} />
                  <IconButton label="Remover" size="sm" onClick={() => removeItem(i)}>×</IconButton>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem} style={{ alignSelf: 'flex-start' }}>Adicionar item</Button>
            </div>
          )}

          {error && <Alert tone="danger">{error}</Alert>}
        </div>
        <div className="bd-doc-editor__form-footer">
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Salvar proposta'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>

      <div className="bd-doc-editor__preview">
        <PropostaDocumentPreview
          proposal={form}
          client={selectedClient}
          contact={selectedContact}
          settings={settings}
        />
      </div>
      </div>
    </div>
  );
}
