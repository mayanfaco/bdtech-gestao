// Supabase Edge Function — proxy de criar/editar/cancelar evento no Google
// Calendar. Chamado pelo frontend via supabase.functions.invoke(...) sempre
// que um evento local é criado/editado/cancelado, ou por um pg_cron para
// reconciliação periódica e renovação de token.
// Deploy: supabase functions deploy google-calendar-sync
// Segredos: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function ensureFreshToken(connection: any) {
  if (new Date(connection.token_expires_at) > new Date(Date.now() + 60_000)) {
    return connection.access_token;
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: connection.refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`token_refresh_failed: ${JSON.stringify(json)}`);
  await supabase.from('google_calendar_connections').update({
    access_token: json.access_token,
    token_expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
  }).eq('id', connection.id);
  return json.access_token;
}

async function logError(userId: string, message: string) {
  await supabase.from('google_calendar_connections').update({ last_sync_error: message }).eq('user_id', userId);
  await supabase.from('notifications').insert({
    user_id: userId, type: 'google_sync_error', title: 'Erro ao sincronizar com o Google Calendar',
    body: message, severity: 'atencao',
  });
}

Deno.serve(async (req) => {
  const { action, calendar_event_id } = await req.json();

  const { data: event } = await supabase.from('calendar_events').select('*').eq('id', calendar_event_id).single();
  if (!event) return new Response('Event not found', { status: 404 });

  const { data: connection } = await supabase.from('google_calendar_connections')
    .select('*').eq('user_id', event.created_by).eq('is_active', true).maybeSingle();
  if (!connection) return new Response(JSON.stringify({ skipped: 'no_connection' }), { status: 200 });

  try {
    const accessToken = await ensureFreshToken(connection);
    const calendarId = connection.primary_calendar_id ?? 'primary';
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    if (action === 'cancel' && event.google_event_id) {
      await fetch(`${base}/${event.google_event_id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      await supabase.from('calendar_events').update({ synced_at: new Date().toISOString() }).eq('id', event.id);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const body = {
      summary: event.titulo,
      description: event.descricao ?? undefined,
      location: event.local ?? undefined,
      start: event.all_day ? { date: event.data_inicio.slice(0, 10) } : { dateTime: event.data_inicio },
      end: event.all_day ? { date: (event.data_fim ?? event.data_inicio).slice(0, 10) } : { dateTime: event.data_fim ?? event.data_inicio },
    };

    // Upsert por google_event_id — nunca cria um evento duplicado no Google.
    const method = event.google_event_id ? 'PATCH' : 'POST';
    const endpoint = event.google_event_id ? `${base}/${event.google_event_id}` : base;
    const res = await fetch(endpoint, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));

    await supabase.from('calendar_events').update({
      google_event_id: json.id, google_calendar_id: calendarId, synced_at: new Date().toISOString(),
    }).eq('id', event.id);

    return new Response(JSON.stringify({ ok: true, google_event_id: json.id }), { status: 200 });
  } catch (err) {
    await logError(event.created_by, err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: 'sync_failed' }), { status: 500 });
  }
});
