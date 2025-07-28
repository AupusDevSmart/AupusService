// src/types/base.ts - ATUALIZADO
import React from 'react';

export interface BaseEntity {
  id: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

export type ModalMode = 'create' | 'edit' | 'view';

export interface ModalState<T extends BaseEntity> {
  isOpen: boolean;
  mode: ModalMode;
  entity: T | null;
}

export interface BaseFilters {
  search: string;
  page: number;
  limit: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TableColumn<T extends BaseEntity> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  render?: (entity: T) => React.ReactNode;
}

export interface FilterConfig {
  key: string;
  type: 'text' | 'select' | 'multiselect' | 'search';
  label?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
}

// ✅ ATUALIZADO: Adicionar mode e entity ao FormFieldProps
export interface FormFieldProps {
  value: any;
  onChange: (value: any) => void;
  disabled: boolean;
  error?: string;
  mode?: ModalMode; // ✅ NOVO: Para saber em que modo estamos
  entity?: BaseEntity | null; // ✅ NOVO: Para acessar dados da entidade
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'custom';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: any; label: string }>;
  validation?: (value: any) => string | null;
  render?: React.ComponentType<FormFieldProps>; // ✅ Usar ComponentType para melhor tipagem
  group?: string;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
}

export interface UseGenericTableProps<T extends BaseEntity, F extends BaseFilters> {
  data: T[];
  initialFilters: F;
  searchFields: (keyof T | string)[];
}

export interface UseGenericTableReturn<T extends BaseEntity, F extends BaseFilters> {
  paginatedData: T[];
  pagination: Pagination;
  filters: F;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleFilterChange: (key: keyof F, value: any) => void;
  handlePageChange: (page: number) => void;
}