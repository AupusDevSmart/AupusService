// src/features/equipamentos/hooks/useEquipamentoFilters.ts - FILTROS DINÂMICOS
import { useState, useEffect, useCallback, useMemo } from 'react';
import { selectionDataService } from '@/services/selection-data.services';
import { PlantasService } from '@/services/plantas.services';

export interface FilterOption {
  value: string;
  label: string;
}

export interface UseEquipamentoFiltersReturn {
  // Estados de loading
  loadingProprietarios: boolean;
  loadingPlantas: boolean;
  
  // Dados dos filtros
  proprietarios: FilterOption[];
  plantas: FilterOption[];
  
  // Função para carregar plantas por proprietário
  loadPlantasByProprietario: (proprietarioId: string) => Promise<void>;
  
  // Função para carregar dados iniciais
  loadInitialData: () => Promise<void>;
  
  // Função para resetar plantas quando proprietário muda
  resetPlantas: () => void;
  
  // Estado de erro
  error: string | null;
  clearError: () => void;
}

export function useEquipamentoFilters(): UseEquipamentoFiltersReturn {
  const [loadingProprietarios, setLoadingProprietarios] = useState(false);
  const [loadingPlantas, setLoadingPlantas] = useState(false);
  const [proprietarios, setProprietarios] = useState<FilterOption[]>([]);
  const [plantas, setPlantas] = useState<FilterOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // CARREGAR PROPRIETÁRIOS COM PLANTAS
  // ============================================================================
  const loadProprietarios = useCallback(async () => {
    console.log('🔄 [FILTERS] Carregando proprietários...');
    
    try {
      setLoadingProprietarios(true);
      setError(null);
      
      const proprietariosData = await selectionDataService.getProprietarios();
      
      const options: FilterOption[] = [
        { value: 'all', label: 'Todos os Proprietários' },
        ...proprietariosData.map(prop => ({
          value: prop.id,
          label: prop.label || `${prop.nome} - ${prop.totalPlantas} planta${prop.totalPlantas !== 1 ? 's' : ''}`
        }))
      ];
      
      setProprietarios(options);
      console.log('✅ [FILTERS] Proprietários carregados:', options.length - 1); // -1 para não contar "Todos"
      
    } catch (error: any) {
      console.error('❌ [FILTERS] Erro ao carregar proprietários:', error);
      setError('Erro ao carregar proprietários');
      setProprietarios([{ value: 'all', label: 'Todos os Proprietários' }]);
    } finally {
      setLoadingProprietarios(false);
    }
  }, []);

  // ============================================================================
  // CARREGAR TODAS AS PLANTAS (INICIAL)
  // ============================================================================
  const loadTodasPlantas = useCallback(async () => {
    console.log('🔄 [FILTERS] Carregando todas as plantas...');
    
    try {
      setLoadingPlantas(true);
      setError(null);
      
      // Carregar todas as plantas paginadas
      let todasPlantas: any[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const plantasPage = await PlantasService.getAllPlantas({ 
          limit: 100,
          page: page
        });
        
        if (!plantasPage.data || plantasPage.data.length === 0) {
          hasMore = false;
        } else {
          todasPlantas = [...todasPlantas, ...plantasPage.data];
          hasMore = plantasPage.pagination.page < plantasPage.pagination.totalPages;
          page++;
        }
      }
      
      const options: FilterOption[] = [
        { value: 'all', label: 'Todas as Plantas' },
        ...todasPlantas
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map(planta => ({
            value: planta.id,
            label: `${planta.nome} - ${planta.localizacao || 'Localização não informada'}`
          }))
      ];
      
      setPlantas(options);
      console.log('✅ [FILTERS] Todas as plantas carregadas:', options.length - 1); // -1 para não contar "Todas"
      
    } catch (error: any) {
      console.error('❌ [FILTERS] Erro ao carregar plantas:', error);
      setError('Erro ao carregar plantas');
      setPlantas([{ value: 'all', label: 'Todas as Plantas' }]);
    } finally {
      setLoadingPlantas(false);
    }
  }, []);

  // ============================================================================
  // CARREGAR PLANTAS POR PROPRIETÁRIO
  // ============================================================================
  const loadPlantasByProprietario = useCallback(async (proprietarioId: string) => {
    console.log('🔄 [FILTERS] Carregando plantas do proprietário:', proprietarioId);
    
    if (!proprietarioId || proprietarioId === 'all') {
      // Se "Todos os Proprietários", carregar todas as plantas
      await loadTodasPlantas();
      return;
    }
    
    try {
      setLoadingPlantas(true);
      setError(null);
      
      const plantasData = await selectionDataService.getPlantas(proprietarioId);
      
      const options: FilterOption[] = [
        { value: 'all', label: 'Todas as Plantas deste Proprietário' },
        ...plantasData
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map(planta => ({
            value: planta.id,
            label: planta.label || `${planta.nome} - ${planta.localizacao || 'Localização não informada'}`
          }))
      ];
      
      setPlantas(options);
      console.log('✅ [FILTERS] Plantas do proprietário carregadas:', options.length - 1); // -1 para não contar "Todas"
      
    } catch (error: any) {
      console.error('❌ [FILTERS] Erro ao carregar plantas do proprietário:', error);
      setError('Erro ao carregar plantas do proprietário');
      setPlantas([{ value: 'all', label: 'Todas as Plantas' }]);
    } finally {
      setLoadingPlantas(false);
    }
  }, [loadTodasPlantas]);

  // ============================================================================
  // CARREGAR DADOS INICIAIS
  // ============================================================================
  const loadInitialData = useCallback(async () => {
    console.log('🚀 [FILTERS] Carregando dados iniciais dos filtros...');
    
    // Carregar proprietários e todas as plantas em paralelo
    await Promise.all([
      loadProprietarios(),
      loadTodasPlantas()
    ]);
    
    console.log('✅ [FILTERS] Dados iniciais carregados');
  }, [loadProprietarios, loadTodasPlantas]);

  // ============================================================================
  // RESETAR PLANTAS
  // ============================================================================
  const resetPlantas = useCallback(() => {
    console.log('🔄 [FILTERS] Resetando plantas...');
    setPlantas([{ value: 'all', label: 'Todas as Plantas' }]);
  }, []);

  // ============================================================================
  // CLEAR ERROR
  // ============================================================================
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // CARREGAR DADOS NA INICIALIZAÇÃO
  // ============================================================================
  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    // Estados de loading
    loadingProprietarios,
    loadingPlantas,
    
    // Dados dos filtros
    proprietarios,
    plantas,
    
    // Funções
    loadPlantasByProprietario,
    loadInitialData,
    resetPlantas,
    
    // Estado de erro
    error,
    clearError
  };
}