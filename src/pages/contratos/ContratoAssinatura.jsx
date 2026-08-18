import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { BackButton } from '../../components/BackButton.jsx';

const PROVIDER_LABEL = { none: 'Nenhum configurado', clicksign: 'Clicksign', d4sign: 'D4Sign', docusign: 'DocuSign' };

export default function ContratoAssinatura() {
  const { id } = useParams();
  const [request, setRequest] = React.useState(null);
  const [provider, setProvider] = React.useState('none');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const { data } = await supabase.from('contract_signature_requests').select('*').eq('contract_id', id).maybeSingle();
    if (data) { setRequest(data); setProvider(data.provider); }
    else {
      const created = await supabase.from('contract_signature_requests').insert({ contract_id: id, provider: 'none', status: 'nao_configurado' }).select().single();
      setRequest(created.data);
    }
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  async function salvarProvider() {
    setSaving(true);
    await supabase.from('contract_signature_requests').update({ provider }).eq('id', request.id);
    setSaving(false);
    load();
  }

  if (!request) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-6" style={{ maxWidth: 560 }}>
      <BackButton to={`/contratos/${id}`} label="Voltar para o contrato" />
      <h1 style={{ fontSize: 22 }}>Assinatura eletrônica</h1>

      <Alert tone={provider === 'none' ? 'warning' : 'info'} title={provider === 'none' ? 'Integração ainda não configurada' : `Provedor selecionado: ${PROVIDER_LABEL[provider]}`}>
        {provider === 'none'
          ? 'Nenhum provedor de assinatura eletrônica está configurado ainda. Escolha um provedor abaixo e forneça as credenciais em Configurações para ativar o envio automático — até lá, o contrato precisa ser assinado manualmente e registrado pelo botão "Registrar assinatura" na tela do contrato.'
          : 'A integração real com este provedor ainda precisa ser ativada com credenciais válidas em Configurações. Nenhuma assinatura foi simulada.'}
      </Alert>

      <Card padding="lg">
        <Select label="Provedor de assinatura eletrônica" value={provider} onChange={(e) => setProvider(e.target.value)}
          options={[{ value: 'none', label: 'Nenhum' }, { value: 'clicksign', label: 'Clicksign' }, { value: 'd4sign', label: 'D4Sign' }, { value: 'docusign', label: 'DocuSign' }]} />
        <div style={{ marginTop: 'var(--bd-space-4)' }}>
          <Button onClick={salvarProvider} loading={saving}>Salvar provedor</Button>
        </div>
      </Card>

      <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
        Status atual: <strong>{request.status}</strong>
      </div>
    </div>
  );
}
