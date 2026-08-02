import React from 'react';
import { supabase } from './supabaseClient.js';

/** As etapas do funil de oportunidades, em ordem, configuráveis em Configurações. */
export function usePipelineStages() {
  const [stages, setStages] = React.useState(null);
  React.useEffect(() => {
    supabase.from('pipeline_stages').select('*').eq('active', true).order('order_index')
      .then(({ data }) => setStages(data ?? []));
  }, []);
  return stages;
}
