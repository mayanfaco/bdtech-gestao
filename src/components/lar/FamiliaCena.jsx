import React from 'react';

// Cena ilustrada da família. Tudo em SVG, sem imagens externas.
// Cada conquista (cliente fechado) acrescenta algo à casa; cada cliente vira
// uma estrela no céu com o nome dele.

export const CONQUISTAS = [
  { n: 1, chave: 'flores', titulo: 'Flores na janela', emoji: '🌷' },
  { n: 2, chave: 'caminha', titulo: 'Caminha nova dos gatos', emoji: '🧺' },
  { n: 3, chave: 'arvore', titulo: 'Árvore no quintal', emoji: '🌳' },
  { n: 4, chave: 'balanco', titulo: 'Balanço na árvore', emoji: '🪢' },
  { n: 5, chave: 'luzes', titulo: 'Varanda com luzinhas', emoji: '✨' },
  { n: 6, chave: 'churrasco', titulo: 'Churrasqueira da família', emoji: '🍖' },
  { n: 8, chave: 'carro', titulo: 'Carro novo na garagem', emoji: '🚗' },
  { n: 10, chave: 'piscina', titulo: 'Piscina no quintal', emoji: '🏊' },
  { n: 12, chave: 'solar', titulo: 'Energia solar no telhado', emoji: '☀️' },
  { n: 15, chave: 'viagem', titulo: 'Viagem em família', emoji: '✈️' },
  { n: 20, chave: 'fogos', titulo: 'Festa com fogos!', emoji: '🎆' },
];

const CSS = `
.lar-svg{width:100%;height:auto;display:block;border-radius:20px;}
.lar-clicavel{cursor:pointer;}
.lar-clicavel:focus{outline:none;}
.lar-clicavel:focus-visible > *:first-child{stroke:#009FE0;stroke-width:3;}
.lar-nuvem{animation:larNuvem 60s linear infinite;}
.lar-nuvem--2{animation-duration:85s;animation-delay:-30s;}
@keyframes larNuvem{from{transform:translateX(-200px)}to{transform:translateX(1000px)}}
.lar-rabo{transform-box:fill-box;transform-origin:0% 100%;animation:larRabo 2.4s ease-in-out infinite;}
@keyframes larRabo{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}
.lar-pula{animation:larPula .6s cubic-bezier(.3,1.6,.5,1);}
@keyframes larPula{0%{transform:translateY(0)}40%{transform:translateY(-26px)}100%{transform:translateY(0)}}
.lar-acena{transform-box:fill-box;transform-origin:50% 0%;animation:larAcena 1s ease-in-out 3;}
@keyframes larAcena{0%,100%{transform:rotate(0)}50%{transform:rotate(-35deg)}}
.lar-estrela{animation:larBrilho 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center;}
@keyframes larBrilho{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.85)}}
.lar-balanco{transform-box:fill-box;transform-origin:50% 0%;animation:larBalanco 3s ease-in-out infinite;}
@keyframes larBalanco{0%,100%{transform:rotate(6deg)}50%{transform:rotate(-6deg)}}
.lar-aviao{animation:larAviao 18s linear infinite;}
@keyframes larAviao{from{transform:translateX(950px)}to{transform:translateX(-400px)}}
.lar-fogo{transform-box:fill-box;transform-origin:center;animation:larFogo 2.2s ease-out infinite;}
@keyframes larFogo{0%{transform:scale(.1);opacity:0}30%{opacity:1}100%{transform:scale(1.4);opacity:0}}
.lar-balao{animation:fxSobe .2s ease;}
@media (prefers-reduced-motion: reduce){.lar-nuvem,.lar-rabo,.lar-estrela,.lar-balanco,.lar-aviao,.lar-fogo,.lar-acena,.lar-pula{animation:none;}}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-lar-css')) {
  const s = document.createElement('style'); s.id = 'bd-lar-css'; s.textContent = CSS; document.head.appendChild(s);
}

// ---------------------------------------------------------------- Pessoas
const PELE = { clara: '#F6D3BD', media: '#E8B896' };

function Cabelo({ estilo, cor, mecha }) {
  switch (estilo) {
    case 'grisalho':
      // curto, penteado de lado, sal e pimenta
      return (
        <g>
          <path d="M-23 -4 C-25 -26 -8 -34 4 -33 C18 -32 26 -22 24 -6 C22 -14 16 -20 8 -21 C-2 -16 -14 -18 -23 -4 Z" fill={cor} />
          <path d="M-14 -24 C-6 -29 4 -30 12 -27" stroke={mecha} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M-18 -16 C-10 -22 0 -23 8 -22" stroke={mecha} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".8" />
          <path d="M-23 -4 C-24 2 -23 6 -22 9" stroke={cor} strokeWidth="4" strokeLinecap="round" />
          <path d="M23 -4 C24 2 23 6 22 9" stroke={cor} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'curto':
      return (
        <g>
          <path d="M-23 -2 C-26 -28 -6 -35 6 -33 C20 -31 27 -20 23 -2 C20 -12 12 -19 2 -18 C-8 -22 -18 -14 -23 -2 Z" fill={cor} />
          <path d="M-4 -33 C2 -38 10 -37 13 -32" fill={cor} />
        </g>
      );
    case 'longo':
      return (
        <g>
          <path d="M-25 -2 C-28 -30 -6 -36 4 -35 C22 -34 29 -20 25 0 L28 42 C18 46 12 40 14 30 L20 2 C10 -14 -4 -18 -18 -10 L-14 30 C-12 42 -22 46 -28 40 Z" fill={cor} />
        </g>
      );
    case 'ondulado':
      return (
        <g>
          <path d="M-25 -2 C-29 -30 -6 -37 4 -36 C23 -35 30 -20 25 2 C30 12 24 20 28 30 C30 40 20 46 14 38 C12 30 18 24 16 14 L19 2 C10 -14 -4 -18 -18 -10 C-18 2 -12 8 -15 18 C-18 26 -12 32 -16 40 C-22 46 -30 40 -28 30 C-26 20 -31 12 -25 -2 Z" fill={cor} />
          <path d="M-10 -26 C-2 -30 8 -30 14 -26" stroke="#E07A4F" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
        </g>
      );
    default: return null;
  }
}

function Rosto({ sardas, cilios }) {
  return (
    <g>
      <ellipse cx="-8" cy="2" rx="2.6" ry="3.2" fill="#2B2B33" />
      <ellipse cx="8" cy="2" rx="2.6" ry="3.2" fill="#2B2B33" />
      <circle cx="-7.2" cy="0.8" r=".9" fill="#fff" />
      <circle cx="8.8" cy="0.8" r=".9" fill="#fff" />
      {cilios && <path d="M-12 -1 L-10 0.5 M12 -1 L10 0.5" stroke="#2B2B33" strokeWidth="1.4" strokeLinecap="round" />}
      <circle cx="-13" cy="9" r="3.6" fill="#F4A0A0" opacity=".45" />
      <circle cx="13" cy="9" r="3.6" fill="#F4A0A0" opacity=".45" />
      <path d="M-6 10 Q0 16 6 10" stroke="#8A3B3B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {sardas && <g fill="#C9784F" opacity=".75"><circle cx="-11" cy="5" r=".9" /><circle cx="-8" cy="7" r=".9" /><circle cx="-13" cy="7" r=".8" /><circle cx="11" cy="5" r=".9" /><circle cx="8" cy="7" r=".9" /><circle cx="13" cy="7" r=".8" /></g>}
    </g>
  );
}

function Pessoa({ x, y, escala = 1, pele, cabelo, mecha, estilo, camisa, calca, sapato = '#3A3A44', saia, sardas, cilios, barba, acenando, rotulo, onClick }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} className="lar-clicavel" role="button" tabIndex={0} aria-label={rotulo}
      onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}>
      <ellipse cx="0" cy="2" rx="30" ry="6" fill="rgba(0,0,0,.12)" />
      {/* pernas */}
      {saia ? (
        <>
          <rect x="-11" y="-42" width="8" height="40" rx="4" fill={pele} />
          <rect x="3" y="-42" width="8" height="40" rx="4" fill={pele} />
        </>
      ) : (
        <>
          <rect x="-13" y="-52" width="11" height="50" rx="5" fill={calca} />
          <rect x="2" y="-52" width="11" height="50" rx="5" fill={calca} />
        </>
      )}
      <ellipse cx="-8" cy="-2" rx="8" ry="4.5" fill={sapato} />
      <ellipse cx="8" cy="-2" rx="8" ry="4.5" fill={sapato} />
      {/* tronco */}
      {saia
        ? <path d="M-20 -104 C-20 -110 20 -110 20 -104 L26 -40 C10 -34 -10 -34 -26 -40 Z" fill={camisa} />
        : <rect x="-20" y="-108" width="40" height="60" rx="14" fill={camisa} />}
      {/* braços */}
      <rect x="-30" y="-104" width="11" height="50" rx="5.5" fill={camisa} />
      <circle cx="-24.5" cy="-52" r="6" fill={pele} />
      <g className={acenando ? 'lar-acena' : undefined}>
        <rect x="19" y="-104" width="11" height="50" rx="5.5" fill={camisa} />
        <circle cx="24.5" cy="-52" r="6" fill={pele} />
      </g>
      {/* pescoço e cabeça */}
      <rect x="-6" y="-116" width="12" height="12" rx="4" fill={pele} />
      <g transform="translate(0 -138)">
        {(estilo === 'longo' || estilo === 'ondulado') && <Cabelo estilo={estilo} cor={cabelo} mecha={mecha} />}
        <ellipse cx="0" cy="0" rx="22" ry="24" fill={pele} />
        <ellipse cx="-22" cy="3" rx="3.5" ry="5" fill={pele} />
        <ellipse cx="22" cy="3" rx="3.5" ry="5" fill={pele} />
        {barba && <path d="M-15 8 C-12 22 12 22 15 8 C10 14 -10 14 -15 8 Z" fill={barba} opacity=".45" />}
        <Rosto sardas={sardas} cilios={cilios} />
        {estilo !== 'longo' && estilo !== 'ondulado' && <Cabelo estilo={estilo} cor={cabelo} mecha={mecha} />}
        {(estilo === 'longo' || estilo === 'ondulado') && (
          <path d="M-22 -6 C-18 -26 6 -30 20 -12 C12 -20 -4 -22 -22 -6 Z" fill={cabelo} />
        )}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- Gatos
function Gato({ x, y, cor, contorno, olhos = '#7BC86C', nariz = '#F29CA3', rotulo, pulando, onClick }) {
  return (
    <g transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={rotulo} className="lar-clicavel"
      onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}>
      <ellipse cx="0" cy="2" rx="22" ry="4.5" fill="rgba(0,0,0,.12)" />
      <g className={pulando ? 'lar-pula' : undefined}>
        <path className="lar-rabo" d="M14 -6 C34 -8 36 -30 26 -40" stroke={cor} strokeWidth="7" fill="none" strokeLinecap="round" />
        {contorno && <path className="lar-rabo" d="M14 -6 C34 -8 36 -30 26 -40" stroke={contorno} strokeWidth="9" fill="none" strokeLinecap="round" opacity=".25" />}
        <path d="M-18 0 C-22 -26 -12 -40 0 -40 C12 -40 22 -26 18 0 Z" fill={cor} stroke={contorno} strokeWidth={contorno ? 1.5 : 0} />
        <g transform="translate(0 -46)">
          <path d="M-15 -6 L-14 -24 L-4 -14 Z M15 -6 L14 -24 L4 -14 Z" fill={cor} stroke={contorno} strokeWidth={contorno ? 1.5 : 0} strokeLinejoin="round" />
          <path d="M-12 -10 L-12 -19 L-7 -13 Z M12 -10 L12 -19 L7 -13 Z" fill="#F7B7BE" opacity=".8" />
          <ellipse cx="0" cy="0" rx="17" ry="15" fill={cor} stroke={contorno} strokeWidth={contorno ? 1.5 : 0} />
          <ellipse cx="-6.5" cy="-2" rx="3.2" ry="4" fill={olhos} />
          <ellipse cx="6.5" cy="-2" rx="3.2" ry="4" fill={olhos} />
          <ellipse cx="-6.5" cy="-2" rx="1.1" ry="3" fill="#1D1D22" />
          <ellipse cx="6.5" cy="-2" rx="1.1" ry="3" fill="#1D1D22" />
          <path d="M-2 4 L2 4 L0 6.5 Z" fill={nariz} />
          <path d="M0 6.5 Q-3 9 -5 7.5 M0 6.5 Q3 9 5 7.5" stroke={contorno ?? '#555'} strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M-8 5 L-20 3 M-8 7 L-19 8 M8 5 L20 3 M8 7 L19 8" stroke={contorno ?? '#9AA0A6'} strokeWidth=".8" opacity=".7" />
        </g>
        <ellipse cx="-7" cy="-1" rx="5" ry="3.5" fill={cor} stroke={contorno} strokeWidth={contorno ? 1.2 : 0} />
        <ellipse cx="7" cy="-1" rx="5" ry="3.5" fill={cor} stroke={contorno} strokeWidth={contorno ? 1.2 : 0} />
      </g>
    </g>
  );
}

function Balao({ x, y, texto }) {
  const largura = Math.min(260, Math.max(120, texto.length * 7.2 + 24));
  return (
    <g transform={`translate(${x - largura / 2} ${y})`} className="lar-balao" pointerEvents="none">
      <rect width={largura} height="40" rx="14" fill="#fff" stroke="#011933" strokeOpacity=".15" />
      <path d={`M${largura / 2 - 8} 40 L${largura / 2} 52 L${largura / 2 + 8} 40 Z`} fill="#fff" />
      <text x={largura / 2} y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#011933">{texto}</text>
    </g>
  );
}

// ---------------------------------------------------------------- Cenário
function ceu(hora) {
  if (hora >= 6 && hora < 16) return { topo: '#7CC6F2', base: '#D8F0FF', noite: false };
  if (hora >= 16 && hora < 18.5) return { topo: '#F59E6B', base: '#FCD9A8', noite: false };
  return { topo: '#0B1C3D', base: '#27467E', noite: true };
}

function posicaoEstrela(i) {
  // espalha as estrelas pelo céu de forma estável (não muda a cada visita)
  const x = 40 + ((i * 137) % 820);
  const y = 26 + ((i * 59) % 120);
  return [x, y];
}

const FALAS = {
  pai: (n) => [n ? `Já são ${n} clientes. É por vocês!` : 'O primeiro cliente vem aí!', 'Cada contrato é pela minha família.', 'Hoje eu mando o follow-up!'],
  esposa: (n) => ['Estou orgulhosa de você! ❤️', n ? `${n} clientes! Que orgulho!` : 'Eu acredito em você!', 'Vai dar tudo certo, amor.'],
  filho: () => ['Pai, bora fechar mais um!', 'Manda aquela mensagem, pai! 💪', 'Tamo junto, pai!'],
  filha: (n) => [n ? `Pai, ${n} estrelas no céu! ⭐` : 'Pai, quero ver a primeira estrela!', 'Você é o melhor pai! 🧡', 'Eu conto as estrelas todo dia!'],
  gato: () => ['Miau! 🐟', 'Purrr... 😺', 'Miau? (cadê o sachê?)'],
};

export function FamiliaCena({ fechados = [], hora = new Date().getHours() + new Date().getMinutes() / 60 }) {
  const n = fechados.length;
  const tem = (chave) => n >= (CONQUISTAS.find((c) => c.chave === chave)?.n ?? Infinity);
  const c = ceu(hora);
  const [fala, setFala] = React.useState(null);
  const [pulo, setPulo] = React.useState(null);
  const contador = React.useRef(0);

  function falar(quem, x, y) {
    const lista = FALAS[quem.startsWith('gato') ? 'gato' : quem](n);
    contador.current += 1;
    setFala({ quem, x, y, texto: lista[contador.current % lista.length] });
    if (quem.startsWith('gato')) { setPulo(quem); setTimeout(() => setPulo(null), 650); }
  }
  React.useEffect(() => {
    if (!fala) return undefined;
    const t = setTimeout(() => setFala(null), 3200);
    return () => clearTimeout(t);
  }, [fala]);

  const parede = '#FFF4E2'; const telhado = '#C2553E'; const janela = c.noite ? '#FFE08A' : '#BFE6FF';

  return (
    <svg className="lar-svg" viewBox="0 0 900 520" role="img" aria-label={`Desenho da família. ${n} cliente(s) fechado(s).`}>
      <defs>
        <linearGradient id="lar-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.topo} /><stop offset="1" stopColor={c.base} /></linearGradient>
        <linearGradient id="lar-grama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.noite ? '#3D7A4A' : '#7DCB6F'} /><stop offset="1" stopColor={c.noite ? '#23502E' : '#4FA45A'} /></linearGradient>
        <linearGradient id="lar-agua" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7FD8F6" /><stop offset="1" stopColor="#2BA8E0" /></linearGradient>
      </defs>
      <rect width="900" height="520" fill="url(#lar-ceu)" />

      {/* sol ou lua */}
      {c.noite
        ? <g><circle cx="790" cy="80" r="34" fill="#FFF6D6" /><circle cx="804" cy="70" r="30" fill={c.topo} /></g>
        : <g><circle cx="790" cy="80" r="40" fill="#FFD54A" opacity=".35" /><circle cx="790" cy="80" r="30" fill="#FFCF33" /></g>}

      {/* estrelas: uma por cliente fechado */}
      {fechados.map((f, i) => {
        const [x, y] = posicaoEstrela(i);
        return (
          <g key={f.id} transform={`translate(${x} ${y})`}>
            <path className="lar-estrela" style={{ animationDelay: `${(i % 7) * 0.4}s` }}
              d="M0 -10 L3 -3 L10 -3 L4.5 1.8 L6.5 9 L0 4.8 L-6.5 9 L-4.5 1.8 L-10 -3 L-3 -3 Z"
              fill={c.noite ? '#FFE680' : '#FFF3B0'} stroke={c.noite ? 'none' : '#F2C230'} strokeWidth="1">
              <title>{`${f.nome} — fechado em ${new Date(f.data).toLocaleDateString('pt-BR')}`}</title>
            </path>
          </g>
        );
      })}

      {/* nuvens */}
      {!c.noite && (
        <>
          <g className="lar-nuvem" opacity=".9"><ellipse cx="80" cy="120" rx="46" ry="16" fill="#fff" /><ellipse cx="108" cy="110" rx="28" ry="18" fill="#fff" /></g>
          <g className="lar-nuvem lar-nuvem--2" opacity=".8"><ellipse cx="60" cy="60" rx="38" ry="13" fill="#fff" /><ellipse cx="80" cy="52" rx="22" ry="14" fill="#fff" /></g>
        </>
      )}

      {/* avião da viagem */}
      {tem('viagem') && (
        <g className="lar-aviao">
          <g transform="translate(0 150)">
            <rect x="-150" y="-12" width="120" height="24" rx="4" fill="#fff" stroke="#E11D48" strokeWidth="2" />
            <text x="-90" y="5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#E11D48">Férias em família!</text>
            <line x1="-30" y1="0" x2="0" y2="0" stroke="#999" />
            <path d="M0 -6 L40 -6 C52 -6 56 0 56 0 C56 0 52 6 40 6 L0 6 Z" fill="#fff" stroke="#666" />
            <path d="M18 -6 L28 -22 L34 -22 L30 -6 Z M18 6 L28 22 L34 22 L30 6 Z M2 -6 L-2 -16 L4 -16 L10 -6 Z" fill="#009FE0" />
          </g>
        </g>
      )}

      {/* fogos */}
      {tem('fogos') && [[160, 90, '#F43F5E'], [640, 70, '#FACC15'], [420, 50, '#22D3EE']].map(([x, y, cor], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <g className="lar-fogo" style={{ animationDelay: `${i * 0.7}s` }}>
            {Array.from({ length: 12 }, (_, k) => {
              const a = (k / 12) * Math.PI * 2;
              return <line key={k} x1="0" y1="0" x2={Math.cos(a) * 26} y2={Math.sin(a) * 26} stroke={cor} strokeWidth="3" strokeLinecap="round" />;
            })}
          </g>
        </g>
      ))}

      {/* colina */}
      <path d="M0 330 C180 300 320 318 450 322 C600 326 740 300 900 318 L900 520 L0 520 Z" fill="url(#lar-grama)" />

      {/* árvore + balanço */}
      {tem('arvore') && (
        <g transform="translate(120 330)">
          <rect x="-10" y="-90" width="20" height="96" rx="6" fill="#8B5A3C" />
          <rect x="0" y="-70" width="60" height="9" rx="4" fill="#8B5A3C" transform="rotate(-12)" />
          <circle cx="0" cy="-120" r="52" fill={c.noite ? '#2F6B3C' : '#3E9B4F'} />
          <circle cx="-36" cy="-96" r="34" fill={c.noite ? '#2A6036' : '#47A85A'} />
          <circle cx="38" cy="-98" r="36" fill={c.noite ? '#2A6036' : '#47A85A'} />
          {tem('balanco') && (
            <g className="lar-balanco" transform="translate(44 -76)">
              <line x1="-12" y1="0" x2="-12" y2="56" stroke="#5C4033" strokeWidth="2" />
              <line x1="12" y1="0" x2="12" y2="56" stroke="#5C4033" strokeWidth="2" />
              <rect x="-18" y="54" width="36" height="7" rx="3" fill="#C98B4E" />
            </g>
          )}
        </g>
      )}

      {/* casa */}
      <g transform="translate(330 140)">
        {tem('carro') && (
          <g transform="translate(250 92)">
            <rect x="0" y="0" width="130" height="96" fill="#EDE3D1" />
            <path d="M-8 2 L65 -36 L138 2 Z" fill={telhado} />
            <rect x="12" y="22" width="106" height="74" fill="#5B6573" />
            <g transform="translate(18 52)">
              <path d="M4 26 L4 12 C4 6 10 0 22 0 L64 0 C76 0 82 6 88 12 L96 14 C100 15 100 20 100 26 Z" fill="#E11D48" />
              <rect x="22" y="4" width="20" height="10" rx="2" fill="#BFE6FF" /><rect x="46" y="4" width="20" height="10" rx="2" fill="#BFE6FF" />
              <circle cx="24" cy="28" r="8" fill="#1F2937" /><circle cx="80" cy="28" r="8" fill="#1F2937" />
              <circle cx="24" cy="28" r="3" fill="#CBD5E1" /><circle cx="80" cy="28" r="3" fill="#CBD5E1" />
            </g>
          </g>
        )}
        <rect x="0" y="60" width="250" height="128" fill={parede} />
        <path d="M-18 66 L125 -18 L268 66 Z" fill={telhado} />
        <rect x="168" y="-6" width="24" height="44" fill="#9C3F2D" />
        {tem('solar') && (
          <g transform="translate(36 22) skewX(-30)">
            {[0, 1, 2].map((i) => <rect key={i} x={i * 30} y="0" width="27" height="26" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="1.5" />)}
          </g>
        )}
        {/* janelas */}
        {[[24, 92], [176, 92]].map(([x, y]) => (
          <g key={x}>
            <rect x={x} y={y} width="50" height="44" rx="4" fill={janela} stroke="#fff" strokeWidth="5" />
            <line x1={x + 25} y1={y} x2={x + 25} y2={y + 44} stroke="#fff" strokeWidth="3" />
            {tem('flores') && (
              <g>
                <rect x={x - 4} y={y + 44} width="58" height="10" rx="3" fill="#8B5A3C" />
                {[6, 18, 30, 42].map((d, i) => <circle key={d} cx={x + d + 2} cy={y + 42} r="5" fill={['#F472B6', '#FACC15', '#F87171', '#A78BFA'][i]} />)}
              </g>
            )}
          </g>
        ))}
        {/* porta */}
        <rect x="102" y="110" width="46" height="78" rx="6" fill="#7C4A2D" />
        <circle cx="139" cy="152" r="3" fill="#FCD34D" />
        <text x="125" y="102" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7C4A2D">Lar doce lar</text>
        {tem('luzes') && (
          <g>
            <path d="M0 64 Q62 80 125 64 Q188 80 250 64" stroke="#334155" strokeWidth="1.2" fill="none" />
            {Array.from({ length: 11 }, (_, i) => {
              const t = i / 10; const xx = t * 250; const yy = 64 + Math.sin(t * Math.PI * 2) ** 2 * 12;
              return <circle key={i} cx={xx} cy={yy + 4} r="4" fill={['#FDE047', '#F472B6', '#60A5FA', '#4ADE80'][i % 4]} className="lar-estrela" style={{ animationDelay: `${i * 0.2}s` }} />;
            })}
          </g>
        )}
      </g>

      {/* churrasqueira */}
      {tem('churrasco') && (
        <g transform="translate(196 392)">
          <rect x="-4" y="-34" width="44" height="10" rx="3" fill="#374151" />
          <path d="M0 -24 L36 -24 L30 -6 L6 -6 Z" fill="#1F2937" />
          <line x1="8" y1="-6" x2="4" y2="10" stroke="#374151" strokeWidth="3" /><line x1="28" y1="-6" x2="32" y2="10" stroke="#374151" strokeWidth="3" />
          <path d="M10 -40 C6 -50 16 -52 12 -62 M24 -40 C20 -50 30 -52 26 -62" stroke="#CBD5E1" strokeWidth="2" fill="none" opacity=".8" />
        </g>
      )}

      {/* piscina */}
      {tem('piscina') && (
        <g transform="translate(800 392)">
          <ellipse cx="0" cy="0" rx="92" ry="28" fill="#E2E8F0" />
          <ellipse cx="0" cy="0" rx="82" ry="22" fill="url(#lar-agua)" />
          <path d="M-60 -4 Q-48 -10 -36 -4 T-12 -4 M20 6 Q32 0 44 6 T68 6" stroke="#fff" strokeWidth="2" fill="none" opacity=".7" />
          <circle cx="50" cy="-6" r="10" fill="#F97316" /><circle cx="50" cy="-6" r="5" fill="url(#lar-agua)" />
        </g>
      )}

      {/* caminha dos gatos */}
      {tem('caminha') && (
        <g transform="translate(640 500)">
          <ellipse cx="0" cy="0" rx="36" ry="12" fill="#A855F7" />
          <ellipse cx="0" cy="-3" rx="27" ry="7" fill="#E9D5FF" />
        </g>
      )}

      {/* família (da esquerda para a direita) */}
      <Pessoa x={318} y={470} escala={1} pele={PELE.media} estilo="curto" cabelo="#141414" camisa="#2563EB" calca="#1F2937" acenando={fala?.quem === 'filho'} rotulo="Filho" onClick={() => falar('filho', 318, 270)} />
      <Pessoa x={404} y={478} escala={1.02} pele={PELE.media} estilo="grisalho" cabelo="#A3ABB5" mecha="#5F6670" barba="#8D949C" camisa="#0E7490" calca="#334155" acenando={fala?.quem === 'pai'} rotulo="Você" onClick={() => falar('pai', 404, 276)} />
      <Pessoa x={486} y={478} escala={0.95} pele={PELE.clara} estilo="longo" cabelo="#16161A" camisa="#DB2777" saia cilios acenando={fala?.quem === 'esposa'} rotulo="Esposa" onClick={() => falar('esposa', 486, 290)} />
      <Pessoa x={560} y={482} escala={0.9} pele={PELE.clara} estilo="ondulado" cabelo="#C2410C" camisa="#16A34A" calca="#1E3A8A" sardas cilios acenando={fala?.quem === 'filha'} rotulo="Filha" onClick={() => falar('filha', 560, 300)} />

      {/* gatos */}
      <Gato x={250} y={500} cor="#1B1B1F" olhos="#FACC15" nariz="#9CA3AF" rotulo="Gato preto" pulando={pulo === 'gato1'} onClick={() => falar('gato1', 250, 400)} />
      <Gato x={640} y={502} cor="#FFFFFF" contorno="#9CA3AF" olhos="#60A5FA" rotulo="Gato branco" pulando={pulo === 'gato2'} onClick={() => falar('gato2', 640, 402)} />
      <Gato x={720} y={500} cor="#8E97A3" olhos="#7BC86C" rotulo="Gato cinza" pulando={pulo === 'gato3'} onClick={() => falar('gato3', 720, 400)} />

      {fala && <Balao x={Math.min(Math.max(fala.x, 140), 760)} y={fala.y - 56} texto={fala.texto} />}
    </svg>
  );
}
