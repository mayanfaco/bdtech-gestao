const normaliza = (s) => (s ?? '').trim().replace(/\s+/g, ' ');
const palavras = (s) => normaliza(s).toLowerCase().split(' ').filter(Boolean);

/**
 * Decide qual nome usar para o "A/C" (aos cuidados de) do documento.
 *
 * No cadastro do cliente existem dois campos que costumam se referir à mesma
 * pessoa: "Síndico (nome completo)" e "Nome do contato principal". O contato
 * principal costuma ser digitado abreviado ("Thiago") enquanto o do síndico
 * tem o nome inteiro — e o documento formal precisa do nome completo.
 *
 * A troca só acontece quando o nome do síndico é o MESMO nome do contato,
 * apenas mais completo: todas as palavras do contato aparecem nele, na mesma
 * ordem ("Thiago" → "Thiago Almeida Costa"). Nomes que divergem de fato
 * ("Alcides Julian Jr." vs "Alcides Zulian Jr.") não são trocados — corrigir
 * a grafia por conta própria esconderia um cadastro divergente, fazendo o
 * documento sair com um nome que não está em nenhum campo visível.
 * Divergências assim são sinalizadas no cadastro do cliente (ver
 * nomesProvavelmenteDivergentes).
 */
export function nomeContatoCompleto({ contatoNome, sindicoNome }) {
  const contato = normaliza(contatoNome);
  const sindico = normaliza(sindicoNome);
  if (!sindico) return contato;
  if (!contato) return sindico;

  const pc = palavras(contato);
  const ps = palavras(sindico);
  // Subsequência: o contato "cabe" dentro do nome do síndico, na ordem.
  let i = 0;
  for (const p of ps) { if (i < pc.length && p === pc[i]) i += 1; }
  const ehMesmoNomeMaisCompleto = i === pc.length && ps.length > pc.length;

  return ehMesmoNomeMaisCompleto ? sindico : contato;
}

/**
 * Sinaliza quando "Síndico (nome completo)" e "Nome do contato principal"
 * parecem ser a mesma pessoa escrita de forma diferente — normalmente um
 * campo foi corrigido e o outro ficou para trás. Serve para avisar no
 * cadastro, antes de a proposta sair com o nome desatualizado.
 *
 * Considera provável divergência quando os dois estão preenchidos, começam
 * pelo mesmo primeiro nome e nenhum é simplesmente a versão completa do
 * outro (esse caso é resolvido sozinho por nomeContatoCompleto).
 */
export function nomesProvavelmenteDivergentes({ contatoNome, sindicoNome }) {
  const contato = normaliza(contatoNome);
  const sindico = normaliza(sindicoNome);
  if (!contato || !sindico) return false;
  if (contato.toLowerCase() === sindico.toLowerCase()) return false;

  const pc = palavras(contato);
  const ps = palavras(sindico);
  if (pc[0] !== ps[0]) return false; // primeiro nome diferente = outra pessoa

  // Um é a versão completa do outro? Então não é divergência, é abreviação.
  const cabeDentro = (menor, maior) => {
    let i = 0;
    for (const p of maior) { if (i < menor.length && p === menor[i]) i += 1; }
    return i === menor.length;
  };
  if (cabeDentro(pc, ps) || cabeDentro(ps, pc)) return false;

  return true;
}
