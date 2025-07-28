// src/features/veiculos/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums para os campos de seleção
export type TipoCombustivel = 'gasolina' | 'etanol' | 'diesel' | 'flex' | 'eletrico' | 'hibrido' | 'gnv';
export type StatusVeiculo = 'disponivel' | 'em_uso' | 'manutencao' | 'inativo';
export type TipoDocumentacao = 'ipva' | 'seguro' | 'licenciamento' | 'revisao' | 'outros';

// Interface para documentação
export interface DocumentacaoVeiculo {
  tipo: TipoDocumentacao;
  descricao: string;
  dataVencimento: string;
  valor?: number;
  observacoes?: string;
}

// Interface principal do veículo
export interface Veiculo extends BaseEntity {
  nome: string;
  tipo: 'veiculo'; // Fixo como "Veículo"
  codigoPatrimonial: string;
  placa: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  tipoCombustivel: TipoCombustivel;
  capacidadeCarga: number; // em kg
  autonomiaMedia: number; // km/l
  valorDiaria: number; // R$
  documentacao: DocumentacaoVeiculo[];
  localizacaoAtual: string;
  responsavel: string;
  foto?: string; // URL ou base64
  status: StatusVeiculo;
  
  // Campos calculados/extras
  quilometragem?: number;
  observacoes?: string;
}

// Form data para criação/edição
export interface VeiculoFormData {
  nome: string;
  tipo: 'veiculo';
  codigoPatrimonial: string;
  placa: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  tipoCombustivel: TipoCombustivel;
  capacidadeCarga: number;
  autonomiaMedia: number;
  valorDiaria: number;
  documentacao: DocumentacaoVeiculo[];
  localizacaoAtual: string;
  responsavel: string;
  foto?: string;
  status: StatusVeiculo;
  quilometragem?: number;
  observacoes?: string;
}

// Filtros para a página
export interface VeiculosFilters extends BaseFiltersType {
  tipoCombustivel: string;
  status: string;
  responsavel: string;
  anoFabricacao: string;
}

// Estado do modal
export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  veiculo: Veiculo | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};