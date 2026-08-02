import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { monthGrid, monthLabel, weekdayLabels, isSameDay, isSameMonth } from '../../lib/dateUtils.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';

const TIPO_LABEL = {
  reuniao_comercial: 'Reunião comercial', reuniao_tecnica: 'Reunião técnica', apresentacao_proposta: 'Apresentação de proposta',
  follow_up: 'Follow-up', vistoria: 'Vistoria', visita_cliente: 'Visita ao cliente', reuniao_interna: 'Reunião interna',
  vencimento_proposta: 'Vencimento de proposta', vencimento_contrato: 'Vencimento de contrato',
  compromisso_administrativo: 'Compromisso administrativo', outro: 'Outro',
};
const TIPO_COLOR = {
  reuniao_comercial: 'var(--bd-primary-500)', reuniao_tecnica: 'var(--bd-navy-700)', apresentacao_proposta: 'var(--bd-accent-500)',
  follow_up: 'var(--bd-warning-500)', vistoria: 'var(--bd-success-500)', visita_cliente: 'var(--bd-primary-700)',
  reuniao_interna: 'var(--bd-neutral-500)', vencimento_proposta: 'var(--bd-danger-500)', vencimento_contrato: 'var(--bd-danger-700)',
  compromisso_administrativo: 'var(--bd-neutral-600)', outro: 'var(--bd-neutral-400)',
};

export default function Calendario() {
  const [view, setView] = React.useState('mes');
  const [cursor, setCursor] = React.useState(new Date());
  const [tipoFilter, setTipoFilter] = React.useState('');
  const [events, setEvents] = React.useState(null);

  React.useEffect(() => {
    supabase.from('calendar_events').select('*').order('data_inicio').then(({ data }) => setEvents(data ?? []));
  }, []);

  if (events === null) return null;
  const filtered = tipoFilter ? events.filter((e) => e.tipo === tipoFilter) : events;

  const days = monthGrid(cursor);
  const today = new Date();

  function eventsOn(day) {
    return filtered.filter((e) => isSameDay(new Date(e.data_inicio), day));
  }

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="bd-u-flex bd-u-items-center bd-u-gap-3">
          <Button variant="outline" size="sm" onClick={() => setView('mes')} style={view === 'mes' ? { borderColor: 'var(--bd-primary-500)' } : undefined}>Mês</Button>
          <Button variant="outline" size="sm" onClick={() => setView('lista')} style={view === 'lista' ? { borderColor: 'var(--bd-primary-500)' } : undefined}>Lista</Button>
          <div style={{ width: 200 }}>
            <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} placeholder="Todos os tipos"
              options={Object.entries(TIPO_LABEL).map(([value, label]) => ({ value, label }))} />
          </div>
        </div>
        <Button as={Link} to="/calendario/novo">Novo evento</Button>
      </div>

      {view === 'mes' ? (
        <>
          <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>← Anterior</Button>
            <strong style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>{monthLabel(cursor)}</strong>
            <Button variant="ghost" size="sm" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>Próximo →</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--bd-border-subtle)', border: '1px solid var(--bd-border-subtle)', borderRadius: 'var(--bd-radius-md)', overflow: 'hidden' }}>
            {weekdayLabels().map((d) => (
              <div key={d} style={{ background: 'var(--bd-navy-900)', color: '#fff', padding: '8px 6px', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{d}</div>
            ))}
            {days.map((day, i) => {
              const dayEvents = eventsOn(day);
              return (
                <div key={i} style={{
                  background: 'var(--bd-surface-card)', minHeight: 96, padding: 6,
                  opacity: isSameMonth(day, cursor) ? 1 : 0.4,
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: isSameDay(day, today) ? 800 : 500,
                    color: isSameDay(day, today) ? 'var(--bd-primary-600)' : 'var(--bd-text-muted)', marginBottom: 4,
                  }}>{day.getDate()}</div>
                  {dayEvents.slice(0, 3).map((ev) => (
                    <Link key={ev.id} to={`/calendario/${ev.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4, marginBottom: 2, color: '#fff',
                        background: TIPO_COLOR[ev.tipo], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{ev.titulo}</div>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && <div style={{ fontSize: 10, color: 'var(--bd-text-muted)' }}>+{dayEvents.length - 3} mais</div>}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        filtered.length === 0 ? <EmptyState title="Nenhum evento marcado" /> : (
          <div className="bd-u-flex-col bd-u-gap-3">
            {filtered.map((ev) => (
              <Link key={ev.id} to={`/calendario/${ev.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <Card interactive>
                  <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ padding: 'var(--bd-space-4) var(--bd-space-5)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIPO_COLOR[ev.tipo], flex: '0 0 auto' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{ev.titulo}</div>
                      <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
                        {new Date(ev.data_inicio).toLocaleString('pt-BR')} · {TIPO_LABEL[ev.tipo]}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
