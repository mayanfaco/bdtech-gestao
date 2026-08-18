import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { PropostaDocumentPreview } from '../../components/propostas/PropostaDocumentPreview.jsx';
import '../../print.css';

export default function PropostaPrint() {
  const { id } = useParams();
  const [proposal, setProposal] = React.useState(null);
  const [client, setClient] = React.useState(null);
  const [contact, setContact] = React.useState(null);
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    supabase.from('proposals').select('*').eq('id', id).single().then(({ data }) => {
      setProposal(data);
      if (data?.client_id) supabase.from('clients').select('*').eq('id', data.client_id).single().then(({ data: c }) => setClient(c));
      if (data?.contact_id) supabase.from('client_contacts').select('*').eq('id', data.contact_id).single().then(({ data: c }) => setContact(c));
    });
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
  }, [id]);

  if (!proposal || !settings) return null;

  return (
    <div style={{ background: 'var(--bd-surface-page)', minHeight: '100vh' }}>
      <div className="no-print" style={{ position: 'sticky', top: 0, background: 'var(--bd-navy-900)', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 10 }}>
        <Button size="sm" onClick={() => window.print()}>Imprimir / Exportar PDF</Button>
      </div>
      <PropostaDocumentPreview proposal={proposal} client={client} contact={contact} settings={settings} />
    </div>
  );
}
