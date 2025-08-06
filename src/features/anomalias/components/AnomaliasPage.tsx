// src/features/anomalias/components/AnomaliasPage.tsx - COM PLANEJAR OS
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, CheckCircle, Clock, FileText, BarChart3, Download, Upload, XCircle, Settings, Calendar } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Anomalia, AnomaliasFilters } from '../types';
import { anomaliasTableColumns } from '../config/table-config';
import { anomaliasFilterConfig } from '../config/filter-config';
import { anomaliasFormFields } from '../config/form-config';
import { mockAnomalias } from '../data/mock-data';
import { planejarOSComAnomalia } from '@/utils/planejarOS'; // ✅ NOVA IMPORT

const initialFilters: AnomaliasFilters = {
  search: '',
  periodo: 'all',
  status: 'all',
  prioridade: 'all',
  origem: 'all',
  planta: 'all',
  page: 1,
  limit: 10
};

export function AnomaliasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    paginatedData: anomalias,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockAnomalias,
    initialFilters,
    searchFields: ['descricao', 'local', 'ativo', 'id', 'criadoPor'],
    customFilters: {
      periodo: (item: Anomalia, value: string) => {
        if (value === 'all') return true;
        
        const getMonthYear = (period: string): { month: string; year: string } => {
          const months: Record<string, string> = {
            'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
            'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
            'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
          };
          
          const [month, , year] = period.split(' ');
          return { month: months[month], year };
        };
        
        const { month, year } = getMonthYear(value);
        const anomaliaDate = new Date(item.data);
        const anomaliaMonth = String(anomaliaDate.getMonth() + 1).padStart(2, '0');
        const anomaliaYear = String(anomaliaDate.getFullYear());
        
        return anomaliaMonth === month && anomaliaYear === year;
      },
      planta: (item: Anomalia, value: string) => {
        if (value === 'all') return true;
        return item.plantaId?.toString() === value;
      }
    }
  });

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<Anomalia>();

  // Contadores para dashboard
  const [stats, setStats] = useState({
    total: 0,
    aguardando: 0,
    emAnalise: 0,
    osGerada: 0,
    resolvida: 0,
    cancelada: 0,
    criticas: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    const filteredData = mockAnomalias.filter(anomalia => {
      if (filters.periodo !== 'all' && filters.periodo) {
        const getMonthYear = (period: string): { month: string; year: string } => {
          const months: Record<string, string> = {
            'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
            'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
            'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
          };
          
          const [month, , year] = period.split(' ');
          return { month: months[month], year };
        };
        
        const { month, year } = getMonthYear(filters.periodo);
        const anomaliaDate = new Date(anomalia.data);
        const anomaliaMonth = String(anomaliaDate.getMonth() + 1).padStart(2, '0');
        const anomaliaYear = String(anomaliaDate.getFullYear());
        
        if (!(anomaliaMonth === month && anomaliaYear === year)) {
          return false;
        }
      }
      return true;
    });
    
    const total = filteredData.length;
    const aguardando = filteredData.filter(a => a.status === 'AGUARDANDO').length;
    const emAnalise = filteredData.filter(a => a.status === 'EM_ANALISE').length;
    const osGerada = filteredData.filter(a => a.status === 'OS_GERADA').length;
    const resolvida = filteredData.filter(a => a.status === 'RESOLVIDA').length;
    const cancelada = filteredData.filter(a => a.status === 'CANCELADA').length;
    const criticas = filteredData.filter(a => a.prioridade === 'CRITICA').length;

    setStats({
      total,
      aguardando,
      emAnalise,
      osGerada,
      resolvida,
      cancelada,
      criticas
    });
  }, [filters.periodo]);

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: any) => {
    console.log('Dados da anomalia para salvar:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Nova Anomalia',
      edit: 'Editar Anomalia', 
      view: 'Visualizar Anomalia'
    };
    return titles[modalState.mode];
  };

  const getModalIcon = () => {
    return <AlertTriangle className="h-5 w-5 text-primary" />;
  };

  const getModalEntity = () => {
    const entity = modalState.entity;
    
    if (modalState.mode === 'create') {
      return {
        condicao: 'FUNCIONANDO',
        origem: 'OPERADOR',
        prioridade: 'MEDIA',
        status: 'AGUARDANDO'
      };
    }
    
    return entity;
  };

  const handleView = (anomalia: Anomalia) => {
    console.log('Clicou em Visualizar:', anomalia);
    openModal('view', anomalia);
  };

  const handleEdit = (anomalia: Anomalia) => {
    console.log('Clicou em Editar:', anomalia);
    openModal('edit', anomalia);
  };

  // ✅ NOVA FUNCIONALIDADE: Planejar OS
  const handlePlanejarOS = (anomalia: Anomalia) => {
    console.log('🚨 Planejando OS para anomalia:', anomalia.id);
    planejarOSComAnomalia(anomalia, navigate);
  };

  // Handlers para outras ações
  const handleGerarOS = async (anomalia: Anomalia) => {
    console.log('Gerando OS para anomalia:', anomalia.id);
    alert(`OS gerada para anomalia ${anomalia.id}`);
  };

  const handleResolver = async (anomalia: Anomalia) => {
    console.log('Resolvendo anomalia:', anomalia.id);
    alert(`Anomalia ${anomalia.id} resolvida`);
  };

  const handleCancelar = async (anomalia: Anomalia) => {
    console.log('Cancelando anomalia:', anomalia.id);
    alert(`Anomalia ${anomalia.id} cancelada`);
  };

  // ✅ AÇÕES ATUALIZADAS - Com Planejar OS em destaque
  const customActions: CustomAction<Anomalia>[] = useMemo(() => [
    {
      key: 'planejar_os',
      label: 'Planejar OS',
      icon: <Calendar className="h-4 w-4" />,
      variant: 'default',
      condition: (anomalia) => anomalia.status === 'AGUARDANDO' || anomalia.status === 'EM_ANALISE',
      handler: (anomalia) => handlePlanejarOS(anomalia)
    },
    {
      key: 'gerar_os',
      label: 'Gerar OS',
      icon: <FileText className="h-4 w-4" />,
      variant: 'secondary',
      condition: (anomalia) => anomalia.status === 'AGUARDANDO' || anomalia.status === 'EM_ANALISE',
      handler: (anomalia) => handleGerarOS(anomalia)
    },
    {
      key: 'resolver',
      label: 'Resolver',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default',
      condition: (anomalia) => anomalia.status === 'OS_GERADA' || anomalia.status === 'EM_ANALISE',
      handler: (anomalia) => handleResolver(anomalia)
    },
    {
      key: 'cancelar',
      label: 'Cancelar',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive',
      condition: (anomalia) => anomalia.status !== 'RESOLVIDA' && anomalia.status !== 'CANCELADA',
      handler: (anomalia) => handleCancelar(anomalia)
    },
    {
      key: 'analisar',
      label: 'Analisar',
      icon: <Settings className="h-4 w-4" />,
      variant: 'secondary',
      condition: (anomalia) => anomalia.status === 'AGUARDANDO',
      handler: (anomalia) => {
        alert(`Iniciando análise da anomalia ${anomalia.id}`);
      }
    }
  ], [navigate]);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Anomalias"
            description="Gerencie e monitore anomalias identificadas no sistema"
          />
          
          {/* Dashboard de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.aguardando}</p>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.emAnalise}</p>
                  <p className="text-sm text-muted-foreground">Em Análise</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.osGerada}</p>
                  <p className="text-sm text-muted-foreground">OS Gerada</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.resolvida}</p>
                  <p className="text-sm text-muted-foreground">Resolvidas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.cancelada}</p>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.criticas}</p>
                  <p className="text-sm text-muted-foreground">Críticas</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={anomaliasFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              
              <Button variant="outline" size="sm">
                <Upload className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
              </Button>
              
              <Button 
                onClick={() => openModal('create')}
                className="shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nova Anomalia</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
          </div>

          {/* Alertas de Anomalias Críticas */}
          {stats.criticas > 0 && (
            <div className="mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                      Anomalias Críticas Detectadas
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {stats.criticas} anomalia(s) com prioridade crítica identificadas. 
                      Verifique urgentemente para evitar problemas operacionais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={anomalias}
              columns={anomaliasTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              customActions={customActions}
              emptyMessage="Nenhuma anomalia encontrada."
              emptyIcon={<AlertTriangle className="h-8 w-8 text-muted-foreground/50" />}
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
          formFields={anomaliasFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[800px]"
          groups={[
            { key: 'informacoes_basicas', title: 'Informações Básicas' },
            { key: 'localizacao', title: 'Localização' },
            { key: 'classificacao', title: 'Classificação' },
            { key: 'observacoes', title: 'Observações Adicionais' },
            { key: 'anexos', title: 'Anexos' }
          ]}
        />
      </Layout.Main>
    </Layout>
  );
}