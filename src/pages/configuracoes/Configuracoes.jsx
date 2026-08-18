import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../design-system/components/surfaces/Card.jsx';

const ITEMS = [
  { to: '/configuracoes/empresa', title: 'Empresa', text: 'Dados da BDTECH e textos padrão usados nas propostas.' },
  { to: '/configuracoes/usuarios', title: 'Usuários', text: 'Papéis e ativação dos usuários do sistema.' },
  { to: '/configuracoes/perfis-acesso', title: 'Perfis e permissões', text: 'O que cada papel pode ver, criar, editar ou excluir.' },
  { to: '/configuracoes/automacoes', title: 'Automações', text: 'Prazos usados nos alertas e tarefas automáticas.' },
  { to: '/configuracoes/integracoes/google-calendar', title: 'Google Calendar', text: 'Conectar sua conta Google para sincronizar eventos automaticamente.' },
  { to: '/configuracoes/integracoes/assinatura', title: 'Assinatura eletrônica', text: 'Configurar o provedor de assinatura eletrônica de contratos.' },
  { to: '/configuracoes/dados-demo', title: 'Dados de demonstração', text: 'Ver e remover os dados fictícios de exemplo.' },
];

export default function Configuracoes() {
  return (
    <div className="bd-u-flex-col bd-u-gap-4">
      <h1 style={{ fontSize: 22 }}>Configurações</h1>
      <div className="bd-u-grid-2 bd-u-gap-4">
        {ITEMS.map((item) => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <Card interactive padding="lg">
              <strong style={{ fontFamily: 'var(--bd-font-display)' }}>{item.title}</strong>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--bd-text-muted)' }}>{item.text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
