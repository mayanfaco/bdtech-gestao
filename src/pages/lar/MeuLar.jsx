import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { clientesFechados } from '../../lib/funis.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { useTutorial } from '../../lib/tutorial.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { FamiliaCena, CONQUISTAS } from '../../components/lar/FamiliaCena.jsx';
import { Explicacao, Confete } from '../../components/funis/ui.jsx';
import { Bloqueado } from '../funis/Funis.jsx';

const CHAVE_VISTO = (uid) => `bdtech-lar-visto-${uid ?? 'anon'}`;

export default function MeuLar() {
  const tutorial = useTutorial();
  const { user } = useAuth();
  const [fechados, setFechados] = React.useState(null);
  const [novos, setNovos] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      supabase.from('proposals').select('id, client_id, status, status_changed_at, created_at, valor_total, modelo1_valor_com_desconto, deleted_at').eq('status', 'aprovada').is('deleted_at', null),
      supabase.from('contracts').select('id, client_id, status, data_assinatura, status_changed_at, created_at, valor_total, deleted_at').is('deleted_at', null),
      supabase.from('clients').select('id, nome'),
    ]).then(([p, c, cl]) => {
      const lista = clientesFechados({ proposals: p.data ?? [], contracts: c.data ?? [], clients: cl.data ?? [] });
      setFechados(lista);
      // Comemora quem fechou desde a última visita a esta tela.
      let visto = null;
      try { visto = JSON.parse(localStorage.getItem(CHAVE_VISTO(user?.id)) ?? 'null'); } catch { /* sem storage */ }
      if (Array.isArray(visto)) setNovos(lista.filter((f) => !visto.includes(f.id)));
      try { localStorage.setItem(CHAVE_VISTO(user?.id), JSON.stringify(lista.map((f) => f.id))); } catch { /* sem storage */ }
    });
  }, [user?.id]);

  if (!tutorial.liberado('lar')) return <div className="fx"><Bloqueado area="lar" /></div>;
  if (fechados === null) return <div className="fx fx-muted">Carregando...</div>;

  const n = fechados.length;
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const noMes = fechados.filter((f) => new Date(f.data) >= inicioMes).length;
  const total = fechados.reduce((s, f) => s + (f.valor || 0), 0);
  const proxima = CONQUISTAS.find((c) => c.n > n);
  const anterior = [...CONQUISTAS].reverse().find((c) => c.n <= n);
  const base = anterior?.n ?? 0;
  const progresso = proxima ? Math.round(((n - base) / (proxima.n - base)) * 100) : 100;

  return (
    <div className="fx fx-stack">
      <Confete ativo={novos.length > 0} />
      <div>
        <h1>Meu Lar</h1>
        <p className="fx-muted" style={{ margin: '6px 0 0' }}>Para lembrar por quem você faz tudo isso.</p>
      </div>
      <Explicacao id="meu-lar" icone="🏡">
        <p><strong>Para que serve:</strong> cada cliente que você <strong>fecha</strong> vira uma estrela no céu da família (passe o mouse para ver o nome),
          e a casa ganha uma conquista nova. Clique nas pessoas e nos gatinhos!</p>
      </Explicacao>

      {novos.length > 0 && (
        <div className="fx-ok" style={{ fontSize: 16 }}>
          🎉 Desde a sua última visita, a família ganhou {novos.length === 1 ? 'uma estrela nova' : `${novos.length} estrelas novas`}: <strong>{novos.map((f) => f.nome).join(', ')}</strong>!
        </div>
      )}

      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 2.2fr) minmax(260px, 1fr)', alignItems: 'start' }} className="lar-grid">
        <style>{'@media (max-width: 980px){.lar-grid{grid-template-columns:1fr !important;}}'}</style>
        <div className="fx-grafico" style={{ padding: 10 }}>
          <FamiliaCena fechados={fechados} />
        </div>

        <div className="fx-stack" style={{ gap: 14 }}>
          <div className="fx-grafico" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--bd-text-strong)', lineHeight: 1 }}>{n}</div>
            <div className="fx-muted" style={{ marginTop: 6 }}>{n === 1 ? 'cliente fechado' : 'clientes fechados'}</div>
            <div className="fx-row" style={{ justifyContent: 'center', marginTop: 12 }}>
              <span className="fx-contador">Este mês: <b>{noMes}</b></span>
              {total > 0 && <span className="fx-contador">Total: <b>{formatCurrency(total)}</b></span>}
            </div>
          </div>

          <div className="fx-grafico" style={{ padding: 20 }}>
            {proxima ? (
              <>
                <div className="fx-muted" style={{ fontSize: 14 }}>Próxima conquista</div>
                <h3 style={{ margin: '4px 0 10px' }}>{proxima.emoji} {proxima.titulo}</h3>
                <div className="fx-barra__trilho" style={{ height: 16 }}><div className="fx-barra__fill" style={{ width: `${progresso}%`, background: '#16A34A' }} /></div>
                <div style={{ marginTop: 8, fontSize: 14.5 }}>Faltam <strong>{proxima.n - n}</strong> {proxima.n - n === 1 ? 'cliente' : 'clientes'}.</div>
                <Link to="/funis/followup" className="fx-btn fx-btn--primario fx-btn--block" style={{ marginTop: 12 }}>Ir buscar o próximo →</Link>
              </>
            ) : <h3>🏆 Todas as conquistas desbloqueadas!</h3>}
          </div>

          <div className="fx-grafico" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 10 }}>Conquistas da família</h3>
            <div className="fx-stack" style={{ gap: 8 }}>
              {CONQUISTAS.map((c) => (
                <div key={c.chave} className="fx-row" style={{ gap: 10, opacity: n >= c.n ? 1 : 0.5, flexWrap: 'nowrap' }}>
                  <span style={{ fontSize: 20 }} aria-hidden>{n >= c.n ? c.emoji : '🔒'}</span>
                  <span style={{ flex: 1 }}>{c.titulo}</span>
                  <span className="fx-muted" style={{ fontSize: 13 }}>{c.n} {c.n === 1 ? 'cliente' : 'clientes'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {fechados.length > 0 && (
        <div className="fx-grafico" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 10 }}>⭐ As estrelas do céu</h3>
          <div className="fx-row" style={{ gap: 8 }}>
            {[...fechados].reverse().map((f) => (
              <span key={f.id} className="fx-contador" title={`Fechado em ${new Date(f.data).toLocaleDateString('pt-BR')}`}>⭐ {f.nome}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
