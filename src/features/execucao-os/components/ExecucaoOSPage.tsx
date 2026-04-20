// src/features/execucao-os/components/ExecucaoOSPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@aupus/shared-pages';
import { BaseFilters } from '@aupus/shared-pages';
import { BaseModal } from '@aupus/shared-pages';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Eye } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';

// Hooks e configurações da feature
import { useExecucaoOSApi } from '../hooks/useExecucaoOSApi';
import { useExecucaoOSFilters } from '../hooks/useExecucaoOSFilters';
import { execucaoOSTableColumns } from '../config/table-config';
import { createExecucaoOSTableActions } from '../config/actions-config';
import { ActionConfirmPanel, type PendingAction } from './ActionConfirmPanel';

// Tipos
import type { ExecucaoOS, ExecucaoOSFilters } from '../types';
import { execucaoOSTransitionsService } from '@/services/execucao-os-transitions.service';
import { toast } from '@/hooks/use-toast';

// Dashboard Component
import { ExecucaoOSDashboard } from './ExecucaoOSDashboard';

// Filtros iniciais
const initialFilters: ExecucaoOSFilters = {
  search: '',
  statusExecucao: 'all',
  tipo: 'all',
  prioridade: 'all',
  page: 1,
  limit: 10,
};

export function ExecucaoOSPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ExecucaoOSFilters>(initialFilters);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Hook de API
  const {
    items,
    loading,
    total,
    totalPages,
    currentPage,
    stats,
    fetchItems,
    fetchOne,
  } = useExecucaoOSApi();

  // Hook de filtros
  const { filterConfigs, formFields, formGroups, toApiParams } = useExecucaoOSFilters(filters);

  // Modal genérico
  const { modalState, openModal, closeModal } = useGenericModal<ExecucaoOS>();

  // ============================
  // View-first action handlers
  // ============================

  const openViewWithAction = async (execucao: ExecucaoOS, action: PendingAction) => {
    try {
      const dadosCompletos = await fetchOne(execucao.id);
      setPendingAction(action);
      openModal('view', dadosCompletos || execucao);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      setPendingAction(action);
      openModal('view', execucao);
    }
  };

  const handleView = (execucao: ExecucaoOS) => {
    openModal('view', execucao);
  };

  const handleEdit = (execucao: ExecucaoOS) => {
    const status = (execucao.statusExecucao || execucao.status)?.toUpperCase();
    if (status === 'FINALIZADA' || status === 'CANCELADA') {
      openModal('view', execucao);
      return;
    }
    openModal('edit', execucao);
  };

  // Confirm action handler - recebe objeto com todos os campos do painel
  const handleConfirmAction = async (data: Record<string, any>) => {
    if (!pendingAction || !modalState.entity) return;

    const entity = modalState.entity;

    try {
      switch (pendingAction) {
        case 'iniciar':
          await execucaoOSTransitionsService.iniciar(entity.id, data);
          break;
        case 'pausar':
          await execucaoOSTransitionsService.pausar(entity.id, {
            motivo_pausa: data.motivo_pausa || '',
            observacoes: data.observacoes,
          });
          break;
        case 'retomar':
          await execucaoOSTransitionsService.retomar(entity.id, data);
          break;
        case 'executar':
          await execucaoOSTransitionsService.executar(entity.id, data as any);
          break;
        case 'auditar':
          await execucaoOSTransitionsService.auditar(entity.id, {
            avaliacao_qualidade: data.avaliacao_qualidade ? Number(data.avaliacao_qualidade) : undefined,
            observacoes_qualidade: data.observacoes_qualidade,
          });
          break;
        case 'finalizar':
          await execucaoOSTransitionsService.finalizar(entity.id, data);
          break;
        case 'cancelar':
          await execucaoOSTransitionsService.cancelar(entity.id, {
            motivo_cancelamento: data.motivo_cancelamento || '',
            observacoes: data.observacoes,
          });
          break;
      }

      const actionLabels: Record<string, string> = {
        iniciar: 'OS iniciada',
        pausar: 'OS pausada',
        retomar: 'OS retomada',
        executar: 'OS executada',
        auditar: 'OS auditada',
        finalizar: 'OS finalizada',
        cancelar: 'OS cancelada',
      };
      toast({ title: actionLabels[pendingAction] || 'Acao realizada' });

      closeModal();
      setPendingAction(null);
      await fetchItems(toApiParams);
    } catch (error) {
      console.error(`Erro ao ${pendingAction}:`, error);
    }
  };

  // Ações da tabela
  const actions = createExecucaoOSTableActions({
    onIniciar: (item) => openViewWithAction(item, 'iniciar'),
    onPausar: (item) => openViewWithAction(item, 'pausar'),
    onRetomar: (item) => openViewWithAction(item, 'retomar'),
    onExecutar: (item) => openViewWithAction(item, 'executar'),
    onAuditar: (item) => openViewWithAction(item, 'auditar'),
    onFinalizar: (item) => openViewWithAction(item, 'finalizar'),
    onCancelar: (item) => openViewWithAction(item, 'cancelar'),
  });

  // Carregar dados ao montar e quando filtros mudarem
  useEffect(() => {
    fetchItems(toApiParams);
  }, [filters]);

  // Abrir modal automaticamente quando vier com execucaoId na URL
  useEffect(() => {
    const execucaoIdParam = searchParams.get('execucaoId');

    if (execucaoIdParam) {
      const abrirModalAutomatico = async () => {
        try {
          let execucaoEncontrada = items.find(exec => exec.id === execucaoIdParam);

          if (!execucaoEncontrada) {
            execucaoEncontrada = await fetchOne(execucaoIdParam);
          }

          if (execucaoEncontrada) {
            openModal('view', execucaoEncontrada);
          }

          setSearchParams({});
        } catch (error) {
          console.error('Erro ao buscar execução para abrir modal:', error);
          setSearchParams({});
        }
      };

      if (items.length > 0 || loading === false) {
        abrirModalAutomatico();
      }
    }
  }, [items, searchParams, loading]);

  // Handlers
  const handleFilterChange = (partial: Partial<ExecucaoOSFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...partial,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSubmit = async (_data: any) => {
    if (!modalState.entity) return;

    try {
      await fetchItems(toApiParams);
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar execução:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  const handleCloseModal = () => {
    setPendingAction(null);
    closeModal();
  };

  const getModalEntity = () => {
    if (!modalState.entity) return null;
    return modalState.entity;
  };

  // Handlers para filtros do dashboard
  const handleFilterAtrasadas = () => {
    setFilters(prev => ({
      ...prev,
      atrasadas: true,
      page: 1,
    }));
  };

  const handleFilterCriticas = () => {
    setFilters(prev => ({
      ...prev,
      prioridade: 'CRITICA',
      page: 1,
    }));
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full space-y-4">
          {/* Header */}
          <TitleCard
            title="Execução de Ordens de Serviço"
            description="Acompanhe e gerencie a execução das ordens de serviço em campo"
          />

          {/* Dashboard */}
          <ExecucaoOSDashboard
            total={total}
            apiStats={stats}
            loading={loading}
            onFilterAtrasadas={handleFilterAtrasadas}
            onFilterCriticas={handleFilterCriticas}
          />

          {/* Filtros e Ações */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex-1 w-full">
              <BaseFilters
                filters={filters}
                config={filterConfigs}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchItems(toApiParams)}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Funcionalidade em breve')}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={items}
              columns={execucaoOSTableColumns}
              customActions={actions.map((action: any) => ({
                key: action.label.toLowerCase().replace(' ', ''),
                label: action.label,
                handler: action.onClick,
                condition: action.condition,
                icon: action.icon ? <action.icon className="h-4 w-4" /> : undefined,
                variant: action.variant,
              }))}
              loading={loading}
              pagination={{
                page: currentPage,
                limit: filters.limit || 10,
                total,
                totalPages,
              }}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhuma execução de OS encontrada."
              emptyIcon={<Eye className="h-12 w-12 text-gray-400" />}
            />
          </div>
        </div>

        {/* Modal Genérico */}
        {modalState.entity && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            entity={getModalEntity()!}
            title={`${modalState.mode === 'view' ? 'Visualizar' : modalState.mode === 'edit' ? 'Editar' : 'Finalizar'} Execução`}
            formFields={formFields}
            groups={formGroups}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            width="w-[1200px]"
            loading={loading}
          >
            {/* Painel de confirmação de ação (view-first pattern) */}
            {pendingAction && modalState.mode === 'view' && (
              <ActionConfirmPanel
                action={pendingAction}
                entity={modalState.entity}
                onConfirm={handleConfirmAction}
              />
            )}
          </BaseModal>
        )}
      </Layout.Main>
    </Layout>
  );
}

export default ExecucaoOSPage;
