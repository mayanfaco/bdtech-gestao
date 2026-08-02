// Título da página exibido na Topbar, derivado do caminho da rota.
// Não usamos useMatches()/handle porque este app usa <BrowserRouter> declarativo
// (não um data router criado via createBrowserRouter), e useMatches só funciona
// com data router.
const TITLES = [
  { prefix: '/leads', title: 'Leads' },
  { prefix: '/oportunidades', title: 'Oportunidades' },
  { prefix: '/clientes', title: 'Clientes' },
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
