// src/features/tarefas/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums para os campos de seleção
export type TipoManutencao = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type FrequenciaTarefa = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'PERSONALIZADA';
export type CondicaoAtivo = 'PARADO' | 'FUNCIONANDO' | 'QUALQUER';
export type StatusTarefa = 'ATIVA' | 'INATIVA' | 'EM_REVISAO' | 'ARQUIVADA';
export type CategoriaTarefa = 'MECANICA' | 'ELETRICA' | 'INSTRUMENTACAO' | 'LUBRIFICACAO' | 'LIMPEZA' | 'INSPECAO' | 'CALIBRACAO' | 'OUTROS';

// Interface para sub-tarefas (checklist)
export interface SubTarefa {
  id: string;
  descricao: string;
  obrigatoria: boolean;
  tempoEstimado?: number; // em minutos
  ordem: number;
}

// Interface para recursos necessários
export interface RecursoTarefa {
  id: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio: boolean;
}

// Interface para anexos
export interface AnexoTarefa {
  id: string;
  nome: string;
  tipo: 'MANUAL' | 'PROCEDIMENTO' | 'MODELO_RELATORIO' | 'OUTROS';
  url: string;
  tamanho?: number;
}

// Interface principal da tarefa (ATUALIZADA)
export interface Tarefa extends BaseEntity {
  // Origem do plano (NOVO)
  planoManutencaoId?: string;
  tarefaTemplateId?: string;
  planoEquipamentoId?: string;

  tag: string; // Código/TAG da tarefa
  descricao: string;
  categoria: CategoriaTarefa;
  tipoManutencao: TipoManutencao;
  frequencia: FrequenciaTarefa;
  frequenciaPersonalizada?: number; // Para frequência personalizada (em dias)
  condicaoAtivo: CondicaoAtivo;
  criticidade: '1' | '2' | '3' | '4' | '5'; // 1=Muito Baixa, 5=Muito Alta
  duracaoEstimada: number; // em horas
  tempoEstimado: number; // em minutos (mais granular)

  // Relacionamentos
  plantaId?: string;
  equipamentoId?: string; // Pode ser UC ou UAR

  // Informações de planejamento
  planejador?: string;
  responsavel?: string;
  observacoes?: string;

  // Status e controle
  status: StatusTarefa;
  ativa: boolean;

  // Customização (NOVO)
  customizada: boolean;
  camposCustomizados?: string[];

  // Sub-estruturas
  subTarefas: SubTarefa[];
  recursos: RecursoTarefa[];
  anexos: AnexoTarefa[];

  // Campos calculados/controle
  proximaExecucao?: string; // ISO date
  ultimaExecucao?: string; // ISO date
  totalExecucoes?: number;
  dataUltimaExecucao?: string; // ISO date - Nova coluna do banco
  numeroExecucoes: number; // Nova coluna do banco

  // Sincronização com plano (NOVO)
  versaoTemplate?: string;
  sincronizada: boolean;
  origemPlano: boolean; // true se veio de plano, false se criada manualmente

  // Campos de auditoria
  criadoPor?: string;
  atualizadoEm?: string;
}

// Form data para criação/edição
export interface TarefaFormData {
  tag: string;
  descricao: string;
  categoria: CategoriaTarefa;
  tipoManutencao: TipoManutencao;
  frequencia: FrequenciaTarefa;
  frequenciaPersonalizada?: number;
  condicaoAtivo: CondicaoAtivo;
  criticidade: '1' | '2' | '3' | '4' | '5';
  duracaoEstimada: number;
  tempoEstimado: number;
  plantaId?: number;
  equipamentoId?: number;
  planejador?: string;
  responsavel?: string;
  observacoes?: string;
  status: StatusTarefa;
  ativa: boolean;
  dataUltimaExecucao?: string; // ISO date string
  numeroExecucoes: number;
  subTarefas: Omit<SubTarefa, 'id'>[];
  recursos: Omit<RecursoTarefa, 'id'>[];
  anexos?: File[];
}

// Filtros para a página (ATUALIZADO)
export interface TarefasFilters extends BaseFiltersType {
  categoria: string;
  tipoManutencao: string;
  frequencia: string;
  status: string;
  planta: string;
  equipamento: string;
  criticidade: string;
  origemPlano: string; // NOVO
  sincronizada: string; // NOVO
}

// Estado do modal
export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  tarefa: Tarefa | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Utilitários (NOVO)
export const TIPOS_ORIGEM_TAREFA = {
  PLANO: 'Gerada de Plano',
  MANUAL: 'Criada Manualmente'
} as const;