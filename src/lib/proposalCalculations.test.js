import { describe, it, expect } from 'vitest';
import { valorInicial, modelo1Calculo, modelo2Calculo, formatCurrency } from './proposalCalculations.js';

describe('valorInicial', () => {
  it('deriva o valor de referência (antes do desconto) a partir do valor com desconto', () => {
    expect(valorInicial(900, 10)).toBeCloseTo(1000);
  });
  it('retorna null quando o desconto é 100% ou mais (divisão por zero)', () => {
    expect(valorInicial(900, 100)).toBeNull();
  });
});

describe('modelo1Calculo (Serviço Técnico Pontual)', () => {
  it('divide o restante (após a entrada) pelo número de parcelas informado', () => {
    // Regressão: bug real corrigido nesta conversa — o parcelamento do
    // Modelo 1 não existia; ao ser adicionado, a conta tem que bater com
    // "entrada + N parcelas iguais do restante", não com o valor total.
    const r = modelo1Calculo({
      valorComDesconto: 10000, descontoPercentual: 0, entradaPercentual: 50, parcelasRestante: 5,
    });
    expect(r.entradaValor).toBeCloseTo(5000);
    expect(r.restanteValor).toBeCloseTo(5000);
    expect(r.valorParcela).toBeCloseTo(1000);
  });
  it('sem parcelamento (1 parcela) não retorna valorParcela dividido', () => {
    const r = modelo1Calculo({
      valorComDesconto: 10000, descontoPercentual: 0, entradaPercentual: 50, parcelasRestante: 1,
    });
    expect(r.valorParcela).toBeCloseTo(5000);
  });
});

describe('modelo2Calculo (Serviço Técnico Continuado)', () => {
  it('trata o valor informado como TOTAL do contrato, sem multiplicar por 12', () => {
    // Regressão: bug real reportado pelo usuário — o valor era multiplicado
    // por 12 como se fosse mensal, gerando "Valor total do contrato" 12x
    // maior que o informado.
    const r = modelo2Calculo({
      valorComDescontoMensal: 12000, descontoPercentual: 0, entradaPercentual: 0, parcelasRestante: 12,
    });
    expect(r.valorAnual).toBeCloseTo(12000);
    expect(r.valorMensal).toBeCloseTo(12000);
  });
  it('divide o restante (após a entrada) pelo número de parcelas, não o valor cheio', () => {
    // Regressão: bug real reportado pelo usuário — a parcela estava sendo
    // calculada sobre o valor anualizado em vez do restante após a entrada.
    const r = modelo2Calculo({
      valorComDescontoMensal: 12000, descontoPercentual: 0, entradaPercentual: 50, parcelasRestante: 11,
    });
    expect(r.entradaValor).toBeCloseTo(6000);
    expect(r.restanteValor).toBeCloseTo(6000);
    expect(r.valorParcela).toBeCloseTo(6000 / 11);
  });
});

describe('formatCurrency', () => {
  it('formata em Real brasileiro', () => {
    expect(formatCurrency(1234.5)).toBe(
      (1234.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    );
  });
  it('retorna travessão para valores nulos/indefinidos', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
    expect(formatCurrency(NaN)).toBe('—');
  });
});
