// src/services/planos-manutencao.services.ts
import { api } from '@/config/api';

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type StatusPlano = 'ATIVO' | 'INATIVO' | 'EM_REVISAO' | 'ARQUIVADO';

// ============================================================================
// TIPOS DA API PARA PLANOS DE MANUTENÇÃO
// ============================================================================

export interface CreatePlanoManutencaoApiData {
  equipamento_id: string;           // Obrigatório - ID do equipamento
  nome: string;                     // Obrigatório - Nome do plano (máx 200 chars)
  descricao?: string;               // Opcional - Descrição do plano
  versao?: string;                  // Opcional - Versão (máx 20 chars, padrão: "1.0")
  status?: StatusPlano;             // Opcional - Status do plano (padrão: ATIVO)
  ativo?: boolean;                  // Opcional - Flag ativo (padrão: true)
  data_vigencia_inicio?: string;    // Opcional - Data de início (ISO string)
  data_vigencia_fim?: string;       // Opcional - Data de fim (ISO string)
  observacoes?: string;             // Opcional - Observações
  criado_por?: string;              // Opcional - ID do usuário criador
}

export interface UpdatePlanoManutencaoApiData extends Partial<CreatePlanoManutencaoApiData> {}

export interface UpdateStatusPlanoApiData {
  status: StatusPlano;
  // NOTA: Campo 'ativo' removido pois a API não aceita mais este campo
  // O status do campo 'ativo' é inferido automaticamente pelo backend baseado no 'status'
  atualizado_por?: string;
}

export interface DuplicarPlanoApiData {
  equipamento_destino_id: string;   // Obrigatório - ID do equipamento destino
  novo_nome?: string;               // Opcional - Novo nome do plano (máx 200 chars)
  novo_prefixo_tag?: string;        // Opcional - Novo prefixo de tag para tarefas
  criado_por?: string;              // Opcional - ID do usuário criador
}

export interface ClonarPlanoLoteDto {
  equipamentos_destino_ids: string[];  // Array de IDs de equipamentos destino
  novo_prefixo_tag?: string;           // Opcional - Prefixo para TAGs únicas
  manter_nome_original?: boolean;      // Se true, mantém nome; se false, adiciona sufixo
  criado_por?: string;                 // Opcional - ID do usuário criador
}

export interface DetalheClonagem {
  equipamento_id: string;
  equipamento_nome: string;
  sucesso: boolean;
  plano_id?: string;
  plano_nome?: string;
  total_tarefas?: number;
  erro?: string;
}

export interface ClonarPlanoLoteResponseDto {
  planos_criados: number;
  planos_com_erro: number;
  detalhes: DetalheClonagem[];
}

// DTOs de resposta
export interface EquipamentoResumoDto {
  id: string;
  nome: string;
  fabricante?: string;
  modelo?: string;
  criticidade?: string;
  planta?: {
    id: string;
    nome: string;
  };
  unidade?: {
    id: string;
    nome: string;
    planta?: {
      id: string;
      nome: string;
    };
  };
}

export interface UsuarioResumoDto {
  id: string;
  nome: string;
  email?: string;
}

export interface TarefaResumoDto {
  id: string;
  tag: string;
  nome: string;
  categoria: string;
  tipo_manutencao: string;
  status: string;
  ativo: boolean;
  ordem: number;
  criticidade: number;
  tempo_estimado: number;
}

export interface PlanoManutencaoApiResponse {
  id: string;
  equipamento_id: string;
  nome: string;
  descricao?: string;
  versao: string;
  status: StatusPlano;
  ativo: boolean;
  data_vigencia_inicio?: Date;
  data_vigencia_fim?: Date;
  observacoes?: string;
  criado_por?: string;
  atualizado_por?: string;
  created_at: Date;
  updated_at: Date;
  
  // Relacionamentos
  equipamento?: EquipamentoResumoDto;
  usuario_criador?: UsuarioResumoDto;
  usuario_atualizador?: UsuarioResumoDto;
  
  // Tarefas (opcional baseado na consulta)
  tarefas?: TarefaResumoDto[];
  
  // Estatísticas calculadas
  total_tarefas?: number;
  tarefas_ativas?: number;
  tempo_total_estimado?: number;
  criticidade_media?: number;
}

export interface PlanoResumoDto {
  id: string;
  nome: string;
  versao: string;
  status: StatusPlano;
  ativo: boolean;
  total_tarefas: number;
  tarefas_ativas: number;
  tarefas_inativas: number;
  tempo_total_estimado: number;
  criticidade_media: number;
  
  // Distribuição por tipo
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };
  
  // Distribuição por categoria
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
}

export interface DashboardPlanosDto {
  total_planos: number;
  planos_ativos: number;
  planos_inativos: number;
  planos_em_revisao: number;
  planos_arquivados: number;
  equipamentos_com_plano: number;
  
  // Estatísticas gerais
  total_tarefas_todos_planos: number;
  media_tarefas_por_plano: number;
  tempo_total_estimado_geral: number;
  
  // Distribuição por tipo de manutenção
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };
}

// Parâmetros de consulta
export interface QueryPlanosApiParams {
  search?: string;                  // Busca em nome, descrição, nome do equipamento
  equipamento_id?: string;          // Filtrar por ID do equipamento
  status?: StatusPlano;             // Filtrar por status
  ativo?: boolean;                  // Filtrar por flag ativo
  criado_por?: string;              // Filtrar por usuário criador
  data_vigencia_inicio?: string;    // Filtrar por data de vigência início
  data_vigencia_fim?: string;       // Filtrar por data de vigência fim
  page?: number;                    // Página (padrão: 1)
  limit?: number;                   // Itens por página (1-100, padrão: 10)
  sort_by?: string;                 // Campo de ordenação (padrão: 'created_at')
  sort_order?: 'asc' | 'desc';      // Direção da ordenação (padrão: 'desc')
  incluir_tarefas?: boolean;        // Incluir tarefas na resposta
}

// Parâmetros específicos para busca por planta
export interface QueryPlanosPorPlantaParams {
  incluir_tarefas?: boolean;        // Incluir tarefas na resposta (padrão: false)
  status?: StatusPlano;             // Filtrar por status (padrão: ATIVO)
  page?: number;                    // Página (padrão: 1)
  limit?: number;                   // Itens por página (1-100, padrão: 10)
}

export interface PlanosListApiResponse {
  data: PlanoManutencaoApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// SERVIÇO DE API PARA PLANOS DE MANUTENÇÃO
// ============================================================================

export class PlanosManutencaoApiService {
  private readonly baseEndpoint = '/planos-manutencao';

  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  async create(data: CreatePlanoManutencaoApiData): Promise<PlanoManutencaoApiResponse> {
    // console.log('🚀 PLANOS API: Criando plano de manutenção:', data);
    
    try {
      const response = await api.post<PlanoManutencaoApiResponse>(this.baseEndpoint, data);
      // console.log('✅ PLANOS API: Plano criado com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao criar plano:', error);
      // console.error('💥 PLANOS API: Detalhes do erro:', error.response?.data);
      throw error;
    }
  }

  async findAll(params?: QueryPlanosApiParams): Promise<PlanosListApiResponse> {
    // console.log('🔍 PLANOS API: Listando planos com parâmetros:', params);
    
    try {
      const response = await api.get<PlanosListApiResponse>(this.baseEndpoint, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params
        }
      });
      // console.log('✅ PLANOS API: Planos listados:', response.data.pagination);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao listar planos:', error);
      throw error;
    }
  }

  async findOne(id: string, incluirTarefas?: boolean): Promise<PlanoManutencaoApiResponse> {
    // console.log('🔍 PLANOS API: Buscando plano por ID:', id);
    
    try {
      const response = await api.get<PlanoManutencaoApiResponse>(`${this.baseEndpoint}/${id}`, {
        params: { incluirTarefas }
      });
      // console.log('✅ PLANOS API: Plano encontrado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao buscar plano:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdatePlanoManutencaoApiData): Promise<PlanoManutencaoApiResponse> {
    // console.log('🔄 PLANOS API: Atualizando plano:', id, data);
    
    try {
      const response = await api.put<PlanoManutencaoApiResponse>(`${this.baseEndpoint}/${id}`, data);
      // console.log('✅ PLANOS API: Plano atualizado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao atualizar plano:', error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // console.log('🗑️ PLANOS API: Excluindo plano:', id);
    
    try {
      await api.delete(`${this.baseEndpoint}/${id}`);
      // console.log('✅ PLANOS API: Plano excluído com sucesso');
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao excluir plano:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  async getDashboard(): Promise<DashboardPlanosDto> {
    // console.log('📊 PLANOS API: Obtendo dashboard');
    
    try {
      const response = await api.get<DashboardPlanosDto>(`${this.baseEndpoint}/dashboard`);
      // console.log('✅ PLANOS API: Dashboard obtido:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao obter dashboard:', error);
      throw error;
    }
  }

  async findByEquipamento(equipamentoId: string): Promise<PlanoManutencaoApiResponse> {
    // console.log('🔍 PLANOS API: Buscando plano por equipamento:', equipamentoId);

    try {
      const response = await api.get<PlanoManutencaoApiResponse>(
        `${this.baseEndpoint}/por-equipamento/${equipamentoId}`
      );
      // console.log('✅ PLANOS API: Plano do equipamento encontrado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao buscar plano do equipamento:', error);
      throw error;
    }
  }

  async findByPlanta(plantaId: string, params?: QueryPlanosPorPlantaParams): Promise<PlanosListApiResponse> {
    console.log('🚀 SERVIÇO API: INÍCIO findByPlanta');
    console.log('📋 SERVIÇO API: Parâmetros:', { plantaId, params });

    const finalParams = {
      incluir_tarefas: params?.incluir_tarefas || false,
      status: params?.status || 'ATIVO',
      page: params?.page || 1,
      limit: params?.limit || 10
    };

    const url = `${this.baseEndpoint}/por-planta/${plantaId}`;

    console.log('📡 SERVIÇO API: Fazendo requisição:', {
      url: url,
      params: finalParams,
      fullUrl: `/api${url}?${new URLSearchParams(finalParams).toString()}`
    });

    try {
      const response = await api.get<PlanosListApiResponse>(url, {
        params: finalParams
      });

      console.log('✅ SERVIÇO API: Resposta HTTP recebida:', {
        status: response.status,
        headers: response.headers,
        dataLength: response.data?.data?.length || 0,
        pagination: response.data?.pagination
      });

      console.log('🎯 SERVIÇO API: Dados completos da resposta:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('❌ SERVIÇO API: Erro na requisição:', {
        error,
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        url: url,
        params: finalParams
      });

      throw error;
    }
  }

  async findByUnidade(unidadeId: string, params?: QueryPlanosPorPlantaParams): Promise<PlanosListApiResponse> {
    // console.log('🔍 PLANOS API: Buscando planos por unidade:', unidadeId);

    const finalParams = {
      incluir_tarefas: params?.incluir_tarefas || false,
      status: params?.status || 'ATIVO',
      page: params?.page || 1,
      limit: params?.limit || 10
    };

    try {
      const response = await api.get<PlanosListApiResponse>(
        `${this.baseEndpoint}/por-unidade/${unidadeId}`,
        { params: finalParams }
      );
      // console.log('✅ PLANOS API: Planos da unidade encontrados:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao buscar planos da unidade:', error);
      throw error;
    }
  }

  async getResumo(id: string): Promise<PlanoResumoDto> {
    // console.log('📋 PLANOS API: Obtendo resumo do plano:', id);
    
    try {
      const response = await api.get<PlanoResumoDto>(`${this.baseEndpoint}/${id}/resumo`);
      // console.log('✅ PLANOS API: Resumo obtido:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao obter resumo:', error);
      throw error;
    }
  }

  async updateStatus(id: string, data: UpdateStatusPlanoApiData): Promise<PlanoManutencaoApiResponse> {
    // console.log('🔄 PLANOS API: Atualizando status do plano:', id, data);
    
    try {
      const response = await api.put<PlanoManutencaoApiResponse>(
        `${this.baseEndpoint}/${id}/status`, 
        data
      );
      // console.log('✅ PLANOS API: Status atualizado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao atualizar status:', error);
      throw error;
    }
  }

  async duplicar(id: string, data: DuplicarPlanoApiData): Promise<PlanoManutencaoApiResponse> {
    // console.log('📋 PLANOS API: Duplicando plano:', id, data);

    try {
      const response = await api.post<PlanoManutencaoApiResponse>(
        `${this.baseEndpoint}/${id}/duplicar`,
        data
      );
      // console.log('✅ PLANOS API: Plano duplicado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 PLANOS API: Erro ao duplicar plano:', error);
      throw error;
    }
  }

  async clonarLote(id: string, data: ClonarPlanoLoteDto): Promise<ClonarPlanoLoteResponseDto> {
    console.log('📋 PLANOS API: Clonando plano em lote:', id, data);

    try {
      const response = await api.post<ClonarPlanoLoteResponseDto>(
        `${this.baseEndpoint}/${id}/clonar-lote`,
        data
      );
      console.log('✅ PLANOS API: Clonagem em lote concluída:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('💥 PLANOS API: Erro ao clonar plano em lote:', error);
      throw error;
    }
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const planosManutencaoApi = new PlanosManutencaoApiService();