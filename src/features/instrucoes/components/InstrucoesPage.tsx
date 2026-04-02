// src/features/instrucoes/components/InstrucoesPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { Plus, FileText, Layers } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useUserStore } from '@/store/useUserStore';
import { InstrucaoApiResponse, QueryInstrucoesApiParams, DashboardInstrucoesDto } from '@/services/instrucoes.services';
import { instrucoesTableColumns } from '../config/table-config';
import { useInstrucoesApi } from '../hooks/useInstrucoesApi';
import { useInstrucoesFilters } from '../hooks/useInstrucoesFilters';
import { InstrucoesBreadcrumb } from './InstrucoesBreadcrumb';
import { InstrucoesDashboard } from './InstrucoesDashboard';
import { InstrucoesModal } from './InstrucoesModal';
import { AdicionarAoPlanoModal } from './AdicionarAoPlanoModal';

const initialFilters: QueryInstrucoesApiParams = {
  search: '',
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  sort_order: 'desc'
};

const initialDashboard: DashboardInstrucoesDto = {
  total_instrucoes: 0,
  instrucoes_ativas: 0,
  instrucoes_inativas: 0,
  instrucoes_em_revisao: 0,
  instrucoes_arquivadas: 0,
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
  media_tempo_por_instrucao: 0,
  media_criticidade: 0,
  total_sub_instrucoes: 0,
  total_recursos: 0,
  total_tarefas_derivadas: 0
};

export function InstrucoesPage() {
  const { user } = useUserStore();

  const [filters, setFilters] = useState<QueryInstrucoesApiParams>(initialFilters);
  const [dashboardData, setDashboardData] = useState<DashboardInstrucoesDto>(initialDashboard);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const { filterConfig, formFields } = useInstrucoesFilters();
  const {
    loading,
    instrucoes,
    totalPages,
    currentPage,
    total,
    createInstrucao,
    updateInstrucao,
    getInstrucao,
    fetchInstrucoes,
    getDashboard,
    uploadAnexo
  } = useInstrucoesApi();
  const { modalState, openModal, closeModal: originalCloseModal } = useGenericModal<InstrucaoApiResponse>();
  const [planoModal, setPlanoModal] = useState<{ isOpen: boolean; instrucaoId: string | null; instrucaoNome?: string }>({
    isOpen: false, instrucaoId: null
  });

  const closeModal = () => {
    setPendingFiles([]);
    originalCloseModal();
  };

  useEffect(() => {
    loadData();
    loadDashboard();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      await fetchInstrucoes(filters);
    } catch (error) {
      console.error('Erro ao carregar instrucoes:', error);
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
      const readOnlyFields = [
        'id', 'created_at', 'updated_at', 'deleted_at',
        'total_sub_instrucoes', 'total_recursos', 'total_anexos',
        'total_tarefas_derivadas', 'usuario_criador', 'usuario_atualizador',
        'criado_por', 'atualizado_por', 'anexos'
      ];

      const cleanData = { ...data };
      readOnlyFields.forEach(field => delete cleanData[field]);

      let instrucaoId: string;

      if (modalState.mode === 'create') {
        if (!user?.id) {
          alert('Erro: Usuario nao autenticado. Faca login para criar instrucoes.');
          return;
        }

        const instrucaoData = {
          ...cleanData,
          criado_por: user.id
        };

        const novaInstrucao = await createInstrucao(instrucaoData);
        instrucaoId = novaInstrucao.id;

        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            try {
              await uploadAnexo(instrucaoId, file, `Anexo: ${file.name}`);
            } catch (uploadError) {
              console.error(`Erro no upload de ${file.name}:`, uploadError);
            }
          }
          setPendingFiles([]);
        }
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateInstrucao(modalState.entity.id, cleanData);
      }

      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar instrucao:', error);
    }
  };

  const handleView = async (instrucao: InstrucaoApiResponse) => {
    try {
      const completa = await getInstrucao(instrucao.id);
      openModal('view', completa);
    } catch (error) {
      console.error('Erro ao carregar dados completos da instrucao:', error);
      openModal('view', instrucao);
    }
  };

  const handleEdit = async (instrucao: InstrucaoApiResponse) => {
    try {
      const completa = await getInstrucao(instrucao.id);
      openModal('edit', completa);
    } catch (error) {
      console.error('Erro ao carregar dados completos da instrucao:', error);
      openModal('edit', instrucao);
    }
  };

  const handleFilterChange = async (newFilters: Partial<QueryInstrucoesApiParams>) => {
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

  const handleAdicionarAoPlano = (instrucao: InstrucaoApiResponse) => {
    setPlanoModal({
      isOpen: true,
      instrucaoId: instrucao.id,
      instrucaoNome: instrucao.tag ? `${instrucao.tag} - ${instrucao.nome}` : instrucao.nome
    });
  };

  const handlePlanoSuccess = async () => {
    await loadData();
    await loadDashboard();
  };

  const customActions = useMemo(() => [
    {
      key: 'adicionar_ao_plano',
      label: 'Adicionar ao Plano',
      icon: <Layers className="h-4 w-4" />,
      handler: handleAdicionarAoPlano,
      condition: (instrucao: InstrucaoApiResponse) => instrucao.status === 'ATIVA',
    }
  ], []);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <InstrucoesBreadcrumb />

          <TitleCard
            title="Instrucoes de Manutencao"
            description="Gerencie templates de instrucoes para tarefas de manutencao"
          />

          <InstrucoesDashboard data={dashboardData} />

          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4 md:mb-6 lg:items-start">
            <div className="flex-1">
              <BaseFilters filters={filters} config={filterConfig} onFilterChange={handleFilterChange} />
            </div>
            <button onClick={() => openModal('create')} className="btn-minimal-primary w-full lg:w-auto lg:mt-0 whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Instrucao</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <BaseTable
              data={instrucoes}
              columns={instrucoesTableColumns}
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
              emptyMessage="Nenhuma instrucao encontrada."
              emptyIcon={<FileText className="h-8 w-8 text-muted-foreground/50" />}
              customActions={customActions}
            />
          </div>
        </div>

        <InstrucoesModal
          isOpen={modalState.isOpen}
          mode={modalState.mode as 'create' | 'edit' | 'view'}
          entity={modalState.entity}
          formFields={formFields}
          pendingFiles={pendingFiles}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFilesChange={setPendingFiles}
        />

        <AdicionarAoPlanoModal
          isOpen={planoModal.isOpen}
          instrucaoId={planoModal.instrucaoId}
          instrucaoNome={planoModal.instrucaoNome}
          onClose={() => setPlanoModal({ isOpen: false, instrucaoId: null })}
          onSuccess={handlePlanoSuccess}
        />
      </Layout.Main>
    </Layout>
  );
}
