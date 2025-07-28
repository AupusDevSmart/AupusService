// src/features/plantas/types/index.ts - ESTRUTURA SIMPLIFICADA
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

export interface Endereco {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

// Tipo simplificado do proprietário para uso nas plantas
export interface ProprietarioBasico {
  id: number;
  razaoSocial: string;
  cnpjCpf: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
}

// ✅ INTERFACE SIMPLIFICADA: Planta agora só tem proprietário e localização
export interface Planta extends BaseEntity {
  nome: string;
  cnpj: string;
  localizacao: string;
  horarioFuncionamento: string;
  endereco: Endereco;
  
  // Relacionamento com proprietário
  proprietarioId: number;
  proprietario?: ProprietarioBasico;
}

// ✅ FORM DATA SIMPLIFICADO: Removidas área/subárea
export interface PlantaFormData {
  nome: string;
  cnpj: string;
  localizacao: string;
  horarioFuncionamento: string;
  endereco: Endereco;
  proprietarioId: number;
}

// ✅ FILTROS SIMPLIFICADOS: Removido filtro de área
export interface PlantasFilters extends BaseFiltersType {
  proprietarioId: string; // Filtro por proprietário
}

export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  planta: Planta | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};