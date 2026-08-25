import { describe, it, expect } from 'vitest';
import { nomeContatoCompleto, nomesProvavelmenteDivergentes } from './proposalContato.js';

describe('nomeContatoCompleto', () => {
  it('completa o nome abreviado usando o do síndico', () => {
    // Caso real: o A/C da proposta saía só "Thiago".
    expect(nomeContatoCompleto({ contatoNome: 'Thiago', sindicoNome: 'Thiago Almeida Costa' }))
      .toBe('Thiago Almeida Costa');
  });

  it('completa mesmo quando falta um nome do meio', () => {
    expect(nomeContatoCompleto({ contatoNome: 'Alcides Jr.', sindicoNome: 'Alcides Zulian Jr.' }))
      .toBe('Alcides Zulian Jr.');
  });

  it('quando o contato É o síndico, o campo do síndico manda (corrige grafia)', () => {
    // Caso real: cadastro corrigido para "Zulian" no campo do síndico, mas o
    // contato principal ficou com "Julian" — e a proposta saía com o antigo.
    expect(nomeContatoCompleto({
      contatoNome: 'Alcides Julian Jr.', contatoCargo: 'Síndico', sindicoNome: 'Alcides Zulian Jr.',
    })).toBe('Alcides Zulian Jr.');
    // Aceita "Sindico" sem acento e outras variações do cargo.
    expect(nomeContatoCompleto({
      contatoNome: 'Alcides Julian Jr.', contatoCargo: 'sindico', sindicoNome: 'Alcides Zulian Jr.',
    })).toBe('Alcides Zulian Jr.');
  });

  it('NÃO troca a grafia quando o contato NÃO é o síndico', () => {
    // Outro cargo: são registros de pessoas distintas na cabeça do usuário,
    // trocar aqui poria no documento um nome que ele não escolheu.
    expect(nomeContatoCompleto({
      contatoNome: 'Alcides Julian Jr.', contatoCargo: 'Administradora', sindicoNome: 'Alcides Zulian Jr.',
    })).toBe('Alcides Julian Jr.');
  });

  it('NÃO troca por outra pessoa mesmo com cargo de síndico', () => {
    expect(nomeContatoCompleto({
      contatoNome: 'Maria Souza', contatoCargo: 'Síndico', sindicoNome: 'João Pereira Lima',
    })).toBe('Maria Souza');
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

  it('ignora caixa e espaços extras', () => {
    expect(nomeContatoCompleto({ contatoNome: '  thiago ', sindicoNome: 'Thiago  Almeida   Costa' }))
      .toBe('Thiago Almeida Costa');
  });
});

describe('nomesProvavelmenteDivergentes', () => {
  it('acusa divergência de grafia na mesma pessoa', () => {
    expect(nomesProvavelmenteDivergentes({ contatoNome: 'Alcides Julian Jr.', sindicoNome: 'Alcides Zulian Jr.' }))
      .toBe(true);
  });

  it('não acusa quando é só abreviação', () => {
    expect(nomesProvavelmenteDivergentes({ contatoNome: 'Thiago', sindicoNome: 'Thiago Almeida Costa' }))
      .toBe(false);
    expect(nomesProvavelmenteDivergentes({ contatoNome: 'Alcides Jr.', sindicoNome: 'Alcides Zulian Jr.' }))
      .toBe(false);
  });

  it('não acusa quando são pessoas diferentes', () => {
    expect(nomesProvavelmenteDivergentes({ contatoNome: 'Maria Souza', sindicoNome: 'João Lima' }))
      .toBe(false);
  });

  it('não acusa nomes iguais nem campos vazios', () => {
    expect(nomesProvavelmenteDivergentes({ contatoNome: 'Ana Paula', sindicoNome: 'ana paula' })).toBe(false);
    expect(nomesProvavelmenteDivergentes({ contatoNome: '', sindicoNome: 'Ana Paula' })).toBe(false);
    expect(nomesProvavelmenteDivergentes({ contatoNome: 'Ana Paula', sindicoNome: null })).toBe(false);
  });
});
