// Cálculos do recibo. O saldo é o que falta do contrato depois do valor
// recebido; ele é dividido no número de parcelas informado, igual ao contrato.

export function reciboCalculo({ valorTotal, valorRecebido, parcelasRestantes }) {
  const total = Number(valorTotal) || 0;
  const recebido = Number(valorRecebido) || 0;
  const parcelas = Number(parcelasRestantes) || 0;
  const saldo = Math.round((total - recebido) * 100) / 100;
  return {
    saldo,
    percentual: total > 0 ? (recebido / total) * 100 : null,
    valorParcela: parcelas > 0 ? Math.round((saldo / parcelas) * 100) / 100 : null,
  };
}

export function formatPercentual(v) {
  if (v == null) return '—';
  return `${Number(v.toFixed(1)).toLocaleString('pt-BR')}%`;
}

export function reciboNumeroLabel(recibo) {
  return `REC-${String(recibo.data_recibo).slice(0, 4)}-${String(recibo.numero).padStart(4, '0')}`;
}

// O cadastro guarda CPF e CNPJ no mesmo campo; 11 dígitos é CPF.
export function tipoDocumento(documento) {
  return String(documento ?? '').replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ';
}
