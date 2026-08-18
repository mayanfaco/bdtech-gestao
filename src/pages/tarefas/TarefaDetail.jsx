import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Checkbox } from '../../design-system/components/forms/Checkbox.jsx';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { BackButton } from '../../components/BackButton.jsx';

const STATUS_LABEL = { pendente: 'Pendente', em_andamento: 'Em andamento', aguardando_terceiros: 'Aguardando terceiros', concluida: 'Concluída', cancelada: 'Cancelada' };

export default function TarefaDetail() {
  const { id } = useParams();
  const [task, setTask] = React.useState(null);
  const [checklist, setChecklist] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [newItem, setNewItem] = React.useState('');
  const [newComment, setNewComment] = React.useState('');

  const load = React.useCallback(() => {
    supabase.from('tasks').select('*').eq('id', id).single().then(({ data }) => setTask(data));
    supabase.from('task_checklist_items').select('*').eq('task_id', id).order('ordem').then(({ data }) => setChecklist(data ?? []));
    supabase.from('task_comments').select('*').eq('task_id', id).order('created_at').then(({ data }) => setComments(data ?? []));
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  async function toggleItem(item) {
    await supabase.from('task_checklist_items').update({ concluido: !item.concluido }).eq('id', item.id);
    load();
  }

  async function addItem(e) {
    e.preventDefault();
    if (!newItem.trim()) return;
    await supabase.from('task_checklist_items').insert({ task_id: id, descricao: newItem, ordem: checklist.length });
    setNewItem('');
    load();
  }

  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('task_comments').insert({ task_id: id, body: newComment, user_id: userData.user.id });
    setNewComment('');
    load();
  }

  async function markStatus(status) {
    await supabase.from('tasks').update({ status, concluida_em: status === 'concluida' ? new Date().toISOString() : null }).eq('id', id);
    load();
  }

  if (!task) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div>
        <BackButton to={task.client_id ? `/clientes/${task.client_id}` : '/tarefas'} label={task.client_id ? 'Voltar para o cliente' : 'Voltar para Tarefas'} />
      </div>
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div>
          <h1 style={{ fontSize: 24 }}>{task.titulo}</h1>
          <div style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>
            {task.prazo ? `Prazo: ${new Date(task.prazo).toLocaleString('pt-BR')}` : 'Sem prazo'}
          </div>
        </div>
        <div className="bd-u-flex bd-u-gap-3 bd-u-items-center">
          <Badge tone="brand">{STATUS_LABEL[task.status]}</Badge>
          <Button variant="outline" as={Link} to={`/tarefas/${id}/editar`}>Editar</Button>
          {task.status !== 'concluida' && <Button onClick={() => markStatus('concluida')}>Concluir</Button>}
        </div>
      </div>

      {task.descricao && <Card padding="lg"><p style={{ margin: 0 }}>{task.descricao}</p></Card>}

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 'var(--bd-space-3)' }}>Checklist</h2>
        <div className="bd-u-flex-col bd-u-gap-2">
          {checklist.map((item) => (
            <Checkbox key={item.id} label={item.descricao} checked={item.concluido} onChange={() => toggleItem(item)} />
          ))}
        </div>
        <form onSubmit={addItem} className="bd-u-flex bd-u-gap-2" style={{ marginTop: 'var(--bd-space-3)' }}>
          <Input placeholder="Novo item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} />
          <Button type="submit" variant="outline">Adicionar</Button>
        </form>
      </div>

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 'var(--bd-space-3)' }}>Comentários</h2>
        <div className="bd-u-flex-col bd-u-gap-3">
          {comments.map((c) => (
            <div key={c.id} style={{ fontSize: 14, borderBottom: '1px solid var(--bd-border-subtle)', paddingBottom: 8 }}>
              <div>{c.body}</div>
              <div style={{ fontSize: 12, color: 'var(--bd-text-subtle)' }}>{new Date(c.created_at).toLocaleString('pt-BR')}</div>
            </div>
          ))}
        </div>
        <form onSubmit={addComment} className="bd-u-flex bd-u-gap-2" style={{ marginTop: 'var(--bd-space-3)' }}>
          <Input placeholder="Adicionar comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
          <Button type="submit" variant="outline">Comentar</Button>
        </form>
      </div>
    </div>
  );
}
