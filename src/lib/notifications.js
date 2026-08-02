import React from 'react';
import { supabase } from './supabaseClient.js';

/** Contagem de notificações não lidas do usuário logado, com um refresh manual. */
export function useUnreadNotifications() {
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback(() => {
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .is('archived_at', null).eq('is_read', false)
      .then(({ count: c }) => setCount(c ?? 0));
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  return { count, refresh };
}
