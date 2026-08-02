import React from 'react';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';

/** Modal obrigatório ao mover uma oportunidade para uma etapa de perda. */
export function LossReasonModal({ onConfirm, onCancel }) {
  const [motivo, setMotivo] = React.useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bd-overlay)', zIndex: 'var(--bd-z-modal)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Card padding="lg" style={{ width: 420 }}>
        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 18, marginBottom: 'var(--bd-space-3)' }}>
          Motivo da perda
        </h3>
        <p style={{ fontSize: 14, color: 'var(--bd-text-muted)', marginBottom: 'var(--bd-space-4)' }}>
          Explique por que esta oportunidade foi perdida antes de continuar.
        </p>
        <Textarea autoFocus rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <div className="bd-u-flex bd-u-gap-3" style={{ marginTop: 'var(--bd-space-4)' }}>
          <Button disabled={!motivo.trim()} onClick={() => onConfirm(motivo)}>Confirmar perda</Button>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      </Card>
    </div>
  );
}
