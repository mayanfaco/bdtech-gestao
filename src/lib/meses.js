// Mês no formato "AAAA-MM". '' significa "todos os meses".

const NOMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function mesAtual() {
  return new Date().toLocaleDateString('en-CA').slice(0, 7);
}

export function mudarMes(mes, delta) {
  const [ano, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(ano, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** "2026-11" → "Novembro de 2026"; minúsculo com { minusculo: true } (para meio de frase). */
export function mesLabel(mes, { minusculo = false } = {}) {
  if (!mes) return minusculo ? 'todos os meses' : 'Todos os meses';
  const [ano, m] = mes.split('-').map(Number);
  const nome = NOMES[m - 1];
  return `${minusculo ? nome : nome.charAt(0).toUpperCase() + nome.slice(1)} de ${ano}`;
}

/** A data (AAAA-MM-DD ou timestamp ISO) cai no mês? Sem mês escolhido, tudo passa. */
export function noMes(data, mes) {
  if (!mes) return true;
  if (!data) return false;
  const dia = String(data).length > 10 ? new Date(data).toLocaleDateString('en-CA') : String(data);
  return dia.startsWith(mes);
}

/** Contrato vigente em algum dia do mês (sem término = segue vigente). */
export function vigenteNoMes(inicio, termino, mes) {
  if (!mes) return true;
  if (!inicio) return false;
  const primeiroDia = `${mes}-01`;
  const ultimoDia = `${mudarMes(mes, 1)}-01`;
  return inicio < ultimoDia && (!termino || termino >= primeiroDia);
}
