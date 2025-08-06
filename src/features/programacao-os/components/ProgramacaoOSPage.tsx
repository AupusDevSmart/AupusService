// src/features/programacao-os/components/ProgramacaoOSPage.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, Play, CheckCircle, XCircle, Download, Settings, Clock, User, AlertTriangle } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { OrdemServico, ProgramacaoOSFilters } from '../types';
import { programacaoOSTableColumns } from '../config/table-config';
import { programacaoOSFilterConfig } from '../config/filter-config';
import { programacaoOSFormFields } from '../config/form-config';
import { mockOrdensServico } from '../data/mock-data';
import { useProgramacaoOS } from '../hooks/useProgramacaoOS';
import { IniciarExecucaoModal } from './IniciarExecucaoModal';

const initialFilters: ProgramacaoOSFilters = {
  search: '',
  status: 'all',
  tipo: 'all',
  prioridade: 'all',
  origem: 'all',
  planta: 'all',
  responsavel: 'all',
  dataProgramada: '',
  periodo: 'all',
  page: 1,
  limit: 10
};

export function ProgramacaoOSPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    paginatedData: ordensServico,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockOrdensServico,
    initialFilters,
    searchFields: ['numeroOS', 'descricao', 'local', 'ativo', 'responsavel'],
    customFilters: {
      periodo: (item: OrdemServico, value: string) => {
        if (value === 'all') return true;
        
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        const itemDate = item.dataProgramada ? new Date(item.dataProgramada) : null;
        if (!itemDate) return false;
        
        switch (value) {
          case 'hoje':
            return itemDate.toDateString() === hoje.toDateString();
          case 'amanha':
            return itemDate.toDateString() === amanha.toDateString();
          case 'esta_semana':
            const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
            const fimSemana = new Date(hoje.setDate(hoje.getDate() + 6));
            return itemDate >= inicioSemana && itemDate <= fimSemana;
          default:
            return true;
        }
      }
    }
  });

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<OrdemServico>();

  const {
    planejarOS,
    programarOS,
    iniciarExecucao,
    finalizarOS,
    cancelarOS,
    exportarOS,
    loading: hookLoading
  } = useProgramacaoOS();

  // Estados para modais
  const [showIniciarModal, setShowIniciarModal] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);

  // Contadores simplificados
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    programadas: 0,
    emExecucao: 0,
    finalizadas: 0,
    vencidas: 0,
    criticas: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    const total = mockOrdensServico.length;
    const pendentes = mockOrdensServico.filter(os => os.status === 'PENDENTE' || os.status === 'PLANEJADA').length;
    const programadas = mockOrdensServico.filter(os => os.status === 'PROGRAMADA').length;
    const emExecucao = mockOrdensServico.filter(os => os.status === 'EM_EXECUCAO').length;
    const finalizadas = mockOrdensServico.filter(os => os.status === 'FINALIZADA').length;
    const criticas = mockOrdensServico.filter(os => os.prioridade === 'CRITICA').length;
    
    // Calcular OS vencidas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let vencidas = 0;
    mockOrdensServico.forEach(os => {
      if (os.dataProgramada && (os.status === 'PROGRAMADA' || os.status === 'EM_EXECUCAO')) {
        const dataProgramada = new Date(os.dataProgramada);
        dataProgramada.setHours(0, 0, 0, 0);
        
        if (dataProgramada < hoje) {
          vencidas++;
        }
      }
    });

    setStats({
      total,
      pendentes,
      programadas,
      emExecucao,
      finalizadas,
      vencidas,
      criticas
    });
  }, []);

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: any) => {
    console.log('Dados da programação de OS para salvar:', data);
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Nova Programação de Ordem de Serviço', // ✅ ALTERADO
      edit: 'Editar Programação de OS', 
      view: 'Visualizar Programação de OS',
      programar: 'Programar OS'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Programação de OS';
  };

  const getModalIcon = () => {
    return <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  };

  // ✅ NOVA FUNCIONALIDADE: Receber dados pré-selecionados via navigate state
  React.useEffect(() => {
    const state = location.state as any;
    if (state?.preselectedData) {
      console.log('📋 Dados pré-selecionados recebidos:', state.preselectedData);
      
      // Se tem dados pré-selecionados, abrir modal automaticamente com os dados
      setTimeout(() => {
        openModal('create', null, state.preselectedData);
      }, 100);
      
      // Limpar state para não reabrir sempre
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, openModal]);

  const getModalEntity = () => {
    const entity = modalState.entity;
    
    // Para modo create
    if (modalState.mode === 'create') {
      const baseEntity = {
        condicoes: 'PARADO',
        tipo: 'PREVENTIVA',
        prioridade: 'MEDIA',
        origem: 'ANOMALIA', // ✅ ALTERADO: padrão para anomalia
        tempoEstimado: 4,
        duracaoEstimada: 6,
        materiais: [],
        ferramentas: [],
        tecnicos: []
      };

      // ✅ NOVA: Aplicar dados pré-selecionados se disponíveis
      if (modalState.preselectedData) {
        return {
          ...baseEntity,
          ...modalState.preselectedData
        };
      }

      return baseEntity;
    }
    
    return entity;
  };

  const handleView = (os: OrdemServico) => {
    console.log('Clicou em Visualizar:', os);
    openModal('view', os);
  };

  const handleEdit = (os: OrdemServico) => {
    console.log('Clicou em Editar:', os);
    openModal('edit', os);
  };

  // Ações personalizadas para OS
  const handlePlanejar = async (os: OrdemServico) => {
    console.log('Planejando OS:', os.id);
    await planejarOS(os.id, {});
  };

  const handleProgramar = (os: OrdemServico) => {
    console.log('Clicou em Programar:', os);
    openModal('programar' as any, os);
  };

  const handleIniciarExecucao = async (os: OrdemServico) => {
    console.log('Preparando para iniciar execução da OS:', os.id);
    setOsSelecionada(os);
    setShowIniciarModal(true);
  };

  // ✅ NOVA: Função para confirmar início de execução
  const handleConfirmarIniciarExecucao = async (dados: any) => {
    if (!osSelecionada) return;
    
    try {
      const resultado = await iniciarExecucao(osSelecionada.id, dados);
      
      if (resultado.success) {
        // Fechar modal
        setShowIniciarModal(false);
        setOsSelecionada(null);
        
        // Mostrar mensagem de sucesso
        alert(`✅ ${resultado.message}\n\nA OS foi transferida para a tela de Execução.`);
        
        // Simular atualização da lista
        await handleSuccess();
        
        // Aqui você poderia navegar para a tela de execução
        // navigate(`/execucao-os/${resultado.execucaoId}`);
        console.log('🎯 Navegar para execução:', resultado.execucaoId);
      }
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
      alert('❌ Erro ao iniciar execução. Tente novamente.');
    }
  };

  const handleFinalizar = async (os: OrdemServico) => {
    console.log('Finalizando OS:', os.id);
    await finalizarOS(os.id, 'OS finalizada com sucesso');
  };

  const handleCancelar = async (os: OrdemServico) => {
    console.log('Cancelando OS:', os.id);
    await cancelarOS(os.id, 'Cancelada pelo usuário');
  };

  const handleExportar = async () => {
    console.log('Exportando OS...');
    const blob = await exportarOS(filters);
    
    // Criar download do arquivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordens-servico-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Programação de Ordens de Serviço"
            description="Gerencie e programe ordens de serviço"
          />
          
          {/* Dashboard equilibrado */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendentes}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pendentes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.programadas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Programadas</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Play className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.emExecucao}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Em Execução</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.finalizadas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Finalizadas</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.vencidas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Vencidas</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.criticas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Críticas</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={programacaoOSFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportar}>
                <Download className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              
              <Button 
                onClick={() => openModal('create')}
                className="shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nova Programação</span> {/* ✅ ALTERADO */}
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
          </div>

          {/* Alertas importantes */}
          {(stats.vencidas > 0 || stats.criticas > 0) && (
            <div className="mb-6 space-y-3">
              {stats.vencidas > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        {stats.vencidas} OS com prazo vencido
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Ordens de serviço que passaram da data programada.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {stats.criticas > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">
                        {stats.criticas} OS com prioridade crítica
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Requer atenção imediata para programação.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={ordensServico}
              columns={programacaoOSTableColumns}
              pagination={pagination}
              loading={loading || hookLoading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhuma ordem de serviço encontrada."
              emptyIcon={<FileText className="h-8 w-8 text-gray-400" />}
              customActions={[
                {
                  key: 'planejar',
                  label: 'Planejar',
                  handler: handlePlanejar,
                  condition: (item: OrdemServico) => item.status === 'PENDENTE',
                  icon: <Settings className="h-4 w-4" />
                },
                {
                  key: 'programar',
                  label: 'Programar',
                  handler: handleProgramar,
                  condition: (item: OrdemServico) => item.status === 'PLANEJADA' || item.status === 'PENDENTE',
                  icon: <Calendar className="h-4 w-4" />
                },
                {
                  key: 'iniciar',
                  label: 'Iniciar',
                  handler: handleIniciarExecucao,
                  condition: (item: OrdemServico) => item.status === 'PROGRAMADA',
                  icon: <Play className="h-4 w-4" />
                },
                {
                  key: 'finalizar',
                  label: 'Finalizar',
                  handler: handleFinalizar,
                  condition: (item: OrdemServico) => item.status === 'EM_EXECUCAO',
                  icon: <CheckCircle className="h-4 w-4" />
                },
                {
                  key: 'cancelar',
                  label: 'Cancelar',
                  handler: handleCancelar,
                  condition: (item: OrdemServico) => item.status !== 'FINALIZADA' && item.status !== 'CANCELADA',
                  icon: <XCircle className="h-4 w-4" />,
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
          formFields={programacaoOSFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[1000px]"
          groups={[
            { key: 'informacoes_basicas', title: 'Informações Básicas' },
            { key: 'origem', title: 'Origem da OS' }, // ✅ ALTERADO
            { key: 'classificacao', title: 'Classificação' },
            { key: 'planejamento', title: 'Planejamento' },
            { key: 'programacao', title: 'Programação' },
            { key: 'recursos', title: 'Recursos Necessários' },
            { key: 'observacoes', title: 'Observações' }
          ]}
        />

        {/* ✅ NOVO: Modal para iniciar execução */}
        <IniciarExecucaoModal
          isOpen={showIniciarModal}
          os={osSelecionada}
          onClose={() => {
            setShowIniciarModal(false);
            setOsSelecionada(null);
          }}
          onConfirm={handleConfirmarIniciarExecucao}
          loading={hookLoading}
        />
      </Layout.Main>
    </Layout>
  );
}