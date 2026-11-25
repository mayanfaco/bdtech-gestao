import { describe, expect, it } from 'vitest';
import { formatPercentual, reciboCalculo, reciboNumeroLabel, tipoDocumento } from './reciboCalculations.js';
import { numeroPorExtenso } from './numeroPorExtenso.js';

describe('reciboCalculo', () => {
  it('divide o saldo pelas parcelas restantes', () => {
    const r = reciboCalculo({ valorTotal: '6600', valorRecebido: '1980', parcelasRestantes: '11' });
    expect(r.saldo).toBe(4620);
    expect(r.valorParcela).toBe(420);
    expect(formatPercentual(r.percentual)).toBe('30%');
  });

  it('não calcula parcela sem quantidade', () => {
    expect(reciboCalculo({ valorTotal: 1000, valorRecebido: 400, parcelasRestantes: '' }).valorParcela).toBeNull();
  });

  it('não sofre com arredondamento de centavos', () => {
    expect(reciboCalculo({ valorTotal: 0.3, valorRecebido: 0.1 }).saldo).toBe(0.2);
  });

  it('não calcula percentual sem valor total', () => {
    expect(formatPercentual(reciboCalculo({ valorTotal: '', valorRecebido: 100 }).percentual)).toBe('—');
  });
});

describe('formatPercentual', () => {
  it('usa uma casa decimal quando o percentual não é inteiro', () => {
    expect(formatPercentual(100 / 3)).toBe('33,3%');
  });
});

describe('reciboNumeroLabel', () => {
  it('usa o ano da data do recibo', () => {
    expect(reciboNumeroLabel({ data_recibo: '2026-11-05', numero: 7 })).toBe('REC-2026-0007');
  });
});

describe('tipoDocumento', () => {
  it('reconhece CPF e CNPJ', () => {
    expect(tipoDocumento('011.597.893-39')).toBe('CPF');
    expect(tipoDocumento('04.711.101/0001-21')).toBe('CNPJ');
  });
});

describe('numeroPorExtenso', () => {
  it('escreve o valor do recibo sem vírgula depois de "mil"', () => {
    expect(numeroPorExtenso(1980)).toBe('mil novecentos e oitenta reais');
  });

  it('mantém o "e" em valores redondos', () => {
    expect(numeroPorExtenso(6600)).toBe('seis mil e seiscentos reais');
  });
});
