import React from 'react';
import { supabase } from './supabaseClient.js';

/** Lista de usuários ativos (para selects de "responsável"). */
export function useStaffOptions() {
  const [options, setOptions] = React.useState([]);
  React.useEffect(() => {
    supabase.from('user_profiles').select('id, display_name').eq('active', true)
      .then(({ data }) => setOptions((data ?? []).map((u) => ({ value: u.id, label: u.display_name || 'Sem nome' }))));
  }, []);
  return options;
}
