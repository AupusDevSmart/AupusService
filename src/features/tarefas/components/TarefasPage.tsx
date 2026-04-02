// src/features/tarefas/components/TarefasPage.tsx - REFATORADA
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { Plus, Tag } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useUserStore } from '@/store/useUserStore';
import { TarefaApiResponse, QueryTarefasApiParams, DashboardTarefasDto } from '@/services/tarefas.services';
import { tarefasTableColumns } from '../config/table-config';
import { useTarefasApi } from '../hooks/useTarefasApi';
import { useTarefasFilters } from '../hooks/useTarefasFilters';
import { TarefasBreadcrumb } from './TarefasBreadcrumb';
import { TarefasDashboard } from './TarefasDashboard';
import { TarefasAlerts } from './TarefasAlerts';
import { TarefasModal } from './TarefasModal';

const initialFilters: QueryTarefasApiParams = {
  search: '',
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  sort_order: 'desc'
};

const initialDashboard: DashboardTarefasDto = {
  total_tarefas: 0,
  tarefas_ativas: 0,
  tarefas_inativas: 0,
  tarefas_atrasadas: 0,
  tarefas_em_revisao: 0,
  tarefas_arquivadas: 0,
  criticidade_muito_alta: 0,
  criticidade_alta: 0,
  criticidade_media: 0,
  criticidade_baixa: 0,
  criticidade_muito_baixa: 0,
  distribuicao_tipos: {
    preventiva: 0,
    preditiva: 0,
    corretiva: 0,
    inspecao: 0,
    visita_tecnica: 0
  },
  distribuicao_categorias: {
    mecanica: 0,
    eletrica: 0,
    instrumentacao: 0,
    lubrificacao: 0,
    limpeza: 0,
    inspecao: 0,
    calibracao: 0,
    outros: 0
  },
  tempo_total_estimado: 0,
  media_tempo_por_tarefa: 0,
  media_criticidade: 0,
  total_sub_tarefas: 0,
  total_recursos: 0
};

export function TarefasPage() {
  const [searchParams] = useSearchParams();
  const planoIdFiltro = searchParams.get('planoId');
  const { user } = useUserStore(); // Pegar usuário logado do Zustand store

  // Estados
  const [filters, setFilters] = useState<QueryTarefasApiParams & { planta_id?: string; unidade_id?: string }>({
    ...initialFilters,
    plano_id: planoIdFiltro || undefined
  });
  const [dashboardData, setDashboardData] = useState<DashboardTarefasDto>(initialDashboard);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Hooks
  const handleAnexosCopied = useCallback((files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
  }, []);
  const { filterConfig, formFields, loadFilterOptions } = useTarefasFilters(initialFilters, handleAnexosCopied);
  const {
    loading,
    tarefas,
    totalPages,
    currentPage,
    total,
    createTarefa,
    updateTarefa,
    getTarefa,
    fetchTarefas,
    getDashboard,
    uploadAnexo
  } = useTarefasApi();
  const { modalState, openModal, closeModal: originalCloseModal } = useGenericModal<TarefaApiResponse>();

  // Wrapper para closeModal que limpa arquivos pendentes
  const closeModal = () => {
    setPendingFiles([]);
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

  const loadData = async () => {
    try {
      await fetchTarefas(filters);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
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

  const handleSuccess = async () => {
    closeModal();
    await loadData();
    await loadDashboard();
  };

  const handleSubmit = async (data: any) => {
    try {
      let tarefaId: string;

      if (modalState.mode === 'create') {
        // Validar se o usuário está logado
        if (!user?.id) {
          alert('Erro: Usuário não autenticado. Faça login para criar tarefas.');
          return;
        }

        // Adicionar criado_por automaticamente
        const tarefaData = {
          ...data,
          tempo_estimado: Math.round((Number(data.duracao_estimada) || 0) * 60),
          criado_por: user.id
        };

        const novaTarefa = await createTarefa(tarefaData);
        tarefaId = novaTarefa.id;

        // Upload de arquivos pendentes
        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            try {
              await uploadAnexo(tarefaId, file, `Anexo: ${file.name}`);
            } catch (uploadError) {
              console.error(`Erro no upload de ${file.name}:`, uploadError);
            }
          }
          setPendingFiles([]);
        }
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateTarefa(modalState.entity.id, {
          ...data,
          tempo_estimado: Math.round((Number(data.duracao_estimada) || 0) * 60),
        });
      }

      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const handleView = async (tarefa: TarefaApiResponse) => {
    // Abre o modal imediatamente com os dados da tabela
    openModal('view', tarefa);

    // Busca dados completos em background para atualizar o modal
    try {
      const tarefaCompleta = await getTarefa(tarefa.id);
      openModal('view', tarefaCompleta);
    } catch (error) {
      console.error('Erro ao carregar dados completos da tarefa:', error);
    }
  };

  const handleEdit = async (tarefa: TarefaApiResponse) => {
    // ⚡ OTIMIZAÇÃO: Abre o modal IMEDIATAMENTE com os dados da tabela
    openModal('edit', tarefa);

    // Busca dados completos em background e atualiza o modal automaticamente
    try {
      const tarefaCompleta = await getTarefa(tarefa.id);
      openModal('edit', tarefaCompleta);
    } catch (error) {
      console.error('Erro ao carregar dados completos da tarefa:', error);
      // Modal já está aberto com dados básicos, usuário pode continuar
    }
  };

  const handleFilterChange = async (
    newFilters: Partial<QueryTarefasApiParams & { planta_id?: string; unidade_id?: string }>
  ) => {
    // Se mudou a planta, recarregar unidades e planos
    if ('planta_id' in newFilters) {
      const plantaId = newFilters.planta_id === 'all' ? undefined : newFilters.planta_id;
      setFilters(prev => ({
        ...prev,
        planta_id: plantaId,
        unidade_id: undefined,
        plano_id: undefined,
        page: 1
      }));
      await loadFilterOptions(plantaId, undefined);
      return;
    }

    // Se mudou a unidade, recarregar planos
    if ('unidade_id' in newFilters) {
      const unidadeId = newFilters.unidade_id === 'all' ? undefined : newFilters.unidade_id;
      setFilters(prev => ({
        ...prev,
        unidade_id: unidadeId,
        plano_id: undefined,
        page: 1
      }));
      await loadFilterOptions(filters.planta_id, unidadeId);
      return;
    }

    // Outros filtros
    const cleanedFilters = { ...newFilters };
    Object.keys(cleanedFilters).forEach(key => {
      if (cleanedFilters[key as keyof typeof cleanedFilters] === 'all') {
        cleanedFilters[key as keyof typeof cleanedFilters] = undefined as any;
      }
    });

    setFilters(prev => ({ ...prev, ...cleanedFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterAtrasadas = () => {
    setFilters(prev => ({
      ...prev,
      status_atrasada: true,
      page: 1
    }));
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Breadcrumb */}
          <TarefasBreadcrumb planoIdFiltro={planoIdFiltro} />

          {/* Header */}
          <TitleCard
            title="Tarefas de Manutenção"
            description="Gerencie tarefas de manutenção preventiva, preditiva e corretiva"
          />

          {/* Dashboard */}
          <TarefasDashboard data={dashboardData} />

          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1">
              <BaseFilters filters={filters} config={filterConfig} onFilterChange={handleFilterChange} />
            </div>
            <button onClick={() => openModal('create')} className="btn-minimal-primary w-full lg:w-auto lg:mt-0 whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Tarefa Manual</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>

          {/* Alertas */}
          <TarefasAlerts
            tarefasAtrasadas={dashboardData.tarefas_atrasadas}
            onFilterAtrasadas={handleFilterAtrasadas}
          />

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={tarefas}
              columns={tarefasTableColumns}
              pagination={{
                page: currentPage,
                limit: filters.limit || 10,
                total,
                totalPages
              }}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhuma tarefa encontrada."
              emptyIcon={<Tag className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* Modal */}
        <TarefasModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={modalState.entity}
          formFields={formFields}
          pendingFiles={pendingFiles}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFilesChange={setPendingFiles}
        />
      </Layout.Main>
    </Layout>
  );
}
