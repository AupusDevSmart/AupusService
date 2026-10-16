// src/services/programacao-os.service.ts
import { api } from '@/config/api';
import type { DadosOrigem } from '@/features/programacao-os/types';

// ============================================================================
// ENUMS E TIPOS (alinhados com o backend)
// ============================================================================

export type StatusProgramacao = 'PENDENTE' | 'APROVADA' | 'FINALIZADA' | 'CANCELADA';
export type TipoManutencao = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO';
export type PrioridadeProgramacao = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type OrigemProgramacao = 'ANOMALIA' | 'PLANO_MANUTENCAO' | 'TAREFA' | 'SOLICITACAO_SERVICO' | 'MANUAL';

// ============================================================================
// DTOs DE REQUEST (baseados no backend real)
// ============================================================================

export interface MaterialProgramacaoDto {
  descricao: string;
  quantidade_planejada: number;
  unidade: string;
  custo_unitario?: number;
}

export interface FerramentaProgramacaoDto {
  descricao: string;
  quantidade: number;
}

export interface TecnicoProgramacaoDto {
  nome: string;
  especialidade: string;
  horas_estimadas: number;
  custo_hora?: number;
  tecnico_id?: string;
}

export interface ItemOrcamentoProgramacaoDto {
  descricao: string;
  valor: number;
}

export interface CreateProgramacaoDto {
  descricao: string;
  // Opcionais no backend: a programação herda da origem
  local?: string;
  ativo?: string;
  condicoes?: string;
  tipo: TipoManutencao;
  prioridade: PrioridadeProgramacao;
  origem: OrigemProgramacao;
  planta_id?: string;
  equipamento_id?: string;
  anomalia_id?: string;
  plano_manutencao_id?: string;
  dados_origem?: DadosOrigem | null;
  tempo_estimado?: number;
  duracao_estimada?: number;
  data_previsao_inicio?: string; // ISO DateTime string
  data_previsao_fim?: string; // ISO DateTime string
  necessita_veiculo?: boolean;
  assentos_necessarios?: number;
  carga_necessaria?: number;
  observacoes_veiculo?: string;
  data_hora_programada?: string; // ISO DateTime string (substitui data_programada + hora_programada)
  responsavel?: string;
  responsavel_id?: string;
  observacoes?: string;
  justificativa?: string;
  tarefas_ids?: string[];
  materiais?: MaterialProgramacaoDto[];
  ferramentas?: FerramentaProgramacaoDto[];
  tecnicos?: TecnicoProgramacaoDto[];
  itens_orcamento?: ItemOrcamentoProgramacaoDto[];
}

export type UpdateProgramacaoDto = Partial<CreateProgramacaoDto>;

export interface AprovarProgramacaoDto {
  observacoes?: string;
}

export interface FinalizarProgramacaoDto {
  observacoes?: string;
}

export interface CancelarProgramacaoDto {
  motivo_cancelamento: string;
}

export interface CreateProgramacaoAnomaliaDto {
  ajustes?: {
    descricao?: string;
    prioridade?: PrioridadeProgramacao;
    tempo_estimado?: number;
  };
}

export interface CreateProgramacaoTarefasDto {
  tarefas_ids: string[];
  descricao?: string;
  agrupar_por: 'planta' | 'equipamento' | 'tipo';
  prioridade?: PrioridadeProgramacao;
  data_hora_programada?: string; // ISO DateTime string
  responsavel?: string;
  observacoes?: string;
}

export interface AdicionarTarefasDto {
  tarefas_ids: string[];
  observacoes?: string;
}

export interface AtualizarTarefasDto {
  tarefas: {
    tarefa_id: string;
    ordem?: number;
    status?: string;
    observacoes?: string;
  }[];
}

// ============================================================================
// DTOs DE RESPONSE (baseados no backend real)
// ============================================================================

export interface TarefaProgramacaoResponse {
  id: string;
  programacao_id: string;
  tarefa_id: string;
  ordem: number;
  status?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  /**
   * Ponte para a tarefa viva. Só id e nome: `categoria`, `tipo_manutencao`,
   * `tempo_estimado` e `duracao_estimada` foram droppadas da tabela no PR6 —
   * as duas primeiras chegavam `undefined` e as duas últimas `null` (vinham
   * como NaN do backend). O conteúdo é da instrução.
   */
  tarefa: {
    id: string;
    nome: string;
  };
}

export interface MaterialProgramacaoResponse {
  id: string;
  programacao_id: string;
  descricao: string;
  quantidade_planejada: number;
  unidade: string;
  custo_unitario?: number;
  custo_total?: number;
  confirmado?: boolean;
  disponivel?: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface FerramentaProgramacaoResponse {
  id: string;
  programacao_id: string;
  descricao: string;
  quantidade: number;
  confirmada?: boolean;
  disponivel?: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface TecnicoProgramacaoResponse {
  id: string;
  programacao_id: string;
  nome: string;
  especialidade: string;
  horas_estimadas: number;
  custo_hora?: number;
  custo_total?: number;
  disponivel?: boolean;
  tecnico_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemOrcamentoProgramacaoResponse {
  id: string;
  programacao_id: string;
  descricao: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface HistoricoProgramacaoResponse {
  id: string;
  programacao_id: string;
  acao: string;
  usuario: string;
  usuario_id?: string;
  data: string;
  observacoes?: string;
  status_anterior?: StatusProgramacao;
  status_novo?: StatusProgramacao;
  dados_extras?: Record<string, unknown> | null;
}

/** Instalacao (`unidades`) derivada da origem — ver `instalacao.ts`. */
export interface InstalacaoDaOrigem {
  id: string;
  nome: string;
}

export interface ProgramacaoResponse {
  /**
   * Derivada no backend a partir da origem, porque a programacao nao guarda
   * `unidade_id`. Vazia quando a origem nao tem instalacao (a OP MANUAL nao
   * tem); ausente quando o endpoint nao apurou.
   */
  instalacoes?: InstalacaoDaOrigem[];
  id: string;
  criado_em: string;
  atualizado_em: string;
  deletado_em?: string;
  codigo: string;
  descricao: string;
  local: string;
  ativo: string;
  condicoes?: string;
  status: StatusProgramacao;
  tipo: TipoManutencao;
  prioridade: PrioridadeProgramacao;
  origem: OrigemProgramacao;
  planta_id?: string;
  equipamento_id?: string;
  anomalia_id?: string;
  plano_manutencao_id?: string;
  dados_origem?: DadosOrigem | null;
  data_previsao_inicio?: string; // ISO DateTime string
  data_previsao_fim?: string; // ISO DateTime string
  tempo_estimado: number;
  duracao_estimada: number;
  necessita_veiculo: boolean;
  assentos_necessarios?: number;
  carga_necessaria?: number;
  observacoes_veiculo?: string;
  data_hora_programada?: string; // ISO DateTime string
  responsavel?: string;
  responsavel_id?: string;
  time_equipe?: string;
  orcamento_previsto?: number;
  observacoes?: string;
  observacoes_programacao?: string;
  justificativa?: string;
  observacoes_analise?: string;
  motivo_rejeicao?: string;
  sugestoes_melhoria?: string;
  motivo_cancelamento?: string;
  observacoes_aprovacao?: string;
  ajustes_orcamento?: number;
  data_programada_sugerida?: string;
  hora_programada_sugerida?: string;
  tarefas_programacao?: TarefaProgramacaoResponse[];
  criado_por?: string;
  criado_por_id?: string;
  analisado_por?: string;
  analisado_por_id?: string;
  data_analise?: string;
  aprovado_por?: string;
  aprovado_por_id?: string;
  data_aprovacao?: string;
  finalizado_por?: string;
  finalizado_por_id?: string;
  data_finalizacao?: string;
  observacoes_finalizacao?: string;
  materiais?: MaterialProgramacaoResponse[];
  ferramentas?: FerramentaProgramacaoResponse[];
  tecnicos?: TecnicoProgramacaoResponse[];
  itens_orcamento?: ItemOrcamentoProgramacaoResponse[];
  historico?: HistoricoProgramacaoResponse[];
  ordem_servico?: OrdemServicoDaProgramacao | null;
  /** Reserva de viatura da programação (a API manda; antes não estava no tipo) */
  reserva_id?: string | null;
  reserva_veiculo?: {
    id: string;
    veiculo_id: string;
    data_inicio: string;
    data_fim: string;
    hora_inicio: string;
    hora_fim: string;
    responsavel: string;
    finalidade: string;
    status: string;
    /** A linha da viatura inteira (o backend inclui a relação) */
    veiculo?: {
      id: string;
      nome: string;
      placa: string;
      marca?: string;
      modelo?: string;
      tipo?: string;
      capacidade_passageiros?: number;
    };
  } | null;
  /** Coluna da programação; a solicitação também pode vir só em dados_origem */
  solicitacao_servico_id?: string | null;
  /** A solicitação de origem, resumida (null nas outras origens) */
  solicitacao_servico?: {
    id: string;
    numero?: string;
    titulo?: string;
    descricao?: string;
    tipo?: string;
    prioridade?: string;
    status?: string;
    local?: string;
    solicitante_nome?: string;
    data_solicitacao?: string;
  } | null;
}

/** A OS que a aprovação criou: só o que a tela lê (a linha da tabela não traz). */
export interface OrdemServicoDaProgramacao {
  id?: string | null;
  status?: string | null;
  numero_os?: string | null;
}

export interface ProgramacaoDetalhesResponse extends ProgramacaoResponse {
  materiais: MaterialProgramacaoResponse[];
  ferramentas: FerramentaProgramacaoResponse[];
  tecnicos: TecnicoProgramacaoResponse[];
  itens_orcamento: ItemOrcamentoProgramacaoResponse[];
  historico: HistoricoProgramacaoResponse[];
  ordem_servico?: OrdemServicoDaProgramacao | null;
}

export interface ProgramacaoStatsResponse {
  pendentes: number;
  aprovadas: number;
  finalizadas: number;
  canceladas: number;
}

export interface ListarProgramacoesResponse {
  data: ProgramacaoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ProgramacaoStatsResponse;
}

/** Quem pode ser responsável ou técnico (SN-31): GET /programacao-os/pessoas */
export interface PessoaQuePodeAtuar {
  id: string;
  nome: string;
  email: string | null;
  papel: string;
}

export interface PessoasDaPlanta {
  /** Técnicos de campo vinculados à planta */
  equipe: PessoaQuePodeAtuar[];
  /** Planejador, gerente e administrador: atuam em qualquer planta */
  apoio: PessoaQuePodeAtuar[];
}

// ============================================================================
// PARÂMETROS DE QUERY
// ============================================================================

export interface ProgramacaoFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: StatusProgramacao | 'all';
  tipo?: TipoManutencao | 'all';
  prioridade?: PrioridadeProgramacao | 'all';
  origem?: OrigemProgramacao | 'all';
  planta_id?: string;
  /** O equipamento e os componentes dele (SN-55). */
  equipamento_id?: string;
  /** AAAA-MM-DD: o período pela data da programação. */
  data_inicio?: string;
  data_fim?: string;
  criado_por_id?: string;
  /** Programações desta origem — é assim que o atalho acha a que está aberta */
  anomalia_id?: string;
  solicitacao_servico_id?: string;
}

// ============================================================================
// SERVIÇO DE API
// ============================================================================

/** "Todos" dos filtros de id: a API casaria 'all' como id e não traria nada. */
const SEM_TODOS = new Set(['planta_id', 'equipamento_id']);

/** O que o filtro não pediu não vai: vazio, e o "todos" dos filtros de id. */
function semFiltroVazio(filters?: ProgramacaoFiltersDto): ProgramacaoFiltersDto | undefined {
  if (!filters) return filters;
  return Object.fromEntries(
    Object.entries(filters).filter(([chave, valor]) => valor !== '' && valor !== undefined && !(SEM_TODOS.has(chave) && valor === 'all')),
  ) as ProgramacaoFiltersDto;
}

export class ProgramacaoOSApiService {
  private readonly baseEndpoint = '/programacao-os';

  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  async listar(filters?: ProgramacaoFiltersDto): Promise<ListarProgramacoesResponse> {
    // // console.log('🔍 PROGRAMACAO-OS API: Listando programações com filtros:', filters);

    const response = await api.get<ListarProgramacoesResponse>(this.baseEndpoint, {
      params: semFiltroVazio(filters)
    });
    // // console.log('✅ PROGRAMACAO-OS API: Programações listadas:', response.data.pagination);
    return response.data;
  }

  async buscarPorId(id: string): Promise<ProgramacaoDetalhesResponse> {
    try {
      const response = await api.get<ProgramacaoDetalhesResponse>(`${this.baseEndpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error('💥 PROGRAMACAO-OS API: Erro ao buscar programação:', error);
      throw error;
    }
  }

  async criar(data: CreateProgramacaoDto): Promise<ProgramacaoResponse> {
    // // console.log('🚀 PROGRAMACAO-OS API: Criando programação:', data);

    const response = await api.post<ProgramacaoResponse>(this.baseEndpoint, data);
    // // console.log('✅ PROGRAMACAO-OS API: Programação criada com sucesso:', response.data);
    return response.data;
  }

  async atualizar(id: string, data: UpdateProgramacaoDto): Promise<ProgramacaoResponse> {
    // // console.log('🔄 PROGRAMACAO-OS API: Atualizando programação:', id, data);

    const response = await api.patch<ProgramacaoResponse>(`${this.baseEndpoint}/${id}`, data);
    // // console.log('✅ PROGRAMACAO-OS API: Programação atualizada:', response.data);
    return response.data;
  }

  async deletar(id: string): Promise<{ message: string }> {
    // // console.log('🗑️ PROGRAMACAO-OS API: Deletando programação:', id);

    const response = await api.delete<{ message: string }>(`${this.baseEndpoint}/${id}`);
    // // console.log('✅ PROGRAMACAO-OS API: Programação deletada com sucesso');
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES DE WORKFLOW
  // ============================================================================

  async aprovar(id: string, data: AprovarProgramacaoDto): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`${this.baseEndpoint}/${id}/aprovar`, data);
    return response.data;
  }

  async finalizar(id: string, data: FinalizarProgramacaoDto): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`${this.baseEndpoint}/${id}/finalizar`, data);
    return response.data;
  }

  async cancelar(id: string, data: CancelarProgramacaoDto): Promise<{ message: string }> {
    // // console.log('🚫 PROGRAMACAO-OS API: Cancelando programação:', id, data);

    const response = await api.patch<{ message: string }>(`${this.baseEndpoint}/${id}/cancelar`, data);
    // // console.log('✅ PROGRAMACAO-OS API: Programação cancelada:', response.data);
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES ESPECÍFICAS
  // ============================================================================

  async criarDeAnomalia(anomaliaId: string, data: CreateProgramacaoAnomaliaDto): Promise<ProgramacaoResponse> {
    // // console.log('📥 PROGRAMACAO-OS API: Criando programação de anomalia:', anomaliaId, data);

    const response = await api.post<ProgramacaoResponse>(
      `${this.baseEndpoint}/from-anomalia/${anomaliaId}`,
      data
    );
    // // console.log('✅ PROGRAMACAO-OS API: Programação criada de anomalia:', response.data);
    return response.data;
  }

  async criarDeTarefas(data: CreateProgramacaoTarefasDto): Promise<ProgramacaoResponse> {
    // // console.log('📥 PROGRAMACAO-OS API: Criando programação de tarefas:', data);

    const response = await api.post<ProgramacaoResponse>(
      `${this.baseEndpoint}/from-tarefas`,
      data
    );
    // // console.log('✅ PROGRAMACAO-OS API: Programação criada de tarefas:', response.data);
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES COM TAREFAS
  // ============================================================================

  async adicionarTarefas(id: string, data: AdicionarTarefasDto): Promise<{ message: string }> {
    // // console.log('➕ PROGRAMACAO-OS API: Adicionando tarefas à programação:', id, data);

    const response = await api.post<{ message: string }>(`${this.baseEndpoint}/${id}/tarefas`, data);
    // // console.log('✅ PROGRAMACAO-OS API: Tarefas adicionadas:', response.data);
    return response.data;
  }

  async atualizarTarefas(id: string, data: AtualizarTarefasDto): Promise<{ message: string }> {
    // // console.log('🔄 PROGRAMACAO-OS API: Atualizando tarefas da programação:', id, data);

    const response = await api.patch<{ message: string }>(`${this.baseEndpoint}/${id}/tarefas`, data);
    // // console.log('✅ PROGRAMACAO-OS API: Tarefas atualizadas:', response.data);
    return response.data;
  }

  /** Opções de responsável e técnico: a equipe da planta e o apoio. */
  async pessoas(plantaId?: string | null): Promise<PessoasDaPlanta> {
    const response = await api.get<PessoasDaPlanta>(`${this.baseEndpoint}/pessoas`, {
      params: plantaId?.trim() ? { planta_id: plantaId.trim() } : undefined,
    });
    return response.data;
  }

  async removerTarefa(id: string, tarefaId: string): Promise<{ message: string }> {
    // // console.log('➖ PROGRAMACAO-OS API: Removendo tarefa da programação:', id, tarefaId);

    const response = await api.delete<{ message: string }>(`${this.baseEndpoint}/${id}/tarefas/${tarefaId}`);
    // // console.log('✅ PROGRAMACAO-OS API: Tarefa removida com sucesso');
    return response.data;
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const programacaoOSApi = new ProgramacaoOSApiService();