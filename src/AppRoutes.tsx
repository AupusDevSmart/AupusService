import { createBrowserRouter, Navigate } from 'react-router-dom';
import { FeatureWrapper } from './components/common/FeatureWrapper';
import { ConfiguracoesDiasUteisPage, FeriadosPage } from './features/agenda';
import { EquipamentosPage } from './features/equipamentos/components/EquipamentosPage';
import { ExecucaoOSPage } from './features/execucao-os';
import { FerramentasPage } from './features/ferramentas/components/FerramentasPage';
import { FornecedoresPage } from './features/fornecedores/components/FornecedoresPage';
import { AssociacaoEquipamentosPage } from './features/planos-manutencao/components/AssociacaoEquipamentosPage';
import { PlanosManutencaoPage } from './features/planos-manutencao/components/PlanosManutencaoPage';
import { PlantasPage } from './features/plantas/components/PlantasPage';
import { ProgramacaoOSPage } from './features/programacao-os';
import { ReservasPage } from './features/reservas';
import { TarefasPage } from './features/tarefas/components/TarefasPage';
import { UnidadesPage } from './features/unidades/components/UnidadesPage';
import { UsuariosPage } from './features/usuarios/components/UsuariosPage';
import { VeiculosPage } from './features/veiculos/components/VeiculosPage';
import { AppTemplate } from './pages/AppTemplate';
import { AnomaliaPage } from './pages/anomalias';
import { DashboardPage } from './pages/dashboard';
import { Settings } from './pages/settings';
import { LoginPage } from './pages/login/LoginPage';
import { useUserStore } from './store/useUserStore';

/**
 * Componente de rota protegida
 * Verifica se o usuário está autenticado antes de renderizar
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();

  if (!user?.id) {
    const currentPath = window.location.pathname;
    return <Navigate to={`/login?redirectTo=${currentPath}`} replace />;
  }

  return <>{children}</>;
}

export const appRoutes = createBrowserRouter([
  // ✅ Rota pública de login
  {
    path: '/login',
    element: <LoginPage />,
  },

  // ✅ Rotas protegidas
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppTemplate />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <FeatureWrapper feature="Dashboard">
            <DashboardPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'configuracoes/perfil',
        index: true,
        element: (
          <FeatureWrapper feature="Configuracoes">
            <Settings />
          </FeatureWrapper>
        )
      },
      // ✅ NOVA: Rota para usuários
      {
        path: 'usuarios',
        element: (
          <FeatureWrapper feature="Usuarios">
            <UsuariosPage />
          </FeatureWrapper>
        ),
      },
      // ✅ NOVA: Rota para plantas
      {
        path: 'plantas',
        element: (
          <FeatureWrapper feature="Plantas">
            <PlantasPage />
          </FeatureWrapper>
        ),
      },
      // ✅ NOVA: Rota para unidades
      {
        path: 'unidades',
        element: (
          <FeatureWrapper feature="Unidades">
            <UnidadesPage />
          </FeatureWrapper>
        ),
      },
      // ✅ NOVA: Rota para equipamentos
      {
        path: 'equipamentos',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <EquipamentosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'veiculos',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <VeiculosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'ferramentas',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <FerramentasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'fornecedores',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <FornecedoresPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'anomalias',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <AnomaliaPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'tarefas',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <TarefasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'programacao-os',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <ProgramacaoOSPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'reservas',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <ReservasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'execucao-os',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <ExecucaoOSPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'planos-manutencao',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <PlanosManutencaoPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'planos-manutencao/associar',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <AssociacaoEquipamentosPage />
          </FeatureWrapper>
        ),
      },
      // ✅ NOVA: Rotas para agenda
      {
        path: 'agenda/feriados',
        element: (
          <FeatureWrapper feature="Agenda">
            <FeriadosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'agenda/configuracoes-dias-uteis',
        element: (
          <FeatureWrapper feature="Agenda">
            <ConfiguracoesDiasUteisPage />
          </FeatureWrapper>
        ),
      },
    ],
  },

  // ✅ Rota 404 - Redireciona para login
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);