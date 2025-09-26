// src/features/tarefas/components/TarefasPage.tsx - COM PLANEJAR OS
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Tag, 
  Calendar, 
  FileText, 
  CheckCircle, 
 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCw,
  Eye,
  ChevronLeft,
} from 'lucide-react';
import { useGenericModal } from '@/hooks/useGenericModal';
import { TarefaApiResponse, QueryTarefasApiParams, DashboardTarefasDto } from '@/services/tarefas.services';
import { PlantasService } from '@/services/plantas.services';
import { EquipamentosApiService } from '@/services/equipamentos.services';
import { usePlanosManutencaoApi } from '@/features/planos-manutencao/hooks/usePlanosManutencaoApi';
import { tarefasTableColumns } from '../config/table-config';
import { tarefasFilterConfig } from '../config/filter-config';
import { tarefasFormFields } from '../config/form-config';
import { useTarefasApi } from '../hooks/useTarefasApi';
import { planejarOSComTarefa } from '@/utils/planejarOS';
import { AnexosManager } from './AnexosManager';
import { FilterConfig } from '@/types/base';

const initialFilters: QueryTarefasApiParams = {
  search: '',
  page: 1,
  limit: 10,
  sort_by: 'created_at',
  sort_order: 'desc'
};

export function TarefasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planoIdFiltro = searchParams.get('planoId');
  
  // Estados locais
  const [filters, setFilters] = useState<QueryTarefasApiParams>({
    ...initialFilters,
    // Se veio de um plano específico, filtrar automaticamente
    plano_id: planoIdFiltro || undefined
  });
  
  const [dashboardData, setDashboardData] = useState<DashboardTarefasDto>({
    total_tarefas: 0,
    tarefas_ativas: 0,
    tarefas_inativas: 0,
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
  });

  // Estados para filtros dinâmicos
  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>(tarefasFilterConfig);
  
  // Estados para o formulário
  const [formFields, setFormFields] = useState(tarefasFormFields);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // Arquivos pendentes para upload

  // Instância do serviço de equipamentos
  const equipamentosService = new EquipamentosApiService();

  // API hook
  const {
    loading,
    tarefas,
    totalPages,
    currentPage,
    total,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    getTarefa,
    fetchTarefas,
    updateStatus,
    getDashboard,
    uploadAnexo
  } = useTarefasApi();

  const {
    modalState,
    openModal,
    closeModal: originalCloseModal
  } = useGenericModal<TarefaApiResponse>();

  // Wrapper para closeModal que limpa arquivos pendentes
  const closeModal = () => {
    setPendingFiles([]); // Limpar arquivos pendentes ao fechar modal
    originalCloseModal();
  };

  // Hook para planos de manutenção
  const { fetchPlanos } = usePlanosManutencaoApi();

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

  const loadFilterOptions = async () => {
    try {
      console.log('🔄 Carregando opções dos filtros...');
      
      // Carregar plantas
      console.log('📍 Carregando plantas...');
      const plantasResponse = await PlantasService.getAllPlantas({ limit: 100 });
      console.log('✅ Plantas carregadas:', plantasResponse.data.length);

      // Carregar planos de manutenção
      console.log('📋 Carregando planos de manutenção...');
      const planosResponse = await fetchPlanos({ limit: 100 });
      console.log('✅ Planos carregados:', planosResponse.data.length);

      // Carregar todos os equipamentos
      console.log('🔧 Carregando equipamentos...');
      const equipamentosResponse = await equipamentosService.findAll({ limit: 100 });
      console.log('✅ Equipamentos carregados:', equipamentosResponse.data.length);

      // Atualizar configuração dos filtros com as opções carregadas
      console.log('🔧 Atualizando configuração dos filtros...');
      const updatedConfig = tarefasFilterConfig.map(filter => {
        if (filter.key === 'planta_id') {
          const plantaOptions = [
            { value: 'all', label: 'Todas as plantas' },
            ...plantasResponse.data.map(planta => ({
              value: planta.id,
              label: planta.nome
            }))
          ];
          console.log('🏭 Opções de plantas:', plantaOptions.length);
          return {
            ...filter,
            options: plantaOptions
          };
        }
        
        if (filter.key === 'plano_id') {
          const planoOptions = [
            { value: 'all', label: 'Todos os planos' },
            ...planosResponse.data.map(plano => ({
              value: plano.id,
              label: plano.nome
            }))
          ];
          console.log('📋 Opções de planos:', planoOptions.length);
          return {
            ...filter,
            options: planoOptions
          };
        }
        
        return filter;
      });

      setFilterConfig(updatedConfig);
      
      // Atualizar campos do formulário com as opções carregadas
      const updatedFormFields = tarefasFormFields.map(field => {
        if (field.key === 'plano_manutencao_id') {
          return {
            ...field,
            placeholder: 'Selecione um plano...',
            options: [
              ...planosResponse.data
                .filter(plano => plano.id && plano.nome) // Filtrar itens com id e nome válidos
                .map(plano => ({
                  value: plano.id,
                  label: plano.nome
                }))
            ]
          };
        }
        
        if (field.key === 'planta_id') {
          return {
            ...field,
            placeholder: 'Selecione uma planta...',
            options: [
              ...plantasResponse.data
                .filter(planta => planta.id && planta.nome) // Filtrar itens com id e nome válidos
                .map(planta => ({
                  value: planta.id,
                  label: planta.nome
                }))
            ]
          };
        }
        
        if (field.key === 'equipamento_id') {
          return {
            ...field,
            placeholder: 'Selecione um equipamento...',
            options: [
              ...equipamentosResponse.data
                .filter(equipamento => equipamento.id && equipamento.nome) // Filtrar itens com id e nome válidos
                .map(equipamento => ({
                  value: equipamento.id,
                  label: `${equipamento.nome} - ${equipamento.tipo_equipamento || 'N/A'}`
                }))
            ]
          };
        }
        
        return field;
      });
      
      setFormFields(updatedFormFields);
      console.log('✅ Filtros e formulário atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar opções dos filtros:', error);
    }
  };

  const handleSuccess = async () => {
    closeModal();
    await loadData();
    await loadDashboard();
  };

  const handleSubmit = async (data: any) => {
    console.log('Dados da tarefa para salvar:', data);

    try {
      let tarefaId: string;

      if (modalState.mode === 'create') {
        console.log('🆕 Criando nova tarefa...');
        const novaTarefa = await createTarefa(data);
        tarefaId = novaTarefa.id;

        // Se há arquivos pendentes, fazer upload após criar a tarefa
        if (pendingFiles.length > 0) {
          console.log(`📤 Fazendo upload de ${pendingFiles.length} arquivos...`);

          for (const file of pendingFiles) {
            try {
              console.log(`📎 Fazendo upload do arquivo: ${file.name}`);
              await uploadAnexo(tarefaId, file, `Anexo: ${file.name}`);
              console.log(`✅ Upload concluído: ${file.name}`);
            } catch (uploadError) {
              console.error(`❌ Erro no upload de ${file.name}:`, uploadError);
              // Continuar com outros arquivos mesmo se um falhar
            }
          }

          // Limpar arquivos pendentes após o upload
          setPendingFiles([]);
        }

      } else if (modalState.mode === 'edit' && modalState.entity) {
        await updateTarefa(modalState.entity.id, data);
      }

      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Nova Tarefa Manual',
      edit: 'Editar Tarefa', 
      view: 'Visualizar Tarefa'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Tarefa';
  };

  const getModalIcon = () => {
    return <Tag className="h-5 w-5 text-blue-600" />;
  };

  const modalEntity = useMemo(() => {
    const entity = modalState.entity;

    if (modalState.mode === 'create') {
      return {
        plano_manutencao_id: '',
        nome: '',
        descricao: '',
        categoria: 'MECANICA',
        tipo_manutencao: 'PREVENTIVA',
        frequencia: 'MENSAL',
        condicao_ativo: 'PARADO',
        criticidade: '3',
        status: 'ATIVA',
        ativo: true,
        duracao_estimada: 1,
        tempo_estimado: 60,
        ordem: 1,
        data_ultima_execucao: new Date().toISOString().slice(0, 16),
        numero_execucoes: 0,
        sub_tarefas: [],
        recursos: []
      };
    }

    if (entity) {
      return {
        ...entity,
        criticidade: String(entity.criticidade),
        status: entity.status, // ✅ SIMPLES: só passar o status direto
        data_ultima_execucao: entity.data_ultima_execucao ?
          new Date(entity.data_ultima_execucao).toISOString().slice(0, 16) :
          new Date().toISOString().slice(0, 16),
        numero_execucoes: entity.numero_execucoes || 0,
        sub_tarefas: entity.sub_tarefas || [],
        recursos: entity.recursos || []
      };
    }

    return entity;
  }, [modalState.entity, modalState.mode]);

  const handleView = async (tarefa: TarefaApiResponse) => {
    console.log('Clicou em Visualizar:', tarefa);
    try {
      // Buscar dados completos da tarefa (incluindo sub_tarefas e recursos)
      const tarefaCompleta = await getTarefa(tarefa.id);
      console.log('📋 Dados completos da tarefa para visualização:', tarefaCompleta);
      openModal('view', tarefaCompleta);
    } catch (error) {
      console.error('Erro ao carregar dados completos da tarefa:', error);
      // Fallback para dados básicos se houver erro
      openModal('view', tarefa);
    }
  };

  const handleEdit = async (tarefa: TarefaApiResponse) => {
    console.log('Clicou em Editar:', tarefa);
    try {
      // Buscar dados completos da tarefa (incluindo sub_tarefas e recursos)
      const tarefaCompleta = await getTarefa(tarefa.id);
      console.log('📋 Dados completos da tarefa para edição:', tarefaCompleta);
      openModal('edit', tarefaCompleta);
    } catch (error) {
      console.error('Erro ao carregar dados completos da tarefa:', error);
      // Fallback para dados básicos se houver erro
      openModal('edit', tarefa);
    }
  };

  const handleDelete = async (tarefa: TarefaApiResponse) => {
    if (confirm(`Tem certeza que deseja excluir a tarefa "${tarefa.nome}"?`)) {
      try {
        await deleteTarefa(tarefa.id);
        await loadData();
        await loadDashboard();
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
      }
    }
  };

  // ✅ NOVA FUNCIONALIDADE: Planejar OS
  const handlePlanejarOS = (tarefa: TarefaApiResponse) => {
    console.log('🏷️ Planejando OS para tarefa:', tarefa.id);
    planejarOSComTarefa(tarefa as any, navigate);
  };

  // Ações personalizadas para tarefas
  const handleToggleStatus = async (tarefa: TarefaApiResponse) => {
    try {
      const newStatus = tarefa.ativo ? 'INATIVA' : 'ATIVA';
      await updateStatus(tarefa.id, { 
        status: newStatus,
        ativo: !tarefa.ativo 
      });
      await loadData();
      await loadDashboard();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };


  const handleFilterChange = (newFilters: Partial<QueryTarefasApiParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleExportar = async () => {
    console.log('Exportando tarefas...');
    // TODO: Implementar exportação via API
  };

  const handleImportar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Importando tarefas...');
      // TODO: Implementar importação via API
      event.target.value = '';
    }
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Breadcrumb melhorado */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <button 
              onClick={() => navigate('/planos-manutencao')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Planos de Manutenção
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 dark:text-gray-400">Tarefas</span>
            {planoIdFiltro && (
              <>
                <span className="text-gray-400">/</span>
                <Badge variant="outline" className="text-xs">
                  Plano: {planoIdFiltro}
                </Badge>
              </>
            )}
          </div>

          {/* Header */}
          <TitleCard
            title="Tarefas de Manutenção"
            description="Gerencie tarefas de manutenção preventiva, preditiva e corretiva"
          />
          
          {/* Dashboard Simplificado */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {/* Total */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.total_tarefas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
            
            {/* Ativas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.tarefas_ativas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ativas</p>
                </div>
              </div>
            </div>
            
            {/* Inativas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.tarefas_inativas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inativas</p>
                </div>
              </div>
            </div>
            
            {/* Em Revisão */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.tarefas_em_revisao}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Em Revisão</p>
                </div>
              </div>
            </div>
            
            {/* Arquivadas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.tarefas_arquivadas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Arquivadas</p>
                </div>
              </div>
            </div>
            
            {/* Críticas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.criticidade_muito_alta + dashboardData.criticidade_alta}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Críticas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={filterConfig}
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
                    accept=".csv,.xlsx"
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
                <span className="hidden sm:inline">Nova Tarefa Manual</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
          </div>

          {/* Alertas */}
          {(dashboardData.tarefas_inativas > 0) && (
            <div className="mb-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">
                      Tarefas Inativas
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {dashboardData.tarefas_inativas} tarefa(s) inativas que podem precisar de atenção.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              onDelete={handleDelete}
              emptyMessage="Nenhuma tarefa encontrada."
              emptyIcon={<Tag className="h-8 w-8 text-muted-foreground/50" />}
              customActions={[
                {
                  key: 'planejar_os',
                  label: 'Planejar OS',
                  handler: handlePlanejarOS,
                  condition: (item: TarefaApiResponse) => item.status === 'ATIVA',
                  icon: <Calendar className="h-4 w-4" />,
                  variant: 'default'
                },
                // {
                //   key: 'ver_plano',
                //   label: 'Ver Plano',
                //   handler: handleVerPlano,
                //   condition: (item: TarefaApiResponse) => !!item.plano_manutencao_id,
                //   icon: <Eye className="h-4 w-4" />
                // },
                {
                  key: 'toggle_status',
                  label: 'Ativar/Desativar',
                  handler: handleToggleStatus,
                  icon: <Eye className="h-4 w-4" />
                },
                // {
                //   key: 'arquivar',
                //   label: 'Arquivar',
                //   handler: handleArquivar,
                //   condition: (item: TarefaApiResponse) => item.status !== 'ARQUIVADA',
                //   variant: 'destructive'
                // }
              ]}
            />
          </div>
        </div>

        {/* Modal */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={modalEntity as any}
          title={getModalTitle()}
          icon={getModalIcon()}
          formFields={formFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[900px]"
          groups={[
            {
              key: 'informacoes_basicas',
              title: 'Informações Básicas',
              fields: ['origem_plano_info', 'plano_manutencao_id', 'tag', 'nome', 'descricao']
            },
            ...(modalState.mode !== 'create' ? [{
              key: 'localizacao',
              title: 'Localização',
              fields: ['planta_id', 'equipamento_id']
            }] : []),
            {
              key: 'classificacao',
              title: 'Classificação',
              fields: ['categoria', 'tipo_manutencao', 'criticidade', 'condicao_ativo']
            },
            {
              key: 'planejamento',
              title: 'Planejamento',
              fields: ['frequencia', 'frequencia_personalizada', 'duracao_estimada', 'tempo_estimado', 'ordem', 'planejador', 'responsavel', 'data_ultima_execucao', 'numero_execucoes']
            },
            { 
              key: 'atividades', 
              title: 'Sub-tarefas', 
              fields: ['sub_tarefas'] 
            },
            { 
              key: 'recursos', 
              title: 'Recursos Necessários', 
              fields: ['recursos'] 
            },
            {
              key: 'observacoes',
              title: 'Observações & Status',
              fields: ['observacoes', 'status']
            }
          ]}
        >
          {/* Seção de Anexos - Todos os modos */}
          {modalState.isOpen && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Anexos
              </h3>
              {modalState.mode === 'create' ? (
                <AnexosManager
                  tarefaId={null} // Para modo create, não tem ID ainda
                  readonly={false}
                  onFilesChange={(files) => {
                    // Armazenar arquivos para upload após criação da tarefa
                    setPendingFiles(files);
                  }}
                />
              ) : (
                <AnexosManager
                  tarefaId={modalState.entity?.id || null}
                  readonly={modalState.mode === 'view'}
                />
              )}
            </div>
          )}
        </BaseModal>
      </Layout.Main>
    </Layout>
  );
}