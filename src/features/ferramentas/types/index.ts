// src/features/ferramentas/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums para os campos de seleção
export type StatusFerramenta = 'disponivel' | 'em_uso' | 'manutencao';
export type TipoFerramenta = 'ferramenta'; // Fixo como "Ferramenta"

// Interface principal da ferramenta
export interface Ferramenta extends BaseEntity {
  nome: string;
  tipo: TipoFerramenta; // Fixo como "Ferramenta"
  codigoPatrimonial: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  necessitaCalibracao: boolean;
  proximaDataCalibracao?: string; // Só obrigatório se necessitaCalibracao = true
  valorDiaria: number; // R$
  localizacaoAtual: string;
  responsavel: string;
  dataAquisicao: string;
  status: StatusFerramenta;
  foto?: string; // URL ou base64
  
  // Campos extras/calculados
  observacoes?: string;
  historicoCalibracao?: HistoricoCalibracao[];
}

// Interface para histórico de calibração
export interface HistoricoCalibracao {
  data: string;
  responsavel: string;
  observacoes?: string;
  certificado?: string; // URL do certificado
}

// Form data para criação/edição
export interface FerramentaFormData {
  nome: string;
  tipo: TipoFerramenta;
  codigoPatrimonial: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  necessitaCalibracao: boolean;
  proximaDataCalibracao?: string;
  valorDiaria: number;
  localizacaoAtual: string;
  responsavel: string;
  dataAquisicao: string;
  status: StatusFerramenta;
  foto?: string;
  observacoes?: string;
}

// Filtros para a página
export interface FerramentasFilters extends BaseFiltersType {
  fabricante: string;
  status: string;
  responsavel: string;
  necessitaCalibracao: string;
}

// Estado do modal
export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  ferramenta: Ferramenta | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};