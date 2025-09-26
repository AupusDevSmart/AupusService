// src/features/veiculos/hooks/useVeiculos.ts
import { useState, useEffect, useCallback } from 'react';
import {
  VeiculosService,
  type VeiculoResponse,
  type QueryVeiculosParams,
  type CreateVeiculoRequest,
  type UpdateVeiculoRequest,
  type StatusVeiculo,
  type DashboardVeiculosResponse,
  type ManutencaoVeiculo,
  type CreateManutencaoRequest
} from '@/services/veiculos.services';

// ============================================================================
// HOOK: useVeiculos - Main hook for vehicles management
// ============================================================================

interface UseVeiculosParams extends Partial<QueryVeiculosParams> {
  autoFetch?: boolean;
}

interface UseVeiculosReturn {
  // Data
  veiculos: VeiculoResponse[];
  totalVeiculos: number;

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchVeiculos: (params?: QueryVeiculosParams) => Promise<void>;
  createVeiculo: (data: CreateVeiculoRequest) => Promise<VeiculoResponse>;
  updateVeiculo: (id: number, data: UpdateVeiculoRequest) => Promise<VeiculoResponse>;
  updateStatus: (id: number, status: StatusVeiculo) => Promise<VeiculoResponse>;
  updateQuilometragem: (id: number, kmAtual: number) => Promise<VeiculoResponse>;
  deleteVeiculo: (id: number) => Promise<void>;

  // Utils
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useVeiculos = (params: UseVeiculosParams = {}): UseVeiculosReturn => {
  const { autoFetch = true, ...queryParams } = params;

  // States
  const [veiculos, setVeiculos] = useState<VeiculoResponse[]>([]);
  const [totalVeiculos, setTotalVeiculos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch veiculos
  const fetchVeiculos = useCallback(async (fetchParams?: QueryVeiculosParams) => {
    try {
      setLoading(true);
      setError(null);

      const finalParams = { ...queryParams, ...fetchParams };
      const response = await VeiculosService.getAllVeiculos(finalParams);

      setVeiculos(response.data);
      setTotalVeiculos(response.pagination.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículos';
      setError(errorMessage);
      setVeiculos([]);
      setTotalVeiculos(0);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Create veiculo
  const createVeiculo = useCallback(async (data: CreateVeiculoRequest): Promise<VeiculoResponse> => {
    try {
      setError(null);
      const newVeiculo = await VeiculosService.createVeiculo(data);

      // Refresh list after creation
      await fetchVeiculos();

      return newVeiculo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar veículo';
      setError(errorMessage);
      throw err;
    }
  }, [fetchVeiculos]);

  // Update veiculo
  const updateVeiculo = useCallback(async (id: number, data: UpdateVeiculoRequest): Promise<VeiculoResponse> => {
    try {
      setError(null);
      const updatedVeiculo = await VeiculosService.updateVeiculo(id, data);

      // Update local state
      setVeiculos(prev => prev.map(veiculo =>
        veiculo.id === id ? updatedVeiculo : veiculo
      ));

      return updatedVeiculo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar veículo';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update status
  const updateStatus = useCallback(async (id: number, status: StatusVeiculo): Promise<VeiculoResponse> => {
    try {
      setError(null);
      const updatedVeiculo = await VeiculosService.updateVeiculoStatus(id, status);

      // Update local state
      setVeiculos(prev => prev.map(veiculo =>
        veiculo.id === id ? updatedVeiculo : veiculo
      ));

      return updatedVeiculo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update quilometragem
  const updateQuilometragem = useCallback(async (id: number, kmAtual: number): Promise<VeiculoResponse> => {
    try {
      setError(null);
      const updatedVeiculo = await VeiculosService.updateQuilometragem(id, kmAtual);

      // Update local state
      setVeiculos(prev => prev.map(veiculo =>
        veiculo.id === id ? updatedVeiculo : veiculo
      ));

      return updatedVeiculo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar quilometragem';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete veiculo
  const deleteVeiculo = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await VeiculosService.deleteVeiculo(id);

      // Remove from local state
      setVeiculos(prev => prev.filter(veiculo => veiculo.id !== id));
      setTotalVeiculos(prev => prev - 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir veículo';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refetch
  const refetch = useCallback(() => fetchVeiculos(), [fetchVeiculos]);

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchVeiculos();
    }
  }, [autoFetch, fetchVeiculos]);

  return {
    // Data
    veiculos,
    totalVeiculos,

    // States
    loading,
    error,

    // Actions
    fetchVeiculos,
    createVeiculo,
    updateVeiculo,
    updateStatus,
    updateQuilometragem,
    deleteVeiculo,

    // Utils
    refetch,
    clearError
  };
};

// ============================================================================
// HOOK: useVeiculo - Single vehicle management
// ============================================================================

interface UseVeiculoReturn {
  // Data
  veiculo: VeiculoResponse | null;

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchVeiculo: () => Promise<void>;
  updateVeiculo: (data: UpdateVeiculoRequest) => Promise<VeiculoResponse>;
  updateStatus: (status: StatusVeiculo) => Promise<VeiculoResponse>;
  updateQuilometragem: (kmAtual: number) => Promise<VeiculoResponse>;

  // Utils
  clearError: () => void;
}

export const useVeiculo = (id: number | null): UseVeiculoReturn => {
  // States
  const [veiculo, setVeiculo] = useState<VeiculoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch veiculo
  const fetchVeiculo = useCallback(async () => {
    if (!id) {
      setVeiculo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await VeiculosService.getVeiculoById(id);
      setVeiculo(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículo';
      setError(errorMessage);
      setVeiculo(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Update veiculo
  const updateVeiculo = useCallback(async (data: UpdateVeiculoRequest): Promise<VeiculoResponse> => {
    if (!id) throw new Error('ID do veículo não fornecido');

    try {
      setError(null);
      const updatedVeiculo = await VeiculosService.updateVeiculo(id, data);
      setVeiculo(updatedVeiculo);
      return updatedVeiculo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar veículo';
      setError(errorMessage);
      throw err;
    }
  }, [id]);

  // Update status
  const updateStatus = useCallback(async (status: StatusVeiculo): Promise<VeiculoResponse> => {
    if (!id) throw new Error('ID do veículo não fornecido');

    try {
      setError(null);
      const updatedVeiculo = await VeiculosService.updateVeiculoStatus(id, status);
      setVeiculo(updatedVeiculo);
      return updatedVeiculo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(errorMessage);
      throw err;
    }
  }, [id]);

  // Update quilometragem
  const updateQuilometragem = useCallback(async (kmAtual: number): Promise<VeiculoResponse> => {
    if (!id) throw new Error('ID do veículo não fornecido');

    try {
      setError(null);
      const updatedVeiculo = await VeiculosService.updateQuilometragem(id, kmAtual);
      setVeiculo(updatedVeiculo);
      return updatedVeiculo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar quilometragem';
      setError(errorMessage);
      throw err;
    }
  }, [id]);

  // Auto fetch when ID changes
  useEffect(() => {
    fetchVeiculo();
  }, [fetchVeiculo]);

  return {
    // Data
    veiculo,

    // States
    loading,
    error,

    // Actions
    fetchVeiculo,
    updateVeiculo,
    updateStatus,
    updateQuilometragem,

    // Utils
    clearError
  };
};

// ============================================================================
// HOOK: useVeiculosDashboard - Dashboard statistics
// ============================================================================

interface UseVeiculosDashboardReturn {
  // Data
  dashboard: DashboardVeiculosResponse | null;

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboard: () => Promise<void>;

  // Utils
  clearError: () => void;
}

export const useVeiculosDashboard = (): UseVeiculosDashboardReturn => {
  // States
  const [dashboard, setDashboard] = useState<DashboardVeiculosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch dashboard
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await VeiculosService.getDashboard();
      setDashboard(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dashboard';
      setError(errorMessage);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto fetch on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    // Data
    dashboard,

    // States
    loading,
    error,

    // Actions
    fetchDashboard,

    // Utils
    clearError
  };
};

// ============================================================================
// HOOK: useVeiculosDisponiveis - Available vehicles for reservations
// ============================================================================

interface UseVeiculosDisponiveisReturn {
  // Data
  veiculos: VeiculoResponse[];

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchVeiculos: (dataInicio?: string, dataFim?: string) => Promise<void>;

  // Utils
  clearError: () => void;
}

export const useVeiculosDisponiveis = (): UseVeiculosDisponiveisReturn => {
  // States
  const [veiculos, setVeiculos] = useState<VeiculoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch veiculos
  const fetchVeiculos = useCallback(async (dataInicio?: string, dataFim?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await VeiculosService.getVeiculosDisponiveis(dataInicio, dataFim);
      setVeiculos(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículos disponíveis';
      setError(errorMessage);
      setVeiculos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto fetch on mount
  useEffect(() => {
    fetchVeiculos();
  }, [fetchVeiculos]);

  return {
    // Data
    veiculos,

    // States
    loading,
    error,

    // Actions
    fetchVeiculos,

    // Utils
    clearError
  };
};

// ============================================================================
// HOOK: useManutencoes - Vehicle maintenance management
// ============================================================================

interface UseMantencoesReturn {
  // Data
  manutencoes: ManutencaoVeiculo[];

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchManutencoes: () => Promise<void>;
  createManutencao: (data: CreateManutencaoRequest) => Promise<ManutencaoVeiculo>;
  updateManutencao: (manutencaoId: string, data: Partial<CreateManutencaoRequest>) => Promise<ManutencaoVeiculo>;
  deleteManutencao: (manutencaoId: string) => Promise<void>;

  // Utils
  clearError: () => void;
}

export const useManutencoes = (veiculoId: number | null): UseMantencoesReturn => {
  // States
  const [manutencoes, setManutencoes] = useState<ManutencaoVeiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch manutencoes
  const fetchManutencoes = useCallback(async () => {
    if (!veiculoId) {
      setManutencoes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await VeiculosService.getManutencoesByVeiculo(veiculoId);
      setManutencoes(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar manutenções';
      setError(errorMessage);
      setManutencoes([]);
    } finally {
      setLoading(false);
    }
  }, [veiculoId]);

  // Create manutencao
  const createManutencao = useCallback(async (data: CreateManutencaoRequest): Promise<ManutencaoVeiculo> => {
    if (!veiculoId) throw new Error('ID do veículo não fornecido');

    try {
      setError(null);
      const newManutencao = await VeiculosService.createManutencao(veiculoId, data);

      // Add to local state
      setManutencoes(prev => [newManutencao, ...prev]);

      return newManutencao;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar manutenção';
      setError(errorMessage);
      throw err;
    }
  }, [veiculoId]);

  // Update manutencao
  const updateManutencao = useCallback(async (manutencaoId: string, data: Partial<CreateManutencaoRequest>): Promise<ManutencaoVeiculo> => {
    if (!veiculoId) throw new Error('ID do veículo não fornecido');

    try {
      setError(null);
      const updatedManutencao = await VeiculosService.updateManutencao(veiculoId, manutencaoId, data);

      // Update local state
      setManutencoes(prev => prev.map(manutencao =>
        manutencao.id === manutencaoId ? updatedManutencao : manutencao
      ));

      return updatedManutencao;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar manutenção';
      setError(errorMessage);
      throw err;
    }
  }, [veiculoId]);

  // Delete manutencao
  const deleteManutencao = useCallback(async (manutencaoId: string): Promise<void> => {
    if (!veiculoId) throw new Error('ID do veículo não fornecido');

    try {
      setError(null);
      await VeiculosService.deleteManutencao(veiculoId, manutencaoId);

      // Remove from local state
      setManutencoes(prev => prev.filter(manutencao => manutencao.id !== manutencaoId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir manutenção';
      setError(errorMessage);
      throw err;
    }
  }, [veiculoId]);

  // Auto fetch when vehicle ID changes
  useEffect(() => {
    fetchManutencoes();
  }, [fetchManutencoes]);

  return {
    // Data
    manutencoes,

    // States
    loading,
    error,

    // Actions
    fetchManutencoes,
    createManutencao,
    updateManutencao,
    deleteManutencao,

    // Utils
    clearError
  };
};