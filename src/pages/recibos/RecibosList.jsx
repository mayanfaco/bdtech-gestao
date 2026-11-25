import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { mensagemDeErro } from '../../lib/supabaseErros.js';
import { dataCurta } from '../../lib/dateUtils.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { reciboNumeroLabel } from '../../lib/reciboCalculations.js';
import { mesLabel, noMes } from '../../lib/meses.js';
import { SeletorMes, useMesNaUrl } from '../../components/SeletorMes.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Card } from '../../design-system/components/surfaces/Card.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { IconButton } from '../../design-system/components/buttons/IconButton.jsx';
import { I } from '../../components/layout/icons.jsx';

export default function RecibosList() {
  const [recibos, setRecibos] = React.useState(null);
  const [error, setError] = React.useState('');
  const [mes, setMes] = useMesNaUrl();

  const load = React.useCallback(() => {
    supabase.from('receipts').select('*').is('deleted_at', null)
      .order('data_recibo', { ascending: false }).order('numero', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(mensagemDeErro(err, { migration: '0012_recibos.sql' }));
        setRecibos(data ?? []);
      });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(e, r) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Excluir o recibo ${reciboNumeroLabel(r)}? Ele deixa de aparecer nas listas.`)) return;
    const { error: err } = await supabase.from('receipts').update({ deleted_at: new Date().toISOString() }).eq('id', r.id);
    if (err) { alert(err.message); return; }
    load();
  }

  if (recibos === null) return null;

  const doMes = recibos.filter((r) => noMes(r.data_recibo, mes));
  const totalMes = doMes.reduce((s, r) => s + Number(r.valor_recebido), 0);

  return (
    <div className="bd-u-flex-col bd-u-gap-6">
      <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-4" style={{ flexWrap: 'wrap' }}>
        <SeletorMes mes={mes} onChange={setMes} />
        <Button as={Link} to="/recibos/novo">Novo recibo</Button>
      </div>
      {recibos.length > 0 && (
        <p style={{ margin: 0, fontSize: 16 }}>
          {doMes.length} {doMes.length === 1 ? 'recibo' : 'recibos'} em {mes ? mesLabel(mes, { minusculo: true }) : 'todos os meses'}
          {doMes.length > 0 && <> · total de <strong>{formatCurrency(totalMes)}</strong></>}
        </p>
      )}

      {error && <Alert tone="danger">{error}</Alert>}

      {error ? null : recibos.length === 0 ? (
        <EmptyState title="Nenhum recibo emitido ainda"
          text="Escolha o cliente, informe as datas e os valores, e o recibo fica no histórico dele."
          action={<Button as={Link} to="/recibos/novo">Novo recibo</Button>} />
      ) : doMes.length === 0 ? (
        <EmptyState title={`Nenhum recibo em ${mesLabel(mes, { minusculo: true })}`} />
      ) : (
        <div className="bd-u-flex-col bd-u-gap-3">
          {doMes.map((r) => (
            <Link key={r.id} to={`/recibos/${r.id}/editar`} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive>
                <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ padding: 'var(--bd-space-5) var(--bd-space-6)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--bd-text-strong)', fontFamily: 'var(--bd-font-display)' }}>
                      {reciboNumeroLabel(r)} · {r.pagador_nome}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 2 }}>
                      {dataCurta(r.data_recibo)} · {formatCurrency(r.valor_recebido)}
                    </div>
                  </div>
                  <IconButton label="Excluir recibo" size="sm" onClick={(e) => handleDelete(e, r)}>
                    <span style={{ color: 'var(--bd-danger-500)', display: 'flex' }}>{I.trash}</span>
                  </IconButton>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
