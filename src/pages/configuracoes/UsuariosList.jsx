import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Switch } from '../../design-system/components/forms/Switch.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';

export default function UsuariosList() {
  const [profiles, setProfiles] = React.useState(null);
  const [roles, setRoles] = React.useState([]);

  const load = React.useCallback(() => {
    supabase.from('user_profiles').select('*, roles(key, label)').order('display_name').then(({ data }) => setProfiles(data ?? []));
    supabase.from('roles').select('*').then(({ data }) => setRoles(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function updateRole(profileId, roleId) {
    await supabase.from('user_profiles').update({ role_id: roleId }).eq('id', profileId);
    load();
  }

  async function toggleActive(profile) {
    await supabase.from('user_profiles').update({ active: !profile.active }).eq('id', profile.id);
    load();
  }

  if (profiles === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-4">
      <h1 style={{ fontSize: 22 }}>Usuários</h1>
      {profiles.length === 0 ? (
        <EmptyState title="Nenhum usuário cadastrado" text="Crie usuários em Authentication → Users no Supabase; eles aparecem aqui depois de vinculados a um perfil." />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {profiles.map((p) => (
            <Card key={p.id} padding="lg">
              <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <strong>{p.display_name || 'Sem nome'}</strong>
                  {!p.active && <Badge tone="neutral" style={{ marginLeft: 8 }}>Inativo</Badge>}
                </div>
                <div className="bd-u-flex bd-u-items-center bd-u-gap-4">
                  <div style={{ width: 180 }}>
                    <Select value={p.role_id ?? ''} onChange={(e) => updateRole(p.id, e.target.value)}
                      options={roles.map((r) => ({ value: r.id, label: r.label }))} />
                  </div>
                  <Switch label="Ativo" checked={p.active} onChange={() => toggleActive(p)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
