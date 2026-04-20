// src/features/execucao-os/hooks/useExecucaoOSApi.ts
import { useState, useCallback } from 'react';
import { execucaoOSApi } from '@/services/execucao-os.service';
import { execucaoOSTransitionsService } from '@/services/execucao-os-transitions.service';
import type {
  ExecucaoOSApiResponse,
  ExecucaoOSListApiResponse,
  QueryExecucaoOSApiParams,
  IniciarExecucaoApiData,
  PausarExecucaoApiData,
  RetomarExecucaoApiData,
  FinalizarExecucaoApiData,
  CancelarExecucaoApiData,
  DashboardExecucaoOSDto,
} from '@/services/execucao-os.service';
import { transformApiArrayToExecucaoOS } from '../utils/transform-api-data';
import type { ExecucaoOS } from '../types';

/**
 * Hook customizado para operações de API da feature Execução de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function useExecucaoOSApi() {
  const [items, setItems] = useState<ExecucaoOS[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [dashboard, setDashboard] = useState<DashboardExecucaoOSDto | null>(null);

  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  const fetchItems = useCallback(async (params: QueryExecucaoOSApiParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response: ExecucaoOSListApiResponse = await execucaoOSApi.findAll(params);

      // Transformar dados da API para o formato esperado pelo frontend
      const execucoesFormatadas = transformApiArrayToExecucaoOS(response.data || []);

      setItems(execucoesFormatadas);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);
      setCurrentPage(response.pagination?.page || 1);
      setStats(response.stats || {});

      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao buscar execuções';
      setError(errorMessage);
      console.error('Erro ao buscar execuções:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOne = useCallback(async (id: string): Promise<ExecucaoOS> => {
    try {
      setLoading(true);
      setError(null);

      const response: ExecucaoOSApiResponse = await execucaoOSApi.findOne(id);
      const execucoesTransformadas = transformApiArrayToExecucaoOS([response]);

      return execucoesTransformadas[0];
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao buscar execução';
      setError(errorMessage);
      console.error('Erro ao buscar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSApi.getDashboard();
      setDashboard(response);

      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao buscar dashboard';
      setError(errorMessage);
      console.error('Erro ao buscar dashboard:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // TRANSIÇÕES DE STATUS
  // ============================================================================

  const iniciar = useCallback(async (id: string, data: IniciarExecucaoApiData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.iniciar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao iniciar execução';
      setError(errorMessage);
      console.error('Erro ao iniciar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const pausar = useCallback(async (id: string, data: PausarExecucaoApiData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.pausar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao pausar execução';
      setError(errorMessage);
      console.error('Erro ao pausar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const retomar = useCallback(async (id: string, data: RetomarExecucaoApiData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.retomar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao retomar execução';
      setError(errorMessage);
      console.error('Erro ao retomar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizar = useCallback(async (id: string, data: FinalizarExecucaoApiData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.finalizar(id, data as any);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao finalizar execução';
      setError(errorMessage);
      console.error('Erro ao finalizar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelar = useCallback(async (id: string, data: CancelarExecucaoApiData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.cancelar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao cancelar execução';
      setError(errorMessage);
      console.error('Erro ao cancelar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executar = useCallback(async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.executar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao registrar execução';
      setError(errorMessage);
      console.error('Erro ao registrar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const auditar = useCallback(async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.auditar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao auditar execução';
      setError(errorMessage);
      console.error('Erro ao auditar execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reabrir = useCallback(async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.reabrir(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao reabrir execução';
      setError(errorMessage);
      console.error('Erro ao reabrir execução:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizarOS = useCallback(async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSTransitionsService.finalizar(id, data);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao finalizar OS';
      setError(errorMessage);
      console.error('Erro ao finalizar OS:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // OPERAÇÕES ADICIONAIS
  // ============================================================================

  const getAnexos = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSApi.getAnexos(id);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao buscar anexos';
      setError(errorMessage);
      console.error('Erro ao buscar anexos:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAnexo = useCallback(async (
    id: string,
    file: File,
    tipo: 'RELATORIO' | 'FOTO_ANTES' | 'FOTO_DEPOIS' | 'DOCUMENTO' | 'OUTROS',
    descricao?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSApi.uploadAnexo(id, file, tipo, descricao);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao fazer upload de anexo';
      setError(errorMessage);
      console.error('Erro ao fazer upload de anexo:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRelatorioPerformance = useCallback(async (params?: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await execucaoOSApi.getRelatorioPerformance(params);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao gerar relatório';
      setError(errorMessage);
      console.error('Erro ao gerar relatório:', err);
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
    dashboard,

    // CRUD
    fetchItems,
    fetchOne,
    fetchDashboard,

    // Transições
    iniciar,
    pausar,
    retomar,
    finalizar,
    cancelar,
    executar,
    auditar,
    reabrir,
    finalizarOS,

    // Operações adicionais
    getAnexos,
    uploadAnexo,
    getRelatorioPerformance,
  };
}
