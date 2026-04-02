// src/services/instrucoes.services.ts
import { api } from '@/config/api';

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type StatusInstrucao = 'ATIVA' | 'INATIVA' | 'EM_REVISAO' | 'ARQUIVADA';
export type CategoriaTarefa = 'MECANICA' | 'ELETRICA' | 'INSTRUMENTACAO' | 'LUBRIFICACAO' | 'LIMPEZA' | 'INSPECAO' | 'CALIBRACAO' | 'OUTROS';
export type TipoManutencao = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type CondicaoAtivo = 'PARADO' | 'FUNCIONANDO' | 'QUALQUER';
export type FrequenciaTarefa = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'PERSONALIZADA';
export type TipoAnexo = 'MANUAL' | 'PROCEDIMENTO' | 'MODELO_RELATORIO' | 'OUTROS';

// ============================================================================
// TIPOS DA API PARA INSTRUCOES
// ============================================================================

export interface CreateSubInstrucaoApiData {
  descricao: string;
  obrigatoria?: boolean;
  tempo_estimado?: number;
  ordem?: number;
}

export interface CreateRecursoInstrucaoApiData {
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio?: boolean;
}

export interface CreateInstrucaoApiData {
  tag?: string;
  nome: string;
  descricao: string;
  categoria: CategoriaTarefa;
  tipo_manutencao: TipoManutencao;
  condicao_ativo: CondicaoAtivo;
  criticidade: number;
  duracao_estimada: number;
  tempo_estimado: number;
  observacoes?: string;
  status?: StatusInstrucao;
  ativo?: boolean;
  criado_por?: string;
  sub_instrucoes?: CreateSubInstrucaoApiData[];
  recursos?: CreateRecursoInstrucaoApiData[];
}

export interface UpdateInstrucaoApiData extends Partial<CreateInstrucaoApiData> {
  atualizado_por?: string;
}

export interface UpdateStatusInstrucaoApiData {
  status: StatusInstrucao;
  ativo?: boolean;
  atualizado_por?: string;
}

export interface AdicionarAoPlanoApiData {
  plano_manutencao_id: string;
  frequencia: FrequenciaTarefa;
  frequencia_personalizada?: number;
  ordem: number;
  criado_por?: string;
}

export interface AssociarAnomaliaApiData {
  anomalia_id: string;
  observacoes?: string;
}

export interface AssociarSolicitacaoApiData {
  solicitacao_id: string;
  observacoes?: string;
}

// DTOs de resposta

export interface UsuarioResumoDto {
  id: string;
  nome: string;
  email?: string;
}

export interface SubInstrucaoApiResponse {
  id: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
  ordem?: number;
  created_at: Date;
  updated_at: Date;
}

export interface RecursoInstrucaoApiResponse {
  id: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AnexoInstrucaoApiResponse {
  id: string;
  nome: string;
  tipo: TipoAnexo;
  url: string;
  tamanho?: number;
  content_type?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InstrucaoApiResponse {
  id: string;
  tag: string;
  nome: string;
  descricao: string;
  categoria: CategoriaTarefa;
  tipo_manutencao: TipoManutencao;
  condicao_ativo: CondicaoAtivo;
  criticidade: number;
  duracao_estimada: number;
  tempo_estimado: number;
  observacoes?: string;
  status: StatusInstrucao;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  criado_por?: string;
  atualizado_por?: string;

  // Relacionamentos
  usuario_criador?: UsuarioResumoDto;
  usuario_atualizador?: UsuarioResumoDto;

  // Sub-estruturas
  sub_instrucoes?: SubInstrucaoApiResponse[];
  recursos?: RecursoInstrucaoApiResponse[];
  anexos?: AnexoInstrucaoApiResponse[];

  // Contadores
  total_sub_instrucoes?: number;
  total_recursos?: number;
  total_anexos?: number;
  total_tarefas_derivadas?: number;
}

export interface DashboardInstrucoesDto {
  total_instrucoes: number;
  instrucoes_ativas: number;
  instrucoes_inativas: number;
  instrucoes_em_revisao: number;
  instrucoes_arquivadas: number;

  criticidade_muito_alta: number;
  criticidade_alta: number;
  criticidade_media: number;
  criticidade_baixa: number;
  criticidade_muito_baixa: number;

  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };

  distribuicao_categorias: {
    mecanica: number;
    eletrica: number;
    instrumentacao: number;
    lubrificacao: number;
    limpeza: number;
    inspecao: number;
    calibracao: number;
    outros: number;
  };

  tempo_total_estimado: number;
  media_tempo_por_instrucao: number;
  media_criticidade: number;
  total_sub_instrucoes: number;
  total_recursos: number;
  total_tarefas_derivadas: number;
}

export interface QueryInstrucoesApiParams {
  search?: string;
  status?: StatusInstrucao;
  ativo?: boolean;
  categoria?: CategoriaTarefa;
  tipo_manutencao?: TipoManutencao;
  criticidade?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface InstrucoesListApiResponse {
  data: InstrucaoApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnomaliaAssociadaResponse {
  id: string;
  anomalia_id: string;
  instrucao_id: string;
  observacoes?: string;
  created_at: Date;
  anomalia: {
    id: string;
    descricao: string;
    status: string;
    prioridade: string;
  };
}

export interface SolicitacaoAssociadaResponse {
  id: string;
  solicitacao_id: string;
  instrucao_id: string;
  observacoes?: string;
  created_at: Date;
  solicitacao: {
    id: string;
    titulo: string;
    status: string;
    prioridade: string;
  };
}

// ============================================================================
// SERVICO DE API PARA INSTRUCOES
// ============================================================================

export class InstrucoesApiService {
  private readonly baseEndpoint = '/instrucoes';

  // CRUD

  async create(data: CreateInstrucaoApiData): Promise<InstrucaoApiResponse> {
    try {
      const response = await api.post<InstrucaoApiResponse>(this.baseEndpoint, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async findAll(params?: QueryInstrucoesApiParams): Promise<InstrucoesListApiResponse> {
    try {
      const cleanParams: any = {
        page: params?.page || 1,
        limit: params?.limit || 10
      };

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (key === 'page' || key === 'limit') return;
          if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
              if (value === true) cleanParams[key] = value;
            } else if (value !== '') {
              cleanParams[key] = value;
            }
          }
        });
      }

      const response = await api.get<InstrucoesListApiResponse>(this.baseEndpoint, {
        params: cleanParams
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async findOne(id: string): Promise<InstrucaoApiResponse> {
    try {
      const response = await api.get<InstrucaoApiResponse>(`${this.baseEndpoint}/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async update(id: string, data: UpdateInstrucaoApiData): Promise<InstrucaoApiResponse> {
    try {
      const response = await api.put<InstrucaoApiResponse>(`${this.baseEndpoint}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/${id}`);
    } catch (error: any) {
      throw error;
    }
  }

  // Operacoes especificas

  async updateStatus(id: string, data: UpdateStatusInstrucaoApiData): Promise<InstrucaoApiResponse> {
    try {
      const response = await api.put<InstrucaoApiResponse>(`${this.baseEndpoint}/${id}/status`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async getDashboard(): Promise<DashboardInstrucoesDto> {
    try {
      const response = await api.get<DashboardInstrucoesDto>(`${this.baseEndpoint}/dashboard`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async adicionarAoPlano(id: string, data: AdicionarAoPlanoApiData): Promise<any> {
    try {
      const response = await api.post(`${this.baseEndpoint}/${id}/adicionar-ao-plano`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async listarTarefasDerivadas(id: string): Promise<any[]> {
    try {
      const response = await api.get(`${this.baseEndpoint}/${id}/tarefas`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Anomalias

  async associarAnomalia(id: string, data: AssociarAnomaliaApiData): Promise<any> {
    try {
      const response = await api.post(`${this.baseEndpoint}/${id}/anomalias`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async listarAnomalias(id: string): Promise<AnomaliaAssociadaResponse[]> {
    try {
      const response = await api.get<AnomaliaAssociadaResponse[]>(`${this.baseEndpoint}/${id}/anomalias`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async desassociarAnomalia(id: string, anomaliaId: string): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/${id}/anomalias/${anomaliaId}`);
    } catch (error: any) {
      throw error;
    }
  }

  // Solicitacoes

  async associarSolicitacao(id: string, data: AssociarSolicitacaoApiData): Promise<any> {
    try {
      const response = await api.post(`${this.baseEndpoint}/${id}/solicitacoes`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async listarSolicitacoes(id: string): Promise<SolicitacaoAssociadaResponse[]> {
    try {
      const response = await api.get<SolicitacaoAssociadaResponse[]>(`${this.baseEndpoint}/${id}/solicitacoes`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async desassociarSolicitacao(id: string, solicitacaoId: string): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/${id}/solicitacoes/${solicitacaoId}`);
    } catch (error: any) {
      throw error;
    }
  }

  // Anexos

  async getAnexos(instrucaoId: string): Promise<AnexoInstrucaoApiResponse[]> {
    try {
      const response = await api.get<AnexoInstrucaoApiResponse[]>(
        `${this.baseEndpoint}/${instrucaoId}/anexos`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async uploadAnexo(
    instrucaoId: string,
    file: File,
    descricao?: string,
    usuarioId?: string
  ): Promise<AnexoInstrucaoApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (descricao) formData.append('descricao', descricao);
      if (usuarioId) formData.append('usuario_id', usuarioId);

      const response = await api.post<AnexoInstrucaoApiResponse>(
        `${this.baseEndpoint}/${instrucaoId}/anexos/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async downloadAnexo(instrucaoId: string, anexoId: string): Promise<Blob> {
    try {
      const response = await api.get(
        `${this.baseEndpoint}/${instrucaoId}/anexos/${anexoId}/download`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async deleteAnexo(instrucaoId: string, anexoId: string): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/${instrucaoId}/anexos/${anexoId}`);
    } catch (error: any) {
      throw error;
    }
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

export const instrucoesApi = new InstrucoesApiService();
