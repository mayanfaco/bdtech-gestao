/**
 * Traduz erros do Supabase que, na mensagem original, não dizem nada para quem
 * está usando o sistema. Hoje cobre o caso mais comum: uma migration que ainda
 * não foi executada no banco, que chega como "Could not find the table ... in
 * the schema cache" (código PGRST205).
 */
export function mensagemDeErro(error, contexto = {}) {
  if (!error) return '';
  const texto = error.message ?? String(error);

  const tabelaFaltando = error.code === 'PGRST205' || /could not find the table/i.test(texto);
  if (tabelaFaltando) {
    const extra = contexto.migration
      ? ` Rode a migration ${contexto.migration} no SQL Editor do Supabase.`
      : '';
    return `Esta parte do sistema precisa de uma tabela que ainda não existe no banco.${extra}`;
  }

  return texto;
}
