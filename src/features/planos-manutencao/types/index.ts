// src/features/planos-manutencao/types/index.ts

import { BaseEntity, BaseFilters } from '@/types/base';
import { 
  TipoManutencao, 
  FrequenciaTarefa, 
  CondicaoAtivo, 
  CategoriaTarefa,
  SubTarefa,
  RecursoTarefa,
  AnexoTarefa
} from '@/features/tarefas/types';

// ✅ PLANO DE MANUTENÇÃO
export interface PlanoManutencao extends BaseEntity {
  nome: string;
  descricao?: string;
  categoria: CategoriaPlano;
  versao: string;
  
  // Templates das tarefas
  tarefasTemplate: TarefaTemplate[];
  
  // Controle
  ativo: boolean;
  publico: boolean;
  
  // Metadados
  criadoPor: string;
  atualizadoEm?: string;
  totalEquipamentos?: number;
  totalTarefasGeradas?: number;
}

// ✅ CATEGORIAS DE PLANOS
export type CategoriaPlano = 
  | 'MOTORES_ELETRICOS' 
  | 'BOMBAS_CENTRIFUGAS' 
  | 'TRANSFORMADORES' 
  | 'COMPRESSORES'
  | 'PAINEIS_ELETRICOS'
  | 'INSTRUMENTACAO'
  | 'OUTROS';

// ✅ TEMPLATE DE TAREFA
export interface TarefaTemplate {
  id: string;
  tagBase: string; // Base para gerar TAG final
  descricao: string;
  categoria: CategoriaTarefa;
  tipoManutencao: TipoManutencao;
  frequencia: FrequenciaTarefa;
  frequenciaPersonalizada?: number;
  condicaoAtivo: CondicaoAtivo;
  criticidade: '1' | '2' | '3' | '4' | '5';
  duracaoEstimada: number;
  tempoEstimado: number;
  
  // Sugestões
  responsavelSugerido?: string;
  observacoesTemplate?: string;
  
  // Sub-estruturas
  subTarefas: Omit<SubTarefa, 'id'>[];
  recursos: Omit<RecursoTarefa, 'id'>[];
  
  // Controle
  ordem: number;
  ativa: boolean;
}

// ✅ ASSOCIAÇÃO PLANO-EQUIPAMENTO
export interface PlanoEquipamento extends BaseEntity {
  planoManutencaoId: string;
  equipamentoId: number;
  plantaId: number;
  
  // Customizações
  responsavelCustomizado?: string;
  observacoesCustomizadas?: string;
  
  // Controle
  ativo: boolean;
  dataAssociacao: string;
  dataDesassociacao?: string;
  associadoPor: string;
}

// ✅ TAREFA ATUALIZADA
export interface TarefaAtualizada extends BaseEntity {
  // Origem
  planoManutencaoId?: string;
  tarefaTemplateId?: string;
  planoEquipamentoId?: string;
  
  // Equipamento
  equipamentoId?: number;
  plantaId?: number;
  
  // Dados da tarefa
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
  
  // Pessoas
  planejador?: string;
  responsavel?: string;
  observacoes?: string;
  
  // Customização
  customizada: boolean;
  camposCustomizados?: string[];
  
  // Status
  status: 'ATIVA' | 'INATIVA' | 'EM_REVISAO' | 'ARQUIVADA';
  ativa: boolean;
  
  // Sub-estruturas
  subTarefas: SubTarefa[];
  recursos: RecursoTarefa[];
  anexos: AnexoTarefa[];
  
  // Execução
  proximaExecucao?: string;
  ultimaExecucao?: string;
  totalExecucoes?: number;
  
  // Sincronização
  versaoTemplate?: string;
  sincronizada: boolean;
  origemPlano?: boolean; // true se veio de plano, false se criada manualmente
}

// ✅ FORM DATA
export interface PlanoManutencaoFormData {
  nome: string;
  descricao?: string;
  categoria: CategoriaPlano;
  versao: string;
  ativo: boolean;
  publico: boolean;
  tarefasTemplate: Omit<TarefaTemplate, 'id'>[];
}

export interface AssociacaoPlanoFormData {
  planoManutencaoId: string;
  equipamentosIds: number[];
  responsavelPadrao?: string;
  observacoesPadrao?: string;
}

// ✅ FILTROS
export interface PlanosFilters extends BaseFilters {
  categoria: string;
  ativo: string;
  publico: string;
}

export interface EquipamentoPlanoInfo {
  equipamentoId: number;
  equipamentoNome: string;
  plantaId: number;
  plantaNome: string;
  planoManutencaoId?: string;
  planoNome?: string;
  dataAssociacao?: string;
  totalTarefas?: number;
  tarefasAtivas?: number;
}

// ✅ ESTATÍSTICAS
export interface EstatisticasPlano {
  totalEquipamentos: number;
  totalTarefas: number;
  equipamentosAtivos: number;
  tarefasVencidas: number;
  tarefasVencendoHoje: number;
  ultimaAssociacao?: string;
}

// ✅ UTILITÁRIOS
export const CATEGORIAS_PLANO_LABELS: Record<CategoriaPlano, string> = {
  MOTORES_ELETRICOS: 'Motores Elétricos',
  BOMBAS_CENTRIFUGAS: 'Bombas Centrífugas', 
  TRANSFORMADORES: 'Transformadores',
  COMPRESSORES: 'Compressores',
  PAINEIS_ELETRICOS: 'Painéis Elétricos',
  INSTRUMENTACAO: 'Instrumentação',
  OUTROS: 'Outros'
};

export const TIPOS_ORIGEM_TAREFA = {
  PLANO: 'Gerada de Plano',
  MANUAL: 'Criada Manualmente'
} as const;