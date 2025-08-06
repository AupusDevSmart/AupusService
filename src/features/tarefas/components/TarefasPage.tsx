// src/features/tarefas/components/TarefasPage.tsx - COM PLANEJAR OS
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  XCircle, 
  AlertTriangle, 
  Download, 
  Upload, 
  Copy,
  Layers,
  RefreshCw,
  Eye,
  Settings,
  ChevronLeft,
  Wrench
} from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Tarefa, TarefasFilters } from '../types';
import { tarefasTableColumns } from '../config/table-config';
import { tarefasFilterConfig } from '../config/filter-config';
import { tarefasFormFields } from '../config/form-config';
import { mockTarefas } from '../data/mock-data';
import { useTarefas } from '../hooks/useTarefas';
import { planejarOSComTarefa } from '@/utils/planejarOS'; // ✅ NOVA IMPORT

const initialFilters: TarefasFilters = {
  search: '',
  categoria: 'all',
  tipoManutencao: 'all',
  frequencia: 'all',
  status: 'all',
  planta: 'all',
  equipamento: 'all',
  criticidade: 'all',
  origemPlano: 'all',
  sincronizada: 'all',
  page: 1,
  limit: 10
};

export function TarefasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planoIdFiltro = searchParams.get('planoId');
  
  const {
    paginatedData: tarefas,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockTarefas,
    initialFilters: {
      ...initialFilters,
      // Se veio de um plano específico, filtrar automaticamente
      origemPlano: planoIdFiltro ? 'true' : 'all'
    },
    searchFields: ['tag', 'descricao', 'categoria', 'responsavel', 'planejador']
  });

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<Tarefa>();

  const {
    ativarTarefa,
    desativarTarefa,
    arquivarTarefa,
    duplicarTarefa,
    sincronizarComPlano,
    gerarOS,
    exportarTarefas,
    importarTarefas
  } = useTarefas();

  // Dashboard com cores simplificadas - APENAS 8 CORES com 5 cores
  const [stats, setStats] = useState({
    total: 0,
    ativas: 0,
    vencidas: 0,
    vencendoHoje: 0,
    dePlanos: 0,
    manuais: 0,
    dessincronizadas: 0,
    customizadas: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    const total = mockTarefas.length;
    const ativas = mockTarefas.filter(t => t.status === 'ATIVA').length;
    const dePlanos = mockTarefas.filter(t => t.origemPlano).length;
    const manuais = mockTarefas.filter(t => !t.origemPlano).length;
    const dessincronizadas = mockTarefas.filter(t => t.origemPlano && !t.sincronizada).length;
    const customizadas = mockTarefas.filter(t => t.customizada).length;
    
    // Calcular tarefas vencendo hoje e vencidas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let vencendoHoje = 0;
    let vencidas = 0;
    
    mockTarefas.forEach(tarefa => {
      if (tarefa.proximaExecucao && tarefa.ativa) {
        const proximaExecucao = new Date(tarefa.proximaExecucao);
        proximaExecucao.setHours(0, 0, 0, 0);
        
        if (proximaExecucao.getTime() === hoje.getTime()) {
          vencendoHoje++;
        } else if (proximaExecucao < hoje) {
          vencidas++;
        }
      }
    });

    setStats({
      total,
      ativas,
      vencidas,
      vencendoHoje,
      dePlanos,
      manuais,
      dessincronizadas,
      customizadas
    });
  }, []);

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: any) => {
    console.log('Dados da tarefa para salvar:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Nova Tarefa Manual',
      edit: 'Editar Tarefa', 
      view: 'Visualizar Tarefa'
    };
    return titles[modalState.mode];
  };

  const getModalIcon = () => {
    return <Tag className="h-5 w-5 text-blue-600" />;
  };

  const getModalEntity = () => {
    const entity = modalState.entity;
    
    if (modalState.mode === 'create') {
      return {
        categoria: 'MECANICA',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'MENSAL',
        condicaoAtivo: 'PARADO',
        criticidade: '3',
        status: 'ATIVA',
        ativa: true,
        duracaoEstimada: 1,
        tempoEstimado: 60,
        subTarefas: [],
        recursos: [],
        customizada: false,
        sincronizada: true,
        origemPlano: false
      };
    }
    
    return entity;
  };

  const handleView = (tarefa: Tarefa) => {
    console.log('Clicou em Visualizar:', tarefa);
    openModal('view', tarefa);
  };

  const handleEdit = (tarefa: Tarefa) => {
    console.log('Clicou em Editar:', tarefa);
    openModal('edit', tarefa);
  };

  // ✅ NOVA FUNCIONALIDADE: Planejar OS
  const handlePlanejarOS = (tarefa: Tarefa) => {
    console.log('🏷️ Planejando OS para tarefa:', tarefa.id);
    planejarOSComTarefa(tarefa, navigate);
  };

  // Ações personalizadas para tarefas
  const handleAtivar = async (tarefa: Tarefa) => {
    console.log('Ativando tarefa:', tarefa.id);
    await ativarTarefa(tarefa.id);
  };

  const handleDesativar = async (tarefa: Tarefa) => {
    console.log('Desativando tarefa:', tarefa.id);
    await desativarTarefa(tarefa.id);
  };

  const handleArquivar = async (tarefa: Tarefa) => {
    console.log('Arquivando tarefa:', tarefa.id);
    await arquivarTarefa(tarefa.id);
  };

  const handleDuplicar = async (tarefa: Tarefa) => {
    console.log('Duplicando tarefa:', tarefa.id);
    await duplicarTarefa(tarefa.id);
  };

  const handleSincronizar = async (tarefa: Tarefa) => {
    console.log('Sincronizando tarefa com plano:', tarefa.id);
    await sincronizarComPlano(tarefa.id);
  };

  const handleGerarOS = async (tarefa: Tarefa) => {
    console.log('Gerando OS para tarefa:', tarefa.id);
    const resultado = await gerarOS(tarefa.id);
    console.log('OS gerada:', resultado.osId);
  };

  // NOVA FUNCIONALIDADE: Ver plano de origem
  const handleVerPlano = (tarefa: Tarefa) => {
    if (tarefa.planoManutencaoId) {
      navigate(`/planos-manutencao`);
    }
  };

  const handleExportar = async () => {
    console.log('Exportando tarefas...');
    const blob = await exportarTarefas(filters);
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarefas-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImportar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Importando tarefas...');
      const resultado = await importarTarefas(file);
      console.log('Resultado da importação:', resultado);
      
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
          
          {/* Dashboard Simplificado - APENAS 8 CARDS com 5 cores */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            {/* Total - Neutro */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
            
            {/* Ativas - Verde */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.ativas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ativas</p>
                </div>
              </div>
            </div>
            
            {/* Vencidas - Vermelho */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.vencidas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Vencidas</p>
                </div>
              </div>
            </div>
            
            {/* Hoje - Amarelo */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.vencendoHoje}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Hoje</p>
                </div>
              </div>
            </div>
            
            {/* De Planos - Azul */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.dePlanos}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">De Planos</p>
                </div>
              </div>
            </div>
            
            {/* Manuais - Neutro */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.manuais}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Manuais</p>
                </div>
              </div>
            </div>
            
            {/* Dessincronizadas - Amarelo */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.dessincronizadas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Dessinc.</p>
                </div>
              </div>
            </div>
            
            {/* Customizadas - Azul */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.customizadas}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Custom.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={tarefasFilterConfig}
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

          {/* Alertas Simplificados */}
          <div className="space-y-3 mb-6">
            {(stats.vencidas > 0 || stats.vencendoHoje > 0) && (
              <>
                {stats.vencidas > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <h4 className="font-medium text-red-900 dark:text-red-100">
                          Tarefas Vencidas
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {stats.vencidas} tarefa(s) vencidas necessitam execução urgente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {stats.vencendoHoje > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">
                          Tarefas Programadas para Hoje
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {stats.vencendoHoje} tarefa(s) programadas para execução hoje.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {stats.dessincronizadas > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">
                      Tarefas Dessincronizadas
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {stats.dessincronizadas} tarefa(s) estão dessincronizadas com seus planos de origem.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={tarefas}
              columns={tarefasTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhuma tarefa encontrada."
              emptyIcon={<Tag className="h-8 w-8 text-muted-foreground/50" />}
              customActions={[
                {
                  key: 'planejar_os', // ✅ NOVA AÇÃO EM DESTAQUE
                  label: 'Planejar OS',
                  handler: handlePlanejarOS,
                  condition: (item: Tarefa) => item.status === 'ATIVA',
                  icon: <Calendar className="h-4 w-4" />,
                  variant: 'default'
                },
                {
                  key: 'ver_plano',
                  label: 'Ver Plano',
                  handler: handleVerPlano,
                  condition: (item: Tarefa) => !!item.planoManutencaoId,
                  icon: <Eye className="h-4 w-4" />
                },
                {
                  key: 'sincronizar',
                  label: 'Sincronizar',
                  handler: handleSincronizar,
                  condition: (item: Tarefa) => item.origemPlano && !item.sincronizada,
                  icon: <RefreshCw className="h-4 w-4" />,
                  variant: 'secondary'
                },
                {
                  key: 'ativar',
                  label: 'Ativar',
                  handler: handleAtivar,
                  condition: (item: Tarefa) => item.status === 'INATIVA'
                },
                {
                  key: 'desativar',
                  label: 'Desativar',
                  handler: handleDesativar,
                  condition: (item: Tarefa) => item.status === 'ATIVA'
                },
                {
                  key: 'gerar_os',
                  label: 'Gerar OS',
                  handler: handleGerarOS,
                  condition: (item: Tarefa) => item.status === 'ATIVA'
                },
                {
                  key: 'duplicar',
                  label: 'Duplicar',
                  handler: handleDuplicar,
                  icon: <Copy className="h-4 w-4" />
                },
                {
                  key: 'arquivar',
                  label: 'Arquivar',
                  handler: handleArquivar,
                  condition: (item: Tarefa) => item.status !== 'ARQUIVADA',
                  variant: 'destructive'
                }
              ]}
            />
          </div>
        </div>

        {/* Modal */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={getModalTitle()}
          icon={getModalIcon()}
          formFields={tarefasFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[900px]"
          groups={[
            { key: 'informacoes_basicas', title: 'Informações Básicas' },
            { key: 'localizacao', title: 'Localização' },
            { key: 'classificacao', title: 'Classificação' },
            { key: 'planejamento', title: 'Planejamento' },
            { key: 'atividades', title: 'Atividades (Checklist)' },
            { key: 'recursos', title: 'Recursos Necessários' },
            { key: 'observacoes', title: 'Observações & Status' },
            { key: 'anexos', title: 'Anexos' }
          ]}
        />
      </Layout.Main>
    </Layout>
  );
}