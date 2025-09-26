// src/services/agenda.services.ts
import { api } from '@/config/api';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type TipoFeriado = 'NACIONAL' | 'ESTADUAL' | 'MUNICIPAL' | 'PERSONALIZADO';

export interface PlantaResumo {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
}

// Feriados
export interface FeriadoResponse {
  id: string;
  nome: string;
  data: string; // ISO date string
  tipo: TipoFeriado;
  geral: boolean;
  recorrente: boolean;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  plantas?: PlantaResumo[];
  total_plantas?: number;
}

export interface CreateFeriadoData {
  nome: string;
  data: string; // YYYY-MM-DD
  tipo: TipoFeriado;
  geral?: boolean;
  recorrente?: boolean;
  descricao?: string;
  plantaIds?: string[];
}

export interface UpdateFeriadoData extends Partial<CreateFeriadoData> {}

export interface QueryFeriadosParams {
  page?: number;
  limit?: number;
  search?: string;
  tipo?: TipoFeriado;
  plantaId?: string;
  ano?: number;
  mes?: number; // 1-12
  geral?: boolean;
  recorrente?: boolean;
  orderBy?: 'nome' | 'data' | 'tipo' | 'created_at';
  orderDirection?: 'asc' | 'desc';
}

export interface FeriadosListResponse {
  data: FeriadoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Configurações de Dias Úteis
export interface ConfiguracaoDiasUteisResponse {
  id: string;
  nome: string;
  descricao?: string;
  segunda: boolean;
  terca: boolean;
  quarta: boolean;
  quinta: boolean;
  sexta: boolean;
  sabado: boolean;
  domingo: boolean;
  geral: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  plantas?: PlantaResumo[];
  total_plantas?: number;
  total_dias_uteis: number;
  dias_uteis_semana: string[];
}

export interface CreateConfiguracaoDiasUteisData {
  nome: string;
  descricao?: string;
  segunda?: boolean;
  terca?: boolean;
  quarta?: boolean;
  quinta?: boolean;
  sexta?: boolean;
  sabado?: boolean;
  domingo?: boolean;
  geral?: boolean;
  plantaIds?: string[];
}

export interface UpdateConfiguracaoDiasUteisData extends Partial<CreateConfiguracaoDiasUteisData> {}

export interface QueryConfiguracoesDiasUteisParams {
  page?: number;
  limit?: number;
  search?: string;
  plantaId?: string;
  geral?: boolean;
  sabado?: boolean;
  domingo?: boolean;
  orderBy?: 'nome' | 'created_at' | 'total_dias_uteis';
  orderDirection?: 'asc' | 'desc';
}

export interface ConfiguracoesDiasUteisListResponse {
  data: ConfiguracaoDiasUteisResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Utilitários
export interface VerificacaoDiaUtilResponse {
  data: string;
  ehDiaUtil: boolean;
  ehFeriado: boolean;
  nomeFeriado?: string;
  diaSemana: string;
  configuracao: {
    id: string;
    nome: string;
  };
}

export interface ProximosDiasUteisResponse {
  diasUteis: string[];
  diasEncontrados: number;
  dataInicio: string;
  configuracaoUsada: {
    id: string;
    nome: string;
  };
}

export interface CalendarioMesResponse {
  data: string;
  ehDiaUtil: boolean;
  ehFeriado: boolean;
  nomeFeriado?: string;
  diaSemana: string;
  configuracao: {
    id: string;
    nome: string;
  };
}

// ============================================================================
// SERVIÇOS DA API
// ============================================================================

class AgendaService {
  private baseUrl = '/agenda';

  // ============================================================================
  // FERIADOS
  // ============================================================================

  async getFeriados(params?: QueryFeriadosParams): Promise<FeriadosListResponse> {
    const query = new URLSearchParams();

    if (params) {
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.search) query.append('search', params.search);
      if (params.tipo) query.append('tipo', params.tipo);
      if (params.plantaId) query.append('plantaId', params.plantaId);
      if (params.ano) query.append('ano', params.ano.toString());
      if (params.mes) query.append('mes', params.mes.toString());
      if (params.geral !== undefined) query.append('geral', params.geral.toString());
      if (params.recorrente !== undefined) query.append('recorrente', params.recorrente.toString());
      if (params.orderBy) query.append('orderBy', params.orderBy);
      if (params.orderDirection) query.append('orderDirection', params.orderDirection);
    }

    const response = await api.get(`${this.baseUrl}/feriados?${query.toString()}`);
    return response.data;
  }

  async getFeriadoById(id: string): Promise<FeriadoResponse> {
    const response = await api.get(`${this.baseUrl}/feriados/${id}`);
    return response.data;
  }

  async createFeriado(data: CreateFeriadoData): Promise<FeriadoResponse> {
    const response = await api.post(`${this.baseUrl}/feriados`, data);
    return response.data;
  }

  async updateFeriado(id: string, data: UpdateFeriadoData): Promise<FeriadoResponse> {
    const response = await api.put(`${this.baseUrl}/feriados/${id}`, data);
    return response.data;
  }

  async deleteFeriado(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/feriados/${id}`);
  }

  async associarPlantasFeriado(id: string, plantaIds: string[]): Promise<FeriadoResponse> {
    const response = await api.post(`${this.baseUrl}/feriados/${id}/plantas`, { plantaIds });
    return response.data;
  }

  async desassociarPlantaFeriado(feriadoId: string, plantaId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/feriados/${feriadoId}/plantas/${plantaId}`);
  }

  // ============================================================================
  // CONFIGURAÇÕES DE DIAS ÚTEIS
  // ============================================================================

  async getConfiguracoesDiasUteis(params?: QueryConfiguracoesDiasUteisParams): Promise<ConfiguracoesDiasUteisListResponse> {
    const query = new URLSearchParams();

    if (params) {
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.search) query.append('search', params.search);
      if (params.plantaId) query.append('plantaId', params.plantaId);
      if (params.geral !== undefined) query.append('geral', params.geral.toString());
      if (params.sabado !== undefined) query.append('sabado', params.sabado.toString());
      if (params.domingo !== undefined) query.append('domingo', params.domingo.toString());
      if (params.orderBy) query.append('orderBy', params.orderBy);
      if (params.orderDirection) query.append('orderDirection', params.orderDirection);
    }

    const response = await api.get(`${this.baseUrl}/configuracoes-dias-uteis?${query.toString()}`);
    return response.data;
  }

  async getConfiguracaoDiasUteisById(id: string): Promise<ConfiguracaoDiasUteisResponse> {
    const response = await api.get(`${this.baseUrl}/configuracoes-dias-uteis/${id}`);
    return response.data;
  }

  async createConfiguracaoDiasUteis(data: CreateConfiguracaoDiasUteisData): Promise<ConfiguracaoDiasUteisResponse> {
    const response = await api.post(`${this.baseUrl}/configuracoes-dias-uteis`, data);
    return response.data;
  }

  async updateConfiguracaoDiasUteis(id: string, data: UpdateConfiguracaoDiasUteisData): Promise<ConfiguracaoDiasUteisResponse> {
    const response = await api.put(`${this.baseUrl}/configuracoes-dias-uteis/${id}`, data);
    return response.data;
  }

  async deleteConfiguracaoDiasUteis(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/configuracoes-dias-uteis/${id}`);
  }

  async associarPlantasConfiguracao(id: string, plantaIds: string[]): Promise<ConfiguracaoDiasUteisResponse> {
    const response = await api.post(`${this.baseUrl}/configuracoes-dias-uteis/${id}/plantas`, { plantaIds });
    return response.data;
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  async verificarDiaUtil(data: string, plantaId?: string): Promise<VerificacaoDiaUtilResponse> {
    const query = new URLSearchParams();
    query.append('data', data);
    if (plantaId) query.append('plantaId', plantaId);

    const response = await api.get(`${this.baseUrl}/verificar-dia-util?${query.toString()}`);
    return response.data;
  }

  async getProximosDiasUteis(quantidade: number, dataInicio?: string, plantaId?: string): Promise<ProximosDiasUteisResponse> {
    const query = new URLSearchParams();
    query.append('quantidade', quantidade.toString());
    if (dataInicio) query.append('dataInicio', dataInicio);
    if (plantaId) query.append('plantaId', plantaId);

    const response = await api.get(`${this.baseUrl}/proximos-dias-uteis?${query.toString()}`);
    return response.data;
  }

  async getCalendarioMes(ano: number, mes: number, plantaId?: string): Promise<CalendarioMesResponse[]> {
    const query = plantaId ? `?plantaId=${plantaId}` : '';
    const response = await api.get(`${this.baseUrl}/calendario/${ano}/${mes}${query}`);
    return response.data;
  }
}

export const agendaService = new AgendaService();