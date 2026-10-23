import { ComponentType, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Os dados do formulario: chave do campo -> valor. O valor de cada campo e o que o campo guardar. */
export type DadosDoFormulario = Record<string, unknown>;

/**
 * A entidade que o BaseModal recebeu, como os callbacks de campo a veem. So o id
 * e garantido; quem precisa de mais declara o tipo da sua entidade no callback
 * (ex.: `condition: (entity?: ExecucaoOS) => ...`). Na criacao costuma vir null.
 */
export type EntidadeDoCampo = ModalEntity<BaseEntity> | null;

/*
 * Sobre os callbacks do contrato de campo (render, component, condition, onChange...):
 * eles sao declarados como METODO, nao como propriedade-funcao. Com metodo, o
 * TypeScript compara o parametro nos dois sentidos — e e isso que deixa um
 * componente declarar o que o campo dele guarda (`value: MaterialItem[]`,
 * `onChange: (v: string) => void`, `entity?: Planta`) e ainda ser aceito, como os
 * handlers de evento do React. Quem escreve o callback inline recebe o tipo geral
 * (`unknown`, `BaseEntity`) e estreita ali.
 */

/**
 * O que o BaseForm passa para `render` de um campo.
 *
 * `value` e `unknown` de proposito: o BaseForm nao sabe o que cada campo guarda.
 * Quem renderiza o campo sabe — e e la que o valor se estreita.
 */
export interface FormFieldProps {
  // Opcional so no tipo (o BaseForm sempre passa): aceita componente que declara `value?`.
  value?: unknown;
  /** Argumentos alem do primeiro sao ignorados pelo BaseForm. */
  onChange(value: unknown, ...ignorados: unknown[]): void;
  disabled?: boolean;
  mode?: ModalMode;
  onMultipleChange?(values: Record<string, unknown>): void;
  /** O formulario inteiro (so `render` recebe; `component` nao). */
  formData?: DadosDoFormulario;
  /** A entidade aberta no modal (ausente ou null na criacao). */
  entity?: EntidadeDoCampo;
  error?: string;
  /** A definicao do proprio campo (opcoes etc.). */
  field?: FormField;
  geral?: unknown;
  recorrente?: unknown;
  // Os campos listados em `dependencies` tambem chegam pelo nome; quem os le
  // declara no tipo das proprias props.
}

/**
 * O que o BaseForm passa para `component` de um campo `custom`: so isto, mais
 * o que `componentProps` trouxer. Nao recebe `formData`, `mode` nem `entity` —
 * para isso use `render`.
 */
export interface FormFieldComponentProps {
  value?: unknown;
  /**
   * O BaseForm sempre passa; opcional so no tipo, para aceitar componente que
   * so exibe. Argumentos alem do primeiro sao ignorados.
   */
  onChange?(value: unknown, ...ignorados: unknown[]): void;
  disabled?: boolean;
}

/** O `component` de um campo `custom` (bivariante, ver acima). */
export type FormFieldComponent = {
  componente(props: FormFieldComponentProps): ReactNode | Promise<ReactNode>;
}['componente'];

/** Opcao de select/combobox de um campo. */
export interface FormFieldOption {
  value: string | number;
  label: string;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea' | 'custom' | 'password' | 'date' | 'time' | 'datetime-local' | 'combobox';
  required?: boolean;
  colSpan?: number;
  /** O BaseForm chama com (entity, formData) — nessa ordem. Vale o truthy/falsy do retorno. */
  condition?(entity: EntidadeDoCampo | undefined, formData: DadosDoFormulario): unknown;
  placeholder?: string;
  defaultValue?: unknown;
  options?: FormFieldOption[];
  /** Mensagem de erro, ou vazio quando o valor serve. */
  validation?(value: unknown, formData?: DadosDoFormulario): string | null | undefined;
  render?(props: FormFieldProps): ReactNode;
  group?: string;
  dependencies?: string[];
  help?: string;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  component?: FormFieldComponent;
  /** Props extras do `component`; como funcao, recebe o formulario inteiro. */
  componentProps?: Record<string, unknown> | ((formData: DadosDoFormulario) => Record<string, unknown>);
  /** Vale o truthy/falsy do retorno. */
  conditionalRender?(formData: DadosDoFormulario): unknown;
  getOptions?(formData: DadosDoFormulario): FormFieldOption[];
  // Lidos pelo BaseForm/BaseModal; vem das configuracoes que usam o FormField de @/types/base.
  showOnlyWhen?: { field: string; value: unknown };
  showOnlyOnMode?: ModalMode | ModalMode[];
  hideOnMode?: ModalMode | ModalMode[];
  /** Vale o truthy/falsy do retorno. */
  computeDisabled?(entity: EntidadeDoCampo | undefined, formData: DadosDoFormulario): unknown;
  excludeFromSubmit?: boolean;
  helpText?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

/** Quando um grupo do formulario aparece: o campo `field` com o valor `value` (ou a funcao decide pela entidade). */
export interface CondicaoDoGrupo {
  field: string;
  /** Funcao: vale o truthy/falsy do retorno. */
  value: string | number | boolean | null | undefined | ((entity: EntidadeDoCampo | undefined) => unknown);
}

export interface GrupoDoFormulario {
  key: string;
  title: string;
  description?: string;
  fields?: string[];
  conditional?: CondicaoDoGrupo;
  /** Colunas da grade do grupo: 3 para linhas de campos curtos; qualquer outro valor (ou nenhum) da duas. */
  columns?: number;
  /** 'single' (ou fullWidth) desliga a grade: um campo por linha. */
  layout?: string;
  fullWidth?: boolean;
}

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  /**
   * No celular a BaseTable troca a tabela por cartoes, e esta e a coluna que
   * vira o titulo do cartao — as demais viram pares rotulo/valor abaixo dela.
   *
   * Sem marcar nenhuma, o titulo e a primeira coluna. Isso serve para a maioria
   * das telas, mas nao quando a primeira coluna e um avatar ou um icone: ai
   * vale apontar a coluna que identifica a linha para quem le.
   */
  primaryOnMobile?: boolean;
}

export type CustomAction<T = unknown> = TableAction<T>;

/** Icone de acao como componente (`Copy`): a BaseTable o cria com `className`. */
export type IconeDeAcao = ComponentType<{ className?: string }>;

export interface TableAction<T = unknown> {
  key: string;
  label: string;
  handler?: (entity: T) => void;
  onClick?: (entity: T) => void;
  condition?: (entity: T) => boolean;
  icon?: ReactNode | IconeDeAcao;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

/** O que a BaseFilters passa para `render` de um filtro `custom`. */
export interface FilterFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}

export interface FilterConfig {
  key: string;
  label?: string;
  type: 'text' | 'select' | 'checkbox' | 'date' | 'search' | 'combobox' | 'custom';
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  render?: (props: FilterFieldProps) => ReactNode;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export type ModalMode = 'create' | 'edit' | 'view' | 'programar' | (string & {});

export interface ModalState<T = unknown> {
  isOpen: boolean;
  mode: ModalMode;
  entity?: T;
}

export type ModalEntity<T> = T;
