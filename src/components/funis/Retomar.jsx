import React from 'react';
import { Modal } from './ui.jsx';
import { OPCOES_RETOMAR, MOTIVOS_RETOMAR, dataRetomar, formatarDia, isoDia, hojeLocal, dataLocal } from '../../lib/funis.js';

/** Botão pequeno que fica em todo cartão dos funis. */
export function BotaoRetomar({ onClick }) {
  return (
    <button type="button" className="fx-btn fx-btn--texto" onClick={onClick} title="O cliente pediu para conversar mais tarde">
      ⏰ Retomar depois
    </button>
  );
}

/** Selo do cartão que voltou porque chegou a data combinada. */
export function SeloVoltou({ item }) {
  return (
    <div className="fx-voltou">
      <strong>🔔 Hora de retomar</strong>
      {item.retomar_obs && <span> — {item.retomar_obs}</span>}
    </div>
  );
}

/**
 * "Quando devo voltar a falar com ele?" — opções rápidas ou uma data,
 * mais o motivo (para lembrar o que foi combinado).
 */
export function ModalRetomar({ nome, atual, onConfirmar, onClose }) {
  const [opcao, setOpcao] = React.useState(atual?.retomar_em ? 'data' : '');
  const [data, setData] = React.useState(atual?.retomar_em ?? '');
  const [obs, setObs] = React.useState(atual?.retomar_obs ?? '');
  const [erro, setErro] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const amanha = isoDia(new Date(hojeLocal().getTime() + 86400000));

  const escolhida = opcao === 'data' ? data : (OPCOES_RETOMAR.find((o) => o.key === opcao) ? dataRetomar(OPCOES_RETOMAR.find((o) => o.key === opcao)) : '');

  async function confirmar() {
    if (!escolhida) { setErro('Escolha quando o cartão deve voltar.'); return; }
    if (dataLocal(escolhida) <= hojeLocal()) { setErro('A data precisa ser a partir de amanhã.'); return; }
    setSalvando(true);
    await onConfirmar(escolhida, obs.trim() || null);
    setSalvando(false);
  }

  return (
    <Modal titulo="Retomar depois" icone="⏰" onClose={onClose}>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        <strong>{nome}</strong> pediu para conversar mais tarde? O cartão sai dos funis, fica guardado e <strong>volta sozinho para você</strong> na data combinada.
      </p>

      <div className="fx-campo">
        <label>Quando voltar a falar?</label>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {OPCOES_RETOMAR.map((o) => (
            <button key={o.key} type="button" className={`fx-btn fx-btn--lg ${opcao === o.key ? 'fx-btn--primario' : 'fx-btn--claro'}`}
              onClick={() => { setOpcao(o.key); setErro(''); }}>{o.label}</button>
          ))}
          <button type="button" className={`fx-btn fx-btn--lg ${opcao === 'data' ? 'fx-btn--primario' : 'fx-btn--claro'}`}
            onClick={() => { setOpcao('data'); setErro(''); }}>📅 Escolher a data</button>
        </div>
        {opcao === 'data' && (
          <input type="date" min={amanha} value={data} onChange={(e) => { setData(e.target.value); setErro(''); }} aria-label="Data para retomar" />
        )}
        {escolhida && <small style={{ fontSize: 14, color: 'var(--bd-text-strong)' }}>O cartão volta em <strong>{formatarDia(escolhida)}</strong>.</small>}
      </div>

      <div className="fx-campo">
        <label htmlFor="rt-obs">O que foi combinado? (opcional)</label>
        <div className="fx-row" style={{ gap: 6 }}>
          {MOTIVOS_RETOMAR.map((m) => (
            <button key={m} type="button" className={`fx-btn ${obs === m ? 'fx-btn--primario' : 'fx-btn--claro'}`} style={{ minHeight: 34, fontSize: 13 }} onClick={() => setObs(m)}>{m}</button>
          ))}
        </div>
        <input id="rt-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: síndico pediu para ligar depois da assembleia de março" />
      </div>

      {erro && <div className="fx-erro" role="alert">{erro}</div>}
      <button type="button" className="fx-btn fx-btn--verde fx-btn--lg fx-btn--block" disabled={salvando} onClick={confirmar}>
        {salvando ? 'Salvando...' : '✓ Guardar e me lembrar'}
      </button>
    </Modal>
  );
}

/** Lista de quem está guardado para retomar depois, em ordem de data. */
export function ModalGuardados({ itens, onRetomarAgora, onMudarData, onClose }) {
  const ordenados = [...itens].sort((a, b) => dataLocal(a.retomar_em) - dataLocal(b.retomar_em));
  return (
    <Modal titulo="Para retomar depois" icone="⏰" onClose={onClose} largura={640}>
      <p className="fx-muted" style={{ margin: 0 }}>Clientes que pediram para conversar mais tarde. Cada um volta sozinho para você na data marcada.</p>
      {ordenados.length === 0 && <div className="fx-col__empty">Nenhum cliente guardado para depois.</div>}
      <div className="fx-lista">
        {ordenados.map((i) => (
          <div key={i.id} className="fx-item" style={{ padding: 12 }}>
            <div className="fx-item__info" style={{ minWidth: 180 }}>
              <div className="fx-row" style={{ gap: 6 }}>
                <span className={`fx-chip ${i.tipo === 'lead' ? 'fx-chip--azul' : 'fx-chip--verde'}`}>{i.tipo === 'lead' ? 'Prospecção' : 'Proposta'}</span>
                <span className="fx-chip fx-chip--cinza">📅 {formatarDia(i.retomar_em)}</span>
              </div>
              <strong style={{ color: 'var(--bd-text-strong)' }}>{i.titulo}</strong>
              {i.retomar_obs && <span className="fx-card__sub">{i.retomar_obs}</span>}
            </div>
            <button type="button" className="fx-btn fx-btn--claro" onClick={() => onMudarData(i)}>Mudar data</button>
            <button type="button" className="fx-btn fx-btn--primario" onClick={() => onRetomarAgora(i)}>Retomar agora</button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
