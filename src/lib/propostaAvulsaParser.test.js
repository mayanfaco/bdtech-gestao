import { describe, it, expect } from 'vitest';
import { parsePropostaAvulsa, tituloResumido } from './propostaAvulsaParser.js';

// Recorte do texto real que a BDTECH usa, incluindo o cabeçalho repetido da
// empresa, os campos do destinatário, seções numeradas, listas e assinatura.
const TEXTO = `PROPOSTA COMERCIAL

Laudo Técnico – Avaliação dos Cabos de Tração de 02 Elevadores

BDTECH Consultoria
Engenharia Mecânica | Consultoria Técnica em Elevadores

À: [Nome do Condomínio / Cliente]
A/C: [Nome do responsável]
Data: [//2026]

1. OBJETO

A presente proposta tem por objeto a prestação de serviços de Inspeção e Avaliação Técnica dos cabos de aço de tração de 02 (dois) elevadores.

2. ESCOPO DOS SERVIÇOS

A BDTECH Consultoria realizará, nos dois elevadores:

* Inspeção visual dos cabos de tração;
* Medição do diâmetro dos cabos em pontos representativos;
* Verificação de fios rompidos;

5. INVESTIMENTO

Valor total dos serviços: R$ 2.200,00 (dois mil e duzentos reais).

Forma de pagamento: [PIX / transferência bancária / boleto].

Atenciosamente,

BDTECH Consultoria
Engenharia Mecânica | Consultoria Técnica em Elevadores

Eng.º Mecânico [Nome]
CREA-CE nº [____]
ART: a ser emitida para o serviço`;

describe('parsePropostaAvulsa', () => {
  const r = parsePropostaAvulsa(TEXTO);

  it('separa título e subtítulo do preâmbulo', () => {
    expect(r.titulo).toBe('PROPOSTA COMERCIAL');
    expect(r.subtitulo).toBe('Laudo Técnico – Avaliação dos Cabos de Tração de 02 Elevadores');
  });

  it('reconhece os campos do destinatário', () => {
    expect(r.campos).toEqual([
      { rotulo: 'À', valor: '[Nome do Condomínio / Cliente]' },
      { rotulo: 'A/C', valor: '[Nome do responsável]' },
      { rotulo: 'Data', valor: '[//2026]' },
    ]);
  });

  it('reconhece as seções numeradas preservando a numeração do texto', () => {
    const secoes = r.blocos.filter((b) => b.tipo === 'secao');
    expect(secoes).toEqual([
      { tipo: 'secao', numero: '1', titulo: 'OBJETO' },
      { tipo: 'secao', numero: '2', titulo: 'ESCOPO DOS SERVIÇOS' },
      // Numeração salteada do original (5) é mantida, não renumerada.
      { tipo: 'secao', numero: '5', titulo: 'INVESTIMENTO' },
    ]);
  });

  it('agrupa itens consecutivos em uma única lista', () => {
    const listas = r.blocos.filter((b) => b.tipo === 'lista');
    expect(listas).toHaveLength(1);
    expect(listas[0].itens).toEqual([
      'Inspeção visual dos cabos de tração;',
      'Medição do diâmetro dos cabos em pontos representativos;',
      'Verificação de fios rompidos;',
    ]);
  });

  it('descarta as linhas que só repetem a identificação da BDTECH', () => {
    const texto = JSON.stringify(r);
    expect(texto).not.toMatch(/BDTECH Consultoria\\n|"BDTECH Consultoria"/);
    // O parágrafo que menciona a empresa no meio da frase é preservado.
    const paragrafos = r.blocos.filter((b) => b.tipo === 'paragrafo').map((b) => b.texto);
    expect(paragrafos).toContain('A BDTECH Consultoria realizará, nos dois elevadores:');
  });

  it('trata texto após "Atenciosamente," como assinatura, sem nome/CREA', () => {
    // Nome do engenheiro e CREA vêm do cadastro da empresa.
    expect(r.assinatura).toEqual(['ART: a ser emitida para o serviço']);
  });

  it('não confunde "Valor total: R$" com campo de destinatário', () => {
    const paragrafos = r.blocos.filter((b) => b.tipo === 'paragrafo').map((b) => b.texto);
    expect(paragrafos).toContain('Valor total dos serviços: R$ 2.200,00 (dois mil e duzentos reais).');
    expect(r.campos.map((c) => c.rotulo)).not.toContain('Valor total dos serviços');
  });

  it('junta linhas seguidas no mesmo parágrafo', () => {
    const { blocos } = parsePropostaAvulsa('1. OBJETO\n\nPrimeira linha\nsegunda linha do mesmo parágrafo.');
    const paragrafos = blocos.filter((b) => b.tipo === 'paragrafo');
    expect(paragrafos).toHaveLength(1);
    expect(paragrafos[0].texto).toBe('Primeira linha segunda linha do mesmo parágrafo.');
  });

  it('aceita hífen como marcador de lista', () => {
    const { blocos } = parsePropostaAvulsa('1. ESCOPO\n\n- um\n- dois');
    expect(blocos.find((b) => b.tipo === 'lista').itens).toEqual(['um', 'dois']);
  });

  it('não quebra com texto vazio', () => {
    const vazio = parsePropostaAvulsa('');
    expect(vazio.blocos).toEqual([]);
    expect(vazio.campos).toEqual([]);
    expect(vazio.titulo).toBeNull();
    expect(parsePropostaAvulsa(null).blocos).toEqual([]);
  });
});

describe('tituloResumido', () => {
  it('usa o subtítulo, que descreve o serviço', () => {
    expect(tituloResumido(TEXTO)).toBe('Laudo Técnico – Avaliação dos Cabos de Tração de 02 Elevadores');
  });

  it('cai para o título quando não há subtítulo', () => {
    expect(tituloResumido('PROPOSTA COMERCIAL')).toBe('PROPOSTA COMERCIAL');
  });

  it('corta títulos muito longos', () => {
    const longo = `Título curto\n${'x'.repeat(200)}`;
    expect(tituloResumido(longo).length).toBeLessThanOrEqual(120);
  });

  it('devolve string vazia para texto vazio', () => {
    expect(tituloResumido('')).toBe('');
  });
});
