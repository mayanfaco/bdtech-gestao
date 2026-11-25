import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { cadenciaDasRegras, voltouParaAtencao } from '../../lib/funis.js';
import { faltaMigration } from '../../components/funis/ui.jsx';

/**
 * Carrega tudo o que os três funis precisam. Antes de ler, roda a automação
 * (move quem ficou sem resposta para o follow-up etc.), para a tela sempre
 * mostrar a situação de hoje mesmo sem o agendador do banco.
 */
export function useFunisDados() {
  const [estado, setEstado] = React.useState({ carregando: true });

  const carregar = React.useCallback(async () => {
    const auto = await supabase.rpc('run_funnel_automations');
    const [leads, propostas, regras, empresa] = await Promise.all([
      supabase.from('leads').select('*').is('deleted_at', null).not('funil_etapa', 'is', null).order('updated_at', { ascending: false }),
      supabase.from('proposals')
        .select('*, clients(id, nome, whatsapp, contato_telefone, contato_nome, sindico_nome, segmento)')
        .is('deleted_at', null).order('status_changed_at', { ascending: false }),
      supabase.from('automation_rules').select('key, dias_prazo, ativo'),
      supabase.from('company_settings').select('representante_legal').limit(1).maybeSingle(),
    ]);
    const semMigration = faltaMigration(auto.error) || faltaMigration(leads.error) || faltaMigration(propostas.error);
    const regrasLista = regras.data ?? [];
    const diasGeladeira = regrasLista.find((r) => r.key === 'geladeira_reativar_dias')?.dias_prazo ?? 60;
    const representante = empresa.data?.representante_legal ?? '';
    setEstado({
      carregando: false,
      semMigration,
      erro: !semMigration ? (leads.error?.message || propostas.error?.message || null) : null,
      leads: leads.data ?? [],
      propostas: propostas.data ?? [],
      cadencia: cadenciaDasRegras(regrasLista),
      diasGeladeira,
      seuNome: representante.trim().split(/\s+/)[0] || 'Cristóbulo',
    });
  }, []);

  React.useEffect(() => { carregar(); }, [carregar]);
  return { ...estado, recarregar: carregar };
}

/** Atualiza um lead e registra a ação no histórico do lead. */
// Qualquer ação no cartão tira o aviso "voltou para sua atenção".
const comAtencaoResolvida = (item, patch) => (
  voltouParaAtencao(item) && !('retomar_em' in patch) ? { ...patch, retomado_em: null, retomar_em: null } : patch
);

export async function atualizarLead(lead, patch, registro) {
  const { error } = await supabase.from('leads').update(comAtencaoResolvida(lead, patch)).eq('id', lead.id);
  if (error) return error;
  if (registro) {
    await supabase.from('activity_log').insert({
      entity_type: 'lead', entity_id: lead.id, activity_type: registro.tipo ?? 'note', title: registro.titulo, body: registro.texto ?? null,
    });
  }
  return null;
}

export async function atualizarProposta(proposta, patch) {
  const { error } = await supabase.from('proposals').update(comAtencaoResolvida(proposta, patch)).eq('id', proposta.id);
  return error ?? null;
}

export function contatoDaProposta(p) {
  const c = p.clients ?? {};
  return {
    nome: c.contato_nome || c.sindico_nome || '',
    local: c.nome || p.titulo || '',
    telefone: c.whatsapp || c.contato_telefone || '',
  };
}

/** Guarda o cartão para depois: sai dos funis e volta na data combinada. */
export async function guardarParaDepois(item, tipo, data, obs) {
  const patch = { retomar_em: data, retomar_obs: obs, retomado_em: null, followup_passo: null };
  if (tipo === 'lead') {
    return atualizarLead(item, patch, { tipo: 'note', titulo: `Retomar em ${new Date(`${data}T12:00`).toLocaleDateString('pt-BR')}`, texto: obs });
  }
  return atualizarProposta(item, patch);
}

/** Traz de volta antes da hora (ou na hora): fica destacado para atenção. */
export async function retomarAgora(item, tipo) {
  const patch = { retomar_em: null, retomado_em: new Date().toISOString() };
  // Quem estava no follow-up/geladeira volta para a conversa (coluna "Respondeu").
  if (tipo === 'lead' && ['follow_up', 'geladeira', 'sem_interesse'].includes(item.funil_etapa)) {
    Object.assign(patch, { funil_etapa: 'respondeu', followup_passo: null, followup_inicio: null });
  }
  return tipo === 'lead'
    ? atualizarLead(item, patch, { tipo: 'note', titulo: 'Retomado' })
    : atualizarProposta(item, patch);
}
