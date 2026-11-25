const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function monthLabel(date) {
  return `${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function weekdayLabels() {
  return DIAS_SEMANA;
}

/** Retorna a grade de dias (6 semanas x 7 dias) para o mês do `date` informado. */
export function monthGrid(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const start = new Date(year, month, 1 - startWeekday);

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/** Hoje no fuso de quem usa: toISOString() já vira o dia seguinte às 21h em Fortaleza. */
export function hojeLocal() {
  return new Date().toLocaleDateString('en-CA');
}

/** "2026-11-05" → "5 de novembro de 2026". */
export function dataLonga(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return '—';
  return `${dia} de ${MESES[mes - 1].toLowerCase()} de ${ano}`;
}

/** Soma dias a uma data "AAAA-MM-DD" (sem fuso). */
export function addDias(iso, dias) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** "2026-11-05" → "05/11/2026". */
export function dataCurta(iso) {
  if (!iso) return '—';
  return iso.split('-').reverse().join('/');
}
