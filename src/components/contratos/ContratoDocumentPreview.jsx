import React from 'react';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import logotypeNavy from '../../design-system/assets/brand/bdtech-logotype-navy.svg';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function dataLonga(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return '—';
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

function SectionHeading({ number, title }) {
  return (
    <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ marginBottom: 'var(--bd-space-4)' }}>
      <span style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 16, color: 'var(--bd-primary-500)' }}>{number}</span>
      <h2 style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 21, color: 'var(--bd-navy-900)', margin: 0 }}>{title}</h2>
    </div>
  );
}

function PartyCard({ label, children }) {
  return (
    <div style={{
      background: 'var(--bd-neutral-50)', border: '1px solid var(--bd-border-subtle)', borderLeft: '4px solid var(--bd-primary-500)',
      borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-5)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-primary-600)', marginBottom: 8 }}>{label}</div>
      <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', margin: 0 }}>{children}</p>
    </div>
  );
}

function ClauseBlock({ children }) {
  return (
    <div style={{
      background: 'var(--bd-neutral-50)', border: '1px solid var(--bd-border-subtle)', borderLeft: '4px solid var(--bd-navy-700)',
      borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-5)',
    }}>{children}</div>
  );
}

/**
 * Renderização visual do documento de contrato — usada tanto na prévia ao
 * vivo do formulário quanto na rota de impressão final (mesma aparência).
 */
export function ContratoDocumentPreview({ contract }) {
  const isModelo2 = contract.modelo === 'modelo2';
  const numero = `CONT-${contract.data_inicio ? new Date(contract.data_inicio).getFullYear() : ''}-${String(contract.numero ?? '').padStart(4, '0')}`;

  return (
    <div className="bd-print-page">
      <header className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginBottom: 'var(--bd-space-5)' }}>
        <img src={logotypeNavy} alt="BDTECH" style={{ height: 32, width: 'auto' }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--bd-text-muted)' }}>{numero}</div>
      </header>

      <div className="bd-print-avoid-break" style={{
        position: 'relative', overflow: 'hidden', borderRadius: 'var(--bd-radius-lg)', background: 'var(--bd-gradient-hero)',
        padding: 'var(--bd-space-6) var(--bd-space-8)', marginBottom: 'var(--bd-space-8)',
      }}>
        <Badge tone="neutral" style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}>
          {isModelo2 ? 'Serviço Técnico Continuado' : 'Serviço Técnico Pontual'}
        </Badge>
        <h1 style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 26, lineHeight: 1.25, color: '#fff', margin: '14px 0 22px' }}>
          Contrato de <span style={{ color: 'var(--bd-accent-400)' }}>Prestação de Serviços</span>
        </h1>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,.18)', paddingTop: 'var(--bd-space-4)',
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--bd-space-4)',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.56)' }}>Contratante</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{contract.contratante_nome || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.56)' }}>Contratada</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{contract.contratada_razao_social || '—'}</div>
          </div>
        </div>
      </div>

      <SectionHeading number="01" title="Identificação das Partes" />
      <div className="bd-u-grid-2 bd-u-gap-5">
        <PartyCard label="Contratante">
          {contract.contratante_nome || '—'}, pessoa jurídica de direito privado, inscrito no CNPJ sob o nº <strong>{contract.contratante_cnpj || '—'}</strong>,
          {' '}com sede em {contract.contratante_endereco || '—'}, neste ato representado por seu síndico {contract.contratante_sindico_nome || '—'}, CPF nº {contract.contratante_sindico_cpf || '—'}.
        </PartyCard>
        <PartyCard label="Contratada">
          {contract.contratada_razao_social || '—'}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>{contract.contratada_cnpj || '—'}</strong>,
          {' '}com sede em {contract.contratada_endereco || '—'}, neste ato representada por seu representante legal, Sr(a). {contract.contratada_representante || '—'}, portador(a) do CPF nº {contract.contratada_cpf || '—'}.
        </PartyCard>
      </div>
      <p style={{ marginTop: 'var(--bd-space-4)', fontSize: 13, color: 'var(--bd-text-muted)', fontStyle: 'italic' }}>
        As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas
        seguintes e pelas condições descritas no presente instrumento.
      </p>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="02" title="Do Objeto do Contrato" />
        <ClauseBlock>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', margin: 0 }}>
            <strong>Cláusula Primeira:</strong> O presente contrato tem como objeto a prestação de serviços de consultoria e vistoria técnica de
            engenharia em elevadores, na modalidade de {isModelo2 ? 'Serviço Técnico Continuado (acompanhamento técnico contínuo ao longo de todo o ano)' : 'Serviço Técnico Pontual'},
            {' '}a serem executados pela CONTRATADA em favor do CONTRATANTE, no endereço do Condomínio {contract.contratante_nome || '—'}.
          </p>
          {contract.escopo_servico && <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', marginTop: 10 }}>{contract.escopo_servico}</p>}
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', marginTop: 10 }}>
            <strong>Parágrafo Primeiro:</strong> Integram o objeto deste contrato, sem exceções, os serviços da base do Serviço Técnico Pontual: vistoria
            do elevador, elaboração do RIA e plano de correções e melhorias.
          </p>
          {isModelo2 && (
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', marginTop: 10 }}>
              <strong>Parágrafo Segundo:</strong> Adicionalmente, exclusivos do Acompanhamento Contínuo, integram o objeto deste contrato: acompanhamento
              do plano de melhorias, análise de propostas de modernização, análise de contratos de manutenção e análise dos orçamentos de peças de reposição.
            </p>
          )}
        </ClauseBlock>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="03" title="Das Obrigações das Partes" />
        <div className="bd-u-grid-2 bd-u-gap-5">
          <ClauseBlock>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', margin: 0 }}>
              <strong>Cláusula Segunda:</strong> São obrigações da CONTRATADA: realizar os serviços conforme o escopo acordado entre as partes,
              utilizando-se de conhecimento técnico e boas práticas de engenharia; fornecer relatório técnico final dos serviços realizados, se
              aplicável, dentro do prazo estipulado.
            </p>
          </ClauseBlock>
          <ClauseBlock>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', margin: 0 }}>
              <strong>Cláusula Terceira:</strong> São obrigações do CONTRATANTE: fornecer acesso irrestrito e seguro às áreas necessárias para a
              execução dos serviços; efetuar o pagamento do valor acordado nas datas e condições estabelecidas na Cláusula Quinta.
            </p>
          </ClauseBlock>
        </div>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="04" title="Do Prazo" />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--bd-space-4)', flexWrap: 'wrap',
          background: 'var(--bd-primary-50)', borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-5)',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-primary-700)' }}>Início</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bd-navy-900)', marginTop: 4 }}>{dataLonga(contract.data_inicio)}</div>
          </div>
          <div style={{ fontSize: 20, color: 'var(--bd-primary-400)' }}>→</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-primary-700)' }}>Término</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bd-navy-900)', marginTop: 4 }}>{dataLonga(contract.data_termino)}</div>
          </div>
        </div>
        <p style={{ marginTop: 'var(--bd-space-3)', fontSize: 13, color: 'var(--bd-text-muted)' }}>
          <strong>Cláusula Quarta:</strong> O serviço será prestado no período acima.
        </p>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="05" title="Do Preço e das Condições de Pagamento" />
        <div className="bd-print-avoid-break" style={{ borderRadius: 'var(--bd-radius-md)', overflow: 'hidden', border: '1px solid var(--bd-border-subtle)' }}>
          <div style={{ background: 'var(--bd-navy-900)', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Valor total do contrato</span>
            <span style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 20, color: 'var(--bd-accent-400)' }}>{formatCurrency(contract.valor_total)}</span>
          </div>
          <div style={{ background: 'var(--bd-surface-sunken)', padding: '10px 20px', fontSize: 12, color: 'var(--bd-text-muted)' }}>
            ({contract.valor_total_extenso || '—'})
          </div>
          <div style={{ padding: 'var(--bd-space-5)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-text-muted)', marginBottom: 10 }}>
              Cláusula Quinta — Forma de pagamento
            </div>
            <div className="bd-u-flex-col bd-u-gap-2">
              {contract.parcela1_valor != null && contract.parcela1_valor !== '' && (
                <div className="bd-u-flex bd-u-justify-between" style={{ fontSize: 13, color: 'var(--bd-text-body)', borderBottom: '1px solid var(--bd-border-subtle)', paddingBottom: 8 }}>
                  <span>1ª parcela — adiantamento/início dos serviços, em {dataLonga(contract.parcela1_data)}</span>
                  <strong>{formatCurrency(contract.parcela1_valor)}</strong>
                </div>
              )}
              {contract.parcela2_valor != null && contract.parcela2_valor !== '' && (
                <div className="bd-u-flex bd-u-justify-between" style={{ fontSize: 13, color: 'var(--bd-text-body)', borderBottom: '1px solid var(--bd-border-subtle)', paddingBottom: 8 }}>
                  <span>2ª parcela, em {dataLonga(contract.parcela2_data)}</span>
                  <strong>{formatCurrency(contract.parcela2_valor)}</strong>
                </div>
              )}
              {contract.parcelas_mensais_valor != null && contract.parcelas_mensais_valor !== '' && (
                <div className="bd-u-flex bd-u-justify-between" style={{ fontSize: 13, color: 'var(--bd-text-body)' }}>
                  <span>Parcelas mensais restantes, a partir de {dataLonga(contract.parcelas_mensais_inicio)}</span>
                  <strong>{formatCurrency(contract.parcelas_mensais_valor)} cada</strong>
                </div>
              )}
            </div>
          </div>
        </div>
        <p style={{ marginTop: 'var(--bd-space-3)', fontSize: 13, color: 'var(--bd-text-muted)', fontStyle: 'italic' }}>
          <strong>Parágrafo Segundo:</strong> O pagamento poderá ser efetuado via PIX ou depósito bancário, mediante a apresentação da respectiva
          Nota Fiscal de Serviços emitida pela CONTRATADA.
        </p>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="06" title="Das Condições Gerais e Foro" />
        <ClauseBlock>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', margin: 0 }}>
            <strong>Cláusula Sexta:</strong> Eventuais alterações no escopo dos serviços deverão ser formalizadas por escrito (aditivo contratual ou
            troca de e-mails), com a reavaliação de prazos e valores, se necessário.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--bd-text-body)', marginTop: 10 }}>
            <strong>Cláusula Sétima:</strong> Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro da comarca
            de {contract.comarca_foro || '—'}, renunciando a qualquer outro, por mais privilegiado que seja.
          </p>
        </ClauseBlock>
      </div>

      <p style={{ marginTop: 'var(--bd-space-8)', fontSize: 13, color: 'var(--bd-text-body)' }}>
        E, por estarem assim justas e contratadas, firmam o presente instrumento em duas vias de igual teor e forma, na presença de duas testemunhas.
      </p>
      <p style={{ marginTop: 6, fontSize: 13, color: 'var(--bd-text-body)' }}>{contract.cidade_assinatura || '—'}, {dataLonga(contract.data_assinatura)}.</p>

      <div className="bd-u-grid-2 bd-u-gap-5" style={{ marginTop: 'var(--bd-space-8)' }}>
        <div style={{ borderTop: '2px solid var(--bd-navy-900)', paddingTop: 'var(--bd-space-3)' }}>
          <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-navy-900)' }}>Contratante</strong>
          <div style={{ fontSize: 13, color: 'var(--bd-text-body)', marginTop: 6 }}>{contract.contratante_nome || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>CNPJ nº {contract.contratante_cnpj || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>Síndico: {contract.contratante_sindico_nome || '—'}</div>
        </div>
        <div style={{ borderTop: '2px solid var(--bd-navy-900)', paddingTop: 'var(--bd-space-3)' }}>
          <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-navy-900)' }}>Contratada</strong>
          <div style={{ fontSize: 13, color: 'var(--bd-text-body)', marginTop: 6 }}>{contract.contratada_razao_social || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>CNPJ nº {contract.contratada_cnpj || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>Representante: {contract.contratada_representante || '—'}</div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)', paddingTop: 'var(--bd-space-5)', borderTop: '1px solid var(--bd-border-default)' }}>
        <strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--bd-text-muted)' }}>Testemunhas</strong>
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--bd-text-body)' }}>Nome: _____________________________________ &nbsp; CPF: _____________________________________</div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--bd-text-body)' }}>Assinatura: ________________________________</div>
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--bd-text-body)' }}>Nome: _____________________________________ &nbsp; CPF: _____________________________________</div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--bd-text-body)' }}>Assinatura: ________________________________</div>
      </div>
    </div>
  );
}
