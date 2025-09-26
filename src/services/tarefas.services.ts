// src/services/tarefas.services.ts
import { api } from '@/config/api';

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type StatusTarefa = 'ATIVA' | 'INATIVA' | 'EM_REVISAO' | 'ARQUIVADA';
export type CategoriaTarefa = 'MECANICA' | 'ELETRICA' | 'INSTRUMENTACAO' | 'LUBRIFICACAO' | 'LIMPEZA' | 'INSPECAO' | 'CALIBRACAO' | 'OUTROS';
export type TipoManutencao = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type FrequenciaTarefa = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'PERSONALIZADA';
export type CondicaoAtivo = 'PARADO' | 'FUNCIONANDO' | 'QUALQUER';
export type TipoAnexo = 'MANUAL' | 'PROCEDIMENTO' | 'MODELO_RELATORIO' | 'OUTROS';

// ============================================================================
// TIPOS DA API PARA TAREFAS
// ============================================================================

export interface CreateSubTarefaApiData {
  descricao: string;
  obrigatoria?: boolean;
  tempo_estimado?: number;
  ordem: number;
}

export interface CreateRecursoTarefaApiData {
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio?: boolean;
}

export interface CreateTarefaApiData {
  plano_manutencao_id: string;        // Obrigatório: ID do plano de manutenção
  tag?: string;                       // Opcional: Auto-gerado se não fornecido
  nome: string;                       // Obrigatório: Nome da tarefa (máx 200 chars)
  descricao: string;                  // Obrigatório: Descrição da tarefa
  categoria: CategoriaTarefa;         // Obrigatório: Categoria da tarefa
  tipo_manutencao: TipoManutencao;    // Obrigatório: Tipo de manutenção
  frequencia: FrequenciaTarefa;       // Obrigatório: Frequência
  frequencia_personalizada?: number;  // Opcional: Frequência customizada em dias
  condicao_ativo: CondicaoAtivo;      // Obrigatório: Condição do ativo
  criticidade: number;                // Obrigatório: Criticidade (1-5)
  duracao_estimada: number;           // Obrigatório: Duração estimada
  tempo_estimado: number;             // Obrigatório: Tempo estimado em minutos
  ordem: number;                      // Obrigatório: Ordem da tarefa no plano
  planejador?: string;                // Opcional: Nome do planejador
  responsavel?: string;               // Opcional: Pessoa responsável
  observacoes?: string;               // Opcional: Observações
  status?: StatusTarefa;              // Opcional: Status (padrão: ATIVA)
  ativo?: boolean;                    // Opcional: Flag ativo (padrão: true)
  criado_por?: string;                // Opcional: ID do usuário criador
  equipamento_id?: string;            // Opcional: ID do equipamento
  planta_id?: string;                 // Opcional: ID da planta
  data_ultima_execucao?: Date;        // Opcional: Data da última execução
  numero_execucoes?: number;          // Opcional: Número de execuções (padrão: 0)
  sub_tarefas?: CreateSubTarefaApiData[]; // Opcional: Array de sub-tarefas
  recursos?: CreateRecursoTarefaApiData[]; // Opcional: Array de recursos
}

export interface UpdateTarefaApiData extends Partial<CreateTarefaApiData> {}

export interface UpdateStatusTarefaApiData {
  status: StatusTarefa;
  ativo?: boolean;
  atualizado_por?: string;
}

export interface ReordenarTarefaApiData {
  nova_ordem: number;
  atualizado_por?: string;
}

// DTOs de resposta
export interface PlanoResumoDto {
  id: string;
  nome: string;
  versao: string;
  status: string;
}

export interface PlantaResumoDto {
  id: string;
  nome: string;
  localizacao?: string;
}

export interface EquipamentoResumoDto {
  id: string;
  nome: string;
  fabricante?: string;
  modelo?: string;
  tipo?: string;
}

export interface UsuarioResumoDto {
  id: string;
  nome: string;
  email?: string;
}

export interface SubTarefaApiResponse {
  id: string;
  descricao: string;
  obrigatoria: boolean;
  tempo_estimado?: number;
  ordem: number;
  tarefa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface RecursoTarefaApiResponse {
  id: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio: boolean;
  tarefa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface AnexoTarefaApiResponse {
  id: string;
  nome: string;
  tipo: TipoAnexo;
  url: string;
  tamanho?: number;
  content_type?: string;
  tarefa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface AnexoTarefaDetalhesDto extends AnexoTarefaApiResponse {
  // Extending base response with additional details if needed
}

export interface TarefaApiResponse {
  id: string;
  plano_manutencao_id: string;
  tag: string;                        // TAG única da tarefa
  nome: string;
  descricao: string;
  categoria: CategoriaTarefa;
  tipo_manutencao: TipoManutencao;
  frequencia: FrequenciaTarefa;
  frequencia_personalizada?: number;
  condicao_ativo: CondicaoAtivo;
  criticidade: number;
  duracao_estimada: number;
  tempo_estimado: number;
  ordem: number;
  planta_id?: string;
  equipamento_id?: string;
  planejador?: string;
  responsavel?: string;
  observacoes?: string;
  status: StatusTarefa;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  criado_por?: string;
  atualizado_por?: string;
  data_ultima_execucao?: Date;        // Data da última execução
  numero_execucoes: number;           // Número de execuções
  
  // Relacionamentos
  plano_manutencao?: PlanoResumoDto;
  planta?: PlantaResumoDto;
  equipamento?: EquipamentoResumoDto;
  usuario_criador?: UsuarioResumoDto;
  usuario_atualizador?: UsuarioResumoDto;
  
  // Sub-estruturas
  sub_tarefas?: SubTarefaApiResponse[];
  recursos?: RecursoTarefaApiResponse[];
  anexos?: AnexoTarefaApiResponse[];
  
  // Contadores
  total_sub_tarefas?: number;
  total_recursos?: number;
  total_anexos?: number;
}

export interface DashboardTarefasDto {
  total_tarefas: number;
  tarefas_ativas: number;
  tarefas_inativas: number;
  tarefas_em_revisao: number;
  tarefas_arquivadas: number;
  
  // Por criticidade
  criticidade_muito_alta: number;  // Nível 5
  criticidade_alta: number;        // Nível 4
  criticidade_media: number;       // Nível 3
  criticidade_baixa: number;       // Nível 2
  criticidade_muito_baixa: number; // Nível 1
  
  // Por tipo de manutenção
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };
  
  // Por categoria
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
  
  // Estatísticas gerais
  tempo_total_estimado: number;
  media_tempo_por_tarefa: number;
  media_criticidade: number;
  total_sub_tarefas: number;
  total_recursos: number;
}

// Parâmetros de consulta
export interface QueryTarefasApiParams {
  search?: string;                  // Busca em tag, nome, descrição, responsável, planejador
  plano_id?: string;                // Filtrar por ID do plano de manutenção
  equipamento_id?: string;          // Filtrar por ID do equipamento
  planta_id?: string;               // Filtrar por ID da planta
  status?: StatusTarefa;            // Filtrar por status da tarefa
  ativo?: boolean;                  // Filtrar por status ativo
  categoria?: CategoriaTarefa;      // Filtrar por categoria da tarefa
  tipo_manutencao?: TipoManutencao; // Filtrar por tipo de manutenção
  frequencia?: FrequenciaTarefa;    // Filtrar por frequência
  criticidade?: number;             // Filtrar por nível de criticidade (1-5)
  page?: number;                    // Número da página (padrão: 1)
  limit?: number;                   // Itens por página (1-100, padrão: 10)
  sort_by?: string;                 // Campo de ordenação (padrão: 'created_at')
  sort_order?: 'asc' | 'desc';      // Direção da ordenação (padrão: 'desc')
}

export interface TarefasListApiResponse {
  data: TarefaApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// SERVIÇO DE API PARA TAREFAS
// ============================================================================

export class TarefasApiService {
  private readonly baseEndpoint = '/tarefas';

  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  async create(data: CreateTarefaApiData): Promise<TarefaApiResponse> {
    // console.log('🚀 TAREFAS API: Criando tarefa:', data);
    
    try {
      const response = await api.post<TarefaApiResponse>(this.baseEndpoint, data);
      // console.log('✅ TAREFAS API: Tarefa criada com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao criar tarefa:', error);
      // console.error('💥 TAREFAS API: Detalhes do erro:', error.response?.data);
      throw error;
    }
  }

  async findAll(params?: QueryTarefasApiParams): Promise<TarefasListApiResponse> {
    // console.log('🔍 TAREFAS API: Listando tarefas com parâmetros:', params);
    
    try {
      const response = await api.get<TarefasListApiResponse>(this.baseEndpoint, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params
        }
      });
      // console.log('✅ TAREFAS API: Tarefas listadas:', response.data.pagination);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao listar tarefas:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<TarefaApiResponse> {
    // console.log('🔍 TAREFAS API: Buscando tarefa por ID:', id);
    
    try {
      const response = await api.get<TarefaApiResponse>(`${this.baseEndpoint}/${id}`);
      // console.log('✅ TAREFAS API: Tarefa encontrada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao buscar tarefa:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdateTarefaApiData): Promise<TarefaApiResponse> {
    // console.log('🔄 TAREFAS API: Atualizando tarefa:', id, data);
    
    try {
      const response = await api.put<TarefaApiResponse>(`${this.baseEndpoint}/${id}`, data);
      // console.log('✅ TAREFAS API: Tarefa atualizada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao atualizar tarefa:', error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // console.log('🗑️ TAREFAS API: Excluindo tarefa:', id);
    
    try {
      await api.delete(`${this.baseEndpoint}/${id}`);
      // console.log('✅ TAREFAS API: Tarefa excluída com sucesso');
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao excluir tarefa:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  async getDashboard(): Promise<DashboardTarefasDto> {
    // console.log('📊 TAREFAS API: Obtendo dashboard');
    
    try {
      const response = await api.get<DashboardTarefasDto>(`${this.baseEndpoint}/dashboard`);
      // console.log('✅ TAREFAS API: Dashboard obtido:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao obter dashboard:', error);
      throw error;
    }
  }

  async findByPlano(planoId: string, params?: Partial<QueryTarefasApiParams>): Promise<TarefaApiResponse[]> {
    console.log('🔍 TAREFAS API: Buscando tarefas por plano:', planoId);

    try {
      const response = await api.get<TarefaApiResponse[]>(`${this.baseEndpoint}/plano/${planoId}`, {
        params
      });

      console.log('📡 TAREFAS API: Resposta recebida:', {
        quantidade: response.data?.length || 0,
        primeirasTarefas: response.data?.slice(0, 3)?.map(t => ({ id: t.id, tag: t.tag, nome: t.nome })) || [],
        status: response.status,
        headers: response.headers
      });

      // ✅ VALIDAÇÃO CRÍTICA: Verificar se API está retornando dados mockados
      const tarefasMockadas = (response.data || []).filter(tarefa =>
        tarefa.id && typeof tarefa.id === 'string' && tarefa.id.includes('cmg')
      );

      if (tarefasMockadas.length > 0) {
        console.error('🚨 TAREFAS API: BACKEND RETORNANDO DADOS MOCKADOS:', {
          planoId,
          quantidadeMockadas: tarefasMockadas.length,
          exemploIds: tarefasMockadas.slice(0, 3).map(t => t.id),
          url: `${this.baseEndpoint}/plano/${planoId}`,
          params
        });
        throw new Error(`CRÍTICO: Backend retornou ${tarefasMockadas.length} tarefa(s) com IDs mockados. Verifique a API do backend.`);
      }

      console.log('✅ TAREFAS API: Tarefas do plano encontradas (IDs validados):', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('💥 TAREFAS API: Erro ao buscar tarefas do plano:', error);
      throw error;
    }
  }

  async findByEquipamento(equipamentoId: string, params?: Partial<QueryTarefasApiParams>): Promise<TarefaApiResponse[]> {
    // console.log('🔍 TAREFAS API: Buscando tarefas por equipamento:', equipamentoId);
    
    try {
      const response = await api.get<TarefaApiResponse[]>(`${this.baseEndpoint}/equipamento/${equipamentoId}`, {
        params
      });
      // console.log('✅ TAREFAS API: Tarefas do equipamento encontradas:', response.data.length);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao buscar tarefas do equipamento:', error);
      throw error;
    }
  }

  async updateStatus(id: string, data: UpdateStatusTarefaApiData): Promise<TarefaApiResponse> {
    // console.log('🔄 TAREFAS API: Atualizando status da tarefa:', id, data);
    
    try {
      const response = await api.put<TarefaApiResponse>(
        `${this.baseEndpoint}/${id}/status`, 
        data
      );
      // console.log('✅ TAREFAS API: Status atualizado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao atualizar status:', error);
      throw error;
    }
  }

  async reordenar(id: string, data: ReordenarTarefaApiData): Promise<TarefaApiResponse> {
    // console.log('🔄 TAREFAS API: Reordenando tarefa:', id, data);
    
    try {
      const response = await api.put<TarefaApiResponse>(
        `${this.baseEndpoint}/${id}/reordenar`, 
        data
      );
      // console.log('✅ TAREFAS API: Tarefa reordenada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao reordenar tarefa:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES DE ANEXOS
  // ============================================================================

  async getAnexos(tarefaId: string): Promise<AnexoTarefaDetalhesDto[]> {
    // console.log('📎 TAREFAS API: Listando anexos da tarefa:', tarefaId);
    
    try {
      const response = await api.get<AnexoTarefaDetalhesDto[]>(
        `${this.baseEndpoint}/${tarefaId}/anexos`
      );
      // console.log('✅ TAREFAS API: Anexos listados:', response.data.length);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao listar anexos:', error);
      throw error;
    }
  }

  async uploadAnexo(
    tarefaId: string, 
    file: File, 
    descricao?: string, 
    usuarioId?: string
  ): Promise<AnexoTarefaDetalhesDto> {
    // console.log('📤 TAREFAS API: Fazendo upload de anexo para tarefa:', tarefaId);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (descricao) formData.append('descricao', descricao);
      if (usuarioId) formData.append('usuario_id', usuarioId);

      const response = await api.post<AnexoTarefaDetalhesDto>(
        `${this.baseEndpoint}/${tarefaId}/anexos/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // console.log('✅ TAREFAS API: Anexo enviado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao enviar anexo:', error);
      throw error;
    }
  }

  async downloadAnexo(tarefaId: string, anexoId: string): Promise<Blob> {
    // console.log('📥 TAREFAS API: Fazendo download de anexo:', anexoId);
    
    try {
      const response = await api.get(
        `${this.baseEndpoint}/${tarefaId}/anexos/${anexoId}/download`,
        {
          responseType: 'blob',
        }
      );
      // console.log('✅ TAREFAS API: Download concluído');
      return response.data;
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao fazer download:', error);
      throw error;
    }
  }

  async deleteAnexo(tarefaId: string, anexoId: string): Promise<void> {
    // console.log('🗑️ TAREFAS API: Excluindo anexo:', anexoId);
    
    try {
      await api.delete(`${this.baseEndpoint}/${tarefaId}/anexos/${anexoId}`);
      // console.log('✅ TAREFAS API: Anexo excluído com sucesso');
    } catch (error: any) {
      // console.error('💥 TAREFAS API: Erro ao excluir anexo:', error);
      throw error;
    }
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const tarefasApi = new TarefasApiService();