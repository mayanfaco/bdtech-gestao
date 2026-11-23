import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCAIS, DORES_POR_TIPO, linkMapa } from '../../content/prospeccao.js';
import { normalizar } from '../../lib/funis.js';
import { useTutorial } from '../../lib/tutorial.jsx';
import { Explicacao } from '../../components/funis/ui.jsx';
import { Bloqueado } from '../funis/Funis.jsx';

const TIPOS = [...new Set(LOCAIS.map((l) => l.tipo))];

// Mapeia o tipo da lista para os tipos usados no cadastro do contato.
const TIPO_CADASTRO = {
  'Transporte / terminal': 'Órgão público',
  'Centro de eventos / aeroporto': 'Outro',
};

export default function OndeProspectar() {
  const navigate = useNavigate();
  const tutorial = useTutorial();
  const [tipo, setTipo] = React.useState('');
  const [busca, setBusca] = React.useState('');

  if (!tutorial.liberado('prospeccao')) return <div className="fx"><Bloqueado area="prospeccao" /></div>;

  const lista = LOCAIS.filter((l) => (!tipo || l.tipo === tipo)
    && (!busca || normalizar(`${l.nome} ${l.bairro} ${l.endereco}`).includes(normalizar(busca))));

  function adicionar(l) {
    const p = new URLSearchParams({
      novo: '1', empresa: l.nome, tipo_local: TIPO_CADASTRO[l.tipo] ?? l.tipo,
      origem: 'Sugestão: Onde Prospectar', observacoes: `${l.endereco}${l.telefone ? ` · Tel.: ${l.telefone}` : ''}`,
    });
    navigate(`/funis/prospeccao?${p.toString()}`);
  }

  return (
    <div className="fx fx-stack">
      <div>
        <h1>Onde prospectar</h1>
        <p className="fx-muted" style={{ margin: '6px 0 0' }}>Lugares em Fortaleza que usam elevador, com o problema de cada um para você tocar na conversa.</p>
      </div>
      <Explicacao id="onde-prospectar" icone="📍">
        <p><strong>Para que serve:</strong> ideias de quem procurar além dos condomínios. Escolha um tipo de local, leia <strong>a dor</strong> (o problema que eles têm)
          e clique em <strong>"Adicionar à prospecção"</strong>. Os dados vieram de pesquisa na internet e podem estar desatualizados:
          use <strong>"Ver no mapa"</strong> para confirmar o telefone antes de ligar.</p>
      </Explicacao>

      <div className="fx-row">
        <button type="button" className={`fx-btn ${!tipo ? 'fx-btn--primario' : 'fx-btn--claro'}`} onClick={() => setTipo('')}>Todos ({LOCAIS.length})</button>
        {TIPOS.map((t) => (
          <button key={t} type="button" className={`fx-btn ${tipo === t ? 'fx-btn--primario' : 'fx-btn--claro'}`} onClick={() => setTipo(t)}>
            {DORES_POR_TIPO[t]?.emoji} {t}
          </button>
        ))}
      </div>
      <div className="fx-campo" style={{ maxWidth: 420 }}>
        <label htmlFor="op-busca">Procurar por nome ou bairro</label>
        <input id="op-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: Aldeota" />
      </div>

      {tipo && DORES_POR_TIPO[tipo] && (
        <div className="fx-explica" style={{ background: '#FEF9E7', borderColor: '#F5E2A8' }}>
          <span className="fx-explica__icon" aria-hidden>{DORES_POR_TIPO[tipo].emoji}</span>
          <div>
            <p><strong>A dor de {tipo.toLowerCase()}:</strong> {DORES_POR_TIPO[tipo].dor}</p>
            <p style={{ marginTop: 6 }}><strong>Com quem falar:</strong> {DORES_POR_TIPO[tipo].quem}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))' }}>
        {lista.map((l) => {
          const dor = DORES_POR_TIPO[l.tipo];
          return (
            <article key={l.nome} className="fx-grafico" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="fx-chip fx-chip--azul">{dor?.emoji} {l.tipo}</span>
              <h3>{l.nome}</h3>
              <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>
                <div>📍 {l.endereco}</div>
                <div>📞 {l.telefone ?? <span className="fx-muted">telefone não encontrado — veja no mapa</span>}</div>
              </div>
              <div style={{ fontSize: 14.5, lineHeight: 1.5, background: 'var(--bd-surface-sunken)', borderRadius: 12, padding: 12 }}>
                <strong>Dor:</strong> {dor?.dor}
                {l.observacao && <div style={{ marginTop: 6 }}><strong>Atenção:</strong> {l.observacao}</div>}
              </div>
              <div className="fx-row" style={{ marginTop: 'auto' }}>
                <button type="button" className="fx-btn fx-btn--primario" onClick={() => adicionar(l)}>＋ Adicionar à prospecção</button>
                <a className="fx-btn fx-btn--claro" href={linkMapa(l)} target="_blank" rel="noreferrer">🗺️ Ver no mapa</a>
              </div>
              <a href={l.fonte} target="_blank" rel="noreferrer" className="fx-muted" style={{ fontSize: 12.5 }}>Fonte da informação</a>
            </article>
          );
        })}
      </div>
      {lista.length === 0 && <div className="fx-col__empty">Nenhum local com esse filtro.</div>}

      <section className="fx-stack" style={{ gap: 10 }}>
        <h2>Outros tipos de local para procurar no mapa</h2>
        <p className="fx-muted" style={{ margin: 0 }}>Procure no Google Maps pelo tipo + o bairro (ex.: "clínica Aldeota") e cadastre os que tiverem prédio com elevador.</p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {Object.entries(DORES_POR_TIPO).map(([t, d]) => (
            <div key={t} className="fx-grafico" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 6 }}>{d.emoji} {t}</h3>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{d.dor}</p>
              <a className="fx-btn fx-btn--texto" style={{ paddingLeft: 0 }} target="_blank" rel="noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.split(' / ')[0]} Fortaleza`)}`}>Procurar no mapa →</a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
