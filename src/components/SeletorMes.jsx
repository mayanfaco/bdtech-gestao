import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { mesAtual, mesLabel, mudarMes } from '../lib/meses.js';
import { Button } from '../design-system/components/buttons/Button.jsx';

/**
 * Mês escolhido, guardado no endereço (?mes=2026-11 ou ?mes=todos) — assim,
 * ao abrir um item e voltar, o mês continua o mesmo. '' = todos os meses.
 */
export function useMesNaUrl(padrao = mesAtual()) {
  const [searchParams, setSearchParams] = useSearchParams();
  const naUrl = searchParams.get('mes');
  const mes = naUrl == null ? padrao : naUrl === 'todos' ? '' : naUrl;
  const setMes = React.useCallback((novo) => {
    setSearchParams((sp) => {
      const p = new URLSearchParams(sp);
      p.set('mes', novo || 'todos');
      return p;
    }, { replace: true });
  }, [setSearchParams]);
  return [mes, setMes];
}

/** ‹ Anterior · Novembro de 2026 · Próximo › · Mês atual · Todos os meses */
export function SeletorMes({ mes, onChange }) {
  const atual = mesAtual();
  const base = mes || atual;
  return (
    <div className="bd-u-flex bd-u-items-center bd-u-gap-2" style={{ flexWrap: 'wrap' }}>
      <Button variant="outline" size="sm" aria-label="Mês anterior" onClick={() => onChange(mudarMes(base, -1))}>‹ Anterior</Button>
      <strong style={{ minWidth: 170, textAlign: 'center', fontSize: 16, color: 'var(--bd-text-strong)' }}>{mesLabel(mes)}</strong>
      <Button variant="outline" size="sm" aria-label="Próximo mês" onClick={() => onChange(mudarMes(base, 1))}>Próximo ›</Button>
      {mes !== atual && <Button variant="ghost" size="sm" onClick={() => onChange(atual)}>Mês atual</Button>}
      {mes && <Button variant="ghost" size="sm" onClick={() => onChange('')}>Todos os meses</Button>}
    </div>
  );
}
