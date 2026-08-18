/* Shared form-control CSS for the BDTECH forms group. Injected once. */
const FORM_CSS = `
.bdfield{display:flex;flex-direction:column;gap:6px;font-family:var(--bd-font-text);}
.bdfield__label{font-size:var(--bd-text-label);font-weight:var(--bd-weight-semibold);color:var(--bd-text-strong);}
.bdfield__req{color:var(--bd-danger-500);margin-left:2px;}
.bdfield__hint{font-size:var(--bd-text-caption);color:var(--bd-text-muted);}
.bdfield__error{font-size:var(--bd-text-caption);color:var(--bd-danger-700);display:flex;align-items:center;gap:4px;}

.bdctrl{font-family:var(--bd-font-text);font-size:var(--bd-text-body);color:var(--bd-text-strong);
  background:var(--bd-surface-card);border:1px solid var(--bd-border-default);
  border-radius:var(--bd-radius-input);padding:.75rem 1rem;min-height:48px;width:100%;
  transition:var(--bd-transition-colors),box-shadow var(--bd-duration-fast) var(--bd-ease-standard);outline:none;}
.bdctrl::placeholder{color:var(--bd-text-subtle);}
.bdctrl:hover:not(:disabled){border-color:var(--bd-border-strong);}
.bdctrl:focus{border-color:var(--bd-primary-500);box-shadow:var(--bd-glow-brand);}
.bdctrl:disabled{background:var(--bd-state-disabled-bg);color:var(--bd-state-disabled-fg);cursor:not-allowed;}
.bdctrl--error{border-color:var(--bd-danger-500);}
.bdctrl--error:focus{box-shadow:0 0 0 4px rgba(229,72,77,.20);}
textarea.bdctrl{min-height:120px;resize:vertical;line-height:var(--bd-leading-normal);}

.bdinput-wrap{position:relative;display:flex;align-items:center;}
.bdinput-wrap .bdinput-icon{position:absolute;display:flex;color:var(--bd-text-muted);pointer-events:none;}
.bdinput-wrap .bdinput-icon--lead{left:14px;}
.bdinput-wrap .bdinput-icon--trail{right:14px;}
.bdinput-wrap--lead .bdctrl{padding-left:44px;}
.bdinput-wrap--trail .bdctrl{padding-right:44px;}

.bdselect-wrap{position:relative;}
.bdselect-wrap::after{content:"";position:absolute;right:16px;top:50%;width:9px;height:9px;
  border-right:2px solid var(--bd-text-muted);border-bottom:2px solid var(--bd-text-muted);
  transform:translateY(-65%) rotate(45deg);pointer-events:none;}
select.bdctrl{appearance:none;padding-right:40px;cursor:pointer;}
/* O menu suspenso do <select> é sempre desenhado pelo navegador com fundo
   claro, mesmo quando o campo em si herda cor de texto branca (ex.: filtros
   da dashboard sobre fundo escuro) — sem isto o texto das opções ficava
   ilegível (branco sobre branco) exceto na opção em hover/selecionada. */
select.bdctrl option{color:var(--bd-navy-900);background:#fff;}

/* checkbox + radio */
.bdcheck{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-family:var(--bd-font-text);color:var(--bd-text-body);font-size:var(--bd-text-body);}
.bdcheck input{position:absolute;opacity:0;width:0;height:0;}
.bdcheck__box{flex:0 0 auto;width:22px;height:22px;border:1.5px solid var(--bd-border-strong);
  background:var(--bd-surface-card);display:flex;align-items:center;justify-content:center;
  transition:var(--bd-transition-colors);color:#fff;margin-top:1px;}
.bdcheck__box--cb{border-radius:6px;}
.bdcheck__box--rb{border-radius:50%;}
.bdcheck input:focus-visible + .bdcheck__box{box-shadow:var(--bd-glow-brand);border-color:var(--bd-primary-500);}
.bdcheck input:checked + .bdcheck__box{background:var(--bd-primary-500);border-color:var(--bd-primary-500);}
.bdcheck__box--rb::after{content:"";width:9px;height:9px;border-radius:50%;background:#fff;transform:scale(0);transition:transform var(--bd-duration-fast) var(--bd-ease-spring);}
.bdcheck input:checked + .bdcheck__box--rb::after{transform:scale(1);}
.bdcheck__tick{opacity:0;transition:opacity var(--bd-duration-fast);}
.bdcheck input:checked + .bdcheck__box .bdcheck__tick{opacity:1;}
.bdcheck input:disabled ~ *{opacity:var(--bd-opacity-disabled);}

/* switch */
.bdswitch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--bd-font-text);color:var(--bd-text-body);}
.bdswitch input{position:absolute;opacity:0;width:0;height:0;}
.bdswitch__track{width:46px;height:26px;border-radius:999px;background:var(--bd-neutral-300);
  position:relative;transition:background var(--bd-duration-base) var(--bd-ease-standard);flex:0 0 auto;}
.bdswitch__thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;
  box-shadow:var(--bd-shadow-sm);transition:transform var(--bd-duration-base) var(--bd-ease-spring);}
.bdswitch input:checked + .bdswitch__track{background:var(--bd-primary-500);}
.bdswitch input:checked + .bdswitch__track .bdswitch__thumb{transform:translateX(20px);}
.bdswitch input:focus-visible + .bdswitch__track{box-shadow:var(--bd-glow-brand);}
.bdswitch input:disabled + .bdswitch__track{opacity:var(--bd-opacity-disabled);}
`;
export function injectFormCss() {
  if (typeof document !== 'undefined' && !document.getElementById('bd-forms-css')) {
    const s = document.createElement('style'); s.id = 'bd-forms-css'; s.textContent = FORM_CSS;
    document.head.appendChild(s);
  }
}
