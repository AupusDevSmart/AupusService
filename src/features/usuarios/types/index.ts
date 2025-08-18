// src/features/usuarios/types/index.ts - COMPATÍVEL COM BaseEntity
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// ============================================================================
// ENUMS E TYPES DO SISTEMA
// ============================================================================

export enum UsuarioStatus {
  ATIVO = 'Ativo',
  INATIVO = 'Inativo',
}

// ✅ ROLES ATIVOS NO SISTEMA
export enum UsuarioRole {
  ADMIN = 'admin',
  GERENTE = 'gerente',
  VENDEDOR = 'vendedor',
  CONSULTOR = 'consultor',
}

// ✅ PERMISSÕES REAIS DO BANCO DE DADOS
export type Permissao =
  // Painel Geral
  | 'PainelGeral'
  | 'PainelGeralOrganizacoes'
  | 'PainelGeralCativos'
  | 'PainelGeralClube'
  // Monitoramento
  | 'MonitoramentoOrganizacoes'
  | 'Monitoramento'
  | 'MonitoramentoConsumo'
  // Sistemas
  | 'NET'
  | 'CRM'
  | 'Oportunidades'
  // Administração
  | 'Usuarios'
  | 'Organizacoes'
  | 'UnidadesConsumidoras'
  | 'Configuracoes'
  | 'Arquivos'
  // Cadastros
  | 'Cadastros'
  | 'CadastroOrganizacoes'
  | 'CadastroUsuarios'
  | 'CadastroUnidadesConsumidoras'
  | 'CadastroConcessionarias'
  // Financeiro
  | 'FinanceiroAdmin'
  | 'Financeiro'
  | 'FinanceiroConsultor'
  // Super Admin
  | 'SuperAdmin'
  // Geração e Energia
  | 'GeracaoEnergia'
  | 'Reclamacoes'
  // Áreas Específicas
  | 'Associados'
  | 'Documentos'
  | 'Prospeccao'
  | 'AreaDoAssociado'
  | 'AreaDoProprietario'
  | 'MinhasUsinas'
  // Novas Permissões
  | 'dashboard.view'
  | 'prospec.view'
  | 'prospec.create'
  | 'prospec.edit'
  | 'prospec.delete'
  | 'controle.view'
  | 'controle.manage'
  | 'ugs.view'
  | 'ugs.create'
  | 'ugs.edit'
  | 'configuracoes.view'
  | 'configuracoes.edit'
  | 'relatorios.view'
  | 'relatorios.export'
  | 'equipe.view'
  | 'equipe.create'
  // Permissões da API que faltavam
  | 'Dashboard'
  | 'GestaoOportunidades'
  | 'Proprietarios'
  | 'Equipamentos'
  | 'Plantas';

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConcessionariaDTO {
  id: string;
  nome: string;
  cnpj?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizacaoDTO {
  id: string;
  nome: string;
  tipo?: string;
  created_at: Date;
  updated_at: Date;
}

// ✅ INTERFACE COMPATÍVEL COM BaseEntity
export interface Usuario extends BaseEntity {
  // ✅ BaseEntity fields - compatíveis
  id: string; // ✅ Agora BaseEntity aceita string
  created_at: Date;
  updated_at: Date;
  criadoEm?: Date; // Alias para compatibilidade
  atualizadoEm?: Date; // Alias para compatibilidade

  // Campos específicos do usuário
  status: UsuarioStatus;
  
  // Relacionamentos organizacionais
  concessionarias?: ConcessionariaDTO[];
  concessionaria_atual_id?: string;
  concessionaria_atual?: ConcessionariaDTO;
  organizacao_atual?: OrganizacaoDTO;
  
  // Dados pessoais
  nome: string;
  email: string;
  telefone?: string;
  instagram?: string;
  cpf_cnpj?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  cep?: string;
  manager_id?: string;
  
  // Permissões e roles
  all_permissions: Permissao[];
  roles: Role[];
  
  // ✅ CAMPOS EXTRAS PARA COMPATIBILIDADE COM FRONTEND EXISTENTE
  tipo?: string; // Computado a partir do role principal
  perfil?: string; // Alias para tipo
  permissao?: Permissao[]; // Alias para all_permissions
  
  // ✅ CAMPOS TEMPORÁRIOS (apenas na criação/reset)
  senhaTemporaria?: string;
  primeiroAcesso?: boolean;
  ultimoLogin?: string;
  
  // ✅ CAMPOS COMPUTADOS
  plantas?: number; // Para proprietários
  isActive?: boolean; // Baseado no status
}

// ✅ FORM DATA PARA CRIAÇÃO/EDIÇÃO (BASEADO NO CreateUsuarioDto)
export interface UsuarioFormData {
  id?: string | number; // ✅ CORREÇÃO: Adicionar id para compatibilidade com BaseEntity
  nome: string;
  email: string;
  telefone?: string;
  instagram?: string;
  status?: string; // ✅ CORREÇÃO: Status como string para o select
  cpfCnpj?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  concessionariaAtualId?: string;
  organizacaoAtualId?: string;
  managerId?: string;
  permissions?: Permissao[];
  roleNames?: string | string[]; // ✅ CORREÇÃO: Pode ser string (do select) ou array
  
  // ✅ COMPATIBILIDADE COM FRONTEND EXISTENTE
  tipo?: string; // Será convertido para roleNames
  permissao?: Permissao[]; // Será convertido para permissions
}

// ✅ DTO PARA TROCA DE SENHA
export interface ChangePasswordDto {
  senhaAtual: string;
  novaSenha: string;
}

// ✅ DTO PARA RESET DE SENHA
export interface ResetPasswordDto {
  novaSenha: string;
  confirmarSenha: string;
}

// ✅ FILTROS COMPATÍVEIS
export interface UsuariosFilters extends BaseFiltersType {
  status?: UsuarioStatus | 'all';
  role?: UsuarioRole | 'all';
  cidade?: string;
  estado?: string;
  concessionariaId?: string;
  organizacaoId?: string;
  includeInactive?: boolean;
  permissions?: string[];
  
  // ✅ COMPATIBILIDADE COM FRONTEND EXISTENTE
  tipo?: string | 'all'; // Será convertido para role
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

// ✅ RESPONSE TYPES DA API
export interface UsuariosResponse {
  data: Usuario[];
  pagination: Pagination;
}

export interface UsuarioResponse extends Usuario {
  senhaTemporaria?: string;
  primeiroAcesso?: boolean;
}

// ✅ MAPEAMENTOS PARA COMPATIBILIDADE FRONTEND ↔ API
export const ROLE_TO_TIPO_MAPPING = {
  'admin': 'Administrador',
  'gerente': 'Gerente',
  'vendedor': 'Vendedor',
  'consultor': 'Consultor',
} as const;

export const TIPO_TO_ROLE_MAPPING = {
  'Administrador': 'admin',
  'Gerente': 'gerente',
  'Vendedor': 'vendedor',
  'Consultor': 'consultor',
} as const;

// ✅ UTILITÁRIOS PARA CONVERSÃO
export const mapUsuarioToFormData = (usuario: Usuario): UsuarioFormData => {
  // Pegar o primeiro role para o select (que espera valor único)
  const primaryRole = usuario.roles?.[0]?.name || 'consultor';
  
  // Normalizar status para o formato esperado pelo select
  let statusNormalizado: string = usuario.status;
  if (usuario.status === UsuarioStatus.ATIVO || String(usuario.status).toLowerCase() === 'ativo') {
    statusNormalizado = 'Ativo';
  } else if (usuario.status === UsuarioStatus.INATIVO || String(usuario.status).toLowerCase() === 'inativo') {
    statusNormalizado = 'Inativo';
  }
  
  const formData = {
    id: usuario.id, // ✅ CORREÇÃO: Incluir id
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    instagram: usuario.instagram,
    status: statusNormalizado,
    cpfCnpj: usuario.cpf_cnpj,
    cidade: usuario.cidade,
    estado: usuario.estado,
    endereco: usuario.endereco,
    cep: usuario.cep,
    bairro: (usuario as any).bairro || '', // Bairro pode não existir no tipo Usuario ainda
    concessionariaAtualId: usuario.concessionaria_atual_id,
    organizacaoAtualId: usuario.organizacao_atual?.id,
    managerId: usuario.manager_id,
    permissions: usuario.all_permissions,
    roleNames: primaryRole, // ✅ CORREÇÃO: Valor único para o select
    // Compatibilidade
    tipo: usuario.roles[0] ? ROLE_TO_TIPO_MAPPING[usuario.roles[0].name as keyof typeof ROLE_TO_TIPO_MAPPING] : undefined,
    permissao: usuario.all_permissions,
  };
  
  return formData;
};

export const mapFormDataToCreateDto = (formData: UsuarioFormData) => {
  
  // ✅ CORREÇÃO: Tratar roleNames como string única (do select)
  let roleNames: string[] = [];
  
  if (formData.roleNames) {
    if (Array.isArray(formData.roleNames)) {
      roleNames = formData.roleNames;
    } else {
      // roleNames agora é uma string única do select
      roleNames = [formData.roleNames as string];
    }
  } else if (formData.tipo) {
    // Converter tipo para role se necessário
    const role = TIPO_TO_ROLE_MAPPING[formData.tipo as keyof typeof TIPO_TO_ROLE_MAPPING];
    if (role) {
      roleNames = [role];
    }
  }
  
  // Se ainda está vazio, usar role padrão
  if (roleNames.length === 0) {
    roleNames = ['consultor'];
  }
  
  
  // Criar objeto limpo sem campos undefined
  const dto: any = {
    nome: formData.nome,
    email: formData.email,
    status: formData.status || UsuarioStatus.ATIVO,
    roleNames: roleNames,
  };

  // Adicionar campos opcionais apenas se tiverem valor
  if (formData.telefone) dto.telefone = formData.telefone;
  if (formData.instagram) dto.instagram = formData.instagram;
  if (formData.cpfCnpj) dto.cpfCnpj = formData.cpfCnpj;
  if (formData.cidade) dto.cidade = formData.cidade;
  if (formData.estado) dto.estado = formData.estado;
  if (formData.endereco) dto.endereco = formData.endereco;
  if (formData.bairro) dto.bairro = formData.bairro;
  if (formData.cep) dto.cep = formData.cep;
  if (formData.concessionariaAtualId) dto.concessionariaAtualId = formData.concessionariaAtualId;
  if (formData.organizacaoAtualId) dto.organizacaoAtualId = formData.organizacaoAtualId;
  if (formData.managerId) dto.managerId = formData.managerId;
  if (formData.permissions && formData.permissions.length > 0) {
    dto.permissions = formData.permissions;
  } else if (formData.permissao && formData.permissao.length > 0) {
    dto.permissions = formData.permissao;
  }

  return dto;
};

// ✅ FUNÇÕES DE UTILIDADE
export const getUserDisplayName = (usuario: Usuario): string => {
  return usuario.nome || usuario.email;
};

export const getUserPrimaryRole = (usuario: Usuario): Role | undefined => {
  return usuario.roles?.[0];
};

export const getUserRoleDisplay = (usuario: Usuario): string => {
  const primaryRole = getUserPrimaryRole(usuario);
  if (!primaryRole) return 'Sem role';
  
  return ROLE_TO_TIPO_MAPPING[primaryRole.name as keyof typeof ROLE_TO_TIPO_MAPPING] || primaryRole.name;
};

export const hasPermission = (usuario: Usuario, permission: Permissao): boolean => {
  return usuario.all_permissions.includes(permission);
};

export const isUsuarioAtivo = (usuario: Usuario): boolean => {
  return usuario.status === UsuarioStatus.ATIVO;
};