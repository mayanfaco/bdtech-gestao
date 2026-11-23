// Sugestões de prospecção em Fortaleza, levantadas em pesquisa pública
// (novembro/2026). Endereços e telefones vêm de sites oficiais, guias e
// diretórios; podem estar desatualizados. Por isso cada local tem o botão
// "Ver no mapa" e o aviso para confirmar antes de ligar. Telefone "null" =
// não encontrado em fonte confiável (não foi inventado).

export const DORES_POR_TIPO = {
  'Hospital / clínica': {
    emoji: '🏥',
    dor: 'Elevador de maca parado atrasa paciente, exame e cirurgia. Funciona 24h, desgasta mais e não pode parar.',
    quem: 'Engenharia clínica, manutenção predial ou diretoria administrativa.',
  },
  'Universidade / faculdade': {
    emoji: '🎓',
    dor: 'Acessibilidade: aluno com deficiência depende do elevador para estudar (Lei 13.146/2015, NBR 9050). Fluxo enorme nos horários de aula.',
    quem: 'Prefeitura do campus, infraestrutura ou manutenção.',
  },
  Escola: {
    emoji: '🏫',
    dor: 'Segurança de crianças e acessibilidade. Pais cobram. Um incidente vira notícia e afeta matrícula.',
    quem: 'Direção administrativa ou mantenedora.',
  },
  Shopping: {
    emoji: '🛍️',
    dor: 'Elevadores e escadas rolantes com fluxo altíssimo. Parada vira reclamação na hora e risco de acidente com público.',
    quem: 'Superintendência ou gerência de operações/manutenção.',
  },
  'Órgão público': {
    emoji: '🏛️',
    dor: 'O fiscal do contrato precisa comprovar que a manutenção paga é entregue (Lei 14.133/2021). Elevador parado em prédio público vira notícia.',
    quem: 'Setor de engenharia, manutenção predial ou fiscal do contrato.',
  },
  Construtora: {
    emoji: '🏗️',
    dor: 'Elevador com defeito na entrega gera reclamação de morador e chamado de garantia. Vistoria antes da entrega protege a marca.',
    quem: 'Engenharia de obras, pós-obra ou assistência técnica.',
  },
  Hotel: {
    emoji: '🏨',
    dor: 'Hóspede preso no elevador vira avaliação ruim no mesmo dia. Alta ocupação desgasta os equipamentos.',
    quem: 'Gerência de manutenção ou gerente geral.',
  },
  Supermercado: {
    emoji: '🛒',
    dor: 'Monta-cargas e elevadores de carga param a reposição; esteiras e elevadores de cliente precisam estar seguros.',
    quem: 'Gerência de manutenção ou engenharia da rede.',
  },
  'Prédio comercial': {
    emoji: '🏢',
    dor: 'Empresas inquilinas reclamam com o condomínio quando o elevador para. Contratos de manutenção caros e pouco fiscalizados.',
    quem: 'Síndico profissional ou administração do prédio.',
  },
  'Administradora de condomínio': {
    emoji: '📋',
    dor: 'Cuida de dezenas de prédios e precisa dar segurança técnica aos síndicos. Uma parceria rende muitas indicações.',
    quem: 'Sócio ou gerente de carteira.',
  },
  'Condomínio residencial': {
    emoji: '🏠',
    dor: 'O síndico responde pela conservação das áreas comuns (Código Civil, art. 1.348). Quer prova de que cuidou do elevador.',
    quem: 'Síndico ou conselho.',
  },
  'Transporte / terminal': {
    emoji: '🚉',
    dor: 'Elevadores de acessibilidade em terminais e passarelas ficam meses parados. Pessoas com deficiência ficam sem acesso.',
    quem: 'Órgão gestor do terminal / secretaria responsável.',
  },
  'Centro de eventos / aeroporto': {
    emoji: '✈️',
    dor: 'Picos de público em eventos e voos. Elevador e escada rolante parados travam o fluxo e geram risco.',
    quem: 'Operações / manutenção do equipamento.',
  },
};

export const LOCAIS = [
  // ---------------- Hospitais
  { nome: 'Hospital Geral de Fortaleza (HGF)', tipo: 'Hospital / clínica', bairro: 'Papicu', endereco: 'Rua Ávila Goulart, 900 – Papicu', telefone: '(85) 3457-9157', fonte: 'https://www.ce.gov.br/hgf/wp-content/uploads/sites/26/2026/05/REVISTAHGF_v.2_n.1_2024_versaocompleta_pdf1.pdf' },
  { nome: 'Hospital Universitário Walter Cantídio (HUWC)', tipo: 'Hospital / clínica', bairro: 'Rodolfo Teófilo', endereco: 'Rua Pastor Samuel Munguba, 1290 – Rodolfo Teófilo', telefone: '(85) 3366-8167', fonte: 'https://www.gov.br/hubrasil/pt-br/hospitais-universitarios/regiao-nordeste/ch-ufc/acesso-a-informacao/programas-e-projetos/carta-ao-cidadao-do-huwc-e-da-meac/CartadeServiosaoCidadoHUWC2026.pdf' },
  { nome: 'Hospital Infantil Albert Sabin', tipo: 'Hospital / clínica', bairro: 'Vila União', endereco: 'Rua Tertuliano Sales, 544 – Vila União', telefone: '(85) 3101-4200', fonte: 'https://www.quintoandar.com.br/guias/?p=464071' },
  { nome: 'Hospital São Carlos (Rede D’Or)', tipo: 'Hospital / clínica', bairro: 'Dionísio Torres', endereco: 'Av. Pontes Vieira, 2531 – Dionísio Torres', telefone: null, fonte: 'https://www.rededorsaoluiz.com.br/hospital/sao-carlos/o-hospital' },
  { nome: 'Hospital Monte Klinikum', tipo: 'Hospital / clínica', bairro: 'Meireles', endereco: 'Rua República do Líbano, 747 – Meireles', telefone: '(85) 4012-0012', fonte: 'https://www.catalogo.med.br/medicos/em-fortaleza-ce/hospital-monte-klinikum-e7695.htm' },
  { nome: 'Hospital Unimed Fortaleza', tipo: 'Hospital / clínica', bairro: 'São João do Tauape', endereco: 'Av. Visconde do Rio Branco, 4000 – São João do Tauape', telefone: '(85) 3277-7000', fonte: 'https://www.quintoandar.com.br/guias/?p=464071' },
  { nome: 'Hospital Antônio Prudente', tipo: 'Hospital / clínica', bairro: 'Fátima', endereco: 'Av. Aguanambi, 1827 – Fátima', telefone: null, fonte: 'https://www.guiatelefone.com/empresas/fortaleza-ce/hospitais-e-laboratorios/hospitais' },
  { nome: 'Instituto Dr. José Frota (IJF Centro)', tipo: 'Hospital / clínica', bairro: 'Centro', endereco: 'Rua Senador Pompeu, 1757 – Centro', telefone: null, fonte: 'https://www.catalogo.med.br/medicos/em-fortaleza-ce/ijf-instituto-dr-jose-frota-central-e888864.htm' },
  { nome: 'Hospital Geral Dr. Waldemar de Alcântara (HGWA)', tipo: 'Hospital / clínica', bairro: 'Messejana', endereco: 'Rua Dr. Pergentino Maia, 1559 – Messejana', telefone: '(85) 3216-8300', fonte: 'https://www.quintoandar.com.br/guias/?p=464071' },

  // ---------------- Universidades e escolas
  { nome: 'Universidade de Fortaleza (Unifor)', tipo: 'Universidade / faculdade', bairro: 'Edson Queiroz', endereco: 'Av. Washington Soares, 1321 – Edson Queiroz', telefone: '(85) 3477-3000', fonte: 'https://unifor.br/fale-conosco' },
  { nome: 'Universidade Federal do Ceará (Reitoria)', tipo: 'Universidade / faculdade', bairro: 'Benfica', endereco: 'Av. da Universidade, 2853 – Benfica', telefone: '(85) 3366-7301', fonte: 'https://www.ufc.br' },
  { nome: 'Unichristus – Campus Dom Luís', tipo: 'Universidade / faculdade', bairro: 'Meireles', endereco: 'Av. Dom Luís, 911 – Meireles', telefone: '(85) 3265-8100', fonte: 'https://www.educamaisbrasil.com.br/unichristus/campus/campus-dom-luis' },
  { nome: 'Colégio Ari de Sá – Aldeota', tipo: 'Escola', bairro: 'Aldeota', endereco: 'Travessa Monsenhor Catão, 1655 – Aldeota', telefone: null, fonte: 'https://www.escol.as/300815-ari-de-sa-cavalcante-sede-aldeota-colegio' },
  { nome: 'Colégio Ari de Sá – Major Facundo', tipo: 'Escola', bairro: 'Centro', endereco: 'Av. Duque de Caxias, 550 – Centro', telefone: null, fonte: 'https://www.escol.as/303311-ari-de-sa-cavalcante-colegio-major-facundo' },
  { nome: 'Colégio Farias Brito – Aplicação', tipo: 'Escola', bairro: 'Varjota', endereco: 'Rua Castro Monte, 1364 – Varjota', telefone: null, fonte: 'https://www.escol.as/323151-farias-brito-colegio-de-aplicacao' },
  { nome: 'Colégio Farias Brito – Central', tipo: 'Escola', bairro: 'Fátima', endereco: 'Rua Padre Miguelinho, 1369 – Fátima', telefone: null, fonte: 'https://www.escol.as/320206-farias-brito-junior-central-colegio' },

  // ---------------- Shoppings, eventos, transporte
  { nome: 'Shopping Iguatemi Bosque', tipo: 'Shopping', bairro: 'Edson Queiroz', endereco: 'Av. Washington Soares, 85 – Edson Queiroz', telefone: '(85) 3477-3560', fonte: 'https://www.guiadasemana.com.br/fortaleza/compras/estabelecimento/shopping-iguatemi-fortaleza' },
  { nome: 'RioMar Fortaleza', tipo: 'Shopping', bairro: 'Papicu', endereco: 'Rua Des. Lauro Nogueira, 1500 – Papicu', telefone: '(85) 3066-2002', fonte: 'https://www.quintoandar.com.br/guias/?p=464405' },
  { nome: 'North Shopping Fortaleza', tipo: 'Shopping', bairro: 'Presidente Kennedy', endereco: 'Av. Bezerra de Menezes, 2450 – Presidente Kennedy', telefone: '(85) 3404-3000', fonte: 'https://www.quintoandar.com.br/guias/?p=464405' },
  { nome: 'Shopping Del Paseo', tipo: 'Shopping', bairro: 'Aldeota', endereco: 'Av. Santos Dumont, 3131 – Aldeota', telefone: '(85) 3456-5500', fonte: 'https://www.quintoandar.com.br/guias/?p=464405' },
  { nome: 'Centro de Eventos do Ceará', tipo: 'Centro de eventos / aeroporto', bairro: 'Edson Queiroz', endereco: 'Av. Washington Soares, 999 – Edson Queiroz', telefone: '(85) 3195-0332', fonte: 'https://www.buser.com.br/destinos/pontos-turisticos/ce/fortaleza/centro-de-eventos-do-ceara' },
  { nome: 'Aeroporto Internacional Pinto Martins', tipo: 'Centro de eventos / aeroporto', bairro: 'Serrinha', endereco: 'Av. Senador Carlos Jereissati, 3000 – Serrinha', telefone: '(85) 3392-1030', fonte: 'https://www.melhoresdestinos.com.br/aeroporto-fortaleza.html' },
  { nome: 'Passarela da Estação Fátima (BRT)', tipo: 'Transporte / terminal', bairro: 'Fátima', endereco: 'Av. Aguanambi – Fátima', telefone: null, fonte: 'https://www.opovo.com.br/noticias/fortaleza/2025/05/27/brt-elevadores-da-estacao-fatima-estao-quebrados-ha-um-ano-e-sem-previsao-de-reparos.html', observacao: 'Notícia: os 3 elevadores da passarela ficaram mais de um ano parados. Prospectar a Prefeitura (setor responsável pelo BRT).' },
  { nome: 'Terminal do Antônio Bezerra', tipo: 'Transporte / terminal', bairro: 'Antônio Bezerra', endereco: 'Terminal de ônibus do Antônio Bezerra', telefone: null, fonte: 'https://www.opovo.com.br/noticias/fortaleza/2026/07/30/sensacao-de-inseguranca-em-tunel-preocupa-mulheres-no-terminal-do-antonio-bezerra.html', observacao: 'Notícia (jul/2026): elevadores de acessibilidade falham com frequência.' },

  // ---------------- Órgãos públicos
  { nome: 'Assembleia Legislativa do Ceará', tipo: 'Órgão público', bairro: 'Dionísio Torres', endereco: 'Av. Desembargador Moreira, 2807 – Dionísio Torres', telefone: '(85) 3277-2500', fonte: 'https://www.al.ce.gov.br' },
  { nome: 'Câmara Municipal de Fortaleza', tipo: 'Órgão público', bairro: 'Luciano Cavalcante', endereco: 'Sede atual no Luciano Cavalcante (nova sede prevista no Centro)', telefone: null, fonte: 'https://diariodonordeste.verdesmares.com.br/pontopoder/nova-sede-da-camara-municipal-de-fortaleza-sera-no-antigo-mucuripe-club-1.3738630', observacao: 'Vai construir sede nova: oportunidade para consultoria na especificação e no recebimento dos elevadores.' },

  // ---------------- Hotéis
  { nome: 'Hotel Gran Marquise', tipo: 'Hotel', bairro: 'Mucuripe', endereco: 'Av. Beira Mar, 3980 – Mucuripe', telefone: '(85) 4006-5000', fonte: 'https://www.guiadasemana.com.br/fortaleza/turismo/estabelecimento/gran-marquise-hotel' },
  { nome: 'Seara Praia Hotel', tipo: 'Hotel', bairro: 'Meireles', endereco: 'Av. Beira Mar – Meireles (perto da Feirinha)', telefone: null, fonte: 'https://www.viajenaviagem.com/destino/fortaleza/onde-ficar-fortaleza' },

  // ---------------- Construtoras
  { nome: 'Mota Machado Construtora', tipo: 'Construtora', bairro: 'Meireles/Aldeota', endereco: 'Sede na Av. Dom Luís', telefone: null, fonte: 'https://diariodonordeste.verdesmares.com.br/opiniao/colunistas/egidio-serpa/mota-machado-abre-galeria-que-conta-sua-historia-1.3629623', observacao: 'Há reclamação pública de cliente sobre elevadores entregues. Argumento: vistoria antes da entrega.' },
  { nome: 'Construtora Montenegro', tipo: 'Construtora', bairro: 'Meireles', endereco: 'Rua Barão de Aracati, 727 – Meireles', telefone: null, fonte: 'https://www.telelistas.net/ce/fortaleza/construtoras' },
  { nome: 'Supra Construções', tipo: 'Construtora', bairro: 'Aldeota', endereco: 'Av. Santos Dumont, 3465 – Aldeota', telefone: null, fonte: 'https://www.telelistas.net/ce/fortaleza/construtoras' },
  { nome: 'Trya Construtora', tipo: 'Construtora', bairro: 'Meireles', endereco: 'Av. Dom Luís, 906, sala 702 – Meireles', telefone: '(85) 99201-5524', fonte: 'https://www.benditoguia.com.br/empresa/trya-construtora-aldeota-fortaleza-ce' },
  { nome: 'Siec', tipo: 'Construtora', bairro: 'Papicu', endereco: 'Rua Joaquim Lima, 570 – Papicu', telefone: null, fonte: 'https://paginaamarela.com.br/empresa/siec/fortaleza/ce/11160732' },

  // ---------------- Supermercados e administradoras
  { nome: 'Mercadinhos São Luiz (rede)', tipo: 'Supermercado', bairro: 'Cidade dos Funcionários', endereco: 'Rua Oliveira Paiva, 170 – Cidade dos Funcionários (endereço da empresa)', telefone: null, fonte: 'https://www.reclameaqui.com.br/empresa/mercadinhos-sao-luiz/sobre/', observacao: 'Rede com mais de 20 lojas: uma conversa com a engenharia vale por várias unidades.' },
  { nome: 'Fiducial Imobiliária (administra condomínios)', tipo: 'Administradora de condomínio', bairro: 'Centro', endereco: 'Rua Costa Barros, 915 – Centro', telefone: null, fonte: 'https://www.telelistas.net/locais/ce/fortaleza/administracao+de+bens+e+imoveis/bu-1980437/fiducial+imobiliaria+em+centro' },
  { nome: 'ADCONCE (associação das administradoras)', tipo: 'Administradora de condomínio', bairro: '—', endereco: 'Associação das Administradoras de Condomínios do Ceará', telefone: null, fonte: 'https://www.opovo.com.br/noticias/especialpublicitario/expomarketing/2026/06/01/adconce-leva-representatividade-e-forca-associativa-ao-expomarket-condominios-2026.html', observacao: 'Peça a lista de associadas ou proponha uma palestra sobre segurança de elevadores.' },
];

export function linkMapa(local) {
  const q = `${local.nome}, ${local.endereco}, Fortaleza - CE`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
