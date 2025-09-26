// src/services/veiculos.services.ts
import { api } from '@/config/api';
import { PaginatedResponse, BaseFilters } from '@/types/base';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type StatusVeiculo = 'disponivel' | 'em_uso' | 'manutencao' | 'inativo';
export type TipoCombustivel = 'gasolina' | 'etanol' | 'diesel' | 'gnv' | 'eletrico' | 'hibrido' | 'flex';
export type TipoVeiculo = 'carro' | 'van' | 'caminhonete' | 'caminhao' | 'onibus' | 'moto';

// Base interface for Veiculo
export interface BaseVeiculo {
  nome: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  status: StatusVeiculo;
  tipo?: TipoVeiculo;
  tipoCombustivel: TipoCombustivel;
  capacidadePassageiros?: number;
  capacidadeCarga?: number; // em kg
  kmAtual?: number;
  proximaRevisao?: string; // YYYY-MM-DD
  responsavelManutencao?: string;
  localizacaoAtual: string;
  valorDiaria?: number;
  observacoes?: string;
  chassi?: string;
  renavam?: string;
  seguradora?: string;
  vencimentoSeguro?: string; // YYYY-MM-DD
}

// Response interface
export interface VeiculoResponse extends BaseVeiculo {
  id: number;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos
  reservasAtivas?: number;
  proximaReserva?: {
    id: string;
    dataInicio: string;
    horaInicio: string;
    responsavel: string;
  };
  manutencoes?: Array<{
    id: string;
    tipo: string;
    dataInicio: string;
    dataFim?: string;
    descricao: string;
  }>;
}

// Create/Update interfaces
export interface CreateVeiculoRequest extends BaseVeiculo {}

export interface UpdateVeiculoRequest extends Partial<BaseVeiculo> {}

// Query parameters
export interface QueryVeiculosParams extends BaseFilters {
  search?: string;
  status?: StatusVeiculo;
  tipo?: TipoVeiculo;
  tipoCombustivel?: TipoCombustivel;
  marca?: string;
  modelo?: string;
  anoMin?: number;
  anoMax?: number;
  capacidadePassageirosMin?: number;
  capacidadePassageirosMax?: number;
  disponivel?: boolean; // Filter only available vehicles
  localizacao?: string;
  orderBy?: 'nome' | 'placa' | 'marca' | 'modelo' | 'ano' | 'status' | 'kmAtual' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

// Dashboard types
export interface DashboardVeiculosResponse {
  totalVeiculos: number;
  veiculosDisponiveis: number;
  veiculosEmUso: number;
  veiculosManutencao: number;
  veiculosInativos: number;

  // Distribuição por tipo
  distribuicaoTipo: {
    carro: number;
    van: number;
    caminhonete: number;
    caminhao: number;
    onibus: number;
    moto: number;
  };

  // Distribuição por combustível
  distribuicaoCombustivel: {
    gasolina: number;
    etanol: number;
    diesel: number;
    gnv: number;
    eletrico: number;
    hibrido: number;
    flex: number;
  };

  // Estatísticas
  kmTotalFrota: number;
  mediaKmPorVeiculo: number;
  veiculosProximaRevisao: number; // próximos 30 dias
  veiculosSeguroVencendo: number; // próximos 30 dias
  taxaUtilizacao: number; // porcentagem
  receita: {
    totalMes: number;
    totalAno: number;
    mediaValorDiaria: number;
  };
}

// Maintenance record types
export interface ManutencaoVeiculo {
  id: string;
  veiculoId: number;
  tipo: 'preventiva' | 'corretiva' | 'revisao' | 'troca_oleo' | 'outros';
  descricao: string;
  dataInicio: string;
  dataFim?: string;
  kmRealizacao: number;
  valor?: number;
  fornecedor?: string;
  observacoes?: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  createdAt: string;
  updatedAt: string;
}

export interface CreateManutencaoRequest {
  tipo: ManutencaoVeiculo['tipo'];
  descricao: string;
  dataInicio: string;
  dataFim?: string;
  kmRealizacao: number;
  valor?: number;
  fornecedor?: string;
  observacoes?: string;
}

// Filters type
export interface VeiculosFilters {
  search: string;
  status: string | 'all';
  tipo: string | 'all';
  tipoCombustivel: string | 'all';
  marca: string;
  disponivel: string | 'all';
  page: number;
  limit: number;
}

// ============================================================================
// API SERVICE
// ============================================================================

export class VeiculosService {
  private static readonly BASE_URL = '/veiculos';

  // GET /veiculos - List vehicles with filtering and pagination
  static async getAllVeiculos(params: QueryVeiculosParams = {}): Promise<PaginatedResponse<VeiculoResponse>> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Buscando veículos:', params);

      const queryParams = new URLSearchParams();

      // Add pagination
      queryParams.append('page', String(params.page || 1));
      queryParams.append('limit', String(params.limit || 10));

      // Add filters
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.tipo) queryParams.append('tipo', params.tipo);
      if (params.tipoCombustivel) queryParams.append('tipoCombustivel', params.tipoCombustivel);
      if (params.marca) queryParams.append('marca', params.marca);
      if (params.modelo) queryParams.append('modelo', params.modelo);
      if (params.anoMin) queryParams.append('anoMin', String(params.anoMin));
      if (params.anoMax) queryParams.append('anoMax', String(params.anoMax));
      if (params.capacidadePassageirosMin) queryParams.append('capacidadePassageirosMin', String(params.capacidadePassageirosMin));
      if (params.capacidadePassageirosMax) queryParams.append('capacidadePassageirosMax', String(params.capacidadePassageirosMax));
      if (params.disponivel !== undefined) queryParams.append('disponivel', String(params.disponivel));
      if (params.localizacao) queryParams.append('localizacao', params.localizacao);

      // Add sorting
      if (params.orderBy) queryParams.append('orderBy', params.orderBy);
      if (params.orderDirection) queryParams.append('orderDirection', params.orderDirection);

      const url = `${this.BASE_URL}?${queryParams.toString()}`;
      const response = await api.get<PaginatedResponse<VeiculoResponse>>(url);

      // console.log('✅ [VEÍCULOS SERVICE] Veículos carregados:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao carregar veículos:', error);
      throw this.handleError(error, 'Erro ao carregar veículos');
    }
  }

  // GET /veiculos/dashboard - Get dashboard statistics
  static async getDashboard(): Promise<DashboardVeiculosResponse> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Buscando dashboard');

      const response = await api.get<DashboardVeiculosResponse>(`${this.BASE_URL}/dashboard`);

      // console.log('✅ [VEÍCULOS SERVICE] Dashboard carregado:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao carregar dashboard:', error);
      throw this.handleError(error, 'Erro ao carregar estatísticas');
    }
  }

  // GET /veiculos/disponiveis - Get available vehicles for reservations
  static async getVeiculosDisponiveis(dataInicio?: string, dataFim?: string): Promise<VeiculoResponse[]> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Buscando veículos disponíveis');

      const queryParams = new URLSearchParams();
      if (dataInicio) queryParams.append('dataInicio', dataInicio);
      if (dataFim) queryParams.append('dataFim', dataFim);

      const url = `${this.BASE_URL}/disponiveis?${queryParams.toString()}`;
      const response = await api.get<VeiculoResponse[]>(url);

      // console.log('✅ [VEÍCULOS SERVICE] Veículos disponíveis carregados:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao carregar veículos disponíveis:', error);
      throw this.handleError(error, 'Erro ao carregar veículos disponíveis');
    }
  }

  // GET /veiculos/:id - Get vehicle by ID
  static async getVeiculoById(id: number): Promise<VeiculoResponse> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Buscando veículo por ID:', id);

      const response = await api.get<VeiculoResponse>(`${this.BASE_URL}/${id}`);

      // console.log('✅ [VEÍCULOS SERVICE] Veículo carregado:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao carregar veículo:', error);
      throw this.handleError(error, 'Erro ao carregar veículo');
    }
  }

  // POST /veiculos - Create new vehicle
  static async createVeiculo(data: CreateVeiculoRequest): Promise<VeiculoResponse> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Criando veículo:', data);

      const response = await api.post<VeiculoResponse>(this.BASE_URL, data);

      // console.log('✅ [VEÍCULOS SERVICE] Veículo criado:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao criar veículo:', error);
      throw this.handleError(error, 'Erro ao criar veículo');
    }
  }

  // PUT /veiculos/:id - Update vehicle
  static async updateVeiculo(id: number, data: UpdateVeiculoRequest): Promise<VeiculoResponse> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Atualizando veículo:', id, data);

      const response = await api.put<VeiculoResponse>(`${this.BASE_URL}/${id}`, data);

      // console.log('✅ [VEÍCULOS SERVICE] Veículo atualizado:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao atualizar veículo:', error);
      throw this.handleError(error, 'Erro ao atualizar veículo');
    }
  }

  // PUT /veiculos/:id/status - Update vehicle status
  static async updateVeiculoStatus(id: number, status: StatusVeiculo): Promise<VeiculoResponse> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Atualizando status do veículo:', id, status);

      const response = await api.put<VeiculoResponse>(`${this.BASE_URL}/${id}/status`, { status });

      // console.log('✅ [VEÍCULOS SERVICE] Status do veículo atualizado:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao atualizar status:', error);
      throw this.handleError(error, 'Erro ao atualizar status do veículo');
    }
  }

  // PUT /veiculos/:id/quilometragem - Update vehicle mileage
  static async updateQuilometragem(id: number, kmAtual: number): Promise<VeiculoResponse> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Atualizando quilometragem:', id, kmAtual);

      const response = await api.put<VeiculoResponse>(`${this.BASE_URL}/${id}/quilometragem`, { kmAtual });

      // console.log('✅ [VEÍCULOS SERVICE] Quilometragem atualizada:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao atualizar quilometragem:', error);
      throw this.handleError(error, 'Erro ao atualizar quilometragem');
    }
  }

  // DELETE /veiculos/:id - Delete vehicle (soft delete)
  static async deleteVeiculo(id: number): Promise<void> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Excluindo veículo:', id);

      await api.delete(`${this.BASE_URL}/${id}`);

      // console.log('✅ [VEÍCULOS SERVICE] Veículo excluído');
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao excluir veículo:', error);
      throw this.handleError(error, 'Erro ao excluir veículo');
    }
  }

  // ============================================================================
  // MAINTENANCE ENDPOINTS
  // ============================================================================

  // GET /veiculos/:id/manutencoes - Get vehicle maintenance history
  static async getManutencoesByVeiculo(id: number): Promise<ManutencaoVeiculo[]> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Buscando manutenções do veículo:', id);

      const response = await api.get<ManutencaoVeiculo[]>(`${this.BASE_URL}/${id}/manutencoes`);

      // console.log('✅ [VEÍCULOS SERVICE] Manutenções carregadas:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao carregar manutenções:', error);
      throw this.handleError(error, 'Erro ao carregar manutenções');
    }
  }

  // POST /veiculos/:id/manutencoes - Create maintenance record
  static async createManutencao(veiculoId: number, data: CreateManutencaoRequest): Promise<ManutencaoVeiculo> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Criando manutenção:', veiculoId, data);

      const response = await api.post<ManutencaoVeiculo>(`${this.BASE_URL}/${veiculoId}/manutencoes`, data);

      // console.log('✅ [VEÍCULOS SERVICE] Manutenção criada:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao criar manutenção:', error);
      throw this.handleError(error, 'Erro ao criar manutenção');
    }
  }

  // PUT /veiculos/:id/manutencoes/:manutencaoId - Update maintenance record
  static async updateManutencao(veiculoId: number, manutencaoId: string, data: Partial<CreateManutencaoRequest>): Promise<ManutencaoVeiculo> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Atualizando manutenção:', veiculoId, manutencaoId, data);

      const response = await api.put<ManutencaoVeiculo>(`${this.BASE_URL}/${veiculoId}/manutencoes/${manutencaoId}`, data);

      // console.log('✅ [VEÍCULOS SERVICE] Manutenção atualizada:', response.data);
      return response.data;
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao atualizar manutenção:', error);
      throw this.handleError(error, 'Erro ao atualizar manutenção');
    }
  }

  // DELETE /veiculos/:id/manutencoes/:manutencaoId - Delete maintenance record
  static async deleteManutencao(veiculoId: number, manutencaoId: string): Promise<void> {
    try {
      // console.log('📡 [VEÍCULOS SERVICE] Excluindo manutenção:', veiculoId, manutencaoId);

      await api.delete(`${this.BASE_URL}/${veiculoId}/manutencoes/${manutencaoId}`);

      // console.log('✅ [VEÍCULOS SERVICE] Manutenção excluída');
    } catch (error) {
      // console.error('❌ [VEÍCULOS SERVICE] Erro ao excluir manutenção:', error);
      throw this.handleError(error, 'Erro ao excluir manutenção');
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

export const veiculosUtils = {
  // Format status for display
  formatStatus: (status: StatusVeiculo): string => {
    const statusMap = {
      disponivel: 'Disponível',
      em_uso: 'Em Uso',
      manutencao: 'Manutenção',
      inativo: 'Inativo'
    };
    return statusMap[status] || status;
  },

  // Format tipo combustivel for display
  formatTipoCombustivel: (tipo: TipoCombustivel): string => {
    const tipoMap = {
      gasolina: 'Gasolina',
      etanol: 'Etanol',
      diesel: 'Diesel',
      gnv: 'GNV',
      eletrico: 'Elétrico',
      hibrido: 'Híbrido',
      flex: 'Flex'
    };
    return tipoMap[tipo] || tipo;
  },

  // Format tipo veiculo for display
  formatTipoVeiculo: (tipo?: TipoVeiculo): string => {
    if (!tipo) return 'N/A';

    const tipoMap = {
      carro: 'Carro',
      van: 'Van',
      caminhonete: 'Caminhonete',
      caminhao: 'Caminhão',
      onibus: 'Ônibus',
      moto: 'Moto'
    };
    return tipoMap[tipo] || tipo;
  },

  // Check if vehicle is available
  isVeiculoDisponivel: (veiculo: VeiculoResponse): boolean => {
    return veiculo.status === 'disponivel';
  },

  // Check if vehicle needs maintenance
  needsMaintenanceCheck: (veiculo: VeiculoResponse): boolean => {
    if (veiculo.proximaRevisao) {
      const proximaRevisao = new Date(veiculo.proximaRevisao);
      const hoje = new Date();
      const diasParaRevisao = Math.ceil((proximaRevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diasParaRevisao <= 30;
    }
    return false;
  },

  // Check if insurance is expiring
  isInsuranceExpiring: (veiculo: VeiculoResponse): boolean => {
    if (veiculo.vencimentoSeguro) {
      const vencimento = new Date(veiculo.vencimentoSeguro);
      const hoje = new Date();
      const diasParaVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diasParaVencimento <= 30;
    }
    return false;
  },

  // Format placa for display (add hyphen if needed)
  formatPlaca: (placa: string): string => {
    if (!placa) return '';

    // Remove existing formatting
    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Format as ABC-1234 or ABC1D23 (Mercosul)
    if (cleanPlaca.length === 7) {
      if (/^[A-Z]{3}[0-9]{4}$/.test(cleanPlaca)) {
        // Formato antigo: ABC1234 -> ABC-1234
        return `${cleanPlaca.slice(0, 3)}-${cleanPlaca.slice(3)}`;
      } else if (/^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/.test(cleanPlaca)) {
        // Formato Mercosul: ABC1D23 -> ABC1D23
        return cleanPlaca;
      }
    }

    return placa;
  },

  // Format vehicle name for display
  formatVeiculoName: (veiculo: VeiculoResponse): string => {
    return `${veiculo.nome} (${veiculosUtils.formatPlaca(veiculo.placa)})`;
  },

  // Format vehicle details for display
  formatVeiculoDetails: (veiculo: VeiculoResponse): string => {
    const ano = veiculo.ano;
    const marca = veiculo.marca;
    const modelo = veiculo.modelo;
    return `${marca} ${modelo} ${ano}`;
  },

  // Calculate vehicle age
  calculateAge: (ano: number): number => {
    return new Date().getFullYear() - ano;
  },

  // Format mileage for display
  formatKm: (km?: number): string => {
    if (!km) return '0 km';
    return `${km.toLocaleString('pt-BR')} km`;
  },

  // Format currency for display
  formatCurrency: (value?: number): string => {
    if (!value) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
};