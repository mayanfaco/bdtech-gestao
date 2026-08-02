import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Checkbox } from '../../design-system/components/forms/Checkbox.jsx';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' }, { key: 'crm_leads', label: 'Leads' },
  { key: 'crm_oportunidades', label: 'Oportunidades' }, { key: 'clientes', label: 'Clientes' },
  { key: 'propostas', label: 'Propostas' }, { key: 'contratos', label: 'Contratos' },
  { key: 'agenda', label: 'Agenda' }, { key: 'tarefas', label: 'Tarefas' },
  { key: 'configuracoes', label: 'Configurações' }, { key: 'usuarios', label: 'Usuários' },
];
const ACTIONS = ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'administrar'];

export default function PerfisPermissoes() {
  const [roles, setRoles] = React.useState([]);
  const [permissions, setPermissions] = React.useState([]);
  const [selectedRole, setSelectedRole] = React.useState('');

  const load = React.useCallback(() => {
    supabase.from('roles').select('*').order('key').then(({ data }) => {
      setRoles(data ?? []);
      setSelectedRole((prev) => prev || data?.[0]?.id || '');
    });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    if (!selectedRole) return;
    supabase.from('role_permissions').select('*').eq('role_id', selectedRole).then(({ data }) => setPermissions(data ?? []));
  }, [selectedRole]);

  function isAllowed(module, action) {
    return permissions.find((p) => p.module === module && p.action === action)?.allowed ?? false;
  }

  async function toggle(module, action) {
    const existing = permissions.find((p) => p.module === module && p.action === action);
    if (existing) {
      await supabase.from('role_permissions').update({ allowed: !existing.allowed }).eq('id', existing.id);
    } else {
      await supabase.from('role_permissions').insert({ role_id: selectedRole, module, action, allowed: true });
    }
    const { data } = await supabase.from('role_permissions').select('*').eq('role_id', selectedRole);
    setPermissions(data ?? []);
  }

  return (
    <div className="bd-u-flex-col bd-u-gap-4">
      <h1 style={{ fontSize: 22 }}>Perfis e permissões</h1>
      <div className="bd-u-flex bd-u-gap-2">
        {roles.map((r) => (
          <button key={r.id} className={`bdbtn bdbtn--sm ${selectedRole === r.id ? 'bdbtn--primary' : 'bdbtn--outline'}`}
            onClick={() => setSelectedRole(r.id)} type="button">{r.label}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid var(--bd-border-default)' }}>Módulo</th>
              {ACTIONS.map((a) => (
                <th key={a} style={{ padding: 8, borderBottom: '2px solid var(--bd-border-default)', textTransform: 'capitalize' }}>{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key}>
                <td style={{ padding: 8, borderBottom: '1px solid var(--bd-border-subtle)', fontWeight: 600 }}>{m.label}</td>
                {ACTIONS.map((a) => (
                  <td key={a} style={{ padding: 8, borderBottom: '1px solid var(--bd-border-subtle)', textAlign: 'center' }}>
                    <Checkbox checked={isAllowed(m.key, a)} onChange={() => toggle(m.key, a)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
