import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDAS_ETAPAS, etapaDeVenda, valorDaProposta, proximoToque, TOQUES, estaAdiado, voltouParaAtencao } from '../../lib/funis.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { Quadro, pararArraste } from '../../components/funis/Quadro.jsx';
import { Explicacao, SeletorVisao, useVisao, Barras, Pizza, Modal, Confete } from '../../components/funis/ui.jsx';
import { atualizarProposta, guardarParaDepois, retomarAgora } from './useFunisDados.js';
import { BotaoRetomar, SeloVoltou, ModalRetomar, ModalGuardados } from '../../components/funis/Retomar.jsx';
import { ModalMotivo } from './modais.jsx';

const DIAS_FECHADAS_NO_QUADRO = 60;

export function Vendas({ dados, recarregar, avisar }) {
  const navigate = useNavigate();
  const [visao, setVisao] = useVisao('vendas', 'quadro');
  const [modal, setModal] = React.useState(null);
  const [festa, setFesta] = React.useState(false);

  const limiteFechadas = Date.now() - DIAS_FECHADAS_NO_QUADRO * 86400000;
  const propostas = dados.propostas.filter((p) => {
    const etapa = etapaDeVenda(p.status);
    if (!etapa || etapa === 'nao_fechou') return false;
    if (estaAdiado(p)) return false;
    if (etapa === 'fechou') return new Date(p.status_changed_at ?? p.created_at).getTime() >= limiteFechadas;
    return true;
  });
  const guardadas = dados.propostas.filter((p) => estaAdiado(p) && !['fechou', 'nao_fechou'].includes(etapaDeVenda(p.status)));
  const naoFecharam = dados.propostas.filter((p) => etapaDeVenda(p.status) === 'nao_fechou').length;
  const emAberto = propostas.filter((p) => ['enviada', 'negociando'].includes(etapaDeVenda(p.status)));
  const valorAberto = emAberto.reduce((s, p) => s + valorDaProposta(p), 0);
  const mesAtual = new Date(); mesAtual.setDate(1); mesAtual.setHours(0, 0, 0, 0);
  const fechadasMes = dados.propostas.filter((p) => p.status === 'aprovada' && new Date(p.status_changed_at ?? p.created_at) >= mesAtual);

  async function mudarStatus(p, status, extra = {}) {
    const patch = { status, ...extra };
    if (status === 'aprovada' || status === 'recusada') patch.followup_passo = null;
    const erro = await atualizarProposta(p, patch);
    if (erro) { avisar({ tipo: 'erro', texto: `Não foi possível mudar: ${erro.message}` }); return false; }
    await recarregar();
    return true;
  }

  async function fechou(p) {
    if (await mudarStatus(p, 'aprovada')) {
      setFesta(true);
      setModal({ tipo: 'festa', proposta: p });
      setTimeout(() => setFesta(false), 3200);
    }
  }

  function cartao(p) {
    const etapa = etapaDeVenda(p.status);
    const valor = valorDaProposta(p);
    const toque = proximoToque(p, dados.cadencia);
    return (
      <>
        {voltouParaAtencao(p) && <SeloVoltou item={p} />}
        <button type="button" className="fx-card__nome" {...pararArraste} onClick={() => navigate(`/propostas/${p.id}`)}>{p.clients?.nome || p.titulo || 'Proposta'}</button>
        <div className="fx-card__sub">{valor ? formatCurrency(valor) : 'Sem valor'}{p.servico_tipo ? ` · ${p.servico_tipo}` : ''}</div>
        {toque && <span className={`fx-chip ${toque.situacao === 'atrasado' ? 'fx-chip--vermelho' : toque.situacao === 'hoje' ? 'fx-chip--amarelo' : 'fx-chip--cinza'}`}>🔁 Follow-up: {TOQUES[toque.passo - 1].nome}</span>}
        {etapa === 'fechou' && <span className="fx-chip fx-chip--verde">🎉 Fechado em {new Date(p.status_changed_at).toLocaleDateString('pt-BR')}</span>}
        <div className="fx-card__acoes" {...pararArraste}>
          {etapa === 'montando' && <button type="button" className="fx-btn fx-btn--claro" onClick={() => navigate(`/propostas/${p.id}`)}>Abrir e enviar</button>}
          {etapa === 'enviada' && <button type="button" className="fx-btn fx-btn--claro" onClick={() => mudarStatus(p, 'em_negociacao', { ultimo_contato_em: new Date().toISOString() })}>💬 Está negociando</button>}
          {etapa === 'negociando' && (
            <>
              <button type="button" className="fx-btn fx-btn--verde" onClick={() => fechou(p)}>🎉 Fechou!</button>
              <button type="button" className="fx-btn fx-btn--texto" onClick={() => setModal({ tipo: 'perdeu', proposta: p })}>Não fechou</button>
            </>
          )}
          {etapa !== 'fechou' && <BotaoRetomar onClick={() => setModal({ tipo: 'retomar', proposta: p })} />}
        </div>
      </>
    );
  }

  const porEtapa = VENDAS_ETAPAS.map((e) => {
    const lista = propostas.filter((p) => etapaDeVenda(p.status) === e.key);
    return { key: e.key, label: e.label, cor: e.cor, valor: lista.length, reais: lista.reduce((s, p) => s + valorDaProposta(p), 0) };
  });

  return (
    <div className="fx-stack">
      <Confete ativo={festa} />
      <Explicacao id="vendas" icone="🤝">
        <p><strong>Para que serve:</strong> acompanhar cada proposta até virar contrato. <strong>Toda proposta que você cria aparece aqui sozinha.</strong> Quando
          o cliente responder, use os botões do cartão. Se uma proposta ficar parada, o sistema coloca no Follow-up para você cobrar. Fechou? Clique em
          <strong> "Fechou!"</strong> e veja a comemoração no Meu Lar.</p>
      </Explicacao>

      <div className="fx-row">
        <div className="fx-contadores">
          <span className="fx-contador">Em negociação: <b>{formatCurrency(valorAberto)}</b></span>
          <span className="fx-contador">Fechadas este mês: <b>{fechadasMes.length}</b></span>
          <span className="fx-contador">Não fecharam: <b>{naoFecharam}</b></span>
          <button type="button" className="fx-contador" onClick={() => setModal({ tipo: 'guardados' })}>⏰ Retomar depois: <b>{guardadas.length}</b> →</button>
        </div>
        <span className="fx-spacer" />
        <button type="button" className="fx-btn fx-btn--primario" onClick={() => navigate('/propostas/nova')}>＋ Nova proposta</button>
        <SeletorVisao valor={visao} onChange={setVisao} />
      </div>

      {visao === 'quadro' && (
        <Quadro
          colunas={VENDAS_ETAPAS.map((e) => ({ ...e, dica: e.key === 'fechou' ? `Fechadas nos últimos ${DIAS_FECHADAS_NO_QUADRO} dias.` : undefined }))}
          itens={propostas}
          colunaDe={(p) => etapaDeVenda(p.status)}
          renderCartao={cartao}
          classeDoCartao={(p) => (voltouParaAtencao(p) ? 'fx-card--voltou' : '')}
          onMover={(p, etapa) => {
            const destino = VENDAS_ETAPAS.find((e) => e.key === etapa)?.destino;
            if (destino === 'aprovada') fechou(p); else if (destino) mudarStatus(p, destino);
          }}
        />
      )}

      {visao === 'lista' && (
        <div className="fx-lista">
          {VENDAS_ETAPAS.map((e) => {
            const lista = propostas.filter((p) => etapaDeVenda(p.status) === e.key);
            if (!lista.length) return null;
            return (
              <React.Fragment key={e.key}>
                <div className="fx-secao" style={{ color: e.cor }}>{e.label} ({lista.length})</div>
                {lista.map((p) => <div key={p.id} className="fx-item"><div className="fx-item__info">{cartao(p)}</div></div>)}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {visao === 'barras' && (
        <div className="fx-stack">
          <Barras titulo="Quantas propostas em cada etapa" dados={porEtapa} />
          <div className="fx-grafico">
            <h3 style={{ marginBottom: 6 }}>Quanto dinheiro em cada etapa</h3>
            {porEtapa.map((d) => {
              const max = Math.max(1, ...porEtapa.map((x) => x.reais));
              return (
                <div key={d.key} className="fx-barra" style={{ gridTemplateColumns: 'minmax(110px,180px) 1fr minmax(90px,auto)' }}>
                  <span className="fx-barra__lbl">{d.label}</span>
                  <div className="fx-barra__trilho"><div className="fx-barra__fill" style={{ width: `${(d.reais / max) * 100}%`, background: d.cor }} /></div>
                  <span className="fx-barra__num" style={{ fontSize: 14 }}>{formatCurrency(d.reais)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {visao === 'pizza' && <Pizza titulo="Propostas por etapa" dados={porEtapa} rotuloTotal="propostas" />}

      {modal?.tipo === 'retomar' && (
        <ModalRetomar nome={modal.proposta.clients?.nome || modal.proposta.titulo || 'Este cliente'} atual={modal.proposta} onClose={() => setModal(null)}
          onConfirmar={async (data, obs) => {
            const erro = await guardarParaDepois(modal.proposta, 'proposta', data, obs);
            if (erro) { avisar({ tipo: 'erro', texto: erro.message }); return; }
            setModal(null); await recarregar();
            avisar({ tipo: 'ok', texto: 'Guardada! A proposta volta sozinha para você na data combinada.' });
          }} />
      )}
      {modal?.tipo === 'guardados' && (
        <ModalGuardados
          itens={guardadas.map((p) => ({ id: p.id, tipo: 'proposta', titulo: p.clients?.nome || p.titulo || 'Proposta', retomar_em: p.retomar_em, retomar_obs: p.retomar_obs, origem: p }))}
          onClose={() => setModal(null)}
          onMudarData={(i) => setModal({ tipo: 'retomar', proposta: i.origem })}
          onRetomarAgora={async (i) => { await retomarAgora(i.origem, 'proposta'); setModal(null); await recarregar(); }} />
      )}
      {modal?.tipo === 'perdeu' && (
        <ModalMotivo titulo="Não fechou" onClose={() => setModal(null)} onConfirmar={async (motivo) => {
          await mudarStatus(modal.proposta, 'recusada', { motivo_recusa: motivo || null });
          setModal(null);
        }} />
      )}
      {modal?.tipo === 'festa' && (
        <Modal titulo="Parabéns! 🎉" onClose={() => setModal(null)}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55 }}>
            Mais um cliente fechado: <strong>{modal.proposta.clients?.nome || modal.proposta.titulo}</strong>. A família está comemorando!
          </p>
          <div className="fx-row">
            <button type="button" className="fx-btn fx-btn--verde fx-btn--lg" onClick={() => navigate('/meu-lar')}>🏡 Ver no Meu Lar</button>
            <button type="button" className="fx-btn fx-btn--claro fx-btn--lg" onClick={() => navigate(`/contratos/novo?propostaId=${modal.proposta.id}${modal.proposta.client_id ? `&clienteId=${modal.proposta.client_id}` : ''}`)}>Gerar contrato</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
