import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';

const STATUS_LABEL = { pendente: 'Pendente', em_andamento: 'Em andamento', aguardando_terceiros: 'Aguardando terceiros', concluida: 'Concluída', cancelada: 'Cancelada' };
const STATUS_TONE = { pendente: 'brand', em_andamento: 'warning', aguardando_terceiros: 'neutral', concluida: 'success', cancelada: 'neutral' };
const PRIORIDADE_TONE = { baixa: 'neutral', media: 'brand', alta: 'warning', urgente: 'danger' };

export default function TarefasList() {
  const [tasks, setTasks] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [searchParams] = useSearchParams();
  const urlVencidas = searchParams.get('vencidas') === '1';
  const urlPendentes = searchParams.get('pendentes') === '1';
  const vindoDaDash = urlVencidas || urlPendentes;

  React.useEffect(() => {
    supabase.from('tasks').select('*').is('deleted_at', null).order('prazo', { ascending: true, nullsFirst: false })
      .then(({ data }) => setTasks(data ?? []));
  }, []);

  if (tasks === null) return null;
  const now = new Date();
  let filtered = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;
  if (urlPendentes) filtered = filtered.filter((t) => !['concluida', 'cancelada'].includes(t.status));
  if (urlVencidas) filtered = filtered.filter((t) => t.prazo && new Date(t.prazo) < now && !['concluida', 'cancelada'].includes(t.status));

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      {vindoDaDash && (
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
          Filtro vindo do painel executivo · {filtered.length} tarefa(s)
          <Link to="/tarefas/lista" style={{ color: 'var(--bd-primary-600)' }}>Limpar filtro</Link>
        </div>
      )}
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div style={{ maxWidth: 220 }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Todos os status" options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        </div>
        <Button as={Link} to="/tarefas/nova">Nova tarefa</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma tarefa por aqui" action={<Button as={Link} to="/tarefas/nova">Nova tarefa</Button>} />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {filtered.map((t) => {
            const atrasada = t.prazo && new Date(t.prazo) < now && !['concluida', 'cancelada'].includes(t.status);
            return (
              <Link key={t.id} to={`/tarefas/${t.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <Card interactive style={atrasada ? { borderColor: 'var(--bd-danger-500)' } : undefined}>
                  <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-4) var(--bd-space-5)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)' }}>{t.titulo}</div>
                      <div style={{ fontSize: 13, color: atrasada ? 'var(--bd-danger-500)' : 'var(--bd-text-muted)', marginTop: 2 }}>
                        {t.prazo ? new Date(t.prazo).toLocaleString('pt-BR') : 'Sem prazo'}{atrasada ? ' · Atrasada' : ''}
                      </div>
                    </div>
                    <div className="bd-u-flex bd-u-gap-2">
                      <Badge tone={PRIORIDADE_TONE[t.prioridade]}>{t.prioridade}</Badge>
                      <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
