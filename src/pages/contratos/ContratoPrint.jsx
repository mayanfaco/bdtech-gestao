import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { ContratoDocumentPreview } from '../../components/contratos/ContratoDocumentPreview.jsx';
import '../../print.css';

export default function ContratoPrint() {
  const { id } = useParams();
  const [contract, setContract] = React.useState(null);

  React.useEffect(() => {
    supabase.from('contracts').select('*').eq('id', id).single().then(({ data }) => setContract(data));
  }, [id]);

  if (!contract) return null;

  return (
    <div style={{ background: 'var(--bd-surface-page)', minHeight: '100vh' }}>
      <div className="no-print" style={{ position: 'sticky', top: 0, background: 'var(--bd-navy-900)', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 10 }}>
        <Button size="sm" onClick={() => window.print()}>Imprimir / Exportar PDF</Button>
      </div>
      <ContratoDocumentPreview contract={contract} />
    </div>
  );
}
