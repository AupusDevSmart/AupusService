import { ConcessionariaDTO } from "./concessionaria-dto";
import { OrganizacaoDTO } from "./organizacao-dto";

export interface UsuarioDTO {
  id: string;
  status: UsuarioStatus;

  concessionarias?: ConcessionariaDTO[];
  concessionaria_atual_id?: string;
  concessionaria_atual?: ConcessionariaDTO;
  organizacao_atual: OrganizacaoDTO;

  nome: string;
  email: string;
  cpf_cnpj?: string;
  telefone?: string;
  avatar_url?: string;

  // Campos de permissoes retornados pelo /auth/me e /auth/login
  role: UsuarioRole | null;
  role_details?: { id: number; name: string; guard_name: string } | null;
  all_permissions: Permissao[];
  plantas_vinculadas?: string[];

  roles?: Role[];

  proprietarioId?: string;
  token?: string;

  created_at: Date;
  updated_at: Date;
}

export enum UsuarioStatus {
  ATIVO = 'Ativo',
  INATIVO = 'Inativo',
}

/**
 * Roles do sistema, em ordem crescente de privilegio.
 */
export type UsuarioRole =
  | 'operador'
  | 'proprietario'
  | 'analista'
  | 'gerente'
  | 'admin'
  | 'super_admin';

interface Role {
  id: string;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UpdateUsuarioDto {
  nome?: string;
  email?: string;
  telefone?: string;
  cpfCnpj?: string;
}

export interface ChangePasswordDto {
  senhaAtual: string;
  novaSenha: string;
}

/**
 * Permissoes do sistema - sincronizadas com o backend (permissions-structure.ts).
 * Total: 28 permissoes.
 */
export type Permissao =
  | 'dashboard.view'
  | 'plantas.view' | 'plantas.manage' | 'plantas.manage_operadores'
  | 'unidades.view' | 'unidades.manage'
  | 'equipamentos.view' | 'equipamentos.manage'
  | 'anomalias.view' | 'anomalias.manage'
  | 'usuarios.view' | 'usuarios.manage'
  | 'usuarios.create_operador' | 'usuarios.create_proprietario'
  | 'usuarios.create_analista' | 'usuarios.create_admin'
  | 'programacao_os.view' | 'programacao_os.manage'
  | 'programacao_os.aprovar' | 'programacao_os.cancelar'
  | 'execucao_os.view' | 'execucao_os.manage'
  | 'execucao_os.aprovar' | 'execucao_os.cancelar'
  | 'manutencao.manage'
  | 'recursos.manage'
  | 'agenda.manage'
  | 'admin.impersonate';
