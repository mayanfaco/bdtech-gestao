/**
 * Converte o texto colado de uma proposta avulsa em blocos estruturados, para
 * que o documento saia com a identidade visual da BDTECH sem o usuário ter de
 * preencher campo nenhum — ele cola e o documento se monta.
 *
 * O que é reconhecido:
 *   "1. OBJETO"                  -> seção numerada
 *   "* item" / "- item"          -> lista
 *   "À: ..." / "A/C: ..."        -> campos do destinatário (só no início)
 *   "Atenciosamente,"            -> daí para baixo é assinatura
 *   primeira/segunda linha soltas -> título e subtítulo
 *   o resto                      -> parágrafos
 *
 * Linhas que só repetem a identificação da BDTECH são descartadas: o cabeçalho
 * e o rodapé do documento já trazem a marca, o nome do engenheiro e o CREA a
 * partir do cadastro da empresa.
 */

const PADROES_EMPRESA = [
  /^bdtech\b/i,
  /^engenharia mec[âa]nica\s*[|·-]/i,
  /^consultoria t[ée]cnica em elevadores$/i,
];

// Na assinatura, nome do engenheiro e CREA vêm do cadastro da empresa.
const PADROES_ASSINATURA_REDUNDANTE = [
  /^eng\.?[º°ª]?\s/i,
  /^engenheiro\b/i,
  /^crea\b/i,
];

const RE_SECAO = /^(\d{1,2})\s*[.)-]\s*(.+)$/;
// Negrito **assim** e itálico *assim*. Só asteriscos: "_" apareceria dentro de
// placeholders como "[____]" e viraria formatação por acidente.
const RE_INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
const RE_ITEM = /^[*\-•–]\s*(.+)$/;
const RE_CAMPO = /^(À|A|A\/C|AC|Data|Ref|Refer[êe]ncia|Cliente|Contato|Local)\s*:\s*(.*)$/i;
const RE_FECHAMENTO = /^(atenciosamente|cordialmente|respeitosamente|sem mais)[,.!]?$/i;

const ehEmpresa = (linha) => PADROES_EMPRESA.some((re) => re.test(linha));
const ehAssinaturaRedundante = (linha) => PADROES_ASSINATURA_REDUNDANTE.some((re) => re.test(linha));

/**
 * Quebra um texto em pedaços com e sem formatação, para o componente montar
 * <strong>/<em> como elementos React — nunca HTML injetado.
 * "Valor **R$ 100** hoje" -> [texto, negrito, texto]
 */
export function parseInline(texto) {
  const bruto = String(texto ?? '');
  if (!bruto) return [];
  return bruto.split(RE_INLINE).filter((p) => p !== '').map((parte) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      return { tipo: 'negrito', valor: parte.slice(2, -2) };
    }
    if (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2) {
      return { tipo: 'italico', valor: parte.slice(1, -1) };
    }
    return { tipo: 'texto', valor: parte };
  });
}

/**
 * Distingue título de seção ("1. OBJETO") de item de lista numerada
 * ("1. primeiro item"): títulos de seção são escritos em maiúsculas.
 */
function ehTituloDeSecao(texto) {
  const letras = texto.replace(/[^\p{L}]/gu, '');
  if (letras.length < 2) return false;
  const maiusculas = [...letras].filter((c) => c === c.toLocaleUpperCase('pt-BR') && c !== c.toLocaleLowerCase('pt-BR')).length;
  return maiusculas / letras.length > 0.7;
}

export function parsePropostaAvulsa(texto) {
  const linhas = String(texto ?? '').split(/\r?\n/);

  let titulo = null;
  let subtitulo = null;
  const campos = [];
  const blocos = [];
  const assinatura = [];

  let emAssinatura = false;
  let lista = null;
  let paragrafo = null;

  let listaNumerada = false;
  const fechaLista = () => {
    if (lista?.length) blocos.push({ tipo: 'lista', numerada: listaNumerada, itens: lista });
    lista = null;
    listaNumerada = false;
  };
  const fechaParagrafo = () => {
    if (paragrafo?.length) blocos.push({ tipo: 'paragrafo', texto: paragrafo.join(' ') });
    paragrafo = null;
  };
  const fechaTudo = () => { fechaLista(); fechaParagrafo(); };

  // Campos do destinatário valem enquanto o conteúdo não começou — vários
  // seguidos ("À:", "A/C:", "Data:") continuam no preâmbulo.
  const aceitaCampo = () => blocos.length === 0;
  // Título/subtítulo, ao contrário, só antes de qualquer campo: uma linha
  // solta depois do destinatário já é conteúdo, não cabeçalho.
  const aceitaTitulo = () => blocos.length === 0 && campos.length === 0;

  for (const bruta of linhas) {
    const linha = bruta.trim();

    if (!linha) { fechaTudo(); continue; }
    if (ehEmpresa(linha)) { fechaTudo(); continue; }

    if (emAssinatura) {
      if (!ehAssinaturaRedundante(linha)) assinatura.push(linha);
      continue;
    }
    if (RE_FECHAMENTO.test(linha)) { fechaTudo(); emAssinatura = true; continue; }

    const secao = linha.match(RE_SECAO);
    if (secao) {
      const titulo = secao[2].trim();
      if (ehTituloDeSecao(titulo)) {
        fechaTudo();
        blocos.push({ tipo: 'secao', numero: secao[1], titulo });
        continue;
      }
      // Numerada com texto normal: é item de lista, não título de seção.
      fechaParagrafo();
      if (!lista) { lista = []; listaNumerada = true; }
      lista.push(titulo);
      continue;
    }

    const item = linha.match(RE_ITEM);
    if (item) {
      fechaParagrafo();
      if (!lista) lista = [];
      lista.push(item[1].trim());
      continue;
    }

    const campo = linha.match(RE_CAMPO);
    if (campo && aceitaCampo()) {
      fechaTudo();
      campos.push({ rotulo: campo[1].trim(), valor: campo[2].trim() });
      continue;
    }

    if (aceitaTitulo() && !paragrafo) {
      if (titulo === null) { titulo = linha; continue; }
      if (subtitulo === null) { subtitulo = linha; continue; }
    }

    fechaLista();
    if (!paragrafo) paragrafo = [];
    paragrafo.push(linha);
  }

  fechaTudo();

  return { titulo, subtitulo, campos, blocos, assinatura };
}

/**
 * Título curto para listagens: usa o subtítulo (que costuma descrever o
 * serviço) e cai para o título ou para a primeira linha com conteúdo.
 */
export function tituloResumido(texto) {
  const { titulo, subtitulo, blocos } = parsePropostaAvulsa(texto);
  const primeiroParagrafo = blocos.find((b) => b.tipo === 'paragrafo')?.texto;
  const escolhido = subtitulo || titulo || primeiroParagrafo || '';
  return escolhido.length > 120 ? `${escolhido.slice(0, 117)}...` : escolhido;
}
