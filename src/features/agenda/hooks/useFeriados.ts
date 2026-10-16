// src/features/agenda/hooks/useFeriados.ts
import { useState, useCallback } from 'react';
import { agendaService } from '@/services/agenda.services';
import { toast } from '@/hooks/use-toast';
import {
  FeriadoResponse,
  CreateFeriadoData,
  UpdateFeriadoData,
  QueryFeriadosParams,
  FeriadosFilters,
  Pagination,
  AgendaLoadingState,
  FeriadoOperationResult,
  UseFeriadosResult,
  TipoFeriado
} from '../types';

const initialFilters: FeriadosFilters = {
  search: '',
  tipo: 'all',
  plantaId: 'all',
  ano: 'all',
  mes: 'all',
  geral: 'all',
  recorrente: 'all',
  page: 1,
  limit: 10
};

export function useFeriados(): UseFeriadosResult {
  const [feriados, setFeriados] = useState<FeriadoResponse[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState<AgendaLoadingState>({
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false
  });
  const [filters, setFilters] = useState<FeriadosFilters>(initialFilters);

  // Função para buscar feriados
  const fetchFeriados = useCallback(async (params?: QueryFeriadosParams) => {
    try {
      setLoading(prev => ({ ...prev, isLoading: true, error: undefined }));

      const queryParams: QueryFeriadosParams = {
        page: params?.page || filters.page,
        limit: params?.limit || filters.limit,
        search: params?.search || (filters.search !== '' ? filters.search : undefined),
        tipo: params?.tipo || (filters.tipo !== 'all' ? filters.tipo as TipoFeriado : undefined),
        plantaId: params?.plantaId || (filters.plantaId !== 'all' ? filters.plantaId : undefined),
        ano: params?.ano || (filters.ano !== 'all' ? parseInt(filters.ano) : undefined),
        mes: params?.mes || (filters.mes !== 'all' ? parseInt(filters.mes) : undefined),
        geral: params?.geral !== undefined ? params.geral : (filters.geral !== 'all' ? filters.geral === 'true' : undefined),
        recorrente: params?.recorrente !== undefined ? params.recorrente : (filters.recorrente !== 'all' ? filters.recorrente === 'true' : undefined),
        orderBy: params?.orderBy || 'data',
        orderDirection: params?.orderDirection || 'desc'
      };

      console.log('[useFeriados] Buscando feriados:', queryParams);

      const response = await agendaService.getFeriados(queryParams);

      setFeriados(response.data);
      setPagination(response.pagination);

      console.log('[useFeriados] Feriados carregados:', {
        total: response.pagination.total,
        count: response.data.length
      });

    } catch (error) {
      console.error('[useFeriados] Erro ao buscar feriados:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      toast({
        title: "Erro ao carregar feriados",
        description: (error instanceof Error && error.message) || "Não foi possível carregar os feriados.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, isLoading: false }));
    }
  }, [filters]);

  // Função para criar feriado
  const createFeriado = useCallback(async (data: CreateFeriadoData): Promise<FeriadoOperationResult> => {
    try {
      setLoading(prev => ({ ...prev, isCreating: true, error: undefined }));

      console.log('[useFeriados] Criando feriado:', data);

      const novoFeriado = await agendaService.createFeriado(data);

      // Recarregar lista
      await fetchFeriados();

      console.log('[useFeriados] Feriado criado:', novoFeriado.id);

      return {
        success: true,
        data: novoFeriado
      };

    } catch (error) {
      console.error('[useFeriados] Erro ao criar feriado:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      return {
        success: false,
        error: error instanceof Error ? error.message : undefined
      };
    } finally {
      setLoading(prev => ({ ...prev, isCreating: false }));
    }
  }, [fetchFeriados]);

  // Função para atualizar feriado
  const updateFeriado = useCallback(async (id: string, data: Partial<UpdateFeriadoData>): Promise<FeriadoOperationResult> => {
    try {
      setLoading(prev => ({ ...prev, isUpdating: true, error: undefined }));

      console.log('[useFeriados] Atualizando feriado:', id, data);

      const feriadoAtualizado = await agendaService.updateFeriado(id, data);

      // Recarregar lista
      await fetchFeriados();

      console.log('[useFeriados] Feriado atualizado:', feriadoAtualizado.id);

      return {
        success: true,
        data: feriadoAtualizado
      };

    } catch (error) {
      console.error('[useFeriados] Erro ao atualizar feriado:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      return {
        success: false,
        error: error instanceof Error ? error.message : undefined
      };
    } finally {
      setLoading(prev => ({ ...prev, isUpdating: false }));
    }
  }, [fetchFeriados]);

  // Função para deletar feriado
  const deleteFeriado = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(prev => ({ ...prev, isDeleting: true, error: undefined }));

      console.log('[useFeriados] Deletando feriado:', id);

      await agendaService.deleteFeriado(id);

      // Recarregar lista
      await fetchFeriados();

      console.log('[useFeriados] Feriado deletado:', id);

      toast({
        title: "Feriado excluído",
        description: "O feriado foi excluído com sucesso.",
        variant: "default",
      });

    } catch (error) {
      console.error('[useFeriados] Erro ao deletar feriado:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      toast({
        title: "Erro ao excluir feriado",
        description: (error instanceof Error && error.message) || "Não foi possível excluir o feriado.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, isDeleting: false }));
    }
  }, [fetchFeriados]);

  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<FeriadosFilters>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: newFilters.page || 1 // Reset página quando outros filtros mudarem
    };

    setFilters(updatedFilters);
  }, [filters]);

  // Função para mudança de página
  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  return {
    feriados,
    pagination,
    loading,
    filters,
    fetchFeriados,
    createFeriado,
    updateFeriado,
    deleteFeriado,
    setFilters: updateFilters,
    handlePageChange
  };
}