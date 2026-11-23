import React from 'react';
import { injectFunisCss } from './funisCss.js';

injectFunisCss();

/** Caixa "Para que serve esta parte". Pode ser recolhida; fica lembrado. */
export function Explicacao({ id, icone = '💡', children }) {
  const chave = `bdtech-explica-${id}`;
  const [aberta, setAberta] = React.useState(() => {
    try { return localStorage.getItem(chave) !== 'fechada'; } catch { return true; }
  });
  const alternar = () => {
    setAberta((a) => {
      try { localStorage.setItem(chave, a ? 'fechada' : 'aberta'); } catch { /* sem storage */ }
      return !a;
    });
  };
  if (!aberta) {
    return <button type="button" className="fx-btn fx-btn--texto" style={{ alignSelf: 'flex-start' }} onClick={alternar}>💡 Para que serve esta parte?</button>;
  }
  return (
    <div className="fx-explica" role="note">
      <span className="fx-explica__icon" aria-hidden>{icone}</span>
      <div style={{ flex: 1 }}>{children}</div>
      <button type="button" className="fx-explica__fechar" onClick={alternar}>Esconder</button>
    </div>
  );
}

export const VISOES = [
  { key: 'quadro', label: 'Quadro', icone: '🗂️' },
  { key: 'lista', label: 'Lista', icone: '📋' },
  { key: 'barras', label: 'Barras', icone: '📊' },
  { key: 'pizza', label: 'Pizza', icone: '🥧' },
];

/** Botões para alternar Quadro / Lista / Barras / Pizza. */
export function SeletorVisao({ valor, onChange, opcoes = VISOES }) {
  return (
    <div className="fx-seg" role="group" aria-label="Forma de ver">
      {opcoes.map((o) => (
        <button key={o.key} type="button" aria-pressed={valor === o.key} onClick={() => onChange(o.key)} title={`Ver como ${o.label}`}>
          <span aria-hidden>{o.icone}</span><span className="fx-seg__lbl">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Lembra a visão escolhida por funil (só neste navegador). */
export function useVisao(id, padrao) {
  const chave = `bdtech-visao-${id}`;
  const [v, setV] = React.useState(() => {
    try { return localStorage.getItem(chave) || padrao; } catch { return padrao; }
  });
  const set = (nv) => { setV(nv); try { localStorage.setItem(chave, nv); } catch { /* sem storage */ } };
  return [v, set];
}

export function Modal({ titulo, icone, onClose, children, largura }) {
  React.useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = overflow; };
  }, [onClose]);
  return (
    <div className="fx-modal-fundo" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="fx-modal fx" role="dialog" aria-modal="true" aria-label={titulo} style={largura ? { maxWidth: largura } : undefined}>
        <div className="fx-modal__topo">
          {icone && <span style={{ fontSize: 26 }} aria-hidden>{icone}</span>}
          <h2>{titulo}</h2>
          <button type="button" className="fx-modal__fechar" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="fx-modal__corpo">{children}</div>
      </div>
    </div>
  );
}

/** Botão "Copiar" que confirma visualmente. */
export function BotaoCopiar({ texto, rotulo = 'Copiar', className = 'fx-btn fx-btn--claro' }) {
  const [ok, setOk] = React.useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const t = document.createElement('textarea');
      t.value = texto; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch { /* sem cópia */ }
      t.remove();
    }
    setOk(true);
    setTimeout(() => setOk(false), 1800);
  }
  return <button type="button" className={className} onClick={copiar}>{ok ? '✓ Copiado!' : `📋 ${rotulo}`}</button>;
}

/** Barras horizontais simples, com número grande ao lado. */
export function Barras({ dados, titulo, onClick }) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  return (
    <div className="fx-grafico">
      {titulo && <h3 style={{ marginBottom: 6 }}>{titulo}</h3>}
      {dados.map((d) => (
        <div key={d.key} className="fx-barra" onClick={onClick ? () => onClick(d) : undefined} style={onClick ? { cursor: 'pointer' } : undefined}>
          <span className="fx-barra__lbl">{d.label}</span>
          <div className="fx-barra__trilho"><div className="fx-barra__fill" style={{ width: `${(d.valor / max) * 100}%`, background: d.cor }} /></div>
          <span className="fx-barra__num">{d.valor}</span>
        </div>
      ))}
    </div>
  );
}

/** Pizza (rosca) em SVG com legenda e total no meio. */
export function Pizza({ dados, titulo, rotuloTotal = 'no total' }) {
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const R = 90; const r = 56; const C = 110;
  let acumulado = 0;
  const fatias = dados.filter((d) => d.valor > 0).map((d) => {
    const ini = acumulado / total; acumulado += d.valor; const fim = acumulado / total;
    return { ...d, ini, fim };
  });
  const ponto = (frac, raio) => [C + raio * Math.sin(frac * 2 * Math.PI), C - raio * Math.cos(frac * 2 * Math.PI)];
  const caminho = ({ ini, fim }) => {
    if (fim - ini >= 0.9999) {
      return `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} L ${C - 0.01} ${C - r} A ${r} ${r} 0 1 0 ${C} ${C - r} Z`;
    }
    const [x1, y1] = ponto(ini, R); const [x2, y2] = ponto(fim, R);
    const [x3, y3] = ponto(fim, r); const [x4, y4] = ponto(ini, r);
    const grande = fim - ini > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${grande} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${grande} 0 ${x4} ${y4} Z`;
  };
  return (
    <div className="fx-grafico">
      {titulo && <h3 style={{ marginBottom: 14 }}>{titulo}</h3>}
      <div className="fx-pizza">
        <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label={titulo ?? 'Gráfico de pizza'}>
          {total === 0
            ? <circle cx={C} cy={C} r={(R + r) / 2} fill="none" stroke="var(--bd-surface-sunken)" strokeWidth={R - r} />
            : fatias.map((f) => <path key={f.key} d={caminho(f)} fill={f.cor} stroke="var(--bd-surface-card)" strokeWidth="2"><title>{`${f.label}: ${f.valor}`}</title></path>)}
          <text x={C} y={C - 2} textAnchor="middle" fontSize="34" fontWeight="800" fill="var(--bd-text-strong)">{total}</text>
          <text x={C} y={C + 20} textAnchor="middle" fontSize="13" fill="var(--bd-text-muted)">{rotuloTotal}</text>
        </svg>
        <div className="fx-legenda">
          {dados.map((d) => (
            <div key={d.key} className="fx-legenda__item">
              <span className="fx-legenda__cor" style={{ background: d.cor }} />
              <span>{d.label}</span>
              <span className="fx-legenda__num">{d.valor}{total ? <span className="fx-muted" style={{ fontWeight: 500, fontSize: 13 }}> · {Math.round((d.valor / total) * 100)}%</span> : null}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Chuva de confete para comemorar um fechamento. */
export function Confete({ ativo }) {
  if (!ativo) return null;
  const cores = ['#009FE0', '#16A34A', '#F59E0B', '#E11D48', '#8B5CF6', '#FACC15'];
  return (
    <div className="fx-confete" aria-hidden>
      {Array.from({ length: 70 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: cores[i % cores.length], animationDelay: `${(i % 14) * 0.08}s`, transform: `rotate(${i * 23}deg)` }} />
      ))}
    </div>
  );
}

export function AvisoMigration() {
  return (
    <div className="fx-aviso">
      <strong>Falta um passo no banco de dados.</strong> Esta parte precisa da atualização
      <code style={{ margin: '0 4px' }}>supabase/migrations/0010_funis_automacoes.sql</code>.
      Peça para quem cuida do sistema abrir o Supabase → SQL Editor, colar esse arquivo e clicar em <em>Run</em>.
      Ela só adiciona coisas novas: nenhum dado é apagado.
    </div>
  );
}

export function faltaMigration(error) {
  if (!error) return false;
  return error.code === '42703' || error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === 'PGRST202'
    || /column .* does not exist|could not find the (table|function)|schema cache/i.test(error.message ?? '');
}
