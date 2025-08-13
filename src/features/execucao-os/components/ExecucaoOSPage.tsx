// src/features/execucao-os/components/ExecucaoOSPage.tsx
import { useState, useEffect } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Eye, 
  Edit, 
  Calendar,
  Timer,
  AlertTriangle,
  Clock,
  FileText,
  Camera,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { ExecucaoOS, ExecucaoOSFilters, ChecklistAtividade, MaterialConsumido, FerramentaUtilizada, StatusExecucaoOS } from '../types';
import { execucaoOSTableColumns } from '../config/table-config';
import { execucaoOSFilterConfig } from '../config/filter-config';
import { execucaoOSFormFields } from '../config/form-config';
import { mockExecucoesOS } from '../data/mock-data';
import { useExecucaoOS } from '../hooks/useExecucaoOS';

interface ExecucaoOSFormData {
  id?: string;
  numeroOS?: string;
  descricaoOS?: string;
  localAtivo?: string;
  statusExecucao?: StatusExecucaoOS;
  dataInicioReal?: string;
  horaInicioReal?: string;
  dataFimReal?: string;
  horaFimReal?: string;
  responsavelExecucao?: string;
  equipePresente?: string;
  checklistAtividades?: ChecklistAtividade[];
  materiaisConsumidos?: MaterialConsumido[];
  ferramentasUtilizadas?: FerramentaUtilizada[];
  resultadoServico?: string;
  problemasEncontrados?: string;
  recomendacoes?: string;
  proximaManutencao?: string;
  avaliacaoQualidade?: number;
  observacoesQualidade?: string;
}

const initialFilters: ExecucaoOSFilters = {
  search: '',
  statusExecucao: 'all',
  tipo: 'all',
  prioridade: 'all',
  responsavel: 'all',
  dataExecucao: '',
  periodo: 'all',
  planta: 'all',
  page: 1,
  limit: 10
};

export function ExecucaoOSPage() {
  
  const {
    paginatedData: execucoes,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockExecucoesOS,
    initialFilters,
    searchFields: ['responsavelExecucao'],
    customFilters: {
      periodo: (item: ExecucaoOS, value: string) => {
        if (value === 'all') return true;
        
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        
        const itemDate = item.dataInicioReal ? new Date(item.dataInicioReal) : 
                        item.os.dataProgramada ? new Date(item.os.dataProgramada) : null;
        if (!itemDate) return false;
        
        switch (value) {
          case 'hoje':
            return itemDate.toDateString() === hoje.toDateString();
          case 'ontem':
            return itemDate.toDateString() === ontem.toDateString();
          case 'esta_semana':
            const tempHojeInicio = new Date(hoje);
            const inicioSemana = new Date(tempHojeInicio.setDate(tempHojeInicio.getDate() - tempHojeInicio.getDay()));
            const tempHojeFim = new Date(hoje);
            const fimSemana = new Date(tempHojeFim.setDate(tempHojeFim.getDate() + (6 - tempHojeFim.getDay() + hoje.getDay())));
            return itemDate >= inicioSemana && itemDate <= fimSemana;
          default:
            return true;
        }
      }
    }
  });

  const {
    pausarExecucao,
    retomarExecucao,
    finalizarExecucao,
    cancelarExecucao,
    editarExecucao,
    gerarRelatorioExecucao,
    exportarDadosExecucao,
    loading: hookLoading
  } = useExecucaoOS();

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<ExecucaoOS>();

  // Contadores para dashboard
  const [stats, setStats] = useState({
    total: 0,
    programadas: 0,
    emExecucao: 0,
    pausadas: 0,
    finalizadas: 0,
    atrasadas: 0,
    criticas: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    const total = mockExecucoesOS.length;
    const programadas = mockExecucoesOS.filter(exec => exec.statusExecucao === 'PROGRAMADA').length;
    const emExecucao = mockExecucoesOS.filter(exec => exec.statusExecucao === 'EM_EXECUCAO').length;
    const pausadas = mockExecucoesOS.filter(exec => exec.statusExecucao === 'PAUSADA').length;
    const finalizadas = mockExecucoesOS.filter(exec => exec.statusExecucao === 'FINALIZADA').length;
    const criticas = mockExecucoesOS.filter(exec => exec.os.prioridade === 'CRITICA').length;
    
    // Calcular OS atrasadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let atrasadas = 0;
    mockExecucoesOS.forEach(exec => {
      if (exec.os.dataProgramada && exec.statusExecucao === 'PROGRAMADA') {
        const dataProgramada = new Date(exec.os.dataProgramada);
        dataProgramada.setHours(0, 0, 0, 0);
        
        if (dataProgramada < hoje) {
          atrasadas++;
        }
      }
    });

    setStats({
      total,
      programadas,
      emExecucao,
      pausadas,
      finalizadas,
      atrasadas,
      criticas
    });
  }, []);

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: ExecucaoOSFormData) => {
    if (!modalState.entity) return;
    
    try {
      console.log('💾 Salvando dados da execução:', data);
      
      if (modalState.mode === 'finalizar') {
        // Para finalização, garantir que os campos obrigatórios estão preenchidos
        await finalizarExecucao(String(modalState.entity.id), {
          resultadoServico: data.resultadoServico || '', // Garantir que não seja undefined
          problemasEncontrados: data.problemasEncontrados || '',
          recomendacoes: data.recomendacoes || '',
          proximaManutencao: data.proximaManutencao || '',
          materiaisConsumidos: data.materiaisConsumidos || [],
          ferramentasUtilizadas: data.ferramentasUtilizadas || [],
          avaliacaoQualidade: data.avaliacaoQualidade || 0,
          observacoesQualidade: data.observacoesQualidade || ''
        });
      } else {
        // Mapear campos do formulário para a estrutura da execução
        // Garantir que statusExecucao seja do tipo correto
        const statusExecucao = data.statusExecucao as StatusExecucaoOS | undefined;
        
        const dadosExecucao = {
          statusExecucao,
          dataInicioReal: data.dataInicioReal,
          horaInicioReal: data.horaInicioReal,
          dataFimReal: data.dataFimReal,
          horaFimReal: data.horaFimReal,
          responsavelExecucao: data.responsavelExecucao,
          equipePresente: data.equipePresente ? data.equipePresente.split(',').map((nome: string) => nome.trim()) : [],
          checklistAtividades: data.checklistAtividades || [],
          materiaisConsumidos: data.materiaisConsumidos || [],
          resultadoServico: data.resultadoServico,
          problemasEncontrados: data.problemasEncontrados,
          recomendacoes: data.recomendacoes,
          proximaManutencao: data.proximaManutencao,
          avaliacaoQualidade: data.avaliacaoQualidade,
          observacoesQualidade: data.observacoesQualidade
        };
        
        await editarExecucao(String(modalState.entity.id), dadosExecucao);
      }
      
      await handleSuccess();
    } catch (error) {
      console.error('Erro ao salvar execução:', error);
      alert('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const getModalTitle = () => {
    const titles = {
      view: 'Visualizar Execução',
      edit: 'Editar Execução',
      finalizar: 'Finalizar Execução',
      anexos: 'Gerenciar Anexos'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Execução de OS';
  };

  const getModalIcon = () => {
    const icons = {
      view: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      edit: <Edit className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      finalizar: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
      anexos: <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
    };
    return icons[modalState.mode as keyof typeof icons] || <Timer className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
  };

  const getModalEntity = () => {
    if (!modalState.entity) return null;
    
    const execucao = modalState.entity;
    
    // Transformar dados para o formato do formulário
    return {
      id: execucao.id, // Adicionar o ID aqui
      numeroOS: execucao.os.numeroOS,
      descricaoOS: execucao.os.descricao,
      localAtivo: `${execucao.os.local} - ${execucao.os.ativo}`,
      statusExecucao: execucao.statusExecucao,
      dataInicioReal: execucao.dataInicioReal,
      horaInicioReal: execucao.horaInicioReal,
      dataFimReal: execucao.dataFimReal,
      horaFimReal: execucao.horaFimReal,
      responsavelExecucao: execucao.responsavelExecucao,
      equipePresente: execucao.equipePresente.join(', '),
      checklistAtividades: execucao.checklistAtividades,
      materiaisConsumidos: execucao.materiaisConsumidos,
      ferramentasUtilizadas: execucao.ferramentasUtilizadas,
      resultadoServico: execucao.resultadoServico,
      problemasEncontrados: execucao.problemasEncontrados,
      recomendacoes: execucao.recomendacoes,
      proximaManutencao: execucao.proximaManutencao,
      avaliacaoQualidade: execucao.avaliacaoQualidade,
      observacoesQualidade: execucao.observacoesQualidade
    };
  };

  const handleView = (execucao: ExecucaoOS) => {
    console.log('Visualizar execução:', execucao);
    openModal('view', execucao);
  };

  const handleEdit = (execucao: ExecucaoOS) => {
    console.log('Editar execução:', execucao);
    openModal('edit', execucao);
  };

  // Ações de execução
  const handleIniciar = async (execucao: ExecucaoOS) => {
    console.log('Iniciando execução:', execucao.id);
    try {
      await retomarExecucao(String(execucao.id));
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
    }
  };

  const handlePausar = async (execucao: ExecucaoOS) => {
    console.log('Pausando execução:', execucao.id);
    try {
      const motivo = prompt('Motivo da pausa (opcional):');
      await pausarExecucao(String(execucao.id), motivo || undefined);
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao pausar execução:', error);
    }
  };

  const handleFinalizar = async (execucao: ExecucaoOS) => {
    console.log('Finalizando execução:', execucao.id);
    openModal('finalizar', execucao);
  };

  const handleCancelar = async (execucao: ExecucaoOS) => {
    console.log('Cancelando execução:', execucao.id);
    try {
      const motivo = prompt('Motivo do cancelamento:');
      if (!motivo) return;
      
      await cancelarExecucao(String(execucao.id), motivo);
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao cancelar execução:', error);
    }
  };

  const handleAnexos = (execucao: ExecucaoOS) => {
    console.log('Gerenciar anexos:', execucao.id);
    openModal('anexos', execucao);
  };

  const handleExportar = async () => {
    console.log('Exportando execuções...');
    try {
      const ids = execucoes.map(exec => String(exec.id));
      const blob = await exportarDadosExecucao(ids);
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `execucoes-os-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const handleGerarRelatorio = async (execucao: ExecucaoOS) => {
    console.log('Gerando relatório de execução:', execucao.id);
    try {
      const blob = await gerarRelatorioExecucao(String(execucao.id));
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-execucao-${execucao.os.numeroOS}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const handleAtualizar = async () => {
    console.log('Atualizando dados...');
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Execução de Ordens de Serviço"
            description="Acompanhe e gerencie a execução das ordens de serviço em campo"
          />
          
          {/* Dashboard */}
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
                <Pause className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pausadas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pausadas</div>
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
                <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.atrasadas}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Atrasadas</div>
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
          
          {/* Filtros e Ações */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={execucaoOSFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAtualizar} disabled={loading || hookLoading}>
                <RefreshCw className={`mr-1 h-4 w-4 ${(loading || hookLoading) ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleExportar}>
                <Download className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Relatório</span>
              </Button>
            </div>
          </div>

          {/* Alertas importantes */}
          {(stats.atrasadas > 0 || stats.criticas > 0) && (
            <div className="mb-6 space-y-3">
              {stats.atrasadas > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
                        {stats.atrasadas} OS em atraso
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Ordens de serviço que passaram da data programada e ainda não foram executadas.
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
                        {stats.criticas} OS críticas
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Ordens de serviço com prioridade crítica requerem atenção imediata.
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
              data={execucoes}
              columns={execucaoOSTableColumns}
              pagination={pagination}
              loading={loading || hookLoading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhuma execução de OS encontrada."
              emptyIcon={<FileText className="h-8 w-8 text-gray-400" />}
              customActions={[
                {
                  key: 'iniciar',
                  label: 'Iniciar',
                  handler: handleIniciar,
                  condition: (item: ExecucaoOS) => item.statusExecucao === 'PROGRAMADA',
                  icon: <Play className="h-4 w-4" />,
                  variant: 'default'
                },
                {
                  key: 'pausar',
                  label: 'Pausar',
                  handler: handlePausar,
                  condition: (item: ExecucaoOS) => item.statusExecucao === 'EM_EXECUCAO',
                  icon: <Pause className="h-4 w-4" />,
                  variant: 'outline'
                },
                {
                  key: 'finalizar',
                  label: 'Finalizar',
                  handler: handleFinalizar,
                  condition: (item: ExecucaoOS) => item.statusExecucao === 'EM_EXECUCAO' || item.statusExecucao === 'PAUSADA',
                  icon: <CheckCircle className="h-4 w-4" />
                },
                {
                  key: 'relatorio',
                  label: 'Relatório',
                  handler: handleGerarRelatorio,
                  condition: (item: ExecucaoOS) => item.statusExecucao !== 'PROGRAMADA',
                  icon: <FileText className="h-4 w-4" />,
                  variant: 'outline'
                },
                {
                  key: 'anexos',
                  label: 'Anexos',
                  handler: handleAnexos,
                  condition: (item: ExecucaoOS) => item.statusExecucao !== 'PROGRAMADA',
                  icon: <Camera className="h-4 w-4" />,
                  variant: 'outline'
                },
                {
                  key: 'cancelar',
                  label: 'Cancelar',
                  handler: handleCancelar,
                  condition: (item: ExecucaoOS) => item.statusExecucao !== 'FINALIZADA' && item.statusExecucao !== 'CANCELADA',
                  icon: <X className="h-4 w-4" />,
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
          formFields={execucaoOSFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[1200px]"
          groups={[
            { key: 'informacoes_os', title: 'Informações da OS' },
            { key: 'controle_execucao', title: 'Controle de Execução' },
            { key: 'equipe_responsavel', title: 'Equipe e Responsável' },
            { key: 'atividades_checklist', title: 'Atividades e Checklist' },
            { key: 'recursos_materiais', title: 'Recursos e Materiais' },
            { key: 'resultados_qualidade', title: 'Resultados e Qualidade' }
          ]}
        />
      </Layout.Main>
    </Layout>
  );
}