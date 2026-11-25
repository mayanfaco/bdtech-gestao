import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { dataCurta } from '../../lib/dateUtils.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { reciboNumeroLabel } from '../../lib/reciboCalculations.js';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';

/**
 * Recibos ligados a um contrato ou a uma proposta, com o botão para emitir um
 * novo já ligado. campo = 'contract_id' | 'proposal_id'.
 */
export function RecibosVinculados({ campo, valor, novoRecibo, refreshKey }) {
  const [recibos, setRecibos] = React.useState(null);
  const [semVinculo, setSemVinculo] = React.useState(false);

  React.useEffect(() => {
    if (!valor) return;
    supabase.from('receipts').select('*').eq(campo, valor).is('deleted_at', null)
      .order('data_recibo', { ascending: false }).order('numero', { ascending: false })
      .then(({ data, error }) => {
        // Sem a migration 0017 a coluna ainda não existe: só não mostra a seção.
        if (error) { setSemVinculo(true); setRecibos([]); return; }
        setRecibos(data ?? []);
      });
  }, [campo, valor, refreshKey]);

  if (recibos === null || semVinculo) return null;
  const total = recibos.reduce((s, r) => s + Number(r.valor_recebido || 0), 0);

  return (
    <div>
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-3" style={{ marginBottom: 'var(--bd-space-3)', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>
          Recibos {recibos.length > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--bd-text-muted)' }}>· {recibos.length} · {formatCurrency(total)} recebidos</span>}
        </h2>
        {novoRecibo && <Button size="sm" variant="outline" as={Link} to={novoRecibo}>Novo recibo</Button>}
      </div>
      {recibos.length === 0 ? (
        <Card padding="md"><span style={{ color: 'var(--bd-text-muted)' }}>Nenhum recibo ainda. Cada pagamento registrado gera o recibo sozinho.</span></Card>
      ) : (
        <div className="bd-u-flex-col bd-u-gap-2">
          {recibos.map((r) => (
            <Link key={r.id} to={`/recibos/${r.id}/editar`} style={{ textDecoration: 'none' }}>
              <Card padding="md" interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-3">
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)' }}>{reciboNumeroLabel(r)} — {dataCurta(r.data_recibo)}</div>
                    {r.referente && <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>Referente à {r.referente}</div>}
                  </div>
                  <Badge tone="success">{formatCurrency(r.valor_recebido)}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
