// Réplica dos cálculos do gerador de proposta original (versão "standalone"):
// um único percentual de desconto vale para os dois modelos; o valor digitado
// já é o valor COM desconto, e o "valor inicial" (referência, antes do desconto)
// é derivado — não o contrário.

export function valorInicial(valorComDesconto, descontoPercentual) {
  const v = Number(valorComDesconto) || 0;
  const d = Number(descontoPercentual) || 0;
  if (d >= 100) return null;
  return v / (1 - d / 100);
}

export function modelo1Calculo({ valorComDesconto, descontoPercentual, entradaPercentual }) {
  const total = Number(valorComDesconto) || 0;
  const entrada = Number(entradaPercentual) || 0;
  const restantePercentual = 100 - entrada;
  return {
    valorInicial: valorInicial(total, descontoPercentual),
    valorTotal: total,
    entradaValor: (total * entrada) / 100,
    restantePercentual,
    restanteValor: (total * restantePercentual) / 100,
  };
}

// Modelo 2 é um contrato anual cobrado mensalmente: o valor mensal com desconto
// x 12 dá o valor anual do contrato. A entrada (% no fechamento) é paga à
// vista; o restante é dividido no número de parcelas informado.
export function modelo2Calculo({ valorComDescontoMensal, descontoPercentual, entradaPercentual, parcelasRestante }) {
  const mensal = Number(valorComDescontoMensal) || 0;
  const anual = mensal * 12;
  const entrada = Number(entradaPercentual) || 0;
  const parcelas = Number(parcelasRestante) || 0;
  const entradaValor = (anual * entrada) / 100;
  const restanteValor = anual - entradaValor;
  return {
    valorInicialMensal: valorInicial(mensal, descontoPercentual),
    valorMensal: mensal,
    valorAnual: anual,
    entradaValor,
    restanteValor,
    valorParcela: parcelas > 0 ? restanteValor / parcelas : null,
  };
}

export function formatCurrency(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function proposalNumberLabel(proposal) {
  if (!proposal) return '';
  const year = proposal.data_proposta ? new Date(proposal.data_proposta).getFullYear() : new Date().getFullYear();
  return `PROP-${year}-${String(proposal.numero).padStart(4, '0')}`;
}
