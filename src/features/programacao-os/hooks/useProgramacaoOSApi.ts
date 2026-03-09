// src/features/programacao-os/hooks/useProgramacaoOSApi.ts

import { useState, useCallback } from 'react';
import { programacaoOSApi } from '@/services/programacao-os.service';
import type {
  ProgramacaoResponse,
  ProgramacaoDetalhesResponse,
  ProgramacaoFiltersDto,
  CreateProgramacaoDto,
  UpdateProgramacaoDto,
  ListarProgramacoesResponse,
  AnalisarProgramacaoDto,
  AprovarProgramacaoDto,
  RejeitarProgramacaoDto,
  CancelarProgramacaoDto,
  CreateProgramacaoAnomaliaDto,
  CreateProgramacaoTarefasDto,
  AdicionarTarefasDto,
  AtualizarTarefasDto,
} from '@/services/programacao-os.service';

/**
 * Hook customizado para operações de API da feature Programação de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function useProgramacaoOSApi() {
  const [items, setItems] = useState<ProgramacaoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<{
    rascunho: number;
    pendentes: number;
    em_analise: number;
    aprovadas: number;
    rejeitadas: number;
    canceladas: number;
  }>({
    rascunho: 0,
    pendentes: 0,
    em_analise: 0,
    aprovadas: 0,
    rejeitadas: 0,
    canceladas: 0,
  });

  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  const fetchItems = useCallback(async (params: ProgramacaoFiltersDto = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response: ListarProgramacoesResponse = await programacaoOSApi.listar(params);

      setItems(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
      setCurrentPage(response.pagination?.page || 1);
      setStats(response.stats || {
        rascunho: 0,
        pendentes: 0,
        em_analise: 0,
        aprovadas: 0,
        rejeitadas: 0,
        canceladas: 0,
      });

      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao buscar programações';
      setError(errorMessage);
      console.error('Erro ao buscar programações:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: string): Promise<ProgramacaoDetalhesResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response: ProgramacaoDetalhesResponse = await programacaoOSApi.buscarPorId(id);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao buscar programação';
      setError(errorMessage);
      console.error('Erro ao buscar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (data: CreateProgramacaoDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await programacaoOSApi.criar(data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao criar programação';
      setError(errorMessage);
      console.error('Erro ao criar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (id: string, data: UpdateProgramacaoDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await programacaoOSApi.atualizar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao atualizar programação';
      setError(errorMessage);
      console.error('Erro ao atualizar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await programacaoOSApi.deletar(id);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao deletar programação';
      setError(errorMessage);
      console.error('Erro ao deletar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // TRANSIÇÕES DE WORKFLOW
  // ============================================================================

  const analisar = useCallback(async (id: string, observacoes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const data: AnalisarProgramacaoDto = { observacoes_analise: observacoes };
      const response = await programacaoOSApi.analisar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao analisar programação';
      setError(errorMessage);
      console.error('Erro ao analisar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const aprovar = useCallback(async (
    id: string,
    observacoes?: string,
    ajustes?: {
      ajustes_orcamento?: number;
      data_programada_sugerida?: string;
      hora_programada_sugerida?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const data: AprovarProgramacaoDto = {
        observacoes_aprovacao: observacoes,
        ...ajustes,
      };
      const response = await programacaoOSApi.aprovar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao aprovar programação';
      setError(errorMessage);
      console.error('Erro ao aprovar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejeitar = useCallback(async (id: string, motivo: string, sugestoes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const data: RejeitarProgramacaoDto = {
        motivo_rejeicao: motivo,
        sugestoes_melhoria: sugestoes,
      };
      const response = await programacaoOSApi.rejeitar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao rejeitar programação';
      setError(errorMessage);
      console.error('Erro ao rejeitar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelar = useCallback(async (id: string, motivo: string) => {
    try {
      setLoading(true);
      setError(null);

      const data: CancelarProgramacaoDto = { motivo_cancelamento: motivo };
      const response = await programacaoOSApi.cancelar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao cancelar programação';
      setError(errorMessage);
      console.error('Erro ao cancelar programação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  const createFromAnomalia = useCallback(async (anomaliaId: string, ajustes?: CreateProgramacaoAnomaliaDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await programacaoOSApi.criarDeAnomalia(anomaliaId, ajustes || {});
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao criar programação de anomalia';
      setError(errorMessage);
      console.error('Erro ao criar programação de anomalia:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createFromTarefas = useCallback(async (data: CreateProgramacaoTarefasDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await programacaoOSApi.criarDeTarefas(data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao criar programação de tarefas';
      setError(errorMessage);
      console.error('Erro ao criar programação de tarefas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // OPERAÇÕES COM TAREFAS
  // ============================================================================

  const addTarefas = useCallback(async (id: string, data: AdicionarTarefasDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await programacaoOSApi.adicionarTarefas(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao adicionar tarefas';
      setError(errorMessage);
      console.error('Erro ao adicionar tarefas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTarefas = useCallback(async (id: string, data: AtualizarTarefasDto) => {
    try {
      setLoading(true);
      setError(null);

      const response = await programacaoOSApi.atualizarTarefas(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao atualizar tarefas';
      setError(errorMessage);
      console.error('Erro ao atualizar tarefas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTarefa = useCallback(async (id: string, tarefaId: string) => {
    try {
      setLoading(true);
      setError(null);

      await programacaoOSApi.removerTarefa(id, tarefaId);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao remover tarefa';
      setError(errorMessage);
      console.error('Erro ao remover tarefa:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    items,
    loading,
    error,
    total,
    totalPages,
    currentPage,
    stats,

    // CRUD
    fetchItems,
    fetchOne,
    createItem,
    updateItem,
    deleteItem,

    // Workflow
    analisar,
    aprovar,
    rejeitar,
    cancelar,

    // Operações específicas
    createFromAnomalia,
    createFromTarefas,

    // Tarefas
    addTarefas,
    updateTarefas,
    removeTarefa,
  };
}
