// Supabase Edge Function — inicia o fluxo OAuth do Google Calendar.
// Deploy: supabase functions deploy google-oauth-start
// Segredos necessários: GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, SUPABASE_URL, SUPABASE_ANON_KEY
//
// Chamada pelo frontend como um redirect de página inteira (não fetch):
//   window.location.href = `${SUPABASE_URL}/functions/v1/google-oauth-start?token=${session.access_token}`

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return new Response('Missing token', { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return new Response('Invalid session', { status: 401 });

  // state carrega o user id + nonce; o callback confere que veio daqui.
  const nonce = crypto.randomUUID();
  const state = btoa(JSON.stringify({ userId: userData.user.id, nonce }));

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/calendar',
    state,
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
});
