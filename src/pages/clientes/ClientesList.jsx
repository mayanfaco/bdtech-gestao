import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

export default function ClientesList() {
  const [clients, setClients] = React.useState(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    supabase.from('clients').select('*').order('nome').then(({ data }) => setClients(data ?? []));
  }, []);

  if (clients === null) return null;

  const filtered = clients.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4">
        <div style={{ maxWidth: 320, flex: 1 }}>
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button as={Link} to="/clientes/novo">Novo cliente</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado ainda"
          text="Cadastre o primeiro condomínio ou empreendimento para começar a emitir propostas."
          action={<Button as={Link} to="/clientes/novo">Novo cliente</Button>}
        />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {filtered.map((c) => (
            <Link key={c.id} to={`/clientes/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-5) var(--bd-space-6)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)' }}>{c.nome}</div>
                    <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
                      {c.contato_nome || 'Sem contato cadastrado'}{c.qtd_elevadores ? ` · ${c.qtd_elevadores} elevador(es)` : ''}
                    </div>
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
