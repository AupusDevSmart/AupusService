// src/features/reservas/hooks/useVeiculoSelector.ts
import { useState, useEffect, useCallback } from 'react';
import { VeiculosService, type VeiculoResponse } from '@/services/veiculos.services';
import { ReservasService, type ReservaResponse } from '@/services/reservas.services';

// ============================================================================
// HOOK: useVeiculoSelector - Vehicle selection for reservations
// ============================================================================

interface UseVeiculoSelectorParams {
  dataInicio?: string;
  dataFim?: string;
  horaInicio?: string;
  horaFim?: string;
  reservaIdIgnorar?: string; // For editing existing reservations
}

interface UseVeiculoSelectorReturn {
  // Data
  veiculosDisponiveis: VeiculoResponse[];
  veiculoSelecionado: VeiculoResponse | null;
  conflitos: ReservaResponse[];

  // States
  loading: boolean;
  loadingConflitos: boolean;
  error: string | null;

  // Actions
  fetchVeiculosDisponiveis: () => Promise<void>;
  selecionarVeiculo: (veiculo: VeiculoResponse | null) => void;
  verificarDisponibilidade: (veiculoId: number) => Promise<boolean>;
  verificarConflitos: (veiculoId: number) => Promise<ReservaResponse[]>;

  // Utils
  clearError: () => void;
  isVeiculoDisponivel: (veiculoId: number) => boolean;
}

export const useVeiculoSelector = (params: UseVeiculoSelectorParams = {}): UseVeiculoSelectorReturn => {
  const { dataInicio, dataFim, horaInicio, horaFim, reservaIdIgnorar } = params;

  // States
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState<VeiculoResponse[]>([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoResponse | null>(null);
  const [conflitos, setConflitos] = useState<ReservaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConflitos, setLoadingConflitos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch available vehicles
  const fetchVeiculosDisponiveis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await VeiculosService.getVeiculosDisponiveis(dataInicio, dataFim);
      setVeiculosDisponiveis(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículos disponíveis';
      setError(errorMessage);
      setVeiculosDisponiveis([]);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  // Select vehicle
  const selecionarVeiculo = useCallback((veiculo: VeiculoResponse | null) => {
    setVeiculoSelecionado(veiculo);
    setConflitos([]);

    // Auto check conflicts when vehicle is selected
    if (veiculo && dataInicio && dataFim && horaInicio && horaFim) {
      verificarConflitos(veiculo.id);
    }
  }, [dataInicio, dataFim, horaInicio, horaFim]);

  // Check vehicle availability
  const verificarDisponibilidade = useCallback(async (veiculoId: number): Promise<boolean> => {
    if (!dataInicio || !dataFim || !horaInicio || !horaFim) {
      return true; // Cannot check without date/time info
    }

    try {
      const conflitos = await ReservasService.verificarConflitos(
        veiculoId,
        dataInicio,
        dataFim,
        horaInicio,
        horaFim,
        reservaIdIgnorar
      );

      return conflitos.length === 0;
    } catch (err) {
      console.error('Erro ao verificar disponibilidade:', err);
      return false;
    }
  }, [dataInicio, dataFim, horaInicio, horaFim, reservaIdIgnorar]);

  // Check conflicts for specific vehicle
  const verificarConflitos = useCallback(async (veiculoId: number): Promise<ReservaResponse[]> => {
    if (!dataInicio || !dataFim || !horaInicio || !horaFim) {
      setConflitos([]);
      return [];
    }

    try {
      setLoadingConflitos(true);
      setError(null);

      const conflitosEncontrados = await ReservasService.verificarConflitos(
        veiculoId,
        dataInicio,
        dataFim,
        horaInicio,
        horaFim,
        reservaIdIgnorar
      );

      setConflitos(conflitosEncontrados);
      return conflitosEncontrados;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar conflitos';
      setError(errorMessage);
      setConflitos([]);
      return [];
    } finally {
      setLoadingConflitos(false);
    }
  }, [dataInicio, dataFim, horaInicio, horaFim, reservaIdIgnorar]);

  // Helper to check if vehicle is available
  const isVeiculoDisponivel = useCallback((veiculoId: number): boolean => {
    const veiculo = veiculosDisponiveis.find(v => v.id === veiculoId);
    return veiculo?.status === 'disponivel';
  }, [veiculosDisponiveis]);

  // Auto fetch when date parameters change
  useEffect(() => {
    fetchVeiculosDisponiveis();
  }, [fetchVeiculosDisponiveis]);

  // Auto check conflicts when selected vehicle and date/time params change
  useEffect(() => {
    if (veiculoSelecionado && dataInicio && dataFim && horaInicio && horaFim) {
      verificarConflitos(veiculoSelecionado.id);
    } else {
      setConflitos([]);
    }
  }, [veiculoSelecionado, dataInicio, dataFim, horaInicio, horaFim, verificarConflitos]);

  return {
    // Data
    veiculosDisponiveis,
    veiculoSelecionado,
    conflitos,

    // States
    loading,
    loadingConflitos,
    error,

    // Actions
    fetchVeiculosDisponiveis,
    selecionarVeiculo,
    verificarDisponibilidade,
    verificarConflitos,

    // Utils
    clearError,
    isVeiculoDisponivel
  };
};

// ============================================================================
// HOOK: useVeiculoInfo - Get vehicle information for display
// ============================================================================

interface UseVeiculoInfoReturn {
  // Data
  veiculo: VeiculoResponse | null;
  reservasAtivas: ReservaResponse[];

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchVeiculoInfo: () => Promise<void>;

  // Utils
  clearError: () => void;
}

export const useVeiculoInfo = (veiculoId: number | null): UseVeiculoInfoReturn => {
  // States
  const [veiculo, setVeiculo] = useState<VeiculoResponse | null>(null);
  const [reservasAtivas, setReservasAtivas] = useState<ReservaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch vehicle info
  const fetchVeiculoInfo = useCallback(async () => {
    if (!veiculoId) {
      setVeiculo(null);
      setReservasAtivas([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch vehicle details and active reservations in parallel
      const [veiculoResponse, reservasResponse] = await Promise.all([
        VeiculosService.getVeiculoById(veiculoId),
        ReservasService.getReservasByVeiculo(veiculoId, { status: 'ativa' })
      ]);

      setVeiculo(veiculoResponse);
      setReservasAtivas(reservasResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar informações do veículo';
      setError(errorMessage);
      setVeiculo(null);
      setReservasAtivas([]);
    } finally {
      setLoading(false);
    }
  }, [veiculoId]);

  // Auto fetch when vehicle ID changes
  useEffect(() => {
    fetchVeiculoInfo();
  }, [fetchVeiculoInfo]);

  return {
    // Data
    veiculo,
    reservasAtivas,

    // States
    loading,
    error,

    // Actions
    fetchVeiculoInfo,

    // Utils
    clearError
  };
};