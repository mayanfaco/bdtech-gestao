import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { mensagemDeErro } from '../../lib/supabaseErros.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { hojeLocal } from '../../lib/dateUtils.js';
import { situacaoParcela } from '../../lib/recebimentos.js';
import { mesLabel, noMes } from '../../lib/meses.js';
import { SeletorMes, useMesNaUrl } from '../../components/SeletorMes.jsx';
import { ParcelaItem, buscarParcelas, MIGRATION_RECEBIMENTOS } from '../../components/recebimentos/ParcelaItem.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { AvisoPagamento } from '../../components/recebimentos/AvisoPagamento.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';

const FILTROS = [
  { key: 'vencido', label: 'Vencidos', vazio: 'Nenhum pagamento vencido.' },
  { key: 'a_vencer', label: 'A vencer', vazio: 'Nenhum pagamento a vencer.' },
  { key: 'recebido', label: 'Recebidos', vazio: 'Nenhum pagamento recebido ainda.' },
];

function Resumo({ titulo, valor, detalhe, cor }) {
  return (
    <Card>
      <div style={{ fontSize: 14, color: 'var(--bd-text-muted)' }}>{titulo}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: cor ?? 'var(--bd-text-strong)', marginTop: 4 }}>{formatCurrency(valor)}</div>
      <div style={{ fontSize: 14, color: 'var(--bd-text-muted)', marginTop: 2 }}>{detalhe}</div>
    </Card>
  );
}

export default function Recebimentos() {
  const [parcelas, setParcelas] = React.useState(null);
  const [error, setError] = React.useState('');
  const [filtro, setFiltro] = React.useState(null);
  const [cliente, setCliente] = React.useState('');
  const [aviso, setAviso] = React.useState(null);
  const [mes, setMes] = useMesNaUrl();
  const hoje = hojeLocal();

  const load = React.useCallback(() => {
    buscarParcelas((sel) => supabase.from('receivables').select(sel).is('cancelado_em', null).order('vencimento'))
      .then(({ data, error: err }) => {
        if (err) setError(mensagemDeErro(err, MIGRATION_RECEBIMENTOS));
        setParcelas(data ?? []);
      });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (parcelas === null) return null;

  const comSituacao = parcelas.map((p) => ({ parcela: p, situacao: situacaoParcela(p, hoje) }));
  const doCliente = cliente ? comSituacao.filter((x) => x.parcela.client_id === cliente) : comSituacao;
  const pagamentosValidos = (x) => (x.parcela.receivable_payments ?? []).filter((p) => !p.desfeito_em);
  // No mês: em aberto pelo vencimento; recebido se teve pagamento naquele mês.
  const grupo = (status) => doCliente.filter((x) => x.situacao.status === status && (status === 'recebido'
    ? pagamentosValidos(x).some((p) => noMes(p.data_pagamento, mes))
    : noMes(x.parcela.vencimento, mes)));
  const soma = (lista, campo) => lista.reduce((s, x) => s + x.situacao[campo], 0);

  const vencidos = grupo('vencido');
  const aVencer = grupo('a_vencer');
  const recebidos = grupo('recebido')
    .sort((a, b) => (b.situacao.ultimoPagamento ?? '').localeCompare(a.situacao.ultimoPagamento ?? ''));
  const recebidoNoMes = doCliente.flatMap(pagamentosValidos)
    .filter((p) => noMes(p.data_pagamento, mes))
    .reduce((s, p) => s + Number(p.valor), 0);
  // Atrasados de meses anteriores não podem sumir de vista ao escolher um mês.
  const vencidosAntes = mes ? doCliente.filter((x) => x.situacao.status === 'vencido' && x.parcela.vencimento < `${mes}-01`) : [];
  const periodo = mes ? mesLabel(mes, { minusculo: true }) : 'todos os meses';

  const listas = { vencido: vencidos, a_vencer: aVencer, recebido: recebidos };
  // Abre no primeiro grupo que tem algo: vencidos, depois a vencer, depois recebidos.
  const ativo = filtro ?? (['vencido', 'a_vencer', 'recebido'].find((k) => listas[k].length) ?? 'a_vencer');
  const lista = listas[ativo];

  const clientes = [...new Map(parcelas.filter((p) => p.client_id).map((p) => [p.client_id, p.clients?.nome ?? '—'])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      {error && <Alert tone="danger">{error}</Alert>}
      <AvisoPagamento aviso={aviso} onFechar={() => setAviso(null)} />

      {!error && parcelas.length === 0 ? (
        <EmptyState title="Nenhuma parcela cadastrada ainda"
          text="Abra um contrato e clique em “Gerar parcelas deste contrato”. A entrada e as parcelas aparecem aqui, com os vencimentos." />
      ) : !error && (
        <>
          <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4" style={{ flexWrap: 'wrap' }}>
            <SeletorMes mes={mes} onChange={setMes} />
            <div style={{ minWidth: 240 }}>
              <Select value={cliente} onChange={(e) => setCliente(e.target.value)}
                options={[{ value: '', label: 'Todos os clientes' }, ...clientes.map(([value, label]) => ({ value, label }))]} />
            </div>
          </div>

          {vencidosAntes.length > 0 && (
            <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <Alert tone="warning">
                  Há {vencidosAntes.length} {vencidosAntes.length === 1 ? 'parcela vencida' : 'parcelas vencidas'} de meses anteriores,
                  somando {formatCurrency(soma(vencidosAntes, 'saldo'))}.
                </Alert>
              </div>
              <Button variant="outline" onClick={() => { setMes(''); setFiltro('vencido'); }}>Ver todos os vencidos</Button>
            </div>
          )}

          <div className="bd-u-grid-3 bd-u-gap-4">
            <Resumo titulo="Vencido" valor={soma(vencidos, 'saldo')} cor={vencidos.length ? 'var(--bd-danger-500)' : undefined}
              detalhe={`${vencidos.length} ${vencidos.length === 1 ? 'parcela' : 'parcelas'} · ${periodo}`} />
            <Resumo titulo="A receber" valor={soma(aVencer, 'saldo')} detalhe={`${aVencer.length} ${aVencer.length === 1 ? 'parcela' : 'parcelas'} · ${periodo}`} />
            <Resumo titulo="Recebido" valor={recebidoNoMes} detalhe={`pagamentos registrados · ${periodo}`} />
          </div>

          <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4" style={{ flexWrap: 'wrap' }}>
            <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
              {FILTROS.map((f) => (
                <Button key={f.key} variant={ativo === f.key ? 'primary' : 'outline'} onClick={() => setFiltro(f.key)} aria-pressed={ativo === f.key}>
                  {f.label} ({listas[f.key].length})
                </Button>
              ))}
            </div>
          </div>

          {lista.length === 0 ? (
            <EmptyState title={`${FILTROS.find((f) => f.key === ativo).vazio.replace('.', '')} em ${periodo}.`} />
          ) : ativo === 'vencido' ? (
            <div className="bd-u-flex-col bd-u-gap-3">
              {lista.map(({ parcela }) => (
                <ParcelaItem key={parcela.id} parcela={parcela} hoje={hoje} onChanged={load} onAviso={setAviso} />
              ))}
            </div>
          ) : (
            <Card>
              <div style={{ marginTop: 'calc(-1 * var(--bd-space-4))', marginBottom: 'calc(-1 * var(--bd-space-4))' }}>
                {lista.map(({ parcela, situacao }) => (
                  // Botões aparecem direto só no que vence nos próximos 7 dias.
                  <ParcelaItem key={parcela.id} parcela={parcela} hoje={hoje} onChanged={load} onAviso={setAviso} compacto
                    destaque={ativo === 'a_vencer' && situacao.dias <= 7} />
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
