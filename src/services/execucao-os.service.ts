// src/services/execucao-os.service.ts
import { api } from '@/config/api';

// ============================================================================
// ENUMS E TIPOS BASE
// ============================================================================

export type StatusExecucaoOS = 'PROGRAMADA' | 'EM_EXECUCAO' | 'PAUSADA' | 'FINALIZADA' | 'CANCELADA';
export type TipoOrdemServico = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type PrioridadeExecucao = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type StatusTarefaExecucao = 'PENDENTE' | 'EM_EXECUCAO' | 'PAUSADA' | 'FINALIZADA' | 'NAO_EXECUTADA';
export type TipoAnexoExecucao = 'RELATORIO' | 'FOTO_ANTES' | 'FOTO_DEPOIS' | 'DOCUMENTO' | 'OUTROS';

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
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
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

export interface AnexoExecucaoApiResponse {
  id: string;
  execucao_os_id: string;
  nome: string;
  tipo: TipoAnexoExecucao;
  url: string;
  tamanho?: number;
  content_type?: string;
  descricao?: string;
  uploaded_by?: string;
  created_at: Date;

  usuario_upload?: UsuarioResumoDto;
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
  anexos?: AnexoExecucaoApiResponse[];

  // Contadores e estatísticas
  total_tarefas?: number;
  tarefas_concluidas?: number;
  total_pausas?: number;
  tempo_total_pausas?: number;
  total_anexos?: number;
  custo_total_estimado?: number;
  custo_total_real?: number;
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
export interface QueryExecucaoOSApiParams {
  search?: string;
  status?: StatusExecucaoOS;
  equipamento_id?: string;
  planta_id?: string;
  ordem_servico_id?: string;
  tipo?: TipoOrdemServico;
  prioridade?: PrioridadeExecucao;
  data_inicio?: string; // ISO DateTime string
  data_fim?: string; // ISO DateTime string
  responsavel_id?: string;
  aprovacao_pendente?: boolean;
  atrasadas?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ExecucaoOSListApiResponse {
  data: ExecucaoOSApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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

    try {
      const response = await api.get<ExecucaoOSListApiResponse>(this.baseEndpoint, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params
        }
      });
      // console.log('✅ EXECUCAO-OS API: Execuções listadas:', response.data.pagination);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao listar execuções:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<ExecucaoOSApiResponse> {
    // console.log('🔍 EXECUCAO-OS API: Buscando execução por ID:', id);

    try {
      const response = await api.get<ExecucaoOSApiResponse>(`${this.baseEndpoint}/${id}`);
      // console.log('✅ EXECUCAO-OS API: Execução encontrada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao buscar execução:', error);
      throw error;
    }
  }

  async getDashboard(): Promise<DashboardExecucaoOSDto> {
    // console.log('📊 EXECUCAO-OS API: Obtendo dashboard');

    try {
      const response = await api.get<DashboardExecucaoOSDto>(`${this.baseEndpoint}/dashboard`);
      // console.log('✅ EXECUCAO-OS API: Dashboard obtido:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter dashboard:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES DE WORKFLOW DE EXECUÇÃO
  // ============================================================================

  async iniciar(id: string, data: IniciarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('▶️ EXECUCAO-OS API: Iniciando execução:', id, data);

    try {
      const response = await api.post<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/iniciar`,
        data
      );
      // console.log('✅ EXECUCAO-OS API: Execução iniciada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao iniciar execução:', error);
      throw error;
    }
  }

  async pausar(id: string, data: PausarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('⏸️ EXECUCAO-OS API: Pausando execução:', id, data);

    try {
      const response = await api.post<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/pausar`,
        data
      );
      // console.log('✅ EXECUCAO-OS API: Execução pausada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao pausar execução:', error);
      throw error;
    }
  }

  async retomar(id: string, data: RetomarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('▶️ EXECUCAO-OS API: Retomando execução:', id, data);

    try {
      const response = await api.post<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/retomar`,
        data
      );
      // console.log('✅ EXECUCAO-OS API: Execução retomada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao retomar execução:', error);
      throw error;
    }
  }

  async finalizar(id: string, data: FinalizarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('🏁 EXECUCAO-OS API: Finalizando execução:', id, data);

    try {
      const response = await api.post<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/finalizar`,
        data
      );
      // console.log('✅ EXECUCAO-OS API: Execução finalizada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao finalizar execução:', error);
      throw error;
    }
  }

  async cancelar(id: string, data: CancelarExecucaoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('🚫 EXECUCAO-OS API: Cancelando execução:', id, data);

    try {
      const response = await api.post<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/cancelar`,
        data
      );
      // console.log('✅ EXECUCAO-OS API: Execução cancelada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao cancelar execução:', error);
      throw error;
    }
  }

  async atualizarProgresso(id: string, data: AtualizarProgressoApiData): Promise<ExecucaoOSApiResponse> {
    // console.log('📈 EXECUCAO-OS API: Atualizando progresso:', id, data);

    try {
      const response = await api.put<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/progresso`,
        data
      );
      // console.log('✅ EXECUCAO-OS API: Progresso atualizado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao atualizar progresso:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES DE APROVAÇÃO
  // ============================================================================

  async aprovar(id: string, observacoesAprovacao?: string, aprovadoPor?: string): Promise<ExecucaoOSApiResponse> {
    // console.log('✅ EXECUCAO-OS API: Aprovando execução:', id);

    try {
      const response = await api.post<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/aprovar`,
        {
          observacoes_aprovacao: observacoesAprovacao,
          aprovado_por: aprovadoPor
        }
      );
      // console.log('✅ EXECUCAO-OS API: Execução aprovada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao aprovar execução:', error);
      throw error;
    }
  }

  async reprovar(id: string, motivoReprovacao: string, reprovadoPor?: string): Promise<ExecucaoOSApiResponse> {
    // console.log('❌ EXECUCAO-OS API: Reprovando execução:', id);

    try {
      const response = await api.post<ExecucaoOSApiResponse>(
        `${this.baseEndpoint}/${id}/reprovar`,
        {
          motivo_reprovacao: motivoReprovacao,
          reprovado_por: reprovadoPor
        }
      );
      // console.log('✅ EXECUCAO-OS API: Execução reprovada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao reprovar execução:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES DE TAREFAS
  // ============================================================================

  async getTarefas(id: string): Promise<TarefaExecucaoApiResponse[]> {
    // console.log('📋 EXECUCAO-OS API: Obtendo tarefas da execução:', id);

    try {
      const response = await api.get<TarefaExecucaoApiResponse[]>(`${this.baseEndpoint}/${id}/tarefas`);
      // console.log('✅ EXECUCAO-OS API: Tarefas obtidas:', response.data.length);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter tarefas:', error);
      throw error;
    }
  }

  async executarTarefa(id: string, tarefaId: string, data: ExecutarTarefaApiData): Promise<TarefaExecucaoApiResponse> {
    // console.log('🔧 EXECUCAO-OS API: Executando tarefa:', id, tarefaId, data);

    try {
      const response = await api.put<TarefaExecucaoApiResponse>(
        `${this.baseEndpoint}/${id}/tarefas/${tarefaId}/executar`,
        data
      );
      // console.log('✅ EXECUCAO-OS API: Tarefa executada:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao executar tarefa:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES DE EQUIPE
  // ============================================================================

  async getEquipe(id: string): Promise<EquipeExecucaoApiResponse[]> {
    // console.log('👥 EXECUCAO-OS API: Obtendo equipe da execução:', id);

    try {
      const response = await api.get<EquipeExecucaoApiResponse[]>(`${this.baseEndpoint}/${id}/equipe`);
      // console.log('✅ EXECUCAO-OS API: Equipe obtida:', response.data.length);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter equipe:', error);
      throw error;
    }
  }

  async adicionarMembro(id: string, tecnicoId: string, papel: 'RESPONSAVEL' | 'AUXILIAR' | 'SUPERVISOR'): Promise<EquipeExecucaoApiResponse> {
    // console.log('➕ EXECUCAO-OS API: Adicionando membro à equipe:', id, tecnicoId, papel);

    try {
      const response = await api.post<EquipeExecucaoApiResponse>(
        `${this.baseEndpoint}/${id}/equipe`,
        {
          tecnico_id: tecnicoId,
          papel: papel
        }
      );
      // console.log('✅ EXECUCAO-OS API: Membro adicionado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao adicionar membro:', error);
      throw error;
    }
  }

  async removerMembro(id: string, membroId: string): Promise<void> {
    // console.log('➖ EXECUCAO-OS API: Removendo membro da equipe:', id, membroId);

    try {
      await api.delete(`${this.baseEndpoint}/${id}/equipe/${membroId}`);
      // console.log('✅ EXECUCAO-OS API: Membro removido com sucesso');
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao remover membro:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES DE ANEXOS
  // ============================================================================

  async getAnexos(id: string): Promise<AnexoExecucaoApiResponse[]> {
    // console.log('📎 EXECUCAO-OS API: Listando anexos da execução:', id);

    try {
      const response = await api.get<AnexoExecucaoApiResponse[]>(`${this.baseEndpoint}/${id}/anexos`);
      // console.log('✅ EXECUCAO-OS API: Anexos listados:', response.data.length);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao listar anexos:', error);
      throw error;
    }
  }

  async uploadAnexo(
    id: string,
    file: File,
    tipo: TipoAnexoExecucao,
    descricao?: string,
    usuarioId?: string
  ): Promise<AnexoExecucaoApiResponse> {
    // console.log('📤 EXECUCAO-OS API: Fazendo upload de anexo para execução:', id);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', tipo);
      if (descricao) formData.append('descricao', descricao);
      if (usuarioId) formData.append('usuario_id', usuarioId);

      const response = await api.post<AnexoExecucaoApiResponse>(
        `${this.baseEndpoint}/${id}/anexos/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // console.log('✅ EXECUCAO-OS API: Anexo enviado:', response.data);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao enviar anexo:', error);
      throw error;
    }
  }

  async downloadAnexo(id: string, anexoId: string): Promise<Blob> {
    // console.log('📥 EXECUCAO-OS API: Fazendo download de anexo:', anexoId);

    try {
      const response = await api.get(
        `${this.baseEndpoint}/${id}/anexos/${anexoId}/download`,
        {
          responseType: 'blob',
        }
      );
      // console.log('✅ EXECUCAO-OS API: Download concluído');
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao fazer download:', error);
      throw error;
    }
  }

  async deleteAnexo(id: string, anexoId: string): Promise<void> {
    // console.log('🗑️ EXECUCAO-OS API: Excluindo anexo:', anexoId);

    try {
      await api.delete(`${this.baseEndpoint}/${id}/anexos/${anexoId}`);
      // console.log('✅ EXECUCAO-OS API: Anexo excluído com sucesso');
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao excluir anexo:', error);
      throw error;
    }
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
  }): Promise<any> {
    // console.log('📊 EXECUCAO-OS API: Obtendo relatório de performance:', params);

    try {
      const response = await api.get(`${this.baseEndpoint}/relatorios/performance`, {
        params
      });
      // console.log('✅ EXECUCAO-OS API: Relatório de performance obtido');
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter relatório:', error);
      throw error;
    }
  }

  async getRelatorioCustos(params?: {
    data_inicio?: string; // ISO DateTime string
    data_fim?: string; // ISO DateTime string
    planta_id?: string;
    tipo?: TipoOrdemServico;
  }): Promise<any> {
    // console.log('💰 EXECUCAO-OS API: Obtendo relatório de custos:', params);

    try {
      const response = await api.get(`${this.baseEndpoint}/relatorios/custos`, {
        params
      });
      // console.log('✅ EXECUCAO-OS API: Relatório de custos obtido');
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter relatório:', error);
      throw error;
    }
  }

  async getRelatorioEficiencia(params?: {
    data_inicio?: string; // ISO DateTime string
    data_fim?: string; // ISO DateTime string
    planta_id?: string;
    tecnico_id?: string;
  }): Promise<any> {
    // console.log('⚡ EXECUCAO-OS API: Obtendo relatório de eficiência:', params);

    try {
      const response = await api.get(`${this.baseEndpoint}/relatorios/eficiencia`, {
        params
      });
      // console.log('✅ EXECUCAO-OS API: Relatório de eficiência obtido');
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter relatório:', error);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES DE HISTÓRICO E PAUSAS
  // ============================================================================

  async getPausas(id: string): Promise<PausaExecucaoApiResponse[]> {
    // console.log('⏸️ EXECUCAO-OS API: Obtendo pausas da execução:', id);

    try {
      const response = await api.get<PausaExecucaoApiResponse[]>(`${this.baseEndpoint}/${id}/pausas`);
      // console.log('✅ EXECUCAO-OS API: Pausas obtidas:', response.data.length);
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter pausas:', error);
      throw error;
    }
  }

  async getHistoricoCompleto(id: string): Promise<any> {
    // console.log('📜 EXECUCAO-OS API: Obtendo histórico completo da execução:', id);

    try {
      const response = await api.get(`${this.baseEndpoint}/${id}/historico`);
      // console.log('✅ EXECUCAO-OS API: Histórico obtido');
      return response.data;
    } catch (error: any) {
      // console.error('💥 EXECUCAO-OS API: Erro ao obter histórico:', error);
      throw error;
    }
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const execucaoOSApi = new ExecucaoOSApiService();