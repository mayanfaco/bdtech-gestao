import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { supabase } from '../../lib/supabaseClient.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';

const COLUMNS = [
  { key: 'pendente', label: 'Pendente' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'aguardando_terceiros', label: 'Aguardando terceiros' },
  { key: 'concluida', label: 'Concluída' },
  { key: 'cancelada', label: 'Cancelada' },
];
const PRIORIDADE_TONE = { baixa: 'neutral', media: 'brand', alta: 'warning', urgente: 'danger' };

function TaskCard({ task }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 10 : undefined }
    : undefined;
  const atrasada = task.prazo && new Date(task.prazo) < new Date() && !['concluida', 'cancelada'].includes(task.status);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bd-surface-card)', border: `1px solid ${atrasada ? 'var(--bd-danger-500)' : 'var(--bd-border-default)'}`,
        borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-3)', marginBottom: 'var(--bd-space-3)',
        boxShadow: 'var(--bd-shadow-sm)', cursor: 'grab',
      }}
      onClick={() => navigate(`/tarefas/${task.id}`)}
      {...listeners}
      {...attributes}
    >
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--bd-text-strong)' }}>{task.titulo}</div>
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginTop: 8 }}>
        <Badge tone={PRIORIDADE_TONE[task.prioridade]}>{task.prioridade}</Badge>
        {task.prazo && (
          <span style={{ fontSize: 11, color: atrasada ? 'var(--bd-danger-500)' : 'var(--bd-text-muted)' }}>
            {new Date(task.prazo).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusColumn({ column, tasks, onQuickAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  const [newTitle, setNewTitle] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    const ok = await onQuickAdd(column.key, newTitle.trim());
    if (ok) setNewTitle('');
    setAdding(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '0 0 270px', background: isOver ? 'var(--bd-primary-50)' : 'var(--bd-surface-sunken)',
        borderRadius: 'var(--bd-radius-lg)', padding: 'var(--bd-space-3)', minHeight: 300,
        transition: 'background var(--bd-duration-fast)', display: 'flex', flexDirection: 'column',
      }}
    >
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginBottom: 'var(--bd-space-3)', padding: '0 var(--bd-space-2)' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--bd-text-strong)' }}>{column.label}</span>
        <Badge tone="neutral">{tasks.length}</Badge>
      </div>
      <div style={{ flex: 1 }}>
        {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
      </div>
      <form onSubmit={submit} className="bd-u-flex bd-u-gap-2" style={{ marginTop: 'var(--bd-space-2)' }}>
        <Input placeholder="+ Adicionar tarefa" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} disabled={adding} />
      </form>
    </div>
  );
}

export default function TarefasKanban() {
  const [tasks, setTasks] = React.useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const load = React.useCallback(() => {
    supabase.from('tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => setTasks(data ?? []));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function quickAdd(status, titulo) {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('tasks').insert({ titulo, status, created_by: userData.user.id });
    if (error) { alert(error.message); return false; }
    load();
    return true;
  }

  async function moveTask(taskId, status) {
    const { error } = await supabase.from('tasks').update({ status, concluida_em: status === 'concluida' ? new Date().toISOString() : null }).eq('id', taskId);
    if (!error) load();
    else alert(error.message);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === over.id) return;
    moveTask(task.id, over.id);
  }

  if (tasks === null) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <Button variant="outline" as={Link} to="/tarefas/lista">Ver como lista</Button>
        <Button as={Link} to="/tarefas/nova">Nova tarefa</Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 'var(--bd-space-4)', overflowX: 'auto', paddingBottom: 8 }}>
          {COLUMNS.map((col) => (
            <StatusColumn key={col.key} column={col} tasks={tasks.filter((t) => t.status === col.key)} onQuickAdd={quickAdd} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
