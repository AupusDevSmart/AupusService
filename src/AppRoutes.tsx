import { createBrowserRouter, Navigate } from 'react-router-dom';
import { FeatureWrapper } from './components/common/FeatureWrapper';
import { ConfiguracoesDiasUteisPage, FeriadosPage } from './features/agenda';
// Paginas exclusivas do Service
import { ExecucaoOSPage } from './features/execucao-os';
import { FerramentasPage } from './features/ferramentas/components/FerramentasPage';
import { FornecedoresPage } from './features/fornecedores/components/FornecedoresPage';
import { PlanosManutencaoPage } from './features/planos-manutencao/components/PlanosManutencaoPage';
import { PlanoDoEquipamentoWrapper } from './features/planos-manutencao/components/PlanoDoEquipamentoWrapper';
import { HerancaDePlanoSection } from './features/planos-manutencao/components/HerancaDePlanoSection';
import { PlanoDoEquipamentoProvider } from './features/planos-manutencao/components/PlanoDoEquipamentoContext';
import { SeletorDePlanoField } from './features/planos-manutencao/components/SeletorDePlanoField';
import { HistoricoDoEquipamentoSection } from './features/planos-manutencao/components/HistoricoDoEquipamentoSection';
import { ProgramacaoOSPage } from './features/programacao-os';
import { ReservasPage } from './features/reservas';
import { InstrucoesPage } from './features/instrucoes/components/InstrucoesPage';
import { RecursosPage } from './features/recursos/components/RecursosPage';
import { VeiculosPage } from './features/veiculos/components/VeiculosPage';
import { AppTemplate } from './pages/AppTemplate';
import { AnomaliaPage } from './pages/anomalias';
import SolicitacoesServicoPage from './pages/solicitacoes-servico';
import { DashboardPage } from './pages/dashboard';
import PlantaOperadoresPage from './pages/plantas-operadores';
import { Settings } from './pages/settings';
import { LoginPage } from './pages/login/LoginPage';
import { EsqueciSenhaPage } from './pages/esqueci-senha/EsqueciSenhaPage';
import { RedefinirSenhaPage } from './pages/redefinir-senha/RedefinirSenhaPage';
import { useUserStore } from './store/useUserStore';

// Paginas do nucleo (src/core, antes o pacote @aupus/shared-pages)
import {
  EquipamentosPage,
  UsuariosPage,
  PlantasPage,
  ConcessionariasPage,
} from '@/core';

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

  // ✅ Rotas públicas de redefinição de senha
  {
    path: '/esqueci-senha',
    element: <EsqueciSenhaPage />,
  },
  {
    path: '/redefinir-senha',
    element: <RedefinirSenhaPage />,
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
      // Rotas de Cadastros (paginas do nucleo)
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
        path: 'cadastros/equipamentos',
        element: (
          <FeatureWrapper feature="equipamentos.view">
            {/* O plano de manutencao so existe no Service: o NexOn consome a
                mesma pagina do shared-pages sem passar nada aqui.

                A escolha do plano e a lista de tarefas dele sao montadas em
                pontos diferentes do sheet e compartilham o mesmo estado, por
                isso o provider fica acima da pagina inteira. */}
            <PlanoDoEquipamentoProvider>
              <EquipamentosPage
                renderCampoDadosBasicosUC={(equipamento, mode, ctx) => (
                  <SeletorDePlanoField
                    equipamentoId={equipamento?.id ?? null}
                    classificacao={equipamento?.classificacao}
                    somenteLeitura={mode === 'view'}
                    categoriaId={ctx.categoriaId}
                    registrarAcaoPosCriacao={ctx.registrarAcaoPosCriacao}
                  />
                )}
                renderSecaoExtraUC={(equipamento, mode) => (
                  <>
                    {/* Antes das tarefas: se a posicao tinha plano, a decisao de
                        herdar vem antes de olhar uma lista vazia. */}
                    <HerancaDePlanoSection
                      equipamentoId={equipamento?.id ?? null}
                      posicaoId={equipamento?.ativoFuncionalId}
                      classificacao={equipamento?.classificacao}
                      somenteLeitura={mode === 'view'}
                    />
                    <PlanoDoEquipamentoWrapper
                      equipamentoId={equipamento?.id ?? null}
                      classificacao={equipamento?.classificacao}
                      somenteLeitura={mode === 'view'}
                    />
                  </>
                )}
                renderHistoricoUC={(equipamento) => (
                  <HistoricoDoEquipamentoSection
                    equipamentoId={equipamento.id}
                    classificacao={equipamento.classificacao}
                  />
                )}
              />
            </PlanoDoEquipamentoProvider>
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
        path: 'instrucoes',
        element: (
          <FeatureWrapper feature="manutencao.manage">
            <InstrucoesPage />
          </FeatureWrapper>
        ),
      },
      {
        path: 'recursos',
        element: (
          <FeatureWrapper feature="recursos.manage">
            <RecursosPage />
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
      // As telas de associacao em lote e clonagem de planos foram removidas: o
      // plano agora e template de categoria e o vinculo com equipamento sai do
      // sheet do proprio equipamento, copiando o template.
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