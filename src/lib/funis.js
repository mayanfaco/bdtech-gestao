// Regras dos três funis (Prospecção, Follow-up e Vendas). Tudo aqui é puro,
// sem acesso ao banco, para poder ser testado e reaproveitado pelas telas, pelo
// tutorial e pela ajuda.

// ---------------------------------------------------------------- Prospecção
export const PROSPECCAO_ETAPAS = [
  {
    key: 'para_abordar', label: 'Para abordar', curto: 'Novos', cor: '#64748B',
    dica: 'Contatos novos. Ainda não mandamos nenhuma mensagem.',
  },
  {
    key: 'mensagem_enviada', label: 'Mensagem enviada', curto: 'Aguardando', cor: '#009FE0',
    dica: 'Já mandamos a primeira mensagem. Se ninguém mexer, o sistema leva para o Follow-up sozinho.',
  },
  {
    key: 'respondeu', label: 'Respondeu', curto: 'Conversando', cor: '#F59E0B',
    dica: 'A pessoa respondeu. Agora é conversar e marcar uma visita.',
  },
  {
    key: 'reuniao', label: 'Visita marcada', curto: 'Visita', cor: '#16A34A',
    dica: 'Reunião ou vistoria marcada. Depois dela, faça a proposta.',
  },
];

// Etapas que existem mas não viram coluna (aparecem só como contadores).
export const PROSPECCAO_FORA_DO_QUADRO = {
  follow_up: 'No follow-up',
  geladeira: 'Na geladeira',
  sem_interesse: 'Sem interesse',
  virou_cliente: 'Virou cliente',
};

export const TIPOS_LOCAL = [
  'Condomínio residencial', 'Prédio comercial', 'Hospital / clínica', 'Escola',
  'Universidade / faculdade', 'Shopping', 'Hotel', 'Supermercado', 'Construtora',
  'Órgão público', 'Administradora de condomínio', 'Igreja / templo', 'Outro',
];

// ---------------------------------------------------------------- Follow-up
// Cadência agressiva: dia 1, 2, 4, 7, 10 e uma despedida no dia 14 (contados a
// partir da primeira mensagem). Os dias podem ser trocados em
// Configurações → Automações; isto é só o padrão.
export const CADENCIA_PADRAO = [1, 2, 4, 7, 10, 14];

export const TOQUES = [
  { passo: 1, nome: '1º toque', objetivo: 'Lembrar com leveza' },
  { passo: 2, nome: '2º toque', objetivo: 'Mostrar um benefício' },
  { passo: 3, nome: '3º toque', objetivo: 'Contar um caso real' },
  { passo: 4, nome: '4º toque', objetivo: 'Oferecer algo de graça' },
  { passo: 5, nome: '5º toque', objetivo: 'Pergunta direta' },
  { passo: 6, nome: 'Despedida', objetivo: 'Encerrar com elegância' },
];

/** Lê os dias da cadência das regras de automação (ou usa o padrão). */
export function cadenciaDasRegras(regras = []) {
  return CADENCIA_PADRAO.map((padrao, i) => {
    const r = regras.find((x) => x.key === `followup_toque_${i + 1}`);
    return r && Number.isFinite(Number(r.dias_prazo)) ? Number(r.dias_prazo) : padrao;
  });
}

const DIA_MS = 86400000;

/** "2026-11-23" → Date local à meia-noite (sem pulo de fuso). */
export function dataLocal(iso) {
  if (!iso) return null;
  if (iso instanceof Date) return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function hojeLocal(agora = new Date()) {
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

export function isoDia(date) {
  const d = dataLocal(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Situação do próximo toque de um item em follow-up.
 * @returns {null | {passo, toque, dia, data, situacao: 'atrasado'|'hoje'|'futuro', diasAte, ultimo}}
 */
export function proximoToque(item, cadencia = CADENCIA_PADRAO, agora = new Date()) {
  const passo = Number(item?.followup_passo);
  if (!item?.followup_inicio || !passo || passo < 1 || passo > cadencia.length) return null;
  const inicio = dataLocal(item.followup_inicio);
  const dia = cadencia[passo - 1];
  const data = new Date(inicio.getTime() + dia * DIA_MS);
  const diasAte = Math.round((data - hojeLocal(agora)) / DIA_MS);
  return {
    passo,
    toque: TOQUES[passo - 1],
    dia,
    data,
    situacao: diasAte < 0 ? 'atrasado' : diasAte === 0 ? 'hoje' : 'futuro',
    diasAte,
    ultimo: passo === cadencia.length,
  };
}

/** Ordena para a lista do dia: atrasados primeiro, depois hoje, depois futuros. */
export function ordenarPorUrgencia(itens, cadencia, agora) {
  return [...itens].sort((a, b) => {
    const pa = proximoToque(a, cadencia, agora);
    const pb = proximoToque(b, cadencia, agora);
    return (pa?.diasAte ?? 999) - (pb?.diasAte ?? 999);
  });
}

/**
 * O que gravar quando a pessoa confirma que mandou o toque atual.
 * Depois do último toque sem resposta, o lead vai para a "geladeira" e volta
 * sozinho para a prospecção depois de X dias; a proposta sai do follow-up
 * marcada como esgotada (passo 7) para a pessoa decidir.
 */
export function aposEnviarToque(item, { tipo = 'lead', cadencia = CADENCIA_PADRAO, diasGeladeira = 60, agora = new Date() } = {}) {
  const passo = Number(item.followup_passo) || 1;
  const agoraIso = agora.toISOString();
  if (passo < cadencia.length) {
    return { followup_passo: passo + 1, ultimo_contato_em: agoraIso };
  }
  if (tipo === 'lead') {
    const volta = new Date(hojeLocal(agora).getTime() + diasGeladeira * DIA_MS);
    return { funil_etapa: 'geladeira', followup_passo: null, reativar_em: isoDia(volta), ultimo_contato_em: agoraIso };
  }
  return { followup_passo: cadencia.length + 1, ultimo_contato_em: agoraIso };
}

// ---------------------------------------------------------------- Vendas
// O funil de vendas usa o status que a proposta já tem: não existe cadastro
// duplicado. Cada coluna junta um ou mais status.
export const VENDAS_ETAPAS = [
  { key: 'montando', label: 'Montando proposta', curto: 'Montando', cor: '#64748B', status: ['rascunho', 'aguardando_revisao', 'pronta_para_envio'], destino: 'rascunho' },
  { key: 'enviada', label: 'Proposta enviada', curto: 'Enviada', cor: '#009FE0', status: ['enviada', 'visualizada'], destino: 'enviada' },
  { key: 'negociando', label: 'Negociando', curto: 'Negociando', cor: '#F59E0B', status: ['em_negociacao'], destino: 'em_negociacao' },
  { key: 'fechou', label: 'Fechou!', curto: 'Fechou', cor: '#16A34A', status: ['aprovada'], destino: 'aprovada' },
];
export const VENDAS_PERDIDAS = ['recusada', 'expirada', 'cancelada', 'arquivada'];

export function etapaDeVenda(status) {
  return VENDAS_ETAPAS.find((e) => e.status.includes(status))?.key ?? (VENDAS_PERDIDAS.includes(status) ? 'nao_fechou' : null);
}

export function valorDaProposta(p) {
  return Number(p?.valor_total) || Number(p?.modelo1_valor_com_desconto) || 0;
}

// ---------------------------------------------------------------- Clientes fechados
const CONTRATO_FECHADO = ['assinado', 'ativo', 'proximo_vencimento', 'renovado', 'encerrado'];

/**
 * Clientes efetivamente fechados (proposta aprovada ou contrato assinado),
 * sem contar o mesmo cliente duas vezes. Usado pelo "Meu Lar".
 */
export function clientesFechados({ proposals = [], contracts = [], clients = [] }) {
  const nomes = Object.fromEntries(clients.map((c) => [c.id, c.nome]));
  const porCliente = new Map();
  const registrar = (clientId, chave, data, valor) => {
    const id = clientId ?? chave;
    const atual = porCliente.get(id);
    if (!atual || new Date(data) < new Date(atual.data)) {
      porCliente.set(id, { id, nome: nomes[clientId] ?? 'Cliente', data, valor: Math.max(valor, atual?.valor ?? 0) });
    } else if (valor > atual.valor) {
      atual.valor = valor;
    }
  };
  proposals.filter((p) => !p.deleted_at && p.status === 'aprovada')
    .forEach((p) => registrar(p.client_id, `p-${p.id}`, p.status_changed_at ?? p.created_at, valorDaProposta(p)));
  contracts.filter((c) => !c.deleted_at && CONTRATO_FECHADO.includes(c.status))
    .forEach((c) => registrar(c.client_id, `c-${c.id}`, c.data_assinatura ?? c.status_changed_at ?? c.created_at, Number(c.valor_total) || 0));
  return [...porCliente.values()].sort((a, b) => new Date(a.data) - new Date(b.data));
}

// ---------------------------------------------------------------- WhatsApp e scripts
/** Número em formato wa.me (só dígitos, com 55 quando faltar). */
export function numeroWhatsapp(telefone) {
  const d = String(telefone ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

export function linkWhatsapp(telefone, texto = '') {
  const n = numeroWhatsapp(telefone);
  const q = texto ? `?text=${encodeURIComponent(texto)}` : '';
  return n ? `https://wa.me/${n}${q}` : `https://wa.me/${q}`;
}

/** Troca {nome}, {local}, {seu_nome} pelo valor (ou por um texto neutro). */
export function preencherScript(texto, vars = {}) {
  // "Sra. Márcia Lima – síndica" vira "Sra. Márcia"; "João Silva" vira "João".
  const primeiroNome = (s) => {
    const partes = String(s ?? '').split(/\s[–—-]\s|,|\//)[0].trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '';
    const tratamento = /^(sr|sra|srta|dr|dra|seu|dona|d)\.?$/i.test(partes[0]);
    return tratamento && partes[1] ? `${partes[0]} ${partes[1]}` : partes[0];
  };
  const valores = {
    nome: primeiroNome(vars.nome),
    local: vars.local?.trim() || 'seu prédio',
    seu_nome: vars.seu_nome?.trim() || 'Cristóbulo',
  };
  return String(texto)
    .replace(/\{(nome|local|seu_nome)\}/g, (_, k) => valores[k])
    // Sem nome: "Olá, !" vira "Olá!"
    .replace(/,\s*([!?.])/g, '$1')
    .replace(/ {2,}/g, ' ');
}

// ---------------------------------------------------------------- Texto
export function normalizar(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// ---------------------------------------------------------------- Retomar depois
// Cliente pediu para conversar mais tarde: o cartão sai dos funis e volta
// sozinho na data combinada.
export const OPCOES_RETOMAR = [
  { key: '1m', label: 'Daqui a 1 mês', meses: 1 },
  { key: '3m', label: 'Daqui a 3 meses', meses: 3 },
  { key: '6m', label: 'Daqui a 6 meses', meses: 6 },
  { key: 'ano', label: 'Começo do próximo ano', ano: true },
];

export const MOTIVOS_RETOMAR = [
  'Só no próximo ano', 'Orçamento fechado este ano', 'Aguardando assembleia',
  'Troca de síndico', 'Pediu para ligar depois', 'Contrato atual ainda vigente',
];

/** Data (AAAA-MM-DD) em que o cartão volta, para uma opção rápida. */
export function dataRetomar(opcao, agora = new Date()) {
  const h = hojeLocal(agora);
  if (opcao.ano) {
    // primeiro dia útil de janeiro (pula sábado/domingo); evita o feriado de 1º de janeiro
    const d = new Date(h.getFullYear() + 1, 0, 2);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return isoDia(d);
  }
  const alvo = new Date(h.getFullYear(), h.getMonth() + opcao.meses, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(h.getDate(), ultimoDia));
  return isoDia(alvo);
}

/** Está guardado para depois (data ainda não chegou)? */
export function estaAdiado(item, agora = new Date()) {
  return Boolean(item?.retomar_em) && dataLocal(item.retomar_em) > hojeLocal(agora);
}

/** Voltou para a atenção porque chegou a data combinada (e ninguém mexeu ainda). */
export function voltouParaAtencao(item, agora = new Date()) {
  if (item?.retomado_em) return true;
  return Boolean(item?.retomar_em) && dataLocal(item.retomar_em) <= hojeLocal(agora);
}

export function formatarDia(iso) {
  return dataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
