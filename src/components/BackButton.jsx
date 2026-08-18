import React from 'react';
import { useNavigate } from 'react-router-dom';

const CSS = `
.bd-back-link{display:inline-flex;align-items:center;gap:6px;background:none;border:none;padding:0;
  margin-bottom:var(--bd-space-3);font-family:var(--bd-font-text);font-size:13px;font-weight:600;
  color:var(--bd-text-muted);cursor:pointer;text-decoration:none;}
.bd-back-link:hover{color:var(--bd-primary-600);}
.bd-back-link svg{width:16px;height:16px;}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-back-link-css')) {
  const s = document.createElement('style'); s.id = 'bd-back-link-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

const ArrowLeft = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;

/** Link de retorno persistente no topo da página — sempre visível, independente
    de rolagem, para telas de detalhe/formulário alcançadas a partir de outra
    entidade (cliente → proposta, lead → oportunidade, etc.). */
export function BackButton({ to, label = 'Voltar' }) {
  const navigate = useNavigate();
  function handleClick(e) {
    e.preventDefault();
    if (to) navigate(to);
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }
  return (
    <a href={to ?? '#'} className="bd-back-link" onClick={handleClick}>
      {ArrowLeft}
      {label}
    </a>
  );
}
