import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Modal, BotaoCopiar } from '../../components/funis/ui.jsx';
import { linkWhatsapp, preencherScript, TIPOS_LOCAL, PROSPECCAO_ETAPAS, PROSPECCAO_FORA_DO_QUADRO, numeroWhatsapp } from '../../lib/funis.js';
import { SCRIPT_GRUPOS } from '../../content/scripts.js';

/**
 * Passo a passo para mandar uma mensagem:
 * 1) o texto já vem pronto (pode editar), 2) abre o WhatsApp, 3) confirma.
 */
export function ModalMensagem({ titulo, contato, script, opcoes, onConfirmar, onClose, textoConfirmar = '✓ Já mandei' }) {
  const [scriptId, setScriptId] = React.useState(script?.id);
  const escolhido = (opcoes ?? []).find((s) => s.id === scriptId) ?? script;
  const [texto, setTexto] = React.useState(() => preencherScript(escolhido?.texto ?? '', contato));
  const [abriu, setAbriu] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => { setTexto(preencherScript(escolhido?.texto ?? '', contato)); }, [scriptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const temNumero = Boolean(numeroWhatsapp(contato.telefone));

  return (
    <Modal titulo={titulo} icone="💬" onClose={onClose}>
      <div className="fx-muted" style={{ marginTop: -6 }}>
        Para: <strong style={{ color: 'var(--bd-text-strong)' }}>{contato.nome || contato.local || 'contato'}</strong>
        {contato.telefone ? ` · ${contato.telefone}` : ' · sem WhatsApp cadastrado'}
      </div>

      {opcoes?.length > 1 && (
        <div className="fx-campo">
          <label htmlFor="fx-script">Qual mensagem?</label>
          <select id="fx-script" value={scriptId} onChange={(e) => setScriptId(e.target.value)}>
            {opcoes.map((s) => <option key={s.id} value={s.id}>{s.titulo}</option>)}
          </select>
        </div>
      )}

      <div className="fx-campo">
        <label htmlFor="fx-texto">1. Confira o texto (pode mudar à vontade)</label>
        <textarea id="fx-texto" rows={6} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>

      <div className="fx-campo">
        <label>2. Envie pelo WhatsApp</label>
        <div className="fx-row">
          <a className="fx-btn fx-btn--zap fx-btn--lg" href={linkWhatsapp(contato.telefone, texto)} target="_blank" rel="noreferrer" onClick={() => setAbriu(true)}>
            Abrir o WhatsApp
          </a>
          <BotaoCopiar texto={texto} rotulo="Copiar texto" />
        </div>
        {!temNumero && <small>Sem número cadastrado: o WhatsApp vai pedir para você escolher o contato.</small>}
      </div>

      <div className="fx-campo">
        <label>3. Depois de enviar, confirme aqui</label>
        <button type="button" className="fx-btn fx-btn--verde fx-btn--lg fx-btn--block" disabled={salvando}
          onClick={async () => { setSalvando(true); await onConfirmar(texto); setSalvando(false); }}>
          {salvando ? 'Salvando...' : textoConfirmar}
        </button>
        {!abriu && <small>Dica: abra o WhatsApp primeiro, envie, e só depois clique aqui.</small>}
      </div>
    </Modal>
  );
}

const VAZIO = { nome: '', empresa: '', whatsapp: '', tipo_local: 'Condomínio residencial', cidade: 'Fortaleza', observacoes: '', origem: '' };

/** Cadastro ou edição de contato da prospecção. Só 3 campos obrigatórios. */
export function ModalContato({ lead, inicial, onSalvo, onClose }) {
  const [form, setForm] = React.useState(() => ({ ...VAZIO, ...(inicial ?? {}), ...(lead ?? {}) }));
  const [erros, setErros] = React.useState([]);
  const [salvando, setSalvando] = React.useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function salvar(e) {
    e.preventDefault();
    const lista = [];
    if (!form.nome.trim()) lista.push('Escreva o nome da pessoa (ex.: "Sr. João – síndico").');
    if (!form.empresa.trim()) lista.push('Escreva o nome do local (ex.: "Edifício Solar").');
    const dig = form.whatsapp.replace(/\D/g, '');
    if (dig && dig.length < 10) lista.push('O WhatsApp parece incompleto. Use DDD + número, ex.: 85 99999-9999.');
    setErros(lista);
    if (lista.length) return;
    setSalvando(true);
    const dados = {
      nome: form.nome.trim(), empresa: form.empresa.trim(), whatsapp: form.whatsapp.trim() || null,
      tipo_local: form.tipo_local, cidade: form.cidade || null, observacoes: form.observacoes || null, origem: form.origem || null,
    };
    let resp;
    if (lead?.id) {
      resp = await supabase.from('leads').update(dados).eq('id', lead.id).select().single();
    } else {
      const { data: u } = await supabase.auth.getUser();
      resp = await supabase.from('leads').insert({ ...dados, created_by: u.user.id, funil_etapa: 'para_abordar', status: 'novo' }).select().single();
    }
    setSalvando(false);
    if (resp.error) { setErros([`Não foi possível salvar: ${resp.error.message}`]); return; }
    onSalvo(resp.data);
  }

  return (
    <Modal titulo={lead?.id ? 'Editar contato' : 'Novo contato'} icone="👤" onClose={onClose}>
      <form onSubmit={salvar} className="fx-stack" style={{ gap: 14 }}>
        {erros.length > 0 && <div className="fx-erro" role="alert">{erros.map((x) => <div key={x}>• {x}</div>)}</div>}
        <div className="fx-campo">
          <label htmlFor="c-nome">Nome da pessoa *</label>
          <input id="c-nome" value={form.nome} onChange={set('nome')} placeholder="Ex.: Sr. João – síndico" autoFocus />
        </div>
        <div className="fx-campo">
          <label htmlFor="c-local">Nome do local *</label>
          <input id="c-local" value={form.empresa} onChange={set('empresa')} placeholder="Ex.: Edifício Solar do Meireles" />
        </div>
        <div className="fx-campo">
          <label htmlFor="c-zap">WhatsApp</label>
          <input id="c-zap" inputMode="tel" value={form.whatsapp ?? ''} onChange={set('whatsapp')} placeholder="85 99999-9999" />
        </div>
        <div className="fx-campo">
          <label htmlFor="c-tipo">Tipo de local</label>
          <select id="c-tipo" value={form.tipo_local ?? ''} onChange={set('tipo_local')}>
            {TIPOS_LOCAL.map((t) => <option key={t}>{t}</option>)}
          </select>
          <small>Serve para o sistema escolher a melhor mensagem.</small>
        </div>
        <div className="fx-campo">
          <label htmlFor="c-origem">Como conheceu? (opcional)</label>
          <input id="c-origem" value={form.origem ?? ''} onChange={set('origem')} placeholder="Ex.: indicação do Sr. Gualter" />
        </div>
        <div className="fx-campo">
          <label htmlFor="c-obs">Anotações (opcional)</label>
          <textarea id="c-obs" rows={3} value={form.observacoes ?? ''} onChange={set('observacoes')} />
        </div>
        <button type="submit" className="fx-btn fx-btn--primario fx-btn--lg fx-btn--block" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar contato'}</button>
      </form>
    </Modal>
  );
}

/** Pergunta uma data (visita) de forma simples. */
export function ModalData({ titulo, rotulo, onConfirmar, onClose }) {
  const amanha = new Date(Date.now() + 86400000);
  const [data, setData] = React.useState(`${amanha.toISOString().slice(0, 10)}T09:00`);
  const [noCalendario, setNoCalendario] = React.useState(true);
  return (
    <Modal titulo={titulo} icone="📅" onClose={onClose}>
      <div className="fx-campo">
        <label htmlFor="fx-data">{rotulo}</label>
        <input id="fx-data" type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} />
      </div>
      <label className="fx-row" style={{ gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={noCalendario} onChange={(e) => setNoCalendario(e.target.checked)} style={{ width: 20, height: 20 }} />
        Colocar também no Calendário
      </label>
      <button type="button" className="fx-btn fx-btn--verde fx-btn--lg fx-btn--block" onClick={() => onConfirmar(new Date(data), noCalendario)}>Confirmar</button>
    </Modal>
  );
}

/** Pergunta o motivo de perda — opcional, com respostas prontas. */
export function ModalMotivo({ titulo, onConfirmar, onClose }) {
  const prontos = ['Achou caro', 'Já tem consultoria', 'Não é prioridade agora', 'Não respondeu mais', 'Escolheu outra empresa'];
  const [motivo, setMotivo] = React.useState('');
  return (
    <Modal titulo={titulo} icone="📝" onClose={onClose}>
      <p className="fx-muted" style={{ margin: 0 }}>Por quê? (opcional, mas ajuda a vender melhor)</p>
      <div className="fx-row">
        {prontos.map((p) => (
          <button key={p} type="button" className={`fx-btn ${motivo === p ? 'fx-btn--primario' : 'fx-btn--claro'}`} onClick={() => setMotivo(p)}>{p}</button>
        ))}
      </div>
      <div className="fx-campo">
        <label htmlFor="fx-motivo">Ou escreva</label>
        <input id="fx-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      <button type="button" className="fx-btn fx-btn--claro fx-btn--lg fx-btn--block" onClick={() => onConfirmar(motivo)}>Confirmar</button>
    </Modal>
  );
}

/** Ficha do contato com histórico. */
export function ModalFicha({ lead, onEditar, onClose, onVoltarParaProspeccao }) {
  const [historico, setHistorico] = React.useState(null);
  React.useEffect(() => {
    supabase.from('activity_log').select('id, title, body, created_at').eq('entity_type', 'lead').eq('entity_id', lead.id)
      .order('created_at', { ascending: false }).limit(20).then(({ data }) => setHistorico(data ?? []));
  }, [lead.id]);
  const etapa = PROSPECCAO_ETAPAS.find((e) => e.key === lead.funil_etapa)?.label ?? PROSPECCAO_FORA_DO_QUADRO[lead.funil_etapa] ?? '—';
  const linha = (rotulo, valor) => valor ? <div><span className="fx-muted">{rotulo}: </span><strong>{valor}</strong></div> : null;
  return (
    <Modal titulo={lead.nome} icone="👤" onClose={onClose}>
      <div className="fx-stack" style={{ gap: 6 }}>
        {linha('Local', lead.empresa)}
        {linha('Tipo', lead.tipo_local)}
        {linha('WhatsApp', lead.whatsapp || lead.telefone)}
        {linha('Etapa', etapa)}
        {linha('Como conheceu', lead.origem)}
        {lead.reativar_em && linha('Volta para a prospecção em', new Date(`${lead.reativar_em}T12:00`).toLocaleDateString('pt-BR'))}
        {linha('Anotações', lead.observacoes)}
      </div>
      <div className="fx-row">
        <button type="button" className="fx-btn fx-btn--claro" onClick={onEditar}>✏️ Editar dados</button>
        {['geladeira', 'sem_interesse'].includes(lead.funil_etapa) && onVoltarParaProspeccao && (
          <button type="button" className="fx-btn fx-btn--claro" onClick={onVoltarParaProspeccao}>↩️ Tentar de novo agora</button>
        )}
      </div>
      <h3>Histórico</h3>
      {historico === null ? <div className="fx-muted">Carregando...</div>
        : historico.length === 0 ? <div className="fx-muted">Nada registrado ainda.</div>
          : (
            <div className="fx-lista" style={{ gap: 6 }}>
              {historico.map((h) => (
                <div key={h.id} style={{ fontSize: 14 }}>
                  <span className="fx-muted">{new Date(h.created_at).toLocaleDateString('pt-BR')} · </span>
                  <strong>{h.title}</strong>{h.body ? <span className="fx-muted"> — {h.body.length > 90 ? `${h.body.slice(0, 90)}…` : h.body}</span> : null}
                </div>
              ))}
            </div>
          )}
    </Modal>
  );
}

export const SCRIPTS_ABORDAGEM = SCRIPT_GRUPOS[0].scripts;
