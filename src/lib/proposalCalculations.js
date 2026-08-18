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

export function modelo1Calculo({ valorComDesconto, descontoPercentual, entradaPercentual, parcelasRestante }) {
  const total = Number(valorComDesconto) || 0;
  const entrada = Number(entradaPercentual) || 0;
  const parcelas = Number(parcelasRestante) || 0;
  const restantePercentual = 100 - entrada;
  const restanteValor = (total * restantePercentual) / 100;
  return {
    valorInicial: valorInicial(total, descontoPercentual),
    valorTotal: total,
    entradaValor: (total * entrada) / 100,
    restantePercentual,
    restanteValor,
    valorParcela: parcelas > 0 ? restanteValor / parcelas : null,
  };
}

// Modelo 2 — Serviço técnico continuado. O valor digitado já é o valor TOTAL
// do contrato (com desconto), não um valor mensal — não é multiplicado por
// nenhum período. A entrada (% no fechamento) é calculada sobre esse total;
// o restante é dividido no número de parcelas informado.
export function modelo2Calculo({ valorComDescontoMensal, descontoPercentual, entradaPercentual, parcelasRestante }) {
  const total = Number(valorComDescontoMensal) || 0;
  const entrada = Number(entradaPercentual) || 0;
  const parcelas = Number(parcelasRestante) || 0;
  const entradaValor = (total * entrada) / 100;
  const restanteValor = total - entradaValor;
  return {
    valorInicialMensal: valorInicial(total, descontoPercentual),
    valorMensal: total,
    valorAnual: total,
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
