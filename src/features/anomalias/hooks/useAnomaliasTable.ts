// src/features/anomalias/hooks/useAnomaliasTable.ts
import { useState, useEffect, useCallback } from 'react';
import { Anomalia, AnomaliasFilters } from '../types';
import { anomaliasService, AnomaliasStats } from '@/services/anomalias.service';

export interface UseAnomaliasTableReturn {
  // Dados
  anomalias: Anomalia[];
  loading: boolean;
  error: string | null;
  
  // Paginação
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Filtros
  filters: AnomaliasFilters;
  
  // Estatísticas
  stats: AnomaliasStats;
  
  // Ações
  handleFilterChange: (newFilters: Partial<AnomaliasFilters>) => void;
  handlePageChange: (page: number) => void;
  refetch: () => void;
  clearError: () => void;
}

// Filtros iniciais
const initialFilters: AnomaliasFilters = {
  search: '',
  periodo: 'all',
  status: 'all',
  prioridade: 'all',
  origem: 'all',
  planta: 'all',
  unidade: 'all', // NOVO: Filtro por unidade
  page: 1,
  limit: 10,
};

// Estatísticas iniciais
const initialStats: AnomaliasStats = {
  total: 0,
  aguardando: 0,
  emAnalise: 0,
  osGerada: 0,
  resolvida: 0,
  cancelada: 0,
  criticas: 0,
};

export function useAnomaliasTable(): UseAnomaliasTableReturn {
  // Estados
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnomaliasFilters>(initialFilters);
  const [stats, setStats] = useState<AnomaliasStats>(initialStats);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Carregar anomalias
  const loadAnomalias = useCallback(async (currentFilters: AnomaliasFilters) => {
    console.log('🔄 [useAnomaliasTable] Carregando anomalias com filtros:', currentFilters);
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await anomaliasService.findAll(currentFilters);
      console.log('✅ [useAnomaliasTable] Anomalias carregadas:', {
        count: response.data.length,
        pagination: response.pagination
      });
      
      setAnomalias(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar anomalias';
      console.error('❌ [useAnomaliasTable] Erro ao carregar anomalias:', err);
      setError(errorMessage);
      setAnomalias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar estatísticas
  const loadStats = useCallback(async (periodo?: string) => {
    console.log('📊 [useAnomaliasTable] Carregando estatísticas:', periodo);
    
    try {
      const statsData = await anomaliasService.getStats(periodo);
      console.log('✅ [useAnomaliasTable] Estatísticas carregadas:', statsData);
      
      setStats(statsData);
    } catch (err) {
      console.error('❌ [useAnomaliasTable] Erro ao carregar estatísticas:', err);
      // Não define erro aqui para não quebrar a interface principal
      // setError('Erro ao carregar estatísticas');
    }
  }, []);

  // Efeito para carregar dados quando filtros mudam
  useEffect(() => {
    console.log('🎯 [useAnomaliasTable] useEffect triggered com filtros:', filters);
    loadAnomalias(filters);
  }, [filters, loadAnomalias]);

  // Efeito para carregar estatísticas quando período muda
  useEffect(() => {
    console.log('📊 [useAnomaliasTable] Carregando stats para período:', filters.periodo);
    const periodo = filters.periodo !== 'all' ? filters.periodo : undefined;
    loadStats(periodo);
  }, [filters.periodo, loadStats]);

  // Handler para mudança de filtros
  const handleFilterChange = useCallback((newFilters: Partial<AnomaliasFilters>) => {
    console.log('🔄 [useAnomaliasTable] Mudança de filtros:', newFilters);
    
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset para primeira página ao filtrar
    }));
  }, []);

  // Handler para mudança de página
  const handlePageChange = useCallback((page: number) => {
    console.log('📄 [useAnomaliasTable] Mudança de página:', page);
    
    setFilters(prev => ({ 
      ...prev, 
      page 
    }));
  }, []);

  // Função para refetch
  const refetch = useCallback(() => {
    console.log('🔄 [useAnomaliasTable] Refetch solicitado');
    loadAnomalias(filters);
    
    const periodo = filters.periodo !== 'all' ? filters.periodo : undefined;
    loadStats(periodo);
  }, [filters, loadAnomalias, loadStats]);

  return {
    // Dados
    anomalias,
    loading,
    error,
    
    // Paginação
    pagination,
    
    // Filtros
    filters,
    
    // Estatísticas
    stats,
    
    // Ações
    handleFilterChange,
    handlePageChange,
    refetch,
    clearError,
  };
}