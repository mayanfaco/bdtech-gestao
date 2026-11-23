import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial, FASES } from '../../lib/tutorial.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { Confete } from '../../components/funis/ui.jsx';
import { CONTEUDO } from './conteudoTutorial.jsx';

const DESTINO = { prospeccao: '/funis/prospeccao', followup: '/funis/followup', vendas: '/funis/vendas', lar: '/meu-lar', boas_vindas: '/guia' };

function ListaDeErros({ erros }) {
  if (!erros.length) return null;
  return (
    <div className="fx-erro" role="alert">
      <strong>Ainda não está certo. Veja o que corrigir:</strong>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {erros.map((e) => <li key={e}>{e}</li>)}
      </ul>
    </div>
  );
}

function Quiz({ passo, respostas, setRespostas }) {
  return (
    <div className="fx-stack" style={{ gap: 18 }}>
      {passo.perguntas.map((q, i) => (
        <fieldset key={q.p} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, fontSize: 16.5, color: 'var(--bd-text-strong)', marginBottom: 8 }}>{i + 1}. {q.p}</legend>
          <div className="fx-stack" style={{ gap: 8 }}>
            {q.opcoes.map((o, j) => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${respostas[i] === j ? 'var(--bd-primary-500)' : 'var(--bd-border-default)'}`, background: respostas[i] === j ? 'var(--bd-primary-50)' : 'var(--bd-surface-card)' }}>
                <input type="radio" name={`q${i}`} checked={respostas[i] === j} onChange={() => setRespostas({ ...respostas, [i]: j })} style={{ width: 20, height: 20 }} />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function errosDoQuiz(passo, respostas) {
  return passo.perguntas.flatMap((q, i) => {
    if (respostas[i] === undefined) return [`Pergunta ${i + 1}: falta responder.`];
    if (respostas[i] !== q.certa) return [`Pergunta ${i + 1}: resposta errada. Dica: ${q.explica}`];
    return [];
  });
}

function Fase({ fase, onConcluir }) {
  const passos = CONTEUDO[fase.key];
  const [indice, setIndice] = React.useState(0);
  const passo = passos[indice];
  // Um estado por passo: trocar de passo nunca mistura respostas.
  const [estados, setEstados] = React.useState({});
  const estado = estados[indice] ?? passo.inicial ?? {};
  const setEstado = (v) => setEstados((e) => ({ ...e, [indice]: v }));
  const [erros, setErros] = React.useState([]);
  const [tentativas, setTentativas] = React.useState(0);

  React.useEffect(() => { setErros([]); setTentativas(0); }, [indice]);

  function continuar() {
    let lista = [];
    if (passo.tipo === 'quiz') lista = errosDoQuiz(passo, estado);
    if (passo.tipo === 'exercicio') lista = passo.validar(estado);
    setErros(lista);
    if (lista.length) { setTentativas((t) => t + 1); return; }
    if (indice < passos.length - 1) setIndice(indice + 1);
    else onConcluir();
  }

  return (
    <div className="fx-grafico fx-stack" style={{ gap: 18, padding: 26 }}>
      <div className="fx-row" style={{ gap: 6 }}>
        {passos.map((_, i) => (
          <span key={i} style={{ height: 8, flex: 1, borderRadius: 8, background: i < indice ? '#16A34A' : i === indice ? 'var(--bd-primary-500)' : 'var(--bd-surface-sunken)' }} />
        ))}
      </div>
      <div className="fx-muted" style={{ fontSize: 14 }}>Passo {indice + 1} de {passos.length}</div>
      <h2>{passo.emoji ? `${passo.emoji} ` : ''}{passo.titulo}</h2>

      {passo.tipo === 'licao' && (
        <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 17, lineHeight: 1.55 }}>
          {passo.texto.map((t) => <li key={t}>{t}</li>)}
        </ol>
      )}
      {passo.tipo === 'quiz' && <Quiz passo={passo} respostas={estado} setRespostas={setEstado} />}
      {passo.tipo === 'exercicio' && (
        <>
          <p style={{ margin: 0, fontSize: 16.5 }}>{passo.instrucao}</p>
          {passo.render(estado, setEstado)}
        </>
      )}

      <ListaDeErros erros={erros} />
      {tentativas >= 3 && erros.length > 0 && (
        <div className="fx-explica"><span aria-hidden>🤝</span><p>Sem pressa! Se quiser, volte ao passo anterior para reler, ou clique no botão <strong>Ajuda</strong>.</p></div>
      )}

      <div className="fx-row">
        {indice > 0 && <button type="button" className="fx-btn fx-btn--claro fx-btn--lg" onClick={() => setIndice(indice - 1)}>← Voltar</button>}
        <span className="fx-spacer" />
        <button type="button" className="fx-btn fx-btn--primario fx-btn--lg" onClick={continuar}>
          {passo.tipo === 'licao' ? 'Entendi, continuar →' : indice === passos.length - 1 ? 'Conferir e concluir' : 'Conferir resposta'}
        </button>
      </div>
    </div>
  );
}

export default function Tutorial() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const t = useTutorial();
  const [faseAtiva, setFaseAtiva] = React.useState(null);
  const [concluida, setConcluida] = React.useState(null);

  const atual = faseAtiva ?? t.proximaFase?.key ?? null;
  const fase = FASES.find((f) => f.key === atual);
  const indiceDe = (k) => FASES.findIndex((f) => f.key === k);
  const disponivel = (k) => indiceDe(k) === 0 || t.feita(FASES[indiceDe(k) - 1].key);

  async function concluir() {
    await t.concluir(fase.key);
    setConcluida(fase);
    setFaseAtiva(null);
  }

  return (
    <div className="fx fx-stack">
      <Confete ativo={Boolean(concluida)} />
      <div>
        <h1>Tutorial</h1>
        <p className="fx-muted" style={{ margin: '6px 0 0' }}>{t.concluidas} de {t.total} fases concluídas. Cada fase libera uma parte do sistema.</p>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))' }}>
        {FASES.map((f, i) => {
          const feita = t.feita(f.key);
          const livre = disponivel(f.key);
          const ativa = !concluida && atual === f.key;
          return (
            <button key={f.key} type="button" disabled={!livre} onClick={() => { setConcluida(null); setFaseAtiva(f.key); }}
              className="fx-tab" aria-selected={ativa} style={{ opacity: livre ? 1 : 0.55, cursor: livre ? 'pointer' : 'not-allowed' }}>
              <span className="fx-tab__emoji" aria-hidden>{feita ? '✅' : livre ? f.emoji : '🔒'}</span>
              <span className="fx-tab__txt">
                <span className="fx-tab__title">{i + 1}. {f.titulo}</span>
                <span className="fx-tab__sub">{feita ? 'Concluída' : livre ? 'Disponível' : 'Termine a anterior'}</span>
              </span>
            </button>
          );
        })}
      </div>

      {concluida ? (
        <div className="fx-grafico fx-stack" style={{ alignItems: 'center', textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: 56 }} aria-hidden>🏆</div>
          <h2>Fase "{concluida.titulo}" concluída!</h2>
          <p style={{ margin: 0, fontSize: 17 }}>Você liberou: <strong>{concluida.liberaTexto}</strong>.</p>
          <div className="fx-row" style={{ justifyContent: 'center' }}>
            <button type="button" className="fx-btn fx-btn--verde fx-btn--lg" onClick={() => navigate(DESTINO[concluida.key])}>Ir para lá agora</button>
            {t.proximaFase && <button type="button" className="fx-btn fx-btn--claro fx-btn--lg" onClick={() => setConcluida(null)}>Próxima fase →</button>}
          </div>
        </div>
      ) : fase ? (
        <Fase key={fase.key} fase={fase} onConcluir={concluir} />
      ) : (
        <div className="fx-grafico fx-stack" style={{ alignItems: 'center', textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: 56 }} aria-hidden>🎓</div>
          <h2>Você terminou o tutorial inteiro!</h2>
          <p style={{ margin: 0 }}>Tudo está liberado. Pode refazer qualquer fase quando quiser, clicando nela acima.</p>
          <button type="button" className="fx-btn fx-btn--primario fx-btn--lg" onClick={() => navigate('/funis/followup')}>Começar o dia pelo Follow-up</button>
        </div>
      )}

      {role === 'administrador' && (
        <div className="fx-muted" style={{ fontSize: 13.5 }}>
          Administrador: a exigência do tutorial pode ser desligada em Configurações → Automações.{' '}
          <button type="button" className="fx-btn fx-btn--texto" onClick={() => { if (window.confirm('Recomeçar o tutorial do zero para este usuário?')) t.reiniciar(); }}>Recomeçar meu tutorial</button>
        </div>
      )}
    </div>
  );
}
