import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { BackButton } from '../../components/BackButton.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { I } from '../../components/layout/icons.jsx';

const label = (p) => `PROP-AV-${new Date(p.created_at).getFullYear()}-${String(p.numero).padStart(4, '0')}`;

export default function PropostasAvulsasList() {
  const [propostas, setPropostas] = React.useState(null);

  const load = React.useCallback(() => {
    supabase.from('standalone_proposals').select('*').is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPropostas(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(e, p) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Excluir a proposta avulsa ${label(p)}? Ela deixa de aparecer na lista.`)) return;
    const { error } = await supabase.from('standalone_proposals')
      .update({ deleted_at: new Date().toISOString() }).eq('id', p.id);
    if (error) { alert(error.message); return; }
    load();
  }

  if (propostas === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <BackButton to="/propostas" label="Voltar para Propostas" />

      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4">
        <div>
          <h1 style={{ fontSize: 22, fontFamily: 'var(--bd-font-display)' }}>Propostas avulsas</h1>
          <p style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
            Para serviços fora dos modelos padrão: cole o texto e o documento sai com a identidade da BDTECH.
          </p>
        </div>
        <Button as={Link} to="/propostas/avulsas/nova">Nova proposta avulsa</Button>
      </div>

      {propostas.length === 0 ? (
        <EmptyState
          title="Nenhuma proposta avulsa ainda"
          text="Use este espaço para propostas de serviços específicos — laudos, avaliações, pareceres — colando o texto pronto."
          action={<Button as={Link} to="/propostas/avulsas/nova">Nova proposta avulsa</Button>}
        />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {propostas.map((p) => (
            <Link key={p.id} to={`/propostas/avulsas/${p.id}/editar`} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-5) var(--bd-space-6)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)' }}>
                      {label(p)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
                      {p.titulo || 'Sem título'}
                    </div>
                  </div>
                  <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ flex: '0 0 auto' }}>
                    <span style={{ fontSize: 12, color: 'var(--bd-text-subtle)' }}>
                      {new Date(p.updated_at ?? p.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <IconButton label="Excluir proposta avulsa" size="sm" onClick={(e) => handleDelete(e, p)}>
                      <span style={{ color: 'var(--bd-danger-500)', display: 'flex' }}>{I.trash}</span>
                    </IconButton>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
