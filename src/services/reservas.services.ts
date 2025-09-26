// src/services/reservas.services.ts
import { api } from '@/config/api';
import { PaginatedResponse, BaseFilters } from '@/types/base';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type StatusReserva = 'ativa' | 'finalizada' | 'cancelada' | 'vencida';
export type TipoSolicitante = 'ordem_servico' | 'viagem' | 'manutencao' | 'manual';

// Base interface for Reserva
export interface BaseReserva {
  veiculoId: number;
  solicitanteId?: string;
  tipoSolicitante: TipoSolicitante;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;
  horaInicio: string; // HH:mm
  horaFim: string;
  responsavel: string;
  finalidade: string;
  status: StatusReserva;
  valorTotal?: number;
  observacoes?: string;
  aprovadoPor?: string;
  dataAprovacao?: string;
  motivoCancelamento?: string;
  dataCancelamento?: string;
}

// Response interface
export interface ReservaResponse extends BaseReserva {
  id: string;
  createdAt: string;
  updatedAt: string;
  veiculo?: {
    id: number;
    nome: string;
    placa: string;
    marca: string;
    modelo: string;
    tipo?: string;
    status: string;
    localizacaoAtual: string;
  };
}

// Create/Update interfaces
export interface CreateReservaRequest extends BaseReserva {}

export interface UpdateReservaRequest extends Partial<BaseReserva> {}

// Query parameters
export interface QueryReservasParams extends BaseFilters {
  search?: string;
  veiculoId?: number;
  status?: StatusReserva;
  tipoSolicitante?: TipoSolicitante;
  responsavel?: string;
  dataInicioFrom?: string; // YYYY-MM-DD
  dataInicioTo?: string;
  dataFimFrom?: string;
  dataFimTo?: string;
  aprovadoPor?: string;
  orderBy?: 'dataInicio' | 'dataFim' | 'responsavel' | 'status' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

// Dashboard types
export interface DashboardReservasResponse {
  totalReservas: number;
  reservasAtivas: number;
  reservasFinalizadas: number;
  reservasCanceladas: number;
  reservasVencidas: number;
  reservasHoje: number;
  reservasProximaSemana: number;
  veiculosMaisReservados: Array<{
    veiculoId: number;
    nomeVeiculo: string;
    totalReservas: number;
  }>;
  distribuicaoTipoSolicitante: {
    ordem_servico: number;
    viagem: number;
    manutencao: number;
    manual: number;
  };
  valorTotalReservas: number;
  mediaValorPorReserva: number;
}

// Filters type
export interface ReservasFilters {
  search: string;
  veiculoId: string | 'all';
  status: string | 'all';
  tipoSolicitante: string | 'all';
  responsavel: string;
  dataInicioFrom: string;
  dataInicioTo: string;
  dataFimFrom: string;
  dataFimTo: string;
  page: number;
  limit: number;
}

// ============================================================================
// API SERVICE
// ============================================================================

export class ReservasService {
  private static readonly BASE_URL = '/reservas';

  // GET /reservas - List reservas with filtering and pagination
  static async getAllReservas(params: QueryReservasParams = {}): Promise<PaginatedResponse<ReservaResponse>> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Buscando reservas:', params);

      const queryParams = new URLSearchParams();

      // Add pagination
      queryParams.append('page', String(params.page || 1));
      queryParams.append('limit', String(params.limit || 10));

      // Add filters
      if (params.search) queryParams.append('search', params.search);
      if (params.veiculoId) queryParams.append('veiculoId', String(params.veiculoId));
      if (params.status) queryParams.append('status', params.status);
      if (params.tipoSolicitante) queryParams.append('tipoSolicitante', params.tipoSolicitante);
      if (params.responsavel) queryParams.append('responsavel', params.responsavel);
      if (params.dataInicioFrom) queryParams.append('dataInicioFrom', params.dataInicioFrom);
      if (params.dataInicioTo) queryParams.append('dataInicioTo', params.dataInicioTo);
      if (params.dataFimFrom) queryParams.append('dataFimFrom', params.dataFimFrom);
      if (params.dataFimTo) queryParams.append('dataFimTo', params.dataFimTo);
      if (params.aprovadoPor) queryParams.append('aprovadoPor', params.aprovadoPor);

      // Add sorting
      if (params.orderBy) queryParams.append('orderBy', params.orderBy);
      if (params.orderDirection) queryParams.append('orderDirection', params.orderDirection);

      const url = `${this.BASE_URL}?${queryParams.toString()}`;
      const response = await api.get<PaginatedResponse<ReservaResponse>>(url);

      // console.log('✅ [RESERVAS SERVICE] Reservas carregadas:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao carregar reservas:', error);
      throw this.handleError(error, 'Erro ao carregar reservas');
    }
  }

  // GET /reservas/dashboard - Get dashboard statistics
  static async getDashboard(): Promise<DashboardReservasResponse> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Buscando dashboard');

      const response = await api.get<DashboardReservasResponse>(`${this.BASE_URL}/dashboard`);

      // console.log('✅ [RESERVAS SERVICE] Dashboard carregado:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao carregar dashboard:', error);
      throw this.handleError(error, 'Erro ao carregar estatísticas');
    }
  }

  // GET /reservas/:id - Get reserva by ID
  static async getReservaById(id: string): Promise<ReservaResponse> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Buscando reserva por ID:', id);

      const response = await api.get<ReservaResponse>(`${this.BASE_URL}/${id}`);

      // console.log('✅ [RESERVAS SERVICE] Reserva carregada:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao carregar reserva:', error);
      throw this.handleError(error, 'Erro ao carregar reserva');
    }
  }

  // GET /reservas/veiculo/:veiculoId - Get reservas by vehicle
  static async getReservasByVeiculo(veiculoId: number, params: Partial<QueryReservasParams> = {}): Promise<ReservaResponse[]> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Buscando reservas por veículo:', veiculoId);

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.dataInicioFrom) queryParams.append('dataInicioFrom', params.dataInicioFrom);
      if (params.dataInicioTo) queryParams.append('dataInicioTo', params.dataInicioTo);

      const url = `${this.BASE_URL}/veiculo/${veiculoId}?${queryParams.toString()}`;
      const response = await api.get<ReservaResponse[]>(url);

      // console.log('✅ [RESERVAS SERVICE] Reservas do veículo carregadas:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao carregar reservas do veículo:', error);
      throw this.handleError(error, 'Erro ao carregar reservas do veículo');
    }
  }

  // POST /reservas - Create new reserva
  static async createReserva(data: CreateReservaRequest): Promise<ReservaResponse> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Criando reserva:', data);

      const response = await api.post<ReservaResponse>(this.BASE_URL, data);

      // console.log('✅ [RESERVAS SERVICE] Reserva criada:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao criar reserva:', error);
      throw this.handleError(error, 'Erro ao criar reserva');
    }
  }

  // PUT /reservas/:id - Update reserva
  static async updateReserva(id: string, data: UpdateReservaRequest): Promise<ReservaResponse> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Atualizando reserva:', id, data);

      const response = await api.put<ReservaResponse>(`${this.BASE_URL}/${id}`, data);

      // console.log('✅ [RESERVAS SERVICE] Reserva atualizada:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao atualizar reserva:', error);
      throw this.handleError(error, 'Erro ao atualizar reserva');
    }
  }

  // PUT /reservas/:id/status - Update reserva status
  static async updateReservaStatus(id: string, status: StatusReserva, motivoCancelamento?: string): Promise<ReservaResponse> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Atualizando status da reserva:', id, status);

      const data = {
        status,
        ...(status === 'cancelada' && motivoCancelamento && { motivoCancelamento })
      };

      const response = await api.put<ReservaResponse>(`${this.BASE_URL}/${id}/status`, data);

      // console.log('✅ [RESERVAS SERVICE] Status da reserva atualizado:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao atualizar status:', error);
      throw this.handleError(error, 'Erro ao atualizar status da reserva');
    }
  }

  // PUT /reservas/:id/aprovar - Approve reserva
  static async aprovarReserva(id: string, aprovadoPor: string): Promise<ReservaResponse> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Aprovando reserva:', id);

      const response = await api.put<ReservaResponse>(`${this.BASE_URL}/${id}/aprovar`, { aprovadoPor });

      // console.log('✅ [RESERVAS SERVICE] Reserva aprovada:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao aprovar reserva:', error);
      throw this.handleError(error, 'Erro ao aprovar reserva');
    }
  }

  // DELETE /reservas/:id - Delete reserva (soft delete)
  static async deleteReserva(id: string): Promise<void> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Excluindo reserva:', id);

      await api.delete(`${this.BASE_URL}/${id}`);

      // console.log('✅ [RESERVAS SERVICE] Reserva excluída');
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao excluir reserva:', error);
      throw this.handleError(error, 'Erro ao excluir reserva');
    }
  }

  // GET /reservas/conflitos - Check for conflicts
  static async verificarConflitos(
    veiculoId: number,
    dataInicio: string,
    dataFim: string,
    horaInicio: string,
    horaFim: string,
    reservaIdIgnorar?: string
  ): Promise<ReservaResponse[]> {
    try {
      // console.log('📡 [RESERVAS SERVICE] Verificando conflitos');

      const queryParams = new URLSearchParams({
        veiculoId: String(veiculoId),
        dataInicio,
        dataFim,
        horaInicio,
        horaFim
      });

      if (reservaIdIgnorar) {
        queryParams.append('ignorarReserva', reservaIdIgnorar);
      }

      const response = await api.get<ReservaResponse[]>(`${this.BASE_URL}/conflitos?${queryParams.toString()}`);

      // console.log('✅ [RESERVAS SERVICE] Conflitos verificados:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [RESERVAS SERVICE] Erro ao verificar conflitos:', error);
      throw this.handleError(error, 'Erro ao verificar conflitos');
    }
  }

  // Private method to handle errors
  private static handleError(error: any, defaultMessage: string): Error {
    if (error.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        return new Error(error.response.data.message.join(', '));
      }
      return new Error(error.response.data.message);
    }

    if (error.message) {
      return new Error(error.message);
    }

    return new Error(defaultMessage);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const reservasUtils = {
  // Format status for display
  formatStatus: (status: StatusReserva): string => {
    const statusMap = {
      ativa: 'Ativa',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada',
      vencida: 'Vencida'
    };
    return statusMap[status] || status;
  },

  // Format tipo solicitante for display
  formatTipoSolicitante: (tipo: TipoSolicitante): string => {
    const tipoMap = {
      ordem_servico: 'Ordem de Serviço',
      viagem: 'Viagem',
      manutencao: 'Manutenção',
      manual: 'Manual'
    };
    return tipoMap[tipo] || tipo;
  },

  // Check if reserva is active
  isReservaAtiva: (reserva: ReservaResponse): boolean => {
    return reserva.status === 'ativa';
  },

  // Check if reserva can be cancelled
  canCancelReserva: (reserva: ReservaResponse): boolean => {
    return reserva.status === 'ativa';
  },

  // Check if reserva can be edited
  canEditReserva: (reserva: ReservaResponse): boolean => {
    return reserva.status === 'ativa';
  },

  // Calculate total duration in hours
  calculateDuration: (dataInicio: string, dataFim: string, horaInicio: string, horaFim: string): number => {
    try {
      // Função para extrair apenas a parte da data (YYYY-MM-DD) de strings ISO
      const extractDate = (dateStr: string): string => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        
        // Se já está no formato ISO, extrair apenas a parte da data
        if (dateStr.includes('T')) {
          return dateStr.split('T')[0];
        }
        
        // Se já está no formato YYYY-MM-DD, retornar como está
        return dateStr;
      };

      // Extrair apenas as partes das datas
      const dataInicioLimpa = extractDate(dataInicio);
      const dataFimLimpa = extractDate(dataFim);
      
      // Garantir que os horários estão no formato correto
      const horaInicioLimpa = horaInicio || '00:00';
      const horaFimLimpa = horaFim || '23:59';
      
      // Criar datas completas
      const inicio = new Date(`${dataInicioLimpa}T${horaInicioLimpa}:00`);
      const fim = new Date(`${dataFimLimpa}T${horaFimLimpa}:00`);
      
      // Verificar se as datas são válidas
      if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
        // console.error('Datas inválidas para cálculo de duração');
        return 0;
      }
      
      // Calcular diferença em milissegundos e converter para horas
      const diferencaMs = fim.getTime() - inicio.getTime();
      const horas = diferencaMs / (1000 * 60 * 60);
      
      // Retornar valor absoluto para evitar números negativos
      return Math.abs(horas);
      
    } catch (error) {
      // console.error('Erro ao calcular duração da reserva:', error);
      return 0;
    }
  },

  // Format date range for display
  formatDateRange: (dataInicio: string, dataFim: string): string => {
    const inicio = new Date(dataInicio).toLocaleDateString('pt-BR');
    const fim = new Date(dataFim).toLocaleDateString('pt-BR');

    if (dataInicio === dataFim) {
      return inicio;
    }

    return `${inicio} - ${fim}`;
  },

  // Format time range for display
  formatTimeRange: (horaInicio: string, horaFim: string): string => {
    return `${horaInicio} - ${horaFim}`;
  }
};