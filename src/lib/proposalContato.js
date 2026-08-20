/**
 * Decide qual nome usar para o "A/C" (aos cuidados de) do documento.
 *
 * No cadastro do cliente existem dois campos que costumam se referir à mesma
 * pessoa: "Síndico (nome completo)" e "Nome do contato principal". Na prática
 * o contato principal é digitado abreviado ("Thiago") enquanto o do síndico
 * tem o nome inteiro — e o documento formal precisa do nome completo.
 *
 * A troca só acontece quando as duas fontes são claramente a mesma pessoa (o
 * nome do síndico começa pelo primeiro nome do contato) e o do síndico é
 * realmente mais completo. Se forem pessoas diferentes, o contato escolhido
 * na proposta é respeitado — quem assina a proposta pode não ser o síndico.
 */
export function nomeContatoCompleto({ contatoNome, sindicoNome }) {
  const contato = (contatoNome ?? '').trim();
  const sindico = (sindicoNome ?? '').trim();
  if (!sindico) return contato;
  if (!contato) return sindico;
  const primeiroNome = contato.split(/\s+/)[0].toLowerCase();
  const mesmaPessoa = sindico.toLowerCase().startsWith(primeiroNome);
  return mesmaPessoa && sindico.length > contato.length ? sindico : contato;
}
