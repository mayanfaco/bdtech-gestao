import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE } from '../../lib/statusLabels.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { ActivityTimeline, QuickNote } from '../../components/crm/ActivityTimeline.jsx';

export default function ContratoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    supabase.from('contracts').select('*, clients(nome)').eq('id', id).single().then(({ data }) => setContract(data));
  }, [id]);

  React.useEffect(() => { load(); }, [load, refreshKey]);

  async function setStatus(status, extra = {}) {
    setBusy(true);
    await supabase.from('contracts').update({ status, ...extra }).eq('id', id);
    setBusy(false);
    setRefreshKey((k) => k + 1);
  }

  async function handleEncerrar() {
    const motivo = window.prompt('Motivo do encerramento (opcional):') ?? '';
    setStatus('encerrado', { encerramento_motivo: motivo || null });
  }

  async function duplicar() {
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const clone = { ...contract };
    delete clone.id; delete clone.numero; delete clone.created_at; delete clone.updated_at;
    delete clone.status_changed_at; delete clone.vigencia_renovacao_data; delete clone.clients;
    delete clone.renewal_of_contract_id; delete clone.renewed_by_contract_id;
    const result = await supabase.from('contracts').insert({ ...clone, status: 'rascunho', created_by: userData.user.id }).select().single();
    setBusy(false);
    if (!result.error) navigate(`/contratos/${result.data.id}`);
  }

  async function renovar() {
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const inicio = contract.data_termino;
    const termino = new Date(new Date(inicio).setFullYear(new Date(inicio).getFullYear() + 1)).toISOString().slice(0, 10);
    const clone = { ...contract };
    delete clone.id; delete clone.numero; delete clone.created_at; delete clone.updated_at;
    delete clone.status_changed_at; delete clone.vigencia_renovacao_data; delete clone.clients;
    delete clone.renewed_by_contract_id;
    const result = await supabase.from('contracts').insert({
      ...clone, status: 'rascunho', created_by: userData.user.id,
      data_inicio: inicio, data_termino: termino, renewal_of_contract_id: id,
    }).select().single();
    if (!result.error) {
      await supabase.from('contracts').update({ status: 'renovado', renewed_by_contract_id: result.data.id }).eq('id', id);
      navigate(`/contratos/${result.data.id}`);
    }
    setBusy(false);
  }

  if (!contract) return null;

  const diasParaVencer = contract.data_termino ? Math.ceil((new Date(contract.data_termino) - new Date()) / 86400000) : null;
  const vencendoEmBreve = diasParaVencer != null && diasParaVencer > 0 && diasParaVencer <= 90 && ['assinado', 'ativo', 'proximo_vencimento'].includes(contract.status);

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <div>
          <h1 style={{ fontSize: 24 }}>CONT-{contract.data_inicio ? new Date(contract.data_inicio).getFullYear() : ''}-{String(contract.numero).padStart(4, '0')}</h1>
          <div style={{ color: 'var(--bd-text-muted)', fontSize: 14 }}>{contract.clients?.nome ?? contract.contratante_nome}</div>
        </div>
        <div className="bd-u-flex bd-u-gap-3 bd-u-items-center">
          <Badge tone={CONTRACT_STATUS_TONE[contract.status]}>{CONTRACT_STATUS_LABEL[contract.status]}</Badge>
          <Button variant="outline" as={Link} to={`/contratos/${id}/assinatura`}>Assinatura</Button>
          <Button variant="outline" as={Link} to={`/contratos/${id}/pdf`}>Imprimir / PDF</Button>
          <Button variant="outline" onClick={duplicar} loading={busy}>Duplicar</Button>
          <Button variant="outline" as={Link} to={`/contratos/${id}/editar`}>Editar</Button>
        </div>
      </div>

      {vencendoEmBreve && (
        <Alert tone="warning" title="Contrato próximo do vencimento">
          Vigência termina em {diasParaVencer} dia(s) ({contract.data_termino}).
        </Alert>
      )}
      {contract.status === 'renovado' && <Alert tone="info" title="Contrato renovado">Este contrato foi substituído por uma renovação.</Alert>}

      <div className="bd-u-flex bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        {contract.status === 'rascunho' && <Button size="sm" onClick={() => setStatus('aguardando_revisao')} loading={busy}>Enviar para revisão</Button>}
        {contract.status === 'aguardando_revisao' && <Button size="sm" onClick={() => setStatus('aguardando_assinatura')} loading={busy}>Enviar para assinatura</Button>}
        {contract.status === 'aguardando_assinatura' && <Button size="sm" onClick={() => setStatus('assinado')} loading={busy}>Registrar assinatura</Button>}
        {contract.status === 'assinado' && <Button size="sm" onClick={() => setStatus('ativo')} loading={busy}>Ativar contrato</Button>}
        {['ativo', 'proximo_vencimento'].includes(contract.status) && (
          <>
            <Button size="sm" variant="outline" onClick={handleEncerrar} loading={busy}>Encerrar</Button>
            <Button size="sm" onClick={renovar} loading={busy}>Iniciar renovação</Button>
          </>
        )}
        {!['encerrado', 'cancelado', 'renovado'].includes(contract.status) && (
          <Button size="sm" variant="ghost" onClick={() => setStatus('cancelado')} loading={busy}>Cancelar</Button>
        )}
      </div>

      {contract.encerramento_motivo && (
        <Card padding="lg"><strong>Motivo do encerramento:</strong> {contract.encerramento_motivo}</Card>
      )}

      <Card padding="lg">
        <div className="bd-u-grid-2 bd-u-gap-4">
          <div><strong>Vigência:</strong> {contract.data_inicio} a {contract.data_termino}</div>
          <div><strong>Valor total:</strong> {formatCurrency(contract.valor_total)}</div>
          <div><strong>Modelo:</strong> {contract.modelo === 'modelo2' ? 'Modelo 2 — Continuado' : 'Modelo 1 — Pontual'}</div>
          <div><strong>Foro:</strong> {contract.comarca_foro || '—'}</div>
        </div>
        {contract.escopo_servico && <p style={{ marginTop: 'var(--bd-space-4)' }}>{contract.escopo_servico}</p>}
      </Card>

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 'var(--bd-space-3)' }}>Linha do tempo</h2>
        <QuickNote entityType="contract" entityId={id} onAdded={() => setRefreshKey((k) => k + 1)} />
        <div style={{ marginTop: 'var(--bd-space-4)' }}>
          <ActivityTimeline entityType="contract" entityId={id} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
