import React from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

export default function ConfiguracoesEmpresa() {
  const [settings, setSettings] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  function set(field) { return (e) => setSettings((s) => ({ ...s, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const { id, ...payload } = settings;
    const result = await supabase.from('company_settings').update(payload).eq('id', id);
    setSaving(false);
    if (result.error) setError(result.error.message);
    else setSaved(true);
  }

  if (!settings) return null;

  return (
    <Card padding="lg" style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: 20, marginBottom: 'var(--bd-space-4)' }}>Dados da empresa (Contratada)</h1>
      <form onSubmit={handleSubmit} className="bd-u-flex-col bd-u-gap-4">
        <Input label="Razão social" value={settings.razao_social ?? ''} onChange={set('razao_social')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="CNPJ" value={settings.cnpj ?? ''} onChange={set('cnpj')} />
          <Input label="CREA" value={settings.crea ?? ''} onChange={set('crea')} />
        </div>
        <Input label="Endereço" value={settings.endereco ?? ''} onChange={set('endereco')} />
        <div className="bd-u-grid-2 bd-u-gap-4">
          <Input label="Representante legal" value={settings.representante_legal ?? ''} onChange={set('representante_legal')} />
          <Input label="CPF do representante" value={settings.representante_cpf ?? ''} onChange={set('representante_cpf')} />
        </div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginTop: 'var(--bd-space-4)' }}>Textos padrão das propostas</h3>
        <p style={{ fontSize: 13, color: 'var(--bd-text-muted)', margin: 0 }}>
          Usados como base ao criar uma nova proposta (cada proposta grava sua própria cópia — mudar aqui não altera propostas já criadas).
        </p>
        <Textarea label="01 · Objeto" rows={3} value={settings.texto_objeto ?? ''} onChange={set('texto_objeto')} />
        <Textarea label="02 · Modelos de prestação de serviços" rows={3} value={settings.texto_modelos ?? ''} onChange={set('texto_modelos')} />
        <Textarea label="04 · Vigência, rescisão e renovação" rows={3} value={settings.texto_vigencia ?? ''} onChange={set('texto_vigencia')} />
        <Textarea label="05 · Responsabilidade e compromisso" rows={3} value={settings.texto_responsabilidade ?? ''} onChange={set('texto_responsabilidade')} />

        {error && <Alert tone="danger">{error}</Alert>}
        {saved && <Alert tone="success">Configurações salvas.</Alert>}
        <Button type="submit" loading={saving} style={{ alignSelf: 'flex-start' }}>Salvar</Button>
      </form>
    </Card>
  );
}
