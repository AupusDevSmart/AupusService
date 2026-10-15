// src/features/agenda/hooks/useConfiguracoesDiasUteis.ts
import { useState, useCallback } from 'react';
import { agendaService } from '@/services/agenda.services';
import { toast } from '@/hooks/use-toast';
import {
  ConfiguracaoDiasUteisResponse,
  CreateConfiguracaoDiasUteisData,
  UpdateConfiguracaoDiasUteisData,
  QueryConfiguracoesDiasUteisParams,
  ConfiguracoesDiasUteisFilters,
  Pagination,
  AgendaLoadingState,
  ConfiguracaoDiasUteisOperationResult,
  UseConfiguracoesDiasUteisResult
} from '../types';

const initialFilters: ConfiguracoesDiasUteisFilters = {
  search: '',
  plantaId: 'all',
  geral: 'all',
  sabado: 'all',
  domingo: 'all',
  page: 1,
  limit: 10
};

export function useConfiguracoesDiasUteis(): UseConfiguracoesDiasUteisResult {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoDiasUteisResponse[]>([]);
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
  const [filters, setFilters] = useState<ConfiguracoesDiasUteisFilters>(initialFilters);

  // Função para buscar configurações
  const fetchConfiguracoes = useCallback(async (params?: QueryConfiguracoesDiasUteisParams) => {
    try {
      setLoading(prev => ({ ...prev, isLoading: true, error: undefined }));

      const queryParams: QueryConfiguracoesDiasUteisParams = {
        page: params?.page || filters.page,
        limit: params?.limit || filters.limit,
        search: params?.search || (filters.search !== '' ? filters.search : undefined),
        plantaId: params?.plantaId || (filters.plantaId !== 'all' ? filters.plantaId : undefined),
        geral: params?.geral !== undefined ? params.geral : (filters.geral !== 'all' ? filters.geral === 'true' : undefined),
        sabado: params?.sabado !== undefined ? params.sabado : (filters.sabado !== 'all' ? filters.sabado === 'true' : undefined),
        domingo: params?.domingo !== undefined ? params.domingo : (filters.domingo !== 'all' ? filters.domingo === 'true' : undefined),
        orderBy: params?.orderBy || 'nome',
        orderDirection: params?.orderDirection || 'asc'
      };

      console.log('🔍 [useConfiguracoesDiasUteis] Buscando configurações:', queryParams);

      const response = await agendaService.getConfiguracoesDiasUteis(queryParams);

      setConfiguracoes(response.data);
      setPagination(response.pagination);

      console.log('✅ [useConfiguracoesDiasUteis] Configurações carregadas:', {
        total: response.pagination.total,
        count: response.data.length
      });

    } catch (error) {
      console.error('❌ [useConfiguracoesDiasUteis] Erro ao buscar configurações:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      toast({
        title: "Erro ao carregar configurações",
        description: (error instanceof Error && error.message) || "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, isLoading: false }));
    }
  }, [filters]);

  // Função para criar configuração
  const createConfiguracao = useCallback(async (data: CreateConfiguracaoDiasUteisData): Promise<ConfiguracaoDiasUteisOperationResult> => {
    try {
      setLoading(prev => ({ ...prev, isCreating: true, error: undefined }));

      console.log('➕ [useConfiguracoesDiasUteis] Criando configuração:', data);

      const novaConfiguracao = await agendaService.createConfiguracaoDiasUteis(data);

      // Recarregar lista
      await fetchConfiguracoes();

      console.log('✅ [useConfiguracoesDiasUteis] Configuração criada:', novaConfiguracao.id);

      return {
        success: true,
        data: novaConfiguracao
      };

    } catch (error) {
      console.error('❌ [useConfiguracoesDiasUteis] Erro ao criar configuração:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      return {
        success: false,
        error: error instanceof Error ? error.message : undefined
      };
    } finally {
      setLoading(prev => ({ ...prev, isCreating: false }));
    }
  }, [fetchConfiguracoes]);

  // Função para atualizar configuração
  const updateConfiguracao = useCallback(async (id: string, data: Partial<UpdateConfiguracaoDiasUteisData>): Promise<ConfiguracaoDiasUteisOperationResult> => {
    try {
      setLoading(prev => ({ ...prev, isUpdating: true, error: undefined }));

      console.log('✏️ [useConfiguracoesDiasUteis] Atualizando configuração:', id, data);

      const configuracaoAtualizada = await agendaService.updateConfiguracaoDiasUteis(id, data);

      // Recarregar lista
      await fetchConfiguracoes();

      console.log('✅ [useConfiguracoesDiasUteis] Configuração atualizada:', configuracaoAtualizada.id);

      return {
        success: true,
        data: configuracaoAtualizada
      };

    } catch (error) {
      console.error('❌ [useConfiguracoesDiasUteis] Erro ao atualizar configuração:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      return {
        success: false,
        error: error instanceof Error ? error.message : undefined
      };
    } finally {
      setLoading(prev => ({ ...prev, isUpdating: false }));
    }
  }, [fetchConfiguracoes]);

  // Função para deletar configuração
  const deleteConfiguracao = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(prev => ({ ...prev, isDeleting: true, error: undefined }));

      console.log('🗑️ [useConfiguracoesDiasUteis] Deletando configuração:', id);

      await agendaService.deleteConfiguracaoDiasUteis(id);

      // Recarregar lista
      await fetchConfiguracoes();

      console.log('✅ [useConfiguracoesDiasUteis] Configuração deletada:', id);

      toast({
        title: "Configuração excluída",
        description: "A configuração foi excluída com sucesso.",
        variant: "default",
      });

    } catch (error) {
      console.error('❌ [useConfiguracoesDiasUteis] Erro ao deletar configuração:', error);
      setLoading(prev => ({ ...prev, error: error instanceof Error ? error.message : undefined }));

      toast({
        title: "Erro ao excluir configuração",
        description: (error instanceof Error && error.message) || "Não foi possível excluir a configuração.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, isDeleting: false }));
    }
  }, [fetchConfiguracoes]);

  // Função para atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<ConfiguracoesDiasUteisFilters>) => {
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
    configuracoes,
    pagination,
    loading,
    filters,
    fetchConfiguracoes,
    createConfiguracao,
    updateConfiguracao,
    deleteConfiguracao,
    setFilters: updateFilters,
    handlePageChange
  };
}