import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './lib/auth.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PropostasList from './pages/propostas/PropostasList.jsx';
import PropostaForm from './pages/propostas/PropostaForm.jsx';
import PropostaDetail from './pages/propostas/PropostaDetail.jsx';
import PropostaPrint from './pages/propostas/PropostaPrint.jsx';
import ContratosList from './pages/contratos/ContratosList.jsx';
import ContratoForm from './pages/contratos/ContratoForm.jsx';
import ContratoDetail from './pages/contratos/ContratoDetail.jsx';
import ContratoPrint from './pages/contratos/ContratoPrint.jsx';
import ClientesList from './pages/clientes/ClientesList.jsx';
import ClienteForm from './pages/clientes/ClienteForm.jsx';
import ClienteDetail from './pages/clientes/ClienteDetail.jsx';
import ClienteContatoForm from './pages/clientes/ClienteContatoForm.jsx';
import Calendario from './pages/calendario/Calendario.jsx';
import EventoForm from './pages/calendario/EventoForm.jsx';
import EventoDetail from './pages/calendario/EventoDetail.jsx';
import TarefasList from './pages/tarefas/TarefasList.jsx';
import TarefasKanban from './pages/tarefas/TarefasKanban.jsx';
import TarefaForm from './pages/tarefas/TarefaForm.jsx';
import TarefaDetail from './pages/tarefas/TarefaDetail.jsx';

// Carregadas sob demanda: seções acessadas com pouca frequência (histórico
// de versão, assinatura, configurações administrativas, busca, notificações)
// não precisam entrar no bundle inicial de todo mundo.
const PropostaVersoes = lazy(() => import('./pages/propostas/PropostaVersoes.jsx'));
const ContratoAssinatura = lazy(() => import('./pages/contratos/ContratoAssinatura.jsx'));
const Configuracoes = lazy(() => import('./pages/configuracoes/Configuracoes.jsx'));
const GoogleCalendarConfig = lazy(() => import('./pages/configuracoes/GoogleCalendarConfig.jsx'));
const ConfiguracoesEmpresa = lazy(() => import('./pages/configuracoes/ConfiguracoesEmpresa.jsx'));
const UsuariosList = lazy(() => import('./pages/configuracoes/UsuariosList.jsx'));
const PerfisPermissoes = lazy(() => import('./pages/configuracoes/PerfisPermissoes.jsx'));
const AutomacoesConfig = lazy(() => import('./pages/configuracoes/AutomacoesConfig.jsx'));
const AssinaturaConfig = lazy(() => import('./pages/configuracoes/AssinaturaConfig.jsx'));
const DadosDemoConfig = lazy(() => import('./pages/configuracoes/DadosDemoConfig.jsx'));
const BuscaResultados = lazy(() => import('./pages/busca/BuscaResultados.jsx'));
const NotificacoesCentro = lazy(() => import('./pages/notificacoes/NotificacoesCentro.jsx'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rotas de impressão: protegidas, mas sem sidebar/topbar */}
          <Route path="/propostas/:id/pdf" element={<ProtectedRoute><PropostaPrint /></ProtectedRoute>} />
          <Route path="/contratos/:id/pdf" element={<ProtectedRoute><ContratoPrint /></ProtectedRoute>} />

          <Route
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <AppShell />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="clientes" element={<ClientesList />} />
            <Route path="clientes/novo" element={<ClienteForm />} />
            <Route path="clientes/:id" element={<ClienteDetail />} />
            <Route path="clientes/:id/editar" element={<ClienteForm />} />
            <Route path="clientes/:id/contatos/novo" element={<ClienteContatoForm />} />
            <Route path="clientes/:id/contatos/:contatoId/editar" element={<ClienteContatoForm />} />

            <Route path="propostas" element={<PropostasList />} />
            <Route path="propostas/nova" element={<PropostaForm />} />
            <Route path="propostas/:id" element={<PropostaDetail />} />
            <Route path="propostas/:id/editar" element={<PropostaForm />} />
            <Route path="propostas/:id/versoes" element={<PropostaVersoes />} />

            <Route path="contratos" element={<ContratosList />} />
            <Route path="contratos/novo" element={<ContratoForm />} />
            <Route path="contratos/:id" element={<ContratoDetail />} />
            <Route path="contratos/:id/editar" element={<ContratoForm />} />
            <Route path="contratos/:id/assinatura" element={<ContratoAssinatura />} />

            <Route path="calendario" element={<Calendario />} />
            <Route path="calendario/novo" element={<EventoForm />} />
            <Route path="calendario/:id" element={<EventoDetail />} />
            <Route path="calendario/:id/editar" element={<EventoForm />} />

            <Route path="tarefas" element={<TarefasKanban />} />
            <Route path="tarefas/lista" element={<TarefasList />} />
            <Route path="tarefas/nova" element={<TarefaForm />} />
            <Route path="tarefas/:id" element={<TarefaDetail />} />
            <Route path="tarefas/:id/editar" element={<TarefaForm />} />

            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="configuracoes/empresa" element={<ConfiguracoesEmpresa />} />
            <Route path="configuracoes/usuarios" element={<UsuariosList />} />
            <Route path="configuracoes/perfis-acesso" element={<PerfisPermissoes />} />
            <Route path="configuracoes/automacoes" element={<AutomacoesConfig />} />
            <Route path="configuracoes/integracoes/google-calendar" element={<GoogleCalendarConfig />} />
            <Route path="configuracoes/integracoes/assinatura" element={<AssinaturaConfig />} />
            <Route path="configuracoes/dados-demo" element={<DadosDemoConfig />} />

            <Route path="busca" element={<BuscaResultados />} />
            <Route path="notificacoes" element={<NotificacoesCentro />} />
          </Route>
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
