// Link "Adicionar ao Google Calendar" — não depende de OAuth nem de
// credenciais: é só uma URL pública do Google que pré-preenche um evento
// para o usuário confirmar e salvar na própria conta. A sincronização real
// (criar/editar/cancelar automaticamente) é a integração via Supabase Edge
// Functions em supabase/functions/google-calendar-sync — essa aqui funciona
// hoje, sem nenhuma configuração.

function toGoogleDate(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z', 'Z');
}

export function googleCalendarLink(event) {
  const start = new Date(event.data_inicio);
  const end = event.data_fim ? new Date(event.data_fim) : new Date(start.getTime() + 60 * 60 * 1000);
  const dates = `${toGoogleDate(start.toISOString())}/${toGoogleDate(end.toISOString())}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.titulo ?? '',
    dates,
    details: event.descricao ?? '',
    location: event.local ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
