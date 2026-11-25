// Conteúdo das fases do tutorial. Cada fase tem passos:
//  - licao: só leitura
//  - quiz: perguntas de múltipla escolha
//  - exercicio: uma pequena simulação; validar(estado) devolve a lista de erros
// Nada aqui mexe nos dados reais: tudo é treino.
import React from 'react';

const ordemDias = [1, 2, 4, 7, 10, 14];

export const CONTEUDO = {
  boas_vindas: [
    {
      tipo: 'licao', emoji: '👋', titulo: 'Bem-vindo ao seu sistema de vendas',
      texto: [
        'Aqui você vai encontrar clientes, conversar com eles e fechar contratos — com o sistema lembrando tudo por você.',
        'São 3 funis, um em cada aba: Prospecção (começar conversas), Follow-up (cobrar quem não respondeu) e Vendas (das propostas ao contrato).',
        'Perdido? Clique no botão "Ajuda", no canto de baixo da tela, e escreva o que quer fazer.',
        'Cada fase deste tutorial libera uma parte do sistema. Se errar, o sistema mostra onde e você tenta de novo.',
      ],
    },
    {
      tipo: 'quiz', titulo: 'Vamos ver se ficou claro',
      perguntas: [
        { p: 'Ficou com dúvida em alguma tela. O que você faz?', opcoes: ['Desligo o computador', 'Clico no botão "Ajuda" no canto da tela', 'Apago o cadastro'], certa: 1, explica: 'O botão "Ajuda" fica sempre no canto de baixo da tela e leva você direto para onde precisa.' },
        { p: 'Para que serve o Follow-up?', opcoes: ['Cobrar com educação quem não respondeu', 'Guardar contratos', 'Mudar a senha'], certa: 0, explica: 'Follow-up é a cobrança organizada: o sistema mostra quem precisa de mensagem a cada dia.' },
        { p: 'Onde ficam as mensagens prontas para copiar?', opcoes: ['Em Contratos', 'No Guia de Vendas, aba Scripts', 'No Calendário'], certa: 1, explica: 'O Guia de Vendas tem Playbook, Scripts e Dicas.' },
      ],
    },
  ],

  prospeccao: [
    {
      tipo: 'licao', emoji: '🎯', titulo: 'Prospecção em 4 colunas',
      texto: [
        '1. Para abordar — contatos novos.  2. Mensagem enviada — esperando resposta.  3. Respondeu — conversando.  4. Visita marcada.',
        'Para cadastrar, basta: nome da pessoa, nome do local e WhatsApp.',
        'O botão verde "Mandar mensagem" abre o WhatsApp com o texto pronto. Depois de enviar, clique "Já mandei".',
        'O mais importante: se a pessoa não responder, você NÃO precisa lembrar. No dia seguinte o sistema leva o contato para o Follow-up.',
      ],
    },
    {
      tipo: 'exercicio', titulo: 'Treino: cadastre um contato',
      instrucao: 'Preencha como se fosse um contato de verdade. É só treino, nada será salvo.',
      inicial: { nome: '', local: '', zap: '' },
      validar: (s) => {
        const e = [];
        if (!s.nome.trim()) e.push('Faltou o nome da pessoa. Ex.: "Sr. Paulo – síndico".');
        if (!s.local.trim()) e.push('Faltou o nome do local. Ex.: "Edifício Aurora".');
        const d = s.zap.replace(/\D/g, '');
        if (!d) e.push('Faltou o WhatsApp. Sem ele o botão de mensagem não funciona direito.');
        else if (d.length < 10) e.push('O WhatsApp está incompleto: use DDD + número, como 85 99999-9999.');
        return e;
      },
      render: (s, set) => (
        <div className="fx-stack" style={{ gap: 12, maxWidth: 440 }}>
          <div className="fx-campo"><label htmlFor="t-nome">Nome da pessoa</label><input id="t-nome" value={s.nome} onChange={(e) => set({ ...s, nome: e.target.value })} /></div>
          <div className="fx-campo"><label htmlFor="t-local">Nome do local</label><input id="t-local" value={s.local} onChange={(e) => set({ ...s, local: e.target.value })} /></div>
          <div className="fx-campo"><label htmlFor="t-zap">WhatsApp</label><input id="t-zap" inputMode="tel" value={s.zap} onChange={(e) => set({ ...s, zap: e.target.value })} placeholder="85 99999-9999" /></div>
        </div>
      ),
    },
    {
      tipo: 'exercicio', titulo: 'Treino: qual botão apertar?',
      instrucao: 'Você acabou de enviar a primeira mensagem para o Edifício Aurora pelo WhatsApp. Clique no botão certo do cartão.',
      inicial: { escolha: null },
      validar: (s) => {
        if (s.escolha === null) return ['Clique em um dos botões do cartão.'];
        if (s.escolha === 'ja') return [];
        if (s.escolha === 'respondeu') return ['"Respondeu" é só quando a pessoa escreveu de volta. Você só enviou: ainda não houve resposta.'];
        return ['"Sem interesse" é para quando a pessoa disse que não quer. Ela ainda nem respondeu!'];
      },
      render: (s, set) => (
        <div className="fx-card" style={{ maxWidth: 360 }}>
          <div className="fx-card__nome" style={{ cursor: 'default' }}>Edifício Aurora</div>
          <div className="fx-card__sub">Sr. Paulo · Condomínio residencial</div>
          <div className="fx-card__acoes">
            {[['respondeu', '🙋 Respondeu'], ['ja', '✓ Já mandei'], ['sem', 'Sem interesse']].map(([k, rot]) => (
              <button key={k} type="button" className={`fx-btn ${s.escolha === k ? 'fx-btn--primario' : 'fx-btn--claro'}`} onClick={() => set({ escolha: k })}>{rot}</button>
            ))}
          </div>
        </div>
      ),
    },
    {
      tipo: 'quiz', titulo: 'Confira o que aprendeu',
      perguntas: [
        { p: 'Mandei mensagem e a pessoa não respondeu. O que acontece?', opcoes: ['Fica parado para sempre', 'O sistema leva para o Follow-up sozinho', 'O contato é apagado'], certa: 1, explica: 'Sem resposta, o contato vai sozinho para o Follow-up no dia seguinte.' },
        { p: 'A pessoa respondeu e quer conversar. Qual o próximo objetivo?', opcoes: ['Marcar uma visita', 'Mandar o contrato direto', 'Esperar ela ligar'], certa: 0, explica: 'Depois da resposta, o objetivo é marcar uma visita ou reunião.' },
        { p: 'Onde encontro ideias de lugares para prospectar?', opcoes: ['Em "Onde prospectar"', 'Em Configurações', 'Não existe'], certa: 0, explica: 'A tela "Onde prospectar" tem hospitais, escolas, shoppings e outros, com a dor de cada um.' },
      ],
    },
  ],

  followup: [
    {
      tipo: 'licao', emoji: '🔁', titulo: 'Follow-up: insistir com educação',
      texto: [
        'São 6 toques contados a partir da primeira mensagem: dia 1, 2, 4, 7, 10 e uma despedida no dia 14.',
        'A lista "Para hoje" mostra só quem precisa de mensagem hoje. Vermelho = atrasado: mande primeiro.',
        'O botão "Mandar toque" já traz o texto certo do dia. Depois de enviar, clique "Mandei este toque".',
        'Respondeu? Clique "Respondeu". Ninguém respondeu nos 6 toques? O contato descansa 60 dias e volta sozinho.',
      ],
    },
    {
      tipo: 'exercicio', titulo: 'Treino: monte a cadência',
      instrucao: 'Escolha o dia de cada toque, do primeiro ao último.',
      inicial: { dias: ['', '', '', '', '', ''] },
      validar: (s) => {
        const e = [];
        s.dias.forEach((d, i) => {
          if (d === '') e.push(`Faltou escolher o dia do ${i + 1}º toque.`);
          else if (Number(d) !== ordemDias[i]) e.push(`O ${i + 1}º toque não é no dia ${d}. Lembre: 1, 2, 4, 7, 10 e 14.`);
        });
        return e;
      },
      render: (s, set) => (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', maxWidth: 560 }}>
          {s.dias.map((d, i) => (
            <div key={i} className="fx-campo">
              <label htmlFor={`t-d${i}`}>{i === 5 ? 'Despedida' : `${i + 1}º toque`}</label>
              <select id={`t-d${i}`} value={d} onChange={(e) => { const n = [...s.dias]; n[i] = e.target.value; set({ dias: n }); }}>
                <option value="">Escolha...</option>
                {[1, 2, 3, 4, 5, 7, 10, 14, 30].map((x) => <option key={x} value={x}>Dia {x}</option>)}
              </select>
            </div>
          ))}
        </div>
      ),
    },
    {
      tipo: 'exercicio', titulo: 'Treino: quem vem primeiro?',
      instrucao: 'Sua lista de hoje tem 3 contatos. Clique em quem deve receber mensagem PRIMEIRO.',
      inicial: { escolha: null },
      validar: (s) => {
        if (!s.escolha) return ['Clique em um dos três cartões.'];
        if (s.escolha === 'atrasado') return [];
        if (s.escolha === 'hoje') return ['Este é para hoje, mas existe um ATRASADO (vermelho). Atrasados vêm primeiro.'];
        return ['Este é só para amanhã. Hoje você não precisa mandar nada para ele.'];
      },
      render: (s, set) => (
        <div className="fx-lista" style={{ maxWidth: 480 }}>
          {[['amanha', 'Ed. Brisa do Mar', 'fx-chip--cinza', 'Amanhã'], ['atrasado', 'Hospital Vida', 'fx-chip--vermelho', 'Atrasado 2 dia(s)'], ['hoje', 'Ed. Sol Nascente', 'fx-chip--amarelo', 'Para hoje']].map(([k, n, c, t]) => (
            <button key={k} type="button" onClick={() => set({ escolha: k })} className="fx-item"
              style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: 'var(--bd-surface-card)', border: `2px solid ${s.escolha === k ? 'var(--bd-primary-500)' : 'var(--bd-border-default)'}` }}>
              <span className={`fx-chip ${c}`}>{t}</span><strong>{n}</strong>
            </button>
          ))}
        </div>
      ),
    },
    {
      tipo: 'quiz', titulo: 'Confira o que aprendeu',
      perguntas: [
        { p: 'A pessoa não respondeu nenhum dos 6 toques. E agora?', opcoes: ['Apago o contato', 'Ele descansa 60 dias e volta sozinho para a prospecção', 'Mando mensagem todo dia'], certa: 1, explica: 'Depois da despedida, o contato vai para a "geladeira" e volta sozinho depois de 60 dias.' },
        { p: 'Tenho que lembrar sozinho quem cobrar?', opcoes: ['Sim, anoto num caderno', 'Não, o sistema mostra a lista de cada dia'], certa: 1, explica: 'A lista "Para hoje" faz isso por você. Ainda aparece um aviso no sininho.' },
      ],
    },
  ],

  vendas: [
    {
      tipo: 'licao', emoji: '🤝', titulo: 'Vendas: da proposta ao contrato',
      texto: [
        'Toda proposta que você cria aparece sozinha no Funil de Vendas.',
        'Colunas: Montando proposta → Proposta enviada → Negociando → Fechou!',
        'Use os botões do cartão para mudar de coluna. Quem preferir pode arrastar o cartão.',
        'Proposta parada por 2 dias entra no Follow-up para você cobrar. Fechou? Clique "Fechou!" e a família comemora no Meu Lar.',
      ],
    },
    {
      tipo: 'exercicio', titulo: 'Treino: em qual coluna fica?',
      instrucao: 'Para cada situação, escolha a coluna certa.',
      inicial: { a: '', b: '', c: '' },
      validar: (s) => {
        const certo = { a: 'enviada', b: 'negociando', c: 'fechou' };
        const textos = { a: 'Acabei de mandar o PDF da proposta', b: 'O síndico disse: "vou levar para a assembleia"', c: 'O cliente assinou o contrato' };
        const nomes = { montando: 'Montando', enviada: 'Proposta enviada', negociando: 'Negociando', fechou: 'Fechou!' };
        return Object.keys(certo).flatMap((k) => {
          if (!s[k]) return [`Faltou escolher a coluna para: "${textos[k]}".`];
          if (s[k] !== certo[k]) return [`"${textos[k]}" não fica em "${nomes[s[k]]}". Pense em que pé está a conversa.`];
          return [];
        });
      },
      render: (s, set) => (
        <div className="fx-stack" style={{ gap: 12, maxWidth: 560 }}>
          {[['a', 'Acabei de mandar o PDF da proposta'], ['b', 'O síndico disse: "vou levar para a assembleia"'], ['c', 'O cliente assinou o contrato']].map(([k, t]) => (
            <div key={k} className="fx-campo">
              <label htmlFor={`t-v${k}`}>{t}</label>
              <select id={`t-v${k}`} value={s[k]} onChange={(e) => set({ ...s, [k]: e.target.value })}>
                <option value="">Escolha a coluna...</option>
                <option value="montando">Montando proposta</option>
                <option value="enviada">Proposta enviada</option>
                <option value="negociando">Negociando</option>
                <option value="fechou">Fechou!</option>
              </select>
            </div>
          ))}
        </div>
      ),
    },
    {
      tipo: 'quiz', titulo: 'Confira o que aprendeu',
      perguntas: [
        { p: 'Uma proposta ficou parada 2 dias. O que o sistema faz?', opcoes: ['Nada', 'Coloca no Follow-up para você cobrar', 'Cancela a proposta'], certa: 1, explica: 'Proposta parada entra no Follow-up com o texto certo para cobrar.' },
        { p: 'Como vejo os funis em gráfico?', opcoes: ['Botões Quadro / Lista / Barras / Pizza no alto do funil', 'Não dá para ver em gráfico'], certa: 0, explica: 'Cada funil tem os botões de visualização no alto da tela.' },
      ],
    },
  ],

  lar: [
    {
      tipo: 'licao', emoji: '🏡', titulo: 'Meu Lar: por quem você trabalha',
      texto: [
        'O Meu Lar é o desenho da sua família: você, sua esposa, seu filho, sua filha e os três gatinhos.',
        'A cada cliente FECHADO, a casa ganha algo novo e uma estrela acende no céu com o nome do cliente.',
        'Contatos e propostas em andamento não contam — só quem fechou de verdade.',
        'Clique nas pessoas e nos gatos para ver o que eles têm a dizer.',
      ],
    },
    {
      tipo: 'quiz', titulo: 'Última pergunta!',
      perguntas: [
        { p: 'O que faz a casa do Meu Lar crescer?', opcoes: ['Cada contato cadastrado', 'Cada cliente fechado', 'Cada vez que abro o sistema'], certa: 1, explica: 'Só clientes fechados (proposta aprovada ou contrato assinado) contam.' },
      ],
    },
  ],
};
