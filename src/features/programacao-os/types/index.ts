// src/features/programacao-os/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums para os campos de seleção
export type StatusOS = 'PENDENTE' | 'PLANEJADA' | 'PROGRAMADA' | 'EM_EXECUCAO' | 'FINALIZADA' | 'CANCELADA';
export type TipoOS = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type CondicaoOS = 'PARADO' | 'FUNCIONANDO';
export type PrioridadeOS = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type OrigemOS = 'ANOMALIA' | 'TAREFA' | 'MANUAL';

// Interface para materiais necessários
export interface MaterialOS {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  confirmado: boolean;
  disponivel: boolean;
  custo?: number;
}

// Interface para ferramentas necessárias
export interface FerramentaOS {
  id: string;
  descricao: string;
  quantidade: number;
  confirmada: boolean;
  disponivel: boolean;
}

// Interface para equipe/técnicos
export interface TecnicoOS {
  id: string;
  nome: string;
  especialidade: string;
  horasEstimadas: number;
  custoHora?: number;
  disponivel: boolean;
}

// Interface para histórico da OS
export interface HistoricoOS {
  id: string;
  acao: string;
  usuario: string;
  data: string;
  observacoes?: string;
  statusAnterior?: string;
  statusNovo?: string;
}

// Interface principal da OS
export interface OrdemServico extends BaseEntity {
  numeroOS: string; // Número sequencial da OS
  descricao: string;
  local: string;
  ativo: string;
  condicoes: CondicaoOS;
  status: StatusOS;
  tipo: TipoOS;
  prioridade: PrioridadeOS;
  origem: OrigemOS;
  
  // Relacionamentos
  plantaId?: number;
  equipamentoId?: number;
  anomaliaId?: string; // Se originada de anomalia
  tarefaId?: string; // Se originada de tarefa
  
  // Planejamento
  dataPrevisaoInicio?: string;
  dataPrevisaoFim?: string;
  tempoEstimado: number; // em horas
  duracaoEstimada: number; // em horas (pode ser diferente do tempo estimado)
  
  // Execução
  dataInicioExecucao?: string;
  dataFimExecucao?: string;
  tempoRealExecucao?: number;
  
  // Recursos
  materiais: MaterialOS[];
  ferramentas: FerramentaOS[];
  tecnicos: TecnicoOS[];
  
  // Custos
  orcamentoPrevisto?: number;
  custoReal?: number;
  
  // Observações e controle
  observacoes?: string;
  observacoesProgramacao?: string;
  observacoesExecucao?: string;
  motivoCancelamento?: string;
  
  // Campos de auditoria
  criadoPor?: string;
  programadoPor?: string;
  finalizadoPor?: string;
  atualizadoEm?: string;
  
  // Histórico
  historico?: HistoricoOS[];

  // Programação
  dataProgramada?: string;
  horaProgramada?: string;
  responsavel?: string;
  viatura?: number | ViaturaReservadaOS | null; // ✅ ATUALIZADO: pode ser ID ou objeto completo
  time?: string;
}

// Form data para criação/edição
export interface OrdemServicoFormData {
  numeroOS?: string; // Gerado automaticamente na criação
  descricao: string;
  local: string;
  ativo: string;
  condicoes: CondicaoOS;
  tipo: TipoOS;
  prioridade: PrioridadeOS;
  origem: OrigemOS;
  plantaId: number;
  equipamentoId: number;
  anomaliaId?: string;
  tarefaId?: string;
  dataPrevisaoInicio?: string;
  dataPrevisaoFim?: string;
  tempoEstimado: number;
  duracaoEstimada: number;
  observacoes?: string;
  materiais: Omit<MaterialOS, 'id'>[];
  ferramentas: Omit<FerramentaOS, 'id'>[];
  tecnicos: Omit<TecnicoOS, 'id'>[];
  orcamentoPrevisto?: number;

  viatura?: number | ViaturaReservadaOS | null; // ✅ ATUALIZADO
}

// Form data para programação
export interface ProgramacaoOSFormData {
  dataProgramada: string;
  horaProgramada: string;
  responsavel: string;
  viatura?: number | ViaturaReservadaOS | null; // ✅ ATUALIZADO
  time?: string;
  observacoesProgramacao?: string;
  // Confirmação de recursos
  materiaisConfirmados: string[];
  ferramentasConfirmadas: string[];
  tecnicosConfirmados: string[];
}

// Filtros para a página
export interface ProgramacaoOSFilters extends BaseFiltersType {
  status: string;
  tipo: string;
  prioridade: string;
  origem: string;
  planta: string;
  responsavel: string;
  dataProgramada: string;
  periodo: string;
}

// Estado do modal
export interface ModalState {
  isOpen: boolean;
  mode: ModalMode | 'programar'; // Modo adicional para programação
  ordemServico: OrdemServico | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

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
}