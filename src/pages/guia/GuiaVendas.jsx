import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PLAYBOOK } from '../../content/playbook.js';
import { SCRIPT_GRUPOS } from '../../content/scripts.js';
import { DICAS } from '../../content/dicas.js';
import { preencherScript } from '../../lib/funis.js';
import { Explicacao, BotaoCopiar } from '../../components/funis/ui.jsx';

const ABAS = [
  { key: 'playbook', emoji: '📘', titulo: 'Playbook', sub: 'Como usar os funis' },
  { key: 'scripts', emoji: '💬', titulo: 'Scripts', sub: 'Mensagens prontas' },
  { key: 'dicas', emoji: '⭐', titulo: 'Dicas', sub: 'Do mercado de elevadores' },
];

function Playbook() {
  const [aberto, setAberto] = React.useState('rotina');
  return (
    <div className="fx-stack" style={{ gap: 12 }}>
      <Explicacao id="guia-playbook" icone="📘">
        <p><strong>Para que serve:</strong> o passo a passo resumido de cada funil. Comece pela <strong>rotina do dia</strong>: são 30 minutos que fazem toda a diferença.</p>
      </Explicacao>
      {PLAYBOOK.map((p) => {
        const isOpen = aberto === p.key;
        return (
          <div key={p.key} className="fx-grafico" style={{ padding: 0, overflow: 'hidden' }}>
            <button type="button" onClick={() => setAberto(isOpen ? null : p.key)} aria-expanded={isOpen}
              style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', width: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 28 }} aria-hidden>{p.emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 17, color: 'var(--bd-text-strong)' }}>{p.titulo}</span>
                <span className="fx-muted" style={{ fontSize: 14 }}>{p.resumo}</span>
              </span>
              <span aria-hidden style={{ fontSize: 20, color: 'var(--bd-text-muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 20px 20px 62px' }}>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.5 }}>
                  {p.passos.map((x) => <li key={x}>{x}</li>)}
                </ol>
                <div className="fx-explica" style={{ marginTop: 14, background: '#FEF9E7', borderColor: '#F5E2A8' }}>
                  <span aria-hidden>⭐</span><p><strong>Regra de ouro:</strong> {p.regra}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Scripts() {
  const [grupo, setGrupo] = React.useState(SCRIPT_GRUPOS[0].key);
  const [nome, setNome] = React.useState('');
  const atual = SCRIPT_GRUPOS.find((g) => g.key === grupo);
  return (
    <div className="fx-stack" style={{ gap: 14 }}>
      <Explicacao id="guia-scripts" icone="💬">
        <p><strong>Para que serve:</strong> mensagens prontas para copiar e colar no WhatsApp. Escolha o assunto, clique em <strong>Copiar</strong> e cole na conversa.
          Dentro dos funis, o texto certo já aparece sozinho.</p>
      </Explicacao>
      <div className="fx-row">
        {SCRIPT_GRUPOS.map((g) => (
          <button key={g.key} type="button" className={`fx-btn ${grupo === g.key ? 'fx-btn--primario' : 'fx-btn--claro'}`} onClick={() => setGrupo(g.key)}>{g.titulo}</button>
        ))}
      </div>
      <div className="fx-row">
        <div className="fx-campo" style={{ flex: '1 1 260px', maxWidth: 360 }}>
          <label htmlFor="sc-nome">Nome da pessoa (opcional)</label>
          <input id="sc-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: João" />
        </div>
      </div>
      <p className="fx-muted" style={{ margin: 0 }}>{atual.quando}</p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
        {atual.scripts.map((s) => {
          const texto = preencherScript(s.texto, { nome });
          return (
            <div key={s.id} className="fx-grafico" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3>{s.titulo}</h3>
              <div className="fx-script" style={{ flex: 1 }}>{texto}</div>
              <BotaoCopiar texto={texto} className="fx-btn fx-btn--primario fx-btn--block" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dicas() {
  return (
    <div className="fx-stack" style={{ gap: 18 }}>
      <Explicacao id="guia-dicas" icone="⭐">
        <p><strong>Para que serve:</strong> argumentos e boas práticas para vender consultoria de elevadores. Leia uma categoria por dia.</p>
      </Explicacao>
      {DICAS.map((c) => (
        <section key={c.categoria} className="fx-stack" style={{ gap: 10 }}>
          <h2>{c.categoria}</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
            {c.itens.map((i) => (
              <div key={i.titulo} className="fx-grafico" style={{ padding: 18 }}>
                <h3 style={{ marginBottom: 6 }}>{i.titulo}</h3>
                <p style={{ margin: 0, lineHeight: 1.55 }}>{i.texto}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function GuiaVendas() {
  const [params, setParams] = useSearchParams();
  const aba = ABAS.some((a) => a.key === params.get('aba')) ? params.get('aba') : 'playbook';
  return (
    <div className="fx fx-stack">
      <div className="fx-tabs" role="tablist">
        {ABAS.map((a) => (
          <button key={a.key} type="button" role="tab" className="fx-tab" aria-selected={aba === a.key} onClick={() => setParams({ aba: a.key })}>
            <span className="fx-tab__emoji" aria-hidden>{a.emoji}</span>
            <span className="fx-tab__txt"><span className="fx-tab__title">{a.titulo}</span><span className="fx-tab__sub">{a.sub}</span></span>
          </button>
        ))}
      </div>
      {aba === 'scripts' ? <Scripts /> : aba === 'dicas' ? <Dicas /> : <Playbook />}
    </div>
  );
}
