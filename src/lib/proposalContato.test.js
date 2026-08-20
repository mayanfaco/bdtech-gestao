import { describe, it, expect } from 'vitest';
import { nomeContatoCompleto } from './proposalContato.js';

describe('nomeContatoCompleto', () => {
  it('usa o nome completo do síndico quando o contato está abreviado', () => {
    // Caso real reportado: o A/C da proposta saía só "Thiago".
    expect(nomeContatoCompleto({ contatoNome: 'Thiago', sindicoNome: 'Thiago Almeida Costa' }))
      .toBe('Thiago Almeida Costa');
  });

  it('respeita o contato quando é outra pessoa, não o síndico', () => {
    expect(nomeContatoCompleto({ contatoNome: 'Maria Souza', sindicoNome: 'João Pereira Lima' }))
      .toBe('Maria Souza');
  });

  it('mantém o contato quando ele já é o mais completo', () => {
    expect(nomeContatoCompleto({ contatoNome: 'Thiago Almeida Costa', sindicoNome: 'Thiago' }))
      .toBe('Thiago Almeida Costa');
  });

  it('cai para o síndico quando não há contato cadastrado', () => {
    expect(nomeContatoCompleto({ contatoNome: '', sindicoNome: 'Thiago Almeida Costa' }))
      .toBe('Thiago Almeida Costa');
  });

  it('cai para o contato quando não há síndico cadastrado', () => {
    expect(nomeContatoCompleto({ contatoNome: 'Thiago', sindicoNome: '' })).toBe('Thiago');
  });

  it('não quebra com campos nulos/indefinidos', () => {
    expect(nomeContatoCompleto({ contatoNome: null, sindicoNome: undefined })).toBe('');
  });

  it('ignora diferença de caixa e espaços extras ao comparar', () => {
    expect(nomeContatoCompleto({ contatoNome: '  thiago ', sindicoNome: 'Thiago Almeida Costa' }))
      .toBe('Thiago Almeida Costa');
  });
});
