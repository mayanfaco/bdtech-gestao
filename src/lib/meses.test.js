import { describe, expect, it } from 'vitest';
import { mesLabel, mudarMes, noMes, vigenteNoMes } from './meses.js';

describe('meses', () => {
  it('anda para trás e para a frente, virando o ano', () => {
    expect(mudarMes('2026-01', -1)).toBe('2025-12');
    expect(mudarMes('2026-12', 1)).toBe('2027-01');
    expect(mudarMes('2026-11', -13)).toBe('2025-10');
  });

  it('nome do mês', () => {
    expect(mesLabel('2026-11')).toBe('Novembro de 2026');
    expect(mesLabel('2026-03', { minusculo: true })).toBe('março de 2026');
    expect(mesLabel('')).toBe('Todos os meses');
  });

  it('data dentro do mês', () => {
    expect(noMes('2026-11-30', '2026-11')).toBe(true);
    expect(noMes('2026-12-01', '2026-11')).toBe(false);
    expect(noMes(null, '2026-11')).toBe(false);
    expect(noMes('2020-01-01', '')).toBe(true);
  });

  it('contrato vigente no mês', () => {
    expect(vigenteNoMes('2026-03-10', '2027-03-10', '2026-11')).toBe(true);
    expect(vigenteNoMes('2026-12-01', '2027-12-01', '2026-11')).toBe(false);
    expect(vigenteNoMes('2025-11-01', '2026-10-31', '2026-11')).toBe(false);
    expect(vigenteNoMes('2025-11-01', '2026-11-01', '2026-11')).toBe(true);
    expect(vigenteNoMes('2026-01-01', null, '2026-11')).toBe(true);
  });
});
