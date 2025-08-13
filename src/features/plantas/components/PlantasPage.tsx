// src/features/plantas/components/PlantasPage.tsx - ATUALIZADO
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { BaseModal } from '@/components/common/base-modal/BaseModal';
import { Button } from '@/components/ui/button';
import { Plus, Factory, ArrowLeft } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { useGenericModal } from '@/hooks/useGenericModal';
import { Planta, PlantasFilters } from '../types';
import { plantasTableColumns } from '../config/table-config';
import { plantasFilterConfig } from '../config/filter-config';
import { plantasFormFields } from '../config/form-config';
import { mockPlantas } from '../data/mock-data';

const initialFilters: PlantasFilters = {
  search: '',
  proprietarioId: 'all',
  page: 1,
  limit: 5
};

export function PlantasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    paginatedData: plantas,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockPlantas,
    initialFilters,
    searchFields: ['nome', 'cnpj', 'localizacao']
  });

  const {
    modalState,
    openModal,
    closeModal
  } = useGenericModal<Planta>();

  // ✅ Aplicar filtros da URL quando a página carrega
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const proprietarioId = urlParams.get('proprietarioId');
    const proprietarioNome = urlParams.get('proprietarioNome');

    if (proprietarioId && proprietarioNome) {
      console.log(`Filtrando plantas do proprietário ${proprietarioId}: ${decodeURIComponent(proprietarioNome)}`);
      
      // Aplicar filtro do proprietário usando handleFilterChange
      handleFilterChange({
        proprietarioId: proprietarioId,
        page: 1 // Reset para primeira página
      });
    }
  }, [location.search, handleFilterChange]);

  // ✅ Verificar se está filtrando por proprietário
  const filteredByProprietario = filters.proprietarioId !== 'all';
  const proprietarioNome = filteredByProprietario 
    ? decodeURIComponent(new URLSearchParams(location.search).get('proprietarioNome') || '')
    : '';

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
      // Garantir que proprietarioId seja um número
      proprietarioId: data.proprietarioId ? parseInt(String(data.proprietarioId)) : null
    };
    
    console.log('Dados da planta para salvar:', formattedData);
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    await handleSuccess();
  };

  // ✅ Handler para voltar aos usuários
  const handleBackToUsuarios = () => {
    navigate('/usuarios');
  };

  // ✅ Handler para limpar filtro de proprietário
  const handleClearProprietarioFilter = () => {
    navigate('/plantas');
    handleFilterChange({
      proprietarioId: 'all',
      page: 1
    });
  };

  const getModalTitle = () => {
    const titles = {
      create: 'Nova Planta',
      edit: 'Editar Planta', 
      view: 'Visualizar Planta'
    };
    return titles[modalState.mode as keyof typeof titles] || 'Planta';
  };

  const getModalIcon = () => {
    return <Factory className="h-5 w-5 text-blue-600" />;
  };

  // ✅ ATUALIZADO: Preparar dados para o modal passando a entidade correta
  const getModalEntity = () => {
    const entity = modalState.entity;
    
    // Para modo create, aplica dados iniciais baseados nos filtros
    if (modalState.mode === 'create') {
      const urlParams = new URLSearchParams(location.search);
      const proprietarioId = urlParams.get('proprietarioId');
      
      return {
        id: 0,
        // ✅ Pré-selecionar proprietário se veio do filtro
        proprietarioId: proprietarioId ? parseInt(proprietarioId) : null
      };
    }
    
    // ✅ IMPORTANTE: Para view/edit, retorna os dados completos da entidade
    return entity;
  };

  // Debug handlers para verificar se os cliques funcionam
  const handleView = (planta: Planta) => {
    console.log('Clicou em Visualizar:', planta);
    openModal('view', planta);
  };

  const handleEdit = (planta: Planta) => {
    console.log('Clicou em Editar:', planta);
    openModal('edit', planta);
  };

  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-full w-full">
          {/* ✅ Header com informações do filtro de proprietário */}
          {filteredByProprietario ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToUsuarios}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar aos Usuários
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Factory className="h-5 w-5 text-blue-600" />
                    <div>
                      <h2 className="font-semibold text-blue-900 dark:text-blue-100">
                        Plantas de {proprietarioNome}
                      </h2>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Visualizando {plantas.length} {plantas.length === 1 ? 'planta' : 'plantas'} deste proprietário
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearProprietarioFilter}
                    className="border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-800"
                  >
                    Ver Todas as Plantas
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <TitleCard
              title="Plantas"
              description="Gerencie as plantas cadastradas no sistema"
            />
          )}
          
          {/* Filtros e Ação */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <BaseFilters 
                filters={filters}
                config={plantasFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            <Button 
              onClick={() => openModal('create')}
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Planta
            </Button>
          </div>

          {/* Tabela */}
          <div className="flex-1 min-h-0">
            <BaseTable
              data={plantas}
              columns={plantasTableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage={
                filteredByProprietario 
                  ? `Nenhuma planta encontrada para ${proprietarioNome}.`
                  : "Nenhuma planta encontrada."
              }
              emptyIcon={<Factory className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* ✅ ATUALIZADO: Modal com entidade e mode corretos */}
        <BaseModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          entity={getModalEntity()}
          title={getModalTitle()}
          icon={getModalIcon()}
          formFields={plantasFormFields}
          onClose={closeModal}
          onSubmit={handleSubmit}
          width="w-[600px]"
        />
      </Layout.Main>
    </Layout>
  );
}