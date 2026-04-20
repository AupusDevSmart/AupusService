// src/features/anomalias/components/AnomaliasPage.tsx - REFATORADA
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@aupus/shared-pages';
import { BaseFilters } from '@aupus/shared-pages';
import { BaseModal } from '@aupus/shared-pages';
import { Plus, AlertTriangle } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Anomalia, AnomaliaFormData } from '../types';
import { anomaliasTableColumns } from '../config/table-config';
import { createAnomaliasTableActions } from '../config/actions-config';
import { useAnomaliasApi } from '../hooks/useAnomaliasApi';
import { useAnomaliasFilters } from '../hooks/useAnomaliasFilters';
import { useAnomaliasActions } from '../hooks/useAnomaliasActions';
import { AnomaliasDashboard } from './AnomaliasDashboard';
import { AnomaliasStats } from '@/services/anomalias.service';

const initialFilters = {
  search: '',
  page: 1,
  limit: 10,
};

const initialStats: AnomaliasStats = {
  total: 0,
  registradas: 0,
  programadas: 0,
  finalizadas: 0,
  criticas: 0,
};

export function AnomaliasPage() {
  // Estados
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState<AnomaliasStats>(initialStats);

  // Hook de API
  const {
    anomalias,
    loading,
    total,
    totalPages,
    currentPage,
    fetchAnomalias,
    createAnomalia,
    updateAnomalia,
    deleteAnomalia,
    getStats,
  } = useAnomaliasApi();

  // Hook de filtros
  const { filterConfigs, formFields, loadFilterOptions, loadUnidadesForPlanta } =
    useAnomaliasFilters(filters);

  // Modal
  const { modalState, openModal, closeModal } = useGenericModal<Anomalia>();

  // Função de recarga
  const reloadData = async () => {
    await fetchAnomalias(filters);
    await loadDashboard();
  };

  // Hook de ações
  const anomaliasActions = useAnomaliasActions({
    openModal,
    deleteItem: async (id: string) => {
      await deleteAnomalia(id);
      return true;
    },
    onSuccess: reloadData,
  });

  // Ações customizadas (além das padrões View/Edit)
  const customActions = useMemo(() => {
    const tableActions = createAnomaliasTableActions({
      onView: anomaliasActions.handleView,
      onEdit: anomaliasActions.handleEdit,
      onDelete: anomaliasActions.handleDelete,
    });

    // Filtrar apenas as ações extras (não View, Edit)
    return tableActions
      .filter((action) => action.label !== 'Visualizar' && action.label !== 'Editar')
      .map((action) => {
        const Icon = action.icon as any;
        return {
          key: action.label.toLowerCase().replace(/\s+/g, '_'),
          label: action.label,
          handler: action.onClick,
          condition: action.condition,
          icon: Icon ? <Icon className="h-4 w-4" /> : undefined,
          variant: action.variant,
        };
      });
  }, [anomaliasActions]);

  // Carregar dados iniciais
  useEffect(() => {
    loadFilterOptions();
    loadData();
    loadDashboard();
  }, []);

  // Recarregar quando filtros mudam
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      await fetchAnomalias(filters);
    } catch (error) {
      console.error('Erro ao carregar anomalias:', error);
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

  // Handlers
  const handleSubmit = async (data: AnomaliaFormData) => {
    try {
      // Extrair valores de localização
      const equipamentoId = data.localizacao?.equipamentoId || data.equipamentoId;
      const local = data.localizacao?.local || data.local;
      const ativo = data.localizacao?.ativo || data.ativo;

      // Validar campos obrigatórios
      if (!local || local.trim() === '') {
        throw new Error('O campo "Local" é obrigatório. Por favor, selecione uma planta.');
      }
      if (!ativo || ativo.trim() === '') {
        throw new Error('O campo "Equipamento" é obrigatório. Por favor, selecione um equipamento.');
      }

      // Transformar para o formato que o backend espera
      const transformedData: any = {
        descricao: data.descricao,
        condicao: data.condicao,
        origem: data.origem,
        prioridade: data.prioridade,
        observacoes: data.observacoes || '',
        localizacao: {
          local: local.trim(),
          ativo: ativo.trim(),
          ...(equipamentoId &&
            equipamentoId.toString().trim() !== '' && {
              equipamentoId: equipamentoId.toString().trim(),
            }),
        },
        instrucoes_ids: data.instrucoes_ids,
      };

      if (modalState.mode === 'create') {
        const anomaliaCriada = await createAnomalia(transformedData);

        // Upload anexos DEPOIS de criar a anomalia
        if (data.anexos && Array.isArray(data.anexos) && data.anexos.length > 0) {
          try {
            const { anomaliasService } = await import('@/services/anomalias.service');
            await anomaliasService.uploadAnexos(anomaliaCriada.id.trim(), data.anexos as File[]);
          } catch (uploadError) {
            console.error('Erro ao fazer upload dos anexos:', uploadError);
          }
        }
      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateAnomalia(modalState.entity.id, transformedData);
      }

      closeModal();
      await reloadData();
    } catch (error) {
      console.error('Erro ao salvar anomalia:', error);
      throw error;
    }
  };

  const handleFilterChange = async (newFilters: any) => {
    // Se mudou a planta, recarregar unidades
    if ('planta' in newFilters) {
      const plantaId = newFilters.planta === 'all' ? undefined : newFilters.planta;
      await loadUnidadesForPlanta(plantaId);
      setFilters((prev) => ({
        ...prev,
        planta: plantaId,
        unidade: undefined,
        page: 1,
      }));
      return;
    }

    // Limpar filtros com valor 'all'
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

  // Preparar entity para o modal
  const modalEntity = useMemo(() => {
    const entity = modalState.entity;

    if (modalState.mode === 'create') {
      return {
        id: '',
        descricao: '',
        plantaId: '',
        equipamentoId: '',
        local: '',
        ativo: '',
        data: new Date().toISOString(),
        condicao: 'FUNCIONANDO',
        origem: 'OPERADOR',
        status: 'REGISTRADA',
        prioridade: 'MEDIA',
        observacoes: '',
        localizacao: {
          plantaId: '',
          equipamentoId: '',
          local: '',
          ativo: '',
        },
        anexos: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
    }

    if (entity && (modalState.mode === 'edit' || modalState.mode === 'view')) {
      const unidadeIdFromEquipamento =
        entity.equipamento?.unidade?.id ||
        entity.equipamento?.unidadeId ||
        entity.equipamento?.unidade_id;
      const plantaIdFromEquipamento =
        entity.equipamento?.unidade?.planta?.id ||
        entity.equipamento?.planta?.id ||
        entity.equipamento?.plantaId;

      return {
        ...entity,
        prioridade: entity.prioridade || 'MEDIA',
        plantaId: entity.planta_id || entity.plantaId || plantaIdFromEquipamento || '',
        unidadeId: entity.unidade_id || entity.unidadeId || unidadeIdFromEquipamento || '',
        equipamentoId: entity.equipamento_id || entity.equipamentoId || '',
        local: entity.local || '',
        ativo: entity.ativo || '',
        localizacao: {
          plantaId: entity.planta_id || entity.plantaId || plantaIdFromEquipamento || '',
          unidadeId: entity.unidade_id || entity.unidadeId || unidadeIdFromEquipamento || '',
          equipamentoId: entity.equipamento_id || entity.equipamentoId || '',
          local: entity.local || '',
          ativo: entity.ativo || '',
        },
        anexos: (entity as any).anexos || [],
      };
    }

    return entity;
  }, [modalState.entity, modalState.mode]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Anomalias"
            description="Gerencie e monitore anomalias identificadas no sistema"
          />

          {/* Dashboard */}
          <AnomaliasDashboard data={stats} />

          {/* Alertas de Anomalias Críticas */}
          {stats.criticas > 0 && (
            <div className="mb-4 md:mb-6">
              <div className="p-3 md:p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg">
                <div className="flex items-start gap-2 md:gap-3">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm md:text-base text-red-900 dark:text-red-100 mb-1">
                      Anomalias Críticas Detectadas
                    </h4>
                    <p className="text-xs md:text-sm text-red-700 dark:text-red-300">
                      {stats.criticas} anomalia(s) com prioridade crítica identificadas. Verifique
                      urgentemente para evitar problemas operacionais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros e Ação */}
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
                <span>Nova Anomalia</span>
              </button>
            </div>
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={anomalias}
              columns={anomaliasTableColumns}
              pagination={{
                page: currentPage,
                limit: filters.limit || 10,
                total,
                totalPages,
              }}
              loading={loading}
              onPageChange={handlePageChange}
              onView={anomaliasActions.handleView}
              onEdit={anomaliasActions.handleEdit}
              emptyMessage="Nenhuma anomalia encontrada."
              emptyIcon={<AlertTriangle className="h-8 w-8 text-muted-foreground/50" />}
              customActions={customActions}
            />
          </div>
        </div>

        {/* Modal */}
        {modalState.isOpen && (
          <BaseModal
            isOpen={modalState.isOpen}
            mode={modalState.mode}
            entity={modalEntity as any}
            title={
              modalState.mode === 'create'
                ? 'Nova Anomalia'
                : modalState.mode === 'edit'
                ? 'Editar Anomalia'
                : 'Visualizar Anomalia'
            }
            icon={<AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-primary" />}
            formFields={formFields}
            onClose={closeModal}
            onSubmit={handleSubmit}
            width="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px]"
            groups={[
              {
                key: 'informacoes_basicas',
                title: 'Informações Básicas',
                fields: ['descricao'],
              },
              {
                key: 'localizacao',
                title: 'Localização',
                fields: ['localizacao'],
              },
              {
                key: 'classificacao',
                title: 'Classificação',
                fields: ['condicao', 'origem', 'prioridade', 'status'],
              },
              {
                key: 'observacoes',
                title: 'Observações Adicionais',
                fields: ['observacoes'],
              },
              {
                key: 'instrucoes_vinculadas',
                title: 'Instrucoes Vinculadas',
                fields: ['instrucoes_ids'],
              },
              {
                key: 'anexos',
                title: 'Anexos',
                fields: ['anexos'],
              },
            ]}
          />
        )}
      </Layout.Main>
    </Layout>
  );
}
