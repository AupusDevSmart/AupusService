// src/types/base.ts - ATUALIZADO PARA COMPATIBILIDADE
export interface BaseEntity {
  id: string | number; // ✅ ACEITAR TANTO STRING QUANTO NUMBER
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
  created_at?: string | Date; // ✅ COMPATIBILIDADE COM DTO
  updated_at?: string | Date; // ✅ COMPATIBILIDADE COM DTO
}

export type ModalMode = 'create' | 'edit' | 'view';

export interface FormFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onMultipleChange?: (updates: Record<string, unknown>) => void; // ✅ NOVO: Para atualizar múltiplos campos
  disabled: boolean;
  error?: string;
  mode?: ModalMode;
  entity?: BaseEntity | null;
  [key: string]: unknown; // Para props adicionais como dependencies
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea' | 'custom' | 'date' | 'time' | 'rating'; // ✅ ADICIONADO EMAIL
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  validation?: (value: any) => string | null;
  group?: string;
  disabled?: boolean;
  defaultValue?: any;
  render?: (props: any) => React.ReactNode;
  dependencies?: string[]; // ✅ NOVO: Lista de campos dos quais este campo depende
  transform?: (value: any) => any; // ✅ ADICIONADO TRANSFORM
  parse?: (value: any) => any; // ✅ ADICIONADO PARSE
  hint?: string;
  rows?: number; // Para textarea
  min?: number; // Para number
  max?: number; // Para number
  step?: number; // Para number
  multiple?: boolean; // Para select
  showOnlyOnMode?: ModalMode[]; // ✅ NOVO: Mostrar apenas nos modos especificados
  hideOnMode?: ModalMode[]; // ✅ NOVO: Esconder nos modos especificados
  colSpan?: number; // ✅ NOVO: Quantidade de colunas que o campo ocupa
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'multiselect' | 'search' | 'date'; // ✅ ADICIONADO CHECKBOX E DATE
  placeholder?: string;
  options?: { value: string; label: string }[];
  multiple?: boolean;
  defaultValue?: any;
  className?: string; // ✅ NOVO: Classes CSS para o filtro
}

export interface TableColumn<T = BaseEntity> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  className?: string; // ✅ NOVO: Classes CSS para a coluna
  render?: (entity: T, actions?: {
    onCustomAction: (actionKey: string, entity: T) => void;
  }) => React.ReactNode;
}

export interface BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomAction<T = BaseEntity> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  handler: (entity: T) => void;
  condition?: (entity: T) => boolean;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: (entity: T) => boolean;
}

// ✅ INTERFACES PARA MODAL E FORM
export interface BaseModalProps<T extends BaseEntity> {
  isOpen: boolean;
  mode: ModalMode;
  entity: T | null;
  title: string;
  icon?: React.ReactNode;
  formFields: FormField[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  width?: string;
  children?: React.ReactNode;
  groups?: { key: string; title: string }[];
}

export interface BaseTableProps<T extends BaseEntity> {
  data: T[];
  columns: TableColumn<T>[];
  pagination: Pagination;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView?: (entity: T) => void;
  onEdit?: (entity: T) => void;
  onDelete?: (entity: T) => void;
  customActions?: CustomAction<T>[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
}

export interface BaseFormProps {
  fields: FormField[];
  data: any;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (data: any) => void;
  mode?: ModalMode;
  entity?: BaseEntity | null;
  groups?: { key: string; title: string }[];
}

// ✅ TIPOS PARA RESPONSES DA API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: Pagination;
  message?: string;
  success?: boolean;
}

// ✅ TIPOS PARA FILTROS E ORDENAÇÃO
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  [key: string]: any;
}

// ✅ TIPOS PARA VALIDAÇÃO
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ✅ UTILITÁRIOS DE TIPO
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ✅ CONSTANTES ÚTEIS
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;