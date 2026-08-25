import React from 'react';
import { modelo1Calculo, modelo2Calculo, formatCurrency } from '../../lib/proposalCalculations.js';
import { nomeContatoCompleto } from '../../lib/proposalContato.js';
import { Badge } from '../../design-system/components/feedback/Badge.jsx';
import logotypeNavy from '../../design-system/assets/brand/bdtech-logotype-navy.svg';

const COMPANY_PHONE = '(85) 9.9698-5607';

const DEFAULT_TEXTS = {
  texto_vigencia: 'O contrato terá vigência de 01 (um) ano. Será renovado automaticamente por iguais períodos, caso não haja manifestação contrária. Contrato será reajustado pelo IPCA.',
  texto_responsabilidade: 'Nosso trabalho vai além da simples execução de uma vistoria. Disponibilizamos ao condomínio uma análise técnica detalhada, transparente e imparcial, com acompanhamento contínuo, priorizando a segurança dos moradores, visitantes e colaboradores. Nosso compromisso é oferecer diagnósticos precisos, acompanhamento técnico efetivo e recomendações objetivas, assegurando confiabilidade, eficiência operacional e conformidade legal dos equipamentos, contribuindo para a tranquilidade da administração e valorização do patrimônio condominial.',
};

// Envolve trechos conhecidos (números, siglas, palavras-chave) em <strong>,
// preservando o restante do texto — funciona tanto com o texto padrão quanto
// com overrides do usuário (se o trecho não existir, nada é destacado).
function highlight(text, terms) {
  if (!text) return text;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return text.split(pattern).map((part, i) => (terms.includes(part) ? <strong key={i}>{part}</strong> : part));
}

function sentencesToBullets(text) {
  if (!text) return [];
  return text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
}

function SectionHeading({ number, title, suffix }) {
  return (
    <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ marginBottom: 'var(--bd-space-4)' }}>
      <span style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 16, color: 'var(--bd-primary-500)' }}>{number}</span>
      <h2 style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 21, color: 'var(--bd-navy-900)', margin: 0 }}>{title}</h2>
      {suffix && <span style={{ fontSize: 13, color: 'var(--bd-text-muted)' }}>{suffix}</span>}
    </div>
  );
}

function SubHeading({ children }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
      color: 'var(--bd-primary-600)', marginTop: 'var(--bd-space-5)', marginBottom: 'var(--bd-space-2)',
    }}>{children}</div>
  );
}

function ModeloBox({ badge, solid, borderColor, titulo, subtitulo, children }) {
  return (
    <div className="bd-print-avoid-break" style={{
      background: 'var(--bd-neutral-50)', border: '1px solid var(--bd-border-subtle)', borderLeft: `4px solid ${borderColor}`,
      borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-6)', marginBottom: 'var(--bd-space-5)',
    }}>
      <div className="bd-u-flex bd-u-items-center bd-u-gap-3" style={{ flexWrap: 'wrap' }}>
        <Badge tone="brand" solid={solid}>{badge}</Badge>
        <strong style={{ fontSize: 15, color: 'var(--bd-navy-900)' }}>{titulo}</strong>
      </div>
      <p style={{ fontSize: 13, color: 'var(--bd-text-muted)', marginTop: 6 }}>{subtitulo}</p>
      {children}
    </div>
  );
}

/**
 * Renderização visual do documento de proposta — usada tanto na prévia ao
 * vivo do formulário quanto na rota de impressão final (mesma aparência).
 */
export function PropostaDocumentPreview({ proposal, client, contact, settings }) {
  const texts = proposal.texto_overrides ?? {};
  const vigencia = texts.texto_vigencia || DEFAULT_TEXTS.texto_vigencia;
  const responsabilidade = texts.texto_responsabilidade || DEFAULT_TEXTS.texto_responsabilidade;

  const m1 = modelo1Calculo({
    valorComDesconto: proposal.modelo1_valor_com_desconto, descontoPercentual: proposal.desconto_percentual,
    entradaPercentual: proposal.modelo1_entrada_percentual, parcelasRestante: proposal.modelo1_parcelas_restante,
  });
  const m2 = modelo2Calculo({
    valorComDescontoMensal: proposal.modelo2_valor_com_desconto_mensal, descontoPercentual: proposal.desconto_percentual,
    entradaPercentual: proposal.modelo2_entrada_percentual, parcelasRestante: proposal.modelo2_parcelas_restante,
  });
  const desconto = Number(proposal.desconto_percentual) || 0;
  const qtdLabel = `${String(proposal.qtd_elevadores || 0).padStart(2, '0')} elevador(es) de transporte vertical`;

  // Identificação completa do cliente: o campo "nome" é o nome curto do
  // condomínio; a razão social e o CNPJ é que identificam juridicamente quem
  // contrata. Só repete a razão social quando ela difere do nome.
  const razaoSocial = client?.razao_social && client.razao_social !== client?.nome ? client.razao_social : null;
  const docCliente = client?.cpf_cnpj || client?.cnpj || null;
  const clienteIdentificacao = [razaoSocial, docCliente].filter(Boolean).join(' · ');

  // A/C — a quem a proposta é dirigida. A fonte é o contato principal do
  // CADASTRO DO CLIENTE, que é o único editável na interface. O contato de
  // client_contacts (legado, sem tela de edição desde que a aba "Contatos"
  // saiu) entra apenas como fallback para propostas antigas de clientes que
  // não têm contato principal preenchido — assim nada fica em branco, e um
  // registro que o usuário não consegue corrigir nunca vence o que ele edita.
  const contatoCargo = client?.contato_cargo || contact?.cargo || '';
  const acNome = nomeContatoCompleto({
    contatoNome: client?.contato_nome || contact?.nome,
    contatoCargo,
    sindicoNome: client?.sindico_nome,
  });
  const acLabel = acNome ? `${acNome}${contatoCargo ? ` — ${contatoCargo}` : ''}` : '—';

  return (
    <div className="bd-print-page">
      <header className="bd-u-flex bd-u-items-center bd-u-justify-between" style={{ marginBottom: 'var(--bd-space-5)' }}>
        <img src={logotypeNavy} alt="BDTECH" style={{ height: 32, width: 'auto' }} />
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--bd-navy-900)' }}>Engº {settings?.representante_legal || '—'}</div>
          <div style={{ color: 'var(--bd-text-muted)' }}>{settings?.crea || '—'} · {COMPANY_PHONE}</div>
        </div>
      </header>

      <div className="bd-print-avoid-break" style={{
        position: 'relative', overflow: 'hidden', borderRadius: 'var(--bd-radius-lg)', background: 'var(--bd-gradient-hero)',
        padding: 'var(--bd-space-6) var(--bd-space-8)', marginBottom: 'var(--bd-space-8)',
      }}>
        <Badge tone="neutral" style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}>Proposta de Consultoria Técnica em Elevadores</Badge>
        <h1 style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 30, lineHeight: 1.2, color: '#fff', margin: '14px 0 22px' }}>
          Consultoria Técnica<br /><span style={{ color: 'var(--bd-accent-400)' }}>em Elevadores</span>
        </h1>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,.18)', paddingTop: 'var(--bd-space-4)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--bd-space-4)',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.56)' }}>Cliente</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{client?.nome || '—'}</div>
            {clienteIdentificacao && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.74)', marginTop: 3, lineHeight: 1.35 }}>{clienteIdentificacao}</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.56)' }}>A/C</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{acLabel}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.56)' }}>Equipamentos</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4 }}>{qtdLabel}</div>
          </div>
        </div>
      </div>

      <SectionHeading number="01" title="Objeto" />
      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--bd-text-body)' }}>
        A presente proposta tem por objeto a prestação de serviços de <strong>Consultoria Técnica Especializada em Elevadores de Passageiros</strong>, a
        ser executada junto ao empreendimento <strong>{client?.nome || '—'}</strong>, abrangendo <strong>{qtdLabel}</strong>. Os serviços contemplam
        avaliação técnica, acompanhamento contínuo e orientação especializada ao síndico e à administração, com foco na segurança dos usuários, na
        conformidade com as normas técnicas vigentes, na correta manutenção dos equipamentos e no suporte à tomada de decisões técnicas ao longo de
        toda a vigência contratual.
      </p>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="02" title="Modelos de Prestação de Serviços" />

        <ModeloBox badge="MODELO 1" borderColor="var(--bd-primary-500)" titulo="SERVIÇO TÉCNICO PONTUAL" subtitulo="Diagnóstico técnico completo, entregue em um único atendimento.">
          <SubHeading>1.1 Vistoria do elevador</SubHeading>
          <p style={{ fontSize: 13, color: 'var(--bd-text-body)' }}>Observando os pontos abaixo, com destaque para a segurança como item mais importante:</p>
          <ul style={{ fontSize: 13, color: 'var(--bd-text-body)', margin: '6px 0 0', paddingLeft: 18 }}>
            <li><strong>Segurança</strong> — o item mais importante</li>
            <li>Estado de conservação</li>
            <li>Funcionamento</li>
            <li>Conforto</li>
            <li>Manutenção</li>
            <li>Necessidade de modernização</li>
            <li>Conformidade técnica</li>
          </ul>
          <SubHeading>1.2 Elaboração do RIA — Relatório de Inspeção Anual e Emissão de ART</SubHeading>
          <p style={{ fontSize: 13, color: 'var(--bd-text-body)' }}>
            O Relatório de Inspeção Anual (RIA) é um instrumento técnico essencial para a gestão segura e responsável dos elevadores. Elaborado por
            profissional legalmente habilitado, avalia de forma criteriosa as condições de segurança, funcionamento, conservação e conformidade dos
            equipamentos, oferecendo uma visão clara sobre os riscos existentes e as medidas necessárias para mitigá-los.
          </p>
          <p style={{ fontSize: 13, color: 'var(--bd-text-body)', marginTop: 8 }}>
            O serviço contempla a realização da vistoria técnica, elaboração e emissão do Relatório de Inspeção Anual (RIA), bem como a emissão da
            respectiva Anotação de Responsabilidade Técnica (ART), por Engenheiro Mecânico legalmente habilitado e com registro ativo no CREA, em
            conformidade com a Decisão Normativa CONFEA nº 36/1991 e demais legislações e normas técnicas aplicáveis.
          </p>
          <SubHeading>1.3 Plano de Correções e Melhorias</SubHeading>
          <p style={{ fontSize: 13, color: 'var(--bd-text-body)' }}>
            Elaboração de recomendações técnicas objetivas voltadas à correção das irregularidades identificadas na vistoria e à melhoria contínua da
            segurança e do desempenho dos equipamentos.
          </p>
        </ModeloBox>

        <ModeloBox badge="MODELO 2" solid borderColor="var(--bd-navy-700)" titulo="SERVIÇO TÉCNICO CONTINUADO" subtitulo="Acompanhamento técnico contínuo ao longo de todo o ano.">
          <SubHeading>2.1 MODELO 1 incluído</SubHeading>
          <p style={{ fontSize: 13, color: 'var(--bd-text-body)' }}>Toda a base do Serviço Técnico Pontual, sem exceções:</p>
          <ul style={{ fontSize: 13, color: 'var(--bd-text-body)', margin: '6px 0 0', paddingLeft: 18 }}>
            <li>Vistoria do elevador</li>
            <li>Elaboração do RIA</li>
            <li>Emissão de ART</li>
            <li>Plano de Correções e Melhorias</li>
          </ul>
          <SubHeading>2.2 Serviços adicionais — exclusivos do Acompanhamento Contínuo</SubHeading>
          <ul style={{ fontSize: 13, color: 'var(--bd-text-body)', margin: '6px 0 0', paddingLeft: 18 }}>
            <li>Acompanhamento do Plano de Melhorias</li>
            <li>Análise de Propostas de Modernização</li>
            <li>Análise de Contratos de Manutenção</li>
            <li>Análise dos Orçamentos de Peças de Reposição</li>
            <li>Participação em reuniões importantes com Síndico/Conselho e Mantenedora</li>
          </ul>
          <p style={{ fontSize: 12, color: 'var(--bd-text-muted)', marginTop: 'var(--bd-space-4)', borderTop: '1px solid var(--bd-border-default)', paddingTop: 'var(--bd-space-3)' }}>
            O acompanhamento contínuo tem como objetivo reduzir riscos técnicos e operacionais, garantir conformidade normativa e oferecer respaldo
            técnico permanente à gestão do empreendimento.
          </p>
        </ModeloBox>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="03" title="Condições Comerciais" />
        {proposal.tipo_precificacao === 'modelo_fixo' ? (
          <div className="bd-u-flex-col bd-u-gap-5">
            <div className="bd-print-avoid-break" style={{ borderRadius: 'var(--bd-radius-md)', overflow: 'hidden', border: '1px solid var(--bd-border-subtle)' }}>
              <div style={{ background: 'var(--bd-navy-900)', color: '#fff', padding: '12px 20px', fontWeight: 700, fontSize: 14 }}>
                MODELO 1 — SERVIÇO TÉCNICO PONTUAL (VISTORIA ÚNICA)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: 'var(--bd-space-5)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-text-muted)' }}>Valor inicial</div>
                  <div style={{ fontSize: 15, color: 'var(--bd-text-muted)', textDecoration: 'line-through', marginTop: 4 }}>{formatCurrency(m1.valorInicial)}</div>
                </div>
                <div style={{ padding: 'var(--bd-space-5)', background: 'var(--bd-primary-50)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-primary-700)' }}>Valor com desconto (−{desconto}%)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--bd-navy-900)', marginTop: 4 }}>{formatCurrency(m1.valorTotal)}</div>
                </div>
              </div>
              <div style={{ background: 'var(--bd-surface-sunken)', padding: '12px 20px', fontSize: 13, color: 'var(--bd-text-body)' }}>
                {Number(proposal.modelo1_parcelas_restante) > 1 ? (
                  <>Forma de pagamento: <strong>{proposal.modelo1_entrada_percentual || 0}% na assinatura ({formatCurrency(m1.entradaValor)})</strong> · restante em <strong>{proposal.modelo1_parcelas_restante}x de {formatCurrency(m1.valorParcela)}</strong></>
                ) : (
                  <>Forma de pagamento: <strong>{proposal.modelo1_entrada_percentual || 0}% na assinatura do contrato</strong> · <strong>{m1.restantePercentual}% na entrega do Laudo Técnico Final</strong></>
                )}
              </div>
            </div>

            <div className="bd-print-avoid-break" style={{ borderRadius: 'var(--bd-radius-md)', overflow: 'hidden', border: '1px solid var(--bd-border-subtle)' }}>
              <div style={{ background: 'var(--bd-gradient-split)', color: '#fff', padding: '12px 20px', fontWeight: 700, fontSize: 14 }}>
                MODELO 2 — SERVIÇO TÉCNICO CONTINUADO
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: 'var(--bd-space-5)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-text-muted)' }}>Valor inicial</div>
                  <div style={{ fontSize: 15, color: 'var(--bd-text-muted)', textDecoration: 'line-through', marginTop: 4 }}>{formatCurrency(m2.valorInicialMensal)}</div>
                </div>
                <div style={{ padding: 'var(--bd-space-5)', background: 'var(--bd-primary-50)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-primary-700)' }}>Valor com desconto (−{desconto}%)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--bd-navy-900)', marginTop: 4 }}>{formatCurrency(m2.valorMensal)}</div>
                </div>
              </div>
              {Number(proposal.modelo2_entrada_percentual) > 0 && (
                <div style={{ background: 'var(--bd-surface-sunken)', padding: '12px 20px', fontSize: 13, color: 'var(--bd-text-body)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span>Entrada no fechamento ({proposal.modelo2_entrada_percentual}%)</span>
                  <strong style={{ fontSize: 15, color: 'var(--bd-navy-900)' }}>{formatCurrency(m2.entradaValor)}</strong>
                </div>
              )}
              <div style={{
                background: 'var(--bd-navy-900)', color: '#fff', padding: '14px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--bd-accent-300)' }}>
                    {Number(proposal.modelo2_entrada_percentual) > 0 ? 'Restante parcelado' : 'Parcelamento'} — {proposal.modelo2_parcelas_restante || 0} parcelas fixas
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.72)', marginTop: 4 }}>
                    Parcelas fixas · Sem custos adicionais durante o contrato · Sem cobranças imprevistas
                  </div>
                </div>
                {m2.valorParcela != null && (
                  <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 800, fontSize: 22, color: 'var(--bd-accent-400)' }}>
                    {proposal.modelo2_parcelas_restante || 0}x {formatCurrency(m2.valorParcela)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : <p style={{ fontSize: 14 }}>Condições comerciais detalhadas nos itens desta proposta.</p>}
        <p style={{ marginTop: 'var(--bd-space-3)', fontSize: 13, color: 'var(--bd-text-muted)', fontStyle: 'italic' }}>
          Serviços extraordinários fora do escopo poderão ser orçados à parte, mediante solicitação do condomínio.
        </p>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="04" title="Vigência, Rescisão e Renovação" suffix="(Proposta Anual)" />
        <ul style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--bd-text-body)', paddingLeft: 18, margin: 0 }}>
          {sentencesToBullets(vigencia).map((s, i) => <li key={i}>{highlight(s, ['01 (um) ano', 'IPCA'])}</li>)}
        </ul>
      </div>

      <div style={{ marginTop: 'var(--bd-space-8)' }}>
        <SectionHeading number="05" title="Responsabilidade e Compromisso" />
        <div className="bd-print-avoid-break" style={{ background: 'var(--bd-gradient-hero)', color: 'rgba(255,255,255,.92)', borderRadius: 'var(--bd-radius-md)', padding: 'var(--bd-space-6)' }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: '#fff' }}>{highlight(responsabilidade, ['imparcial'])}</p>
        </div>
      </div>

      <footer className="bd-print-avoid-break" style={{ marginTop: 'var(--bd-space-12)', paddingTop: 'var(--bd-space-5)', borderTop: '1px solid var(--bd-border-default)' }}>
        <SectionHeading number="06" title="Assinaturas" />
        <div className="bd-doc-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--bd-space-10)', marginTop: 'var(--bd-space-8)' }}>
          <div>
            <div className="bd-doc-sign-line" style={{ height: 90, borderBottom: '1px solid var(--bd-border-strong)' }} />
            <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 14, color: 'var(--bd-navy-900)', marginTop: 'var(--bd-space-3)' }}>
              {settings?.representante_legal}
            </div>
            <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>{settings?.crea} · Diretor Técnico</div>
            <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>{settings?.razao_social}</div>
          </div>
          <div>
            <div className="bd-doc-sign-line" style={{ height: 90, borderBottom: '1px solid var(--bd-border-strong)' }} />
            <div style={{ fontFamily: 'var(--bd-font-display)', fontWeight: 700, fontSize: 14, color: 'var(--bd-navy-900)', marginTop: 'var(--bd-space-3)' }}>
              {acNome || '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>{contact?.cargo || client?.contato_cargo || 'Síndico'}</div>
            <div style={{ fontSize: 12, color: 'var(--bd-text-muted)' }}>{client?.nome}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
