import React from 'react';
import { supabase } from './supabaseClient.js';
import { useAuth } from './auth.jsx';

// Fases do tutorial e o que cada uma libera no sistema.
export const FASES = [
  { key: 'boas_vindas', titulo: 'Boas-vindas', emoji: '👋', libera: null, liberaTexto: 'Ajuda e Guia de Vendas' },
  { key: 'prospeccao', titulo: 'Prospecção', emoji: '🎯', libera: 'prospeccao', liberaTexto: 'Funil de Prospecção e Onde Prospectar' },
  { key: 'followup', titulo: 'Follow-up', emoji: '🔁', libera: 'followup', liberaTexto: 'Funil de Follow-up' },
  { key: 'vendas', titulo: 'Vendas', emoji: '🤝', libera: 'vendas', liberaTexto: 'Funil de Vendas' },
  { key: 'lar', titulo: 'Meu Lar', emoji: '🏡', libera: 'lar', liberaTexto: 'Meu Lar' },
];

const CHAVE_LOCAL = (uid) => `bdtech-tutorial-${uid ?? 'anon'}`;

function lerLocal(uid) {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL(uid)) ?? '{}'); } catch { return {}; }
}
function gravarLocal(uid, valor) {
  try { localStorage.setItem(CHAVE_LOCAL(uid), JSON.stringify(valor)); } catch { /* sem storage: segue só com o banco */ }
}

const TutorialContext = React.createContext(null);

/**
 * Guarda as fases concluídas. Usa a tabela user_progress (migration 0010) e,
 * se ela ainda não existir, o navegador como reserva — assim nada quebra antes
 * de a migration ser rodada.
 */
export function TutorialProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.id;
  const [progresso, setProgresso] = React.useState(() => lerLocal(uid));
  const [exigir, setExigir] = React.useState(true);
  const [carregado, setCarregado] = React.useState(false);

  React.useEffect(() => {
    if (!uid) return;
    let vivo = true;
    const local = lerLocal(uid);
    setProgresso(local);
    Promise.all([
      supabase.from('user_progress').select('tutorial').eq('user_id', uid).maybeSingle(),
      supabase.from('company_settings').select('exigir_tutorial').limit(1).maybeSingle(),
    ]).then(([p, c]) => {
      if (!vivo) return;
      if (!p.error && p.data?.tutorial) {
        const junto = { ...local, ...p.data.tutorial };
        setProgresso(junto);
        gravarLocal(uid, junto);
      }
      if (!c.error && c.data && typeof c.data.exigir_tutorial === 'boolean') setExigir(c.data.exigir_tutorial);
      setCarregado(true);
    });
    return () => { vivo = false; };
  }, [uid]);

  const concluir = React.useCallback(async (fase) => {
    const novo = { ...progresso, [fase]: new Date().toISOString() };
    setProgresso(novo);
    gravarLocal(uid, novo);
    if (uid) await supabase.from('user_progress').upsert({ user_id: uid, tutorial: novo, updated_at: new Date().toISOString() });
  }, [progresso, uid]);

  const reiniciar = React.useCallback(async () => {
    setProgresso({});
    gravarLocal(uid, {});
    if (uid) await supabase.from('user_progress').upsert({ user_id: uid, tutorial: {}, updated_at: new Date().toISOString() });
  }, [uid]);

  const value = React.useMemo(() => {
    const feita = (fase) => Boolean(progresso[fase]);
    // Uma área está liberada se a fase dela foi concluída (ou se o
    // administrador desligou a exigência do tutorial).
    const liberado = (area) => {
      if (!exigir) return true;
      const fase = FASES.find((f) => f.libera === area);
      return !fase || feita(fase.key);
    };
    const proximaFase = FASES.find((f) => !feita(f.key)) ?? null;
    const concluidas = FASES.filter((f) => feita(f.key)).length;
    return { progresso, feita, liberado, proximaFase, concluidas, total: FASES.length, concluir, reiniciar, exigir, carregado };
  }, [progresso, exigir, concluir, reiniciar, carregado]);

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  const ctx = React.useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial precisa do TutorialProvider');
  return ctx;
}
