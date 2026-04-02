// src/features/instrucoes/hooks/useInstrucoesApi.ts
import { useState, useCallback } from 'react';
import {
  instrucoesApi,
  InstrucaoApiResponse,
  CreateInstrucaoApiData,
  UpdateInstrucaoApiData,
  QueryInstrucoesApiParams,
  DashboardInstrucoesDto,
  InstrucoesListApiResponse,
  AnexoInstrucaoApiResponse,
  AdicionarAoPlanoApiData,
  AssociarAnomaliaApiData,
  AssociarSolicitacaoApiData
} from '@/services/instrucoes.services';

export function useInstrucoesApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instrucoes, setInstrucoes] = useState<InstrucaoApiResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastParams, setLastParams] = useState<QueryInstrucoesApiParams | undefined>();

  const handleError = useCallback((err: any, context?: string) => {
    let message = 'Erro desconhecido';
    if (err?.response?.data?.message) {
      message = err.response.data.message;
    } else if (err?.message) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    }
    console.error(`Erro na API de instrucoes${context ? ` (${context})` : ''}:`, err);
    setError(message);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshData = useCallback(async () => {
    if (lastParams) await fetchInstrucoes(lastParams);
  }, [lastParams]);

  // CRUD

  const createInstrucao = useCallback(async (data: CreateInstrucaoApiData): Promise<InstrucaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await instrucoesApi.create(data);
      setInstrucoes(prev => [response, ...prev]);
      setTotal(prev => prev + 1);
      return response;
    } catch (err) {
      handleError(err, 'createInstrucao');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateInstrucao = useCallback(async (id: string, data: UpdateInstrucaoApiData): Promise<InstrucaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await instrucoesApi.update(id, data);
      setInstrucoes(prev => prev.map(i => i.id === id ? response : i));
      return response;
    } catch (err) {
      handleError(err, 'updateInstrucao');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteInstrucao = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await instrucoesApi.remove(id);
      setInstrucoes(prev => prev.filter(i => i.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      handleError(err, 'deleteInstrucao');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getInstrucao = useCallback(async (id: string): Promise<InstrucaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await instrucoesApi.findOne(id);
      return response;
    } catch (err) {
      handleError(err, 'getInstrucao');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Listagem

  const fetchInstrucoes = useCallback(async (params?: QueryInstrucoesApiParams): Promise<InstrucoesListApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      setLastParams(params);
      const response = await instrucoesApi.findAll(params);
      setInstrucoes(response.data || []);
      setTotalPages(response.pagination?.pages || 0);
      setCurrentPage(response.pagination?.page || 1);
      setTotal(response.pagination?.total || 0);
      return response;
    } catch (err) {
      handleError(err, 'fetchInstrucoes');
      return { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Dashboard

  const getDashboard = useCallback(async (): Promise<DashboardInstrucoesDto> => {
    try {
      setError(null);
      const response = await instrucoesApi.getDashboard();
      return response;
    } catch (err) {
      handleError(err, 'getDashboard');
      throw err;
    }
  }, [handleError]);

  // Adicionar ao plano

  const adicionarAoPlano = useCallback(async (id: string, data: AdicionarAoPlanoApiData): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const response = await instrucoesApi.adicionarAoPlano(id, data);
      return response;
    } catch (err) {
      handleError(err, 'adicionarAoPlano');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Associacoes

  const associarAnomalia = useCallback(async (id: string, data: AssociarAnomaliaApiData): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const response = await instrucoesApi.associarAnomalia(id, data);
      return response;
    } catch (err) {
      handleError(err, 'associarAnomalia');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const listarAnomalias = useCallback(async (id: string) => {
    try {
      setError(null);
      return await instrucoesApi.listarAnomalias(id);
    } catch (err) {
      handleError(err, 'listarAnomalias');
      return [];
    }
  }, [handleError]);

  const desassociarAnomalia = useCallback(async (id: string, anomaliaId: string) => {
    try {
      setLoading(true);
      setError(null);
      await instrucoesApi.desassociarAnomalia(id, anomaliaId);
    } catch (err) {
      handleError(err, 'desassociarAnomalia');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const associarSolicitacao = useCallback(async (id: string, data: AssociarSolicitacaoApiData): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const response = await instrucoesApi.associarSolicitacao(id, data);
      return response;
    } catch (err) {
      handleError(err, 'associarSolicitacao');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const listarSolicitacoes = useCallback(async (id: string) => {
    try {
      setError(null);
      return await instrucoesApi.listarSolicitacoes(id);
    } catch (err) {
      handleError(err, 'listarSolicitacoes');
      return [];
    }
  }, [handleError]);

  const desassociarSolicitacao = useCallback(async (id: string, solicitacaoId: string) => {
    try {
      setLoading(true);
      setError(null);
      await instrucoesApi.desassociarSolicitacao(id, solicitacaoId);
    } catch (err) {
      handleError(err, 'desassociarSolicitacao');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Anexos

  const getAnexos = useCallback(async (instrucaoId: string): Promise<AnexoInstrucaoApiResponse[]> => {
    try {
      setError(null);
      return await instrucoesApi.getAnexos(instrucaoId);
    } catch (err) {
      handleError(err, 'getAnexos');
      return [];
    }
  }, [handleError]);

  const uploadAnexo = useCallback(async (
    instrucaoId: string,
    file: File,
    descricao?: string,
    usuarioId?: string
  ): Promise<AnexoInstrucaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await instrucoesApi.uploadAnexo(instrucaoId, file, descricao, usuarioId);
      return response;
    } catch (err) {
      handleError(err, 'uploadAnexo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const downloadAnexo = useCallback(async (instrucaoId: string, anexoId: string): Promise<Blob> => {
    try {
      setError(null);
      return await instrucoesApi.downloadAnexo(instrucaoId, anexoId);
    } catch (err) {
      handleError(err, 'downloadAnexo');
      throw err;
    }
  }, [handleError]);

  const deleteAnexo = useCallback(async (instrucaoId: string, anexoId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await instrucoesApi.deleteAnexo(instrucaoId, anexoId);
    } catch (err) {
      handleError(err, 'deleteAnexo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    instrucoes,
    totalPages,
    currentPage,
    total,
    createInstrucao,
    updateInstrucao,
    deleteInstrucao,
    getInstrucao,
    fetchInstrucoes,
    getDashboard,
    adicionarAoPlano,
    associarAnomalia,
    listarAnomalias,
    desassociarAnomalia,
    associarSolicitacao,
    listarSolicitacoes,
    desassociarSolicitacao,
    getAnexos,
    uploadAnexo,
    downloadAnexo,
    deleteAnexo,
    clearError,
    refreshData
  };
}
