import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { ReciboDocument } from '../../components/recibos/ReciboDocument.jsx';
import '../../print.css';

export default function ReciboPrint() {
  const { id } = useParams();
  const [recibo, setRecibo] = React.useState(null);
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    supabase.from('receipts').select('*').eq('id', id).single().then(({ data }) => setRecibo(data));
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
  }, [id]);

  if (!recibo) return null;

  return (
    <div>
      <div className="no-print" style={{ position: 'sticky', top: 0, background: 'var(--bd-navy-900)', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 10 }}>
        <Button size="sm" onClick={() => window.print()}>Imprimir / Exportar PDF</Button>
      </div>
      <ReciboDocument recibo={recibo} settings={settings} />
    </div>
  );
}
