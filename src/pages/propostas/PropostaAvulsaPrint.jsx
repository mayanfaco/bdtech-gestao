import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { PropostaAvulsaDocument } from '../../components/propostas/PropostaAvulsaDocument.jsx';
import '../../print.css';

export default function PropostaAvulsaPrint() {
  const { id } = useParams();
  const [proposta, setProposta] = React.useState(null);
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    supabase.from('standalone_proposals').select('*').eq('id', id).single().then(({ data }) => setProposta(data));
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
  }, [id]);

  if (!proposta) return null;

  return (
    <div style={{ background: 'var(--bd-surface-page)', minHeight: '100vh' }}>
      <div className="no-print" style={{
        position: 'sticky', top: 0, background: 'var(--bd-navy-900)', padding: '14px 24px',
        display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 10,
      }}>
        <Button size="sm" onClick={() => window.print()}>Imprimir / Exportar PDF</Button>
      </div>
      <PropostaAvulsaDocument texto={proposta.corpo} settings={settings} />
    </div>
  );
}
