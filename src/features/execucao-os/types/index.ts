// src/features/execucao-os/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';
import { OrdemServico, StatusOS, MaterialOS, FerramentaOS, TecnicoOS } from '@/features/programacao-os/types';

// Status específicos para execução
export type StatusExecucaoOS = 'PROGRAMADA' | 'EM_EXECUCAO' | 'PAUSADA' | 'FINALIZADA' | 'CANCELADA';

// Interface para registro de tempo de execução
export interface RegistroTempoOS {
  id: string;
  osId: string;
  tecnicoId: string;
  tecnicoNome: string;
  dataInicio: string;
  horaInicio: string;
  dataFim?: string;
  horaFim?: string;
  tempoTotal?: number; // em minutos
  atividade: string;
  observacoes?: string;
}

// Interface para materiais consumidos
export interface MaterialConsumido {
  id: string;
  materialId: string;
  descricao: string;
  quantidadePlanejada: number;
  quantidadeConsumida: number;
  unidade: string;
  custo?: number;
  observacoes?: string;
}

// Interface para ferramentas utilizadas
export interface FerramentaUtilizada {
  id: string;
  ferramentaId: string;
  descricao: string;
  utilizada: boolean;
  condicaoAntes: string;
  condicaoDepois: string;
  observacoes?: string;
}

// Interface para fotos/anexos
export interface AnexoOS {
  id: string;
  osId: string;
  tipo: 'foto_antes' | 'foto_durante' | 'foto_depois' | 'documento' | 'laudo';
  nome: string;
  url: string;
  descricao?: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Interface para checklist de atividades
export interface ChecklistAtividade {
  id: string;
  osId: string;
  atividade: string;
  concluida: boolean;
  observacoes?: string;
  concluidaEm?: string;
  concluidaPor?: string;
}

// Interface principal para execução de OS
export interface ExecucaoOS extends BaseEntity {
  // Dados da OS original
  os: OrdemServico;
  
  // Controle de execução
  statusExecucao: StatusExecucaoOS;
  dataInicioReal?: string;
  horaInicioReal?: string;
  dataFimReal?: string;
  horaFimReal?: string;
  tempoTotalExecucao?: number; // em minutos
  
  // Equipe presente
  equipePresente: string[];
  responsavelExecucao: string;
  
  // Recursos utilizados
  materiaisConsumidos: MaterialConsumido[];
  ferramentasUtilizadas: FerramentaUtilizada[];
  
  // Registro de atividades
  registrosTempoTecnicos: RegistroTempoOS[];
  checklistAtividades: ChecklistAtividade[];
  
  // Resultados
  resultadoServico: string;
  problemasEncontrados?: string;
  recomendacoes?: string;
  proximaManutencao?: string;
  
  // Anexos
  anexos: AnexoOS[];
  
  // Aprovação
  aprovadoPor?: string;
  dataAprovacao?: string;
  observacoesAprovacao?: string;
  
  // Qualidade
  avaliacaoQualidade?: number; // 1-5
  observacoesQualidade?: string;
}

// Filtros para a página de execução
export interface ExecucaoOSFilters extends BaseFiltersType {
  statusExecucao: string;
  tipo: string;
  prioridade: string;
  responsavel: string;
  dataExecucao: string;
  periodo: string;
  planta: string;
}

// Form data para iniciar execução
export interface IniciarExecucaoData {
  equipePresente: string[];
  responsavelExecucao: string;
  observacoesInicio?: string;
  checklistInicial?: string[];
}

// Form data para finalizar execução
export interface FinalizarExecucaoData {
  resultadoServico: string;
  problemasEncontrados?: string;
  recomendacoes?: string;
  proximaManutencao?: string;
  materiaisConsumidos: MaterialConsumido[];
  ferramentasUtilizadas: FerramentaUtilizada[];
  avaliacaoQualidade: number;
  observacoesQualidade?: string;
}

// Estado do modal
export interface ExecucaoModalState {
  isOpen: boolean;
  mode: ModalMode | 'iniciar' | 'finalizar' | 'pausar' | 'anexos';
  execucaoOS: ExecucaoOS | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};