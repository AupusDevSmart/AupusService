// src/features/planos-manutencao/hooks/usePlanosManutencaoApi.ts - CORRIGIDO
import { useState, useCallback } from 'react';
import {
  planosManutencaoApi,
  PlanoManutencaoApiResponse,
  CreatePlanoManutencaoApiData,
  UpdatePlanoManutencaoApiData,
  UpdateStatusPlanoApiData,
  DuplicarPlanoApiData,
  ClonarPlanoLoteDto,
  ClonarPlanoLoteResponseDto,
  QueryPlanosApiParams,
  QueryPlanosPorPlantaParams,
  DashboardPlanosDto,
  PlanoResumoDto,
  PlanosListApiResponse
} from '@/services/planos-manutencao.services';

export interface UsePlanosManutencaoApiReturn {
  // Estados
  loading: boolean;
  error: string | null;
  
  // Dados
  planos: PlanoManutencaoApiResponse[];
  totalPages: number;
  currentPage: number;
  total: number;
  
  // Operações CRUD
  createPlano: (data: CreatePlanoManutencaoApiData) => Promise<PlanoManutencaoApiResponse>;
  updatePlano: (id: string, data: UpdatePlanoManutencaoApiData) => Promise<PlanoManutencaoApiResponse>;
  deletePlano: (id: string) => Promise<void>;
  getPlano: (id: string, incluirTarefas?: boolean) => Promise<PlanoManutencaoApiResponse>;
  
  // Operações de listagem
  fetchPlanos: (params?: QueryPlanosApiParams) => Promise<PlanosListApiResponse>;
  fetchPlanoByEquipamento: (equipamentoId: string) => Promise<PlanoManutencaoApiResponse>;
  fetchPlanosByPlanta: (plantaId: string, params?: QueryPlanosPorPlantaParams) => Promise<PlanosListApiResponse>;
  fetchPlanosByUnidade: (unidadeId: string, params?: QueryPlanosPorPlantaParams) => Promise<PlanosListApiResponse>;

  // Operações específicas
  updateStatus: (id: string, data: UpdateStatusPlanoApiData) => Promise<PlanoManutencaoApiResponse>;
  duplicarPlano: (id: string, data: DuplicarPlanoApiData) => Promise<PlanoManutencaoApiResponse>;
  clonarLote: (id: string, data: ClonarPlanoLoteDto) => Promise<ClonarPlanoLoteResponseDto>;
  getResumo: (id: string) => Promise<PlanoResumoDto>;
  getDashboard: () => Promise<DashboardPlanosDto>;

  // Utilitários
  clearError: () => void;
  refreshData: () => Promise<void>;
}

export function usePlanosManutencaoApi(): UsePlanosManutencaoApiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planos, setPlanos] = useState<PlanoManutencaoApiResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastParams, setLastParams] = useState<QueryPlanosApiParams | undefined>();

  const handleError = useCallback((err: any, context?: string) => {
    let message = 'Erro desconhecido';
    
    if (err?.response?.data?.message) {
      message = err.response.data.message;
    } else if (err?.message) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    }

    console.error(`💥 Erro na API de planos de manutenção${context ? ` (${context})` : ''}:`, err);
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(async () => {
    if (lastParams) {
      await fetchPlanos(lastParams);
    }
  }, [lastParams]);

  // ============================================================================
  // OPERAÇÕES CRUD
  // ============================================================================

  const createPlano = useCallback(async (data: CreatePlanoManutencaoApiData): Promise<PlanoManutencaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 HOOK: Criando plano com dados:', data);
      
      const response = await planosManutencaoApi.create(data);
      console.log('✅ HOOK: Plano criado:', response);
      
      // Atualizar lista local
      setPlanos(prev => [response, ...prev]);
      setTotal(prev => prev + 1);
      
      return response;
    } catch (err) {
      handleError(err, 'createPlano');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updatePlano = useCallback(async (id: string, data: UpdatePlanoManutencaoApiData): Promise<PlanoManutencaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('✏️ HOOK: Atualizando plano:', id, data);
      
      const response = await planosManutencaoApi.update(id, data);
      console.log('✅ HOOK: Plano atualizado:', response);
      
      // Atualizar lista local
      setPlanos(prev => prev.map(plano => 
        plano.id === id ? response : plano
      ));
      
      return response;
    } catch (err) {
      handleError(err, 'updatePlano');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deletePlano = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ HOOK: Excluindo plano:', id);
      
      await planosManutencaoApi.remove(id);
      console.log('✅ HOOK: Plano excluído com sucesso');
      
      // Remover da lista local
      setPlanos(prev => prev.filter(plano => plano.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      handleError(err, 'deletePlano');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // 🔧 FUNÇÃO PRINCIPAL CORRIGIDA: getPlano com melhor tratamento de tarefas
  const getPlano = useCallback(async (id: string, incluirTarefas?: boolean): Promise<PlanoManutencaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 HOOK: Buscando plano:', id, { incluirTarefas });
      
      const response = await planosManutencaoApi.findOne(id, incluirTarefas);
      console.log('📋 HOOK: Plano encontrado (raw):', response);
      
      // 🔧 Log específico para tarefas
      if (incluirTarefas) {
        console.log('📋 HOOK: Tarefas no plano:', {
          existe: !!response.tarefas,
          tipo: typeof response.tarefas,
          isArray: Array.isArray(response.tarefas),
          quantidade: response.tarefas?.length || 0,
          primeiraTarefa: response.tarefas?.[0]
        });
      }
      
      // 🔧 Garantir que tarefas seja sempre um array se incluirTarefas for true
      if (incluirTarefas && !response.tarefas) {
        console.log('⚠️ HOOK: Nenhuma tarefa retornada pela API, definindo array vazio');
        response.tarefas = [];
      }
      
      return response;
    } catch (err) {
      console.error('💥 HOOK: Erro ao buscar plano:', err);
      handleError(err, 'getPlano');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // OPERAÇÕES DE LISTAGEM
  // ============================================================================

  const fetchPlanos = useCallback(async (params?: QueryPlanosApiParams): Promise<PlanosListApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      setLastParams(params);

      const response = await planosManutencaoApi.findAll(params);

      setPlanos(response.data || []);
      setTotalPages(response.pagination?.pages || 0);
      setCurrentPage(response.pagination?.page || 1);
      setTotal(response.pagination?.total || 0);
      
      return response;
    } catch (err) {
      handleError(err, 'fetchPlanos');
      // Retornar resposta vazia em caso de erro
      const emptyResponse: PlanosListApiResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };
      return emptyResponse;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchPlanoByEquipamento = useCallback(async (equipamentoId: string): Promise<PlanoManutencaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 HOOK: Buscando plano por equipamento:', equipamentoId);

      const response = await planosManutencaoApi.findByEquipamento(equipamentoId);
      console.log('✅ HOOK: Plano do equipamento encontrado:', response);

      return response;
    } catch (err) {
      handleError(err, 'fetchPlanoByEquipamento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchPlanosByPlanta = useCallback(async (plantaId: string, params?: QueryPlanosPorPlantaParams): Promise<PlanosListApiResponse> => {
    try {
      console.log('🚀 HOOK API: INÍCIO fetchPlanosByPlanta');
      console.log('📋 HOOK API: Parâmetros recebidos:', { plantaId, params });

      setLoading(true);
      setError(null);

      console.log('📡 HOOK API: Chamando planosManutencaoApi.findByPlanta...');

      const response = await planosManutencaoApi.findByPlanta(plantaId, params);

      console.log('✅ HOOK API: Resposta recebida do serviço:', {
        dataLength: response.data?.length || 0,
        pagination: response.pagination,
        firstItem: response.data?.[0] || null
      });

      console.log('🎯 HOOK API: Dados completos da resposta:', response);

      return response;
    } catch (err) {
      console.error('❌ HOOK API: Erro em fetchPlanosByPlanta:', {
        error: err,
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });

      handleError(err, 'fetchPlanosByPlanta');

      // Retornar resposta vazia em caso de erro
      const emptyResponse: PlanosListApiResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };

      console.log('🔄 HOOK API: Retornando resposta vazia devido ao erro');
      return emptyResponse;
    } finally {
      console.log('🏁 HOOK API: FIM fetchPlanosByPlanta, setLoading(false)');
      setLoading(false);
    }
  }, [handleError]);

  const fetchPlanosByUnidade = useCallback(async (unidadeId: string, params?: QueryPlanosPorPlantaParams): Promise<PlanosListApiResponse> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 HOOK: Buscando planos por unidade:', unidadeId, params);

      const response = await planosManutencaoApi.findByUnidade(unidadeId, params);
      console.log('✅ HOOK: Planos da unidade encontrados:', response);

      return response;
    } catch (err) {
      handleError(err, 'fetchPlanosByUnidade');

      // Retornar resposta vazia em caso de erro
      const emptyResponse: PlanosListApiResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };
      return emptyResponse;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  const updateStatus = useCallback(async (id: string, data: UpdateStatusPlanoApiData): Promise<PlanoManutencaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 HOOK: Atualizando status do plano:', id, data);
      
      const response = await planosManutencaoApi.updateStatus(id, data);
      console.log('✅ HOOK: Status atualizado:', response);
      
      // Atualizar lista local
      setPlanos(prev => prev.map(plano => 
        plano.id === id ? response : plano
      ));
      
      return response;
    } catch (err) {
      handleError(err, 'updateStatus');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const duplicarPlano = useCallback(async (id: string, data: DuplicarPlanoApiData): Promise<PlanoManutencaoApiResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 HOOK: Duplicando plano:', id, data);
      
      const response = await planosManutencaoApi.duplicar(id, data);
      console.log('✅ HOOK: Plano duplicado:', response);
      
      // Adicionar à lista local
      setPlanos(prev => [response, ...prev]);
      setTotal(prev => prev + 1);
      
      return response;
    } catch (err) {
      handleError(err, 'duplicarPlano');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getResumo = useCallback(async (id: string): Promise<PlanoResumoDto> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 HOOK: Obtendo resumo do plano:', id);
      
      const response = await planosManutencaoApi.getResumo(id);
      console.log('✅ HOOK: Resumo obtido:', response);
      
      return response;
    } catch (err) {
      handleError(err, 'getResumo');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getDashboard = useCallback(async (): Promise<DashboardPlanosDto> => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 HOOK: Obtendo dashboard dos planos');

      const response = await planosManutencaoApi.getDashboard();
      console.log('✅ HOOK: Dashboard obtido:', response);

      return response;
    } catch (err) {
      handleError(err, 'getDashboard');
      // 🔧 Retornar dashboard padrão em caso de erro
      const defaultDashboard: DashboardPlanosDto = {
        total_planos: 0,
        planos_ativos: 0,
        planos_inativos: 0,
        planos_em_revisao: 0,
        planos_arquivados: 0,
        equipamentos_com_plano: 0,
        total_tarefas_todos_planos: 0,
        media_tarefas_por_plano: 0,
        tempo_total_estimado_geral: 0,
        distribuicao_tipos: {
          preventiva: 0,
          preditiva: 0,
          corretiva: 0,
          inspecao: 0,
          visita_tecnica: 0
        }
      };
      return defaultDashboard;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const clonarLote = useCallback(async (id: string, data: ClonarPlanoLoteDto): Promise<ClonarPlanoLoteResponseDto> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 HOOK: Clonando plano em lote:', id, data);

      const response = await planosManutencaoApi.clonarLote(id, data);
      console.log('✅ HOOK: Clonagem em lote concluída:', response);

      // Recarregar lista de planos após clonagem
      if (response.planos_criados > 0) {
        await refreshData();
      }

      return response;
    } catch (err) {
      handleError(err, 'clonarLote');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError, refreshData]);

  return {
    // Estados
    loading,
    error,
    
    // Dados
    planos,
    totalPages,
    currentPage,
    total,
    
    // Operações CRUD
    createPlano,
    updatePlano,
    deletePlano,
    getPlano,
    
    // Operações de listagem
    fetchPlanos,
    fetchPlanoByEquipamento,
    fetchPlanosByPlanta,
    fetchPlanosByUnidade,

    // Operações específicas
    updateStatus,
    duplicarPlano,
    clonarLote,
    getResumo,
    getDashboard,

    // Utilitários
    clearError,
    refreshData
  };
}