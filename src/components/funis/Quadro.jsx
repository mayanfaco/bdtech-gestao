import React from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

function Cartao({ id, children, arrastavel, className = '' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: !arrastavel });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 20 : undefined, opacity: isDragging ? 0.9 : 1 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} className={`fx-card ${arrastavel ? 'fx-card--drag' : ''} ${className}`} {...(arrastavel ? listeners : {})} {...(arrastavel ? attributes : {})}>
      {children}
    </div>
  );
}

function Coluna({ coluna, children, total }) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.key });
  return (
    <section ref={setNodeRef} className={`fx-col ${isOver ? 'fx-col--over' : ''}`} style={{ '--fx-cor': coluna.cor }} aria-label={coluna.label}>
      <div className="fx-col__head">
        <span className="fx-col__title">{coluna.label}</span>
        <span className="fx-col__count">{total}</span>
      </div>
      {coluna.dica && <div className="fx-col__hint">{coluna.dica}</div>}
      {total === 0 && <div className="fx-col__empty">{coluna.vazio ?? 'Nada aqui por enquanto.'}</div>}
      {children}
    </section>
  );
}

/**
 * Quadro em colunas. Os cartões podem ser arrastados, mas toda ação também
 * existe como botão no próprio cartão (arrastar é difícil para muita gente).
 *
 * colunas: [{key,label,cor,dica,vazio}]
 * itens: array; colunaDe(item) → key; renderCartao(item) → conteúdo;
 * onMover(item, novaColunaKey); classeDoCartao(item) → classe extra.
 */
export function Quadro({ colunas, itens, colunaDe, renderCartao, onMover, classeDoCartao, arrastavel = true }) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const porColuna = React.useMemo(() => {
    const m = Object.fromEntries(colunas.map((c) => [c.key, []]));
    itens.forEach((i) => { const k = colunaDe(i); if (m[k]) m[k].push(i); });
    return m;
  }, [colunas, itens, colunaDe]);

  function fimDoArraste({ active, over }) {
    if (!over || !onMover) return;
    const item = itens.find((i) => i.id === active.id);
    if (item && colunaDe(item) !== over.id) onMover(item, over.id);
  }

  return (
    <DndContext sensors={sensores} onDragEnd={fimDoArraste}>
      <div className="fx-board">
        {colunas.map((c) => (
          <Coluna key={c.key} coluna={c} total={porColuna[c.key].length}>
            {porColuna[c.key].map((item) => (
              <Cartao key={item.id} id={item.id} arrastavel={arrastavel && Boolean(onMover)} className={classeDoCartao?.(item) ?? ''}>
                {renderCartao(item)}
              </Cartao>
            ))}
          </Coluna>
        ))}
      </div>
    </DndContext>
  );
}

/** Impede que o clique num botão dentro do cartão comece um arraste. */
export const pararArraste = { onPointerDown: (e) => e.stopPropagation(), onKeyDown: (e) => e.stopPropagation() };
