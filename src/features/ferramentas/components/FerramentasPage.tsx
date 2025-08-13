// src/features/ferramentas/components/FerramentasPage.tsx - DESIGN SIMPLIFICADO
import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable, CustomAction } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Wrench, AlertTriangle, CheckCircle, Calendar, Settings, Package } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Ferramenta, FerramentasFilters, StatusFerramenta } from '../types';
import { ferramentasTableColumns } from '../config/table-config';
import { ferramentasFilterConfig } from '../config/filter-config';
import { ferramentasFormFields } from '../config/form-config';
import { mockFerramentas } from '../data/mock-data';

const initialFilters: FerramentasFilters = {
  search: '',
  fabricante: 'all',
  status: 'all',
  necessitaCalibracao: 'all',
  responsavel: 'all',
  page: 1,
  limit: 10
};

interface FerramentaFormShape {
  nome: string;
  codigoPatrimonial: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  calibracao: {
    necessitaCalibracao: boolean;
    proximaDataCalibracao?: string;
  };
  valorDiaria: string; // It's a string from the input
  localizacaoAtual: string;
  responsavel: string;
  dataAquisicao: string;
  status: StatusFerramenta;
  observacoes?: string;
  foto?: string;
}

export function FerramentasPage() {
  const {
    paginatedData: ferramentas,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockFerramentas,
    initialFilters,
    searchFields: ['nome', 'codigoPatrimonial', 'fabricante', 'modelo', 'numeroSerie', 'responsavel']
  });

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<Ferramenta>();

  // Contadores para dashboard
  const [stats, setStats] = useState({
    total: 0,
    disponiveis: 0,
    emUso: 0,
    manutencao: 0,
    necessitamCalibracao: 0,
    calibracaoVencida: 0,
    calibracaoVencendo: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    const total = mockFerramentas.length;
    const disponiveis = mockFerramentas.filter(f => f.status === 'disponivel').length;
    const emUso = mockFerramentas.filter(f => f.status === 'em_uso').length;
    const manutencao = mockFerramentas.filter(f => f.status === 'manutencao').length;
    const necessitamCalibracao = mockFerramentas.filter(f => f.necessitaCalibracao).length;
    
    // Verificar calibrações vencidas/vencendo
    const hoje = new Date();
    let calibracaoVencida = 0;
    let calibracaoVencendo = 0;
    
    mockFerramentas.forEach(ferramenta => {
      if (ferramenta.necessitaCalibracao && ferramenta.proximaDataCalibracao) {
        const proximaCalibracao = new Date(ferramenta.proximaDataCalibracao);
        const diasRestantes = Math.ceil((proximaCalibracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes < 0) {
          calibracaoVencida++;
        } else if (diasRestantes <= 30) {
          calibracaoVencendo++;
        }
      }
    });

    setStats({
      total,
      disponiveis,
      emUso,
      manutencao,
      necessitamCalibracao,
      calibracaoVencida,
      calibracaoVencendo
    });
  }, []);

  const handleSuccess = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: FerramentaFormShape) => {
    // Processar dados de calibração e garantir tipo
    const { calibracao, ...rest } = data;
    const formattedData = {
      ...rest,
      valorDiaria: parseFloat(String(data.valorDiaria)),
      tipo: 'ferramenta' as const,
      necessitaCalibracao: calibracao?.necessitaCalibracao || false,
      proximaDataCalibracao: calibracao?.proximaDataCalibracao || undefined,
    };
    
    console.log('Dados da ferramenta para salvar:', formattedData);
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Nova Ferramenta',
      edit: 'Editar Ferramenta', 
      view: 'Visualizar Ferramenta'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Ferramenta';
  };

  const getModalIcon = () => {
    return <Wrench className="h-5 w-5 text-primary" />;
  };

  // Preparar dados para o modal
  const getModalEntity = () => {
    const entity = modalState.entity;
    
    if (modalState.mode === 'create') {
      return {
        id: 0, // Add a temporary ID
        nome: '',
        tipo: 'ferramenta',
        codigoPatrimonial: '',
        fabricante: '',
        modelo: '',
        numeroSerie: '',
        necessitaCalibracao: false,
        proximaDataCalibracao: '',
        valorDiaria: 0,
        localizacaoAtual: '',
        responsavel: '',
        dataAquisicao: new Date().toISOString().split('T')[0],
        status: 'disponivel',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
    }
    
    return entity;
  };

  const handleView = (ferramenta: Ferramenta) => {
    console.log('Clicou em Visualizar:', ferramenta);
    openModal('view', ferramenta);
  };

  const handleEdit = (ferramenta: Ferramenta) => {
    console.log('Clicou em Editar:', ferramenta);
    openModal('edit', ferramenta);
  };

  // Ações customizadas para a tabela
  const customActions: CustomAction<Ferramenta>[] = useMemo(() => [
    {
      key: 'manutencao',
      label: 'Manutenção',
      icon: <Settings className="h-4 w-4" />,
      variant: 'secondary',
      condition: (ferramenta) => ferramenta.status === 'disponivel',
      handler: (ferramenta) => {
        alert(`Enviando ${ferramenta.nome} para manutenção`);
      }
    },
    {
      key: 'calibrar',
      label: 'Calibrar',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'outline',
      condition: (ferramenta) => ferramenta.necessitaCalibracao && ferramenta.status === 'disponivel',
      handler: (ferramenta) => {
        alert(`Agendando calibração para ${ferramenta.nome}`);
      }
    }
  ], []);

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Ferramentas"
            description="Gerencie as ferramentas e equipamentos de medição"
          />
          
          {/* Dashboard de Estatísticas - Design mais limpo */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.disponiveis}</p>
                  <p className="text-sm text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.emUso}</p>
                  <p className="text-sm text-muted-foreground">Em Uso</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.manutencao}</p>
                  <p className="text-sm text-muted-foreground">Manutenção</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.necessitamCalibracao}</p>
                  <p className="text-sm text-muted-foreground">C/ Calibração</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.calibracaoVencida}</p>
                  <p className="text-sm text-muted-foreground">Cal. Vencida</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.calibracaoVencendo}</p>
                  <p className="text-sm text-muted-foreground">Cal. Vencendo</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={ferramentasFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <Button 
              onClick={() => openModal('create')}
              className="shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Ferramenta</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>

          {/* Alertas de Calibração - Design mais sutil */}
          {(stats.calibracaoVencida > 0 || stats.calibracaoVencendo > 0) && (
            <div className="mb-6 space-y-3">
              {stats.calibracaoVencida > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                        Calibrações Vencidas
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {stats.calibracaoVencida} ferramenta(s) com calibração vencida. 
                        Verifique urgentemente para evitar problemas de precisão.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {stats.calibracaoVencendo > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                        Calibrações Vencendo
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {stats.calibracaoVencendo} ferramenta(s) com calibração vencendo em 30 dias. 
                        Agende a calibração preventivamente.
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
              data={ferramentas}
              columns={ferramentasTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              customActions={customActions}
              emptyMessage="Nenhuma ferramenta encontrada."
              emptyIcon={<Wrench className="h-8 w-8 text-muted-foreground/50" />}
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
          formFields={ferramentasFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[700px]"
        />
      </Layout.Main>
    </Layout>
  );
}