import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { useUnreadNotifications } from '../../lib/notifications.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';

const SEVERITY_TONE = { info: 'brand', atencao: 'warning', urgente: 'danger' };

export default function NotificacoesCentro() {
  const navigate = useNavigate();
  const { refresh } = useUnreadNotifications();
  const [notifications, setNotifications] = React.useState(null);

  const load = React.useCallback(() => {
    supabase.from('notifications').select('*').is('archived_at', null).order('created_at', { ascending: false })
      .then(({ data }) => setNotifications(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function markRead(n) {
    if (!n.is_read) await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', n.id);
    if (n.route) navigate(n.route);
    load(); refresh();
  }

  async function archive(id) {
    await supabase.from('notifications').update({ archived_at: new Date().toISOString() }).eq('id', id);
    load(); refresh();
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).is('archived_at', null).eq('is_read', false);
    load(); refresh();
  }

  if (notifications === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-4">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <h1 style={{ fontSize: 22 }}>Notificações</h1>
        <Button variant="outline" size="sm" onClick={markAllRead}>Marcar todas como lidas</Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="Nenhuma notificação" text="Alertas de tarefas, propostas e contratos aparecem aqui." />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {notifications.map((n) => (
            <Card key={n.id} interactive={!n.is_read} style={!n.is_read ? { borderColor: 'var(--bd-primary-300)' } : undefined}>
              <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-4) var(--bd-space-5)' }}>
                <div onClick={() => markRead(n)} style={{ cursor: 'pointer', flex: 1 }}>
                  <div className="bd-u-flex bd-u-items-center bd-u-gap-2">
                    <strong style={{ fontWeight: n.is_read ? 400 : 700 }}>{n.title}</strong>
                    <Badge tone={SEVERITY_TONE[n.severity]}>{n.severity}</Badge>
                  </div>
                  {n.body && <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: 'var(--bd-text-subtle)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('pt-BR')}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => archive(n.id)}>Arquivar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
