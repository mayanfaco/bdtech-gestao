import { describe, expect, it } from 'vitest';
import {
  addMeses, contratoNumeroLabel, dadosReciboDoPagamento, linkWhatsapp, mensagemCobranca, parcelaLabel, planoDeParcelas, prazoTexto, situacaoParcela,
} from './recebimentos.js';

const contrato = {
  valor_total: 6600, parcela1_valor: 1980, parcela1_data: '2026-11-05',
  parcelas_mensais_quantidade: 11, parcelas_mensais_inicio: '2026-12-05',
};

describe('planoDeParcelas', () => {
  it('gera entrada + 11 parcelas mensais', () => {
    const { parcelas, erro } = planoDeParcelas(contrato);
    expect(erro).toBeNull();
    expect(parcelas).toHaveLength(12);
    expect(parcelas[0]).toEqual({ numero: 0, total_parcelas: 11, valor: 1980, vencimento: '2026-11-05' });
    expect(parcelas[1]).toEqual({ numero: 1, total_parcelas: 11, valor: 420, vencimento: '2026-12-05' });
    expect(parcelas[11].vencimento).toBe('2027-10-05');
  });

  it('a soma sempre bate com o total, mesmo sem divisão exata', () => {
    const { parcelas } = planoDeParcelas({ ...contrato, valor_total: 1000, parcela1_valor: 0, parcela1_data: null, parcelas_mensais_quantidade: 3 });
    expect(parcelas.map((p) => p.valor)).toEqual([333.33, 333.33, 333.34]);
  });

  it('não erra em centavos de ponto flutuante', () => {
    const { parcelas } = planoDeParcelas({ ...contrato, valor_total: 0.3, parcela1_valor: 0.1, parcelas_mensais_quantidade: 2 });
    expect(parcelas.map((p) => p.valor)).toEqual([0.1, 0.1, 0.1]);
  });

  it('entrada igual ao total gera só a entrada', () => {
    const { parcelas } = planoDeParcelas({ ...contrato, parcela1_valor: 6600, parcelas_mensais_quantidade: '', parcelas_mensais_inicio: '' });
    expect(parcelas).toHaveLength(1);
    expect(parcelas[0].total_parcelas).toBe(0);
  });

  it('avisa o que falta no contrato', () => {
    expect(planoDeParcelas({ ...contrato, parcelas_mensais_inicio: '' }).erro).toBe('Falta preencher no contrato: o 1º vencimento das parcelas.');
    expect(planoDeParcelas({ ...contrato, parcela1_data: '' }).erro).toContain('o vencimento da entrada');
    expect(planoDeParcelas({ ...contrato, valor_total: '' }).erro).toContain('o valor total');
    expect(planoDeParcelas({ ...contrato, parcela1_valor: 7000 }).erro).toBe('A entrada é maior que o valor total do contrato.');
  });
});

describe('addMeses', () => {
  it('usa o último dia quando o mês não tem o dia', () => {
    expect(addMeses('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMeses('2027-01-31', 2)).toBe('2027-03-31');
    expect(addMeses('2026-12-05', 1)).toBe('2027-01-05');
  });
});

describe('situacaoParcela', () => {
  const parcela = { numero: 3, total_parcelas: 11, valor: 1000, vencimento: '2026-11-10', receivable_payments: [] };

  it('vencida, a vencer e recebida', () => {
    expect(situacaoParcela(parcela, '2026-11-13').status).toBe('vencido');
    expect(situacaoParcela(parcela, '2026-11-10').status).toBe('a_vencer');
    const paga = { ...parcela, receivable_payments: [{ valor: 1000, data_pagamento: '2026-11-11' }] };
    expect(situacaoParcela(paga, '2026-11-13')).toMatchObject({ status: 'recebido', saldo: 0, ultimoPagamento: '2026-11-11' });
  });

  it('pagamento parcial não quita', () => {
    const s = situacaoParcela({ ...parcela, receivable_payments: [{ valor: 400, data_pagamento: '2026-11-11' }] }, '2026-11-13');
    expect(s).toMatchObject({ status: 'vencido', parcial: true, pago: 400, saldo: 600 });
  });

  it('ignora pagamento desfeito', () => {
    const s = situacaoParcela({ ...parcela, receivable_payments: [{ valor: 1000, data_pagamento: '2026-11-11', desfeito_em: '2026-11-12' }] }, '2026-11-09');
    expect(s).toMatchObject({ status: 'a_vencer', pago: 0, saldo: 1000 });
  });

  it('parcela cancelada', () => {
    expect(situacaoParcela({ ...parcela, cancelado_em: '2026-11-01' }, '2026-11-13').status).toBe('cancelado');
  });
});

describe('prazoTexto', () => {
  const p = { valor: 10, vencimento: '2026-11-10', receivable_payments: [] };
  it('fala o prazo por extenso', () => {
    expect(prazoTexto(situacaoParcela(p, '2026-11-13'), p.vencimento)).toBe('Venceu há 3 dias (10/11/2026)');
    expect(prazoTexto(situacaoParcela(p, '2026-11-11'), p.vencimento)).toBe('Venceu há 1 dia (10/11/2026)');
    expect(prazoTexto(situacaoParcela(p, '2026-11-10'), p.vencimento)).toBe('Vence hoje');
    expect(prazoTexto(situacaoParcela(p, '2026-11-09'), p.vencimento)).toBe('Vence amanhã');
    expect(prazoTexto(situacaoParcela(p, '2026-11-01'), p.vencimento)).toBe('Vence em 9 dias (10/11/2026)');
  });
});

describe('textos', () => {
  it('rótulos', () => {
    expect(parcelaLabel({ numero: 0 })).toBe('Entrada');
    expect(parcelaLabel({ numero: 3, total_parcelas: 11 })).toBe('Parcela 3/11');
    expect(contratoNumeroLabel({ data_inicio: '2026-11-05', numero: 4 })).toBe('CONT-2026-0004');
  });

  it('monta a mensagem de cobrança', () => {
    const msg = mensagemCobranca(null, { contato: 'Lúcio', servico: 'Parcela 3/11', valor: 420, vencimento: '2026-11-10', pix: 'bdtechelevadores@gmail.com' });
    expect(msg).toContain('Olá, Lúcio.');
    expect(msg).toMatch(/no valor de R\$\s420,00, com vencimento em 10\/11\/2026/);
    expect(msg).toContain('chave Pix é bdtechelevadores@gmail.com');
  });

  it('link do WhatsApp', () => {
    expect(linkWhatsapp('(85) 99999-1234', 'oi')).toBe('https://wa.me/5585999991234?text=oi');
    expect(linkWhatsapp('', 'a b')).toBe('https://wa.me/?text=a%20b');
  });
});

describe('dadosReciboDoPagamento', () => {
  const contratoR = { id: 'k1', client_id: 'c1', data_inicio: '2026-11-05', valor_total: 6600 };
  const cliente = { nome: 'Cond. Santorini', cpf_cnpj: '04.711.101/0001-21' };
  const plano = planoDeParcelas({ ...contrato }).parcelas.map((p, i) => ({ ...p, id: `p${i}`, client_id: 'c1', receivable_payments: [] }));

  it('recibo da entrada', () => {
    const pagamento = { id: 'x', valor: 1980, data_pagamento: '2026-11-05', created_at: '2026-11-05T10:00:00Z' };
    plano[0].receivable_payments = [pagamento];
    const d = dadosReciboDoPagamento({ pagamento, parcela: plano[0], parcelasDoContrato: plano, contrato: contratoR, cliente });
    expect(d).toMatchObject({ referente: 'entrada', valor_recebido: 1980, saldo_restante: 4620, parcelas_restantes: 11, data_recibo: '2026-11-05', pagador_documento: '04.711.101/0001-21' });
  });

  it('recibo de parcela ignora pagamentos posteriores', () => {
    const p1 = { id: 'y', valor: 420, data_pagamento: '2026-12-05', created_at: '2026-12-05T10:00:00Z' };
    const p2 = { id: 'z', valor: 420, data_pagamento: '2027-01-05', created_at: '2027-01-05T10:00:00Z' };
    plano[1].receivable_payments = [p1];
    plano[2].receivable_payments = [p2];
    const d = dadosReciboDoPagamento({ pagamento: p1, parcela: plano[1], parcelasDoContrato: plano, contrato: contratoR, cliente });
    expect(d).toMatchObject({ referente: 'parcela 1/11', saldo_restante: 4200, parcelas_restantes: 10 });
  });

  it('pagamento parcial e saldos diferentes', () => {
    const parcelas = [
      { id: 'a', numero: 1, total_parcelas: 2, valor: 1000, receivable_payments: [] },
      { id: 'b', numero: 2, total_parcelas: 2, valor: 1000, receivable_payments: [] },
    ];
    const pg = { id: 'w', valor: 400, data_pagamento: '2026-12-01' };
    parcelas[0].receivable_payments = [pg];
    const d = dadosReciboDoPagamento({ pagamento: pg, parcela: parcelas[0], parcelasDoContrato: parcelas, contrato: contratoR, cliente });
    expect(d).toMatchObject({ referente: 'parcela 1/2 (pagamento parcial)', saldo_restante: 1600, parcelas_restantes: null });
  });
});
