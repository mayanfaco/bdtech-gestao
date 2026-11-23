import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AJUDA, AJUDA_RAPIDA, buscarAjuda } from '../../content/ajuda.js';
import { injectFunisCss } from './funisCss.js';

injectFunisCss();

const CSS = `
.fx-ajuda-btn{all:unset;position:fixed;right:22px;bottom:22px;z-index:1500;cursor:pointer;display:flex;align-items:center;gap:8px;
  background:var(--bd-navy-900);color:#fff;border-radius:999px;padding:12px 18px 12px 12px;font-weight:700;font-size:15px;
  box-shadow:0 10px 28px rgba(1,25,51,.35);}
.fx-ajuda-btn:hover{background:var(--bd-navy-700);}
.fx-ajuda-btn:focus-visible{outline:3px solid var(--bd-primary-300);outline-offset:3px;}
.fx-ajuda-btn__i{width:30px;height:30px;border-radius:999px;background:var(--bd-primary-500);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;}
.fx-ajuda{position:fixed;right:22px;bottom:86px;z-index:1600;width:min(400px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 120px));
  background:var(--bd-surface-card);border-radius:20px;box-shadow:0 24px 60px rgba(1,25,51,.35);display:flex;flex-direction:column;overflow:hidden;
  animation:fxSobe .2s cubic-bezier(.2,.8,.2,1);}
.fx-ajuda__topo{background:var(--bd-navy-900);color:#fff;padding:18px 20px;}
.fx-ajuda__topo h2{color:#fff !important;font-size:19px !important;}
.fx-ajuda__topo p{margin:4px 0 12px;color:rgba(255,255,255,.75);font-size:14px;}
.fx-ajuda__busca{display:flex;gap:8px;}
.fx-ajuda__busca input{flex:1;font:inherit;font-size:16px;border-radius:12px;border:none;padding:12px 14px;min-width:0;}
.fx-ajuda__busca input:focus{outline:3px solid var(--bd-primary-300);}
.fx-ajuda__corpo{padding:16px 18px 20px;overflow:auto;display:flex;flex-direction:column;gap:10px;}
.fx-resp{border:1px solid var(--bd-border-default);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px;}
.fx-resp__p{font-weight:700;color:var(--bd-text-strong);font-size:15px;}
.fx-resp__r{font-size:14.5px;line-height:1.5;}
.fx-sug{all:unset;cursor:pointer;display:block;padding:11px 14px;border-radius:12px;background:var(--bd-surface-sunken);font-size:14.5px;font-weight:600;color:var(--bd-text-strong);}
.fx-sug:hover{background:var(--bd-primary-50);}
@media (max-width:560px){.fx-ajuda-btn{right:14px;bottom:14px;padding:10px;}.fx-ajuda-btn__txt{display:none;}.fx-ajuda{right:16px;bottom:72px;}}
@media print{.fx-ajuda-btn,.fx-ajuda{display:none !important;}}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-ajuda-css')) {
  const s = document.createElement('style'); s.id = 'bd-ajuda-css'; s.textContent = CSS; document.head.appendChild(s);
}

function Resposta({ item, onIr }) {
  return (
    <div className="fx-resp">
      <div className="fx-resp__p">{item.pergunta}</div>
      <div className="fx-resp__r">{item.resposta}</div>
      <button type="button" className="fx-btn fx-btn--primario" style={{ alignSelf: 'flex-start' }} onClick={() => onIr(item)}>{item.botao} →</button>
    </div>
  );
}

/** Botão "Ajuda" no canto da tela. Respostas pré-escritas, sem IA. */
export function AjudaFlutuante() {
  const navigate = useNavigate();
  const [aberta, setAberta] = React.useState(false);
  const [texto, setTexto] = React.useState('');
  const [buscou, setBuscou] = React.useState('');
  const [escolhida, setEscolhida] = React.useState(null);

  React.useEffect(() => {
    if (!aberta) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setAberta(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aberta]);

  const resultados = buscou ? buscarAjuda(buscou, 3) : [];
  const ir = (item) => { setAberta(false); setEscolhida(null); navigate(item.rota); };

  return (
    <>
      <button type="button" className="fx-ajuda-btn" onClick={() => setAberta((a) => !a)} aria-expanded={aberta} aria-label="Ajuda">
        <span className="fx-ajuda-btn__i">?</span><span className="fx-ajuda-btn__txt">{aberta ? 'Fechar' : 'Ajuda'}</span>
      </button>
      {aberta && (
        <div className="fx-ajuda fx" role="dialog" aria-label="Ajuda">
          <div className="fx-ajuda__topo">
            <h2>Como posso ajudar?</h2>
            <p>Escreva do seu jeito o que você quer fazer.</p>
            <form className="fx-ajuda__busca" onSubmit={(e) => { e.preventDefault(); setBuscou(texto); setEscolhida(null); }}>
              <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: ver quem eu já mandei mensagem" aria-label="O que você procura?" />
              <button type="submit" className="fx-btn fx-btn--primario">Buscar</button>
            </form>
          </div>
          <div className="fx-ajuda__corpo">
            {escolhida ? (
              <>
                <Resposta item={escolhida} onIr={ir} />
                <button type="button" className="fx-btn fx-btn--texto" style={{ alignSelf: 'flex-start' }} onClick={() => setEscolhida(null)}>← Voltar</button>
              </>
            ) : buscou ? (
              resultados.length ? (
                <>
                  <div className="fx-muted" style={{ fontSize: 14 }}>Achei isto:</div>
                  {resultados.map((r) => <Resposta key={r.id} item={r} onIr={ir} />)}
                </>
              ) : (
                <div className="fx-resp">
                  <div className="fx-resp__p">Não encontrei com essas palavras.</div>
                  <div className="fx-resp__r">Tente com outras palavras, como "follow-up", "proposta", "cliente" ou "mensagem". Ou escolha uma pergunta abaixo.</div>
                  {AJUDA_RAPIDA.map((id) => AJUDA.find((a) => a.id === id)).map((a) => (
                    <button key={a.id} type="button" className="fx-sug" onClick={() => setEscolhida(a)}>{a.pergunta}</button>
                  ))}
                </div>
              )
            ) : (
              <>
                <div className="fx-muted" style={{ fontSize: 14 }}>Perguntas mais comuns:</div>
                {AJUDA_RAPIDA.map((id) => AJUDA.find((a) => a.id === id)).map((a) => (
                  <button key={a.id} type="button" className="fx-sug" onClick={() => setEscolhida(a)}>{a.pergunta}</button>
                ))}
                <button type="button" className="fx-sug" onClick={() => ir({ rota: '/tutorial' })}>🎓 Quero fazer o tutorial</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
