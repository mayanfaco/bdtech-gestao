// Scripts prontos para copiar e colar (WhatsApp). {nome}, {local} e {seu_nome}
// são trocados automaticamente quando o script é usado a partir de um cartão.
// Regra de escrita: mensagens curtas, uma ideia por mensagem, sempre terminando
// com uma pergunta fácil de responder.

export const SCRIPT_GRUPOS = [
  {
    key: 'abordagem',
    titulo: 'Primeira mensagem',
    quando: 'Use no primeiro contato, de acordo com o tipo de local.',
    scripts: [
      {
        id: 'abord-condominio', titulo: 'Síndico de condomínio',
        texto: 'Olá, {nome}! Aqui é o {seu_nome}, engenheiro da BDTECH, consultoria técnica em elevadores aqui de Fortaleza. Ajudo síndicos a saberem se a manutenção dos elevadores está sendo bem feita e se o prédio está em dia com as normas. Posso te fazer uma pergunta rápida sobre os elevadores do {local}?',
      },
      {
        id: 'abord-administradora', titulo: 'Administradora de condomínios',
        texto: 'Olá, {nome}! Sou o {seu_nome}, da BDTECH Engenharia. Fazemos vistoria técnica, RIA com ART e acompanhamento de elevadores, de forma independente da empresa de manutenção. Muitos síndicos pedem isso e não sabem a quem recorrer. Vocês teriam interesse em uma parceria para indicar aos condomínios da carteira?',
      },
      {
        id: 'abord-hospital', titulo: 'Hospital ou clínica',
        texto: 'Olá, {nome}! Aqui é o {seu_nome}, engenheiro da BDTECH. Em hospital, elevador parado não é só incômodo: atrasa maca, exame e cirurgia. Fazemos uma avaliação técnica independente dos elevadores e da manutenção, com laudo e ART. Quem cuida da manutenção predial do {local}, por favor?',
      },
      {
        id: 'abord-escola', titulo: 'Escola ou universidade',
        texto: 'Olá, {nome}! Sou o {seu_nome}, da BDTECH Engenharia. Ajudamos instituições de ensino a manter os elevadores seguros e acessíveis para alunos com deficiência, como pede a Lei Brasileira de Inclusão. Fazemos vistoria, laudo com ART e plano de melhorias. Com quem eu poderia falar sobre a infraestrutura do {local}?',
      },
      {
        id: 'abord-comercial', titulo: 'Prédio comercial ou shopping',
        texto: 'Olá, {nome}! Aqui é o {seu_nome}, da BDTECH. Em prédio com muito movimento, elevador parado vira reclamação de cliente na hora. Fazemos consultoria técnica independente: conferimos se a manutenção contratada está sendo cumprida e se os equipamentos estão dentro das normas. Posso te mandar como funciona?',
      },
      {
        id: 'abord-construtora', titulo: 'Construtora',
        texto: 'Olá, {nome}! Sou o {seu_nome}, engenheiro da BDTECH. Fazemos a vistoria técnica dos elevadores antes da entrega do empreendimento, com laudo e ART, para evitar reclamação de morador e chamado de garantia depois. Vocês têm alguma obra com entrega prevista para os próximos meses?',
      },
      {
        id: 'abord-publico', titulo: 'Órgão público',
        texto: 'Bom dia, {nome}! Aqui é o {seu_nome}, da BDTECH Engenharia e Consultoria. Prestamos apoio técnico na fiscalização de contratos de manutenção de elevadores, com vistoria, relatório e ART. Ajuda o fiscal do contrato a comprovar se o serviço pago está sendo entregue. Qual o setor responsável pela manutenção predial?',
      },
      {
        id: 'abord-hotel', titulo: 'Hotel',
        texto: 'Olá, {nome}! Sou o {seu_nome}, da BDTECH. Hóspede preso no elevador vira avaliação ruim no mesmo dia. Fazemos avaliação técnica independente dos elevadores e da empresa de manutenção, com laudo e ART. Posso falar com quem cuida da manutenção do {local}?',
      },
    ],
  },
  {
    key: 'followup',
    titulo: 'Follow-up (sem resposta)',
    quando: 'Um script para cada toque. O sistema já mostra o certo no dia certo.',
    scripts: [
      { id: 'fu-1', passo: 1, titulo: '1º toque — dia 1', texto: 'Oi, {nome}! Só passando para saber se conseguiu ver minha mensagem de ontem. 🙂' },
      { id: 'fu-2', passo: 2, titulo: '2º toque — dia 2', texto: '{nome}, um dado rápido: a maioria dos problemas que encontramos em vistoria não aparece no dia a dia, só quando o elevador para. Uma avaliação independente mostra isso antes. Faz sentido para o {local}?' },
      { id: 'fu-3', passo: 3, titulo: '3º toque — dia 4', texto: 'Oi, {nome}! Semana passada, numa vistoria, encontramos itens de segurança que a manutenção não tinha registrado. O síndico corrigiu tudo antes de virar problema. Posso fazer o mesmo pelo {local}?' },
      { id: 'fu-4', passo: 4, titulo: '4º toque — dia 7', texto: '{nome}, que tal uma conversa de 15 minutos, sem compromisso? Eu explico o que olhar no contrato de manutenção que vocês já têm. Melhor para você amanhã ou depois de amanhã?' },
      { id: 'fu-5', passo: 5, titulo: '5º toque — dia 10', texto: '{nome}, pergunta direta para eu não te incomodar: a segurança dos elevadores é um assunto para agora ou para mais à frente?' },
      { id: 'fu-6', passo: 6, titulo: 'Despedida — dia 14', texto: '{nome}, vou parar de te mandar mensagem por aqui para não incomodar. Se um dia precisar de uma opinião técnica sobre os elevadores, é só me chamar. Fico à disposição! — {seu_nome}, BDTECH' },
    ],
  },
  {
    key: 'proposta',
    titulo: 'Depois da proposta',
    quando: 'Proposta enviada e o cliente sumiu.',
    scripts: [
      { id: 'pr-1', passo: 1, titulo: 'Confirmar recebimento', texto: 'Oi, {nome}! Conseguiu abrir a proposta do {local}? Se quiser, explico os dois modelos em 5 minutos por ligação.' },
      { id: 'pr-2', passo: 2, titulo: 'Tirar dúvida', texto: '{nome}, ficou alguma dúvida sobre a proposta? Muita gente pergunta a diferença entre a vistoria única e o acompanhamento contínuo. Posso te explicar?' },
      { id: 'pr-3', passo: 3, titulo: 'Assembleia / aprovação', texto: '{nome}, a proposta precisa passar por assembleia ou pelo conselho? Se ajudar, preparo um resumo de uma página para apresentar.' },
      { id: 'pr-4', passo: 4, titulo: 'Facilitar o sim', texto: '{nome}, para facilitar, consigo começar pela vistoria única e, se gostarem do trabalho, seguimos com o acompanhamento. Assim o risco é zero. Pode ser?' },
      { id: 'pr-5', passo: 5, titulo: 'Prazo', texto: '{nome}, minha agenda de vistorias para este mês está fechando. Quer que eu reserve uma data para o {local}?' },
      { id: 'pr-6', passo: 6, titulo: 'Despedida', texto: '{nome}, vou deixar a proposta em aberto e parar de insistir. Quando for o momento, me chama que eu atualizo os valores. Obrigado pela atenção!' },
    ],
  },
  {
    key: 'objecoes',
    titulo: 'Respostas para objeções',
    quando: 'Quando o cliente diz "não" ou "depois".',
    scripts: [
      { id: 'ob-caro', titulo: '"Está caro"', texto: 'Entendo, {nome}. Só para comparar: uma peça trocada sem necessidade ou um contrato de manutenção mal cumprido costuma custar mais do que a consultoria. Nosso papel é justamente evitar esse gasto. Quer que eu mostre um exemplo?' },
      { id: 'ob-manutencao', titulo: '"Já temos empresa de manutenção"', texto: 'Ótimo, {nome}, é obrigatório ter! Nós não substituímos a manutenção: conferimos se ela está sendo bem feita. É como um auditor independente, que defende o lado do {local}.' },
      { id: 'ob-depois', titulo: '"Agora não, depois"', texto: 'Sem problema, {nome}. Posso te procurar daqui a 30 dias? Enquanto isso, se o elevador apresentar qualquer barulho ou parada, me chama que te oriento sem custo.' },
      { id: 'ob-assembleia', titulo: '"Preciso levar para assembleia"', texto: 'Perfeito, {nome}. Te mando um resumo de uma página com o que é, quanto custa e por que vale a pena. Quando é a próxima assembleia?' },
      { id: 'ob-nunca-deu-problema', titulo: '"Nunca deu problema"', texto: 'Que bom, {nome}! A ideia é continuar assim. Muitas falhas de segurança não aparecem no uso normal. A vistoria serve justamente para encontrar antes que apareçam.' },
    ],
  },
  {
    key: 'relacionamento',
    titulo: 'Visita, fechamento e indicação',
    quando: 'Para confirmar visita, agradecer e pedir indicação.',
    scripts: [
      { id: 're-retomar', titulo: 'Retomar o que foi combinado', texto: 'Olá, {nome}! Tudo bem? Aqui é o {seu_nome}, da BDTECH. Combinamos de voltar a conversar agora sobre os elevadores do {local}. Esse ainda é um bom momento?' },
      { id: 're-confirmar', titulo: 'Confirmar visita', texto: 'Bom dia, {nome}! Confirmando nossa visita ao {local}. Estarei aí no horário combinado. Precisa que eu leve algum documento?' },
      { id: 're-obrigado', titulo: 'Agradecer o fechamento', texto: '{nome}, muito obrigado pela confiança! Vou cuidar dos elevadores do {local} como se fossem da minha casa. Qualquer coisa, pode me chamar direto aqui.' },
      { id: 're-indicacao', titulo: 'Pedir indicação', texto: '{nome}, fico feliz que esteja gostando do trabalho! Você conhece outro síndico ou gestor que também se preocupa com os elevadores? Uma indicação sua vale muito para mim.' },
      { id: 're-pos-venda', titulo: 'Pós-venda (30 dias)', texto: 'Oi, {nome}! Passando para saber se as melhorias que indicamos no {local} estão andando. Precisa de alguma ajuda com a empresa de manutenção?' },
    ],
  },
];

export const SCRIPT_RETOMAR = () => SCRIPT_GRUPOS.find((g) => g.key === 'relacionamento').scripts.find((x) => x.id === 're-retomar');

/** Script do toque N para lead (follow-up) ou para proposta. */
export function scriptDoToque(passo, tipo = 'lead') {
  const grupo = SCRIPT_GRUPOS.find((g) => g.key === (tipo === 'proposta' ? 'proposta' : 'followup'));
  return grupo.scripts.find((s) => s.passo === passo) ?? grupo.scripts[grupo.scripts.length - 1];
}

/** Melhor script de abordagem para o tipo de local do contato. */
export function scriptDeAbordagem(tipoLocal = '') {
  const t = tipoLocal.toLowerCase();
  const mapa = [
    ['hospital', 'abord-hospital'], ['clínica', 'abord-hospital'],
    ['escola', 'abord-escola'], ['universidade', 'abord-escola'], ['faculdade', 'abord-escola'],
    ['comercial', 'abord-comercial'], ['shopping', 'abord-comercial'], ['supermercado', 'abord-comercial'],
    ['construtora', 'abord-construtora'], ['público', 'abord-publico'], ['hotel', 'abord-hotel'],
    ['administradora', 'abord-administradora'],
  ];
  const id = mapa.find(([k]) => t.includes(k))?.[1] ?? 'abord-condominio';
  return SCRIPT_GRUPOS[0].scripts.find((s) => s.id === id);
}
