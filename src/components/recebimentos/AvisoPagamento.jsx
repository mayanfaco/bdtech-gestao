import React from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';

/**
 * Aviso no topo da página depois de uma ação numa parcela. Fica fora da
 * parcela porque ela pode sair da lista (paga some de "Vencidos").
 */
export function AvisoPagamento({ aviso, onFechar }) {
  if (!aviso) return null;
  return (
    <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 260 }}><Alert tone="success">{aviso.mensagem}</Alert></div>
      {aviso.pagamentoId && <Button as={Link} to={`/recibos/novo?pagamentoId=${aviso.pagamentoId}`}>Gerar recibo</Button>}
      <Button variant="ghost" onClick={onFechar}>Fechar</Button>
    </div>
  );
}
