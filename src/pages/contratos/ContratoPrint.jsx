import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { formatCurrency } from '../../lib/proposalCalculations.js';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import '../../print.css';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function dataLonga(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

export default function ContratoPrint() {
  const { id } = useParams();
  const [contract, setContract] = React.useState(null);

  React.useEffect(() => {
    supabase.from('contracts').select('*').eq('id', id).single().then(({ data }) => setContract(data));
  }, [id]);

  if (!contract) return null;

  const isModelo2 = contract.modelo === 'modelo2';
  const numero = `CONT-${contract.data_inicio ? new Date(contract.data_inicio).getFullYear() : ''}-${String(contract.numero).padStart(4, '0')}`;

  return (
    <div style={{ background: 'var(--bd-surface-page)', minHeight: '100vh' }}>
      <div className="no-print" style={{ position: 'sticky', top: 0, background: 'var(--bd-navy-900)', padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 10 }}>
        <Button size="sm" onClick={() => window.print()}>Imprimir / Exportar PDF</Button>
      </div>

      <div className="bd-print-page" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--bd-text-body)' }}>
        <h1 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 20, textAlign: 'center', color: 'var(--bd-navy-900)' }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--bd-text-muted)', marginBottom: 'var(--bd-space-8)' }}>{numero}</div>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15 }}>IDENTIFICAÇÃO DAS PARTES CONTRATANTES</h3>
        <p><strong>CONTRATANTE:</strong> {contract.contratante_nome}, pessoa jurídica de direito privado, inscrito no CNPJ sob o nº {contract.contratante_cnpj}, com sede em {contract.contratante_endereco}, neste ato representado por seu síndico {contract.contratante_sindico_nome}, CPF nº {contract.contratante_sindico_cpf}.</p>
        <p style={{ marginTop: 8 }}><strong>CONTRATADA:</strong> {contract.contratada_razao_social}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {contract.contratada_cnpj}, com sede em {contract.contratada_endereco}, neste ato representada por seu representante legal, Sr(a). {contract.contratada_representante}, portador(a) do CPF nº {contract.contratada_cpf}.</p>
        <p style={{ marginTop: 8 }}>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente instrumento.</p>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginTop: 24 }}>DO OBJETO DO CONTRATO</h3>
        <p><strong>Cláusula Primeira:</strong> O presente contrato tem como objeto a prestação de serviços de consultoria e vistoria técnica de engenharia em elevadores, na modalidade de {isModelo2 ? 'Serviço Técnico Continuado (acompanhamento técnico contínuo ao longo de todo o ano)' : 'Serviço Técnico Pontual'}, a serem executados pela CONTRATADA em favor do CONTRATANTE, no endereço do Condomínio {contract.contratante_nome}.</p>
        {contract.escopo_servico && <p style={{ marginTop: 8 }}>{contract.escopo_servico}</p>}
        <p style={{ marginTop: 8 }}><strong>Parágrafo Primeiro:</strong> Integram o objeto deste contrato, sem exceções, os serviços da base do Serviço Técnico Pontual: vistoria do elevador, elaboração do RIA e plano de correções e melhorias.</p>
        {isModelo2 && (
          <p style={{ marginTop: 8 }}><strong>Parágrafo Segundo:</strong> Adicionalmente, exclusivos do Acompanhamento Contínuo, integram o objeto deste contrato: acompanhamento do plano de melhorias, análise de propostas de modernização, análise de contratos de manutenção e análise dos orçamentos de peças de reposição.</p>
        )}

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginTop: 24 }}>DAS OBRIGAÇÕES DAS PARTES</h3>
        <p><strong>Cláusula Segunda:</strong> São obrigações da CONTRATADA: realizar os serviços conforme o escopo acordado entre as partes, utilizando-se de conhecimento técnico e boas práticas de engenharia; fornecer relatório técnico final dos serviços realizados, se aplicável, dentro do prazo estipulado.</p>
        <p style={{ marginTop: 8 }}><strong>Cláusula Terceira:</strong> São obrigações do CONTRATANTE: fornecer acesso irrestrito e seguro às áreas necessárias para a execução dos serviços; efetuar o pagamento do valor acordado nas datas e condições estabelecidas na Cláusula Quinta.</p>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginTop: 24 }}>DO PRAZO</h3>
        <p><strong>Cláusula Quarta:</strong> O serviço será prestado no período de {dataLonga(contract.data_inicio)} a {dataLonga(contract.data_termino)}.</p>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginTop: 24 }}>DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO</h3>
        <p><strong>Cláusula Quinta:</strong> O valor total dos serviços objeto deste contrato é de {formatCurrency(contract.valor_total)} ({contract.valor_total_extenso}), a ser pago pelo CONTRATANTE à CONTRATADA.</p>
        <p style={{ marginTop: 8 }}><strong>Parágrafo Primeiro:</strong> O pagamento será realizado da seguinte forma:</p>
        <ul>
          {contract.parcela1_valor != null && <li>Primeira parcela: {formatCurrency(contract.parcela1_valor)}, paga em {dataLonga(contract.parcela1_data)}, referente ao adiantamento/início dos serviços.</li>}
          {contract.parcela2_valor != null && <li>Segunda parcela: {formatCurrency(contract.parcela2_valor)}, paga em {dataLonga(contract.parcela2_data)}.</li>}
          {contract.parcelas_mensais_valor != null && <li>Parcelas mensais restantes: {formatCurrency(contract.parcelas_mensais_valor)} cada, pagas mensalmente a partir de {dataLonga(contract.parcelas_mensais_inicio)}.</li>}
        </ul>
        <p style={{ marginTop: 8 }}><strong>Parágrafo Segundo:</strong> O pagamento poderá ser efetuado via PIX ou depósito bancário, mediante a apresentação da respectiva Nota Fiscal de Serviços emitida pela CONTRATADA.</p>

        <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 15, marginTop: 24 }}>DAS CONDIÇÕES GERAIS E FORO</h3>
        <p><strong>Cláusula Sexta:</strong> Eventuais alterações no escopo dos serviços deverão ser formalizadas por escrito (aditivo contratual ou troca de e-mails), com a reavaliação de prazos e valores, se necessário.</p>
        <p style={{ marginTop: 8 }}><strong>Cláusula Sétima:</strong> Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro da comarca de {contract.comarca_foro}, renunciando a qualquer outro, por mais privilegiado que seja.</p>

        <p style={{ marginTop: 24 }}>E, por estarem assim justas e contratadas, firmam o presente instrumento em duas vias de igual teor e forma, na presença de duas testemunhas.</p>
        <p style={{ marginTop: 8 }}>{contract.cidade_assinatura}, {dataLonga(contract.data_assinatura)}.</p>

        <div className="bd-u-grid-2 bd-u-gap-6" style={{ marginTop: 'var(--bd-space-8)' }}>
          <div>
            <strong>CONTRATANTE</strong>
            <div>{contract.contratante_nome}</div>
            <div>CNPJ nº {contract.contratante_cnpj}</div>
            <div>Síndico: {contract.contratante_sindico_nome}</div>
          </div>
          <div>
            <strong>CONTRATADA</strong>
            <div>{contract.contratada_razao_social}</div>
            <div>CNPJ nº {contract.contratada_cnpj}</div>
            <div>Representante: {contract.contratada_representante}</div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--bd-space-8)' }}>
          <strong>TESTEMUNHAS</strong>
          <div style={{ marginTop: 16 }}>Nome: _____________________________________ &nbsp; CPF: _____________________________________</div>
          <div style={{ marginTop: 8 }}>Assinatura: ________________________________</div>
          <div style={{ marginTop: 16 }}>Nome: _____________________________________ &nbsp; CPF: _____________________________________</div>
          <div style={{ marginTop: 8 }}>Assinatura: ________________________________</div>
        </div>
      </div>
    </div>
  );
}
