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
