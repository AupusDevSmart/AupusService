// src/features/instrucoes/types/index.ts
import { type ModalMode } from '@/types/base';

export type TipoManutencao = 'PREVENTIVA' | 'PREDITIVA' | 'CORRETIVA' | 'INSPECAO' | 'VISITA_TECNICA';
export type CondicaoAtivo = 'PARADO' | 'FUNCIONANDO' | 'QUALQUER';
export type StatusInstrucao = 'ATIVA' | 'INATIVA' | 'EM_REVISAO' | 'ARQUIVADA';
export type CategoriaTarefa = 'MECANICA' | 'ELETRICA' | 'INSTRUMENTACAO' | 'LUBRIFICACAO' | 'LIMPEZA' | 'INSPECAO' | 'CALIBRACAO' | 'OUTROS';

export interface SubInstrucao {
  id: string;
  descricao: string;
  obrigatoria: boolean;
  tempoEstimado?: number;
  ordem?: number;
}

export interface RecursoInstrucao {
  id: string;
  tipo: 'PECA' | 'MATERIAL' | 'FERRAMENTA' | 'TECNICO' | 'VIATURA';
  descricao: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio: boolean;
}

export interface AnexoInstrucao {
  id: string;
  nome: string;
  tipo: 'MANUAL' | 'PROCEDIMENTO' | 'MODELO_RELATORIO' | 'OUTROS';
  url: string;
  tamanho?: number;
}

export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  instrucao: any | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
