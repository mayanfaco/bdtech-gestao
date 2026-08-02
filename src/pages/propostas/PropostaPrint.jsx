import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { modelo1Calculo, modelo2Calculo, formatCurrency } from '../../lib/proposalCalculations.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import '../../print.css';

const DEFAULT_TEXTS = {
  texto_objeto: (nome, qtd) => `A presente proposta tem por objeto a prestação de serviços de Consultoria Técnica Especializada em Elevadores de Passageiros, a ser executada junto ao empreendimento ${nome}, abrangendo ${String(qtd).padStart(2, '0')} elevador(es) de transporte vertical. Os serviços contemplam avaliação técnica, acompanhamento contínuo e orientação especializada ao síndico e à administração, com foco na segurança dos usuários, na conformidade com as normas técnicas vigentes, na correta manutenção dos equipamentos e no suporte à tomada de decisões técnicas ao longo de toda a vigência contratual.`,
  texto_vigencia: `O contrato terá vigência de 01 (um) ano. Será renovado automaticamente por iguais períodos, caso não haja manifestação contrária. Contrato será reajustado pelo IPCA.`,
  texto_responsabilidade: `Nosso trabalho vai além da simples execução de uma vistoria. Disponibilizamos ao condomínio uma análise técnica detalhada, transparente e imparcial, com acompanhamento contínuo, priorizando a segurança dos moradores, visitantes e colaboradores. Nosso compromisso é oferecer diagnósticos precisos, acompanhamento técnico efetivo e recomendações objetivas, assegurando confiabilidade, eficiência operacional e conformidade legal dos equipamentos, contribuindo para a tranquilidade da administração e valorização do patrimônio condominial.`,
};

function Section({ number, title, children }) {
  return (
    <section style={{ marginTop: 'var(--bd-space-8)' }}>
      <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ marginBottom: 'var(--bd-space-3)' }}>
        <span style={{
          width: 28, height: 28, borderRadius: '50%', background: 'var(--bd-navy-900)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 13, flex: '0 0 auto',
        }}>{number}</span>
        <h2 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--bd-navy-900)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--bd-text-body)' }}>{children}</div>
    </section>
  );
}

export default function PropostaPrint() {
  const { id } = useParams();
  const [proposal, setProposal] = React.useState(null);
  const [client, setClient] = React.useState(null);
  const [contact, setContact] = React.useState(null);
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    supabase.from('proposals').select('*').eq('id', id).single().then(({ data }) => {
      setProposal(data);
      if (data?.client_id) supabase.from('clients').select('*').eq('id', data.client_id).single().then(({ data: c }) => setClient(c));
      if (data?.contact_id) supabase.from('client_contacts').select('*').eq('id', data.contact_id).single().then(({ data: c }) => setContact(c));
    });
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
  }, [id]);

  if (!proposal || !settings) return null;

  const texts = proposal.texto_overrides ?? {};
  const objeto = texts.texto_objeto || DEFAULT_TEXTS.texto_objeto(client?.nome ?? '', proposal.qtd_elevadores ?? 0);
  const vigencia = texts.texto_vigencia || DEFAULT_TEXTS.texto_vigencia;
  const responsabilidade = texts.texto_responsabilidade || DEFAULT_TEXTS.texto_responsabilidade;

  const m1 = modelo1Calculo({
    valorComDesconto: proposal.modelo1_valor_com_desconto, descontoPercentual: proposal.desconto_percentual, entradaPercentual: proposal.modelo1_entrada_percentual,
  });
  const m2 = modelo2Calculo({
    valorComDescontoMensal: proposal.modelo2_valor_com_desconto_mensal, descontoPercentual: proposal.desconto_percentual,
    entradaPercentual: proposal.modelo2_entrada_percentual, parcelasRestante: proposal.modelo2_parcelas_restante,
  });

  return (
    <div style={{ background: 'var(--bd-surface-page)', minHeight: '100vh' }}>
      <div className="no-print" style={{ position: 'sticky', top: 0, background: 'var(--bd-navy-900)', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 10 }}>
        <Button size="sm" onClick={() => window.print()}>Imprimir / Exportar PDF</Button>
      </div>

      <div className="bd-print-page">
        <header className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ borderBottom: '2px solid var(--bd-navy-900)', paddingBottom: 'var(--bd-space-5)', marginBottom: 'var(--bd-space-6)' }}>
          <div>
            <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 22, color: 'var(--bd-navy-900)' }}>BDTECH</div>
            <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--bd-text-muted)' }}>Consultoria Técnica em Elevadores</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--bd-text-muted)' }}>
            <div>Proposta de Consultoria Técnica em Elevadores</div>
            <div>{proposal.data_proposta}</div>
          </div>
        </header>

        <div className="bd-u-grid-2 bd-u-gap-6" style={{ marginBottom: 'var(--bd-space-6)' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: 'var(--bd-primary-600)', textTransform: 'uppercase' }}>Cliente</div>
            <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 18 }}>{client?.nome ?? '—'}</div>
            {contact && (
              <div style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 4 }}>
                A/C {contact.nome}{contact.cargo ? ` — ${contact.cargo}` : ''}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: 'var(--bd-primary-600)', textTransform: 'uppercase' }}>Equipamentos</div>
            <div style={{ fontSize: 15 }}>{String(proposal.qtd_elevadores ?? 0).padStart(2, '0')} elevador(es) de transporte vertical</div>
          </div>
        </div>

        <Section number="01" title="Objeto">
          <p>{objeto}</p>
        </Section>

        <Section number="02" title="Modelos de Prestação de Serviços">
          <p><strong>Modelo 1 — Serviço Técnico Pontual.</strong> Diagnóstico técnico completo, entregue em um único atendimento.</p>
          <p style={{ marginTop: 8 }}><strong>1.1 Vistoria do elevador</strong> — segurança, estado de conservação, funcionamento, conforto, manutenção, necessidade de modernização e conformidade técnica.</p>
          <p style={{ marginTop: 8 }}><strong>1.2 Elaboração do RIA — Relatório de Inspeção Anual.</strong> Vistoria realizada por Engenheiro Mecânico legalmente habilitado, com registro no CREA, em conformidade com a Decisão Normativa CONFEA nº 36/1991.</p>
          <p style={{ marginTop: 8 }}><strong>1.3 Plano de Correções e Melhorias</strong> — recomendações técnicas objetivas voltadas à correção de irregularidades e à melhoria contínua da segurança e do desempenho dos equipamentos.</p>
          <p style={{ marginTop: 16 }}><strong>Modelo 2 — Serviço Técnico Continuado.</strong> Acompanhamento técnico contínuo ao longo de todo o ano, incluindo toda a base do Modelo 1, mais acompanhamento do plano de melhorias, análise de propostas de modernização, análise de contratos de manutenção e análise de orçamentos de peças de reposição.</p>
        </Section>

        <Section number="03" title="Condições Comerciais">
          {proposal.tipo_precificacao === 'modelo_fixo' ? (
            <div className="bd-u-grid-2 bd-u-gap-6">
              <div>
                <strong>Modelo 1 — Serviço Técnico Pontual</strong>
                <div style={{ marginTop: 6 }}>Valor total do contrato: {formatCurrency(m1.valorTotal)}</div>
                <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
                  Forma de pagamento: {proposal.modelo1_entrada_percentual}% na assinatura · {m1.restantePercentual}% na entrega do laudo técnico final
                </div>
              </div>
              <div>
                <strong>Modelo 2 — Serviço Técnico Continuado</strong>
                <div style={{ marginTop: 6 }}>Valor mensal: {formatCurrency(m2.valorMensal)} · Valor anual: {formatCurrency(m2.valorAnual)}</div>
                {m2.valorParcela != null && (
                  <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>
                    Parcelamento: {proposal.modelo2_parcelas_restante}x de {formatCurrency(m2.valorParcela)}
                  </div>
                )}
              </div>
            </div>
          ) : <p>Condições comerciais detalhadas nos itens desta proposta.</p>}
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--bd-text-muted)' }}>Serviços extraordinários fora do escopo poderão ser orçados à parte, mediante solicitação do condomínio.</p>
        </Section>

        <Section number="04" title="Vigência, Rescisão e Renovação">
          <p>{vigencia}</p>
        </Section>

        <Section number="05" title="Responsabilidade e Compromisso">
          <p>{responsabilidade}</p>
        </Section>

        <footer style={{ marginTop: 'var(--bd-space-12)', paddingTop: 'var(--bd-space-6)', borderTop: '1px solid var(--bd-border-default)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700 }}>{settings.representante_legal}</div>
          <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>{settings.crea} · Diretor Técnico</div>
          <div style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>{settings.razao_social}</div>
        </footer>
      </div>
    </div>
  );
}
