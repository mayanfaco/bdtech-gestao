import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TOQUES, proximoToque, ordenarPorUrgencia, aposEnviarToque, estaAdiado, voltouParaAtencao } from '../../lib/funis.js';
import { scriptDoToque, SCRIPT_GRUPOS, SCRIPT_RETOMAR } from '../../content/scripts.js';
import { Quadro, pararArraste } from '../../components/funis/Quadro.jsx';
import { Explicacao, SeletorVisao, useVisao, Barras, Pizza } from '../../components/funis/ui.jsx';
import { atualizarLead, atualizarProposta, contatoDaProposta, guardarParaDepois, retomarAgora } from './useFunisDados.js';
import { BotaoRetomar, SeloVoltou, ModalRetomar, ModalGuardados } from '../../components/funis/Retomar.jsx';
import { ModalMensagem, ModalMotivo } from './modais.jsx';

const ABERTAS = ['enviada', 'visualizada', 'em_negociacao'];
const CORES_TOQUE = ['#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#64748B'];

function quando(t) {
  if (!t) return null;
  if (t.situacao === 'atrasado') return { classe: 'fx-chip--vermelho', texto: `Atrasado ${Math.abs(t.diasAte)} dia(s)` };
  if (t.situacao === 'hoje') return { classe: 'fx-chip--amarelo', texto: 'Para hoje' };
  if (t.diasAte === 1) return { classe: 'fx-chip--cinza', texto: 'Amanhã' };
  return { classe: 'fx-chip--cinza', texto: `${t.data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}` };
}

export function Followup({ dados, recarregar, avisar }) {
  const navigate = useNavigate();
  const [visao, setVisao] = useVisao('followup', 'lista');
  const [modal, setModal] = React.useState(null);
  const { cadencia } = dados;

  // Junta leads e propostas num formato só.
  const itens = React.useMemo(() => {
    const deLeads = dados.leads.filter((l) => !estaAdiado(l) && l.funil_etapa === 'follow_up' && l.followup_passo).map((l) => ({
      id: `l-${l.id}`, tipo: 'lead', origem: l, titulo: l.empresa || l.nome, sub: l.empresa ? l.nome : l.tipo_local,
      followup_passo: l.followup_passo, followup_inicio: l.followup_inicio,
      contato: { nome: l.nome, local: l.empresa, telefone: l.whatsapp || l.telefone, seu_nome: dados.seuNome },
    }));
    const dePropostas = dados.propostas.filter((p) => !estaAdiado(p) && ABERTAS.includes(p.status) && p.followup_passo >= 1 && p.followup_passo <= cadencia.length).map((p) => ({
      id: `p-${p.id}`, tipo: 'proposta', origem: p, titulo: p.clients?.nome || p.titulo || 'Proposta', sub: 'Proposta enviada',
      followup_passo: p.followup_passo, followup_inicio: p.followup_inicio,
      contato: { ...contatoDaProposta(p), seu_nome: dados.seuNome },
    }));
    return ordenarPorUrgencia([...deLeads, ...dePropostas], cadencia);
  }, [dados, cadencia]);

  const esgotadas = dados.propostas.filter((p) => !estaAdiado(p) && ABERTAS.includes(p.status) && p.followup_passo > cadencia.length);

  // Clientes que pediram para conversar depois: guardados e os que já voltaram.
  const comoItem = (x, tipo) => (tipo === 'lead'
    ? { id: `l-${x.id}`, tipo, origem: x, titulo: x.empresa || x.nome, retomar_em: x.retomar_em, retomar_obs: x.retomar_obs,
      contato: { nome: x.nome, local: x.empresa, telefone: x.whatsapp || x.telefone, seu_nome: dados.seuNome } }
    : { id: `p-${x.id}`, tipo, origem: x, titulo: x.clients?.nome || x.titulo || 'Proposta', retomar_em: x.retomar_em, retomar_obs: x.retomar_obs,
      contato: { ...contatoDaProposta(x), seu_nome: dados.seuNome } });
  const propostasVivas = dados.propostas.filter((p) => !['aprovada', 'recusada', 'cancelada', 'arquivada'].includes(p.status));
  const guardados = [
    ...dados.leads.filter((l) => estaAdiado(l)).map((l) => comoItem(l, 'lead')),
    ...propostasVivas.filter((p) => estaAdiado(p)).map((p) => comoItem(p, 'proposta')),
  ];
  const voltaram = [
    ...dados.leads.filter((l) => voltouParaAtencao(l)).map((l) => comoItem(l, 'lead')),
    ...propostasVivas.filter((p) => voltouParaAtencao(p)).map((p) => comoItem(p, 'proposta')),
  ];
  const comToque = itens.map((i) => ({ ...i, toque: proximoToque(i, cadencia) }));
  const atrasados = comToque.filter((i) => i.toque?.situacao === 'atrasado');
  const hoje = comToque.filter((i) => i.toque?.situacao === 'hoje');
  const proximos = comToque.filter((i) => i.toque?.situacao === 'futuro');

  async function enviado(item, texto) {
    const patch = aposEnviarToque(item.origem, { tipo: item.tipo, cadencia, diasGeladeira: dados.diasGeladeira });
    const erro = item.tipo === 'lead'
      ? await atualizarLead(item.origem, patch, { tipo: 'message', titulo: `${TOQUES[item.followup_passo - 1]?.nome ?? 'Toque'} enviado`, texto })
      : await atualizarProposta(item.origem, patch);
    if (erro) { avisar({ tipo: 'erro', texto: erro.message }); return; }
    setModal(null);
    await recarregar();
    avisar({ tipo: 'ok', texto: patch.funil_etapa === 'geladeira'
      ? 'Último toque enviado. O contato descansa e volta sozinho para a prospecção mais tarde.'
      : 'Anotado! O próximo toque já está agendado.' });
  }

  // Retomou o contato combinado: tira o destaque e recomeça a conversa.
  async function resolverRetomada(item, texto) {
    const agora = new Date().toISOString();
    const erro = item.tipo === 'lead'
      ? await atualizarLead(item.origem, { retomado_em: null, retomar_em: null, ultimo_contato_em: agora }, { tipo: 'message', titulo: 'Contato retomado', texto: texto ?? null })
      : await atualizarProposta(item.origem, { retomado_em: null, retomar_em: null, ultimo_contato_em: agora });
    if (erro) { avisar({ tipo: 'erro', texto: erro.message }); return; }
    await recarregar();
    avisar({ tipo: 'ok', texto: 'Anotado! Se ele não responder, o follow-up volta a cobrar normalmente.' });
  }

  async function respondeu(item) {
    const agora = new Date().toISOString();
    const erro = item.tipo === 'lead'
      ? await atualizarLead(item.origem, { funil_etapa: 'respondeu', followup_passo: null, ultimo_contato_em: agora, status: 'qualificado' }, { tipo: 'message', titulo: 'Respondeu no follow-up' })
      : await atualizarProposta(item.origem, { followup_passo: null, ultimo_contato_em: agora, status: 'em_negociacao' });
    if (erro) { avisar({ tipo: 'erro', texto: erro.message }); return; }
    await recarregar();
    avisar({ tipo: 'ok', texto: item.tipo === 'lead' ? 'Ótimo! Ele voltou para a Prospecção, na coluna "Respondeu".' : 'Ótimo! A proposta está em "Negociando" no Funil de Vendas.' });
  }

  function botoes(item) {
    return (
      <div className="fx-card__acoes" {...pararArraste}>
        <button type="button" className="fx-btn fx-btn--zap" onClick={() => setModal({ tipo: 'toque', item })}>💬 Mandar {item.toque?.toque?.nome ?? 'toque'}</button>
        <button type="button" className="fx-btn fx-btn--claro" onClick={() => respondeu(item)}>🙋 Respondeu</button>
        <BotaoRetomar onClick={() => setModal({ tipo: 'retomar', item })} />
      </div>
    );
  }

  function cartao(item) {
    const q = quando(item.toque);
    return (
      <>
        <div className="fx-row" style={{ gap: 6 }}>
          <span className={`fx-chip ${item.tipo === 'lead' ? 'fx-chip--azul' : 'fx-chip--verde'}`}>{item.tipo === 'lead' ? 'Prospecção' : 'Proposta'}</span>
          {q && <span className={`fx-chip ${q.classe}`}>{q.texto}</span>}
        </div>
        <div className="fx-card__nome" style={{ cursor: 'default' }}>{item.titulo}</div>
        {item.sub && <div className="fx-card__sub">{item.sub}</div>}
        <div className="fx-card__sub">{item.toque?.toque?.nome}: <em>{item.toque?.toque?.objetivo}</em></div>
        {botoes(item)}
      </>
    );
  }

  const linha = (item) => <div key={item.id} className="fx-item"><div className="fx-item__info">{cartao(item)}</div></div>;

  const dadosPorToque = TOQUES.map((t, i) => ({
    key: String(t.passo), label: `${t.nome} (dia ${cadencia[i]})`, cor: CORES_TOQUE[i], valor: comToque.filter((x) => x.followup_passo === t.passo).length,
  }));
  const dadosSituacao = [
    { key: 'atrasado', label: 'Atrasados', cor: '#F04438', valor: atrasados.length },
    { key: 'hoje', label: 'Para hoje', cor: '#F59E0B', valor: hoje.length },
    { key: 'futuro', label: 'Próximos dias', cor: '#94A3B8', valor: proximos.length },
  ];

  return (
    <div className="fx-stack">
      <Explicacao id="followup" icone="🔁">
        <p><strong>Para que serve:</strong> cobrar com educação quem ainda não respondeu. O sistema traz para cá, sozinho, quem recebeu mensagem e ficou em silêncio,
          e as propostas paradas. São <strong>6 toques: dia {cadencia.join(', ').replace(/, (\d+)$/, ' e $1')}</strong>. Todo dia, mande as mensagens da lista
          <strong> "Para hoje"</strong> — o texto certo de cada toque já vem pronto.</p>
      </Explicacao>

      <div className="fx-row">
        <div className="fx-contadores">
          <span className="fx-contador" style={atrasados.length ? { borderColor: '#F3B4AE' } : undefined}>🔴 Atrasados: <b>{atrasados.length}</b></span>
          <span className="fx-contador">🟡 Para hoje: <b>{hoje.length}</b></span>
          <span className="fx-contador">⚪ Próximos dias: <b>{proximos.length}</b></span>
          <button type="button" className="fx-contador" onClick={() => setModal({ tipo: 'guardados' })}>⏰ Retomar depois: <b>{guardados.length}</b> →</button>
        </div>
        <span className="fx-spacer" />
        <SeletorVisao valor={visao} onChange={setVisao} />
      </div>

      {visao === 'lista' && (
        <div className="fx-lista">
          {voltaram.length > 0 && <div className="fx-secao" style={{ color: '#7A4B00' }}>🔔 Voltaram para sua atenção — data combinada chegou</div>}
          {voltaram.map((i) => (
            <div key={i.id} className="fx-item fx-card--voltou">
              <div className="fx-item__info">
                <SeloVoltou item={i} />
                <div className="fx-row" style={{ gap: 6 }}>
                  <span className={`fx-chip ${i.tipo === 'lead' ? 'fx-chip--azul' : 'fx-chip--verde'}`}>{i.tipo === 'lead' ? 'Prospecção' : 'Proposta'}</span>
                </div>
                <div className="fx-card__nome" style={{ cursor: 'default' }}>{i.titulo}</div>
                <div className="fx-card__acoes">
                  <button type="button" className="fx-btn fx-btn--zap" onClick={() => setModal({ tipo: 'retomada', item: i })}>💬 Mandar mensagem</button>
                  <button type="button" className="fx-btn fx-btn--claro" onClick={() => resolverRetomada(i)}>✓ Já falei com ele</button>
                  <BotaoRetomar onClick={() => setModal({ tipo: 'retomar', item: i })} />
                </div>
              </div>
            </div>
          ))}
          {atrasados.length + hoje.length + voltaram.length === 0 && (
            <div className="fx-ok">🎉 Nenhuma mensagem pendente para hoje. Que tal cadastrar novos contatos na Prospecção?</div>
          )}
          {atrasados.length > 0 && <div className="fx-secao" style={{ color: '#B42318' }}>Atrasados — mande primeiro</div>}
          {atrasados.map(linha)}
          {hoje.length > 0 && <div className="fx-secao" style={{ color: '#92400E' }}>Para hoje</div>}
          {hoje.map(linha)}
          {proximos.length > 0 && <div className="fx-secao">Próximos dias (não precisa fazer nada agora)</div>}
          {proximos.map(linha)}
          {esgotadas.length > 0 && (
            <>
              <div className="fx-secao">Propostas sem resposta depois dos 6 toques — decida</div>
              {esgotadas.map((p) => (
                <div key={p.id} className="fx-item">
                  <div className="fx-item__info">
                    <div className="fx-card__nome" style={{ cursor: 'default' }}>{p.clients?.nome || p.titulo}</div>
                    <div className="fx-card__sub">Ninguém respondeu. Encerrar ou recomeçar a cadência?</div>
                  </div>
                  <button type="button" className="fx-btn fx-btn--claro" onClick={async () => { await atualizarProposta(p, { followup_passo: 1, followup_inicio: new Date().toISOString().slice(0, 10) }); recarregar(); }}>🔁 Recomeçar</button>
                  <button type="button" className="fx-btn fx-btn--perigo" onClick={() => setModal({ tipo: 'perdeu', proposta: p })}>Não fechou</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {visao === 'quadro' && (
        <Quadro
          colunas={TOQUES.map((t, i) => ({ key: t.passo, label: `${t.nome} · dia ${cadencia[i]}`, cor: CORES_TOQUE[i], dica: t.objetivo }))}
          itens={comToque}
          colunaDe={(i) => i.followup_passo}
          renderCartao={cartao}
          classeDoCartao={(i) => (i.toque?.situacao === 'atrasado' ? 'fx-card--alerta' : i.toque?.situacao === 'hoje' ? 'fx-card--hoje' : '')}
        />
      )}

      {visao === 'barras' && (
        <div className="fx-stack">
          <Barras titulo="Situação das mensagens" dados={dadosSituacao} />
          <Barras titulo="Em qual toque cada um está" dados={dadosPorToque} />
        </div>
      )}
      {visao === 'pizza' && <Pizza titulo="Situação das mensagens" dados={dadosSituacao} rotuloTotal="no follow-up" />}

      {modal?.tipo === 'toque' && (
        <ModalMensagem
          titulo={`${modal.item.toque?.toque?.nome ?? 'Toque'} — ${modal.item.titulo}`}
          contato={modal.item.contato}
          script={scriptDoToque(modal.item.followup_passo, modal.item.tipo)}
          opcoes={SCRIPT_GRUPOS.find((g) => g.key === (modal.item.tipo === 'proposta' ? 'proposta' : 'followup')).scripts}
          textoConfirmar="✓ Mandei este toque"
          onClose={() => setModal(null)}
          onConfirmar={(texto) => enviado(modal.item, texto)}
        />
      )}
      {modal?.tipo === 'retomar' && (
        <ModalRetomar nome={modal.item.titulo} atual={modal.item.origem} onClose={() => setModal(null)} onConfirmar={async (data, obs) => {
          const erro = await guardarParaDepois(modal.item.origem, modal.item.tipo, data, obs);
          if (erro) { avisar({ tipo: 'erro', texto: erro.message }); return; }
          setModal(null); await recarregar();
          avisar({ tipo: 'ok', texto: 'Guardado! Sai da cobrança e volta sozinho na data combinada.' });
        }} />
      )}
      {modal?.tipo === 'guardados' && (
        <ModalGuardados itens={guardados} onClose={() => setModal(null)}
          onMudarData={(i) => setModal({ tipo: 'retomar', item: i })}
          onRetomarAgora={async (i) => { await retomarAgora(i.origem, i.tipo); setModal(null); await recarregar(); }} />
      )}
      {modal?.tipo === 'retomada' && (
        <ModalMensagem titulo={`Retomar — ${modal.item.titulo}`} contato={modal.item.contato} script={SCRIPT_RETOMAR()}
          textoConfirmar="✓ Mandei a mensagem" onClose={() => setModal(null)}
          onConfirmar={async (texto) => { await resolverRetomada(modal.item, texto); setModal(null); }} />
      )}
      {modal?.tipo === 'perdeu' && (
        <ModalMotivo titulo="Não fechou" onClose={() => setModal(null)} onConfirmar={async (motivo) => {
          await atualizarProposta(modal.proposta, { status: 'recusada', motivo_recusa: motivo || 'Não respondeu ao follow-up', followup_passo: null });
          setModal(null); recarregar();
        }} />
      )}
      {itens.length === 0 && esgotadas.length === 0 && visao !== 'lista' && (
        <div className="fx-muted">Ninguém no follow-up agora. <button type="button" className="fx-btn fx-btn--texto" onClick={() => navigate('/funis/prospeccao')}>Ir para a Prospecção</button></div>
      )}
    </div>
  );
}
