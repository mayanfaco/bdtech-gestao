import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../lib/auth.jsx';
import { hojeLocal, dataCurta, addDias } from '../lib/dateUtils.js';
import { formatCurrency } from '../lib/proposalCalculations.js';
import { situacaoParcela, contratoNumeroLabel } from '../lib/recebimentos.js';
import { ParcelaItem, buscarParcelas } from '../components/recebimentos/ParcelaItem.jsx';
import { AvisoPagamento } from '../components/recebimentos/AvisoPagamento.jsx';
import { Card } from '../design-system/components/surfaces/Card.jsx';
import { Button } from '../design-system/components/buttons/Button.jsx';
import { Alert } from '../design-system/components/feedback/Alert.jsx';

const LIMITE = 5;
const EVENTO_ABERTO = ['agendado', 'confirmado', 'reagendado'];
const TAREFA_ABERTA = ['pendente', 'em_andamento', 'aguardando_terceiros'];
const TIPO_EVENTO = { vistoria: 'Vistoria', reuniao: 'Reunião', outro: 'Compromisso' };

// Data local (AAAA-MM-DD) de um timestamp — o banco guarda em UTC.
const diaLocal = (iso) => new Date(iso).toLocaleDateString('en-CA');
const horaLocal = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function quando(dia, hoje, hora) {
  if (dia < hoje) return { texto: `Era para ${dataCurta(dia)}`, atrasado: true };
  if (dia === hoje) return { texto: hora ? `Hoje, ${hora}` : 'Hoje', atrasado: false };
  if (dia === addDias(hoje, 1)) return { texto: hora ? `Amanhã, ${hora}` : 'Amanhã', atrasado: false };
  return { texto: `${dataCurta(dia)}${hora ? `, ${hora}` : ''}`, atrasado: false };
}

/** Linha de pendência que não é parcela: título, detalhe, prazo e botões. */
function Acao({ titulo, detalhe, prazo, atrasado, children }) {
  return (
    <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4"
      style={{ padding: 'var(--bd-space-4) 0', borderBottom: '1px solid var(--bd-border-subtle)', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bd-text-strong)' }}>{titulo}</div>
        {detalhe && <div style={{ fontSize: 14, color: 'var(--bd-text-muted)' }}>{detalhe}</div>}
        <div style={{ fontSize: 14, marginTop: 2, color: atrasado ? 'var(--bd-danger-500)' : 'var(--bd-text-muted)' }}>{prazo}</div>
      </div>
      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

export default function Inicio() {
  const { profile } = useAuth();
  const [dados, setDados] = React.useState(null);
  const [verTodas, setVerTodas] = React.useState(false);
  const [refresh, setRefresh] = React.useState(0);
  const [aviso, setAviso] = React.useState(null);
  const hoje = hojeLocal();
  const daquiUmaSemana = addDias(hoje, 7);

  React.useEffect(() => {
    const ate = new Date(`${daquiUmaSemana}T23:59:59`).toISOString();
    Promise.all([
      buscarParcelas((sel) => supabase.from('receivables').select(sel).is('cancelado_em', null).lte('vencimento', daquiUmaSemana).order('vencimento')),
      supabase.from('calendar_events').select('id, titulo, tipo, data_inicio, status, clients(nome)')
        // Só os últimos 14 dias: compromisso esquecido há meses não deve lotar o topo da lista.
        .in('status', EVENTO_ABERTO).gte('data_inicio', new Date(`${addDias(hoje, -14)}T00:00:00`).toISOString())
        .lte('data_inicio', ate).order('data_inicio'),
      supabase.from('tasks').select('id, titulo, prazo, status, clients(nome)').is('deleted_at', null)
        .in('status', TAREFA_ABERTA).lte('prazo', new Date(`${hoje}T23:59:59`).toISOString()).order('prazo'),
      supabase.from('contracts').select('id, numero, data_inicio, data_termino, status, contratante_nome, clients(nome)')
        .is('deleted_at', null).in('status', ['aguardando_assinatura', 'assinado', 'ativo', 'proximo_vencimento']),
    ]).then(([parcelas, eventos, tarefas, contratos]) => setDados({
      // Uma tabela que ainda não existe (migration não rodada) só deixa aquela parte vazia.
      parcelas: parcelas.data ?? [], eventos: eventos.data ?? [], tarefas: tarefas.data ?? [], contratos: contratos.data ?? [],
      erro: [parcelas, eventos, tarefas, contratos].some((r) => r.error),
    }));
  }, [hoje, daquiUmaSemana, refresh]);

  if (!dados) return null;
  const recarregar = () => setRefresh((n) => n + 1);

  async function marcarRealizado(evento) {
    await supabase.from('calendar_events').update({ status: 'realizado' }).eq('id', evento.id);
    recarregar();
  }
  async function concluirTarefa(tarefa) {
    await supabase.from('tasks').update({ status: 'concluida', concluida_em: new Date().toISOString() }).eq('id', tarefa.id);
    recarregar();
  }

  // Cada item: [ordem, data] para ordenar por urgência (atrasado → hoje → próximos dias → contratos).
  const itens = [];
  const contagem = { vencidos: 0, aVencer: 0, compromissos: 0, tarefas: 0, contratos: 0 };

  for (const p of dados.parcelas) {
    const s = situacaoParcela(p, hoje);
    if (s.status !== 'vencido' && s.status !== 'a_vencer') continue;
    if (s.status === 'a_vencer' && p.vencimento > daquiUmaSemana) continue;
    if (s.status === 'vencido') contagem.vencidos += 1; else contagem.aVencer += 1;
    itens.push({
      chave: `p-${p.id}`, ordem: s.status === 'vencido' ? 0 : p.vencimento === hoje ? 1 : 2, data: p.vencimento,
      node: <ParcelaItem key={`p-${p.id}`} parcela={p} hoje={hoje} compacto destaque onChanged={recarregar} onAviso={setAviso} />,
    });
  }

  for (const ev of dados.eventos) {
    const dia = diaLocal(ev.data_inicio);
    if (dia > daquiUmaSemana) continue;
    contagem.compromissos += 1;
    const q = quando(dia, hoje, horaLocal(ev.data_inicio));
    itens.push({
      chave: `e-${ev.id}`, ordem: dia < hoje ? 0 : dia === hoje ? 1 : 2, data: dia,
      node: (
        <Acao key={`e-${ev.id}`} titulo={`${TIPO_EVENTO[ev.tipo] ?? 'Compromisso'} · ${ev.clients?.nome ?? ev.titulo}`}
          detalhe={ev.clients?.nome ? ev.titulo : null}
          prazo={q.atrasado ? `${q.texto} — ainda não foi marcada como realizada` : q.texto} atrasado={q.atrasado}>
          {dia <= hoje && <Button size="sm" onClick={() => marcarRealizado(ev)}>Marcar como realizada</Button>}
          <Button size="sm" variant="outline" as={Link} to={`/calendario/${ev.id}`}>Ver na agenda</Button>
        </Acao>
      ),
    });
  }

  for (const t of dados.tarefas) {
    const dia = diaLocal(t.prazo);
    contagem.tarefas += 1;
    const q = quando(dia, hoje);
    itens.push({
      chave: `t-${t.id}`, ordem: dia < hoje ? 0 : 1, data: dia,
      node: (
        <Acao key={`t-${t.id}`} titulo={`Tarefa · ${t.titulo}`} detalhe={t.clients?.nome} prazo={q.texto} atrasado={q.atrasado}>
          <Button size="sm" onClick={() => concluirTarefa(t)}>Concluir tarefa</Button>
          <Button size="sm" variant="outline" as={Link} to={`/tarefas/${t.id}`}>Abrir</Button>
        </Acao>
      ),
    });
  }

  const limiteVigencia = addDias(hoje, 30);
  for (const c of dados.contratos) {
    const nome = c.clients?.nome ?? c.contratante_nome;
    if (c.status === 'aguardando_assinatura') {
      contagem.contratos += 1;
      itens.push({
        chave: `ca-${c.id}`, ordem: 3, data: c.data_inicio ?? '',
        node: (
          <Acao key={`ca-${c.id}`} titulo={`Contrato a assinar · ${nome}`} detalhe={contratoNumeroLabel(c)} prazo="Aguardando assinatura do cliente">
            <Button size="sm" variant="outline" as={Link} to={`/contratos/${c.id}`}>Abrir contrato</Button>
          </Acao>
        ),
      });
    } else if (c.data_termino && c.data_termino <= limiteVigencia) {
      contagem.contratos += 1;
      const venceu = c.data_termino < hoje;
      itens.push({
        chave: `cv-${c.id}`, ordem: 3, data: c.data_termino,
        node: (
          <Acao key={`cv-${c.id}`} titulo={`Contrato a renovar · ${nome}`} detalhe={contratoNumeroLabel(c)}
            prazo={venceu ? `Vigência terminou em ${dataCurta(c.data_termino)}` : `Vigência termina em ${dataCurta(c.data_termino)}`} atrasado={venceu}>
            <Button size="sm" variant="outline" as={Link} to={`/contratos/${c.id}`}>Ver contrato</Button>
          </Acao>
        ),
      });
    }
  }

  itens.sort((a, b) => a.ordem - b.ordem || a.data.localeCompare(b.data));
  const visiveis = verTodas ? itens : itens.slice(0, LIMITE);
  const totalVencido = dados.parcelas.reduce((s, p) => {
    const x = situacaoParcela(p, hoje);
    return x.status === 'vencido' ? s + x.saldo : s;
  }, 0);

  const resumo = [
    contagem.vencidos && `${contagem.vencidos} ${contagem.vencidos === 1 ? 'pagamento vencido' : 'pagamentos vencidos'} (${formatCurrency(totalVencido)})`,
    contagem.aVencer && `${contagem.aVencer} a vencer nos próximos 7 dias`,
    contagem.compromissos && `${contagem.compromissos} ${contagem.compromissos === 1 ? 'compromisso' : 'compromissos'}`,
    contagem.tarefas && `${contagem.tarefas} ${contagem.tarefas === 1 ? 'tarefa' : 'tarefas'} para hoje`,
    contagem.contratos && `${contagem.contratos} ${contagem.contratos === 1 ? 'contrato' : 'contratos'} pedindo atenção`,
  ].filter(Boolean);

  const primeiroNome = (profile?.displayName ?? '').split(' ')[0];
  const dataExtenso = new Date(`${hoje}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const dataHoje = dataExtenso.charAt(0).toUpperCase() + dataExtenso.slice(1);

  return (
    <div className="bd-u-flex-col bd-u-gap-5" style={{ maxWidth: 960 }}>
      <div>
        <div style={{ fontSize: 15, color: 'var(--bd-text-muted)' }}>{dataHoje}</div>
        <h1 style={{ fontSize: 26, marginTop: 2 }}>{primeiroNome ? `Olá, ${primeiroNome}. ` : ''}O que precisa ser feito hoje?</h1>
        {resumo.length > 0 && <p style={{ fontSize: 16, color: 'var(--bd-text-body)', marginTop: 6 }}>{resumo.join(' · ')}</p>}
      </div>

      <AvisoPagamento aviso={aviso} onFechar={() => setAviso(null)} />

      {dados.erro && (
        <Alert tone="warning">Uma parte das informações não pôde ser carregada. Atualize a página; se continuar, avise o suporte.</Alert>
      )}

      {itens.length === 0 ? (
        <Card padding="lg">
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--bd-text-strong)' }}>Tudo em dia.</div>
          <p style={{ marginTop: 4, color: 'var(--bd-text-muted)' }}>
            Nenhum pagamento vencido, compromisso ou tarefa para hoje.
          </p>
        </Card>
      ) : (
        <Card>
          <div style={{ marginTop: 'calc(-1 * var(--bd-space-4))', marginBottom: 'calc(-1 * var(--bd-space-4))' }}>
            {visiveis.map((it) => it.node)}
          </div>
        </Card>
      )}

      {itens.length > LIMITE && (
        <div>
          <Button variant="outline" onClick={() => setVerTodas((v) => !v)}>
            {verTodas ? 'Mostrar só as 5 mais urgentes' : `Ver todas as ${itens.length} pendências`}
          </Button>
        </div>
      )}

      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap', marginTop: 'var(--bd-space-2)' }}>
        <Button variant="ghost" as={Link} to="/recebimentos">Ver todos os recebimentos</Button>
        <Button variant="ghost" as={Link} to="/calendario">Abrir agenda</Button>
        <Button variant="ghost" as={Link} to="/relatorios">Ver relatórios</Button>
      </div>
    </div>
  );
}
