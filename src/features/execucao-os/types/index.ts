// src/features/execucao-os/types/index.ts - VERSÃO FINAL
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';
import { ProgramacaoResponse } from '../../programacao-os/types';

// ========================================
// ENUMS E TIPOS BASE (CONFORME SCHEMA)
// ========================================

export type StatusExecucaoOS = 
  | 'PLANEJADA'     // OS criada da programação aprovada
  | 'PROGRAMADA'    // Data/hora definida, recursos confirmados  
  | 'EM_EXECUCAO'   // Execução iniciada
  | 'PAUSADA'       // Execução pausada
  | 'FINALIZADA'    // Execução concluída
  | 'CANCELADA';    // OS cancelada

export type TipoAnexoOS = 
  | 'FOTO_ANTES'
  | 'FOTO_DURANTE'
  | 'FOTO_DEPOIS'
  | 'DOCUMENTO'
  | 'LAUDO'
  | 'CERTIFICADO'
  | 'MANUAL';

// Imports dos tipos base da programação
export type { 
  TipoOS, 
  PrioridadeOS, 
  CondicaoOS, 
  OrigemOS 
} from '../../programacao-os/types';

// ========================================
// INTERFACES PARA RECURSOS (CONFORME SCHEMA)
// ========================================

export interface MaterialOS {
  id?: string;
  os_id?: string;
  descricao: string;
  quantidade_planejada: number;
  quantidade_consumida?: number;
  unidade: string;
  custo_unitario?: number;
  custo_total?: number;
  confirmado?: boolean;
  disponivel?: boolean;
  observacoes?: string;
}

export interface FerramentaOS {
  id?: string;
  os_id?: string;
  descricao: string;
  quantidade: number;
  confirmada?: boolean;
  disponivel?: boolean;
  utilizada?: boolean;
  condicao_antes?: string;
  condicao_depois?: string;
  observacoes?: string;
  // Campos específicos para ferramentas do sistema
  ferramenta_id?: string;
  codigo_patrimonial?: string;
  necessita_calibracao?: boolean;
  proxima_calibracao?: string;
}

export interface TecnicoOS {
  id?: string;
  os_id?: string;
  nome: string;
  especialidade: string;
  horas_estimadas: number;
  horas_trabalhadas?: number;
  custo_hora?: number;
  custo_total?: number;
  disponivel?: boolean;
  presente?: boolean;
  tecnico_id?: string;
}

export interface TarefaOS {
  id?: string;
  os_id: string;
  tarefa_id: string;
  ordem?: number;
  status?: string;
  data_conclusao?: string;
  concluida_por?: string;
  observacoes?: string;
}

export interface ChecklistAtividadeOS {
  id?: string;
  os_id: string;
  atividade: string;
  ordem?: number;
  concluida: boolean;
  obrigatoria?: boolean;
  tempo_estimado?: number;
  observacoes?: string;
  concluida_em?: string;
  concluida_por?: string;
  concluida_por_id?: string;
}

export interface AnexoOS {
  id?: string;
  os_id: string;
  nome: string;
  nome_original: string;
  tipo: TipoAnexoOS;
  mime_type: string;
  tamanho: number;
  descricao?: string;
  caminho_s3: string;
  url_download?: string;
  fase_execucao?: string;
  uploaded_at: string;
  uploaded_by?: string;
  uploaded_by_id?: string;
  deletado_em?: string;
}

export interface RegistroTempoOS {
  id?: string;
  os_id: string;
  tecnico_id?: string;
  tecnico_nome: string;
  data_hora_inicio: string; // ISO DateTime string
  data_hora_fim?: string; // ISO DateTime string
  tempo_total?: number; // em minutos
  atividade: string;
  observacoes?: string;
  pausas?: any;
}

export interface HistoricoOS {
  id: string;
  os_id: string;
  acao: string;
  usuario: string;
  usuario_id?: string;
  data: string;
  observacoes?: string;
  status_anterior?: StatusExecucaoOS;
  status_novo?: StatusExecucaoOS;
  dados_extras?: any;
}

// ========================================
// INTERFACE PRINCIPAL (CONFORME SCHEMA)
// ========================================

export interface OrdemServico extends BaseEntity {
  // Relacionamento com programação
  programacao_id: string;

  // Identificação
  numero_os: string;
  descricao: string;
  local: string;
  ativo: string;

  // Classificação (copiada da programação)
  condicoes: CondicaoOS;
  status: StatusExecucaoOS;
  tipo: TipoOS;
  prioridade: PrioridadeOS;
  origem: OrigemOS;

  // Dados herdados da programação
  planta_id?: string;
  equipamento_id?: string;
  anomalia_id?: string;
  plano_manutencao_id?: string;
  dados_origem?: any;

  // Planejamento (da programação)
  tempo_estimado: number;
  duracao_estimada: number;

  // Programação definitiva
  data_hora_programada: string; // ISO DateTime string
  responsavel: string;
  responsavel_id?: string;
  time_equipe?: string;

  // Execução Real
  data_hora_inicio_real?: string; // ISO DateTime string
  data_hora_fim_real?: string; // ISO DateTime string
  // tempo_real_execucao removido - calculado automaticamente: data_hora_fim_real - data_hora_inicio_real

  // Equipe presente na execução
  equipe_presente?: string[];

  // Custos
  orcamento_previsto?: number;
  custo_real?: number;

  // Observações
  observacoes?: string;
  observacoes_programacao?: string;
  observacoes_execucao?: string;
  motivo_cancelamento?: string;

  // Resultados da execução
  resultado_servico?: string;
  problemas_encontrados?: string;
  recomendacoes?: string;
  proxima_manutencao?: string;

  // Qualidade
  avaliacao_qualidade?: number;
  observacoes_qualidade?: string;

  // Auditoria
  criado_por?: string;
  criado_por_id?: string;
  programado_por?: string;
  programado_por_id?: string;
  finalizado_por?: string;
  finalizado_por_id?: string;
  aprovado_por?: string;
  aprovado_por_id?: string;
  data_aprovacao?: string;

  // Relacionamentos
  materiais?: MaterialOS[];
  ferramentas?: FerramentaOS[];
  tecnicos?: TecnicoOS[];
  historico?: HistoricoOS[];
  checklist_atividades?: ChecklistAtividadeOS[];
  anexos?: AnexoOS[];
  registros_tempo?: RegistroTempoOS[];
  tarefas_os?: TarefaOS[];

  // Relacionamentos expandidos (opcional)
  programacao?: ProgramacaoResponse;
  planta?: { id: string; nome: string };
  equipamento?: { id: string; nome: string };
  anomalia?: { id: string; descricao: string };
  plano_manutencao?: { id: string; nome: string };
}

// ========================================
// RESPONSE E DTO INTERFACES
// ========================================

export interface ExecucaoOS extends OrdemServico {
  // Campos computados específicos para execução
  tempo_execucao_minutos?: number;
  custo_real_total?: number;
  progresso_checklist?: number;
  esta_atrasada?: boolean;
  dias_atraso?: number;
  
  // Alias para compatibilidade com componentes existentes
  numeroOS?: string; // Alias para numero_os
  statusExecucao?: StatusExecucaoOS; // Alias para status
  dataInicioReal?: string; // Alias para data_inicio_real
  horaInicioReal?: string; // Alias para hora_inicio_real
  dataFimReal?: string; // Alias para data_fim_real
  horaFimReal?: string; // Alias para hora_fim_real
  responsavelExecucao?: string; // Alias para responsavel
  materiaisConsumidos?: MaterialOS[]; // Alias para materiais
  ferramentasUtilizadas?: FerramentaOS[]; // Alias para ferramentas
  tecnicosPresentes?: TecnicoOS[]; // Alias para tecnicos
  resultadoServico?: string; // Alias para resultado_servico
  problemasEncontrados?: string; // Alias para problemas_encontrados
  observacoesExecucao?: string; // Alias para observacoes_execucao
  
  // Dados da OS original (para compatibilidade)
  os?: {
    numeroOS: string;
    descricao: string;
    local: string;
    ativo: string;
    tipo: TipoOS;
    prioridade: PrioridadeOS;
    dataProgramada: string;
    horaProgramada: string;
  };
}

export interface CreateOrdemServicoDto {
  programacao_id: string;
  data_hora_programada: string; // ISO DateTime string
  responsavel: string;
  time_equipe?: string;
  observacoes_programacao?: string;
}

export interface UpdateExecucaoOSDto {
  status?: StatusExecucaoOS;
  data_hora_inicio_real?: string; // ISO DateTime string
  data_hora_fim_real?: string; // ISO DateTime string
  responsavel?: string;
  equipe_presente?: string[];
  observacoes_execucao?: string;
  resultado_servico?: string;
  problemas_encontrados?: string;
  recomendacoes?: string;
  proxima_manutencao?: string;
  avaliacao_qualidade?: number;
  observacoes_qualidade?: string;
  motivo_cancelamento?: string;
  materiais?: Omit<MaterialOS, 'id' | 'os_id'>[];
  ferramentas?: Omit<FerramentaOS, 'id' | 'os_id'>[];
  tecnicos?: Omit<TecnicoOS, 'id' | 'os_id'>[];
}

// ========================================
// FILTROS
// ========================================

export interface ExecucaoOSFilters extends BaseFiltersType {
  statusExecucao?: StatusExecucaoOS | 'all';
  status?: StatusExecucaoOS | 'all'; // Alias para compatibilidade
  tipo?: TipoOS | 'all';
  prioridade?: PrioridadeOS | 'all';
  responsavel?: string;
  dataExecucao?: string;
  periodo?: string;
  planta?: string;
  data_inicio?: string;
  data_fim?: string;
  programacao_id?: string;
}

// ========================================
// FORM DATA INTERFACES
// ========================================

export interface IniciarExecucaoData {
  equipePresente: string[];
  responsavelExecucao: string;
  observacoesInicio?: string;
  checklistInicial?: string[];
}

export interface FinalizarExecucaoData {
  resultadoServico: string;
  problemasEncontrados?: string;
  recomendacoes?: string;
  proximaManutencao?: string;
  materiaisConsumidos?: MaterialOS[];
  ferramentasUtilizadas?: FerramentaOS[];
  tecnicosPresentes?: TecnicoOS[];
  avaliacaoQualidade: number;
  observacoesQualidade?: string;
}

export interface ExecucaoOSFormData {
  // Campos básicos
  id?: string;
  numeroOS?: string;
  descricaoOS?: string;
  localAtivo?: string;
  tipoOS?: TipoOS;
  prioridadeOS?: PrioridadeOS;
  
  // Controle de execução
  statusExecucao?: StatusExecucaoOS;
  dataInicioReal?: string;
  horaInicioReal?: string;
  dataFimReal?: string;
  horaFimReal?: string;
  tempoTotalExecucao?: number;
  
  // Equipe
  responsavelExecucao?: string;
  funcaoResponsavel?: string;
  tecnicos?: TecnicoOS[];
  
  // Atividades
  atividadesRealizadas?: string;
  checklistConcluido?: number;
  procedimentosSeguidos?: string;
  
  // Recursos
  materiaisConsumidos?: MaterialOS[];
  ferramentasUtilizadas?: FerramentaOS[];
  custosAdicionais?: number;
  
  // Segurança
  equipamentosSeguranca?: string;
  incidentesSeguranca?: string;
  medidasSegurancaAdicionais?: string;
  
  // Resultados
  resultadoServico?: string;
  problemasEncontrados?: string;
  recomendacoes?: string;
  proximaManutencao?: string;
  avaliacaoQualidade?: number;
  observacoesQualidade?: string;
  
  // Observações
  observacoesExecucao?: string;
  motivoPausas?: string;
  motivoCancelamento?: string;
  
  // Auditoria
  finalizadoPor?: string;
  dataFinalizacao?: string;
  aprovadoPor?: string;
  dataAprovacao?: string;
}

// ========================================
// ESTADO DO MODAL
// ========================================

export interface ExecucaoModalState {
  isOpen: boolean;
  mode: ModalMode | 'iniciar' | 'pausar' | 'finalizar' | 'anexos';
  execucaoOS: ExecucaoOS | null;
  preselectedData?: any;
}

// ========================================
// ALIASES PARA COMPATIBILIDADE
// ========================================

// Aliases dos tipos antigos para manter compatibilidade
export type MaterialConsumido = MaterialOS;
export type FerramentaUtilizada = FerramentaOS;
export type ChecklistAtividade = ChecklistAtividadeOS;
export type RegistroTempoOS_Alias = RegistroTempoOS;

// StatusOS é o mesmo que StatusExecucaoOS
export type StatusOS = StatusExecucaoOS;

// ========================================
// PAGINAÇÃO
// ========================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  stats?: Record<string, number>;
}

// ========================================
// RE-EXPORTS
// ========================================

export { type ModalMode } from '@/types/base';