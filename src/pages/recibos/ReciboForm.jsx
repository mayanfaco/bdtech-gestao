import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { mensagemDeErro } from '../../lib/supabaseErros.js';
import { dataCurta, hojeLocal } from '../../lib/dateUtils.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { reciboCalculo } from '../../lib/reciboCalculations.js';
import { contratoNumeroLabel, dadosReciboDoPagamento } from '../../lib/recebimentos.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { ReciboDocument } from '../../components/recibos/ReciboDocument.jsx';
import { injectDocumentEditorLayoutCss } from '../../components/documentEditorLayoutCss.js';
import { BackButton } from '../../components/BackButton.jsx';
import '../../print.css';

injectDocumentEditorLayoutCss();

const MIGRATION = { migration: '0014_recibo_do_pagamento.sql' };

/** Carrega tudo o que o recibo de um pagamento precisa e devolve os campos prontos. */
async function carregarDoPagamento(pagamentoId) {
  const { data: pagamento, error } = await supabase.from('receivable_payments')
    .select('*, receivables(*, contracts(*), clients(nome, cpf_cnpj, cnpj))').eq('id', pagamentoId).single();
  if (error) return { error };
  const parcela = pagamento.receivables;
  const { data: parcelasDoContrato, error: err2 } = await supabase.from('receivables')
    .select('*, receivable_payments(*)').eq('contract_id', parcela.contract_id);
  if (err2) return { error: err2 };
  const dados = dadosReciboDoPagamento({
    pagamento, parcela, parcelasDoContrato, contrato: parcela.contracts, cliente: parcela.clients,
  });
  return { dados, contrato: parcela.contracts };
}

export default function ReciboForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const clienteDaUrl = searchParams.get('clienteId') ?? '';
  const pagamentoId = searchParams.get('pagamentoId') ?? '';
  const [clients, setClients] = React.useState([]);
  const [settings, setSettings] = React.useState(null);
  const [contrato, setContrato] = React.useState(null);
  const [form, setForm] = React.useState(() => ({
    client_id: clienteDaUrl, pagador_nome: '', pagador_documento: '',
    data_recibo: hojeLocal(), data_inicio_servicos: hojeLocal(),
    valor_total: '', valor_recebido: '', parcelas_restantes: '',
  }));
  const [loading, setLoading] = React.useState(isEdit || Boolean(pagamentoId));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  // Depois de salvar, a tela mostra a confirmação (a URL ganha ?salvo=1).
  const acabouDeSalvar = searchParams.get('salvo') === '1';

  function selecionarCliente(clienteId, lista) {
    const cliente = lista.find((c) => c.id === clienteId);
    setForm((f) => ({
      ...f,
      client_id: clienteId,
      pagador_nome: cliente?.nome ?? '',
      pagador_documento: cliente?.cpf_cnpj || cliente?.cnpj || '',
    }));
  }

  React.useEffect(() => {
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
    supabase.from('clients').select('id, nome, cpf_cnpj, cnpj').is('deleted_at', null).order('nome')
      .then(({ data }) => {
        setClients(data ?? []);
        if (!isEdit && !pagamentoId && clienteDaUrl) selecionarCliente(clienteDaUrl, data ?? []);
      });
  }, [isEdit, clienteDaUrl, pagamentoId]);

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('receipts').select('*').eq('id', id).single().then(({ data, error: err }) => {
      if (err) setError(mensagemDeErro(err, MIGRATION));
      if (data) setForm({ ...data, pagador_documento: data.pagador_documento ?? '', parcelas_restantes: data.parcelas_restantes ?? '' });
      setLoading(false);
    });
  }, [id, isEdit]);

  // Recibo a partir de um pagamento: se ele já tem recibo, abre o existente.
  React.useEffect(() => {
    if (isEdit || !pagamentoId) return;
    (async () => {
      const { data: existente } = await supabase.from('receipts').select('id')
        .eq('payment_id', pagamentoId).is('deleted_at', null).maybeSingle();
      if (existente) { navigate(`/recibos/${existente.id}/editar`, { replace: true }); return; }
      const r = await carregarDoPagamento(pagamentoId);
      if (r.error) setError(mensagemDeErro(r.error, MIGRATION));
      else { setForm(r.dados); setContrato(r.contrato); }
      setLoading(false);
    })();
  }, [isEdit, pagamentoId, navigate]);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  const doPagamento = Boolean(form.payment_id);
  const calculo = reciboCalculo({
    valorTotal: form.valor_total, valorRecebido: form.valor_recebido, parcelasRestantes: form.parcelas_restantes,
  });

  // Validação própria, com a lista do que falta. A validação do navegador
  // mostrava só um balãozinho que some rápido, e o recibo ficava sem salvar.
  function faltando() {
    const lista = [];
    if (!form.client_id) lista.push('Escolha o cliente.');
    if (!form.data_recibo) lista.push('Preencha a data do recibo.');
    if (!form.data_inicio_servicos) lista.push('Preencha a data de início dos serviços.');
    if (!doPagamento) {
      if (!(Number(form.valor_total) > 0)) lista.push('Preencha o valor total (ex.: 1800 ou 1800.50).');
      if (!(Number(form.valor_recebido) > 0)) lista.push('Preencha o valor recebido (ex.: 300 ou 300.50).');
      if (calculo.saldo < 0) lista.push('O valor recebido não pode ser maior que o valor total do contrato.');
    }
    return lista;
  }

  async function handleSubmit(e, { imprimir = false } = {}) {
    e?.preventDefault();
    const lista = faltando();
    if (lista.length) { setError(`O recibo ainda NÃO foi salvo. Falta: ${lista.join(' ')}`); return; }
    setSaving(true);
    setError('');
    const payload = {
      client_id: form.client_id,
      pagador_nome: form.pagador_nome,
      pagador_documento: form.pagador_documento || null,
      data_recibo: form.data_recibo,
      data_inicio_servicos: form.data_inicio_servicos,
      valor_total: Number(form.valor_total),
      valor_recebido: Number(form.valor_recebido),
      parcelas_restantes: form.parcelas_restantes ? Number(form.parcelas_restantes) : null,
    };
    // Os campos novos só vão no recibo de pagamento, para o recibo avulso
    // continuar salvando mesmo que a migration 0014 ainda não tenha rodado.
    if (doPagamento) Object.assign(payload, { payment_id: form.payment_id, referente: form.referente, saldo_restante: form.saldo_restante });

    const result = isEdit
      ? await supabase.from('receipts').update(payload).eq('id', id).select().single()
      : await supabase.from('receipts').insert(payload).select().single();

    setSaving(false);
    if (result.error) {
      setError(result.error.code === '23505' ? 'Este pagamento já tem um recibo. Procure em Recibos.' : mensagemDeErro(result.error, MIGRATION));
      return;
    }
    navigate(imprimir ? `/recibos/${result.data.id}/pdf` : `/recibos/${result.data.id}/editar?salvo=1`, { replace: true });
  }

  if (loading) return null;

  const semDocumento = form.client_id && !form.pagador_documento;

  return (
    <div className="bd-u-flex-col bd-u-gap-3">
      <BackButton to={doPagamento ? '/recebimentos' : '/recibos'} label={doPagamento ? 'Voltar para Recebimentos' : 'Voltar para Recibos'} />
      <div className="bd-doc-editor">
        <form onSubmit={handleSubmit} noValidate className="bd-doc-editor__form">
          <div className="bd-doc-editor__form-scroll bd-u-flex-col bd-u-gap-4">
            {doPagamento ? (
              <>
                <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>Recibo do pagamento</h3>
                <Card>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{form.pagador_nome || '—'}</div>
                  <div style={{ marginTop: 4 }}>
                    {formatCurrency(Number(form.valor_recebido))} recebidos, referente à {form.referente}
                    {contrato ? ` do contrato ${contratoNumeroLabel(contrato)}` : ''}.
                  </div>
                  <div style={{ marginTop: 4, color: 'var(--bd-text-muted)', fontSize: 14 }}>
                    Saldo do contrato depois deste pagamento: {formatCurrency(Number(form.saldo_restante) || 0)}
                  </div>
                </Card>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--bd-text-muted)' }}>
                  Os valores vêm do pagamento registrado. Para mudar um valor, corrija o pagamento em Recebimentos.
                </p>
                {semDocumento && <Alert tone="warning">Este cliente está sem CNPJ no cadastro. Complete o cadastro antes de emitir.</Alert>}

                <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Datas</h3>
                <div className="bd-u-grid-2 bd-u-gap-4">
                  <Input label="Data do recibo" type="date" required value={form.data_recibo} onChange={set('data_recibo')}
                    hint={`Pagamento em ${dataCurta(form.data_recibo)}`} />
                  <Input label="Início dos serviços" type="date" required value={form.data_inicio_servicos} onChange={set('data_inicio_servicos')} />
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>Cliente</h3>
                <Select label="Cliente" required value={form.client_id} onChange={(e) => selecionarCliente(e.target.value, clients)}
                  placeholder="Selecione..." options={clients.map((c) => ({ value: c.id, label: c.nome }))}
                  hint={semDocumento ? 'Este cliente está sem CNPJ no cadastro. Complete o cadastro antes de emitir.' : undefined} />

                <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Datas</h3>
                <div className="bd-u-grid-2 bd-u-gap-4">
                  <Input label="Data do recibo" type="date" required value={form.data_recibo} onChange={set('data_recibo')} />
                  <Input label="Início dos serviços" type="date" required value={form.data_inicio_servicos} onChange={set('data_inicio_servicos')} />
                </div>

                <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16, marginTop: 'var(--bd-space-4)' }}>Valores</h3>
                <div className="bd-u-grid-2 bd-u-gap-4">
                  <Input label="Valor total (R$)" type="number" step="0.01" min="0.01" required value={form.valor_total} onChange={set('valor_total')} />
                  <Input label="Valor recebido (R$)" type="number" step="0.01" min="0.01" required value={form.valor_recebido} onChange={set('valor_recebido')} />
                </div>
                <Input label="Parcelas restantes" type="number" min="1" step="1" value={form.parcelas_restantes} onChange={set('parcelas_restantes')}
                  hint={calculo.valorParcela != null ? `Valor de cada parcela: ${formatCurrency(calculo.valorParcela)}` : 'Ex.: 11 = saldo dividido em 11 parcelas'} />
              </>
            )}

            {error && <Alert tone="danger">{error}</Alert>}
          </div>
          <div className="bd-doc-editor__form-footer">
            <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Salvar recibo'}</Button>
            {isEdit
              ? <Button variant="outline" as={Link} to={`/recibos/${id}/pdf`}>Imprimir / PDF</Button>
              : <Button type="button" variant="outline" disabled={saving} onClick={() => handleSubmit(null, { imprimir: true })}>Salvar e imprimir</Button>}
          </div>
        </form>

        <div className="bd-doc-editor__preview">
          {!isEdit && (
            <div style={{ background: '#FFF4D6', border: '1px solid #F5C84C', color: '#7A4B00', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontWeight: 600 }}>
              Rascunho: este recibo ainda NÃO está salvo. Clique em "Salvar recibo" para ele ficar no histórico.
            </div>
          )}
          {isEdit && acabouDeSalvar && (
            <div className="no-print" style={{ marginBottom: 12 }}>
              <Alert tone="success">Recibo salvo! Ele já aparece em Recibos e no histórico do cliente.</Alert>
            </div>
          )}
          <ReciboDocument recibo={form} settings={settings} />
        </div>
      </div>
    </div>
  );
}
