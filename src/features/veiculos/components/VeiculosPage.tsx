// src/features/veiculos/components/VeiculosPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Car, AlertTriangle } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Veiculo, VeiculosFilters } from '../types';
import { veiculosTableColumns } from '../config/table-config';
import { veiculosFilterConfig } from '../config/filter-config';
import { veiculosFormFields } from '../config/form-config';
import { mockVeiculos } from '../data/mock-data';

const initialFilters: VeiculosFilters = {
  search: '',
  tipoCombustivel: 'all',
  status: 'all',
  responsavel: 'all',
  anoFabricacao: 'all',
  page: 1,
  limit: 10
};

export function VeiculosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    paginatedData: veiculos,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockVeiculos,
    initialFilters,
    searchFields: ['nome', 'placa', 'marca', 'modelo', 'codigoPatrimonial', 'responsavel']
  });

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<Veiculo>();

  // ✅ Contadores para dashboard
  const [stats, setStats] = useState({
    total: 0,
    disponiveis: 0,
    emUso: 0,
    manutencao: 0,
    documentosVencendo: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    const total = mockVeiculos.length;
    const disponiveis = mockVeiculos.filter(v => v.status === 'disponivel').length;
    const emUso = mockVeiculos.filter(v => v.status === 'em_uso').length;
    const manutencao = mockVeiculos.filter(v => v.status === 'manutencao').length;
    
    // Verificar documentos vencendo (próximos 30 dias)
    const hoje = new Date();
    const documentosVencendo = mockVeiculos.reduce((count, veiculo) => {
      return count + veiculo.documentacao.filter(doc => {
        if (!doc.dataVencimento) return false;
        const vencimento = new Date(doc.dataVencimento);
        const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 30 && diasRestantes >= 0;
      }).length;
    }, 0);

    setStats({
      total,
      disponiveis,
      emUso,
      manutencao,
      documentosVencendo
    });
  }, []);

  const handleSuccess = async () => {
    // Simular refresh dos dados
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    closeModal();
  };

  const handleSubmit = async (data: any) => {
    // Transformar dados do formulário para o formato esperado
    const formattedData = {
      ...data,
      anoFabricacao: parseInt(String(data.anoFabricacao)),
      capacidadeCarga: parseFloat(String(data.capacidadeCarga)),
      autonomiaMedia: parseFloat(String(data.autonomiaMedia)),
      valorDiaria: parseFloat(String(data.valorDiaria)),
      quilometragem: data.quilometragem ? parseInt(String(data.quilometragem)) : undefined,
      documentacao: data.documentacao || [],
      tipo: 'veiculo' // Garantir que sempre seja 'veiculo'
    };
    
    console.log('Dados do veículo para salvar:', formattedData);
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Novo Veículo',
      edit: 'Editar Veículo', 
      view: 'Visualizar Veículo'
    };
    return titles[modalState.mode];
  };

  const getModalIcon = () => {
    return <Car className="h-5 w-5 text-blue-600" />;
  };

  // Preparar dados para o modal
  const getModalEntity = () => {
    const entity = modalState.entity;
    
    // Para modo create, aplica dados iniciais
    if (modalState.mode === 'create') {
      return {
        tipo: 'veiculo',
        documentacao: [],
        status: 'disponivel'
      };
    }
    
    // Para view/edit, retorna os dados da entidade
    return entity;
  };

  const handleView = (veiculo: Veiculo) => {
    console.log('Clicou em Visualizar:', veiculo);
    openModal('view', veiculo);
  };

  const handleEdit = (veiculo: Veiculo) => {
    console.log('Clicou em Editar:', veiculo);
    openModal('edit', veiculo);
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col mb-8 h-full w-full">
          {/* Header */}
          <TitleCard
            title="Veículos"
            description="Gerencie a frota de veículos da empresa"
          />
          
          {/* ✅ Dashboard de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Car className="h-8 w-8 text-blue-600" />
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
            
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.documentosVencendo}</p>
                  <p className="text-sm text-red-700 dark:text-red-300">Docs Vencendo</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={veiculosFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <Button 
              onClick={() => openModal('create')}
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Veículo</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>

          {/* ✅ Alerta de Documentos Vencendo */}
          {stats.documentosVencendo > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Atenção: Documentos Vencendo
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {stats.documentosVencendo} documento(s) vencem nos próximos 30 dias. 
                    Verifique a documentação dos veículos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={veiculos}
              columns={veiculosTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage="Nenhum veículo encontrado."
              emptyIcon={<Car className="h-8 w-8 text-muted-foreground/50" />}
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
          formFields={veiculosFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[700px]"
        />
      </Layout.Main>
    </Layout>
  );
}