// src/features/usuarios/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';
import { Permissao } from '@/types/dtos/usuarios-dto';

export interface Usuario extends BaseEntity {
  nome: string;
  email: string;
  telefone: string;
  instagram?: string;
  tipo: 'Proprietário' | 'Analista' | 'Adm' | 'Técnico' | 'Fornecedor' | 'Técnico Externo';
  status: 'Ativo' | 'Inativo';
  permissao: Permissao[];
  // ✅ NOVO: Controle de senha
  senhaTemporaria?: string; // Senha padrão gerada
  primeiroAcesso: boolean; // Se deve trocar senha no login
  ultimoLogin?: string; // Data do último login
  // Campos específicos para proprietários (compatibilidade)
  plantas?: number;
  razaoSocial?: string;
  cnpjCpf?: string;
  endereco?: {
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  // Computed field para compatibilidade
  perfil?: string; // Alias para 'tipo'
}

export interface UsuarioFormData {
  nome: string;
  email: string;
  telefone: string;
  instagram?: string;
  tipo: 'Proprietário' | 'Analista' | 'Adm' | 'Técnico' | 'Fornecedor' | 'Técnico Externo';
  status: 'Ativo' | 'Inativo';
  permissao: Permissao[];
  // ✅ REMOVIDO: senha manual - será gerada automaticamente
}

export interface UsuariosFilters extends BaseFiltersType {
  status: 'all' | 'Ativo' | 'Inativo';
  tipo: 'all' | 'Proprietário' | 'Analista' | 'Adm' | 'Técnico' | 'Fornecedor' | 'Técnico Externo';
}

export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  usuario: Usuario | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};