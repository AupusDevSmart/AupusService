// src/features/ferramentas/components/FerramentasPage.tsx - CORREÇÃO FINAL
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Wrench, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Ferramenta, FerramentasFilters } from '../types';
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

export function FerramentasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
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

  const handleSubmit = async (data: any) => {
    // ✅ CORREÇÃO: Processar dados de calibração e garantir tipo
    const formattedData = {
      ...data,
      valorDiaria: parseFloat(String(data.valorDiaria)),
      tipo: 'ferramenta', // ✅ Sempre definir como 'ferramenta'
      
      // ✅ CORREÇÃO: Processar dados de calibração corretamente
      necessitaCalibracao: data.calibracao?.necessitaCalibracao || false,
      proximaDataCalibracao: data.calibracao?.proximaDataCalibracao || undefined,
    };
    
    // Remover o campo 'calibracao' temporário
    delete formattedData.calibracao;
    
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
    return titles[modalState.mode];
  };

  const getModalIcon = () => {
    return <Wrench className="h-5 w-5 text-blue-600" />;
  };

  // ✅ CORREÇÃO: Preparar dados para o modal sem loops
  const getModalEntity = () => {
    const entity = modalState.entity;
    
    // Para modo create
    if (modalState.mode === 'create') {
      return {
        tipo: 'ferramenta',
        status: 'disponivel',
        necessitaCalibracao: false,
        proximaDataCalibracao: '',
        // ✅ Não criar objeto calibracao para evitar loops
      };
    }
    
    // Para view/edit, retorna os dados da entidade
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

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <TitleCard
            title="Ferramentas"
            description="Gerencie as ferramentas e equipamentos de medição"
          />
          
          {/* Dashboard de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Total</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.disponiveis}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Disponíveis</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">●</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.emUso}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Em Uso</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚠</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.manutencao}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Manutenção</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.necessitamCalibracao}</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">C/ Calibração</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.calibracaoVencida}</p>
                  <p className="text-sm text-red-700 dark:text-red-300">Cal. Vencida</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.calibracaoVencendo}</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Cal. Vencendo</p>
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
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Ferramenta</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>

          {/* Alertas de Calibração */}
          {(stats.calibracaoVencida > 0 || stats.calibracaoVencendo > 0) && (
            <div className="mb-6 space-y-3">
              {stats.calibracaoVencida > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100">
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
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <div>
                      <h4 className="font-medium text-amber-900 dark:text-amber-100">
                        Calibrações Vencendo
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
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