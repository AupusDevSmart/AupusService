// src/features/anomalias/hooks/useAnomaliasApi.ts
import { useState, useCallback } from 'react';
import { anomaliasService, AnomaliasResponse, AnomaliasStats } from '@/services/anomalias.service';
import { Anomalia, AnomaliaFormData } from '../types';

export function useAnomaliasApi() {
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAnomalias = useCallback(async (params: any = {}) => {
    try {
      setLoading(true);
      const response: AnomaliasResponse = await anomaliasService.findAll(params);
      setAnomalias(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
      setCurrentPage(response.pagination?.page || 1);
      return response;
    } catch (error) {
      console.error('Erro ao buscar anomalias:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAnomalia = useCallback(async (data: AnomaliaFormData) => {
    try {
      setLoading(true);
      const response = await anomaliasService.create(data);
      return response;
    } catch (error) {
      console.error('Erro ao criar anomalia:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAnomalia = useCallback(async (id: string, data: Partial<AnomaliaFormData>) => {
    try {
      setLoading(true);
      const response = await anomaliasService.update(id, data);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar anomalia:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAnomalia = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await anomaliasService.remove(id);
    } catch (error) {
      console.error('Erro ao deletar anomalia:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async (periodo?: string): Promise<AnomaliasStats> => {
    try {
      const stats = await anomaliasService.getStats(periodo);
      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }, []);

  const gerarProgramacaoOS = useCallback(async (anomaliaId: string) => {
    try {
      setLoading(true);
      // TODO: Implementar endpoint no backend para criar programação-os a partir de anomalia
      // Por enquanto, vamos simular redirecionamento para página de programação
      const response = await anomaliasService.gerarOS(anomaliaId);
      return response;
    } catch (error) {
      console.error('Erro ao gerar programação de OS:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelar = useCallback(async (anomaliaId: string, motivo?: string) => {
    try {
      setLoading(true);
      const response = await anomaliasService.cancelar(anomaliaId, motivo);
      return response;
    } catch (error) {
      console.error('Erro ao cancelar anomalia:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    anomalias,
    loading,
    total,
    totalPages,
    currentPage,
    fetchAnomalias,
    createAnomalia,
    updateAnomalia,
    deleteAnomalia,
    getStats,
    gerarProgramacaoOS,
    cancelar,
  };
}
