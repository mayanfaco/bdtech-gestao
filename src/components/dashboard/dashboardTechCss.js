/* Scoped "tecnológica" visual treatment for the Dashboard — injected once.
   Reuses existing BDTECH tokens (gradients/glass/navy) rather than inventing
   new colors, so it stays consistent with the rest of the design system. */
const CSS = `
.bd-dash-page{position:relative;overflow:hidden;
  margin:calc(var(--bd-space-8) * -1);padding:var(--bd-space-8);min-height:calc(100vh - 72px);
  background:var(--bd-navy-900);
  --bd-text-body: rgba(255,255,255,.86);
  --bd-text-muted: rgba(255,255,255,.58);
  --bd-text-subtle: rgba(255,255,255,.40);
  --bd-text-strong: #ffffff;
  --bd-surface-card: rgba(255,255,255,.05);
  --bd-surface-sunken: rgba(255,255,255,.08);
  --bd-border-subtle: rgba(255,255,255,.10);
  --bd-border-default: rgba(255,255,255,.16);
  --bd-primary-600: var(--bd-accent-400);
  --bd-primary-700: var(--bd-accent-300);}
.bd-dash-page::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
  background-size:42px 42px;}
.bd-dash-page > *{position:relative;z-index:1;}
.bd-dash-page .bdcard{-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  box-shadow:0 8px 28px rgba(1,25,51,.35);}
.bd-dash-page .bdcard--interactive:hover{border-color:rgba(255,255,255,.22);}

.bd-dash-hero{position:relative;overflow:hidden;border-radius:var(--bd-radius-lg);
  background:rgba(255,255,255,.045);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
  border:1px solid rgba(255,255,255,.12);padding:var(--bd-space-6) var(--bd-space-8);
  box-shadow:0 12px 30px rgba(1,25,51,.4);}
.bd-dash-hero::before{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(rgba(255,255,255,.09) 1px, transparent 1px);
  background-size:20px 20px;opacity:.6;}
.bd-dash-hero::after{content:"";position:absolute;top:var(--bd-space-5);right:var(--bd-space-6);width:6px;height:6px;
  border-radius:50%;z-index:2;background:var(--bd-accent-400);
  box-shadow:0 0 6px 2px rgba(0,159,224,.65),0 0 16px 6px rgba(0,159,224,.28);}
.bd-dash-hero__glow{position:absolute;inset:-40% -10% auto auto;width:60%;height:180%;
  background:var(--bd-gradient-glow);pointer-events:none;}
.bd-dash-hero__row{position:relative;display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:var(--bd-space-4);}
.bd-dash-hero__title{font-family:var(--bd-font-display);font-weight:800;font-size:22px;color:#fff;margin:0;}
.bd-dash-hero__sub{font-size:13px;color:rgba(255,255,255,.72);margin-top:4px;display:flex;align-items:center;gap:8px;}
.bd-dash-live-dot{width:8px;height:8px;border-radius:50%;background:#3DD68C;flex:0 0 auto;
  box-shadow:0 0 0 0 rgba(61,214,140,.7);animation:bd-dash-pulse 2s infinite;}
@keyframes bd-dash-pulse{
  0%{box-shadow:0 0 0 0 rgba(61,214,140,.55);}
  70%{box-shadow:0 0 0 8px rgba(61,214,140,0);}
  100%{box-shadow:0 0 0 0 rgba(61,214,140,0);}
}
.bd-dash-hero__filters{position:relative;display:flex;gap:var(--bd-space-3);flex-wrap:wrap;
  --bd-surface-card: rgba(255,255,255,.06);
  --bd-border-default: rgba(255,255,255,.18);
  --bd-text-strong: rgba(255,255,255,.92);
  --bd-text-subtle: rgba(255,255,255,.4);}
.bd-dash-hero__filters > div{width:190px;}
.bd-dash-hero__filters .bdselect-wrap::after{border-color:rgba(255,255,255,.5);}
.bd-dash-hero__filters .bdctrl:focus{outline:none;border-color:var(--bd-accent-400);
  box-shadow:0 0 0 3px rgba(0,159,224,.35);}

@media (max-width: 900px) {
  .bd-dash-page{margin:calc(var(--bd-space-5) * -1);padding:var(--bd-space-5);}
  .bd-dash-hero{padding:var(--bd-space-5);}
  .bd-dash-hero__row{flex-direction:column;align-items:flex-start;}
  .bd-dash-hero__filters{width:100%;}
  .bd-dash-hero__filters > div{width:100%;flex:1 1 140px;}
}

.bd-dash-section-label{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em;color:var(--bd-text-muted);margin-bottom:var(--bd-space-3);}
.bd-dash-section-label::before{content:"";width:10px;height:10px;border-radius:3px;
  background:var(--bd-gradient-accent-line);flex:0 0 auto;}

.bd-dash-stat{position:relative;overflow:hidden;border-radius:var(--bd-radius-lg);
  --mx:50%;--my:50%;
  background:rgba(255,255,255,.045);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
  padding:var(--bd-space-5) var(--bd-space-6);color:#fff;
  border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 30px rgba(1,25,51,.4);
  transition:border-color var(--bd-duration-base) var(--bd-ease-standard);}
.bd-dash-stat::before{content:"";position:absolute;top:16px;right:16px;width:6px;height:6px;border-radius:50%;z-index:2;
  background:var(--bd-accent-400);box-shadow:0 0 6px 2px rgba(0,159,224,.65),0 0 16px 6px rgba(0,159,224,.28);}
.bd-dash-stat::after{content:"";position:absolute;top:0;left:24px;right:24px;height:1px;
  background:linear-gradient(90deg, transparent, rgba(0,159,224,.55), transparent);}
.bd-dash-stat__spotlight{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:0;
  transition:opacity var(--bd-duration-base) var(--bd-ease-standard);
  background:radial-gradient(220px circle at var(--mx) var(--my), rgba(0,159,224,.22), transparent 70%);}
.bd-dash-stat:hover{border-color:rgba(0,159,224,.38);}
.bd-dash-stat:hover .bd-dash-stat__spotlight{opacity:1;}
.bd-dash-stat--clickable{display:block;text-decoration:none;cursor:pointer;}
.bd-dash-stat--clickable:hover{transform:translateY(-2px);border-color:rgba(0,159,224,.55);}
.bd-dash-stat--clickable:hover .bd-dash-stat__label{color:rgba(0,159,224,.9);}
.bd-dash-stat__label{position:relative;z-index:2;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(255,255,255,.62);}
.bd-dash-stat__value{position:relative;z-index:2;font-family:var(--bd-font-display);font-weight:800;font-size:28px;line-height:1.1;
  margin-top:6px;font-variant-numeric:tabular-nums;color:#fff;}
.bd-dash-stat__hint{position:relative;z-index:2;font-size:11px;color:rgba(255,255,255,.5);margin-top:6px;}

.bd-dash-panel{position:relative;}
.bd-dash-panel::before{content:"";position:absolute;top:var(--bd-space-5);right:var(--bd-space-5);width:6px;height:6px;
  border-radius:50%;z-index:2;background:var(--bd-accent-400);
  box-shadow:0 0 6px 2px rgba(0,159,224,.65),0 0 16px 6px rgba(0,159,224,.28);}
.bd-dash-panel::after{content:"";position:absolute;top:0;left:24px;right:24px;height:1px;z-index:2;
  background:linear-gradient(90deg, transparent, rgba(0,159,224,.55), transparent);}
`;
export function injectDashboardTechCss() {
  if (typeof document !== 'undefined' && !document.getElementById('bd-dash-tech-css')) {
    const s = document.createElement('style');
    s.id = 'bd-dash-tech-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
