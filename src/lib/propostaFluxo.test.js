import { describe, it, expect } from 'vitest';
import { estadoDoFluxo } from './propostaFluxo.js';

// Histórico de uma proposta que foi criada, enviada, negociada e aprovada.
const HIST_APROVADA = [
  { status: 'rascunho', changed_at: '2026-08-01T10:00:00Z' },
  { status: 'enviada', changed_at: '2026-08-02T10:00:00Z' },
  { status: 'em_negociacao', changed_at: '2026-08-03T10:00:00Z' },
  { status: 'aprovada', changed_at: '2026-08-04T10:00:00Z' },
];

const rotulos = (etapas, filtro) => etapas.filter(filtro).map((e) => e.label);

describe('estadoDoFluxo', () => {
  it('marca tudo como concluído quando a proposta está aprovada', () => {
    const { etapas, negativo } = estadoDoFluxo('aprovada', HIST_APROVADA);
    expect(negativo).toBeNull();
    expect(rotulos(etapas, (e) => e.concluida)).toEqual([
      'Criada', 'Enviada ao cliente', 'Em negociação', 'Aprovada',
    ]);
    // Estado terminal positivo: nenhuma etapa fica "em andamento".
    expect(rotulos(etapas, (e) => e.atual)).toEqual([]);
  });

  it('ao reverter a aprovação, "Aprovada" volta a ficar pendente', () => {
    // Bug reportado: o histórico mantinha o registro da aprovação e a etapa
    // continuava verde, como se a reversão não tivesse acontecido.
    const historicoComReversao = [...HIST_APROVADA, { status: 'em_negociacao', changed_at: '2026-08-18T10:00:00Z' }];
    const { etapas } = estadoDoFluxo('em_negociacao', historicoComReversao);

    const aprovada = etapas.find((e) => e.key === 'aprovada');
    expect(aprovada.concluida).toBe(false);
    expect(aprovada.atual).toBe(false);
    expect(aprovada.alcancada).toBe(false);
    // E não mostra mais a data da aprovação antiga.
    expect(aprovada.data).toBeNull();

    // A etapa atual passa a ser "Em negociação".
    expect(rotulos(etapas, (e) => e.atual)).toEqual(['Em negociação']);
    expect(rotulos(etapas, (e) => e.concluida)).toEqual(['Criada', 'Enviada ao cliente']);
  });

  it('destaca a etapa atual de uma proposta em andamento', () => {
    const { etapas } = estadoDoFluxo('enviada', [
      { status: 'rascunho', changed_at: '2026-08-01T10:00:00Z' },
      { status: 'enviada', changed_at: '2026-08-02T10:00:00Z' },
    ]);
    expect(rotulos(etapas, (e) => e.concluida)).toEqual(['Criada']);
    expect(rotulos(etapas, (e) => e.atual)).toEqual(['Enviada ao cliente']);
  });

  it('em status negativo mostra até onde a proposta chegou, sem etapa atual', () => {
    const { etapas, negativo, dataNegativo } = estadoDoFluxo('recusada', [
      { status: 'rascunho', changed_at: '2026-08-01T10:00:00Z' },
      { status: 'enviada', changed_at: '2026-08-02T10:00:00Z' },
      { status: 'em_negociacao', changed_at: '2026-08-03T10:00:00Z' },
      { status: 'recusada', changed_at: '2026-08-05T10:00:00Z' },
    ]);
    expect(negativo).toBe('Recusada');
    expect(dataNegativo).toBe('2026-08-05T10:00:00Z');
    expect(rotulos(etapas, (e) => e.concluida)).toEqual(['Criada', 'Enviada ao cliente', 'Em negociação']);
    expect(rotulos(etapas, (e) => e.atual)).toEqual([]);
    expect(etapas.find((e) => e.key === 'aprovada').concluida).toBe(false);
  });

  it('trata "visualizada" como parte da etapa Enviada', () => {
    const { etapas } = estadoDoFluxo('visualizada', [
      { status: 'rascunho', changed_at: '2026-08-01T10:00:00Z' },
      { status: 'enviada', changed_at: '2026-08-02T10:00:00Z' },
      { status: 'visualizada', changed_at: '2026-08-03T10:00:00Z' },
    ]);
    expect(rotulos(etapas, (e) => e.atual)).toEqual(['Enviada ao cliente']);
  });

  it('não quebra com proposta nova sem histórico', () => {
    const { etapas, negativo } = estadoDoFluxo('rascunho', []);
    expect(negativo).toBeNull();
    expect(rotulos(etapas, (e) => e.atual)).toEqual(['Criada']);
    expect(rotulos(etapas, (e) => e.concluida)).toEqual([]);
  });
});
