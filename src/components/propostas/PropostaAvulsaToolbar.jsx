import React from 'react';

const CSS = `
.bd-avulsa-toolbar{display:flex;flex-wrap:wrap;gap:4px;padding:6px;border:1px solid var(--bd-border-default);
  border-radius:var(--bd-radius-md);background:var(--bd-surface-sunken);}
.bd-avulsa-toolbar button{all:unset;cursor:pointer;padding:5px 9px;border-radius:var(--bd-radius-sm);
  font-family:var(--bd-font-text);font-size:12.5px;font-weight:600;color:var(--bd-text-body);
  transition:background var(--bd-duration-fast),color var(--bd-duration-fast);white-space:nowrap;}
.bd-avulsa-toolbar button:hover{background:var(--bd-surface-card);color:var(--bd-primary-600);}
.bd-avulsa-toolbar button:focus-visible{outline:2px solid var(--bd-focus-ring);outline-offset:-1px;}
.bd-avulsa-toolbar__sep{width:1px;align-self:stretch;background:var(--bd-border-default);margin:2px 3px;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-avulsa-toolbar-css')) {
  const s = document.createElement('style');
  s.id = 'bd-avulsa-toolbar-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Barra de formatação para a área de texto da proposta avulsa. Em vez de o
 * usuário decorar a marcação, os botões a aplicam sobre a seleção — e o
 * cursor/seleção é restaurado depois, para dar continuidade à digitação.
 */
export function PropostaAvulsaToolbar({ textareaRef, valor, onChange }) {
  // Aplica uma transformação e devolve o foco com a nova seleção.
  function aplicar(transforma) {
    const el = textareaRef.current;
    if (!el) return;
    const inicio = el.selectionStart;
    const fim = el.selectionEnd;
    const { texto, selecao } = transforma({
      antes: valor.slice(0, inicio),
      selecionado: valor.slice(inicio, fim),
      depois: valor.slice(fim),
      inicio,
      fim,
    });
    onChange(texto);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selecao[0], selecao[1]);
    });
  }

  // Envolve a seleção em marcadores. Sem seleção, insere os marcadores e
  // deixa o cursor no meio, pronto para digitar.
  const envolver = (marca) => () => aplicar(({ antes, selecionado, depois, inicio }) => {
    const conteudo = selecionado || 'texto';
    return {
      texto: `${antes}${marca}${conteudo}${marca}${depois}`,
      selecao: [inicio + marca.length, inicio + marca.length + conteudo.length],
    };
  });

  // Prefixa cada linha da seleção. `prefixo` recebe o índice da linha, para
  // dar conta da numeração (1., 2., 3.).
  const prefixarLinhas = (prefixo) => () => aplicar(({ antes, selecionado, depois, inicio }) => {
    const linhas = (selecionado || 'item').split('\n');
    const marcadas = linhas.map((linha, i) => `${prefixo(i)}${linha.replace(/^\s*([*\-•]|\d+[.)])\s*/, '')}`);
    const bloco = marcadas.join('\n');
    // Garante que a lista comece em uma linha própria.
    const precisaQuebra = antes.length > 0 && !antes.endsWith('\n');
    const texto = `${antes}${precisaQuebra ? '\n' : ''}${bloco}${depois}`;
    const deslocamento = inicio + (precisaQuebra ? 1 : 0);
    return { texto, selecao: [deslocamento, deslocamento + bloco.length] };
  });

  // Insere um título de seção em maiúsculas, numerado na sequência do texto.
  const inserirSecao = () => aplicar(({ antes, selecionado, depois }) => {
    const usados = [...valor.matchAll(/^(\d{1,2})\s*[.)-]\s*\p{Lu}/gmu)].map((m) => Number(m[1]));
    const proximo = usados.length ? Math.max(...usados) + 1 : 1;
    const titulo = (selecionado || 'NOVA SEÇÃO').toLocaleUpperCase('pt-BR');
    const prefixoQuebra = antes.length > 0 && !antes.endsWith('\n\n') ? (antes.endsWith('\n') ? '\n' : '\n\n') : '';
    const linha = `${proximo}. ${titulo}`;
    const texto = `${antes}${prefixoQuebra}${linha}\n\n${depois}`;
    const posicao = antes.length + prefixoQuebra.length + `${proximo}. `.length;
    return { texto, selecao: [posicao, posicao + titulo.length] };
  });

  return (
    <div className="bd-avulsa-toolbar">
      <button type="button" onClick={envolver('**')} title="Negrito"><strong>B</strong></button>
      <button type="button" onClick={envolver('*')} title="Itálico"><em>I</em></button>
      <span className="bd-avulsa-toolbar__sep" />
      <button type="button" onClick={inserirSecao} title="Título de seção numerado">Seção</button>
      <button type="button" onClick={prefixarLinhas(() => '* ')} title="Lista com marcadores">• Lista</button>
      <button type="button" onClick={prefixarLinhas((i) => `${i + 1}. `)} title="Lista numerada">1. Numerada</button>
    </div>
  );
}
