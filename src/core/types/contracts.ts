import type { AxiosInstance } from 'axios';
import type { DadosDoFormulario, Pagination } from './base';
import type {
  ComponentesGerenciamento,
  Equipamento,
  EquipamentosFilters,
  EstatisticasPlanta,
} from '@/core/features/equipamentos/types';
import type {
  Usuario,
  UsuarioFormData,
  UsuariosFilters,
} from '@/core/features/usuarios/types';
// Os contratos abaixo descrevem os hooks do proprio AupusService que o adapter
// (src/shared-pages-adapter.tsx) entrega ao nucleo. Os tipos de dado vem de onde
// esses hooks os definem.
import type {
  ConcessionariaResponse,
  CreateConcessionariaDto,
  UpdateConcessionariaDto,
} from '@/services/concessionarias.services';
import type { PlantaResponse } from '@/services/plantas.services';
import type {
  PlantaSelection,
  ProprietarioSelection,
  TipoEquipamento as TipoEquipamentoDaSelecao,
  CampoTecnico,
} from '@/services/selection-data.services';
import type { CategoriaEquipamento, TipoEquipamento } from '@/services/tipos-equipamentos.services';
import type {
  UserPermission,
  UserPermissionsResponse,
  UserPermissionsSummary,
  UserRole,
} from '@/services/user-permissions.service';
import type { PermissaoOption } from '@/hooks/usePermissoes';
import type { Role as PapelDoSistema } from '@/hooks/useRoles';
import type { OrganizacaoDTO } from '@/types/dtos/organizacao-dto';
import type { ConcessionariaDTO } from '@/types/dtos/concessionaria-dto';
import type { UsuarioDTO } from '@/types/dtos/usuarios-dto';
import type { SelectionOption as OpcaoDaSelecao } from '@/services/selection-data.services';
import type {
  CreateUnidadeDto as CreateUnidadeDoApp,
  UnidadeFilters as UnidadeFiltersDoApp,
  UpdateUnidadeDto as UpdateUnidadeDoApp,
  Unidade as UnidadeDoApp,
  UnidadeEstatisticas,
  UnidadeEquipamentosResponse,
} from '@/features/unidades/types';

// ============================================================
// STORES
// ============================================================

export interface UserBasic {
  id: string;
  nome: string;
  email: string;
  status: string;
  roles: string[];
  all_permissions: string[];
}

/** O store de usuario do app (src/store/useUserStore), no que o nucleo le. */
export interface UserStoreContract {
  user: UsuarioDTO | null;
  acessivel: string[];
  getUserRole: () => string;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  /**
   * Qualquer uma das permissões basta (como o @Permissions do backend).
   *
   * Metodo, e nao propriedade-funcao, de proposito: o nucleo monta nomes em
   * tempo de execucao (`usuarios.create_${papel}`) e o store do app tipa o
   * parametro como a lista fechada `Permissao`. Em runtime e comparacao de
   * texto; o metodo aceita os dois lados.
   */
  hasPermission(...permissoes: string[]): boolean;
}

export interface ConcessionariaBasic {
  id: string;
  nome: string;
  estado?: string;
  logoUrl?: string;
  documento?: string;
}

/** O store de concessionarias do app (src/store/useConcessionariasStore). */
export interface ConcessionariasStoreContract {
  concessionarias: ConcessionariaDTO[] | null;
  concessionariaAtual: ConcessionariaDTO | null;
  selectedConcessionarias: ConcessionariaDTO[];
  selectAllConcessionarias: boolean;
  setConcessionarias: (items: ConcessionariaDTO[]) => void;
  setConcessionariaAtual: (id: string) => void;
  toggleConcessionaria: (item: ConcessionariaDTO) => void;
  setSelectAllConcessionarias: (selectAll: boolean) => void;
  clearConcessionarias: () => void;
  clearConcessionaria: () => void;
}

export interface SharedStores {
  useUserStore: () => UserStoreContract;
  useConcessionariasStore: () => ConcessionariasStoreContract;
}

// ============================================================
// SHARED TYPES (used across contracts)
// ============================================================

export interface FilterOption {
  value: string;
  label: string;
}

export interface ProprietarioBasico {
  id: string;
  nome?: string;
  email?: string;
  razaoSocial?: string;
  cnpjCpf?: string;
  cpf_cnpj?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
}

export interface PlantaBasic {
  id: string;
  nome: string;
  localizacao?: string;
  cnpj?: string;
  proprietarioId?: string;
  proprietario?: ProprietarioBasico;
}

export interface UnidadeBasic {
  id: string;
  nome: string;
  tipo: string;
  estado?: string;
  cidade?: string;
  plantaId?: string;
}

export interface LocationData {
  proprietarioId?: string;
  plantaId?: string;
  unidadeId?: string;
}

export interface SelectionOption {
  value: string;
  label: string;
}

// ============================================================
// EQUIPAMENTOS CONTRACTS
// ============================================================

/** UC que ainda pode receber componentes (para o seletor de equipamento pai). */
export interface EquipamentoUCDisponivel {
  id: string;
  nome: string;
  fabricante?: string;
  modelo?: string;
  planta?: { id: string; nome: string };
}

export interface UseEquipamentosContract {
  loading: boolean;
  error: string | null;
  equipamentos: Equipamento[];
  equipamentosUC: Equipamento[];
  componentesUAR: Equipamento[];
  totalPages: number;
  currentPage: number;
  total: number;
  /** `data` e o formulario do equipamento (o hook converte para a API). */
  createEquipamento: (data: DadosDoFormulario) => Promise<Equipamento>;
  updateEquipamento: (id: string, data: DadosDoFormulario) => Promise<Equipamento>;
  deleteEquipamento: (id: string) => Promise<void>;
  getEquipamento: (id: string) => Promise<Equipamento>;
  fetchEquipamentos: (params?: EquipamentosFilters) => Promise<Equipamento[]>;
  fetchEquipamentosByPlanta: (plantaId: string, params?: EquipamentosFilters) => Promise<{
    equipamentos: Equipamento[];
    planta: { id: string; nome: string; localizacao: string };
  }>;
  fetchComponentesByEquipamento: (equipamentoId: string) => Promise<Equipamento[]>;
  fetchEquipamentosUCDisponiveis: () => Promise<EquipamentoUCDisponivel[]>;
  fetchComponentesParaGerenciar: (ucId: string) => Promise<ComponentesGerenciamento>;
  salvarComponentesUARLote: (ucId: string, componentes: Partial<Equipamento>[]) => Promise<{
    message: string;
    componentes: Equipamento[];
  }>;
  getEstatisticasPlanta: (plantaId: string) => Promise<EstatisticasPlanta>;
  uploadFoto: (id: string, file: File) => Promise<{ fotoUrl: string }>;
  removeFoto: (id: string) => Promise<{ fotoUrl: null }>;
  /**
   * Cadastra vários equipamentos iguais de uma vez. O bloco comum vale para
   * todos; `itens` traz o que muda entre eles.
   */
  createEquipamentosLote: (
    data: DadosDoFormulario,
    itens: EquipamentoDoLote[],
  ) => Promise<{ total: number; equipamentos: Equipamento[] }>;
  /**
   * De onde continuar a numeração de nomes e TAGs, a partir do que já existe.
   */
  proximoSequencial: (params: {
    unidade_id?: string;
    base_nome?: string;
    base_tag?: string;
  }) => Promise<{ proximo_nome: number; proximo_tag: number }>;
  /** Copia a lista de anexos de um equipamento para outros. */
  replicarAnexos: (
    origemId: string,
    destinoIds: string[],
  ) => Promise<{ total: number; anexos_por_equipamento: number }>;
  clearError: () => void;
  refreshData: () => Promise<void>;
}

/** O que varia entre equipamentos de um mesmo lote. */
export interface EquipamentoDoLote {
  nome: string;
  tag?: string;
  numero_serie?: string;
  localizacao_especifica?: string;
}

export interface UseEquipamentoFiltersContract {
  loadingProprietarios: boolean;
  loadingPlantas: boolean;
  loadingUnidades: boolean;
  proprietarios: FilterOption[];
  plantas: FilterOption[];
  unidades: FilterOption[];
  loadPlantasByProprietario: (proprietarioId: string) => Promise<void>;
  loadUnidadesByPlanta: (plantaId: string) => Promise<void>;
  loadUnidadesByProprietario: (proprietarioId: string) => Promise<void>;
  loadInitialData: () => Promise<void>;
  resetPlantas: () => void;
  resetUnidades: () => void;
  error: string | null;
  clearError: () => void;
}

export interface UseLocationCascadeContract {
  proprietarios: ProprietarioBasico[];
  plantas: PlantaBasic[];
  unidades: UnidadeBasic[];
  selectedProprietarioId: string;
  selectedPlantaId: string;
  selectedUnidadeId: string;
  loadingProprietarios: boolean;
  loadingPlantas: boolean;
  loadingUnidades: boolean;
  error: string | null;
  handleProprietarioChange: (proprietarioId: string) => void;
  handlePlantaChange: (plantaId: string) => void;
  handleUnidadeChange: (unidadeId: string) => void;
  reset: () => void;
}

export interface UseSelectionDataContract {
  loadingProprietarios: boolean;
  loadingPlantas: boolean;
  loadingHierarquia: boolean;
  loadingTipos: boolean;
  loadingUCs: boolean;
  proprietarios: ProprietarioSelection[];
  plantas: PlantaSelection[];
  tiposEquipamentos: TipoEquipamentoDaSelecao[];
  equipamentosUC: OpcaoDaSelecao[];
  fetchProprietarios: () => Promise<ProprietarioSelection[]>;
  fetchPlantas: (proprietarioId?: string) => Promise<PlantaSelection[]>;
  /** O formato de cada nivel depende do nivel pedido. */
  fetchHierarquiaNivel: (nivel: string, parentId?: string) => Promise<unknown[]>;
  fetchTiposEquipamentos: () => Promise<TipoEquipamentoDaSelecao[]>;
  fetchEquipamentosUC: (plantaId?: string) => Promise<OpcaoDaSelecao[]>;
  getProprietarioById: (id: string) => ProprietarioSelection | null;
  getPlantaById: (id: string) => PlantaSelection | null;
  getTipoEquipamentoById: (id: string) => TipoEquipamentoDaSelecao | null;
  getCamposTecnicosPorTipo: (tipo: string) => CampoTecnico[];
  error: string | null;
  clearError: () => void;
}

// ============================================================
// UNIDADES CONTRACTS
// ============================================================

/** Unidades: o formato que a rota /unidades devolve (o `Unidade` da feature). */
export interface UseUnidadesContract {
  unidades: UnidadeDoApp[];
  /** Ausente enquanto a primeira pagina carrega. */
  pagination?: Pagination;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createUnidade: (data: CreateUnidadeDoApp) => Promise<UnidadeDoApp>;
  updateUnidade: (params: { id: string; data: UpdateUnidadeDoApp }) => Promise<UnidadeDoApp>;
  deleteUnidade: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseUnidadesByPlantaContract {
  unidades: UnidadeDoApp[];
  isLoading: boolean;
  error: Error | null;
}

export interface UseUnidadeContract {
  unidade: UnidadeDoApp | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface UseUnidadeEstatisticasContract {
  estatisticas: UnidadeEstatisticas | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface UseUnidadeEquipamentosContract {
  // Nenhuma pagina do nucleo le esta lista ainda; o formato e o da rota /unidades/:id/equipamentos.
  equipamentos: unknown[];
  pagination?: Pagination;
  unidade: UnidadeEquipamentosResponse['unidade'] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface FiltrosDosEquipamentosDaUnidade {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PlantaOption {
  id: string;
  nome: string;
  localizacao?: string;
  cidade?: string;
  uf?: string;
  proprietario?: ProprietarioBasico;
}

export interface UsePlantasForUnidadesContract {
  plantas: PlantaOption[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface ProprietarioOption {
  id: string;
  nome: string;
}

export interface UseProprietariosContract {
  proprietarios: ProprietarioOption[];
  loading: boolean;
  error: string | null;
}

// ============================================================
// USUARIOS CONTRACTS
// ============================================================

export interface UseUsuariosContract {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: UsuariosFilters;
  statistics: {
    totalUsuarios: number;
    usuariosAtivos: number;
    usuariosInativos: number;
    gerentes: number;
    administradores: number;
    vendedores: number;
    consultores: number;
  };
  handleFilterChange: (filters: Partial<UsuariosFilters>) => void;
  handlePageChange: (page: number) => void;
  /** Opcional: liga o seletor de linhas por pagina da tabela de usuarios. */
  handleLimitChange?: (limit: number) => void;
  refetch: () => void;
  // Metodos (e nao propriedades-funcao) de proposito: o formulario do nucleo
  // tipa `permissions` como string[] e o hook do app como a lista fechada
  // `Permissao` — em runtime sao os mesmos nomes; o metodo aceita os dois lados.
  createUsuario(data: UsuarioFormData): Promise<Usuario>;
  updateUsuario(id: string, data: Partial<UsuarioFormData>): Promise<Usuario>;
  deleteUsuario: (id: string) => Promise<void>;
  findUsuario: (id: string) => Promise<Usuario>;
  changeUserPassword: (id: string, data: { senhaAtual: string; novaSenha: string }) => Promise<{ message: string }>;
  resetUserPassword: (id: string, data: { novaSenha: string; confirmarSenha: string }) => Promise<{ message: string; senhaTemporaria: string }>;
  getUserPermissions: (id: string) => Promise<UserPermissionsResponse>;
  getUserPermissionsSummary: (id: string) => Promise<UserPermissionsSummary>;
  checkUserPermission: (id: string, permissionName: string) => Promise<boolean>;
  assignUserRole: (id: string, roleId: number) => Promise<void>;
  syncUserPermissions: (id: string, permissionIds: number[]) => Promise<void>;
  // Metodos pelo mesmo motivo de createUsuario (permissoes string[] x Permissao[]).
  usuarioToFormData(usuario: Usuario): UsuarioFormData;
  usuarioToFormDataAsync(usuario: Usuario): Promise<UsuarioFormData>;
  clearError: () => void;
  isEmptyResult: boolean;
}

// ============================================================
// PLANTAS CONTRACTS
// ============================================================

export interface SimplePlanta {
  id: string;
  nome: string;
  localizacao: string;
}

export interface UsePlantasFeatureContract {
  loading: boolean;
  plantas: SimplePlanta[];
  carregarPlantasSimples: () => Promise<SimplePlanta[]>;
  obterPlanta: (id: string) => Promise<PlantaResponse | null>;
}

export interface UseProprietariosForPlantasContract {
  proprietarios: ProprietarioBasico[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================
// CONCESSIONARIAS CONTRACTS
// ============================================================

/** Filtros da lista de concessionarias (`estado: 'all'` = sem filtro de estado). */
export interface ConcessionariasFiltros {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  orderBy?: string;
  orderDirection?: string;
}

export interface UseConcessionariasFeatureContract {
  concessionarias: ConcessionariaResponse[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: ConcessionariasFiltros;
  fetchConcessionarias: (filters?: ConcessionariasFiltros) => Promise<void>;
  createConcessionaria: (data: CreateConcessionariaDto) => Promise<ConcessionariaResponse>;
  updateConcessionaria: (id: string, data: UpdateConcessionariaDto) => Promise<ConcessionariaResponse>;
  deleteConcessionaria: (id: string) => Promise<void>;
  getConcessionaria: (id: string) => Promise<ConcessionariaResponse>;
  handleFilterChange: (filters: ConcessionariasFiltros) => void;
  handlePageChange: (page: number) => void;
  refetch: () => void;
}

export interface UseConcessionariasServiceContract {
  getAllConcessionarias: (params?: {
    limit?: number;
    estado?: string;
    orderBy?: string;
    orderDirection?: string;
  }) => Promise<{ data: ConcessionariaResponse[]; pagination: Pagination }>;
}

// ============================================================
// PERMISSOES & ROLES CONTRACTS
// ============================================================

export interface UsePermissoesContract {
  permissoes: PermissaoOption[];
  permissoesPorCategoria: Record<string, PermissaoOption[]>;
  loading: boolean;
  error: string | null;
}

export interface UsePermissoesGroupedContract {
  permissoesPorCategoria: Record<string, PermissaoOption[]>;
  loading: boolean;
  error: string | null;
}

export interface UseRolesContract {
  roles: PapelDoSistema[];
  loading: boolean;
  error: string | null;
}

export interface UseUserPermissionsContract {
  permissions: UserPermission[];
  roles: UserRole[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseAvailableRolesAndPermissionsContract {
  roles: UserRole[];
  permissions: UserPermission[];
  loading: boolean;
  error: string | null;
}

// ============================================================
// AUXILIAR CONTRACTS
// ============================================================

export interface UseCategoriasContract {
  categorias: CategoriaEquipamento[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseModelosContract {
  modelos: TipoEquipamento[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseOrganizacoesContract {
  organizacoes: OrganizacaoDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================
// MAIN SHARED HOOKS INTERFACE
// ============================================================

export interface SharedHooks {
  // Equipamentos
  useEquipamentos: () => UseEquipamentosContract;
  useEquipamentoFilters: () => UseEquipamentoFiltersContract;
  useLocationCascade: (initialData?: LocationData) => UseLocationCascadeContract;
  useSelectionData: () => UseSelectionDataContract;

  // Unidades
  useUnidades: (filters?: UnidadeFiltersDoApp) => UseUnidadesContract;
  useUnidadesByPlanta: (plantaId?: string) => UseUnidadesByPlantaContract;
  useUnidade: (id?: string) => UseUnidadeContract;
  useUnidadeEstatisticas: (id?: string) => UseUnidadeEstatisticasContract;
  useUnidadeEquipamentos: (id?: string, filters?: FiltrosDosEquipamentosDaUnidade) => UseUnidadeEquipamentosContract;
  usePlantasForUnidades: () => UsePlantasForUnidadesContract;
  useProprietariosForUnidades: () => UseProprietariosContract;

  // Usuarios
  useUsuarios: () => UseUsuariosContract;

  // Plantas
  usePlantasFeature: () => UsePlantasFeatureContract;
  useProprietariosForPlantas: () => UseProprietariosForPlantasContract;

  // Concessionarias
  useConcessionariasFeature: () => UseConcessionariasFeatureContract;
  useConcessionariasService: () => UseConcessionariasServiceContract;

  // Permissoes e Roles
  usePermissoes: () => UsePermissoesContract;
  usePermissoesGrouped: () => UsePermissoesGroupedContract;
  useRoles: () => UseRolesContract;
  useUserPermissions: (userId: string, autoFetch?: boolean) => UseUserPermissionsContract;
  useAvailableRolesAndPermissions: () => UseAvailableRolesAndPermissionsContract;

  // Auxiliares
  useCategorias: () => UseCategoriasContract;
  useModelos: (params?: { categoriaId?: string; search?: string; autoFetch?: boolean }) => UseModelosContract;
  useOrganizacoes: () => UseOrganizacoesContract;
}

// ============================================================
// PROVIDER PROPS
// ============================================================

export interface SharedPagesProviderProps {
  httpClient: AxiosInstance;
  hooks: SharedHooks;
  stores: SharedStores;
  children: React.ReactNode;
}
