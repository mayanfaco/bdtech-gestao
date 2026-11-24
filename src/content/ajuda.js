// Central de ajuda SEM inteligência artificial: respostas escritas à mão e uma
// busca simples por palavras (com sinônimos e sem acento). Cada resposta tem
// um botão que leva direto para a tela certa.
import { normalizar } from '../lib/funis.js';

export const AJUDA = [
  { id: 'cadastrar-contato', pergunta: 'Como cadastro um contato novo para prospectar?', palavras: 'cadastrar novo contato lead pessoa sindico adicionar incluir prospectar prospeccao criar', resposta: 'Vá em Funis → Prospecção e clique no botão azul "Novo contato". Preencha nome, local e WhatsApp e clique em Salvar.', rota: '/funis/prospeccao?novo=1', botao: 'Cadastrar agora' },
  { id: 'mandar-mensagem', pergunta: 'Como mando a primeira mensagem?', palavras: 'mandar enviar mensagem whatsapp zap primeira abordar abordagem falar', resposta: 'No cartão do contato, clique em "Mandar mensagem". O WhatsApp abre com o texto pronto. Envie e depois clique em "Já mandei".', rota: '/funis/prospeccao', botao: 'Abrir a Prospecção' },
  { id: 'quem-mandei', pergunta: 'Quero ver os clientes para quem eu já mandei mensagem', palavras: 'clientes mandei mensagem enviada enviei aguardando acompanhar ja contatei', resposta: 'Eles ficam na coluna "Mensagem enviada" da Prospecção. Se não responderem, vão sozinhos para o Follow-up.', rota: '/funis/prospeccao', botao: 'Ver mensagens enviadas' },
  { id: 'followup-hoje', pergunta: 'Quem eu preciso cobrar hoje?', palavras: 'hoje cobrar follow followup insistir retorno lembrar lista dia mensagens pendentes atrasado', resposta: 'Abra Funis → Follow-up. A lista "Para hoje" mostra só quem precisa de mensagem hoje. Os vermelhos estão atrasados.', rota: '/funis/followup', botao: 'Ver a lista de hoje' },
  { id: 'como-funciona-followup', pergunta: 'Como funciona o follow-up automático?', palavras: 'follow followup automatico automacao como funciona cadencia dias toque sozinho nao respondeu', resposta: 'Mandou a mensagem e a pessoa não respondeu? No dia seguinte o sistema leva o contato para o Follow-up. Ele cobra você nos dias 1, 2, 4, 7, 10 e 14, sempre com o texto certo.', rota: '/guia?aba=playbook', botao: 'Ver o passo a passo' },
  { id: 'respondeu', pergunta: 'O cliente respondeu. O que eu faço?', palavras: 'respondeu resposta retornou cliente falou conversa', resposta: 'Abra o cartão e clique em "Respondeu". Ele sai do follow-up e vai para a conversa. O próximo passo é marcar uma visita.', rota: '/funis/prospeccao', botao: 'Ir para a Prospecção' },
  { id: 'marcar-visita', pergunta: 'Como marco uma visita ou reunião?', palavras: 'marcar visita reuniao agendar vistoria encontro agenda calendario', resposta: 'No cartão, clique em "Marcou visita" e escolha a data. A visita também pode ir para o Calendário.', rota: '/calendario/novo', botao: 'Abrir o calendário' },
  { id: 'fazer-proposta', pergunta: 'Como faço uma proposta?', palavras: 'fazer criar proposta orcamento valor preco nova', resposta: 'No cartão de quem teve visita, clique em "Fazer proposta". Ou vá em Propostas → Nova proposta.', rota: '/propostas/nova', botao: 'Nova proposta' },
  { id: 'propostas-andamento', pergunta: 'Quero acompanhar minhas propostas', palavras: 'acompanhar propostas andamento negociacao vendas funil enviadas', resposta: 'O Funil de Vendas mostra todas as propostas em colunas: Montando, Enviada, Negociando e Fechou.', rota: '/funis/vendas', botao: 'Abrir o Funil de Vendas' },
  { id: 'fechou', pergunta: 'Fechei um cliente! Onde eu marco?', palavras: 'fechei fechou ganhei vendi aprovou aprovada contrato cliente novo sim', resposta: 'No Funil de Vendas, clique em "Fechou!" no cartão da proposta. A família comemora no Meu Lar.', rota: '/funis/vendas', botao: 'Marcar como fechado' },
  { id: 'nao-fechou', pergunta: 'O cliente não quis. E agora?', palavras: 'nao quis recusou perdi desistiu nao fechou sem interesse', resposta: 'Clique em "Não fechou" (vendas) ou "Sem interesse" (prospecção) e anote o motivo. Isso ajuda a melhorar.', rota: '/funis/vendas', botao: 'Abrir Vendas' },
  { id: 'meus-clientes', pergunta: 'Quero ver os clientes que eu já tenho', palavras: 'meus clientes que ja tenho carteira lista cadastro empreendimentos condominios', resposta: 'Todos os clientes ficam no menu Clientes. Lá você vê contatos, propostas e contratos de cada um.', rota: '/clientes', botao: 'Ver meus clientes' },
  { id: 'contratos', pergunta: 'Onde ficam os contratos?', palavras: 'contrato contratos assinado vencimento renovar renovacao', resposta: 'No menu Contratos. O sistema avisa quando um contrato está perto de vencer.', rota: '/contratos', botao: 'Ver contratos' },
  { id: 'scripts', pergunta: 'Onde estão as mensagens prontas (scripts)?', palavras: 'script scripts mensagem pronta texto modelo copiar colar o que falar escrever', resposta: 'No Guia de Vendas, aba Scripts. Clique em "Copiar" e cole no WhatsApp.', rota: '/guia?aba=scripts', botao: 'Ver os scripts' },
  { id: 'objecao', pergunta: 'O cliente disse que está caro. O que respondo?', palavras: 'caro preco objecao ja tenho manutencao depois assembleia resposta argumento', resposta: 'O Guia de Vendas tem respostas prontas para "está caro", "já tenho manutenção", "depois" e outras.', rota: '/guia?aba=scripts', botao: 'Ver respostas' },
  { id: 'onde-prospectar', pergunta: 'Onde eu acho novos clientes?', palavras: 'onde achar encontrar novos clientes lugares lista sugestoes prospectar hospital escola shopping', resposta: 'A tela Onde Prospectar tem uma lista de locais em Fortaleza com endereço, telefone e o problema de cada um.', rota: '/onde-prospectar', botao: 'Ver sugestões' },
  { id: 'playbook', pergunta: 'Qual a melhor forma de usar os funis?', palavras: 'playbook como usar melhor forma rotina passo a passo metodo guia', resposta: 'O Playbook mostra sua rotina de 30 minutos por dia e o passo a passo de cada funil.', rota: '/guia?aba=playbook', botao: 'Abrir o Playbook' },
  { id: 'dicas', pergunta: 'Quero dicas para vender mais', palavras: 'dicas vender mais argumentos normas lei mercado elevador', resposta: 'O Guia de Vendas tem uma aba de Dicas com argumentos, normas e boas práticas no WhatsApp.', rota: '/guia?aba=dicas', botao: 'Ver dicas' },
  { id: 'mudar-visualizacao', pergunta: 'Como vejo em gráfico ou pizza?', palavras: 'grafico pizza barras visualizacao ver quadro lista mudar trocar', resposta: 'Em cada funil, use os botões "Quadro", "Lista", "Barras" e "Pizza" no alto da tela.', rota: '/funis/prospeccao', botao: 'Abrir os funis' },
  { id: 'mover-cartao', pergunta: 'Como mudo um cartão de coluna?', palavras: 'mover arrastar cartao coluna etapa mudar passar avancar', resposta: 'Use os botões do próprio cartão (ex.: "Respondeu"). Se preferir, segure e arraste o cartão para outra coluna.', rota: '/funis/prospeccao', botao: 'Abrir a Prospecção' },
  { id: 'meu-lar', pergunta: 'O que é o Meu Lar?', palavras: 'meu lar familia casa gatos esposa filhos objetivo desenho', resposta: 'É o desenho da sua família. A cada cliente fechado, a casa ganha algo novo. É para lembrar por quem você faz tudo isso.', rota: '/meu-lar', botao: 'Ver o Meu Lar' },
  { id: 'tutorial', pergunta: 'Quero aprender a usar o sistema do começo', palavras: 'tutorial aprender ensinar comecar inicio treinamento curso como usa', resposta: 'O Tutorial ensina passo a passo, com exercícios. Cada fase libera uma parte do sistema.', rota: '/tutorial', botao: 'Começar o tutorial' },
  { id: 'bloqueado', pergunta: 'Por que uma parte está com cadeado?', palavras: 'cadeado bloqueado trancado nao abre liberar desbloquear', resposta: 'Ela libera quando você termina a fase dela no Tutorial. É rápido!', rota: '/tutorial', botao: 'Ir para o tutorial' },
  { id: 'tarefas', pergunta: 'Onde vejo minhas tarefas?', palavras: 'tarefas afazeres pendencias lembrete fazer', resposta: 'No menu Tarefas. O sistema também cria tarefas sozinho, por exemplo depois de enviar uma proposta.', rota: '/tarefas', botao: 'Ver tarefas' },
  { id: 'avisos', pergunta: 'Onde vejo os avisos do sistema?', palavras: 'avisos notificacoes sininho alertas', resposta: 'Clique no sininho no alto da tela. Todo dia aparece um aviso com os follow-ups de hoje.', rota: '/notificacoes', botao: 'Ver avisos' },
  { id: 'mudar-dias', pergunta: 'Quero mudar os dias do follow-up', palavras: 'mudar dias prazo cadencia configurar automacao tempo', resposta: 'Em Configurações → Automações você muda os dias de cada toque.', rota: '/configuracoes/automacoes', botao: 'Abrir Automações' },
  { id: 'retomar-depois', pergunta: 'O cliente pediu para falar só mês que vem ou ano que vem', palavras: 'depois proximo ano mes que vem adiar retomar mais tarde lembrar data combinado guardar agendar', resposta: 'Em qualquer cartão dos funis, clique em "⏰ Retomar depois" e escolha quando (1 mês, 3 meses, 6 meses, próximo ano ou uma data). O cartão sai da frente e volta sozinho, destacado em amarelo, no dia combinado.', rota: '/funis/vendas', botao: 'Abrir os funis' },
  { id: 'geladeira', pergunta: 'O que é a "geladeira"?', palavras: 'geladeira congelado descansando 60 dias voltar depois', resposta: 'Quem não respondeu nenhum dos 6 toques descansa 60 dias. Depois o sistema devolve para a prospecção para uma nova tentativa.', rota: '/funis/prospeccao', botao: 'Abrir a Prospecção' },
];

const SINONIMOS = {
  zap: 'whatsapp', wpp: 'whatsapp', whats: 'whatsapp', zapzap: 'whatsapp',
  orcamento: 'proposta', orcamentos: 'proposta', propostas: 'proposta',
  sindicos: 'sindico', clientes: 'cliente', contatos: 'contato', leads: 'lead',
  reuniao: 'visita', reunioes: 'visita', visitas: 'visita',
  cobrar: 'followup', insistir: 'followup', 'follow-up': 'followup', follow: 'followup',
  vendi: 'fechei', ganhei: 'fechei', fechar: 'fechei', fechado: 'fechou',
  grafico: 'grafico', graficos: 'grafico', pizza: 'pizza',
  mensagens: 'mensagem', msg: 'mensagem', texto: 'mensagem',
};

const PARADAS = new Set(['a', 'o', 'e', 'de', 'da', 'do', 'das', 'dos', 'que', 'eu', 'um', 'uma', 'para', 'pra', 'com', 'no', 'na', 'em', 'os', 'as', 'se', 'meu', 'minha', 'como', 'quero', 'preciso', 'ajuda', 'onde', 'qual', 'ver', 'ja']);

function tokens(texto) {
  return normalizar(texto).split(/[^a-z0-9-]+/).filter((t) => t && !PARADAS.has(t)).map((t) => SINONIMOS[t] ?? t);
}

/** Retorna as respostas mais parecidas com o que foi digitado. */
export function buscarAjuda(consulta, limite = 3) {
  const q = tokens(consulta);
  if (!q.length) return [];
  return AJUDA
    .map((item) => {
      const base = new Set(tokens(`${item.pergunta} ${item.palavras}`));
      let pontos = 0;
      q.forEach((t) => {
        if (base.has(t)) pontos += 2;
        else if (t.length >= 4 && [...base].some((b) => b.startsWith(t.slice(0, 4)))) pontos += 1;
      });
      return { item, pontos };
    })
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, limite)
    .map((r) => r.item);
}

export const AJUDA_RAPIDA = ['followup-hoje', 'cadastrar-contato', 'quem-mandei', 'retomar-depois', 'fechou', 'scripts'];
