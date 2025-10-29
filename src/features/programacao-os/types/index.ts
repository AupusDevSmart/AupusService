// src/features/programacao-os/types/index.ts - VERSÃO FINAL
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// ========================================
// ENUMS E TIPOS BASE (CONFORME SCHEMA)
// ========================================

export type StatusProgramacao = 
  | 'RASCUNHO'
  | 'PENDENTE' 
  | 'EM_ANALISE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'CANCELADA';

export type TipoOS = 
  | 'PREVENTIVA'
  | 'PREDITIVA'
  | 'CORRETIVA'
  | 'INSPECAO'
  | 'VISITA_TECNICA';

export type CondicaoOS = 
  | 'PARADO'
  | 'FUNCIONANDO';

export type PrioridadeOS = 
  | 'BAIXA'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA';

export type OrigemOS = 
  | 'ANOMALIA'
  | 'TAREFA'
  | 'PLANO_MANUTENCAO'
  | 'MANUAL';

// Aliases para compatibilidade
export type StatusOS = StatusProgramacao;
export type TipoManutencao = TipoOS;
export type PrioridadeProgramacao = PrioridadeOS;
export type OrigemProgramacao = OrigemOS;

// ========================================
// INTERFACES PARA RECURSOS (CONFORME SCHEMA)
// ========================================

export interface MaterialProgramacaoOS {
  id?: string;
  programacao_id?: string;
  descricao: string;
  quantidade_planejada: number;
  unidade: string;
  custo_unitario?: number;
  custo_total?: number;
}

export interface FerramentaProgramacaoOS {
  id?: string;
  programacao_id?: string;
  descricao: string;
  quantidade: number;
  // Campos específicos para ferramentas do sistema (conforme schema Prisma)
  codigo_patrimonial?: string;
  necessita_calibracao?: boolean;
  proxima_data_calibracao?: string;
}

export interface TecnicoProgramacaoOS {
  id?: string;
  programacao_id?: string;
  nome: string;
  especialidade: string;
  horas_estimadas: number;
  custo_hora?: number;
  custo_total?: number;
  tecnico_id?: string;
}

export interface TarefaProgramacaoOS {
  id?: string;
  programacao_id: string;
  tarefa_id: string;
  ordem?: number;
  status?: string;
  observacoes?: string;
}

export interface HistoricoProgramacaoOS {
  id: string;
  programacao_id: string;
  acao: string;
  usuario: string;
  usuario_id?: string;
  data: string;
  observacoes?: string;
  status_anterior?: StatusProgramacao;
  status_novo?: StatusProgramacao;
  dados_extras?: any;
}

// ========================================
// INTERFACE PRINCIPAL (CONFORME SCHEMA)
// ========================================

export interface ProgramacaoOS extends BaseEntity {
  // Identificação
  codigo: string;
  descricao: string;
  local: string;
  ativo: string;

  // Classificação
  condicoes: CondicaoOS;
  status: StatusProgramacao;
  tipo: TipoOS;
  prioridade: PrioridadeOS;
  origem: OrigemOS;

  // Relacionamentos com origem
  planta_id?: string;
  unidade_id?: string; // NOVO: Equipamentos agora pertencem a Unidades
  equipamento_id?: string;
  anomalia_id?: string;
  plano_manutencao_id?: string;
  dados_origem?: any;

  // Planejamento
  data_previsao_inicio?: string; // ISO DateTime string
  data_previsao_fim?: string; // ISO DateTime string
  tempo_estimado: number;
  duracao_estimada: number;

  // Requisitos de veículo
  necessita_veiculo: boolean;
  assentos_necessarios?: number;
  carga_necessaria?: number;
  observacoes_veiculo?: string;

  // Programação inicial
  data_hora_programada?: string; // ISO DateTime string (substitui data_programada + hora_programada)
  responsavel?: string;
  responsavel_id?: string;
  time_equipe?: string;

  // Custos
  orcamento_previsto?: number;

  // Observações
  observacoes?: string;
  observacoes_programacao?: string;
  justificativa?: string;
  motivo_rejeicao?: string;
  motivo_cancelamento?: string;

  // Auditoria
  criado_por?: string;
  criado_por_id?: string;
  analisado_por?: string;
  analisado_por_id?: string;
  data_analise?: string;
  aprovado_por?: string;
  aprovado_por_id?: string;
  data_aprovacao?: string;

  // Relacionamentos
  materiais?: MaterialProgramacaoOS[];
  ferramentas?: FerramentaProgramacaoOS[];
  tecnicos?: TecnicoProgramacaoOS[];
  historico?: HistoricoProgramacaoOS[];
  tarefas_programacao?: TarefaProgramacaoOS[];

  // Relacionamentos expandidos (opcional)
  planta?: { id: string; nome: string };
  unidade?: { id: string; nome: string; planta?: { id: string; nome: string } }; // NOVO: Hierarquia de unidade
  equipamento?: { id: string; nome: string; unidade?: { id: string; nome: string; planta?: { id: string; nome: string } } }; // NOVO: Incluir unidade no equipamento
  anomalia?: { id: string; descricao: string };
  plano_manutencao?: { id: string; nome: string };
}

// ========================================
// RESPONSE E DTO INTERFACES
// ========================================

export interface ProgramacaoResponse extends ProgramacaoOS {
  // Campos computados
  numeroOS?: string; // Para compatibilidade
  tarefas_count?: number;
  materiais_count?: number;
  ferramentas_count?: number;
  tecnicos_count?: number;
  custo_total_estimado?: number;

  // Campos específicos para UI
  nome?: string; // Alias para descricao quando necessário
  numero_os?: string; // Para compatibilidade com API

  // Campos de compatibilidade para componentes legacy
  data_programada?: string;
  hora_programada?: string;
  viatura?: number;
}

export interface ProgramacaoDetalhesResponse extends ProgramacaoResponse {
  // Detalhes completos incluindo relacionamentos
  materiais: MaterialProgramacaoOS[];
  ferramentas: FerramentaProgramacaoOS[];
  tecnicos: TecnicoProgramacaoOS[];
  historico: HistoricoProgramacaoOS[];
  tarefas_programacao: TarefaProgramacaoOS[];
}

export interface CreateProgramacaoDto {
  descricao: string;
  local: string;
  ativo: string;
  condicoes: CondicaoOS;
  tipo: TipoOS;
  prioridade: PrioridadeOS;
  origem: OrigemOS;
  planta_id?: string;
  unidade_id?: string; // NOVO: Equipamentos agora pertencem a Unidades
  equipamento_id?: string;
  anomalia_id?: string;
  plano_manutencao_id?: string;
  dados_origem?: any;
  tempo_estimado: number;
  duracao_estimada: number;
  data_previsao_inicio?: string; // ISO DateTime string
  data_previsao_fim?: string; // ISO DateTime string
  data_hora_programada?: string; // ISO DateTime string
  responsavel?: string;
  time_equipe?: string;
  necessita_veiculo?: boolean;
  assentos_necessarios?: number;
  carga_necessaria?: number;
  observacoes_veiculo?: string;
  orcamento_previsto?: number;
  observacoes?: string;
  observacoes_programacao?: string;
  justificativa?: string;
  tarefas_ids?: string[];
  materiais?: Omit<MaterialProgramacaoOS, 'id' | 'programacao_id'>[];
  ferramentas?: Omit<FerramentaProgramacaoOS, 'id' | 'programacao_id'>[];
  tecnicos?: Omit<TecnicoProgramacaoOS, 'id' | 'programacao_id'>[];
}

export interface UpdateProgramacaoDto extends Partial<CreateProgramacaoDto> {}

// ========================================
// FILTROS
// ========================================

export interface ProgramacaoFiltersDto extends BaseFiltersType {
  status?: StatusProgramacao | 'all';
  tipo?: TipoOS | 'all';
  prioridade?: PrioridadeOS | 'all';
  origem?: OrigemOS | 'all';
  planta_id?: string;
  unidade_id?: string; // NOVO: Filtro por unidade
  responsavel?: string;
  data_programada?: string;
  periodo?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Alias para compatibilidade
export type ProgramacaoOSFilters = ProgramacaoFiltersDto;

// ========================================
// FORM DATA INTERFACES
// ========================================

export interface OrdemServicoFormData {
  // Campos básicos
  descricao: string;
  local: string;
  ativo: string;
  condicoes: CondicaoOS;
  tipo: TipoOS;
  prioridade: PrioridadeOS;
  origem: OrigemOS | any; // Aceita estruturas complexas
  
  // Relacionamentos
  plantaId?: string;
  unidadeId?: string; // NOVO: Equipamentos agora pertencem a Unidades
  equipamentoId?: string;
  anomaliaId?: string;
  planoManutencaoId?: string;
  
  // Planejamento
  dataPrevisaoInicio?: string;
  dataPrevisaoFim?: string;
  tempoEstimado: number;
  duracaoEstimada: number;
  orcamentoPrevisto?: number;
  
  // Programação
  dataProgramada?: string;
  horaProgramada?: string;
  responsavel?: string;
  timeEquipe?: string;
  
  // Veículo
  necessitaVeiculo?: boolean;
  assentosNecessarios?: number;
  cargaNecessaria?: number;
  observacoesVeiculo?: string;
  
  // Recursos
  materiais?: MaterialProgramacaoOS[];
  ferramentas?: FerramentaProgramacaoOS[];
  tecnicos?: TecnicoProgramacaoOS[];
  
  // Observações
  observacoes?: string;
  observacoesProgramacao?: string;
  justificativa?: string;
  
  // Compatibilidade
  viatura?: number | ViaturaReservadaOS | null;
}

export interface ProgramacaoOSFormData {
  dataProgramada: string;
  horaProgramada: string;
  responsavel: string;
  timeEquipe?: string;
  observacoesProgramacao?: string;
  viatura?: number | ViaturaReservadaOS | null;
  materiaisConfirmados?: string[];
  ferramentasConfirmadas?: string[];
  tecnicosConfirmados?: string[];
}

// ========================================
// INTERFACES AUXILIARES
// ========================================

export interface ViaturaReservadaOS {
  veiculoId: number;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  solicitanteId: string;
  tipoSolicitante: 'ordem_servico';
  responsavel: string;
  finalidade: string;
  veiculo?: {
    nome: string;
    placa: string;
  };
}

export interface IniciarExecucaoData {
  equipePresente: string[];
  responsavelExecucao: string;
  observacoesInicio?: string;
  checklistInicial?: string[];
}

// ========================================
// ESTADO DO MODAL
// ========================================

export interface ModalState<T = any> {
  isOpen: boolean;
  mode: ModalMode | 'programar';
  entity: T | null;
  preselectedData?: any;
  // Compatibilidade
  ordemServico?: T | null;
}

// ========================================
// ALIASES PARA COMPATIBILIDADE
// ========================================

// Para compatibilidade com componentes de cards
export type MaterialOS = MaterialProgramacaoOS;
export type FerramentaOS = FerramentaProgramacaoOS;
export type TecnicoOS = TecnicoProgramacaoOS;
export type HistoricoOS = HistoricoProgramacaoOS;

// Para compatibilidade com código existente
export type OrdemServico = ProgramacaoResponse;

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