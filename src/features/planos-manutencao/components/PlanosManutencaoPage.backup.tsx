// src/features/planos-manutencao/components/PlanosManutencaoPage.tsx - REFATORADA
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@nexon/components/common/base-table/BaseTable';
import { BaseFilters } from '@nexon/components/common/base-filters/BaseFilters';
import { Plus, Layers, Copy, Calendar, ExternalLink, Eye } from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { useUserStore } from '@/store/useUserStore';
import { planosTableColumns } from '../config/table-config';
import { usePlanosManutencaoApi } from '../hooks/usePlanosManutencaoApi';
import { usePlanosFilters } from '../hooks/usePlanosFilters';
import {
  PlanoManutencaoApiResponse,
  CreatePlanoManutencaoApiData,
  UpdatePlanoManutencaoApiData,
  DashboardPlanosDto
} from '@/services/planos-manutencao.services';
import { SelecionarTarefasModal } from '@/components/common/planejar-os/SelecionarTarefasModal';
import { planejarOSComPlano } from '@/utils/planejarOS';
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
  const navigate = useNavigate();
  const { user } = useUserStore(); // Pegar usuário logado do Zustand store

  // Estados locais
  const [filters, setFilters] = useState<PlanosFiltersApi>(initialFilters);
  const [dashboardData, setDashboardData] = useState<DashboardPlanosDto>(initialDashboard);
  const [tarefasPlanoSelecionado, setTarefasPlanoSelecionado] = useState<any[]>([]);
  const [carregandoTarefas, setCarregandoTarefas] = useState(false);

  // Hooks
  const { filterConfig, formFields, loadFilterOptions } = usePlanosFilters(initialFilters);
  const {
    loading,
    planos,
    totalPages,
    currentPage,
    total,
    fetchPlanos,
    createPlano,
    updatePlano,
    deletePlano,
    getPlano,
    updateStatus,
    duplicarPlano,
    getDashboard
  } = usePlanosManutencaoApi();

  const { modalState, openModal, closeModal: originalCloseModal } = useGenericModal<PlanoManutencaoApiResponse>();

  // Estado para modal de seleção de tarefas
  const [showSelecionarTarefasModal, setShowSelecionarTarefasModal] = useState(false);
  const [planoParaPlanejar, setPlanoParaPlanejar] = useState<PlanoManutencaoApiResponse | null>(null);

  // Wrapper para closeModal que limpa tarefas
  const closeModal = () => {
    setTarefasPlanoSelecionado([]);
    setCarregandoTarefas(false);
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
      const planoId = modalState.entity.id;
      if (tarefasPlanoSelecionado.length === 0 && !carregandoTarefas) {
        carregarTarefasDoPlano(planoId);
      }
    }
  }, [modalState.isOpen, modalState.mode, modalState.entity]);

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

  const carregarTarefasDoPlano = async (planoId: string) => {
    try {
      setCarregandoTarefas(true);
      const planoCompleto = await getPlano(planoId, true);

      if (planoCompleto.tarefas && Array.isArray(planoCompleto.tarefas)) {
        setTarefasPlanoSelecionado(planoCompleto.tarefas);
      } else {
        setTarefasPlanoSelecionado([]);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas do plano:', error);
      setTarefasPlanoSelecionado([]);
    } finally {
      setCarregandoTarefas(false);
    }
  };

  const handleSuccess = async () => {
    closeModal();
    await loadData();
    await loadDashboard();
  };

  const handleSubmit = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        // Validar se o usuário está logado
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
          criado_por: user.id // ✅ ID do usuário logado (obrigatório)
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
    await carregarTarefasDoPlano(plano.id);
  };

  const handleEdit = (plano: PlanoManutencaoApiResponse) => {
    openModal('edit', plano);
    setTarefasPlanoSelecionado([]);
  };

  const handleDelete = async (plano: PlanoManutencaoApiResponse) => {
    if (confirm(`Tem certeza que deseja excluir o plano "${plano.nome}"?`)) {
      try {
        await deletePlano(plano.id);
        await loadData();
        await loadDashboard();
      } catch (error) {
        console.error('Erro ao excluir plano:', error);
      }
    }
  };

  const handleToggleStatus = async (plano: PlanoManutencaoApiResponse) => {
    try {
      const newStatus = plano.ativo ? 'INATIVO' : 'ATIVO';
      await updateStatus(plano.id, { status: newStatus });
      await loadData();
      await loadDashboard();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do plano.');
    }
  };

  const handleDuplicar = async (plano: PlanoManutencaoApiResponse) => {
    try {
      // Validar se o usuário está logado
      if (!user?.id) {
        alert('Erro: Usuário não autenticado. Faça login para duplicar planos.');
        return;
      }

      await duplicarPlano(plano.id, {
        equipamento_destino_id: plano.equipamento_id,
        novo_nome: `${plano.nome} - Cópia`,
        criado_por: user.id // ✅ ID do usuário logado (obrigatório)
      });
      await loadData();
      await loadDashboard();
    } catch (error) {
      console.error('Erro ao duplicar plano:', error);
    }
  };

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

  // Navegações e ações customizadas
  const handlePlanejarOS = (plano: PlanoManutencaoApiResponse) => {
    setPlanoParaPlanejar(plano);
    setShowSelecionarTarefasModal(true);
  };

  const handleConfirmarSelecaoTarefas = (tarefasSelecionadas: any[], equipamentosSelecionados: number[]) => {
    if (planoParaPlanejar) {
      setShowSelecionarTarefasModal(false);
      planejarOSComPlano(
        planoParaPlanejar as any,
        tarefasSelecionadas,
        equipamentosSelecionados,
        navigate
      );
      setPlanoParaPlanejar(null);
    }
  };

  const handleAssociarEquipamentos = (plano: PlanoManutencaoApiResponse) => {
    navigate(`/planos-manutencao/associar?planoId=${plano.id}`);
  };

  const handleClonarPlano = (plano: PlanoManutencaoApiResponse) => {
    navigate(`/planos-manutencao/clonar?planoId=${plano.id}`);
  };

  const handleVerTarefas = (plano: PlanoManutencaoApiResponse) => {
    navigate(`/tarefas?planoId=${plano.id}`);
  };

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
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="Nenhum plano de manutenção encontrado."
              emptyIcon={<Layers className="h-8 w-8 text-muted-foreground/50" />}
              customActions={[
                {
                  key: 'planejar_os',
                  label: 'Planejar OS',
                  handler: handlePlanejarOS,
                  condition: (item: PlanoManutencaoApiResponse) => item.ativo && (item.total_tarefas || 0) > 0,
                  icon: <Calendar className="h-4 w-4" />,
                  variant: 'default'
                },
                {
                  key: 'clonar',
                  label: 'Clonar para Múltiplos',
                  handler: handleClonarPlano,
                  condition: (item: PlanoManutencaoApiResponse) => item.ativo && (item.total_tarefas || 0) > 0,
                  icon: <Copy className="h-4 w-4" />,
                  variant: 'default'
                },
                {
                  key: 'associar',
                  label: 'Associar Equipamentos',
                  handler: handleAssociarEquipamentos,
                  icon: <ExternalLink className="h-4 w-4" />,
                  variant: 'secondary'
                },
                {
                  key: 'ver_tarefas',
                  label: 'Ver Tarefas',
                  handler: handleVerTarefas,
                  condition: (item: PlanoManutencaoApiResponse) => (item.total_tarefas || 0) > 0,
                  icon: <Eye className="h-4 w-4" />
                },
                {
                  key: 'duplicar',
                  label: 'Duplicar',
                  handler: handleDuplicar,
                  icon: <Copy className="h-4 w-4" />
                },
                {
                  key: 'toggle_status',
                  label: (item: PlanoManutencaoApiResponse) => (item.ativo ? 'Desativar' : 'Ativar'),
                  handler: handleToggleStatus,
                  icon: <ExternalLink className="h-4 w-4" />
                }
              ]}
            />
          </div>
        </div>

        {/* Modal Principal */}
        <PlanosModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={modalState.entity}
          formFields={formFields}
          tarefas={tarefasPlanoSelecionado}
          carregandoTarefas={carregandoTarefas}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />

        {/* Modal de Seleção de Tarefas */}
        <SelecionarTarefasModal
          isOpen={showSelecionarTarefasModal}
          plano={planoParaPlanejar as any}
          onClose={() => {
            setShowSelecionarTarefasModal(false);
            setPlanoParaPlanejar(null);
          }}
          onConfirm={handleConfirmarSelecaoTarefas}
        />
      </Layout.Main>
    </Layout>
  );
}
