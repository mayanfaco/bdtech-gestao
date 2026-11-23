// Playbook resumido: como usar cada funil e a melhor forma de vender.

export const PLAYBOOK = [
  {
    key: 'rotina',
    titulo: 'Sua rotina de todo dia',
    emoji: '☀️',
    resumo: '30 minutos por dia, sempre na mesma ordem.',
    passos: [
      'Abra Funis → Follow-up e mande as mensagens de HOJE (as vermelhas primeiro).',
      'Vá em Prospecção e mande a primeira mensagem para 5 contatos novos.',
      'Responda quem respondeu. Objetivo: marcar uma visita.',
      'Em Vendas, veja as propostas paradas e use o script "Depois da proposta".',
      'No fim, olhe o Meu Lar: cada cliente fechado aparece lá.',
    ],
    regra: 'Constância vence talento: 5 mensagens novas por dia são 100 contatos por mês.',
  },
  {
    key: 'prospeccao',
    titulo: 'Funil de Prospecção',
    emoji: '🎯',
    resumo: 'Achar quem tem elevador e começar a conversa.',
    passos: [
      'Cadastre o contato: nome, local e WhatsApp. Só isso.',
      'Clique em "Mandar mensagem": o WhatsApp abre com o texto pronto.',
      'Depois de enviar, clique "Já mandei". O cartão vai para "Mensagem enviada".',
      'Se a pessoa responder, clique "Respondeu". Se não, o sistema leva para o Follow-up sozinho no dia seguinte.',
      'Marcou visita? Clique "Marcou visita". Depois da visita, "Fazer proposta".',
    ],
    regra: 'Não espere resposta para seguir: o sistema cobra por você.',
  },
  {
    key: 'followup',
    titulo: 'Funil de Follow-up',
    emoji: '🔁',
    resumo: 'Insistir com educação até ter um sim ou um não.',
    passos: [
      'São 6 toques: dia 1, 2, 4, 7, 10 e uma despedida no dia 14.',
      'A lista "Para hoje" mostra só quem precisa de mensagem hoje.',
      'Clique em "Mandar toque": o texto certo do dia já vem pronto.',
      'Respondeu? Clique "Respondeu" e o cartão volta para a conversa.',
      'Sem resposta no último toque, o contato descansa 60 dias e volta sozinho.',
    ],
    regra: 'A maioria das vendas acontece depois do 3º contato. Quem desiste no 1º perde a venda.',
  },
  {
    key: 'vendas',
    titulo: 'Funil de Vendas',
    emoji: '🤝',
    resumo: 'Da proposta até o contrato assinado.',
    passos: [
      'Toda proposta que você cria aparece aqui sozinha.',
      'Arraste o cartão (ou use os botões) quando a proposta andar.',
      'Proposta parada 2 dias entra no Follow-up automaticamente.',
      'Fechou? Clique "Fechou!". A família comemora no Meu Lar.',
      'Não fechou? Anote o motivo. Isso ensina para a próxima.',
    ],
    regra: 'Proposta sem data de retorno é proposta esquecida. Sempre combine o próximo passo.',
  },
  {
    key: 'visita',
    titulo: 'Como conduzir a visita',
    emoji: '🏢',
    resumo: 'Ouvir mais, falar menos, mostrar o problema.',
    passos: [
      'Pergunte: "Qual foi a última vez que o elevador parou?"',
      'Peça para ver o contrato de manutenção e o último relatório.',
      'Mostre 1 ou 2 pontos de atenção reais. Fotos ajudam.',
      'Explique os dois modelos: vistoria única ou acompanhamento contínuo.',
      'Combine a data em que você manda a proposta, antes de ir embora.',
    ],
    regra: 'Quem mostra o problema não precisa convencer: o cliente se convence sozinho.',
  },
];
