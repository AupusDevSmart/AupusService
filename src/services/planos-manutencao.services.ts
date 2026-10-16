// src/services/planos-manutencao.services.ts
import { isAxiosError } from 'axios';
import { api } from '@/config/api';

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type StatusPlano = 'ATIVO' | 'INATIVO' | 'EM_REVISAO' | 'ARQUIVADO';

// ============================================================================
// TIPOS DA API PARA PLANOS DE MANUTENÇÃO
// ============================================================================

export interface CreatePlanoManutencaoApiData {
  categoria_id: string;             // Obrigatório - categoria de equipamento do template
  nome: string;                     // Obrigatório - Nome do plano (máx 200 chars)
  descricao?: string;               // Opcional - Descrição do plano
  versao?: string;                  // Opcional - Versão (máx 20 chars, padrão: "1.0")
  criado_por?: string;              // Opcional - ID do usuário criador
}

export type UpdatePlanoManutencaoApiData = Partial<CreatePlanoManutencaoApiData>;

export interface VincularPlanoApiData {
  equipamento_id: string;
  plano_id: string;
  /** AAAA-MM-DD (Brasília): o dia em que o plano começa a contar; vira a âncora das tarefas (SN-53). */
  data_inicio?: string;
}

/** O primeiro vencimento de uma tarefa do template, pela regra do gerador (SN-53). */
export interface PrimeiroVencimento {
  tarefa_id: string;
  tag: string;
  nome: string;
  frequencia: string | null;
  frequencia_personalizada: number | null;
  /** ISO; null = sem periodicidade (o gerador não a programa). */
  vence_em: string | null;
  /** Já nasce vencida: sai na primeira rodada do gerador. */
  atrasada: boolean;
  /** O próximo dia útil da planta (ISO); null sem equipamento. */
  data_programada: string | null;
  /** A rodada do gerador (3h de Brasília) que cria a programação (ISO). */
  programacao_a_partir_de: string | null;
}

export interface PrimeirosVencimentos {
  ancora: string;
  /** null sem equipamento (no cadastro). */
  com_planta: boolean | null;
  tarefas: PrimeiroVencimento[];
}

export interface VincularPlanoApiResponse {
  plano_id: string;
  tarefas_copiadas: number;
  substituiu_vinculo_anterior: boolean;
  tarefas_proprias_descartadas: number;
  tarefas_customizadas_descartadas: number;
}

export interface PreviaDesvinculoApiResponse {
  possui_plano: boolean;
  total_tarefas: number;
  tarefas_proprias: number;
  tarefas_customizadas: number;
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
  codigo?: string;
  tipo_equipamento?: string;
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

/**
 * O que o plano devolve de cada tarefa quando pedido com `incluir_tarefas`.
 *
 * São SEIS campos, não a tarefa inteira — é o que
 * `PlanosManutencaoService.mapearParaResponse` monta. Este tipo declarava
 * `categoria`, `tipo_manutencao`, `status` e `tempo_estimado`, que o backend
 * não manda (colunas droppadas no PR6), e omitia `instrucao_id`, que manda.
 *
 * Para o conteúdo da tarefa, busque-a por `GET /tarefas/:id`, que traz a
 * instrução aninhada.
 */
export interface TarefaResumoDto {
  id: string;
  tag: string;
  nome: string;
  ordem: number;
  criticidade: number;
  instrucao_id?: string;
}

export interface PlanoManutencaoApiResponse {
  id: string;
  categoria_id?: string;                  // Preenchido no template
  plano_origem_id?: string;               // Preenchido na copia por equipamento
  is_template?: boolean;
  total_equipamentos_vinculados?: number;
  categoria?: { id: string; nome: string };
  equipamento_id: string;
  nome: string;
  descricao?: string;
  versao: string;
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
  /**
   * Lista os planos VINCULADOS a equipamento, em vez dos templates.
   *
   * A programacao de OS usa isto: a OS e para um ativo, e template nao tem
   * equipamento. Sem o parametro a lista continua sendo a de templates, que e o
   * que a tela de planos mostra.
   */
  vinculados?: boolean;
  search?: string;                  // Busca em nome, descrição, nome do equipamento
  equipamento_id?: string;          // Filtrar por ID do equipamento
  criado_por?: string;              // Filtrar por usuário criador
  page?: number;                    // Página (padrão: 1)
  limit?: number;                   // Itens por página (1-100, padrão: 10)
  sort_by?: string;                 // Campo de ordenação (padrão: 'created_at')
  sort_order?: 'asc' | 'desc';      // Direção da ordenação (padrão: 'desc')
  incluir_tarefas?: boolean;        // Incluir tarefas na resposta
}

// Parâmetros específicos para busca por planta
export interface QueryPlanosPorPlantaParams {
  incluir_tarefas?: boolean;        // Incluir tarefas na resposta (padrão: false)
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
    
    const response = await api.post<PlanoManutencaoApiResponse>(this.baseEndpoint, data);
    // console.log('✅ PLANOS API: Plano criado com sucesso:', response.data);
    return response.data;
  }

  async findAll(params?: QueryPlanosApiParams): Promise<PlanosListApiResponse> {
    // console.log('🔍 PLANOS API: Listando planos com parâmetros:', params);
    
    // As duas formas em que a listagem pode chegar; ver a traducao abaixo.
    const response = await api.get<
      | PlanosListApiResponse
      | {
          data?: PlanoManutencaoApiResponse[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          pages?: number;
          pagination?: undefined;
        }
    >(this.baseEndpoint, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        ...params
      }
    });

    /**
     * O backend responde a paginacao no NIVEL DE CIMA —
     * `{ data, total, page, limit, totalPages }` — e nao dentro de
     * `pagination`, que e o que PlanosListApiResponse declara e o hook le.
     *
     * Sem esta traducao `response.pagination` era sempre undefined: total 0,
     * zero paginas, e a tabela de planos nunca mostrou paginacao. Com mais
     * templates que o limite, os excedentes ficavam inalcancaveis — com 10 por
     * pagina e 13 templates, tres sumiam sem aviso.
     *
     * Aceita as duas formas para nao quebrar se o backend passar a aninhar.
     */
    const corpo = response.data;
    if (corpo?.pagination) return corpo as PlanosListApiResponse;

    return {
      data: corpo?.data ?? [],
      pagination: {
        page: corpo?.page ?? params?.page ?? 1,
        limit: corpo?.limit ?? params?.limit ?? 10,
        total: corpo?.total ?? 0,
        pages: corpo?.totalPages ?? corpo?.pages ?? 0
      }
    };
  }

  async findOne(id: string, incluirTarefas?: boolean): Promise<PlanoManutencaoApiResponse> {
    // console.log('🔍 PLANOS API: Buscando plano por ID:', id);
    
    const response = await api.get<PlanoManutencaoApiResponse>(`${this.baseEndpoint}/${id}`, {
      params: { incluirTarefas }
    });
    // console.log('✅ PLANOS API: Plano encontrado:', response.data);
    return response.data;
  }

  async update(id: string, data: UpdatePlanoManutencaoApiData): Promise<PlanoManutencaoApiResponse> {
    // console.log('🔄 PLANOS API: Atualizando plano:', id, data);
    
    const response = await api.put<PlanoManutencaoApiResponse>(`${this.baseEndpoint}/${id}`, data);
    // console.log('✅ PLANOS API: Plano atualizado:', response.data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    // console.log('🗑️ PLANOS API: Excluindo plano:', id);
    
    await api.delete(`${this.baseEndpoint}/${id}`);
    // console.log('✅ PLANOS API: Plano excluído com sucesso');
  }

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  async getDashboard(): Promise<DashboardPlanosDto> {
    // console.log('📊 PLANOS API: Obtendo dashboard');
    
    const response = await api.get<DashboardPlanosDto>(`${this.baseEndpoint}/dashboard`);
    // console.log('✅ PLANOS API: Dashboard obtido:', response.data);
    return response.data;
  }

  async findByEquipamento(equipamentoId: string): Promise<PlanoManutencaoApiResponse> {
    // console.log('🔍 PLANOS API: Buscando plano por equipamento:', equipamentoId);

    const response = await api.get<PlanoManutencaoApiResponse>(
      `${this.baseEndpoint}/por-equipamento/${equipamentoId}`
    );
    // console.log('✅ PLANOS API: Plano do equipamento encontrado:', response.data);
    return response.data;
  }

  async findByPlanta(plantaId: string, params?: QueryPlanosPorPlantaParams): Promise<PlanosListApiResponse> {
    console.log('🚀 SERVIÇO API: INÍCIO findByPlanta');
    console.log('📋 SERVIÇO API: Parâmetros:', { plantaId, params });

    const finalParams = {
      incluir_tarefas: params?.incluir_tarefas || false,
      page: params?.page || 1,
      limit: params?.limit || 10
    };

    const url = `${this.baseEndpoint}/por-planta/${plantaId}`;

    console.log('📡 SERVIÇO API: Fazendo requisição:', {
      url: url,
      params: finalParams,
      fullUrl: `/api${url}?${new URLSearchParams(Object.entries(finalParams).map(([chave, valor]) => [chave, String(valor)])).toString()}`
    });

    try {
      const response = await api.get<PlanosListApiResponse>(url, {
        params: finalParams
      });

      console.log('✅ SERVIÇO API: Resposta HTTP recebida:', {
        status: response.status,
        headers: response.headers,
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
        pagination: response.data?.pagination
      });

      console.log('🎯 SERVIÇO API: Dados completos da resposta:', response.data);

      return response.data;
    } catch (error) {
      const resposta = isAxiosError(error) ? error.response : undefined;
      console.error('❌ SERVIÇO API: Erro na requisição:', {
        error,
        message: error instanceof Error ? error.message : undefined,
        status: resposta?.status,
        statusText: resposta?.statusText,
        responseData: resposta?.data,
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
      page: params?.page || 1,
      limit: params?.limit || 10
    };

    const response = await api.get<PlanosListApiResponse>(
      `${this.baseEndpoint}/por-unidade/${unidadeId}`,
      { params: finalParams }
    );
    // console.log('✅ PLANOS API: Planos da unidade encontrados:', response.data);
    return response.data;
  }

  async getResumo(id: string): Promise<PlanoResumoDto> {
    // console.log('📋 PLANOS API: Obtendo resumo do plano:', id);
    
    const response = await api.get<PlanoResumoDto>(`${this.baseEndpoint}/${id}/resumo`);
    // console.log('✅ PLANOS API: Resumo obtido:', response.data);
    return response.data;
  }

  async duplicar(id: string, data: DuplicarPlanoApiData): Promise<PlanoManutencaoApiResponse> {
    // console.log('📋 PLANOS API: Duplicando plano:', id, data);

    const response = await api.post<PlanoManutencaoApiResponse>(
      `${this.baseEndpoint}/${id}/duplicar`,
      data
    );
    // console.log('✅ PLANOS API: Plano duplicado:', response.data);
    return response.data;
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
    } catch (error) {
      console.error('💥 PLANOS API: Erro ao clonar plano em lote:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Vinculo equipamento <-> plano
  // ==========================================================================

  /** Templates aplicaveis ao equipamento: os da categoria do modelo dele. */
  async listarTemplatesDoEquipamento(equipamentoId: string): Promise<PlanoManutencaoApiResponse[]> {
    const response = await api.get<PlanoManutencaoApiResponse[]>(
      `${this.baseEndpoint}/equipamento/${equipamentoId.trim()}/templates`,
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  /** Templates de uma categoria. Usado no cadastro, onde ainda nao ha equipamento. */
  async listarTemplatesDaCategoria(categoriaId: string): Promise<PlanoManutencaoApiResponse[]> {
    if (!categoriaId?.trim()) return [];
    const response = await api.get<PlanoManutencaoApiResponse[]>(
      `${this.baseEndpoint}/categoria/${categoriaId.trim()}/templates`,
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async previaDesvinculo(equipamentoId: string): Promise<PreviaDesvinculoApiResponse> {
    const response = await api.get<PreviaDesvinculoApiResponse>(
      `${this.baseEndpoint}/equipamento/${equipamentoId.trim()}/previa-desvinculo`,
    );
    return response.data;
  }

  async vincular(data: VincularPlanoApiData): Promise<VincularPlanoApiResponse> {
    const response = await api.post<VincularPlanoApiResponse>(`${this.baseEndpoint}/vincular`, {
      equipamento_id: data.equipamento_id.trim(),
      plano_id: data.plano_id.trim(),
      // Vazia vai como veio e a API recusa: omitir faria o vínculo contar de agora, calado
      ...(data.data_inicio !== undefined && { data_inicio: data.data_inicio }),
    });
    return response.data;
  }

  /** Antes de vincular: o primeiro vencimento de cada tarefa se o plano começar no dia dado. */
  async primeirosVencimentos(planoId: string, filtro: { data_inicio: string; equipamento_id?: string }): Promise<PrimeirosVencimentos> {
    const response = await api.get<PrimeirosVencimentos>(`${this.baseEndpoint}/${planoId.trim()}/primeiros-vencimentos`, {
      params: { data_inicio: filtro.data_inicio, ...(filtro.equipamento_id?.trim() && { equipamento_id: filtro.equipamento_id.trim() }) },
      // A prévia muda a cada data digitada e mostra o motivo no próprio painel
      semAvisoGlobal: true,
    });
    return response.data;
  }

  async desvincular(equipamentoId: string): Promise<PreviaDesvinculoApiResponse> {
    const response = await api.delete<PreviaDesvinculoApiResponse>(
      `${this.baseEndpoint}/equipamento/${equipamentoId.trim()}/vinculo`,
    );
    return response.data;
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const planosManutencaoApi = new PlanosManutencaoApiService();