// Supabase Edge Function — troca o "code" do Google por tokens e salva a
// conexão. Usa o service role (única função com esse acesso) para gravar
// diretamente em google_calendar_connections, ignorando RLS.
// Deploy: supabase functions deploy google-oauth-callback
// Segredos: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
//           SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return new Response('Missing code/state', { status: 400 });

  let userId: string;
  try {
    const parsed = JSON.parse(atob(state));
    userId = parsed.userId;
    if (!userId) throw new Error('no userId');
  } catch {
    return new Response('Invalid state', { status: 400 });
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    return Response.redirect(`${APP_URL}/configuracoes/integracoes/google-calendar?error=token_exchange`, 302);
  }

  const calendarListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const calendarList = calendarListRes.ok ? await calendarListRes.json() : { items: [] };
  const primary = (calendarList.items ?? []).find((c: { primary?: boolean }) => c.primary);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  await supabase.from('google_calendar_connections').upsert({
    user_id: userId,
    access_token: tokenJson.access_token,
    refresh_token: tokenJson.refresh_token,
    token_expires_at: new Date(Date.now() + tokenJson.expires_in * 1000).toISOString(),
    connected_calendars: calendarList.items ?? [],
    primary_calendar_id: primary?.id ?? 'primary',
    is_active: true,
    last_sync_error: null,
  }, { onConflict: 'user_id' });

  return Response.redirect(`${APP_URL}/configuracoes/integracoes/google-calendar?connected=1`, 302);
});
