// src/features/equipamentos/components/EquipamentosPage.tsx - CORRIGIDO
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { BaseTable } from '@/components/common/base-table/BaseTable';
import { BaseFilters } from '@/components/common/base-filters/BaseFilters';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowLeft } from 'lucide-react';
import { useGenericTable } from '@/hooks/useGenericTable';
import { Equipamento, EquipamentosFilters } from '../types';
import { getEquipamentosTableColumns } from '../config/table-config';
import { equipamentosFilterConfig } from '../config/filter-config';
import { mockEquipamentos } from '../data/mock-data';

// ✅ NOVOS MODAIS SEPARADOS
import { EquipamentoUCModal } from './modals/EquipamentoUCModal';
import { ComponenteUARModal } from './modals/ComponenteUARModal';
import { GerenciarUARsModal } from './modals/GerenciarUARsModal';

const initialFilters: EquipamentosFilters = {
  search: '',
  proprietarioId: 'all',
  plantaId: 'all',
  classificacao: 'all',
  criticidade: 'all',
  page: 1,
  limit: 10
};

export function EquipamentosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    paginatedData: equipamentos,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange
  } = useGenericTable({
    data: mockEquipamentos,
    initialFilters,
    searchFields: ['nome', 'modelo', 'fabricante', 'numeroSerie', 'localizacao']
  });

  // ============================================================================
  // ESTADOS DOS MODAIS SEPARADOS
  // ============================================================================
  const [modalUC, setModalUC] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit' | 'view',
    entity: null as Equipamento | null
  });

  const [modalUAR, setModalUAR] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit' | 'view',
    entity: null as Equipamento | null,
    equipamentoPai: null as Equipamento | null
  });

  // ✅ NOVO: Modal para gerenciar UARs de uma UC
  const [modalGerenciarUARs, setModalGerenciarUARs] = useState({
    isOpen: false,
    equipamentoUC: null as Equipamento | null
  });

  // ✅ Aplicar filtros da URL quando a página carrega
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const plantaId = urlParams.get('plantaId');
    const plantaNome = urlParams.get('plantaNome');

    if (plantaId && plantaNome) {
      console.log(`Filtrando equipamentos da planta ${plantaId}: ${decodeURIComponent(plantaNome)}`);
      
      handleFilterChange({
        plantaId: plantaId,
        page: 1
      });
    }
  }, [location.search, handleFilterChange]);

  // ✅ Verificar se está filtrando por planta
  const filteredByPlanta = filters.plantaId !== 'all';
  const plantaNome = filteredByPlanta 
    ? decodeURIComponent(new URLSearchParams(location.search).get('plantaNome') || '')
    : '';

  // ============================================================================
  // HANDLERS DOS MODAIS UC
  // ============================================================================
  const openUCModal = (mode: 'create' | 'edit' | 'view', entity: Equipamento | null = null) => {
    // Para modo create, aplica dados iniciais baseados nos filtros
    if (mode === 'create') {
      const urlParams = new URLSearchParams(location.search);
      const plantaId = urlParams.get('plantaId');
      
      const initialData = plantaId ? { plantaId: parseInt(plantaId) } : {};
      setModalUC({ isOpen: true, mode, entity: initialData as Equipamento });
    } else {
      setModalUC({ isOpen: true, mode, entity });
    }
  };

  const closeUCModal = () => {
    setModalUC({ isOpen: false, mode: 'create', entity: null });
  };

  const handleSubmitUC = async (data: any) => {
    console.log('Dados do Equipamento UC:', data);
    
    // Simular salvamento
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    
    closeUCModal();
    
    // Aqui você faria a requisição real para salvar
    // await api.equipamentos.createUC(data);
  };

  // ============================================================================
  // HANDLERS DOS MODAIS UAR
  // ============================================================================
  const openUARModal = (mode: 'create' | 'edit' | 'view', entity: Equipamento | null = null, equipamentoPai: Equipamento | null = null) => {
    setModalUAR({ isOpen: true, mode, entity, equipamentoPai });
  };

  const closeUARModal = () => {
    setModalUAR({ isOpen: false, mode: 'create', entity: null, equipamentoPai: null });
  };

  const handleSubmitUAR = async (data: any) => {
    console.log('Dados do Componente UAR:', data);
    
    // Simular salvamento
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    
    closeUARModal();
    
    // Aqui você faria a requisição real para salvar
    // await api.equipamentos.createUAR(data);
  };

  // ============================================================================
  // HANDLERS PARA GESTÃO DE COMPONENTES (NOVO)
  // ============================================================================
  const handleGerenciarComponentes = (equipamento: Equipamento) => {
    if (equipamento.classificacao !== 'UC') {
      alert('Apenas equipamentos UC podem ter componentes UAR!');
      return;
    }

    // Abrir modal de gerenciamento de UARs
    setModalGerenciarUARs({
      isOpen: true,
      equipamentoUC: equipamento
    });
  };

  const closeGerenciarUARsModal = () => {
    setModalGerenciarUARs({
      isOpen: false,
      equipamentoUC: null
    });
  };

  const handleSalvarUARs = async (uars: Equipamento[]) => {
    console.log('Salvando UARs do equipamento:', modalGerenciarUARs.equipamentoUC?.nome, uars);
    
    // Simular salvamento
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    
    // Aqui você faria a requisição real para salvar
    // await api.equipamentos.updateUARs(modalGerenciarUARs.equipamentoUC?.id, uars);
    
    alert(`${uars.length} componente(s) UAR salvos com sucesso!`);
  };

  // ============================================================================
  // HANDLERS GERAIS DA TABELA
  // ============================================================================
  const handleView = (equipamento: Equipamento) => {
    if (equipamento.classificacao === 'UC') {
      openUCModal('view', equipamento);
    } else {
      openUARModal('view', equipamento, equipamento.equipamentoPai);
    }
  };

  const handleEdit = (equipamento: Equipamento) => {
    if (equipamento.classificacao === 'UC') {
      openUCModal('edit', equipamento);
    } else {
      openUARModal('edit', equipamento, equipamento.equipamentoPai);
    }
  };

  // ✅ Handler para voltar às plantas
  const handleBackToPlantas = () => {
    navigate('/plantas');
  };

  // ✅ Handler para limpar filtro de planta
  const handleClearPlantaFilter = () => {
    navigate('/equipamentos');
    handleFilterChange({
      plantaId: 'all',
      page: 1
    });
  };

  // ============================================================================
  // PREPARAR COLUNAS DA TABELA
  // ============================================================================
  const tableColumns = getEquipamentosTableColumns({
    onGerenciarComponentes: handleGerenciarComponentes
  });

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <Layout>
      <Layout.Main>
        <div className="flex flex-col h-97 w-full mb-8">
          {/* ✅ Header com informações do filtro de planta */}
          {filteredByPlanta ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToPlantas}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar às Plantas
                </Button>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-green-600" />
                    <div>
                      <h2 className="font-semibold text-green-900 dark:text-green-100">
                        Equipamentos de {plantaNome}
                      </h2>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Visualizando {equipamentos.length} {equipamentos.length === 1 ? 'equipamento' : 'equipamentos'} desta planta
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearPlantaFilter}
                    className="border-green-200 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-800"
                  >
                    Ver Todos os Equipamentos
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <TitleCard
              title="Equipamentos"
              description="Gerencie equipamentos (UC) e seus componentes (UAR)"
            />
          )}
          
          <div className="flex flex-col gap-4 mb-6">
            {/* Filtros - responsivos */}
            <div className="w-full">
              <BaseFilters 
                filters={filters}
                config={equipamentosFilterConfig}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* Botões de Ação - responsivos */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button 
                onClick={() => openUCModal('create')}
                className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
              >
                <Wrench className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Equipamento UC</span>
                <span className="sm:hidden">Novo UC</span>
              </Button>
              
              {/* <Button 
                variant="outline"
                onClick={() => openUARModal('create')}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
              >
                <Component className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Componente UAR</span>
                <span className="sm:hidden">Novo UAR</span>
              </Button> */}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <BaseTable
              data={equipamentos}
              columns={tableColumns}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onView={handleView}
              onEdit={handleEdit}
              emptyMessage={
                filteredByPlanta 
                  ? `Nenhum equipamento encontrado para ${plantaNome}.`
                  : "Nenhum equipamento encontrado."
              }
              emptyIcon={<Wrench className="h-8 w-8 text-muted-foreground/50" />}
            />
          </div>
        </div>

        {/* ============================================================================ */}
        {/* MODAIS SEPARADOS PARA UC E UAR */}
        {/* ============================================================================ */}
        
        {/* Modal para Equipamentos UC */}
        <EquipamentoUCModal
          isOpen={modalUC.isOpen}
          mode={modalUC.mode}
          entity={modalUC.entity}
          onClose={closeUCModal}
          onSubmit={handleSubmitUC}
        />

        {/* Modal para Componentes UAR */}
        <ComponenteUARModal
          isOpen={modalUAR.isOpen}
          mode={modalUAR.mode}
          entity={modalUAR.entity}
          equipamentoPai={modalUAR.equipamentoPai}
          onClose={closeUARModal}
          onSubmit={handleSubmitUAR}
        />

        {/* ✅ NOVO: Modal para Gerenciar UARs de uma UC */}
        <GerenciarUARsModal
          isOpen={modalGerenciarUARs.isOpen}
          equipamentoUC={modalGerenciarUARs.equipamentoUC}
          onClose={closeGerenciarUARsModal}
          onSave={handleSalvarUARs}
        />
      </Layout.Main>
    </Layout>
  );
}