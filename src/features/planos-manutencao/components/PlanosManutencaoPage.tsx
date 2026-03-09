// src/features/planos-manutencao/components/PlanosManutencaoPage.tsx - REFATORADA
import { useState, useEffect } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { Plus, Layers } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useUserStore } from '@/store/useUserStore';
import { planosTableColumns } from '../config/table-config';
import { usePlanosManutencaoApi } from '../hooks/usePlanosManutencaoApi';
import { usePlanosFilters } from '../hooks/usePlanosFilters';
import { useTarefasPlano } from '../hooks/useTarefasPlano';
import { usePlanosActions } from '../hooks/usePlanosActions';
import { createPlanosTableActions } from '../config/actions-config';
import {
  PlanoManutencaoApiResponse,
  CreatePlanoManutencaoApiData,
  UpdatePlanoManutencaoApiData,
  DashboardPlanosDto
} from '@/services/planos-manutencao.services';
import { PlanosDashboard } from './PlanosDashboard';
import { PlanosAlerts } from './PlanosAlerts';
import { PlanosModal } from './PlanosModal';

interface PlanosFiltersApi {
  search?: string;
  status?: 'ATIVO' | 'INATIVO' | 'EM_REVISAO' | 'ARQUIVADO';
  ativo?: boolean;
  page?: number;
  limit?: number;
}

const initialFilters: PlanosFiltersApi = {
  search: '',
  page: 1,
  limit: 10
};

const initialDashboard: DashboardPlanosDto = {
  total_planos: 0,
  planos_ativos: 0,
  planos_inativos: 0,
  planos_em_revisao: 0,
  planos_arquivados: 0,
  equipamentos_com_plano: 0,
  total_tarefas_todos_planos: 0,
  media_tarefas_por_plano: 0,
  tempo_total_estimado_geral: 0,
  distribuicao_tipos: {
    preventiva: 0,
    preditiva: 0,
    corretiva: 0,
    inspecao: 0,
    visita_tecnica: 0
  }
};

export function PlanosManutencaoPage() {
  const { user } = useUserStore();

  // Estados locais
  const [filters, setFilters] = useState<PlanosFiltersApi>(initialFilters);
  const [dashboardData, setDashboardData] = useState<DashboardPlanosDto>(initialDashboard);

  // Hooks customizados
  const { filterConfig, formFields, loadFilterOptions } = usePlanosFilters(initialFilters);
  const { tarefas, loading: carregandoTarefas, carregarTarefas, limparTarefas } = useTarefasPlano();
  const {
    loading,
    planos,
    totalPages,
    currentPage,
    total,
    fetchPlanos,
    createPlano,
    updatePlano,
    getDashboard
  } = usePlanosManutencaoApi();

  const { modalState, openModal, closeModal: originalCloseModal } = useGenericModal<PlanoManutencaoApiResponse>();

  // Funções de carregamento
  const loadData = async () => {
    try {
      await fetchPlanos(filters);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadDashboard = async () => {
    try {
      const dashboard = await getDashboard();
      setDashboardData(dashboard);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const reloadAll = async () => {
    await loadData();
    await loadDashboard();
  };

  // Actions hook com callbacks
  const planosActions = usePlanosActions({
    onSuccess: reloadAll,
    onToggleStatus: reloadAll
  });

  // Wrapper para closeModal
  const closeModal = () => {
    limparTarefas();
    originalCloseModal();
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    loadDashboard();
    loadFilterOptions();
  }, []);

  // Recarregar quando filtros mudam
  useEffect(() => {
    loadData();
  }, [filters]);

  // Carregar tarefas quando modal view é aberto
  useEffect(() => {
    if (modalState.isOpen && modalState.mode === 'view' && modalState.entity) {
      if (tarefas.length === 0 && !carregandoTarefas) {
        carregarTarefas(modalState.entity.id);
      }
    }
  }, [modalState.isOpen, modalState.mode, modalState.entity, tarefas.length, carregandoTarefas, carregarTarefas]);

  // Handlers de modal
  const handleSuccess = async () => {
    closeModal();
    await reloadAll();
  };

  const handleSubmit = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        if (!user?.id) {
          alert('Erro: Usuário não autenticado. Faça login para criar planos.');
          return;
        }

        const createData: CreatePlanoManutencaoApiData = {
          equipamento_id: data.equipamento_id,
          nome: data.nome,
          descricao: data.descricao,
          versao: data.versao || '1.0',
          status: data.status || 'ATIVO',
          ativo: data.status === 'ATIVO',
          data_vigencia_inicio: data.data_vigencia_inicio,
          data_vigencia_fim: data.data_vigencia_fim,
          observacoes: data.observacoes,
          criado_por: user.id
        };
        await createPlano(createData);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        const updateData: UpdatePlanoManutencaoApiData = {
          nome: data.nome,
          descricao: data.descricao,
          versao: data.versao,
          status: data.status,
          ativo: data.status === 'ATIVO',
          data_vigencia_inicio: data.data_vigencia_inicio,
          data_vigencia_fim: data.data_vigencia_fim,
          observacoes: data.observacoes
        };
        await updatePlano(modalState.entity.id, updateData);
      }

      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    }
  };

  const handleView = async (plano: PlanoManutencaoApiResponse) => {
    openModal('view', plano);
    await carregarTarefas(plano.id);
  };

  const handleEdit = (plano: PlanoManutencaoApiResponse) => {
    openModal('edit', plano);
    limparTarefas();
  };

  // Filtros
  const handleFilterChange = (newFilters: Partial<PlanosFiltersApi>) => {
    const cleanedFilters = { ...newFilters };
    Object.keys(cleanedFilters).forEach((key) => {
      if (cleanedFilters[key as keyof typeof cleanedFilters] === 'all') {
        cleanedFilters[key as keyof typeof cleanedFilters] = undefined as any;
      }
    });

    setFilters((prev) => ({ ...prev, ...cleanedFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Criar ações customizadas da tabela - apenas visualizar, editar e associar
  const customActions = createPlanosTableActions({
    handleView,
    handleEdit,
    handleAssociarEquipamentos: planosActions.handleAssociarEquipamentos
  }) as any;

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Planos de Manutenção"
            description="Gerencie templates de manutenção para equipamentos similares"
          />

          {/* Dashboard */}
          <PlanosDashboard data={dashboardData} />

          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1">
              <BaseFilters filters={filters} config={filterConfig} onFilterChange={handleFilterChange} />
            </div>
            <button onClick={() => openModal('create')} className="btn-minimal-primary w-full lg:w-auto lg:mt-0 whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Plano</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>

          {/* Alertas */}
          <PlanosAlerts planosInativos={dashboardData.planos_inativos} />

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={planos}
              columns={planosTableColumns}
              pagination={{
                page: currentPage,
                limit: filters.limit || 10,
                total,
                totalPages
              }}
              loading={loading}
              onPageChange={handlePageChange}
              emptyMessage="Nenhum plano de manutenção encontrado."
              emptyIcon={<Layers className="h-8 w-8 text-muted-foreground/50" />}
              customActions={customActions}
            />
          </div>
        </div>

        {/* Modal Principal */}
        <PlanosModal
          isOpen={modalState.isOpen}
          mode={modalState.mode as 'create' | 'edit' | 'view'}
          entity={modalState.entity}
          formFields={formFields}
          tarefas={tarefas}
          carregandoTarefas={carregandoTarefas}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </Layout.Main>
    </Layout>
  );
}
