import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';

export default function PropostaVersoes() {
  const { id } = useParams();
  const [versions, setVersions] = React.useState(null);

  React.useEffect(() => {
    supabase.from('proposal_versions').select('*').eq('proposal_id', id).order('numero_versao', { ascending: false })
      .then(({ data }) => setVersions(data ?? []));
  }, [id]);

  if (versions === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-4">
      <h1 style={{ fontSize: 22 }}>Histórico de versões</h1>
      {versions.length === 0 ? (
        <EmptyState title="Nenhuma versão registrada" text="Versões aparecem aqui a partir da primeira edição feita depois do envio da proposta." />
      ) : (
        versions.map((v) => (
          <Card key={v.id} padding="lg">
            <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
              <strong>Versão {v.numero_versao}</strong>
              <span style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>{new Date(v.created_at).toLocaleString('pt-BR')}</span>
            </div>
            {v.motivo && <p style={{ margin: '8px 0 0' }}>{v.motivo}</p>}
            {v.changed_fields && (
              <pre style={{ fontSize: 12, background: 'var(--bd-surface-sunken)', padding: 12, borderRadius: 8, marginTop: 8, overflowX: 'auto' }}>
                {JSON.stringify(v.changed_fields, null, 2)}
              </pre>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
