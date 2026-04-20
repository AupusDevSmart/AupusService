// src/features/planos-manutencao/components/PlanosManutencaoPage.tsx - REFATORADA
import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@aupus/shared-pages';
import { BaseFilters } from '@aupus/shared-pages';
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
import { TarefasModal } from '@/features/tarefas/components/TarefasModal';
import { tarefasFormFields } from '@/features/tarefas/config/form-config';
import { InstrucoesApiService } from '@/services/instrucoes.services';

// Campos a esconder quando tarefa é criada dentro do plano (plano/equipamento já definidos)
const camposPlanoContexto = ['plano_manutencao_id', 'planta_id', 'equipamento_id'];
const tarefasFormFieldsFromPlano = tarefasFormFields.filter(f => !camposPlanoContexto.includes(f.key));
const instrucoesApi = new InstrucoesApiService();
import { tarefasApi, type TarefaApiResponse } from '@/services/tarefas.services';
import { toast } from '@/hooks/use-toast';

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

  // Estado do modal de tarefa (nested dentro do modal de plano)
  const [tarefaModal, setTarefaModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    entity: TarefaApiResponse | null;
    editIndex?: number; // para editar tarefa pendente no modo create
  }>({ isOpen: false, mode: 'create', entity: null });
  const [tarefaPendingFiles, setTarefaPendingFiles] = useState<File[]>([]);
  // Tarefas acumuladas durante criação de plano (antes de salvar)
  const [tarefasPendentes, setTarefasPendentes] = useState<any[]>([]);
  // Opções de instruções para o modal de tarefa
  const [tarefaFormFieldsEnriched, setTarefaFormFieldsEnriched] = useState(tarefasFormFieldsFromPlano);

  // Hooks customizados
  const { filterConfig, formFields, loadFilterOptions } = usePlanosFilters(initialFilters);
  const { tarefas, loading: carregandoTarefas, loaded: tarefasLoaded, carregarTarefas, limparTarefas } = useTarefasPlano();
  const {
    loading,
    planos,
    totalPages,
    currentPage,
    total,
    fetchPlanos,
    createPlano,
    updatePlano,
    getPlano,
    getDashboard
  } = usePlanosManutencaoApi();

  const { modalState, openModal, closeModal: originalCloseModal } = useGenericModal<PlanoManutencaoApiResponse>();

  // Callback para quando anexos são copiados da instrução
  const handleAnexosCopied = useCallback((files: File[]) => {
    setTarefaPendingFiles(prev => [...prev, ...files]);
  }, []);

  // Carregar opções de instruções para o modal de tarefa
  useEffect(() => {
    instrucoesApi.findAll({ limit: 100, status: 'ATIVA' as any }).then((res) => {
      const options = (res.data || [])
        .filter((inst: any) => inst.id && inst.nome)
        .map((inst: any) => ({
          value: inst.id,
          label: `${inst.tag ? inst.tag + ' - ' : ''}${inst.nome}`
        }));
      setTarefaFormFieldsEnriched(
        tarefasFormFieldsFromPlano.map(f =>
          f.key === 'instrucao_id' ? { ...f, options, onAnexosCopied: handleAnexosCopied } : f
        )
      );
    }).catch(() => {});
  }, [handleAnexosCopied]);

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
    setTarefasPendentes([]);
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

  // Carregar tarefas quando modal view/edit é aberto
  useEffect(() => {
    if (modalState.isOpen && (modalState.mode === 'view' || modalState.mode === 'edit') && modalState.entity) {
      if (!tarefasLoaded && !carregandoTarefas) {
        carregarTarefas(modalState.entity.id);
      }
    }
  }, [modalState.isOpen, modalState.mode, modalState.entity, tarefasLoaded, carregandoTarefas, carregarTarefas]);

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
        const planoResult = await createPlano(createData);

        // Criar tarefas pendentes vinculadas ao plano recém-criado
        if (tarefasPendentes.length > 0 && planoResult?.id) {
          let criadas = 0;
          for (const tarefaData of tarefasPendentes) {
            try {
              await tarefasApi.create({
                ...tarefaData,
                plano_manutencao_id: planoResult.id,
                equipamento_id: data.equipamento_id,
                criticidade: Number(tarefaData.criticidade) || 3,
                duracao_estimada: Number(tarefaData.duracao_estimada) || 1,
                tempo_estimado: Math.round((Number(tarefaData.duracao_estimada) || 1) * 60),
                criado_por: user.id,
              });
              criadas++;
            } catch (err) {
              console.error('Erro ao criar tarefa do plano:', err);
            }
          }
          if (criadas > 0) {
            toast({ title: `Plano criado com ${criadas} tarefa${criadas > 1 ? 's' : ''}` });
          }
          setTarefasPendentes([]);
        }
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
    try {
      const planoCompleto = await getPlano(plano.id, true);
      openModal('view', planoCompleto);
    } catch {
      openModal('view', plano);
    }
  };

  const handleEdit = async (plano: PlanoManutencaoApiResponse) => {
    limparTarefas();
    try {
      const planoCompleto = await getPlano(plano.id, true);
      openModal('edit', planoCompleto);
    } catch {
      openModal('edit', plano);
    }
  };

  // ============================
  // Handlers de tarefa (nested)
  // ============================

  const handleAddTarefa = () => {
    setTarefaModal({ isOpen: true, mode: 'create', entity: null });
    setTarefaPendingFiles([]);
  };

  const handleEditTarefa = async (tarefa: any) => {
    // No modo create do plano, editar tarefa pendente local
    if (modalState.mode === 'create') {
      const idx = tarefasPendentes.findIndex((t) => t === tarefa || t._tempId === tarefa._tempId);
      setTarefaModal({ isOpen: true, mode: 'edit', entity: tarefa as any, editIndex: idx >= 0 ? idx : undefined });
      return;
    }

    try {
      const tarefaCompleta = await tarefasApi.findOne((tarefa.id || tarefa.tarefa_id || '').trim());
      setTarefaModal({ isOpen: true, mode: 'edit', entity: tarefaCompleta });
    } catch {
      setTarefaModal({ isOpen: true, mode: 'edit', entity: tarefa });
    }
  };

  const handleDeleteTarefa = async (tarefa: any) => {
    // No modo create do plano, remover tarefa pendente local
    if (modalState.mode === 'create') {
      setTarefasPendentes((prev) => prev.filter((t) => t !== tarefa && t._tempId !== tarefa._tempId));
      return;
    }

    const tarefaId = (tarefa.id || tarefa.tarefa_id || '').trim();
    const tarefaNome = tarefa.nome || tarefa.tag || 'esta tarefa';

    if (!confirm(`Deseja remover a tarefa "${tarefaNome}" deste plano?`)) return;

    try {
      await tarefasApi.remove(tarefaId);
      toast({ title: 'Tarefa removida' });
      if (modalState.entity) {
        await carregarTarefas(modalState.entity.id);
      }
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' });
    }
  };

  const handleTarefaSubmit = async (data: any) => {
    try {
      // Modo create do plano: acumular tarefas localmente
      if (modalState.mode === 'create') {
        const tarefaLocal = {
          ...data,
          _tempId: `temp_${Date.now()}`,
          id: `temp_${Date.now()}`,
          tag: `Nova-${tarefasPendentes.length + 1}`,
          nome: data.nome,
          ordem: tarefasPendentes.length + 1,
          ativo: true,
          categoria: data.categoria || 'MECANICA',
          tipo_manutencao: data.tipo_manutencao || 'PREVENTIVA',
          tempo_estimado: Math.round((Number(data.duracao_estimada) || 1) * 60),
          criticidade: Number(data.criticidade) || 3,
          status: 'ATIVA',
        };

        if (tarefaModal.editIndex !== undefined && tarefaModal.editIndex >= 0) {
          // Editar tarefa pendente existente
          setTarefasPendentes((prev) => {
            const updated = [...prev];
            updated[tarefaModal.editIndex!] = { ...updated[tarefaModal.editIndex!], ...tarefaLocal, _tempId: updated[tarefaModal.editIndex!]._tempId };
            return updated;
          });
        } else {
          setTarefasPendentes((prev) => [...prev, tarefaLocal]);
        }

        setTarefaModal({ isOpen: false, mode: 'create', entity: null });
        return;
      }

      // Modo edit do plano: salvar via API
      if (tarefaModal.mode === 'create') {
        const planoId = modalState.entity?.id;
        const equipamentoId = modalState.entity?.equipamento_id?.trim();
        await tarefasApi.create({
          ...data,
          plano_manutencao_id: planoId,
          equipamento_id: equipamentoId,
          criticidade: Number(data.criticidade) || 3,
          duracao_estimada: Number(data.duracao_estimada) || 1,
          tempo_estimado: Math.round((Number(data.duracao_estimada) || 1) * 60),
          ordem: tarefas.length + 1,
          criado_por: user?.id,
        });
        toast({ title: 'Tarefa adicionada' });
      } else if (tarefaModal.mode === 'edit' && tarefaModal.entity) {
        await tarefasApi.update(tarefaModal.entity.id.trim(), {
          ...data,
          criticidade: Number(data.criticidade) || 3,
          duracao_estimada: Number(data.duracao_estimada) || 1,
          tempo_estimado: Math.round((Number(data.duracao_estimada) || 1) * 60),
        });
        toast({ title: 'Tarefa atualizada' });
      }

      setTarefaModal({ isOpen: false, mode: 'create', entity: null });
      if (modalState.entity) {
        await carregarTarefas(modalState.entity.id);
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast({ title: 'Erro ao salvar tarefa', variant: 'destructive' });
    }
  };

  const closeTarefaModal = () => {
    setTarefaModal({ isOpen: false, mode: 'create', entity: null });
    setTarefaPendingFiles([]);
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
          tarefas={modalState.mode === 'create' ? tarefasPendentes : tarefas}
          carregandoTarefas={modalState.mode !== 'create' && carregandoTarefas}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onEditTarefa={handleEditTarefa}
          onDeleteTarefa={handleDeleteTarefa}
          onAddTarefa={handleAddTarefa}
        />

        {/* Modal de Tarefa (nested) */}
        <TarefasModal
          isOpen={tarefaModal.isOpen}
          mode={tarefaModal.mode}
          entity={tarefaModal.entity}
          formFields={tarefaFormFieldsEnriched}
          pendingFiles={tarefaPendingFiles}
          onClose={closeTarefaModal}
          onSubmit={handleTarefaSubmit}
          onFilesChange={setTarefaPendingFiles}
        />
      </Layout.Main>
    </Layout>
  );
}
