import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { PROSPECCAO_ETAPAS, PROSPECCAO_FORA_DO_QUADRO, estaAdiado, voltouParaAtencao } from '../../lib/funis.js';
import { scriptDeAbordagem } from '../../content/scripts.js';
import { Quadro, pararArraste } from '../../components/funis/Quadro.jsx';
import { Explicacao, SeletorVisao, useVisao, Barras, Pizza } from '../../components/funis/ui.jsx';
import { atualizarLead, guardarParaDepois, retomarAgora } from './useFunisDados.js';
import { BotaoRetomar, SeloVoltou, ModalRetomar, ModalGuardados } from '../../components/funis/Retomar.jsx';
import { ModalMensagem, ModalContato, ModalData, ModalMotivo, ModalFicha, SCRIPTS_ABORDAGEM } from './modais.jsx';

const DIA = 86400000;
const diasDesde = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso)) / DIA)) : null);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export function Prospeccao({ dados, recarregar, avisar }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [visao, setVisao] = useVisao('prospeccao', 'quadro');
  const [modal, setModal] = React.useState(params.get('novo') ? { tipo: 'novo', inicial: lerPrefill(params) } : null);
  const fechar = () => { setModal(null); if (params.get('novo')) { params.delete('novo'); setParams(params, { replace: true }); } };

  const leads = dados.leads;
  // Quem pediu para conversar mais tarde fica guardado fora do quadro.
  const guardados = leads.filter((l) => estaAdiado(l));
  const noQuadro = leads.filter((l) => !estaAdiado(l) && PROSPECCAO_ETAPAS.some((e) => e.key === l.funil_etapa));
  const contagem = (k) => leads.filter((l) => !estaAdiado(l) && l.funil_etapa === k).length;
  const contato = (l) => ({ nome: l.nome, local: l.empresa, telefone: l.whatsapp || l.telefone, seu_nome: dados.seuNome });

  async function mover(lead, etapa, extra = {}, registro) {
    const agora = new Date().toISOString();
    const patch = { funil_etapa: etapa, ...extra };
    if (etapa === 'mensagem_enviada') Object.assign(patch, { abordado_em: lead.abordado_em ?? agora, ultimo_contato_em: agora, status: 'em_contato' });
    if (etapa === 'respondeu') Object.assign(patch, { ultimo_contato_em: agora, followup_passo: null, status: 'qualificado' });
    if (etapa === 'para_abordar') Object.assign(patch, { followup_passo: null, reativar_em: null });
    const erro = await atualizarLead(lead, patch, registro ?? { tipo: 'stage_change', titulo: `Mudou para: ${PROSPECCAO_ETAPAS.find((e) => e.key === etapa)?.label ?? etapa}` });
    if (erro) { avisar({ tipo: 'erro', texto: `Não foi possível mover: ${erro.message}` }); return false; }
    await recarregar();
    return true;
  }

  async function marcarVisita(lead, data, noCalendario) {
    await mover(lead, 'reuniao', { reuniao_em: data.toISOString() }, { tipo: 'meeting_logged', titulo: 'Visita marcada', texto: data.toLocaleString('pt-BR') });
    if (noCalendario) {
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('calendar_events').insert({
        titulo: `Visita: ${lead.empresa || lead.nome}`, data_inicio: data.toISOString(), tipo: 'visita_cliente',
        status: 'agendado', lead_id: lead.id, created_by: u.user.id, descricao: `Contato: ${lead.nome}${lead.whatsapp ? ` · ${lead.whatsapp}` : ''}`,
      });
    }
    setModal(null);
    avisar({ tipo: 'ok', texto: 'Visita marcada! Boa sorte 🍀' });
  }

  // Vira cliente e abre a proposta já com ele selecionado.
  async function fazerProposta(lead) {
    let clientId = lead.converted_client_id;
    if (!clientId) {
      const { data: u } = await supabase.auth.getUser();
      const { data: cli, error } = await supabase.from('clients').insert({
        nome: lead.empresa || lead.nome, contato_nome: lead.nome, whatsapp: lead.whatsapp || null,
        contato_telefone: lead.whatsapp || lead.telefone || null, segmento: lead.tipo_local || null,
        status_relacionamento: 'prospect', cidade: lead.cidade || 'Fortaleza', estado: 'CE', created_by: u.user.id,
      }).select('id').single();
      if (error) { avisar({ tipo: 'erro', texto: `Não foi possível criar o cliente: ${error.message}` }); return; }
      clientId = cli.id;
    }
    await atualizarLead(lead, { funil_etapa: 'virou_cliente', status: 'convertido', converted_client_id: clientId, converted_at: new Date().toISOString() },
      { tipo: 'conversion', titulo: 'Virou cliente — proposta em andamento' });
    navigate(`/propostas/nova?clienteId=${clientId}`);
  }

  function renderCartao(l) {
    const dias = diasDesde(l.ultimo_contato_em ?? l.abordado_em ?? l.created_at);
    return (
      <>
        {voltouParaAtencao(l) && <SeloVoltou item={l} />}
        <button type="button" className="fx-card__nome" {...pararArraste} onClick={() => setModal({ tipo: 'ficha', lead: l })}>
          {l.empresa || l.nome}
        </button>
        <div className="fx-card__sub">{l.empresa ? l.nome : null}{l.tipo_local ? `${l.empresa ? ' · ' : ''}${l.tipo_local}` : ''}</div>
        {l.funil_etapa === 'mensagem_enviada' && (
          <span className="fx-chip fx-chip--azul">{dias === 0 ? 'Enviada hoje' : `Enviada há ${plural(dias, 'dia', 'dias')}`}</span>
        )}
        {l.funil_etapa === 'reuniao' && l.reuniao_em && (
          <span className="fx-chip fx-chip--verde">📅 {new Date(l.reuniao_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        )}
        {l.funil_etapa === 'respondeu' && dias >= 3 && <span className="fx-chip fx-chip--amarelo">Parado há {dias} dias</span>}
        <div className="fx-card__acoes" {...pararArraste}>
          {l.funil_etapa === 'para_abordar' && (
            <button type="button" className="fx-btn fx-btn--zap" onClick={() => setModal({ tipo: 'mensagem', lead: l })}>💬 Mandar mensagem</button>
          )}
          {l.funil_etapa === 'mensagem_enviada' && (
            <button type="button" className="fx-btn fx-btn--claro" onClick={() => mover(l, 'respondeu', {}, { tipo: 'message', titulo: 'Respondeu' })}>🙋 Respondeu</button>
          )}
          {l.funil_etapa === 'respondeu' && (
            <>
              <button type="button" className="fx-btn fx-btn--verde" onClick={() => setModal({ tipo: 'visita', lead: l })}>📅 Marcou visita</button>
              <button type="button" className="fx-btn fx-btn--texto" onClick={() => setModal({ tipo: 'perdido', lead: l })}>Sem interesse</button>
            </>
          )}
          {l.funil_etapa === 'reuniao' && (
            <>
              <button type="button" className="fx-btn fx-btn--primario" onClick={() => fazerProposta(l)}>📄 Fazer proposta</button>
              <button type="button" className="fx-btn fx-btn--texto" onClick={() => setModal({ tipo: 'perdido', lead: l })}>Sem interesse</button>
            </>
          )}
          <BotaoRetomar onClick={() => setModal({ tipo: 'retomar', lead: l })} />
        </div>
      </>
    );
  }

  const graficoDados = [
    ...PROSPECCAO_ETAPAS.map((e) => ({ key: e.key, label: e.label, cor: e.cor, valor: contagem(e.key) })),
    { key: 'follow_up', label: 'No follow-up', cor: '#8B5CF6', valor: contagem('follow_up') },
  ];

  return (
    <div className="fx-stack">
      <Explicacao id="prospeccao" icone="🎯">
        <p><strong>Para que serve:</strong> aqui você começa a conversa com quem tem elevador. Cadastre o contato, mande a primeira mensagem
          (o texto já vem pronto) e acompanhe quem respondeu. <strong>Se a pessoa não responder, o sistema leva para o Follow-up sozinho no dia seguinte</strong> — você não precisa lembrar.</p>
      </Explicacao>

      <div className="fx-row">
        <button type="button" className="fx-btn fx-btn--primario fx-btn--lg" onClick={() => setModal({ tipo: 'novo' })}>＋ Novo contato</button>
        <button type="button" className="fx-btn fx-btn--claro fx-btn--lg" onClick={() => navigate('/onde-prospectar')}>📍 Onde prospectar</button>
        <span className="fx-spacer" />
        <SeletorVisao valor={visao} onChange={setVisao} />
      </div>

      <div className="fx-contadores">
        {Object.entries(PROSPECCAO_FORA_DO_QUADRO).map(([k, label]) => (
          k === 'follow_up'
            ? <button key={k} type="button" className="fx-contador" onClick={() => navigate('/funis/followup')}>{label}: <b>{contagem(k)}</b> →</button>
            : <span key={k} className="fx-contador">{label}: <b>{contagem(k)}</b></span>
        ))}
        <button type="button" className="fx-contador" onClick={() => setModal({ tipo: 'guardados' })}>⏰ Retomar depois: <b>{guardados.length}</b> →</button>
      </div>

      {visao === 'quadro' && (
        <Quadro
          colunas={PROSPECCAO_ETAPAS.map((e) => ({ ...e, vazio: e.key === 'para_abordar' ? 'Clique em "Novo contato" para começar.' : 'Nada aqui por enquanto.' }))}
          itens={noQuadro}
          colunaDe={(l) => l.funil_etapa}
          renderCartao={renderCartao}
          classeDoCartao={(l) => (voltouParaAtencao(l) ? 'fx-card--voltou' : '')}
          onMover={(l, etapa) => mover(l, etapa)}
        />
      )}

      {visao === 'lista' && (
        <div className="fx-lista">
          {PROSPECCAO_ETAPAS.map((e) => {
            const doGrupo = noQuadro.filter((l) => l.funil_etapa === e.key);
            if (!doGrupo.length) return null;
            return (
              <React.Fragment key={e.key}>
                <div className="fx-secao" style={{ color: e.cor }}>{e.label} ({doGrupo.length})</div>
                {doGrupo.map((l) => <div key={l.id} className="fx-item"><div className="fx-item__info">{renderCartao(l)}</div></div>)}
              </React.Fragment>
            );
          })}
          {noQuadro.length === 0 && <div className="fx-col__empty">Nenhum contato na prospecção ainda. Clique em "Novo contato".</div>}
        </div>
      )}

      {visao === 'barras' && <Barras titulo="Quantos contatos em cada etapa" dados={graficoDados} />}
      {visao === 'pizza' && <Pizza titulo="Como está dividida a prospecção" dados={graficoDados} rotuloTotal="contatos" />}

      {modal?.tipo === 'novo' && (
        <ModalContato inicial={modal.inicial} onClose={fechar} onSalvo={async () => { fechar(); await recarregar(); avisar({ tipo: 'ok', texto: 'Contato salvo! Agora clique em "Mandar mensagem".' }); }} />
      )}
      {modal?.tipo === 'editar' && (
        <ModalContato lead={modal.lead} onClose={fechar} onSalvo={async () => { fechar(); await recarregar(); }} />
      )}
      {modal?.tipo === 'ficha' && (
        <ModalFicha lead={modal.lead} onClose={fechar} onEditar={() => setModal({ tipo: 'editar', lead: modal.lead })}
          onVoltarParaProspeccao={async () => { fechar(); await mover(modal.lead, 'para_abordar', { abordado_em: null }); }} />
      )}
      {modal?.tipo === 'mensagem' && (
        <ModalMensagem
          titulo="Primeira mensagem"
          contato={contato(modal.lead)}
          script={scriptDeAbordagem(modal.lead.tipo_local ?? '')}
          opcoes={SCRIPTS_ABORDAGEM}
          onClose={fechar}
          onConfirmar={async (texto) => {
            const ok = await mover(modal.lead, 'mensagem_enviada', {}, { tipo: 'message', titulo: 'Primeira mensagem enviada', texto });
            if (ok) { fechar(); avisar({ tipo: 'ok', texto: 'Pronto! Se não responder, amanhã ele aparece no Follow-up.' }); }
          }}
        />
      )}
      {modal?.tipo === 'retomar' && (
        <ModalRetomar nome={modal.lead.empresa || modal.lead.nome} atual={modal.lead} onClose={fechar} onConfirmar={async (data, obs) => {
          const erro = await guardarParaDepois(modal.lead, 'lead', data, obs);
          if (erro) { avisar({ tipo: 'erro', texto: erro.message }); return; }
          fechar(); await recarregar();
          avisar({ tipo: 'ok', texto: 'Guardado! Ele volta sozinho para você na data combinada.' });
        }} />
      )}
      {modal?.tipo === 'guardados' && (
        <ModalGuardados
          itens={guardados.map((l) => ({ id: l.id, tipo: 'lead', titulo: l.empresa || l.nome, retomar_em: l.retomar_em, retomar_obs: l.retomar_obs, origem: l }))}
          onClose={fechar}
          onMudarData={(i) => setModal({ tipo: 'retomar', lead: i.origem })}
          onRetomarAgora={async (i) => { await retomarAgora(i.origem, 'lead'); fechar(); await recarregar(); avisar({ tipo: 'ok', texto: 'Voltou para o quadro, destacado em amarelo.' }); }}
        />
      )}
      {modal?.tipo === 'visita' && (
        <ModalData titulo="Quando é a visita?" rotulo="Data e hora" onClose={fechar} onConfirmar={(d, cal) => marcarVisita(modal.lead, d, cal)} />
      )}
      {modal?.tipo === 'perdido' && (
        <ModalMotivo titulo="Sem interesse" onClose={fechar} onConfirmar={async (motivo) => {
          await mover(modal.lead, 'sem_interesse', { status: 'descartado' }, { tipo: 'note', titulo: 'Sem interesse', texto: motivo || null });
          fechar();
        }} />
      )}
    </div>
  );
}

// "Adicionar à prospecção" a partir da tela Onde Prospectar chega com os dados na URL.
function lerPrefill(params) {
  const p = {};
  ['empresa', 'tipo_local', 'whatsapp', 'origem', 'observacoes'].forEach((k) => { if (params.get(k)) p[k] = params.get(k); });
  return p;
}
