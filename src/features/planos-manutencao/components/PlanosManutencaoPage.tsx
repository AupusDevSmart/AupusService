// src/features/planos-manutencao/components/PlanosManutencaoPage.tsx - CORRIGIDO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Layers, 
  Copy, 
  Users, 
  FileText, 
  Download, 
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  Calendar
} from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { planosTableColumns } from '../config/table-config';
import { planosFilterConfig } from '../config/filter-config';
import { planosFormFields } from '../config/form-config';
import { usePlanosManutencaoApi } from '../hooks/usePlanosManutencaoApi';
import { PlanoManutencaoApiResponse, CreatePlanoManutencaoApiData, UpdatePlanoManutencaoApiData } from '@/services/planos-manutencao.services';
import { SelecionarTarefasModal } from '@/components/common/planejar-os/SelecionarTarefasModal';
import { planejarOSComPlano } from '@/utils/planejarOS';
import { TarefasViewSection } from './TarefasViewSection';

interface PlanosFiltersApi {
  search?: string;
  status?: 'ATIVO' | 'INATIVO' | 'EM_REVISAO' | 'ARQUIVADO';
  ativo?: boolean;
  equipamento_id?: string;
  page?: number;
  limit?: number;
}

const initialFilters: PlanosFiltersApi = {
  search: '',
  page: 1,
  limit: 10
};

export function PlanosManutencaoPage() {
  const navigate = useNavigate();
  
  // Estados locais
  const [filters, setFilters] = useState<PlanosFiltersApi>(initialFilters);
  const [dashboardData, setDashboardData] = useState({
    total_planos: 0,
    planos_ativos: 0,
    planos_inativos: 0,
    planos_em_revisao: 0,
    planos_arquivados: 0,
    equipamentos_com_plano: 0
  });

  // 🔧 NOVO: Estado para armazenar tarefas do plano selecionado
  const [tarefasPlanoSelecionado, setTarefasPlanoSelecionado] = useState<any[]>([]);
  const [carregandoTarefas, setCarregandoTarefas] = useState(false);

  // API service
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

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<PlanoManutencaoApiResponse>();

  // Estado para modal de seleção de tarefas
  const [showSelecionarTarefasModal, setShowSelecionarTarefasModal] = useState(false);
  const [planoParaPlanejar, setPlanoParaPlanejar] = useState<PlanoManutencaoApiResponse | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    loadDashboard();
  }, []);

  // Recarregar quando filtros mudam
  useEffect(() => {
    loadData();
  }, [filters]);

  // 🔧 NOVO: Efeito para carregar tarefas quando modal abre em modo edit
  useEffect(() => {
    if (modalState.isOpen && modalState.mode === 'edit' && modalState.entity) {
      const planoId = modalState.entity.id;
      console.log('🔄 EFFECT: Modal edit aberto, carregando tarefas para:', planoId);
      
      // Se ainda não temos tarefas carregadas, carregar
      if (tarefasPlanoSelecionado.length === 0 && !carregandoTarefas) {
        carregarTarefasDoPlano(planoId);
      }
    }
  }, [modalState.isOpen, modalState.mode, modalState.entity, tarefasPlanoSelecionado.length, carregandoTarefas]);

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

  const handleSuccess = async () => {
    closeModal();
    await loadData();
    await loadDashboard();
    // 🔧 Limpar tarefas quando fechar modal
    setTarefasPlanoSelecionado([]);
  };

  const handleSubmit = async (data: any) => {
    console.log('Dados do plano para salvar:', data);
    
    try {
      if (modalState.mode === 'create') {
        const createData: CreatePlanoManutencaoApiData = {
          equipamento_id: data.equipamento_id,
          nome: data.nome,
          descricao: data.descricao,
          versao: data.versao || '1.0',
          status: data.status || 'ATIVO',
          ativo: data.ativo ?? true,
          data_vigencia_inicio: data.data_vigencia_inicio,
          data_vigencia_fim: data.data_vigencia_fim,
          observacoes: data.observacoes,
          criado_por: data.criado_por
        };
        await createPlano(createData);
      } else if (modalState.mode === 'edit' && modalState.entity) {
        const updateData: UpdatePlanoManutencaoApiData = {
          nome: data.nome,
          descricao: data.descricao,
          versao: data.versao,
          status: data.status,
          ativo: data.ativo,
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

  // 🔧 NOVA FUNÇÃO: Carregar tarefas separadamente
  const carregarTarefasDoPlano = async (planoId: string) => {
    try {
      setCarregandoTarefas(true);
      console.log('🔍 Carregando tarefas do plano:', planoId);
      
      // Buscar plano completo com tarefas
      const planoCompleto = await getPlano(planoId, true);
      console.log('📋 Plano completo recebido:', planoCompleto);
      console.log('📋 Tarefas no plano:', planoCompleto.tarefas);
      
      // Verificar se as tarefas existem e são válidas
      if (planoCompleto.tarefas && Array.isArray(planoCompleto.tarefas)) {
        setTarefasPlanoSelecionado(planoCompleto.tarefas);
        console.log('✅ Tarefas carregadas com sucesso:', planoCompleto.tarefas.length);
      } else {
        console.log('⚠️ Nenhuma tarefa encontrada no plano ou formato inválido');
        setTarefasPlanoSelecionado([]);
      }
      
    } catch (error) {
      console.error('💥 Erro ao carregar tarefas do plano:', error);
      setTarefasPlanoSelecionado([]);
    } finally {
      setCarregandoTarefas(false);
    }
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Novo Plano de Manutenção',
      edit: 'Editar Plano de Manutenção', 
      view: 'Visualizar Plano de Manutenção'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Plano de Manutenção';
  };

  const getModalIcon = () => {
    return <Layers className="h-5 w-5 text-blue-600" />;
  };

  const getModalEntity = () => {
    const entity = modalState.entity;
    
    if (modalState.mode === 'create') {
      return {
        id: '',
        equipamento_id: '',
        nome: '',
        descricao: '',
        versao: '1.0',
        status: 'ATIVO',
        ativo: true,
        data_vigencia_inicio: '',
        data_vigencia_fim: '',
        observacoes: '',
        criado_por: '',
        // Campo para o controlador planta/equipamento
        planta_equipamento: {
          planta_id: '',
          equipamento_id: ''
        }
      };
    }
    
    // PARA VIEW/EDIT - MAPEAR OS DADOS DA API
    if (entity) {
      console.log('🔍 Entity da API:', entity);
      
      // Extrair planta e equipamento da estrutura aninhada
      const plantaId = entity.equipamento?.planta?.id?.trim() || '';
      const equipamentoId = entity.equipamento_id?.trim() || '';
      
      return {
        ...entity,
        // Mapear datas (tratar null)
        data_vigencia_inicio: entity.data_vigencia_inicio ? 
          new Date(entity.data_vigencia_inicio).toISOString().split('T')[0] : '',
        data_vigencia_fim: entity.data_vigencia_fim ? 
          new Date(entity.data_vigencia_fim).toISOString().split('T')[0] : '',
        
        // Campo para o controlador planta/equipamento
        planta_equipamento: {
          planta_id: plantaId,
          equipamento_id: equipamentoId,
          // Dados para exibição no view
          planta_nome: entity.equipamento?.planta?.nome || '',
          equipamento_nome: entity.equipamento?.nome || '',
          equipamento_tipo: (entity.equipamento as any)?.tipo_equipamento || (entity.equipamento as any)?.tipo || ''
        }
      };
    }
    
    // Fallback
    return { 
      id: '', 
      equipamento_id: '',
      nome: '',
      descricao: '',
      versao: '1.0',
      status: 'ATIVO',
      ativo: true,
      data_vigencia_inicio: '',
      data_vigencia_fim: '',
      observacoes: '',
      criado_por: '',
      planta_equipamento: {
        planta_id: '',
        equipamento_id: ''
      }
    };
  };

  // 🔧 FUNÇÃO CORRIGIDA: handleView com carregamento separado de tarefas
  const handleView = async (plano: PlanoManutencaoApiResponse) => {
    console.log('👁️ Visualizando plano:', plano.id);
    
    // Abrir modal primeiro com dados básicos
    openModal('view', plano);
    
    // Carregar tarefas separadamente
    await carregarTarefasDoPlano(plano.id);
  };

  const handleEdit = (plano: PlanoManutencaoApiResponse) => {
    console.log('✏️ Editando plano:', plano);
    openModal('edit', plano);
    // Limpar tarefas no modo edit
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
      console.log('🔄 Alterando status do plano:', plano.id, 'para:', newStatus);
      
      await updateStatus(plano.id, { status: newStatus });
      await loadData();
      await loadDashboard();
      
      console.log('✅ Status alterado com sucesso para:', newStatus);
    } catch (error: any) {
      console.error('💥 Erro ao alterar status:', error);
      alert('Erro ao alterar status do plano. Verifique o console para mais detalhes.');
    }
  };

  const handleDuplicar = async (plano: PlanoManutencaoApiResponse) => {
    try {
      await duplicarPlano(plano.id, {
        equipamento_destino_id: plano.equipamento_id,
        novo_nome: `${plano.nome} - Cópia`,
        criado_por: 'usuario-atual'
      });
      await loadData();
      await loadDashboard();
    } catch (error) {
      console.error('Erro ao duplicar plano:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<PlanosFiltersApi>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // FUNCIONALIDADES: Planejar OS
  const handlePlanejarOS = (plano: PlanoManutencaoApiResponse) => {
    console.log('📋 Iniciando planejamento de OS para plano:', plano.id);
    setPlanoParaPlanejar(plano);
    setShowSelecionarTarefasModal(true);
  };

  const handleConfirmarSelecaoTarefas = (tarefasSelecionadas: any[], equipamentosSelecionados: number[]) => {
    if (planoParaPlanejar) {
      console.log('✅ Confirmando seleção:', {
        plano: planoParaPlanejar.id,
        tarefas: tarefasSelecionadas.length,
        equipamentos: equipamentosSelecionados.length
      });
      
      setShowSelecionarTarefasModal(false);
      planejarOSComPlano(planoParaPlanejar as any, tarefasSelecionadas, equipamentosSelecionados, navigate);
      setPlanoParaPlanejar(null);
    }
  };

  // Navegações
  const handleAssociarEquipamentos = (plano: PlanoManutencaoApiResponse) => {
    console.log('🔗 Navegando para associação do plano:', plano.id);
    navigate(`/planos-manutencao/associar?planoId=${plano.id}`);
  };

  const handleClonarPlano = (plano: PlanoManutencaoApiResponse) => {
    console.log('📋 Navegando para clonagem do plano:', plano.id);
    navigate(`/planos-manutencao/clonar?planoId=${plano.id}`);
  };

  const handleVerTarefas = (plano: PlanoManutencaoApiResponse) => {
    console.log('📋 Navegando para tarefas do plano:', plano.id);
    navigate(`/tarefas?planoId=${plano.id}`);
  };

  const handleExportar = async () => {
    console.log('📤 Exportando planos...');
    // TODO: Implementar exportação via API
  };

  const handleImportar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📥 Importando planos...');
      // TODO: Implementar importação via API
      event.target.value = '';
    }
  };

  // 🔧 FUNÇÃO para fechar modal e limpar dados
  const handleCloseModal = () => {
    closeModal();
    setTarefasPlanoSelecionado([]);
    setCarregandoTarefas(false);
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
          
          {/* Dashboard Simplificado */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* Cards do dashboard... (mantém o código original) */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.total_planos}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.planos_ativos}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ativos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.planos_inativos}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inativos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.equipamentos_com_plano}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Equipamentos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.planos_em_revisao + dashboardData.planos_arquivados}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Outros</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={planosFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportar}>
                <Download className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Importar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportar}
                    className="hidden"
                  />
                </label>
              </Button>
              
              <Button 
                onClick={() => openModal('create')}
                className="bg-primary hover:bg-primary/90 shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Plano</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>

          {/* Alertas */}
          {dashboardData.planos_inativos > 0 && (
            <div className="mb-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">
                      Planos Inativos
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {dashboardData.planos_inativos} plano(s) inativo(s) não estão gerando tarefas para equipamentos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  label: 'Duplicar (mesmo equip.)',
                  handler: handleDuplicar,
                  icon: <Copy className="h-4 w-4" />
                },
                {
                  key: 'toggle_status',
                  label: 'Ativar/Desativar',
                  handler: handleToggleStatus,
                  icon: <XCircle className="h-4 w-4" />
                }
              ]}
            />
          </div>
        </div>

        {/* 🔧 MODAL PRINCIPAL CORRIGIDO */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={getModalTitle()}
          icon={getModalIcon()}
          formFields={planosFormFields}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          width="w-[1200px]"
          groups={[
            {
              key: 'informacoes_basicas',
              title: 'Informações Básicas',
              fields: ['planta_equipamento', 'equipamento_id', 'nome', 'descricao', 'versao']
            },
            {
              key: 'configuracoes',
              title: 'Configurações',
              fields: ['status', 'ativo', 'data_vigencia_inicio', 'data_vigencia_fim', 'observacoes', 'criado_por']
            }
          ]}
        >
          {/* 🔧 SEÇÃO DE TAREFAS CORRIGIDA - Nos modos view e edit */}
          {(modalState.mode === 'view' || modalState.mode === 'edit') && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              {/* Debug info - remover em produção */}
              <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                <div>Modo: {modalState.mode}</div>
                <div>Carregando: {carregandoTarefas ? 'Sim' : 'Não'}</div>
                <div>Total tarefas: {tarefasPlanoSelecionado.length}</div>
                <div>Tarefas (sample): {JSON.stringify(tarefasPlanoSelecionado.slice(0, 1))}</div>
              </div>
              
              {carregandoTarefas ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-400">Carregando tarefas...</span>
                </div>
              ) : (
                <TarefasViewSection 
                  tarefas={tarefasPlanoSelecionado}
                />
              )}
            </div>
          )}
        </BaseModal>

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