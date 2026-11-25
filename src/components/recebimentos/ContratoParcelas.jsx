import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { mensagemDeErro } from '../../lib/supabaseErros.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { dataCurta, hojeLocal } from '../../lib/dateUtils.js';
import { parcelaLabel, planoDeParcelas, situacaoParcela } from '../../lib/recebimentos.js';
import { ParcelaItem, buscarParcelas, MIGRATION_RECEBIMENTOS } from './ParcelaItem.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';

/** Bloco "Parcelas" da ficha do contrato: gera as parcelas e mostra cada uma. */
export function ContratoParcelas({ contract, onChanged }) {
  const [parcelas, setParcelas] = React.useState(null);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [verTodas, setVerTodas] = React.useState(false);
  const hoje = hojeLocal();

  const load = React.useCallback(() => {
    buscarParcelas((sel) => supabase.from('receivables').select(sel).eq('contract_id', contract.id).order('numero'))
      .then(({ data, error: err }) => {
        if (err) setError(mensagemDeErro(err, MIGRATION_RECEBIMENTOS));
        setParcelas(data ?? []);
      });
  }, [contract.id]);

  React.useEffect(() => { load(); }, [load]);

  if (parcelas === null) return null;

  const plano = planoDeParcelas(contract);

  async function gerar() {
    setSaving(true);
    setError('');
    const linhas = plano.parcelas.map((p) => ({ ...p, contract_id: contract.id, client_id: contract.client_id ?? null }));
    // Se alguém gerar de novo (outra aba, clique duplo), as que já existem são ignoradas.
    const { error: err } = await supabase.from('receivables')
      .upsert(linhas, { onConflict: 'contract_id,numero', ignoreDuplicates: true });
    if (!err) {
      await supabase.from('activity_log').insert({
        entity_type: 'contract', entity_id: contract.id, activity_type: 'system', title: 'Parcelas geradas',
        body: `${linhas.length} ${linhas.length === 1 ? 'vencimento criado' : 'vencimentos criados'}, de ${dataCurta(linhas[0].vencimento)} a ${dataCurta(linhas.at(-1).vencimento)}.`,
      });
    }
    setSaving(false);
    if (err) { setError(mensagemDeErro(err, MIGRATION_RECEBIMENTOS)); return; }
    load();
    onChanged?.();
  }

  const ativas = parcelas.filter((p) => !p.cancelado_em);
  // A próxima parcela em aberto (a mais antiga) já aparece com os botões.
  const proximaId = parcelas
    .map((p) => ({ p, s: situacaoParcela(p, hoje) }))
    .filter(({ s }) => s.status === 'vencido' || s.status === 'a_vencer')
    .sort((a, b) => a.p.vencimento.localeCompare(b.p.vencimento))[0]?.p.id;
  const somaCentavos = ativas.reduce((s, p) => s + Math.round(Number(p.valor) * 100), 0);
  const totalCentavos = Math.round((Number(contract.valor_total) || 0) * 100);

  return (
    <div className="bd-u-flex-col bd-u-gap-3">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between">
        <h2 style={{ fontSize: 18 }}>Parcelas</h2>
        {parcelas.length > 0 && <Link to="/recebimentos" style={{ fontSize: 14 }}>Ver todos os recebimentos</Link>}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {parcelas.length === 0 && !error && (
        <Card>
          {plano.erro ? (
            <Alert tone="warning" title="Ainda não dá para gerar as parcelas">
              {plano.erro} <Link to={`/contratos/${contract.id}/editar`}>Editar contrato</Link>
            </Alert>
          ) : (
            <div className="bd-u-flex-col bd-u-gap-4">
              <p style={{ margin: 0 }}>
                Confira as datas e os valores antes de gerar. Depois, cada parcela aparece em Recebimentos para cobrar e registrar o pagamento.
              </p>
              <div style={{ fontSize: 15 }}>
                {(verTodas ? plano.parcelas : plano.parcelas.slice(0, 3)).map((p) => (
                  <div key={p.numero} className="bd-u-flex bd-u-justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--bd-border-subtle)' }}>
                    <span>{parcelaLabel(p)} · vence em {dataCurta(p.vencimento)}</span>
                    <strong>{formatCurrency(p.valor)}</strong>
                  </div>
                ))}
                {plano.parcelas.length > 3 && (
                  <Button size="sm" variant="link" onClick={() => setVerTodas((v) => !v)} style={{ marginTop: 6 }}>
                    {verTodas ? 'Mostrar menos' : `Ver as ${plano.parcelas.length} datas`}
                  </Button>
                )}
              </div>
              <div>
                <Button onClick={gerar} loading={saving}>Gerar parcelas deste contrato</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {parcelas.length > 0 && somaCentavos !== totalCentavos && (
        <Alert tone="warning" title="As parcelas não somam o valor do contrato">
          As parcelas somam {formatCurrency(somaCentavos / 100)} e o contrato vale {formatCurrency(totalCentavos / 100)}.
          Se o contrato mudou, ajuste as parcelas em “Alterar vencimento ou valor”.
        </Alert>
      )}

      {parcelas.length > 0 && (
        <Card>
          <div style={{ marginTop: 'calc(-1 * var(--bd-space-4))', marginBottom: 'calc(-1 * var(--bd-space-4))' }}>
            {parcelas.map((p) => (
              <ParcelaItem key={p.id} parcela={p} hoje={hoje} mostrarCliente={false} mostrarContrato={false} compacto
                destaque={p.id === proximaId} onChanged={() => { load(); onChanged?.(); }} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
