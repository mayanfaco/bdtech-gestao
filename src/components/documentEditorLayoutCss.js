/* Layout compartilhado dos editores de Proposta/Contrato (faixa de campos à
   esquerda + prévia do documento à direita). A faixa de campos fica na própria
   página (sem card), fixa na lateral, com scroll só dentro dela e um rodapé
   fixo com o botão de salvar sempre visível. Injetado uma única vez. */
const CSS = `
.bd-doc-editor{display:flex;gap:var(--bd-space-6);align-items:flex-start;}

.bd-doc-editor__form{flex:0 0 380px;max-width:380px;position:sticky;top:96px;
  align-self:flex-start;display:flex;flex-direction:column;height:calc(100vh - 190px);min-height:340px;}
.bd-doc-editor__form-scroll{flex:1 1 auto;overflow-y:auto;min-height:0;padding-right:10px;}
.bd-doc-editor__form-footer{flex:0 0 auto;margin-top:var(--bd-space-3);padding-top:var(--bd-space-4);
  border-top:1px solid var(--bd-border-default);background:var(--bd-surface-page);
  display:flex;gap:var(--bd-space-3);align-items:center;}

.bd-doc-editor__preview{flex:1;min-width:0;background:var(--bd-neutral-200);border-radius:var(--bd-radius-lg);padding:var(--bd-space-6);}

@media (max-width: 1024px) {
  .bd-doc-editor{flex-direction:column;}
  .bd-doc-editor__form{flex:1 1 auto;max-width:none;width:100%;position:static;max-height:none;}
  .bd-doc-editor__form-scroll{overflow:visible;padding-right:0;}
  .bd-doc-editor__form-footer{position:sticky;bottom:0;background:var(--bd-surface-page);padding-bottom:var(--bd-space-3);}
  .bd-doc-editor__preview{width:100%;padding:var(--bd-space-4);}
}
`;
export function injectDocumentEditorLayoutCss() {
  if (typeof document !== 'undefined' && !document.getElementById('bd-doc-editor-css')) {
    const s = document.createElement('style');
    s.id = 'bd-doc-editor-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
