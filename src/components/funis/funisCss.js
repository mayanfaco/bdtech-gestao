// Estilos da área de vendas (funis, guia, tutorial, ajuda, Meu Lar).
// Pensados para quem tem pouca familiaridade com sistemas: letra maior,
// botões grandes, uma coisa de cada vez, cores com significado fixo.
const CSS = `
.fx{font-size:16px;color:var(--bd-text-body);}
.fx h1{font-family:var(--bd-font-display);font-size:26px;color:var(--bd-text-strong);margin:0;}
.fx h2{font-family:var(--bd-font-display);font-size:20px;color:var(--bd-text-strong);margin:0;}
.fx h3{font-family:var(--bd-font-display);font-size:17px;color:var(--bd-text-strong);margin:0;}
.fx-muted{color:var(--bd-text-muted);}
.fx-stack{display:flex;flex-direction:column;gap:20px;}
.fx-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.fx-spacer{flex:1;}

/* Abas grandes dos funis */
.fx-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
.fx-tab{all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:16px;
  background:var(--bd-surface-card);border:2px solid var(--bd-border-subtle);transition:border-color .15s, box-shadow .15s, transform .15s;}
.fx-tab:hover{border-color:var(--bd-primary-300);}
.fx-tab:focus-visible{outline:3px solid var(--bd-primary-300);outline-offset:2px;}
.fx-tab[aria-selected="true"]{border-color:var(--bd-primary-500);box-shadow:0 6px 20px rgba(0,159,224,.18);}
.fx-tab__emoji{font-size:28px;line-height:1;}
.fx-tab__txt{display:flex;flex-direction:column;gap:2px;min-width:0;}
.fx-tab__title{font-weight:700;font-size:17px;color:var(--bd-text-strong);}
.fx-tab__sub{font-size:13px;color:var(--bd-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fx-tab__count{margin-left:auto;min-width:34px;height:34px;border-radius:999px;display:flex;align-items:center;justify-content:center;
  background:var(--bd-primary-50);color:var(--bd-primary-700);font-weight:800;font-size:15px;padding:0 8px;}
.fx-tab__count--alerta{background:#FDECEC;color:#B42318;}
.fx-tab__lock{margin-left:auto;font-size:18px;}
@media (max-width:760px){
  .fx-tabs{gap:8px;}
  .fx-tab{flex-direction:column;gap:4px;padding:10px 6px;text-align:center;position:relative;}
  .fx-tab__emoji{font-size:24px;}
  .fx-tab__title{font-size:14px;}
  .fx-tab__sub{display:none;}
  .fx-tab__count,.fx-tab__lock{position:absolute;top:6px;right:6px;margin:0;min-width:24px;height:24px;font-size:12px;}
}

/* Caixa "para que serve" */
.fx-explica{display:flex;gap:14px;align-items:flex-start;background:var(--bd-primary-50);border:1px solid var(--bd-primary-100);
  border-radius:14px;padding:14px 18px;}
.fx-explica__icon{font-size:22px;line-height:1.2;}
.fx-explica p{margin:0;line-height:1.55;}
.fx-explica strong{color:var(--bd-navy-800);}
.fx-explica__fechar{all:unset;cursor:pointer;margin-left:auto;color:var(--bd-text-muted);font-size:13px;text-decoration:underline;white-space:nowrap;}

/* Seletor de visualização */
.fx-seg{display:inline-flex;background:var(--bd-surface-sunken);border-radius:999px;padding:4px;gap:2px;}
.fx-seg button{all:unset;cursor:pointer;padding:9px 16px;border-radius:999px;font-weight:600;font-size:14px;color:var(--bd-text-muted);
  display:inline-flex;align-items:center;gap:6px;}
.fx-seg button:hover{color:var(--bd-text-strong);}
.fx-seg button:focus-visible{outline:3px solid var(--bd-primary-300);}
.fx-seg button[aria-pressed="true"]{background:var(--bd-surface-card);color:var(--bd-primary-700);box-shadow:0 1px 4px rgba(1,25,51,.12);}
@media (max-width:560px){.fx-seg{display:flex;width:100%;}.fx-seg button{flex:1;justify-content:center;padding:9px 6px;font-size:13px;}}

/* Quadro (kanban) */
.fx-board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(260px,1fr);gap:14px;overflow-x:auto;padding-bottom:8px;}
.fx-col{background:var(--bd-surface-sunken);border-radius:16px;padding:12px;min-height:320px;display:flex;flex-direction:column;gap:10px;
  transition:background .15s;border-top:5px solid var(--fx-cor,#94A3B8);}
.fx-col--over{background:var(--bd-primary-50);}
.fx-col__head{display:flex;align-items:center;gap:8px;padding:2px 4px;}
.fx-col__title{font-weight:800;font-size:15px;color:var(--bd-text-strong);}
.fx-col__count{margin-left:auto;font-weight:700;font-size:13px;background:var(--bd-surface-card);border-radius:999px;padding:3px 10px;}
.fx-col__hint{font-size:12.5px;color:var(--bd-text-muted);padding:0 4px;line-height:1.4;}
.fx-col__empty{font-size:13px;color:var(--bd-text-muted);text-align:center;padding:24px 8px;border:2px dashed var(--bd-border-default);border-radius:12px;}

.fx-card{background:var(--bd-surface-card);border:1px solid var(--bd-border-default);border-radius:14px;padding:14px;
  box-shadow:0 1px 3px rgba(1,25,51,.06);display:flex;flex-direction:column;gap:8px;touch-action:manipulation;}
.fx-card--drag{cursor:grab;}
.fx-card--alerta{border-color:#F04438;box-shadow:0 0 0 2px rgba(240,68,56,.12);}
.fx-card--hoje{border-color:#F59E0B;box-shadow:0 0 0 2px rgba(245,158,11,.15);}
.fx-card__nome{all:unset;cursor:pointer;font-weight:700;font-size:15.5px;color:var(--bd-text-strong);line-height:1.3;}
.fx-card__nome:hover{text-decoration:underline;}
.fx-card__sub{font-size:13.5px;color:var(--bd-text-muted);line-height:1.35;}
.fx-card__acoes{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px;}
.fx-chip{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;border-radius:999px;padding:4px 10px;width:fit-content;}
.fx-chip--azul{background:var(--bd-primary-50);color:var(--bd-primary-700);}
.fx-chip--verde{background:#E7F6EC;color:#15803D;}
.fx-chip--amarelo{background:#FEF3C7;color:#92400E;}
.fx-chip--vermelho{background:#FDECEC;color:#B42318;}
.fx-chip--cinza{background:var(--bd-neutral-100);color:var(--bd-neutral-700);}

/* Botões grandes e simples */
.fx-btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-weight:700;font-size:14px;border-radius:12px;padding:9px 14px;min-height:40px;line-height:1.1;text-align:center;
  transition:filter .15s, background .15s;border:1px solid transparent;}
.fx-btn:focus-visible{outline:3px solid var(--bd-primary-300);outline-offset:2px;}
.fx-btn[disabled]{opacity:.5;cursor:not-allowed;}
.fx-btn--lg{font-size:16px;padding:12px 20px;min-height:50px;border-radius:14px;}
.fx-btn--primario{background:var(--bd-primary-500);color:#fff;}
.fx-btn--primario:hover{background:var(--bd-primary-600);}
.fx-btn--zap{background:#25D366;color:#063B1C;}
.fx-btn--zap:hover{filter:brightness(.95);}
.fx-btn--verde{background:#16A34A;color:#fff;}
.fx-btn--verde:hover{filter:brightness(.95);}
.fx-btn--claro{background:var(--bd-surface-card);border-color:var(--bd-border-default);color:var(--bd-text-strong);}
.fx-btn--claro:hover{background:var(--bd-surface-sunken);}
.fx-btn--texto{color:var(--bd-text-muted);padding:6px 8px;min-height:auto;font-weight:600;text-decoration:underline;}
.fx-btn--perigo{background:#FFF;border-color:#F3B4AE;color:#B42318;}
.fx-btn--block{width:100%;}

/* Lista */
.fx-lista{display:flex;flex-direction:column;gap:10px;}
.fx-item{display:flex;align-items:center;gap:14px;background:var(--bd-surface-card);border:1px solid var(--bd-border-default);
  border-radius:14px;padding:14px 16px;flex-wrap:wrap;}
.fx-item__info{flex:1;min-width:200px;display:flex;flex-direction:column;gap:4px;}
.fx-secao{font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--bd-text-muted);margin:8px 0 2px;}

/* Contadores pequenos */
.fx-contadores{display:flex;gap:8px;flex-wrap:wrap;}
.fx-contador{font-size:13.5px;background:var(--bd-surface-card);border:1px solid var(--bd-border-subtle);border-radius:999px;padding:6px 12px;}
.fx-contador b{color:var(--bd-text-strong);}
button.fx-contador{cursor:pointer;}
button.fx-contador:hover{border-color:var(--bd-primary-300);}

/* Gráficos */
.fx-grafico{background:var(--bd-surface-card);border:1px solid var(--bd-border-subtle);border-radius:16px;padding:22px;}
.fx-barra{display:grid;grid-template-columns:minmax(110px,180px) 1fr 44px;gap:12px;align-items:center;margin:12px 0;}
.fx-barra__lbl{font-weight:600;font-size:14.5px;color:var(--bd-text-strong);}
.fx-barra__trilho{height:30px;background:var(--bd-surface-sunken);border-radius:8px;overflow:hidden;}
.fx-barra__fill{height:100%;border-radius:8px;transition:width .5s cubic-bezier(.2,.8,.2,1);min-width:2px;}
.fx-barra__num{font-weight:800;font-size:16px;text-align:right;color:var(--bd-text-strong);}
.fx-pizza{display:flex;gap:28px;align-items:center;flex-wrap:wrap;justify-content:center;}
.fx-legenda{display:flex;flex-direction:column;gap:10px;min-width:220px;}
.fx-legenda__item{display:flex;align-items:center;gap:10px;font-size:15px;}
.fx-legenda__cor{width:16px;height:16px;border-radius:5px;flex:0 0 auto;}
.fx-legenda__num{margin-left:auto;font-weight:800;}

/* Modal */
.fx-modal-fundo{position:fixed;inset:0;background:rgba(1,25,51,.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;
  animation:fxFade .15s ease;}
.fx-modal{background:var(--bd-surface-card);border-radius:20px;width:100%;max-width:560px;max-height:calc(100vh - 32px);overflow:auto;
  box-shadow:0 24px 60px rgba(1,25,51,.35);animation:fxSobe .2s cubic-bezier(.2,.8,.2,1);}
.fx-modal__topo{display:flex;align-items:center;gap:12px;padding:20px 22px 8px;}
.fx-modal__corpo{padding:8px 22px 22px;display:flex;flex-direction:column;gap:14px;}
.fx-modal__fechar{all:unset;cursor:pointer;margin-left:auto;width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--bd-text-muted);}
.fx-modal__fechar:hover{background:var(--bd-surface-sunken);}
@keyframes fxFade{from{opacity:0}to{opacity:1}}
@keyframes fxSobe{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

.fx-campo{display:flex;flex-direction:column;gap:6px;}
.fx-campo label{font-weight:700;font-size:14.5px;color:var(--bd-text-strong);}
.fx-campo input,.fx-campo select,.fx-campo textarea{font:inherit;font-size:16px;padding:12px 14px;border-radius:12px;border:1.5px solid var(--bd-border-default);
  background:var(--bd-surface-card);color:var(--bd-text-strong);}
.fx-campo input:focus,.fx-campo select:focus,.fx-campo textarea:focus{outline:none;border-color:var(--bd-primary-500);box-shadow:0 0 0 3px rgba(0,159,224,.18);}
.fx-campo small{color:var(--bd-text-muted);font-size:13px;}
.fx-erro{background:#FDECEC;color:#912018;border-radius:12px;padding:12px 14px;font-size:14.5px;}
.fx-ok{background:#E7F6EC;color:#14532D;border-radius:12px;padding:12px 14px;font-size:14.5px;}

.fx-voltou{background:#FFF4D6;border:1px solid #F5C84C;border-radius:10px;padding:8px 10px;font-size:13.5px;color:#7A4B00;line-height:1.4;}
.fx-card--voltou{border:2px solid #F5B82E;box-shadow:0 0 0 3px rgba(245,184,46,.18);}
.fx-script{background:var(--bd-surface-sunken);border-radius:12px;padding:14px;font-size:15px;line-height:1.55;white-space:pre-wrap;}

/* Aviso de atualização do banco */
.fx-aviso{background:#FFF8E6;border:1px solid #F5D48A;border-radius:14px;padding:16px 18px;line-height:1.55;}

/* Cadeado */
.fx-bloqueado{text-align:center;padding:48px 20px;background:var(--bd-surface-card);border:2px dashed var(--bd-border-default);border-radius:20px;}
.fx-bloqueado__icone{font-size:48px;}

/* Comemoração */
.fx-confete{position:fixed;inset:0;pointer-events:none;z-index:3000;overflow:hidden;}
.fx-confete i{position:absolute;top:-20px;width:10px;height:16px;border-radius:2px;animation:fxCai 2.6s linear forwards;}
@keyframes fxCai{to{transform:translateY(110vh) rotate(720deg);opacity:.9}}
@media (prefers-reduced-motion: reduce){.fx-confete{display:none;}}
`;

export function injectFunisCss() {
  if (typeof document === 'undefined' || document.getElementById('bd-funis-css')) return;
  const s = document.createElement('style');
  s.id = 'bd-funis-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
