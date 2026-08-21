// Etapas visíveis do andamento da proposta. Cada etapa "casa" com um ou mais
// status internos (ex.: "Enviada" cobre enviada + visualizada).
export const FLUXO_STEPS = [
  { key: 'rascunho', label: 'Criada', match: ['rascunho', 'pronta_para_envio', 'aguardando_revisao'] },
  { key: 'enviada', label: 'Enviada ao cliente', match: ['enviada', 'visualizada'] },
  { key: 'em_negociacao', label: 'Em negociação', match: ['em_negociacao'] },
  { key: 'aprovada', label: 'Aprovada', match: ['aprovada'] },
];

export const FLUXO_NEGATIVOS = {
  recusada: 'Recusada', cancelada: 'Cancelada', expirada: 'Expirada', arquivada: 'Arquivada',
};

const indiceDoStatus = (status) => FLUXO_STEPS.findIndex((s) => s.match.includes(status));

/**
 * Estado visual de cada etapa do fluxo da proposta.
 *
 * Regra central: o estado vem do STATUS ATUAL, não do histórico. O histórico
 * (proposal_status_history) registra toda passagem e nunca é apagado — se ele
 * mandasse, uma proposta que foi aprovada e depois teve a aprovação revertida
 * continuaria mostrando "Aprovada" como concluída para sempre.
 *
 * O histórico é usado para duas coisas: as datas de cada etapa e, quando o
 * status atual é negativo (recusada/cancelada/...), saber até onde a proposta
 * chegou antes de parar — nesses casos ela não está em nenhuma etapa do fluxo.
 *
 * @param {string} currentStatus status atual da proposta
 * @param {Array<{status: string, changed_at: string}>} historico
 */
export function estadoDoFluxo(currentStatus, historico = []) {
  const dateOf = {};
  historico.forEach((h) => { if (!dateOf[h.status]) dateOf[h.status] = h.changed_at; });

  const negativo = FLUXO_NEGATIVOS[currentStatus] ?? null;
  const maiorNoHistorico = historico.reduce((max, h) => Math.max(max, indiceDoStatus(h.status)), -1);
  const alcancado = negativo ? maiorNoHistorico : indiceDoStatus(currentStatus);
  const ultima = FLUXO_STEPS.length - 1;

  const etapas = FLUXO_STEPS.map((step, i) => {
    // "Aprovada" é o fim positivo do fluxo: ao ser alcançada conta como
    // concluída, não como etapa em andamento.
    const concluida = negativo ? i <= alcancado : i < alcancado || (i === alcancado && alcancado === ultima);
    const atual = !negativo && i === alcancado && alcancado !== ultima;
    const alcancada = i <= alcancado;
    return {
      ...step,
      concluida,
      atual,
      alcancada,
      // Data só das etapas alcançadas no estado atual: se a proposta voltou
      // atrás, a data antiga de uma etapa à frente não deve aparecer.
      data: alcancada ? (step.match.map((s) => dateOf[s]).find(Boolean) ?? null) : null,
    };
  });

  return { etapas, negativo, dataNegativo: negativo ? (dateOf[currentStatus] ?? null) : null };
}
