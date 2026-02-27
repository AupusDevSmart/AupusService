import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { FeatureWrapper } from './components/common/FeatureWrapper';
import { ConfiguracoesDiasUteisPage, FeriadosPage } from './features/agenda';
// Páginas exclusivas do Service
import { ExecucaoOSPage } from './features/execucao-os';
import { FerramentasPage } from './features/ferramentas/components/FerramentasPage';
import { FornecedoresPage } from './features/fornecedores/components/FornecedoresPage';
import { AssociacaoEquipamentosPage } from './features/planos-manutencao/components/AssociacaoEquipamentosPage';
import { ClonagemPlanosPage } from './features/planos-manutencao/components/ClonagemPlanosPage';
import { PlanosManutencaoPage } from './features/planos-manutencao/components/PlanosManutencaoPage';
import { ProgramacaoOSPage } from './features/programacao-os';
import { ReservasPage } from './features/reservas';
import { TarefasPage } from './features/tarefas/components/TarefasPage';
import { VeiculosPage } from './features/veiculos/components/VeiculosPage';
import { AppTemplate } from './pages/AppTemplate';
import { AnomaliaPage } from './pages/anomalias';
import { DashboardPage } from './pages/dashboard';
import { Settings } from './pages/settings';
import { LoginPage } from './pages/login/LoginPage';
import { useUserStore } from './store/useUserStore';
// ✅ Dashboard de Manutenção
import { MaintenanceDashboard } from './features/maintenance-dashboard';

// ✅ Lazy load para Cadastros (importando direto do NexOn)
const CadastroUsuariosPage = lazy(() =>
  import('@nexon/pages/cadastros/usuarios')
);

const CadastroPlantasPage = lazy(() =>
  import('@nexon/features/plantas/components/PlantasPage').then((module) => ({
    default: module.PlantasPage,
  }))
);

const CadastroUnidadesPage = lazy(() =>
  import('@nexon/pages/cadastros/unidades')
);

const CadastroEquipamentosPage = lazy(() =>
  import('@nexon/features/equipamentos/components/EquipamentosPage').then((module) => ({
    default: module.EquipamentosPage,
  }))
);

const CadastroConcessionariasPage = lazy(() =>
  import('@nexon/features/concessionarias/components/ConcessionariasPage').then((module) => ({
    default: module.ConcessionariasPage,
  }))
);

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
        path: 'dashboard-manutencao',
        element: (
          <FeatureWrapper feature="Dashboard">
            <MaintenanceDashboard />
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
      // ✅ Rotas de Cadastros (mesmo padrão do NexOn)
      {
        path: 'cadastros/usuarios',
        element: (
          <FeatureWrapper feature="Usuarios">
            <Suspense fallback={<div>Carregando...</div>}>
              <CadastroUsuariosPage />
            </Suspense>
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/plantas',
        element: (
          <FeatureWrapper feature="Plantas">
            <Suspense fallback={<div>Carregando...</div>}>
              <CadastroPlantasPage />
            </Suspense>
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/unidades',
        element: (
          <FeatureWrapper feature="Unidades">
            <Suspense fallback={<div>Carregando...</div>}>
              <CadastroUnidadesPage />
            </Suspense>
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/equipamentos',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <Suspense fallback={<div>Carregando...</div>}>
              <CadastroEquipamentosPage />
            </Suspense>
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/concessionarias',
        element: (
          <FeatureWrapper feature="Concessionarias">
            <Suspense fallback={<div>Carregando...</div>}>
              <CadastroConcessionariasPage />
            </Suspense>
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
      {
        path: 'planos-manutencao/clonar',
        element: (
          <FeatureWrapper feature="Equipamentos">
            <ClonagemPlanosPage />
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