// src/types/base.ts - TIPOS BASE CORRIGIDOS
export interface BaseEntity {
  id: string;
  criadoEm?: string | Date;
  atualizadoEm?: string | Date;
}

export interface BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// ✅ ADICIONADO: Interface para resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ✅ ADICIONADO: Interface para metadados de paginação
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// ✅ ADICIONADO: Interface estendida para resposta paginada com metadados extras
export interface ExtendedPaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  meta?: {
    filters?: Record<string, any>;
    sort?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    requestTime?: number;
  };
}

// ✅ CORRIGIDO: Adicionar 'programar' aos modos válidos
export type ModalMode = 'create' | 'edit' | 'view' | 'programar';

export interface BaseModalState<T = any> {
  isOpen: boolean;
  mode: ModalMode;
  entity: T | null;
}

// ✅ CORRIGIDO: Adicionar 'time' e 'component' aos tipos válidos
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'custom' | 'checkbox' | 'date' | 'datetime-local' | 'time';
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  options?: Array<{ value: string | number; label: string }>;
  validation?: (value: any) => string | null;
  render?: (props: FormFieldProps) => React.ReactElement;
  component?: React.FC<any>; // ✅ ADICIONADO: Para campos customizados
  componentProps?: Record<string, any>; // ✅ ADICIONADO: Props para componentes customizados
  disabled?: boolean;
  group?: string;
  condition?: (entity?: any, formData?: any) => boolean;
  showOnlyWhen?: {
    field: string;
    value: any;
  };
  showOnlyOnMode?: ModalMode | ModalMode[];
  hideOnMode?: ModalMode | ModalMode[];
  excludeFromSubmit?: boolean; // ✅ NOVO: Excluir campo do envio à API
  dependencies?: string[]; // ✅ ADICIONADO: Para campos que dependem de outros
  colSpan?: number; // ✅ ADICIONADO: Para layout em grid
  helpText?: string; // ✅ ADICIONADO: Texto de ajuda
  computeDisabled?: (entity?: any, formData?: any) => boolean; // ✅ ADICIONADO: Para campos condicionalmente desabilitados
}

export interface FormFieldProps {
  value: any;
  onChange: (value: any) => void;
  onMultipleChange?: (updates: Record<string, any>) => void;
  disabled?: boolean;
  hasError?: boolean;
  error?: string;
  entity?: any;
  mode?: ModalMode;
}

export interface FilterConfig {
  key: string;
  type: 'search' | 'select' | 'date' | 'custom';
  label?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
  render?: (props: FilterFieldProps) => React.ReactElement;
}

export interface FilterFieldProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  render?: (item: T) => React.ReactElement | string;
  className?: string;
}

// ✅ ADICIONADO: Tipos para estados de loading
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
}

export interface ListState<T> extends LoadingState {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ✅ ADICIONADO: Tipos para operações CRUD
export interface CreateOperation<TCreate, TEntity> {
  (data: TCreate): Promise<TEntity>;
}

export interface UpdateOperation<TUpdate, TEntity> {
  (id: string, data: TUpdate): Promise<TEntity>;
}

export interface DeleteOperation {
  (id: string): Promise<void>;
}

export interface FindAllOperation<TFilters, TEntity> {
  (filters?: TFilters): Promise<PaginatedResponse<TEntity>>;
}

export interface FindOneOperation<TEntity> {
  (id: string): Promise<TEntity>;
}

// ✅ ADICIONADO: Interface para serviços CRUD genéricos
export interface CrudService<TEntity, TCreate, TUpdate, TFilters = BaseFilters> {
  findAll: FindAllOperation<TFilters, TEntity>;
  findOne: FindOneOperation<TEntity>;
  create: CreateOperation<TCreate, TEntity>;
  update: UpdateOperation<TUpdate, TEntity>;
  delete: DeleteOperation;
}

// ✅ ADICIONADO: Tipos para componentes de tabela
export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  pagination?: PaginationMeta;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactElement;
}

// ✅ ADICIONADO: Tipos para componentes de filtro
export interface FiltersProps {
  filters: Record<string, any>;
  config: FilterConfig[];
  onFilterChange: (filters: Partial<Record<string, any>>) => void;
  loading?: boolean;
}

// ✅ ADICIONADO: Tipos para componentes de modal
export interface ModalProps<T = any> {
  isOpen: boolean;
  mode: ModalMode;
  entity?: T | null;
  title: string;
  icon?: React.ReactElement;
  formFields: FormField[];
  onClose: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  width?: string;
  loading?: boolean;
  loadingText?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  submitButtonText?: string;
}

// ✅ ADICIONADO: Tipos para respostas de API com erro
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// ✅ ADICIONADO: Tipos para hooks personalizados
export interface UseTableResult<T, TFilters> {
  items: T[];
  pagination: PaginationMeta;
  filters: TFilters;
  loading: boolean;
  error?: string;
  setFilters: (filters: Partial<TFilters>) => void;
  handlePageChange: (page: number) => void;
  refresh: () => Promise<void>;
}

export interface UseModalResult<T> {
  modalState: BaseModalState<T>;
  openModal: (mode: ModalMode, entity?: T) => void;
  closeModal: () => void;
}

// ✅ ADICIONADO: Tipos para componentes de modal (legados)
export interface ModalEntity<T = any> extends BaseEntity {
  [key: string]: any;
}

// ✅ ADICIONADO: Alias para Pagination
export type Pagination = PaginationMeta;

// ✅ Re-exports para compatibilidade
export type { ModalMode as Mode };
export type { BaseEntity as Entity };
export type { BaseFilters as Filters };