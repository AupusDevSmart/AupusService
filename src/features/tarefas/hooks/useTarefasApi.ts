// src/features/tarefas/hooks/useTarefasApi.ts
import { useState, useCallback } from 'react';
import { 
  tarefasApi,
  TarefaApiResponse,
  CreateTarefaApiData,
  UpdateTarefaApiData,
  UpdateStatusTarefaApiData,
  ReordenarTarefaApiData,
  QueryTarefasApiParams,
  DashboardTarefasDto,
  TarefasListApiResponse,
  AnexoTarefaDetalhesDto
} from '@/services/tarefas.services';

export interface UseTarefasApiReturn {
  // Estados
  loading: boolean;
  error: string | null;
  
  // Dados
  tarefas: TarefaApiResponse[];
  totalPages: number;
  currentPage: number;
  total: number;
  
  // Operações CRUD
  createTarefa: (data: CreateTarefaApiData) => Promise<TarefaApiResponse>;
  updateTarefa: (id: string, data: UpdateTarefaApiData) => Promise<TarefaApiResponse>;
  deleteTarefa: (id: string) => Promise<void>;
  getTarefa: (id: string) => Promise<TarefaApiResponse>;
  
  // Operações de listagem
  fetchTarefas: (params?: QueryTarefasApiParams) => Promise<TarefasListApiResponse>;
  fetchTarefasByPlano: (planoId: string, params?: Partial<QueryTarefasApiParams>) => Promise<TarefaApiResponse[]>;
  fetchTarefasByEquipamento: (equipamentoId: string, params?: Partial<QueryTarefasApiParams>) => Promise<TarefaApiResponse[]>;
  
  // Operações específicas
  updateStatus: (id: string, data: UpdateStatusTarefaApiData) => Promise<TarefaApiResponse>;
  reordenarTarefa: (id: string, data: ReordenarTarefaApiData) => Promise<TarefaApiResponse>;
  getDashboard: () => Promise<DashboardTarefasDto>;
  
  // Operações de anexos
  getAnexos: (tarefaId: string) => Promise<AnexoTarefaDetalhesDto[]>;
  uploadAnexo: (tarefaId: string, file: File, descricao?: string, usuarioId?: string) => Promise<AnexoTarefaDetalhesDto>;
  downloadAnexo: (tarefaId: string, anexoId: string) => Promise<Blob>;
  deleteAnexo: (tarefaId: string, anexoId: string) => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  refreshData: () => Promise<void>;
}

export function useTarefasApi(): UseTarefasApiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState<TarefaApiResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastParams, setLastParams] = useState<QueryTarefasApiParams | undefined>();

  const handleError = useCallback((err: any, context?: string) => {
    let message = 'Erro desconhecido';
    
    if (err?.response?.data?.message) {
      message = err.response.data.message;
    } else if (err?.message) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    }

    console.error(`Erro na API de tarefas${context ? ` (${context})` : ''}:`, err);
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(async () => {
    if (lastParams) {
      await fetchTarefas(lastParams);
    }
  }, [lastParams]);

  // ============================================================================
  // OPERAÇÕES CRUD
  // ============================================================================

  const createTarefa = useCallback(async (data: CreateTarefaApiData): Promise<TarefaApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Criando tarefa com dados:', data);
      
      const response = await tarefasApi.create(data);
      console.log('HOOK: Tarefa criada:', response);
      
      // Atualizar lista local
      setTarefas(prev => [response, ...prev]);
      setTotal(prev => prev + 1);
      
      return response;
    } catch (err) {
      handleError(err, 'createTarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateTarefa = useCallback(async (id: string, data: UpdateTarefaApiData): Promise<TarefaApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Atualizando tarefa:', id, data);
      
      const response = await tarefasApi.update(id, data);
      console.log('HOOK: Tarefa atualizada:', response);
      
      // Atualizar lista local
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === id ? response : tarefa
      ));
      
      return response;
    } catch (err) {
      handleError(err, 'updateTarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteTarefa = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Excluindo tarefa:', id);
      
      await tarefasApi.remove(id);
      console.log('HOOK: Tarefa excluída com sucesso');
      
      // Remover da lista local
      setTarefas(prev => prev.filter(tarefa => tarefa.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      handleError(err, 'deleteTarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getTarefa = useCallback(async (id: string): Promise<TarefaApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Buscando tarefa:', id);
      
      const response = await tarefasApi.findOne(id);
      console.log('HOOK: Tarefa encontrada:', response);
      
      return response;
    } catch (err) {
      handleError(err, 'getTarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // OPERAÇÕES DE LISTAGEM
  // ============================================================================

  const fetchTarefas = useCallback(async (params?: QueryTarefasApiParams): Promise<TarefasListApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      setLastParams(params);
      
      console.log('HOOK: Listando tarefas com parâmetros:', params);
      
      const response = await tarefasApi.findAll(params);
      console.log('HOOK: Tarefas listadas:', response);
      
      setTarefas(response.data || []);
      setTotalPages(response.pagination?.pages || 0);
      setCurrentPage(response.pagination?.page || 1);
      setTotal(response.pagination?.total || 0);
      
      return response;
    } catch (err) {
      handleError(err, 'fetchTarefas');
      // Retornar resposta vazia em caso de erro
      const emptyResponse: TarefasListApiResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };
      return emptyResponse;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchTarefasByPlano = useCallback(async (planoId: string, params?: Partial<QueryTarefasApiParams>): Promise<TarefaApiResponse[]> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Buscando tarefas por plano:', planoId);
      
      const response = await tarefasApi.findByPlano(planoId, params);
      console.log('HOOK: Tarefas do plano encontradas:', response);
      
      return response;
    } catch (err) {
      handleError(err, 'fetchTarefasByPlano');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchTarefasByEquipamento = useCallback(async (equipamentoId: string, params?: Partial<QueryTarefasApiParams>): Promise<TarefaApiResponse[]> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Buscando tarefas por equipamento:', equipamentoId);
      
      const response = await tarefasApi.findByEquipamento(equipamentoId, params);
      console.log('HOOK: Tarefas do equipamento encontradas:', response);
      
      return response;
    } catch (err) {
      handleError(err, 'fetchTarefasByEquipamento');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  const updateStatus = useCallback(async (id: string, data: UpdateStatusTarefaApiData): Promise<TarefaApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Atualizando status da tarefa:', id, data);
      
      const response = await tarefasApi.updateStatus(id, data);
      console.log('HOOK: Status atualizado:', response);
      
      // Atualizar lista local
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === id ? response : tarefa
      ));
      
      return response;
    } catch (err) {
      handleError(err, 'updateStatus');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const reordenarTarefa = useCallback(async (id: string, data: ReordenarTarefaApiData): Promise<TarefaApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Reordenando tarefa:', id, data);
      
      const response = await tarefasApi.reordenar(id, data);
      console.log('HOOK: Tarefa reordenada:', response);
      
      // Atualizar lista local
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === id ? response : tarefa
      ));
      
      return response;
    } catch (err) {
      handleError(err, 'reordenarTarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getDashboard = useCallback(async (): Promise<DashboardTarefasDto> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Obtendo dashboard das tarefas');
      
      const response = await tarefasApi.getDashboard();
      console.log('HOOK: Dashboard obtido:', response);
      
      return response;
    } catch (err) {
      handleError(err, 'getDashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // OPERAÇÕES DE ANEXOS
  // ============================================================================

  const getAnexos = useCallback(async (tarefaId: string): Promise<AnexoTarefaDetalhesDto[]> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Obtendo anexos da tarefa:', tarefaId);
      
      const response = await tarefasApi.getAnexos(tarefaId);
      console.log('HOOK: Anexos obtidos:', response);
      
      return response;
    } catch (err) {
      handleError(err, 'getAnexos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const uploadAnexo = useCallback(async (
    tarefaId: string, 
    file: File, 
    descricao?: string, 
    usuarioId?: string
  ): Promise<AnexoTarefaDetalhesDto> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Fazendo upload de anexo para tarefa:', tarefaId);
      
      const response = await tarefasApi.uploadAnexo(tarefaId, file, descricao, usuarioId);
      console.log('HOOK: Anexo enviado:', response);
      
      return response;
    } catch (err) {
      handleError(err, 'uploadAnexo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const downloadAnexo = useCallback(async (tarefaId: string, anexoId: string): Promise<Blob> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Fazendo download de anexo:', anexoId);
      
      const response = await tarefasApi.downloadAnexo(tarefaId, anexoId);
      console.log('HOOK: Download concluído');
      
      return response;
    } catch (err) {
      handleError(err, 'downloadAnexo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteAnexo = useCallback(async (tarefaId: string, anexoId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('HOOK: Excluindo anexo:', anexoId);
      
      await tarefasApi.deleteAnexo(tarefaId, anexoId);
      console.log('HOOK: Anexo excluído com sucesso');
      
    } catch (err) {
      handleError(err, 'deleteAnexo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    // Estados
    loading,
    error,
    
    // Dados
    tarefas,
    totalPages,
    currentPage,
    total,
    
    // Operações CRUD
    createTarefa,
    updateTarefa,
    deleteTarefa,
    getTarefa,
    
    // Operações de listagem
    fetchTarefas,
    fetchTarefasByPlano,
    fetchTarefasByEquipamento,
    
    // Operações específicas
    updateStatus,
    reordenarTarefa,
    getDashboard,
    
    // Operações de anexos
    getAnexos,
    uploadAnexo,
    downloadAnexo,
    deleteAnexo,
    
    // Utilitários
    clearError,
    refreshData
  };
}