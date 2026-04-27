import { createBrowserRouter, Navigate } from 'react-router-dom';
import { FeatureWrapper } from './components/common/FeatureWrapper';
import { ConfiguracoesDiasUteisPage, FeriadosPage } from './features/agenda';
// Paginas exclusivas do Service
import { ExecucaoOSPage } from './features/execucao-os';
import { FerramentasPage } from './features/ferramentas/components/FerramentasPage';
import { FornecedoresPage } from './features/fornecedores/components/FornecedoresPage';
import { AssociacaoEquipamentosPage } from './features/planos-manutencao/components/AssociacaoEquipamentosPage';
import { ClonagemPlanosPage } from './features/planos-manutencao/components/ClonagemPlanosPage';
import { PlanosManutencaoPage } from './features/planos-manutencao/components/PlanosManutencaoPage';
import { ProgramacaoOSPage } from './features/programacao-os';
import { ReservasPage } from './features/reservas';
import { TarefasPage } from './features/tarefas/components/TarefasPage';
import { InstrucoesPage } from './features/instrucoes/components/InstrucoesPage';
import { VeiculosPage } from './features/veiculos/components/VeiculosPage';
import { AppTemplate } from './pages/AppTemplate';
import { AnomaliaPage } from './pages/anomalias';
import SolicitacoesServicoPage from './pages/solicitacoes-servico';
import { DashboardPage } from './pages/dashboard';
import PlantaOperadoresPage from './pages/plantas-operadores';
import { Settings } from './pages/settings';
import { LoginPage } from './pages/login/LoginPage';
import { useUserStore } from './store/useUserStore';

// Shared pages (previously from @nexon, now from @aupus/shared-pages)
import {
  EquipamentosPage,
  UnidadesPage,
  UsuariosPage,
  PlantasPage,
  ConcessionariasPage,
} from '@aupus/shared-pages';

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
          <FeatureWrapper feature="dashboard.view">
            <DashboardPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'configuracoes/perfil',
        index: true,
        element: (
          <FeatureWrapper feature="dashboard.view">
            <Settings />
          </FeatureWrapper>
        )
      },
      // Rotas de Cadastros (from @aupus/shared-pages)
      {
        path: 'cadastros/usuarios',
        element: (
          <FeatureWrapper feature="usuarios.view">
            <UsuariosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/plantas',
        element: (
          <FeatureWrapper feature="plantas.view">
            <PlantasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/plantas/:plantaId/operadores',
        element: (
          <FeatureWrapper feature="plantas.manage_operadores">
            <PlantaOperadoresPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/unidades',
        element: (
          <FeatureWrapper feature="unidades.view">
            <UnidadesPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/equipamentos',
        element: (
          <FeatureWrapper feature="equipamentos.view">
            <EquipamentosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'cadastros/concessionarias',
        element: (
          <FeatureWrapper feature="equipamentos.manage">
            <ConcessionariasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'veiculos',
        element: (
          <FeatureWrapper feature="recursos.manage">
            <VeiculosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'ferramentas',
        element: (
          <FeatureWrapper feature="recursos.manage">
            <FerramentasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'fornecedores',
        element: (
          <FeatureWrapper feature="recursos.manage">
            <FornecedoresPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'anomalias',
        element: (
          <FeatureWrapper feature="anomalias.view">
            <AnomaliaPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'solicitacoes-servico',
        element: (
          <FeatureWrapper feature="manutencao.manage">
            <SolicitacoesServicoPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'tarefas',
        element: (
          <FeatureWrapper feature="manutencao.manage">
            <TarefasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'instrucoes',
        element: (
          <FeatureWrapper feature="manutencao.manage">
            <InstrucoesPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'programacao-os',
        element: (
          <FeatureWrapper feature="programacao_os.view">
            <ProgramacaoOSPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'reservas',
        element: (
          <FeatureWrapper feature="recursos.manage">
            <ReservasPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'execucao-os',
        element: (
          <FeatureWrapper feature="execucao_os.view">
            <ExecucaoOSPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'planos-manutencao',
        element: (
          <FeatureWrapper feature="manutencao.manage">
            <PlanosManutencaoPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'planos-manutencao/associar',
        element: (
          <FeatureWrapper feature="manutencao.manage">
            <AssociacaoEquipamentosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'planos-manutencao/clonar',
        element: (
          <FeatureWrapper feature="manutencao.manage">
            <ClonagemPlanosPage />
          </FeatureWrapper>
        ),
      },
      // ✅ NOVA: Rotas para agenda
      {
        path: 'agenda/feriados',
        element: (
          <FeatureWrapper feature="agenda.manage">
            <FeriadosPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'agenda/configuracoes-dias-uteis',
        element: (
          <FeatureWrapper feature="agenda.manage">
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