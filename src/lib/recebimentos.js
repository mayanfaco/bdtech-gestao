import { formatCurrency } from './proposalCalculations.js';
import { dataCurta } from './dateUtils.js';

export function contratoNumeroLabel(contrato) {
  if (!contrato) return '';
  const ano = contrato.data_inicio ? String(contrato.data_inicio).slice(0, 4) : '';
  return `CONT-${ano}-${String(contrato.numero ?? '').padStart(4, '0')}`;
}

export function parcelaLabel(parcela) {
  return parcela.numero === 0 ? 'Entrada' : `Parcela ${parcela.numero}/${parcela.total_parcelas}`;
}

/** Soma meses mantendo o dia; em mês sem esse dia (ex.: 31), usa o último dia. */
export function addMeses(iso, meses) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(dia, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}

/**
 * Parcelas que um contrato gera: entrada (numero 0) + parcelas restantes
 * (1..N), uma por mês a partir do 1º vencimento. O restante é dividido em
 * centavos; a última parcela absorve a sobra, para a soma bater com o total.
 */
export function planoDeParcelas(contrato) {
  const total = Math.round((Number(contrato.valor_total) || 0) * 100);
  const entrada = Math.round((Number(contrato.parcela1_valor) || 0) * 100);
  const n = Number(contrato.parcelas_mensais_quantidade) || 0;
  const restante = total - entrada;
  const faltando = [];

  if (total <= 0) faltando.push('o valor total');
  if (entrada > 0 && !contrato.parcela1_data) faltando.push('o vencimento da entrada');
  if (restante > 0 && n < 1) faltando.push('o número de parcelas restantes');
  if (restante > 0 && !contrato.parcelas_mensais_inicio) faltando.push('o 1º vencimento das parcelas');
  if (faltando.length) return { parcelas: [], erro: `Falta preencher no contrato: ${faltando.join(', ')}.` };
  if (restante < 0) return { parcelas: [], erro: 'A entrada é maior que o valor total do contrato.' };

  const totalParcelas = restante > 0 ? n : 0;
  const parcelas = [];
  if (entrada > 0) {
    parcelas.push({ numero: 0, total_parcelas: totalParcelas, valor: entrada / 100, vencimento: contrato.parcela1_data });
  }
  if (restante > 0) {
    const base = Math.floor(restante / n);
    for (let k = 1; k <= n; k += 1) {
      const centavos = k === n ? restante - base * (n - 1) : base;
      parcelas.push({
        numero: k, total_parcelas: n, valor: centavos / 100,
        vencimento: addMeses(contrato.parcelas_mensais_inicio, k - 1),
      });
    }
  }
  return { parcelas, erro: null };
}

function diasEntre(deIso, ateIso) {
  return Math.round((Date.parse(`${ateIso}T00:00:00Z`) - Date.parse(`${deIso}T00:00:00Z`)) / 86400000);
}

/** Situação de uma parcela a partir dos pagamentos não desfeitos. */
export function situacaoParcela(parcela, hoje) {
  const pagamentos = (parcela.receivable_payments ?? []).filter((p) => !p.desfeito_em);
  const pagoC = pagamentos.reduce((s, p) => s + Math.round(Number(p.valor) * 100), 0);
  const saldoC = Math.round(Number(parcela.valor) * 100) - pagoC;
  const pago = pagoC / 100;
  const saldo = saldoC / 100;
  const dias = diasEntre(hoje, parcela.vencimento);
  const ultimoPagamento = pagamentos.map((p) => p.data_pagamento).sort().at(-1) ?? null;

  let status;
  if (parcela.cancelado_em) status = 'cancelado';
  else if (saldoC <= 0) status = 'recebido';
  else if (dias < 0) status = 'vencido';
  else status = 'a_vencer';

  return { status, pago, saldo, parcial: pagoC > 0 && saldoC > 0, dias, ultimoPagamento };
}

/** Texto do prazo, sem depender de cor: "Venceu há 3 dias", "Vence hoje"... */
export function prazoTexto(situacao, vencimento) {
  const { status, dias, ultimoPagamento } = situacao;
  if (status === 'cancelado') return 'Cancelada';
  if (status === 'recebido') return `Recebido em ${dataCurta(ultimoPagamento)}`;
  if (dias < 0) return `Venceu há ${-dias} ${dias === -1 ? 'dia' : 'dias'} (${dataCurta(vencimento)})`;
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Vence amanhã';
  return `Vence em ${dias} dias (${dataCurta(vencimento)})`;
}

export const MENSAGEM_COBRANCA_PADRAO =
  'Olá, {contato}. Tudo bem? Aqui é da BDTECH. Identificamos que o pagamento referente à {servico}, '
  + 'no valor de {valor}, com vencimento em {vencimento}, ainda aparece em aberto no nosso controle. '
  + 'Poderia, por gentileza, verificar? Para facilitar, nossa chave Pix é {pix}. '
  + 'Se o pagamento já foi realizado, por favor desconsidere esta mensagem e nos envie o comprovante para conferência. Obrigado!';

export function mensagemCobranca(modelo, dados) {
  const valores = {
    contato: dados.contato || 'tudo bem',
    servico: dados.servico,
    valor: formatCurrency(dados.valor),
    vencimento: dataCurta(dados.vencimento),
    pix: dados.pix || '',
  };
  return (modelo || MENSAGEM_COBRANCA_PADRAO).replace(/\{(contato|servico|valor|vencimento|pix)\}/g, (_, k) => valores[k]);
}

/** Link do WhatsApp com o texto pronto; sem número válido, abre para escolher o contato. */
export function linkWhatsapp(telefone, texto) {
  let numero = String(telefone ?? '').replace(/\D/g, '');
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
  const valido = (numero.length === 12 || numero.length === 13) && numero.startsWith('55');
  return `https://wa.me/${valido ? numero : ''}?text=${encodeURIComponent(texto)}`;
}

// Pagamento A veio antes (ou é o mesmo) que B: pela data e, no mesmo dia, pela ordem de registro.
function ateEste(a, b) {
  if (a.data_pagamento !== b.data_pagamento) return a.data_pagamento < b.data_pagamento;
  return (a.created_at ?? '') <= (b.created_at ?? '');
}

/**
 * Campos do recibo de um pagamento. O saldo considera só os pagamentos feitos
 * até ele — gerar o recibo de março depois de receber abril não muda o recibo
 * de março. "N parcelas de R$ X" só quando todas as que faltam têm o mesmo valor.
 */
export function dadosReciboDoPagamento({ pagamento, parcela, parcelasDoContrato, contrato, cliente }) {
  const saldosAbertos = parcelasDoContrato
    .filter((p) => !p.cancelado_em)
    .map((p) => {
      const pagoC = (p.receivable_payments ?? [])
        .filter((x) => !x.desfeito_em && ateEste(x, pagamento))
        .reduce((s, x) => s + Math.round(Number(x.valor) * 100), 0);
      return Math.max(0, Math.round(Number(p.valor) * 100) - pagoC);
    })
    .filter((c) => c > 0);
  const saldoC = saldosAbertos.reduce((s, c) => s + c, 0);
  const iguais = saldosAbertos.length > 0 && saldosAbertos.every((c) => c === saldosAbertos[0]);
  const parcial = Math.round(Number(pagamento.valor) * 100) < Math.round(Number(parcela.valor) * 100);
  const nome = parcela.numero === 0 ? 'entrada' : `parcela ${parcela.numero}/${parcela.total_parcelas}`;

  return {
    payment_id: pagamento.id,
    client_id: parcela.client_id ?? contrato.client_id ?? null,
    pagador_nome: cliente?.nome ?? contrato.contratante_nome ?? '',
    pagador_documento: cliente?.cpf_cnpj || cliente?.cnpj || contrato.contratante_cnpj || '',
    data_recibo: pagamento.data_pagamento,
    data_inicio_servicos: contrato.data_inicio ?? pagamento.data_pagamento,
    valor_total: Number(contrato.valor_total) || 0,
    valor_recebido: Number(pagamento.valor),
    referente: parcial ? `${nome} (pagamento parcial)` : nome,
    saldo_restante: saldoC / 100,
    parcelas_restantes: iguais ? saldosAbertos.length : null,
  };
}
