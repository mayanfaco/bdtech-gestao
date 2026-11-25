import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { mensagemDeErro } from '../../lib/supabaseErros.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { dataCurta, hojeLocal } from '../../lib/dateUtils.js';
import {
  contratoNumeroLabel, linkWhatsapp, mensagemCobranca, parcelaLabel, prazoTexto, situacaoParcela,
} from '../../lib/recebimentos.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';

/** Campos que toda tela que mostra parcelas precisa buscar. */
const PARCELA_SELECT_BASE = '*, contracts(numero, data_inicio), '
  + 'clients(nome, contato_nome, sindico_nome, whatsapp, contato_telefone), '
  + 'collection_contacts(id, canal, observacao, created_at)';
const PARCELA_SELECT = `${PARCELA_SELECT_BASE}, receivable_payments(*, receipts(id, deleted_at))`;

/**
 * Busca parcelas. `montar(select)` recebe o texto do select e devolve a
 * consulta. Se a migration 0014 ainda não rodou (sem o vínculo com recibos),
 * busca sem os recibos — a tela continua funcionando, só sem "Gerar recibo".
 */
export async function buscarParcelas(montar) {
  const r = await montar(PARCELA_SELECT);
  if (r.error && ['PGRST200', 'PGRST100'].includes(r.error.code)) return montar(`${PARCELA_SELECT_BASE}, receivable_payments(*)`);
  return r;
}

export const MIGRATION_RECEBIMENTOS = { migration: '0013_recebimentos.sql e 0014_recibo_do_pagamento.sql' };

const STATUS = {
  vencido: { label: 'Vencida', tone: 'danger' },
  a_vencer: { label: 'A vencer', tone: 'neutral' },
  recebido: { label: 'Recebida', tone: 'success' },
  cancelado: { label: 'Cancelada', tone: 'neutral' },
};

const FORMAS = [
  { value: 'pix', label: 'Pix' }, { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' }, { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' }, { value: 'outro', label: 'Outro' },
];
const FORMA_LABEL = Object.fromEntries(FORMAS.map((f) => [f.value, f.label]));

// Chave Pix e modelo da mensagem: buscados uma vez, só quando alguém vai cobrar.
let settingsPromise = null;
function carregarConfigCobranca() {
  settingsPromise ??= supabase.from('company_settings').select('chave_pix, mensagem_cobranca').maybeSingle()
    .then(({ data }) => data ?? {});
  return settingsPromise;
}

function reciboDoPagamento(pagamento) {
  return (pagamento.receipts ?? []).find((r) => !r.deleted_at) ?? null;
}

function servicoTexto(parcela) {
  const nome = parcela.numero === 0 ? 'entrada' : `parcela ${parcela.numero}/${parcela.total_parcelas}`;
  return `${nome} do contrato ${contratoNumeroLabel(parcela.contracts)}`;
}

function PainelPagar({ parcela, situacao, onDone, onCancel }) {
  const [valor, setValor] = React.useState(String(situacao.saldo));
  const [data, setData] = React.useState(hojeLocal());
  const [forma, setForma] = React.useState('pix');
  const [observacao, setObservacao] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  async function confirmar(e) {
    e.preventDefault();
    const v = Number(valor);
    if (!(v > 0)) { setError('Informe o valor recebido.'); return; }
    if (Math.round(v * 100) > Math.round(situacao.saldo * 100)) {
      setError(`O valor passa do que falta receber nesta parcela (${formatCurrency(situacao.saldo)}).`);
      return;
    }
    setSaving(true);
    const { data: criado, error: err } = await supabase.from('receivable_payments').insert({
      receivable_id: parcela.id, valor: v, data_pagamento: data, forma, observacao: observacao || null,
    }).select('id').single();
    setSaving(false);
    if (err) { setError(mensagemDeErro(err, MIGRATION_RECEBIMENTOS)); return; }
    onDone(Math.round(v * 100) < Math.round(situacao.saldo * 100)
      ? `Pagamento parcial registrado. Ainda faltam ${formatCurrency(situacao.saldo - v)}.`
      : 'Pagamento registrado. A parcela está quitada.', criado?.id);
  }

  return (
    <form onSubmit={confirmar} className="bd-u-flex-col bd-u-gap-4">
      <div className="bd-u-grid-2 bd-u-gap-4">
        <Input label="Valor recebido (R$)" type="number" step="0.01" min="0.01" required value={valor} onChange={(e) => setValor(e.target.value)}
          hint={situacao.parcial ? `Já recebido: ${formatCurrency(situacao.pago)}` : undefined} />
        <Input label="Data do pagamento" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
      </div>
      <div className="bd-u-grid-2 bd-u-gap-4">
        <Select label="Forma de pagamento" value={forma} onChange={(e) => setForma(e.target.value)} options={FORMAS} />
        <Input label="Observação (opcional)" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="bd-u-flex bd-u-gap-3">
        <Button type="submit" loading={saving}>Confirmar pagamento</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Voltar</Button>
      </div>
    </form>
  );
}

function PainelCobrar({ parcela, situacao, onDone, onCancel }) {
  const [texto, setTexto] = React.useState('');
  const [copiado, setCopiado] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const cliente = parcela.clients ?? {};
  const telefone = cliente.whatsapp || cliente.contato_telefone;

  React.useEffect(() => {
    carregarConfigCobranca().then((cfg) => setTexto(mensagemCobranca(cfg.mensagem_cobranca, {
      contato: cliente.contato_nome || cliente.sindico_nome,
      servico: servicoTexto(parcela),
      valor: situacao.saldo,
      vencimento: parcela.vencimento,
      pix: cfg.chave_pix || 'bdtechelevadores@gmail.com',
    })));
  }, [parcela, situacao.saldo, cliente.contato_nome, cliente.sindico_nome]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o texto e copie com Ctrl+C.');
    }
  }

  async function jaCobrei() {
    setSaving(true);
    const { error: err } = await supabase.from('collection_contacts').insert({ receivable_id: parcela.id, canal: 'whatsapp' });
    setSaving(false);
    if (err) { setError(mensagemDeErro(err, MIGRATION_RECEBIMENTOS)); return; }
    onDone('Cobrança registrada no histórico do cliente.');
  }

  return (
    <div className="bd-u-flex-col bd-u-gap-4">
      <Textarea label="Mensagem de cobrança" rows={6} value={texto} onChange={(e) => { setTexto(e.target.value); setCopiado(false); }}
        hint={telefone ? `WhatsApp do cadastro: ${telefone}` : 'Este cliente não tem WhatsApp no cadastro. Ao abrir o WhatsApp, escolha o contato.'} />
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        <Button type="button" variant="outline" onClick={copiar}>{copiado ? 'Mensagem copiada' : 'Copiar mensagem'}</Button>
        <Button variant="outline" as="a" href={linkWhatsapp(telefone, texto)} target="_blank" rel="noreferrer">Abrir WhatsApp</Button>
        <Button type="button" onClick={jaCobrei} loading={saving}>Já cobrei</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Voltar</Button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--bd-text-muted)', margin: 0 }}>
        A mensagem não é enviada sozinha. Depois de mandar, clique em “Já cobrei” para guardar a data da cobrança.
      </p>
    </div>
  );
}

function PainelAlterar({ parcela, situacao, onDone, onCancel }) {
  const [vencimento, setVencimento] = React.useState(parcela.vencimento);
  const [valor, setValor] = React.useState(String(parcela.valor));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  async function salvar(e) {
    e.preventDefault();
    const v = Number(valor);
    if (!(v > 0)) { setError('Informe o valor da parcela.'); return; }
    if (Math.round(v * 100) < Math.round(situacao.pago * 100)) {
      setError(`O valor não pode ficar abaixo do que já foi recebido (${formatCurrency(situacao.pago)}).`);
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from('receivables').update({ vencimento, valor: v }).eq('id', parcela.id);
    setSaving(false);
    if (err) { setError(mensagemDeErro(err, MIGRATION_RECEBIMENTOS)); return; }
    onDone('Parcela alterada. A mudança ficou registrada no histórico.');
  }

  async function cancelarParcela() {
    const motivo = window.prompt('Cancelar esta parcela? Ela deixa de ser cobrada.\n\nMotivo (opcional):');
    if (motivo === null) return;
    setSaving(true);
    const { error: err } = await supabase.from('receivables')
      .update({ cancelado_em: new Date().toISOString(), cancelado_motivo: motivo || null }).eq('id', parcela.id);
    setSaving(false);
    if (err) { setError(mensagemDeErro(err, MIGRATION_RECEBIMENTOS)); return; }
    onDone('Parcela cancelada.');
  }

  return (
    <form onSubmit={salvar} className="bd-u-flex-col bd-u-gap-4">
      <div className="bd-u-grid-2 bd-u-gap-4">
        <Input label="Vencimento" type="date" required value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        <Input label="Valor da parcela (R$)" type="number" step="0.01" min="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} />
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        <Button type="submit" loading={saving}>Salvar alteração</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Voltar</Button>
        {situacao.pago === 0 && (
          <Button type="button" variant="ghost" onClick={cancelarParcela} style={{ color: 'var(--bd-danger-500)', marginLeft: 'auto' }}>Cancelar parcela</Button>
        )}
      </div>
    </form>
  );
}

/**
 * Uma parcela com as ações do dia a dia: cobrar, registrar pagamento e
 * alterar. Usada em Recebimentos, na ficha do contrato e na do cliente.
 *
 * `compacto` vira uma linha (para listas longas, dentro de um Card do pai) e
 * só mostra os botões quando `destaque` (a próxima parcela a cobrar) ou quando
 * a pessoa clica em "Opções" — evita uma parede de botões iguais.
 */
export function ParcelaItem({ parcela, hoje, mostrarCliente = true, mostrarContrato = true, compacto = false, destaque = false, onChanged, onAviso }) {
  const [painel, setPainel] = React.useState(null);
  const [expandido, setExpandido] = React.useState(false);
  const [aviso, setAviso] = React.useState('');
  const [reciboDe, setReciboDe] = React.useState(null);
  const [erro, setErro] = React.useState('');
  const situacao = situacaoParcela(parcela, hoje);
  const status = STATUS[situacao.status];
  const pagamentos = (parcela.receivable_payments ?? []).filter((p) => !p.desfeito_em)
    .sort((a, b) => a.data_pagamento.localeCompare(b.data_pagamento));
  const ultimaCobranca = (parcela.collection_contacts ?? []).map((c) => c.created_at).sort().at(-1);
  const emAberto = situacao.status === 'vencido' || situacao.status === 'a_vencer';
  const aberto = !compacto || destaque || expandido || Boolean(painel);

  // Com `onAviso`, a página mostra o aviso no topo (a parcela pode sair da lista).
  function concluir(mensagem, pagamentoId = null) {
    setPainel(null);
    if (onAviso) onAviso({ mensagem, pagamentoId });
    else { setAviso(mensagem); setReciboDe(pagamentoId); }
    onChanged?.();
  }

  async function desfazer(pagamento) {
    const avisoRecibo = reciboDoPagamento(pagamento) ? '\n\nEste pagamento tem recibo emitido. O recibo não é apagado; se precisar, exclua-o em Recibos.' : '';
    const motivo = window.prompt(`Desfazer o pagamento de ${formatCurrency(Number(pagamento.valor))}? A parcela volta a ficar em aberto.${avisoRecibo}\n\nMotivo (opcional):`);
    if (motivo === null) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('receivable_payments').update({
      desfeito_em: new Date().toISOString(), desfeito_motivo: motivo || null, desfeito_por: userData?.user?.id ?? null,
    }).eq('id', pagamento.id);
    if (error) { setErro(mensagemDeErro(error, MIGRATION_RECEBIMENTOS)); return; }
    concluir('Pagamento desfeito. A parcela voltou a ficar em aberto.');
  }

  const voltar = () => setPainel(null);
  const abrir = (qual) => { setAviso(''); setReciboDe(null); setErro(''); setPainel(qual); };

  const conteudo = (
    <>
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4" style={{ flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          {mostrarCliente && (
            <div style={{ fontWeight: 700, color: 'var(--bd-text-strong)', fontSize: 16 }}>{parcela.clients?.nome ?? 'Sem cliente'}</div>
          )}
          <div style={{ fontSize: mostrarCliente ? 14 : 16, color: mostrarCliente ? 'var(--bd-text-muted)' : 'var(--bd-text-strong)', fontWeight: mostrarCliente ? 400 : 700 }}>
            {parcelaLabel(parcela)}
            {mostrarContrato && <> · <Link to={`/contratos/${parcela.contract_id}`}>{contratoNumeroLabel(parcela.contracts)}</Link></>}
          </div>
          <div style={{ fontSize: 14, color: situacao.status === 'vencido' ? 'var(--bd-danger-500)' : 'var(--bd-text-muted)', marginTop: 2 }}>
            {prazoTexto(situacao, parcela.vencimento)}
            {emAberto && ultimaCobranca && ` · Cobrado em ${new Date(ultimaCobranca).toLocaleDateString('pt-BR')}`}
          </div>
        </div>
        <div className="bd-u-flex bd-u-items-center bd-u-gap-4">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--bd-text-strong)' }}>
              {formatCurrency(emAberto ? situacao.saldo : Number(parcela.valor))}
            </div>
            {situacao.parcial && emAberto && (
              <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>falta, de {formatCurrency(Number(parcela.valor))}</div>
            )}
            <Badge tone={situacao.parcial && emAberto ? 'warning' : status.tone} style={{ marginTop: 4 }}>
              {situacao.parcial && emAberto ? 'Paga em parte' : status.label}
            </Badge>
          </div>
          {compacto && !destaque && !painel && (emAberto || pagamentos.length > 0) && (
            <Button size="sm" variant="ghost" onClick={() => setExpandido((v) => !v)} aria-expanded={expandido}>
              {expandido ? 'Fechar' : 'Opções'}
            </Button>
          )}
        </div>
      </div>

      {aberto && !painel && emAberto && (
        <div className="bd-u-flex bd-u-gap-3" style={{ marginTop: 'var(--bd-space-4)', flexWrap: 'wrap' }}>
          <Button size="sm" onClick={() => abrir('pagar')}>Registrar pagamento</Button>
          <Button size="sm" variant="outline" onClick={() => abrir('cobrar')}>Cobrar</Button>
          <Button size="sm" variant="ghost" onClick={() => abrir('alterar')}>Alterar vencimento ou valor</Button>
        </div>
      )}

      {painel && (
        <div style={{ marginTop: 'var(--bd-space-4)', paddingTop: 'var(--bd-space-4)', borderTop: '1px solid var(--bd-border-subtle)' }}>
          {painel === 'pagar' && <PainelPagar parcela={parcela} situacao={situacao} onDone={concluir} onCancel={voltar} />}
          {painel === 'cobrar' && <PainelCobrar parcela={parcela} situacao={situacao} onDone={concluir} onCancel={voltar} />}
          {painel === 'alterar' && <PainelAlterar parcela={parcela} situacao={situacao} onDone={concluir} onCancel={voltar} />}
        </div>
      )}

      {aberto && pagamentos.length > 0 && !painel && (
        <div style={{ marginTop: 'var(--bd-space-4)', fontSize: 14, color: 'var(--bd-text-body)' }}>
          {pagamentos.map((p) => (
            <div key={p.id} className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-3" style={{ padding: '6px 0', borderTop: '1px solid var(--bd-border-subtle)' }}>
              <span>
                Recebido {formatCurrency(Number(p.valor))} em {dataCurta(p.data_pagamento)} · {FORMA_LABEL[p.forma] ?? p.forma}
                {p.observacao ? ` · ${p.observacao}` : ''}
              </span>
              <span className="bd-u-flex bd-u-gap-2">
                {!p.receipts ? null : reciboDoPagamento(p)
                  ? <Button size="sm" variant="outline" as={Link} to={`/recibos/${reciboDoPagamento(p).id}/editar`}>Ver recibo</Button>
                  : <Button size="sm" variant="outline" as={Link} to={`/recibos/novo?pagamentoId=${p.id}`}>Gerar recibo</Button>}
                <Button size="sm" variant="ghost" onClick={() => desfazer(p)}>Desfazer pagamento</Button>
              </span>
            </div>
          ))}
        </div>
      )}

      {aviso && (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ marginTop: 'var(--bd-space-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}><Alert tone="success">{aviso}</Alert></div>
          {reciboDe && <Button as={Link} to={`/recibos/novo?pagamentoId=${reciboDe}`}>Gerar recibo</Button>}
        </div>
      )}
      {erro && <div style={{ marginTop: 'var(--bd-space-4)' }}><Alert tone="danger">{erro}</Alert></div>}
    </>
  );

  const apagada = situacao.status === 'cancelado' ? { opacity: 0.6 } : {};
  if (compacto) {
    return (
      <div style={{ padding: 'var(--bd-space-4) 0', borderBottom: '1px solid var(--bd-border-subtle)', ...apagada }}>
        {conteudo}
      </div>
    );
  }
  return <Card style={apagada}>{conteudo}</Card>;
}
