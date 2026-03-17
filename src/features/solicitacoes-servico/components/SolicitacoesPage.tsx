// src/features/solicitacoes-servico/components/SolicitacoesPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { BaseModal } from '@nexon/components/common/base-modal/BaseModal';
import { Plus, FilePenLine } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { SolicitacaoServico, SolicitacaoServicoFormData } from '../types';
import { solicitacoesTableColumns } from '../config/table-config';
import { createSolicitacoesTableActions } from '../config/actions-config';
import { useSolicitacoesApi } from '../hooks/useSolicitacoesApi';
import { useSolicitacoesFilters } from '../hooks/useSolicitacoesFilters';
import { useSolicitacoesActions } from '../hooks/useSolicitacoesActions';
import { SolicitacoesDashboard } from './SolicitacoesDashboard';
import { SolicitacoesStats } from '@/services/solicitacoes-servico.service';

const initialFilters = {
  search: '',
  page: 1,
  limit: 10,
};

const initialStats: SolicitacoesStats = {
  total: 0,
  rascunhos: 0,
  aguardando: 0,
  emAnalise: 0,
  aprovadas: 0,
  rejeitadas: 0,
  emExecucao: 0,
  concluidas: 0,
  canceladas: 0,
  urgentes: 0,
  porTipo: {},
  porPrioridade: {},
  taxaAprovacao: 0,
};

export function SolicitacoesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState<SolicitacoesStats>(initialStats);

  const {
    solicitacoes,
    loading,
    total,
    totalPages,
    currentPage,
    fetchSolicitacoes,
    createSolicitacao,
    updateSolicitacao,
    deleteSolicitacao,
    getStats,
    enviar,
    analisar,
    aprovar,
    rejeitar,
    cancelar,
    concluir,
  } = useSolicitacoesApi();

  const { filterConfigs, formFields, loadFilterOptions } = useSolicitacoesFilters(filters);
  const { modalState, openModal, closeModal } = useGenericModal<SolicitacaoServico>();

  const reloadData = async () => {
    await fetchSolicitacoes(filters);
    await loadDashboard();
  };

  const solicitacoesActions = useSolicitacoesActions({
    openModal,
    deleteItem: deleteSolicitacao,
    enviar,
    analisar,
    aprovar,
    rejeitar,
    cancelar,
    concluir,
    onSuccess: reloadData,
  });

  const customActions = useMemo(() => {
    const tableActions = createSolicitacoesTableActions({
      onView: solicitacoesActions.handleView,
      onEdit: solicitacoesActions.handleEdit,
      onDelete: solicitacoesActions.handleDelete,
      onEnviar: solicitacoesActions.handleEnviar,
      onAnalisar: solicitacoesActions.handleAnalisar,
      onAprovar: solicitacoesActions.handleAprovar,
      onRejeitar: solicitacoesActions.handleRejeitar,
      onCancelar: solicitacoesActions.handleCancelar,
      onConcluir: solicitacoesActions.handleConcluir,
    });

    return tableActions
      .filter((action) => action.label !== 'Visualizar' && action.label !== 'Editar')
      .map((action) => {
        const Icon = action.icon;
        return {
          key: action.label.toLowerCase().replace(/\s+/g, '_'),
          label: action.label,
          handler: action.onClick,
          condition: action.condition,
          icon: Icon ? <Icon className="h-4 w-4" /> : undefined,
          variant: action.variant,
        };
      });
  }, [solicitacoesActions]);

  useEffect(() => {
    loadFilterOptions();
    loadData();
    loadDashboard();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      await fetchSolicitacoes(filters);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  };

  const loadDashboard = async () => {
    try {
      const dashboardData = await getStats();
      setStats(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const handleSubmit = async (data: SolicitacaoServicoFormData) => {
    try {
      if (modalState.mode === 'create') {
        await createSolicitacao(data);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateSolicitacao(modalState.entity.id, data);
      }

      closeModal();
      await reloadData();
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      throw error;
    }
  };

  const handleFilterChange = async (newFilters: any) => {
    const cleanedFilters = { ...newFilters };
    Object.keys(cleanedFilters).forEach((key) => {
      if (cleanedFilters[key] === 'all') {
        cleanedFilters[key] = undefined;
      }
    });

    setFilters((prev) => ({ ...prev, ...cleanedFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          <TitleCard
            title="Solicitações de Serviço"
            description="Gerencie e monitore solicitações de serviço"
          />

          <SolicitacoesDashboard data={stats} />

          <div className="flex flex-col gap-3 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start">
              <div className="flex-1 min-w-0">
                <BaseFilters
                  filters={filters}
                  config={filterConfigs}
                  onFilterChange={handleFilterChange}
                />
              </div>
              <button
                onClick={() => openModal('create')}
                className="btn-minimal-primary w-full sm:w-auto whitespace-nowrap flex-shrink-0 justify-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Nova Solicitação</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <BaseTable
              data={solicitacoes}
              columns={solicitacoesTableColumns}
              pagination={{
                page: currentPage,
                limit: filters.limit || 10,
                total,
                totalPages,
              }}
              loading={loading}
              onPageChange={handlePageChange}
              onView={solicitacoesActions.handleView}
              onEdit={solicitacoesActions.handleEdit}
              emptyMessage="Nenhuma solicitação encontrada."
              emptyIcon={<FilePenLine className="h-8 w-8 text-muted-foreground/50" />}
              customActions={customActions}
            />
          </div>
        </div>

        {modalState.isOpen && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            entity={modalState.entity as any}
            title={
              modalState.mode === 'create'
                ? 'Nova Solicitação'
                : modalState.mode === 'edit'
                ? 'Editar Solicitação'
                : 'Visualizar Solicitação'
            }
            icon={<FilePenLine className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
            formFields={formFields}
            onClose={closeModal}
            onSubmit={handleSubmit}
            width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px]"
          />
        )}
      </Layout.Main>
    </Layout>
  );
}
