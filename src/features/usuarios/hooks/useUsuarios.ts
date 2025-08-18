// src/features/usuarios/hooks/useUsuarios.ts - COMPATÍVEL COM DTO
import { useState, useEffect, useCallback } from 'react';
import { 
  Usuario, 
  UsuariosFilters, 
  UsuariosResponse, 
  UsuarioFormData,
  UsuarioStatus,
  UsuarioRole,
  mapFormDataToCreateDto,
  mapUsuarioToFormData,
  ChangePasswordDto,
  ResetPasswordDto
} from '../types';

// ✅ API BASE URL
const API_BASE_URL = 'http://localhost:3000/api/v1';

// ✅ SERVICE PARA COMUNICAÇÃO COM API
class UsuariosApiService {
  private baseUrl = `${API_BASE_URL}/usuarios`;

  async findAll(filters: UsuariosFilters): Promise<UsuariosResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.cidade) params.append('cidade', filters.cidade);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.concessionariaId) params.append('concessionariaId', filters.concessionariaId);
    if (filters.organizacaoId) params.append('organizacaoId', filters.organizacaoId);
    if (filters.includeInactive) params.append('includeInactive', 'true');
    if (filters.permissions?.length) {
      filters.permissions.forEach(p => params.append('permissions', p));
    }

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar usuários: ${response.status}`);
    }
    
    const data = await response.json();
    
    // ✅ MAPEAR DADOS PARA COMPATIBILIDADE COM FRONTEND
    const mappedData = {
      ...data,
      data: data.data.map((usuario: any) => this.mapApiResponseToUsuario(usuario))
    };
    
    return mappedData;
  }

  async findOne(id: string): Promise<Usuario> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Usuário não encontrado');
      }
      throw new Error(`Erro ao buscar usuário: ${response.status}`);
    }
    
    const data = await response.json();
    return this.mapApiResponseToUsuario(data);
  }

  async create(data: UsuarioFormData): Promise<Usuario> {
    // ✅ CONVERTER FORM DATA PARA DTO DA API
    const createDto = mapFormDataToCreateDto(data);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createDto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 409) {
        throw new Error('Email já está em uso');
      }
      if (response.status === 400) {
        throw new Error(errorData.message || 'Dados inválidos');
      }
      throw new Error(`Erro ao criar usuário: ${response.status}`);
    }

    const result = await response.json();
    return this.mapApiResponseToUsuario(result);
  }

  async update(id: string, data: Partial<UsuarioFormData>): Promise<Usuario> {
    // ✅ CONVERTER FORM DATA PARA DTO DA API
    const updateDto = mapFormDataToCreateDto(data as UsuarioFormData);

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateDto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error('Usuário não encontrado');
      }
      if (response.status === 409) {
        throw new Error('Email já está em uso');
      }
      throw new Error(errorData.message || `Erro ao atualizar usuário: ${response.status}`);
    }

    const result = await response.json();
    return this.mapApiResponseToUsuario(result);
  }

  async remove(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Usuário não encontrado');
      }
      throw new Error(`Erro ao excluir usuário: ${response.status}`);
    }

    return response.json();
  }

  async changePassword(id: string, data: ChangePasswordDto): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error('Usuário não encontrado');
      }
      if (response.status === 400) {
        throw new Error('Senha atual incorreta');
      }
      throw new Error(errorData.message || `Erro ao alterar senha: ${response.status}`);
    }

    return response.json();
  }

  async resetPassword(id: string, data: ResetPasswordDto): Promise<{ message: string; senhaTemporaria: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/reset-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Usuário não encontrado');
      }
      throw new Error(`Erro ao resetar senha: ${response.status}`);
    }

    return response.json();
  }

  // ✅ MAPEAR RESPOSTA DA API PARA FORMATO DO FRONTEND
  private mapApiResponseToUsuario(apiResponse: any): Usuario {
    return {
      id: apiResponse.id,
      status: apiResponse.status,
      concessionaria_atual_id: apiResponse.concessionaria_atual_id,
      concessionaria_atual: apiResponse.concessionaria_atual,
      organizacao_atual: apiResponse.organizacao_atual,
      nome: apiResponse.nome,
      email: apiResponse.email,
      telefone: apiResponse.telefone,
      instagram: apiResponse.instagram,
      cpf_cnpj: apiResponse.cpf_cnpj,
      cidade: apiResponse.cidade,
      estado: apiResponse.estado,
      endereco: apiResponse.endereco,
      cep: apiResponse.cep,
      manager_id: apiResponse.manager_id,
      all_permissions: apiResponse.all_permissions || [],
      roles: apiResponse.roles || [],
      created_at: new Date(apiResponse.created_at),
      updated_at: new Date(apiResponse.updated_at),
      
      // ✅ CAMPOS DE COMPATIBILIDADE COM FRONTEND EXISTENTE
      tipo: apiResponse.roles?.[0]?.name ? this.mapRoleToTipo(apiResponse.roles[0].name) : 'Proprietário',
      perfil: apiResponse.roles?.[0]?.name ? this.mapRoleToTipo(apiResponse.roles[0].name) : 'Proprietário',
      permissao: apiResponse.all_permissions || [],
      criadoEm: new Date(apiResponse.created_at),
      atualizadoEm: new Date(apiResponse.updated_at),
      isActive: apiResponse.status === UsuarioStatus.ATIVO,
      
      // ✅ CAMPOS EXTRAS SE PRESENTES
      senhaTemporaria: apiResponse.senhaTemporaria,
      primeiroAcesso: apiResponse.primeiroAcesso,
      plantas: apiResponse.plantas || 0,
    };
  }

  // ✅ MAPEAR ROLE PARA TIPO (COMPATIBILIDADE)
  private mapRoleToTipo(role: string): string {
    const mapping = {
      'super-admin': 'Super Administrador',
      'admin': 'Administrador',
      'propietario': 'Proprietário',
      'associado': 'Associado',
      'cativo': 'Cliente Cativo',
      'aupus': 'Colaborador Aupus',
    };
    return mapping[role as keyof typeof mapping] || role;
  }
}

// ✅ INSTÂNCIA DO SERVICE
const usuariosService = new UsuariosApiService();

// ✅ FILTROS INICIAIS
const initialFilters: UsuariosFilters = {
  search: '',
  status: 'all',
  role: 'all',
  page: 1,
  limit: 10,
  includeInactive: false,
};

// ✅ HOOK PRINCIPAL INTEGRADO COM API
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UsuariosFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ✅ FUNÇÃO PARA CARREGAR USUÁRIOS DA API
  const loadUsuarios = useCallback(async (currentFilters: UsuariosFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await usuariosService.findAll(currentFilters);
      
      setUsuarios(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ CARREGAR DADOS INICIAL E QUANDO FILTROS MUDAREM
  useEffect(() => {
    loadUsuarios(filters);
  }, [filters, loadUsuarios]);

  // ✅ HANDLERS PARA FILTROS E PAGINAÇÃO
  const handleFilterChange = useCallback((newFilters: Partial<UsuariosFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset para primeira página ao filtrar
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // ✅ FUNÇÃO PARA REFETCH
  const refetch = useCallback(() => {
    loadUsuarios(filters);
  }, [filters, loadUsuarios]);

  // ✅ OPERAÇÕES CRUD
  const createUsuario = useCallback(async (data: UsuarioFormData): Promise<Usuario> => {
    try {
      setError(null);
      const novoUsuario = await usuariosService.create(data);
      
      // Recarregar lista após criação
      await refetch();
      
      return novoUsuario;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refetch]);

  const updateUsuario = useCallback(async (id: string, data: Partial<UsuarioFormData>): Promise<Usuario> => {
    try {
      setError(null);
      const usuarioAtualizado = await usuariosService.update(id, data);
      
      // Recarregar lista após atualização
      await refetch();
      
      return usuarioAtualizado;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refetch]);

  const deleteUsuario = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await usuariosService.remove(id);
      
      // Recarregar lista após exclusão
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refetch]);

  const changeUserPassword = useCallback(async (id: string, data: ChangePasswordDto) => {
    try {
      setError(null);
      return await usuariosService.changePassword(id, data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar senha';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const resetUserPassword = useCallback(async (id: string, data: ResetPasswordDto) => {
    try {
      setError(null);
      return await usuariosService.resetPassword(id, data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resetar senha';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // ✅ FUNÇÃO PARA BUSCAR UM USUÁRIO ESPECÍFICO
  const findUsuario = useCallback(async (id: string): Promise<Usuario> => {
    try {
      setError(null);
      return await usuariosService.findOne(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // ✅ FUNÇÃO PARA CONVERTER USUÁRIO PARA FORM DATA
  const usuarioToFormData = useCallback((usuario: Usuario): UsuarioFormData => {
    return mapUsuarioToFormData(usuario);
  }, []);

  // ✅ ESTATÍSTICAS RÁPIDAS
  const statistics = {
    totalUsuarios: pagination.total,
    usuariosAtivos: usuarios.filter(u => u.status === UsuarioStatus.ATIVO).length,
    usuariosInativos: usuarios.filter(u => u.status === UsuarioStatus.INATIVO).length,
    gerentes: usuarios.filter(u => u.roles?.some(r => r.name === UsuarioRole.GERENTE)).length,
    administradores: usuarios.filter(u => u.roles?.some(r => r.name === UsuarioRole.ADMIN)).length,
    vendedores: usuarios.filter(u => u.roles?.some(r => r.name === UsuarioRole.VENDEDOR)).length,
    consultores: usuarios.filter(u => u.roles?.some(r => r.name === UsuarioRole.CONSULTOR)).length,
  };

  return {
    // ✅ DADOS
    usuarios,
    loading,
    error,
    pagination,
    filters,
    statistics,

    // ✅ HANDLERS
    handleFilterChange,
    handlePageChange,
    refetch,

    // ✅ CRUD OPERATIONS
    createUsuario,
    updateUsuario,
    deleteUsuario,
    findUsuario,
    changeUserPassword,
    resetUserPassword,

    // ✅ UTILITÁRIOS
    usuarioToFormData,
    clearError: () => setError(null),
    isEmptyResult: usuarios.length === 0 && !loading,
  };
}

// ✅ HOOK SIMPLIFICADO PARA COMPATIBILIDADE
export function useUsuariosSimple() {
  const {
    usuarios,
    loading,
    pagination,
    filters,
    handleFilterChange,
    handlePageChange,
    refetch
  } = useUsuarios();

  return {
    usuarios,
    loading,
    pagination,
    filters,
    handleFilterChange,
    handlePageChange,
    refetch
  };
}

// ✅ HOOK PARA ESTATÍSTICAS
export function useUsuariosStats() {
  const { statistics, loading, error } = useUsuarios();
  return { statistics, loading, error };
}