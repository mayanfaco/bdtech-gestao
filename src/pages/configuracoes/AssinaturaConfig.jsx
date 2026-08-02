import React from 'react';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

export default function AssinaturaConfig() {
  return (
    <div className="bd-u-flex-col bd-u-gap-4" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 22 }}>Assinatura eletrônica</h1>
      <Alert tone="warning" title="Nenhum provedor configurado globalmente">
        A escolha de provedor (Clicksign, D4Sign ou DocuSign) é feita por contrato, na própria tela do contrato ("Assinatura"). Nenhuma assinatura é simulada — até que credenciais reais sejam configuradas, contratos precisam ser assinados manualmente e registrados pelo botão "Registrar assinatura".
      </Alert>
      <Card padding="lg">
        <p style={{ fontSize: 14, margin: 0 }}>Para ativar de verdade: crie uma conta no provedor escolhido, gere uma API key, e me avise para eu conectar a integração real.</p>
      </Card>
    </div>
  );
}
