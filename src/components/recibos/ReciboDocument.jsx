import React from 'react';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { dataCurta, dataLonga } from '../../lib/dateUtils.js';
import { numeroPorExtenso } from '../../lib/numeroPorExtenso.js';
import { formatPercentual, reciboCalculo, tipoDocumento } from '../../lib/reciboCalculations.js';
import logotypeNavy from '../../design-system/assets/brand/bdtech-logotype-navy.svg';

const ROTULO = { fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--bd-text-muted)' };

function CondicaoRow({ label, value, last }) {
  return (
    <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{
      padding: '10px 0', fontSize: 15, borderBottom: last ? 'none' : '2px solid var(--bd-neutral-100)',
    }}>
      <span style={{ color: 'var(--bd-text-muted)' }}>{label}</span>
      <strong style={{ color: 'var(--bd-navy-900)' }}>{value}</strong>
    </div>
  );
}

function saldoLabel(parcelas, calculo) {
  if (calculo.valorParcela == null) return formatCurrency(calculo.saldo);
  return `${parcelas} ${parcelas === 1 ? 'parcela' : 'parcelas'} de ${formatCurrency(calculo.valorParcela)}`;
}

/**
 * Documento do recibo — usado na prévia do formulário e na impressão. Só as
 * datas, os valores e o pagador mudam; o restante do texto é fixo.
 */
export function ReciboDocument({ recibo, settings }) {
  const parcelas = Number(recibo.parcelas_restantes) || 0;
  const calculo = reciboCalculo({
    valorTotal: recibo.valor_total, valorRecebido: recibo.valor_recebido, parcelasRestantes: parcelas,
  });
  // Recibo de um pagamento guarda o saldo do contrato naquele momento; recibo
  // avulso (antigo) calcula total − recebido.
  const temSaldoGravado = recibo.saldo_restante != null && recibo.saldo_restante !== '';
  const saldo = temSaldoGravado ? Number(recibo.saldo_restante) : calculo.saldo;
  const saldoInfo = { saldo, valorParcela: parcelas > 0 ? Math.round((saldo / parcelas) * 100) / 100 : null };
  const referente = recibo.referente || 'entrada';
  const ehEntrada = referente.startsWith('entrada');
  const objeto = ehEntrada && !referente.includes('parcial')
    ? `Entrada (${formatPercentual(calculo.percentual)})`
    : referente.charAt(0).toUpperCase() + referente.slice(1);
  const recebido = Number(recibo.valor_recebido) || 0;
  const valorRecebido = formatCurrency(recebido);
  const documento = recibo.pagador_documento;
  const crea = (settings?.crea ?? '').replace(/^(CREA-\w+)\s+(?=\d)/, '$1 nº ');

  return (
    <div className="bd-recibo">
      <header className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ flexWrap: 'wrap', gap: 12, paddingBottom: 36, borderBottom: '3px solid var(--bd-navy-900)' }}>
        <img src={logotypeNavy} alt="BDTECH" style={{ height: 62, width: 'auto' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '.18em', color: 'var(--bd-navy-900)' }}>RECIBO</div>
          <div style={{ fontSize: 15, color: 'var(--bd-text-muted)' }}>Prestação de serviços</div>
        </div>
      </header>

      <div className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{
        flexWrap: 'wrap', gap: 12, marginTop: 30, padding: '20px 24px', background: 'var(--bd-neutral-50)', borderLeft: '5px solid var(--bd-primary-500)',
      }}>
        <div>
          <div style={ROTULO}>Valor recebido</div>
          <div style={{ fontSize: 32, lineHeight: 1.1, fontWeight: 700, color: 'var(--bd-navy-900)' }}>{valorRecebido}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={ROTULO}>Data</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bd-navy-900)', marginTop: 4 }}>{dataCurta(recibo.data_recibo)}</div>
        </div>
      </div>

      <p style={{ marginTop: 36, fontSize: 15, lineHeight: 1.9, textAlign: 'justify', color: 'var(--bd-text-body)' }}>
        Recebi do <strong>{recibo.pagador_nome || '—'}</strong>, inscrito no {tipoDocumento(documento)} sob o nº <strong style={{ whiteSpace: 'nowrap' }}>{documento || '—'}</strong>,
        {' '}a importância de <strong>{valorRecebido} ({numeroPorExtenso(recebido)})</strong>, referente à {referente} dos serviços de
        {' '}<strong>consultoria e vistoria técnica</strong>, com início em {dataCurta(recibo.data_inicio_servicos)}.
      </p>

      <div style={{ marginTop: 28 }}>
        <div style={{ ...ROTULO, marginBottom: 6 }}>Condições do contrato</div>
        <CondicaoRow label="Valor total do contrato" value={formatCurrency(Number(recibo.valor_total) || 0)} />
        <CondicaoRow label={`${objeto} — objeto deste recibo`} value={valorRecebido} last={saldo <= 0} />
        {saldo > 0 && <CondicaoRow label="Saldo restante" value={saldoLabel(parcelas, saldoInfo)} last />}
      </div>

      <p style={{ marginTop: 40, fontSize: 15, color: 'var(--bd-text-body)' }}>Para maior clareza, firmo o presente recibo.</p>
      <p style={{ marginTop: 12, fontSize: 15, color: 'var(--bd-text-body)' }}>Fortaleza/CE, {dataLonga(recibo.data_recibo)}.</p>

      <div className="bd-print-avoid-break" style={{ marginTop: 220, textAlign: 'center' }}>
        <div style={{ width: '65%', margin: '0 auto', borderTop: '2px solid var(--bd-navy-900)' }} />
        <div style={{ marginTop: 34, fontSize: 18, fontWeight: 700, color: 'var(--bd-navy-900)' }}>{settings?.representante_legal || '—'}</div>
        <div style={{ marginTop: 4, fontSize: 15, color: 'var(--bd-text-muted)' }}>Engenheiro Mecânico · {crea || '—'}</div>
        <div style={{ marginTop: 4, fontSize: 15, color: 'var(--bd-text-muted)' }}>{settings?.razao_social || '—'} · CNPJ {settings?.cnpj || '—'}</div>
      </div>
    </div>
  );
}
