// src/types/base.ts - TIPOS BASE CORRIGIDOS
import type { EntidadeDoCampo, FormFieldComponent } from '@/core/types/base';

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
    filters?: Record<string, unknown>;
    sort?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    requestTime?: number;
  };
}

// ✅ CORRIGIDO: Adicionar todos os modos de transição de OS
export type ModalMode = 'create' | 'edit' | 'view' | 'programar' | 'iniciar' | 'pausar' | 'retomar' | 'finalizar' | 'cancelar' | 'anexos';

export interface BaseModalState<T = unknown> {
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
  defaultValue?: unknown;
  min?: number;
  max?: number;
  options?: Array<{ value: string | number; label: string }>;
  // Callbacks como método (não propriedade-função): o componente pode declarar o
  // valor/entidade que espera e continua aceito — ver o comentário em @/core/types/base.
  validation?(value: unknown): string | null;
  render?(props: FormFieldProps): React.ReactElement;
  /** Recebe só value, onChange, disabled e componentProps (sem formData/mode/entity — para isso, render). */
  component?: FormFieldComponent; // ✅ ADICIONADO: Para campos customizados
  /** Props extras do component; como função, recebe o formulário inteiro. */
  componentProps?: Record<string, unknown> | ((formData: Record<string, unknown>) => Record<string, unknown>); // ✅ ADICIONADO: Props para componentes customizados
  disabled?: boolean;
  group?: string;
  condition?(entity?: EntidadeDoCampo, formData?: Record<string, unknown>): unknown;
  showOnlyWhen?: {
    field: string;
    value: unknown;
  };
  showOnlyOnMode?: ModalMode | ModalMode[];
  hideOnMode?: ModalMode | ModalMode[];
  excludeFromSubmit?: boolean; // ✅ NOVO: Excluir campo do envio à API
  dependencies?: string[]; // ✅ ADICIONADO: Para campos que dependem de outros
  colSpan?: number; // ✅ ADICIONADO: Para layout em grid
  helpText?: string; // ✅ ADICIONADO: Texto de ajuda
  computeDisabled?(entity?: EntidadeDoCampo, formData?: Record<string, unknown>): unknown; // ✅ ADICIONADO: Para campos condicionalmente desabilitados
  width?: 'full' | 'half' | 'third' | 'two-thirds' | 'quarter' | 'three-quarters'; // ✅ ADICIONADO: Para controle de largura do campo
  startNewRow?: boolean; // ✅ ADICIONADO: Para forçar nova linha no layout
}

/**
 * O que o BaseForm passa para `render`. `value` é `unknown`: o BaseForm não
 * sabe o que cada campo guarda — quem renderiza estreita.
 */
export interface FormFieldProps {
  value?: unknown;
  /** Argumentos além do primeiro são ignorados pelo BaseForm. */
  onChange(value: unknown, ...ignorados: unknown[]): void;
  onMultipleChange?(updates: Record<string, unknown>): void;
  /** O formulário inteiro: o BaseForm passa para `render` (não para `component`) */
  formData?: Record<string, unknown>;
  disabled?: boolean;
  hasError?: boolean;
  error?: string;
  entity?: EntidadeDoCampo;
  mode?: ModalMode;
}

export interface FilterConfig {
  key: string;
  type: 'search' | 'select' | 'date' | 'custom' | 'combobox';
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
  render?: (props: FilterFieldProps) => React.ReactElement;
}

export interface FilterFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  /**
   * No celular esta coluna vira o TITULO do cartao.
   *
   * O BaseTable ja suportava; este tipo e uma copia local do que vive no
   * shared-pages, e estava atrasado. Sem a propriedade declarada, usar o
   * recurso quebrava o typecheck e o cartao caia na primeira coluna visivel.
   */
  primaryOnMobile?: boolean;
  render?: (item: T) => React.ReactElement | string;
  className?: string;
  width?: string;
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
  filters: Record<string, unknown>;
  config: FilterConfig[];
  onFilterChange: (filters: Partial<Record<string, unknown>>) => void;
  loading?: boolean;
}

// ✅ ADICIONADO: Tipos para componentes de modal
export interface ModalProps<T = unknown> {
  isOpen: boolean;
  mode: ModalMode;
  entity?: T | null;
  title: string;
  icon?: React.ReactElement;
  formFields: FormField[];
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
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
export interface ModalEntity<_T = unknown> extends BaseEntity {
  [key: string]: unknown;
}

// ✅ ADICIONADO: Alias para Pagination
export type Pagination = PaginationMeta;

// ✅ Re-exports para compatibilidade
export type { ModalMode as Mode };
export type { BaseEntity as Entity };
export type { BaseFilters as Filters };