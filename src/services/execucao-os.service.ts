// src/services/execucao-os.service.ts
import { api } from '@/config/api';

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type StatusExecucaoOS = 'PENDENTE' | 'EM_EXECUCAO' | 'PAUSADA' | 'EXECUTADA' | 'AUDITADA' | 'FINALIZADA' | 'CANCELADA';
export type TipoOrdemServico = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type PrioridadeExecucao = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type StatusTarefaExecucao = 'PENDENTE' | 'EM_EXECUCAO' | 'PAUSADA' | 'FINALIZADA' | 'NAO_EXECUTADA';
// Os tipos de anexo são os do backend (enum TipoAnexoOS); o contrato mora em features/execucao-os/types.
export type { TipoAnexoOS as TipoAnexoExecucao, AnexoOS as AnexoExecucaoApiResponse } from '@/features/execucao-os/types';
import type {
  AnexoOS,
  DestinoDoAnexo,
  TipoAnexoOS,
  ExecucaoOS,
  TarefaOS,
  MaterialOS,
  FerramentaOS,
  TecnicoOS,
  ChecklistAtividadeOS,
  ItemDeChecklistLegado,
  RegistroTempoOS,
  HistoricoOS,
  CondicaoOS,
  TipoOS,
  PrioridadeOS,
  OrigemOS,
} from '@/features/execucao-os/types';
import type { DadosOrigem, ItemOrcamento } from '@/features/programacao-os/types';
import type { InstalacaoDaOrigem } from '@/utils/instalacao';

// ============================================================================
// TIPOS DA API PARA EXECUCAO OS
// ============================================================================

export interface IniciarExecucaoApiData {
  data_hora_inicio_real: string; // ISO DateTime string
  observacoes_inicio?: string;
  iniciado_por?: string;
  equipe_execucao?: {
    tecnico_id: string;
    papel: 'RESPONSAVEL' | 'AUXILIAR' | 'SUPERVISOR';
  }[];
}

export interface PausarExecucaoApiData {
  data_hora_pausa: string; // ISO DateTime string
  motivo_pausa: string;
  observacoes_pausa?: string;
  pausado_por?: string;
}

export interface RetomarExecucaoApiData {
  data_hora_retomada: string; // ISO DateTime string
  observacoes_retomada?: string;
  retomado_por?: string;
}

export interface FinalizarExecucaoApiData {
  data_hora_fim_real: string; // ISO DateTime string
  observacoes_finalizacao?: string;
  finalizado_por?: string;
  relatorio_final?: string;
  aprovacao_requerida?: boolean;
  pecas_utilizadas?: {
    descricao: string;
    quantidade: number;
    unidade: string;
    custo_unitario?: number;
  }[];
  materiais_utilizados?: {
    descricao: string;
    quantidade: number;
    unidade: string;
    custo_unitario?: number;
  }[];
}

export interface CancelarExecucaoApiData {
  data_hora_cancelamento: string; // ISO DateTime string
  motivo_cancelamento: string;
  observacoes_cancelamento?: string;
  cancelado_por?: string;
}

export interface ExecutarExecucaoApiData {
  data_hora_fim_real: string; // ISO DateTime string
  resultado_servico: string;
  problemas_encontrados?: string;
  recomendacoes?: string;
  observacoes_execucao?: string;
  executado_por?: string;
  materiais_utilizados?: {
    descricao: string;
    quantidade: number;
    unidade: string;
    custo_unitario?: number;
  }[];
}

export interface AuditarExecucaoApiData {
  avaliacao_qualidade: number; // 1-5
  observacoes_auditoria?: string;
  auditado_por?: string;
  aprovado: boolean;
  recomendacoes_auditoria?: string;
}

export interface ReabrirExecucaoApiData {
  motivo_reabertura: string;
  observacoes_reabertura?: string;
  reaberto_por?: string;
}

export interface FinalizarExecucaoOSApiData {
  observacoes_finalizacao?: string;
  finalizado_por?: string;
}

export interface AtualizarProgressoApiData {
  percentual_concluido: number;
  observacoes_progresso?: string;
  atualizado_por?: string;
  tarefas_concluidas?: string[];
}

export interface ExecutarTarefaApiData {
  status: StatusTarefaExecucao;
  data_hora_inicio_execucao?: string; // ISO DateTime string
  data_hora_fim_execucao?: string; // ISO DateTime string
  observacoes_execucao?: string;
  executado_por?: string;
  tempo_real_execucao?: number; // em minutos (calculado automaticamente pelo backend)
  motivo_nao_execucao?: string;
}

// DTOs de resposta
export interface OrdemServicoResumoDto {
  id: string;
  numero_os: string;
  descricao: string;
  tipo: TipoOrdemServico;
  prioridade: PrioridadeExecucao;
}

export interface EquipamentoResumoDto {
  id: string;
  nome: string;
  fabricante?: string;
  modelo?: string;
  localizacao?: string;
}

export interface PlantaResumoDto {
  id: string;
  nome: string;
  localizacao?: string;
}

export interface TecnicoResumoDto {
  id: string;
  nome: string;
  especialidade?: string;
  disponivel: boolean;
}

export interface UsuarioResumoDto {
  id: string;
  nome: string;
  email?: string;
}

export interface EquipeExecucaoApiResponse {
  id: string;
  execucao_os_id: string;
  tecnico_id: string;
  papel: 'RESPONSAVEL' | 'AUXILIAR' | 'SUPERVISOR';
  data_atribuicao: string; // ISO DateTime string
  tecnico?: TecnicoResumoDto;
}

export interface TarefaExecucaoApiResponse {
  id: string;
  execucao_os_id: string;
  tarefa_programacao_id?: string;
  descricao: string;
  categoria: string;
  tipo_manutencao: TipoOrdemServico;
  criticidade: number;
  tempo_estimado: number;
  tempo_real_execucao?: number;
  status: StatusTarefaExecucao;
  ordem: number;
  data_hora_inicio_execucao?: string; // ISO DateTime string
  data_hora_fim_execucao?: string; // ISO DateTime string
  observacoes_execucao?: string;
  executado_por?: string;
  motivo_nao_execucao?: string;
  created_at: Date;
  updated_at: Date;

  usuario_executor?: UsuarioResumoDto;
  sub_tarefas?: SubTarefaExecucaoApiResponse[];
  recursos?: RecursoTarefaExecucaoApiResponse[];
}

export interface SubTarefaExecucaoApiResponse {
  id: string;
  tarefa_execucao_id: string;
  descricao: string;
  obrigatoria: boolean;
  status: StatusTarefaExecucao;
  tempo_estimado?: number;
  tempo_real_execucao?: number;
  ordem: number;
  observacoes?: string;
  executado_por?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RecursoTarefaExecucaoApiResponse {
  id: string;
  tarefa_execucao_id: string;
  tipo: 'INSTRUMENTO' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade_prevista?: number;
  quantidade_utilizada?: number;
  unidade?: string;
  disponivel: boolean;
  confirmado: boolean;
  custo_unitario?: number;
  custo_total?: number;
  created_at: Date;
  updated_at: Date;
}

export interface PausaExecucaoApiResponse {
  id: string;
  execucao_os_id: string;
  data_hora_pausa: string; // ISO DateTime string
  data_hora_retomada?: string; // ISO DateTime string
  motivo_pausa: string;
  observacoes_pausa?: string;
  observacoes_retomada?: string;
  pausado_por?: string;
  retomado_por?: string;
  duracao_pausa?: number;
  created_at: Date;
  updated_at: Date;

  usuario_pausou?: UsuarioResumoDto;
  usuario_retomou?: UsuarioResumoDto;
}

export interface ExecucaoOSApiResponse {
  id: string;
  ordem_servico_id: string;
  numero_execucao: string;
  status: StatusExecucaoOS;
  equipamento_id: string;
  planta_id?: string;
  data_hora_programada: string; // ISO DateTime string
  data_inicio_prevista?: string; // ISO DateTime string
  data_fim_prevista?: string; // ISO DateTime string
  data_hora_inicio_real?: string; // ISO DateTime string
  data_hora_fim_real?: string; // ISO DateTime string
  tempo_estimado: number;
  tempo_real_execucao?: number;
  percentual_concluido: number;
  observacoes_inicio?: string;
  observacoes_finalizacao?: string;
  relatorio_final?: string;
  aprovacao_requerida: boolean;
  aprovado?: boolean;
  data_aprovacao?: string; // ISO DateTime string
  created_at: Date;
  updated_at: Date;
  iniciado_por?: string;
  finalizado_por?: string;
  aprovado_por?: string;

  // Relacionamentos
  ordem_servico?: OrdemServicoResumoDto;
  equipamento?: EquipamentoResumoDto;
  planta?: PlantaResumoDto;
  usuario_iniciou?: UsuarioResumoDto;
  usuario_finalizou?: UsuarioResumoDto;
  usuario_aprovou?: UsuarioResumoDto;

  // Sub-estruturas
  equipe_execucao?: EquipeExecucaoApiResponse[];
  tarefas?: TarefaExecucaoApiResponse[];
  pausas?: PausaExecucaoApiResponse[];
  anexos?: AnexoOS[];

  // Contadores e estatísticas
  total_tarefas?: number;
  tarefas_concluidas?: number;
  total_pausas?: number;
  tempo_total_pausas?: number;
  total_anexos?: number;
  custo_total_estimado?: number;
  custo_total_real?: number;
}

/**
 * A OS como a API manda em GET /execucao-os (lista) e /execucao-os/:id — o
 * OrdemServicoResponseDto do backend, com as datas em texto ISO. As chaves
 * marcadas "antiga" o backend não manda mais; o transform ainda as aceita.
 */
export interface OrdemServicoDaApi {
  instalacoes?: InstalacaoDaOrigem[];
  id: string;
  criado_em?: string;
  atualizado_em?: string;
  deletado_em?: string;
  programacao_id: string;
  numero_os: string;
  /** Antiga: o código da programação */
  codigo?: string;
  descricao: string;
  local: string;
  ativo: string;
  condicoes: CondicaoOS;
  status: StatusExecucaoOS;
  tipo: TipoOS;
  prioridade: PrioridadeOS;
  origem: OrigemOS;
  planta_id?: string;
  equipamento_id?: string;
  anomalia_id?: string;
  plano_manutencao_id?: string;
  reserva_id?: string;
  dados_origem?: DadosOrigem | null;
  tempo_estimado: number;
  duracao_estimada: number;
  data_hora_programada: string;
  responsavel: string;
  responsavel_id?: string;
  time_equipe?: string;
  data_hora_inicio_real?: string;
  data_hora_fim_real?: string;
  equipe_presente?: string[];
  orcamento_previsto?: number;
  custo_real?: number;
  observacoes?: string;
  observacoes_programacao?: string;
  observacoes_execucao?: string;
  /** Antiga */
  observacoes_inicio?: string;
  /** Antiga */
  observacoes_finalizacao?: string;
  /** Antiga */
  motivo_pausa?: string;
  motivo_cancelamento?: string;
  resultado_servico?: string;
  problemas_encontrados?: string;
  recomendacoes?: string;
  proxima_manutencao?: string;
  /** SN-60: dados de falha (ISO em UTC); minutos_parado calculado na API */
  parada_inicio?: string | null;
  parada_fim?: string | null;
  minutos_parado?: number | null;
  falha_sintoma?: string | null;
  falha_causa?: string | null;
  falha_acao?: string | null;
  avaliacao_qualidade?: number;
  observacoes_qualidade?: string;
  atividades_realizadas?: string;
  checklist_concluido?: number;
  procedimentos_seguidos?: string;
  equipamentos_seguranca?: string;
  incidentes_seguranca?: string;
  medidas_seguranca_adicionais?: string;
  custos_adicionais?: number;
  tarefas_os?: TarefaOS[];
  materiais?: MaterialOS[];
  ferramentas?: FerramentaOS[];
  tecnicos?: TecnicoOS[];
  itens_orcamento?: ItemOrcamento[];
  checklist?: ChecklistAtividadeOS[];
  /** Antiga: o checklist vinha aqui, com `descricao` no lugar de `atividade` */
  checklist_atividades?: ItemDeChecklistLegado[];
  anexos?: AnexoOS[];
  registros_tempo?: RegistroTempoOS[];
  historico?: HistoricoOS[];
  criado_por?: string;
  criado_por_id?: string;
  programado_por?: string;
  programado_por_id?: string;
  finalizado_por?: string;
  finalizado_por_id?: string;
  aprovado_por?: string;
  aprovado_por_id?: string;
  data_aprovacao?: string;
  programacao?: { id: string; codigo?: string; descricao?: string };
  /** `data`: quando a anomalia aconteceu (o início provável da parada, SN-60) */
  anomalia?: { id: string; descricao: string; prioridade?: string; status?: string; data?: string | null; condicao?: string | null };
  plano_manutencao?: { id: string; nome: string; descricao?: string | null };
  planta?: { id: string; nome: string };
  equipamento?: { id: string; nome: string; tipo_equipamento?: string | null; fabricante?: string | null; modelo?: string | null };
  reserva_veiculo?: ExecucaoOS['reserva_veiculo'];
}

export interface DashboardExecucaoOSDto {
  total_execucoes: number;
  execucoes_programadas: number;
  execucoes_em_andamento: number;
  execucoes_pausadas: number;
  execucoes_finalizadas: number;
  execucoes_canceladas: number;

  // Por prioridade
  prioridade_critica: number;
  prioridade_alta: number;
  prioridade_media: number;
  prioridade_baixa: number;

  // Por tipo
  distribuicao_tipos: {
    preventiva: number;
    preditiva: number;
    corretiva: number;
    inspecao: number;
    visita_tecnica: number;
  };

  // Estatísticas de performance
  tempo_total_estimado: number;
  tempo_total_realizado: number;
  media_eficiencia: number;
  taxa_pontualidade: number;
  execucoes_no_prazo: number;
  execucoes_atrasadas: number;

  // Custos
  custo_total_estimado: number;
  custo_total_realizado: number;
  economia_custos: number;

  // Qualidade
  taxa_aprovacao: number;
  execucoes_retrabalho: number;
  media_satisfacao: number;
}

// Parâmetros de consulta
/**
 * Os parâmetros que GET /execucao-os aceita — só esses: a API recusa (400) o que
 * não declara. Aqui havia responsavel_id, ordem_servico_id, aprovacao_pendente
 * e sort_by/sort_order, que dariam 400 no primeiro uso (SN-55).
 */
export interface QueryExecucaoOSApiParams {
  search?: string;
  status?: StatusExecucaoOS;
  /** O equipamento e os componentes dele, pela regra da instalação da OS. */
  equipamento_id?: string;
  planta_id?: string;
  tipo?: TipoOrdemServico;
  prioridade?: PrioridadeExecucao;
  /** AAAA-MM-DD (dia de Brasília) ou ISO. */
  data_inicio?: string;
  data_fim?: string;
  /** Texto: o nome do responsável contém. */
  responsavel?: string;
  atrasadas?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExecucaoOSListApiResponse {
  data: OrdemServicoDaApi[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: Record<string, number>;
}

// ============================================================================
// SERVIÇO DE API PARA EXECUCAO OS
// ============================================================================

export class ExecucaoOSApiService {
  private readonly baseEndpoint = '/execucao-os';

  // ============================================================================
  // CONSULTAS E DASHBOARD
  // ============================================================================

  async findAll(params?: QueryExecucaoOSApiParams): Promise<ExecucaoOSListApiResponse> {
    // console.log('🔍 EXECUCAO-OS API: Listando execuções com parâmetros:', params);

    const response = await api.get<ExecucaoOSListApiResponse>(this.baseEndpoint, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        ...params
      }
    });
    // console.log('✅ EXECUCAO-OS API: Execuções listadas:', response.data.pagination);
    return response.data;
  }

  async findOne(id: string): Promise<OrdemServicoDaApi> {
    // console.log('🔍 EXECUCAO-OS API: Buscando execução por ID:', id);

    const response = await api.get<OrdemServicoDaApi>(`${this.baseEndpoint}/${id}`);
    // console.log('✅ EXECUCAO-OS API: Execução encontrada:', response.data);
    return response.data;
  }

  async getDashboard(): Promise<DashboardExecucaoOSDto> {
    // console.log('📊 EXECUCAO-OS API: Obtendo dashboard');

    const response = await api.get<DashboardExecucaoOSDto>(`${this.baseEndpoint}/dashboard`);
    // console.log('✅ EXECUCAO-OS API: Dashboard obtido:', response.data);
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES DE WORKFLOW DE EXECUÇÃO
  // ============================================================================

  async iniciar(id: string, data: IniciarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('▶️ EXECUCAO-OS API: Iniciando execução:', id, data);

    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/iniciar`,
      data
    );
    // console.log('✅ EXECUCAO-OS API: Execução iniciada:', response.data);
    return response.data;
  }

  async pausar(id: string, data: PausarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('⏸️ EXECUCAO-OS API: Pausando execução:', id, data);

    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/pausar`,
      data
    );
    // console.log('✅ EXECUCAO-OS API: Execução pausada:', response.data);
    return response.data;
  }

  async retomar(id: string, data: RetomarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('▶️ EXECUCAO-OS API: Retomando execução:', id, data);

    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/retomar`,
      data
    );
    // console.log('✅ EXECUCAO-OS API: Execução retomada:', response.data);
    return response.data;
  }

  async finalizar(id: string, data: FinalizarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('🏁 EXECUCAO-OS API: Finalizando execução:', id, data);

    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/finalizar`,
      data
    );
    // console.log('✅ EXECUCAO-OS API: Execução finalizada:', response.data);
    return response.data;
  }

  async cancelar(id: string, data: CancelarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/cancelar`,
      data
    );
    return response.data;
  }

  async executar(id: string, data: ExecutarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/executar`,
      data
    );
    return response.data;
  }

  async auditar(id: string, data: AuditarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/auditar`,
      data
    );
    return response.data;
  }

  async reabrir(id: string, data: ReabrirExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/reabrir`,
      data
    );
    return response.data;
  }

  async finalizarOS(id: string, data: FinalizarExecucaoOSApiData): Promise<ExecucaoOSApiResponse> {
    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/finalizar`,
      data
    );
    return response.data;
  }

  async atualizarProgresso(id: string, data: AtualizarProgressoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('📈 EXECUCAO-OS API: Atualizando progresso:', id, data);

    const response = await api.put<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/progresso`,
      data
    );
    // console.log('✅ EXECUCAO-OS API: Progresso atualizado:', response.data);
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES DE APROVAÇÃO
  // ============================================================================

  async aprovar(id: string, observacoesAprovacao?: string, aprovadoPor?: string): Promise<ExecucaoOSApiResponse> {
    // console.log('✅ EXECUCAO-OS API: Aprovando execução:', id);

    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/aprovar`,
      {
        observacoes_aprovacao: observacoesAprovacao,
        aprovado_por: aprovadoPor
      }
    );
    // console.log('✅ EXECUCAO-OS API: Execução aprovada:', response.data);
    return response.data;
  }

  async reprovar(id: string, motivoReprovacao: string, reprovadoPor?: string): Promise<ExecucaoOSApiResponse> {
    // console.log('❌ EXECUCAO-OS API: Reprovando execução:', id);

    const response = await api.post<ExecucaoOSApiResponse>(
      `${this.baseEndpoint}/${id}/reprovar`,
      {
        motivo_reprovacao: motivoReprovacao,
        reprovado_por: reprovadoPor
      }
    );
    // console.log('✅ EXECUCAO-OS API: Execução reprovada:', response.data);
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES DE TAREFAS
  // ============================================================================

  async getTarefas(id: string): Promise<TarefaExecucaoApiResponse[]> {
    // console.log('📋 EXECUCAO-OS API: Obtendo tarefas da execução:', id);

    const response = await api.get<TarefaExecucaoApiResponse[]>(`${this.baseEndpoint}/${id}/tarefas`);
    // console.log('✅ EXECUCAO-OS API: Tarefas obtidas:', response.data.length);
    return response.data;
  }

  async executarTarefa(id: string, tarefaId: string, data: ExecutarTarefaApiData): Promise<TarefaExecucaoApiResponse> {
    // console.log('🔧 EXECUCAO-OS API: Executando tarefa:', id, tarefaId, data);

    const response = await api.put<TarefaExecucaoApiResponse>(
      `${this.baseEndpoint}/${id}/tarefas/${tarefaId}/executar`,
      data
    );
    // console.log('✅ EXECUCAO-OS API: Tarefa executada:', response.data);
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES DE EQUIPE
  // ============================================================================

  async getEquipe(id: string): Promise<EquipeExecucaoApiResponse[]> {
    // console.log('👥 EXECUCAO-OS API: Obtendo equipe da execução:', id);

    const response = await api.get<EquipeExecucaoApiResponse[]>(`${this.baseEndpoint}/${id}/equipe`);
    // console.log('✅ EXECUCAO-OS API: Equipe obtida:', response.data.length);
    return response.data;
  }

  async adicionarMembro(id: string, tecnicoId: string, papel: 'RESPONSAVEL' | 'AUXILIAR' | 'SUPERVISOR'): Promise<EquipeExecucaoApiResponse> {
    // console.log('➕ EXECUCAO-OS API: Adicionando membro à equipe:', id, tecnicoId, papel);

    const response = await api.post<EquipeExecucaoApiResponse>(
      `${this.baseEndpoint}/${id}/equipe`,
      {
        tecnico_id: tecnicoId,
        papel: papel
      }
    );
    // console.log('✅ EXECUCAO-OS API: Membro adicionado:', response.data);
    return response.data;
  }

  async removerMembro(id: string, membroId: string): Promise<void> {
    // console.log('➖ EXECUCAO-OS API: Removendo membro da equipe:', id, membroId);

    await api.delete(`${this.baseEndpoint}/${id}/equipe/${membroId}`);
    // console.log('✅ EXECUCAO-OS API: Membro removido com sucesso');
  }

  // ============================================================================
  // OPERAÇÕES DE ANEXOS
  // ============================================================================

  async getAnexos(id: string): Promise<AnexoOS[]> {
    const response = await api.get<AnexoOS[]>(`${this.baseEndpoint}/${id.trim()}/anexos`);
    return response.data;
  }

  /**
   * POST /execucao-os/:id/anexos — o tipo vai na query (é o contrato do
   * controller); quem enviou o backend tira do token.
   */
  async uploadAnexo(id: string, file: File, tipo: TipoAnexoOS, descricao?: string, destino: DestinoDoAnexo = {}): Promise<AnexoOS> {
    const formData = new FormData();
    formData.append('file', file);
    if (descricao) formData.append('descricao', descricao);
    // A foto da tarefa ou do item do checklist (SN-59); sem os dois, anexo geral
    if (destino.checklist_item_id) formData.append('checklist_item_id', destino.checklist_item_id.trim());
    else if (destino.tarefa_os_id) formData.append('tarefa_os_id', destino.tarefa_os_id.trim());

    const response = await api.post<AnexoOS>(`${this.baseEndpoint}/${id.trim()}/anexos`, formData, {
      params: { tipo },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async downloadAnexo(id: string, anexoId: string): Promise<Blob> {
    const response = await api.get(`${this.baseEndpoint}/${id.trim()}/anexos/${anexoId.trim()}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteAnexo(id: string, anexoId: string): Promise<void> {
    await api.delete(`${this.baseEndpoint}/${id.trim()}/anexos/${anexoId.trim()}`);
  }

  // ============================================================================
  // OPERAÇÕES DE RELATÓRIOS
  // ============================================================================

  async getRelatorioPerformance(params?: {
    data_inicio?: string; // ISO DateTime string
    data_fim?: string; // ISO DateTime string
    planta_id?: string;
    equipamento_id?: string;
    tipo?: TipoOrdemServico;
  }): Promise<unknown> {
    // console.log('📊 EXECUCAO-OS API: Obtendo relatório de performance:', params);

    const response = await api.get(`${this.baseEndpoint}/relatorios/performance`, {
      params
    });
    // console.log('✅ EXECUCAO-OS API: Relatório de performance obtido');
    return response.data;
  }

  async getRelatorioCustos(params?: {
    data_inicio?: string; // ISO DateTime string
    data_fim?: string; // ISO DateTime string
    planta_id?: string;
    tipo?: TipoOrdemServico;
  }): Promise<unknown> {
    // console.log('💰 EXECUCAO-OS API: Obtendo relatório de custos:', params);

    const response = await api.get(`${this.baseEndpoint}/relatorios/custos`, {
      params
    });
    // console.log('✅ EXECUCAO-OS API: Relatório de custos obtido');
    return response.data;
  }

  async getRelatorioEficiencia(params?: {
    data_inicio?: string; // ISO DateTime string
    data_fim?: string; // ISO DateTime string
    planta_id?: string;
    tecnico_id?: string;
  }): Promise<unknown> {
    // console.log('⚡ EXECUCAO-OS API: Obtendo relatório de eficiência:', params);

    const response = await api.get(`${this.baseEndpoint}/relatorios/eficiencia`, {
      params
    });
    // console.log('✅ EXECUCAO-OS API: Relatório de eficiência obtido');
    return response.data;
  }

  // ============================================================================
  // OPERAÇÕES DE HISTÓRICO E PAUSAS
  // ============================================================================

  async getPausas(id: string): Promise<PausaExecucaoApiResponse[]> {
    // console.log('⏸️ EXECUCAO-OS API: Obtendo pausas da execução:', id);

    const response = await api.get<PausaExecucaoApiResponse[]>(`${this.baseEndpoint}/${id}/pausas`);
    // console.log('✅ EXECUCAO-OS API: Pausas obtidas:', response.data.length);
    return response.data;
  }

  /** Marca/desmarca itens do checklist (grava na hora; OS em execução ou pausada) */
  /**
   * Verificação manda `concluida`; leitura manda `valor_lido` (null apaga) e a
   * API marca pelo valor (SN-58). `observacoes` explica a leitura fora da faixa.
   */
  async atualizarChecklist(
    id: string,
    atividades: { id: string; concluida?: boolean; valor_lido?: number | null; observacoes?: string | null }[],
  ): Promise<void> {
    await api.patch(`${this.baseEndpoint}/${id}/checklist`, { atividades });
  }

  /** Tarefa feita. `tarefaOsId` é o id do vínculo (tarefas_os.id) */
  async concluirTarefa(id: string, tarefaOsId: string): Promise<void> {
    await api.patch(`${this.baseEndpoint}/${id}/tarefas/${tarefaOsId.trim()}/concluir`, {});
  }

  /** Desfaz "feita"/"não feita" enquanto a OS está em execução */
  async reabrirTarefa(id: string, tarefaOsId: string): Promise<void> {
    await api.patch(`${this.baseEndpoint}/${id}/tarefas/${tarefaOsId.trim()}/reabrir`, {});
  }

  /** Consumo de materiais que já existem na OS (PATCH :id/materiais) */
  async registrarMateriais(
    id: string,
    materiais: { id: string; quantidade_consumida: number; observacoes?: string }[],
  ): Promise<void> {
    await api.patch(`${this.baseEndpoint}/${id}/materiais`, { materiais });
  }

  /** Uso das ferramentas que já existem na OS (PATCH :id/ferramentas) */
  async registrarFerramentas(
    id: string,
    ferramentas: { id: string; utilizada: boolean; condicao_antes?: string; condicao_depois?: string; observacoes?: string }[],
  ): Promise<void> {
    await api.patch(`${this.baseEndpoint}/${id}/ferramentas`, { ferramentas });
  }

  async getHistoricoCompleto(id: string): Promise<unknown> {
    // console.log('📜 EXECUCAO-OS API: Obtendo histórico completo da execução:', id);

    const response = await api.get(`${this.baseEndpoint}/${id}/historico`);
    // console.log('✅ EXECUCAO-OS API: Histórico obtido');
    return response.data;
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const execucaoOSApi = new ExecucaoOSApiService();