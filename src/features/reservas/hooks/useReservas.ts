// src/features/reservas/hooks/useReservas.ts
import { useState, useEffect, useCallback } from 'react';
import {
  ReservasService,
  type ReservaResponse,
  type QueryReservasParams,
  type CreateReservaRequest,
  type UpdateReservaRequest,
  type StatusReserva,
  type DashboardReservasResponse
} from '@/services/reservas.services';

// ============================================================================
// HOOK: useReservas - Main hook for reservas management
// ============================================================================

interface UseReservasParams extends Partial<QueryReservasParams> {
  autoFetch?: boolean;
}

interface UseReservasReturn {
  // Data
  reservas: ReservaResponse[];
  totalReservas: number;

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchReservas: (params?: QueryReservasParams) => Promise<void>;
  createReserva: (data: CreateReservaRequest) => Promise<ReservaResponse>;
  updateReserva: (id: string, data: UpdateReservaRequest) => Promise<ReservaResponse>;
  updateStatus: (id: string, status: StatusReserva, motivo?: string) => Promise<ReservaResponse>;
  aprovarReserva: (id: string, aprovadoPor: string) => Promise<ReservaResponse>;
  deleteReserva: (id: string) => Promise<void>;
  verificarConflitos: (
    veiculoId: number,
    dataInicio: string,
    dataFim: string,
    horaInicio: string,
    horaFim: string,
    reservaIdIgnorar?: string
  ) => Promise<ReservaResponse[]>;

  // Utils
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useReservas = (params: UseReservasParams = {}): UseReservasReturn => {
  const { autoFetch = true, ...queryParams } = params;

  // States
  const [reservas, setReservas] = useState<ReservaResponse[]>([]);
  const [totalReservas, setTotalReservas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch reservas
  const fetchReservas = useCallback(async (fetchParams?: QueryReservasParams) => {
    try {
      setLoading(true);
      setError(null);

      const finalParams = { ...queryParams, ...fetchParams };
      const response = await ReservasService.getAllReservas(finalParams);

      setReservas(response.data);
      setTotalReservas(response.pagination.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar reservas';
      setError(errorMessage);
      setReservas([]);
      setTotalReservas(0);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Create reserva
  const createReserva = useCallback(async (data: CreateReservaRequest): Promise<ReservaResponse> => {
    try {
      setError(null);
      const newReserva = await ReservasService.createReserva(data);

      // Refresh list after creation
      await fetchReservas();

      return newReserva;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar reserva';
      setError(errorMessage);
      throw err;
    }
  }, [fetchReservas]);

  // Update reserva
  const updateReserva = useCallback(async (id: string, data: UpdateReservaRequest): Promise<ReservaResponse> => {
    try {
      setError(null);
      const updatedReserva = await ReservasService.updateReserva(id, data);

      // Update local state
      setReservas(prev => prev.map(reserva =>
        reserva.id === id ? updatedReserva : reserva
      ));

      return updatedReserva;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar reserva';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update status
  const updateStatus = useCallback(async (id: string, status: StatusReserva, motivo?: string): Promise<ReservaResponse> => {
    try {
      setError(null);
      const updatedReserva = await ReservasService.updateReservaStatus(id, status, motivo);

      // Update local state
      setReservas(prev => prev.map(reserva =>
        reserva.id === id ? updatedReserva : reserva
      ));

      return updatedReserva;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Aprovar reserva
  const aprovarReserva = useCallback(async (id: string, aprovadoPor: string): Promise<ReservaResponse> => {
    try {
      setError(null);
      const approvedReserva = await ReservasService.aprovarReserva(id, aprovadoPor);

      // Update local state
      setReservas(prev => prev.map(reserva =>
        reserva.id === id ? approvedReserva : reserva
      ));

      return approvedReserva;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aprovar reserva';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete reserva
  const deleteReserva = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await ReservasService.deleteReserva(id);

      // Remove from local state
      setReservas(prev => prev.filter(reserva => reserva.id !== id));
      setTotalReservas(prev => prev - 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir reserva';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Verificar conflitos
  const verificarConflitos = useCallback(async (
    veiculoId: number,
    dataInicio: string,
    dataFim: string,
    horaInicio: string,
    horaFim: string,
    reservaIdIgnorar?: string
  ): Promise<ReservaResponse[]> => {
    try {
      setError(null);
      return await ReservasService.verificarConflitos(
        veiculoId,
        dataInicio,
        dataFim,
        horaInicio,
        horaFim,
        reservaIdIgnorar
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar conflitos';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refetch
  const refetch = useCallback(() => fetchReservas(), [fetchReservas]);

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchReservas();
    }
  }, [autoFetch, fetchReservas]);

  return {
    // Data
    reservas,
    totalReservas,

    // States
    loading,
    error,

    // Actions
    fetchReservas,
    createReserva,
    updateReserva,
    updateStatus,
    aprovarReserva,
    deleteReserva,
    verificarConflitos,

    // Utils
    refetch,
    clearError
  };
};

// ============================================================================
// HOOK: useReserva - Single reserva management
// ============================================================================

interface UseReservaReturn {
  // Data
  reserva: ReservaResponse | null;

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchReserva: () => Promise<void>;
  updateReserva: (data: UpdateReservaRequest) => Promise<ReservaResponse>;
  updateStatus: (status: StatusReserva, motivo?: string) => Promise<ReservaResponse>;

  // Utils
  clearError: () => void;
}

export const useReserva = (id: string | null): UseReservaReturn => {
  // States
  const [reserva, setReserva] = useState<ReservaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch reserva
  const fetchReserva = useCallback(async () => {
    if (!id) {
      setReserva(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await ReservasService.getReservaById(id);
      setReserva(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar reserva';
      setError(errorMessage);
      setReserva(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Update reserva
  const updateReserva = useCallback(async (data: UpdateReservaRequest): Promise<ReservaResponse> => {
    if (!id) throw new Error('ID da reserva não fornecido');

    try {
      setError(null);
      const updatedReserva = await ReservasService.updateReserva(id, data);
      setReserva(updatedReserva);
      return updatedReserva;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar reserva';
      setError(errorMessage);
      throw err;
    }
  }, [id]);

  // Update status
  const updateStatus = useCallback(async (status: StatusReserva, motivo?: string): Promise<ReservaResponse> => {
    if (!id) throw new Error('ID da reserva não fornecido');

    try {
      setError(null);
      const updatedReserva = await ReservasService.updateReservaStatus(id, status, motivo);
      setReserva(updatedReserva);
      return updatedReserva;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(errorMessage);
      throw err;
    }
  }, [id]);

  // Auto fetch when ID changes
  useEffect(() => {
    fetchReserva();
  }, [fetchReserva]);

  return {
    // Data
    reserva,

    // States
    loading,
    error,

    // Actions
    fetchReserva,
    updateReserva,
    updateStatus,

    // Utils
    clearError
  };
};

// ============================================================================
// HOOK: useReservasDashboard - Dashboard statistics
// ============================================================================

interface UseReservasDashboardReturn {
  // Data
  dashboard: DashboardReservasResponse | null;

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboard: () => Promise<void>;

  // Utils
  clearError: () => void;
}

export const useReservasDashboard = (): UseReservasDashboardReturn => {
  // States
  const [dashboard, setDashboard] = useState<DashboardReservasResponse | null>(null);
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

      const response = await ReservasService.getDashboard();
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
// HOOK: useReservasByVeiculo - Reservas by vehicle
// ============================================================================

interface UseReservasByVeiculoReturn {
  // Data
  reservas: ReservaResponse[];

  // States
  loading: boolean;
  error: string | null;

  // Actions
  fetchReservas: () => Promise<void>;

  // Utils
  clearError: () => void;
}

export const useReservasByVeiculo = (veiculoId: number | null): UseReservasByVeiculoReturn => {
  // States
  const [reservas, setReservas] = useState<ReservaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch reservas
  const fetchReservas = useCallback(async () => {
    if (!veiculoId) {
      setReservas([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await ReservasService.getReservasByVeiculo(veiculoId);
      setReservas(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar reservas do veículo';
      setError(errorMessage);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }, [veiculoId]);

  // Auto fetch when vehicle ID changes
  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  return {
    // Data
    reservas,

    // States
    loading,
    error,

    // Actions
    fetchReservas,

    // Utils
    clearError
  };
};