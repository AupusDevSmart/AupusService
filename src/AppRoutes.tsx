import { Navigate, createBrowserRouter } from 'react-router-dom';
// import { Login } from './pages/login';
import { AppTemplate } from './pages/AppTemplate';
import { FeatureWrapper } from './components/common/FeatureWrapper';
import { DefaultRedirect } from './components/common/default-redirect';
import { DashboardPage } from './pages/dashboard'; // Importando o novo componente
import { Settings } from './pages/settings';
import { PlantasPage } from './features/plantas/components/PlantasPage';
import { EquipamentosPage } from './features/equipamentos/components/EquipamentosPage';
import { UsuariosPage } from './features/usuarios/components/UsuariosPage'; // ✅ NOVA IMPORTAÇÃO
import { VeiculosPage } from './features/veiculos/components/VeiculosPage';
import { FerramentasPage } from './features/ferramentas/components/FerramentasPage';
import { FornecedoresPage } from './features/fornecedores/components/FornecedoresPage';
import { AnomaliaPage } from './pages/anomalias';
import { TarefasPage } from './features/tarefas/components/TarefasPage';
import { ProgramacaoOSPage } from './pages/programacao-os';
import { ReservasPage } from './features/reservas';
import { ExecucaoOSPage } from './features/execucao-os/components/ExecucaoOSPage';
import { PlanosManutencaoPage } from './features/planos-manutencao/components/PlanosManutencaoPage';
import { AssociacaoEquipamentosPage } from './features/planos-manutencao/components/AssociacaoEquipamentosPage';

export const appRoutes = createBrowserRouter([
//   {
//     path: '/login',
//     element: <Login />,
//   },
//   {
//     path: '/reset-password',
//     element: <ResetPassword />,
//   },
  {
    path: '/',
    element: <AppTemplate />,
    children: [
      // {
      //   index: true,
      //   element: <DefaultRedirect />,
      // },
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
    ],
  },
]);