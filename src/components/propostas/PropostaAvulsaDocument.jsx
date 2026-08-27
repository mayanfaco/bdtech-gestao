import React from 'react';
import { parsePropostaAvulsa, parseInline } from '../../lib/propostaAvulsaParser.js';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import logotypeNavy from '../../design-system/assets/brand/bdtech-logotype-navy.svg';

const COMPANY_PHONE = '(85) 9.9698-5607';

/** Negrito/itálico como elementos React — nada de HTML injetado. */
function Formatado({ texto }) {
  return parseInline(texto).map((t, i) => {
    if (t.tipo === 'negrito') return <strong key={i}>{t.valor}</strong>;
    if (t.tipo === 'italico') return <em key={i}>{t.valor}</em>;
    return <React.Fragment key={i}>{t.valor}</React.Fragment>;
  });
}

/**
 * Documento de proposta avulsa: o texto colado pelo usuário, renderizado com a
 * mesma identidade visual das propostas do sistema (cabeçalho com a marca,
 * faixa navy, seções numeradas em azul, rodapé de assinatura). Usa o mesmo
 * .bd-print-page das outras, então o PDF sai com o mesmo tratamento de
 * impressão (cores de fundo, controle de quebra de página).
 */
export function PropostaAvulsaDocument({ texto, settings }) {
  const { titulo, subtitulo, campos, blocos, assinatura } = parsePropostaAvulsa(texto);
  const temCabecalho = titulo || subtitulo || campos.length > 0;

  return (
    <div className="bd-print-page">
      <header className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginBottom: 'var(--bd-space-5)' }}>
        <img src={logotypeNavy} alt="BDTECH" style={{ height: 32, width: 'auto' }} />
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--bd-navy-900)' }}>Engº {settings?.representante_legal || '—'}</div>
          <div style={{ color: 'var(--bd-text-muted)' }}>{settings?.crea || '—'} · {COMPANY_PHONE}</div>
        </div>
      </header>

      {temCabecalho && (
        <div className="bd-print-avoid-break" style={{
          position: 'relative', overflow: 'hidden', borderRadius: 'var(--bd-radius-lg)',
          background: 'var(--bd-gradient-hero)', padding: 'var(--bd-space-6) var(--bd-space-8)',
          marginBottom: 'var(--bd-space-8)',
        }}>
          {titulo && (
            <Badge tone="neutral" style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}>{titulo}</Badge>
          )}
          {subtitulo && (
            <h1 style={{
              fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 26, lineHeight: 1.25,
              color: '#fff', margin: '14px 0 0',
            }}>
              {subtitulo}
            </h1>
          )}
          {campos.length > 0 && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,.18)', marginTop: 'var(--bd-space-5)',
              paddingTop: 'var(--bd-space-4)', display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(campos.length, 3)}, 1fr)`, gap: 'var(--bd-space-4)',
            }}>
              {campos.map((campo, i) => (
                <div key={i}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.56)',
                  }}>
                    {campo.rotulo}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{campo.valor || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {blocos.map((bloco, i) => {
        if (bloco.tipo === 'secao') {
          return (
            <div key={i} className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{
              marginTop: i === 0 ? 0 : 'var(--bd-space-8)', marginBottom: 'var(--bd-space-4)',
            }}>
              <span style={{
                fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 16, color: 'var(--bd-primary-500)',
              }}>
                {String(bloco.numero).padStart(2, '0')}
              </span>
              <h2 style={{
                fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 19,
                color: 'var(--bd-navy-900)', margin: 0,
              }}>
                {bloco.titulo}
              </h2>
            </div>
          );
        }
        if (bloco.tipo === 'lista') {
          const Tag = bloco.numerada ? 'ol' : 'ul';
          return (
            <Tag key={i} style={{
              fontSize: 14, lineHeight: 1.7, color: 'var(--bd-text-body)', paddingLeft: 20,
              margin: '0 0 var(--bd-space-3)',
            }}>
              {bloco.itens.map((item, j) => <li key={j}><Formatado texto={item} /></li>)}
            </Tag>
          );
        }
        return (
          <p key={i} style={{
            fontSize: 14, lineHeight: 1.7, color: 'var(--bd-text-body)', margin: '0 0 var(--bd-space-3)',
          }}>
            <Formatado texto={bloco.texto} />
          </p>
        );
      })}

      <footer className="bd-print-avoid-break" style={{
        marginTop: 'var(--bd-space-12)', paddingTop: 'var(--bd-space-5)',
        borderTop: '1px solid var(--bd-border-default)',
      }}>
        {assinatura.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--bd-text-body)', marginBottom: 'var(--bd-space-5)' }}>
            {assinatura.map((linha, i) => <div key={i}>{linha}</div>)}
          </div>
        )}
        <div style={{ maxWidth: 320 }}>
          <div className="bd-doc-sign-line" style={{ height: 90, borderBottom: '1px solid var(--bd-border-strong)' }} />
          <div style={{
            fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 14,
            color: 'var(--bd-navy-900)', marginTop: 'var(--bd-space-3)',
          }}>
            {settings?.representante_legal}
          </div>
          <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>{settings?.crea} · Diretor Técnico</div>
          <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>{settings?.razao_social}</div>
        </div>
      </footer>
    </div>
  );
}
