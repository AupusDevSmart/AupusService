// src/features/fornecedores/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Enums para os campos de seleção
export type TipoFornecedor = 'pessoa_fisica' | 'pessoa_juridica';
export type StatusFornecedor = 'ativo' | 'inativo' | 'suspenso';

// Interface para endereço
export interface EnderecoFornecedor {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

// Interface para dados específicos de PJ
export interface DadosPessoaJuridica {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoEstadual?: string;
  nomeContato: string;
  tiposMateriais: string[]; // Array de strings
}

// Interface para dados específicos de PF
export interface DadosPessoaFisica {
  nomeCompleto: string;
  cpf: string;
  especialidade: string;
}

// Interface principal do fornecedor
export interface Fornecedor extends BaseEntity {
  tipo: TipoFornecedor;
  
  // Dados comuns
  email: string;
  telefone: string;
  endereco: EnderecoFornecedor;
  observacoes?: string;
  status: StatusFornecedor;
  
  // Dados específicos por tipo (union discriminada)
  dadosPJ?: DadosPessoaJuridica;
  dadosPF?: DadosPessoaFisica;
  
  // Campos calculados/extras
  ultimoContato?: string;
  avaliacaoQualidade?: number; // 1-5 estrelas
}

// Form data para criação/edição
export interface FornecedorFormData {
  tipo: TipoFornecedor;
  email: string;
  telefone: string;
  endereco: EnderecoFornecedor;
  observacoes?: string;
  status: StatusFornecedor;
  
  // Dados PJ
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  nomeContato?: string;
  tiposMateriais?: string[];
  
  // Dados PF
  nomeCompleto?: string;
  cpf?: string;
  especialidade?: string;
}

// Filtros para a página
export interface FornecedoresFilters extends BaseFiltersType {
  tipo: string;
  status: string;
  uf: string;
}

// Estado do modal
export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  fornecedor: Fornecedor | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};