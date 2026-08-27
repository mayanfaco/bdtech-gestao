// Título da página exibido na Topbar, derivado do caminho da rota.
// Não usamos useMatches()/handle porque este app usa <BrowserRouter> declarativo
// (não um data router criado via createBrowserRouter), e useMatches só funciona
// com data router.
const TITLES = [
  { prefix: '/clientes', title: 'Clientes' },
  // Mais específico primeiro: /propostas/avulsas não deve casar com /propostas.
  { prefix: '/propostas/avulsas', title: 'Propostas avulsas' },
  { prefix: '/propostas', title: 'Propostas' },
  { prefix: '/contratos', title: 'Contratos' },
  { prefix: '/calendario', title: 'Calendário' },
  { prefix: '/tarefas', title: 'Tarefas' },
  { prefix: '/configuracoes', title: 'Configurações' },
];

export function getPageTitle(pathname) {
  if (pathname === '/') return 'Dashboard';
  const match = TITLES.find((t) => pathname.startsWith(t.prefix));
  return match?.title ?? 'BDTECH Gestão';
}
