// src/services/user-permissions.service.ts
import { api } from '@/config/api';

export interface UserPermission {
  id: number;
  name: string;
  guard_name: string;
  source?: 'role' | 'direct';
}

export interface UserRole {
  id: number;
  name: string;
  guard_name: string;
  permissions?: UserPermission[];
}

export interface UserPermissionsResponse {
  role: UserRole | null;
  permissions: UserPermission[];
}

export interface UserPermissionsDetailedResponse extends UserPermissionsResponse {
  permissionNames: string[];
}

export interface UserPermissionsSummary {
  role: string | null;
  totalPermissions: number;
  rolePermissions: number;
  directPermissions: number;
  categories: string[];
}

export interface UserPermissionsCategorized {
  [category: string]: UserPermission[];
}

export interface PermissionCheckRequest {
  permissionName: string;
}

export interface MultiplePermissionsCheckRequest {
  permissionNames: string[];
  mode: 'any' | 'all';
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
}

export interface MultiplePermissionsCheckResponse {
  hasPermissions: boolean;
  details: Record<string, boolean>;
}

export interface AssignRoleRequest {
  roleId: number;
}

export interface AssignPermissionRequest {
  permissionId: number;
}

export interface SyncPermissionsRequest {
  permissionIds: number[];
}

export interface BulkAssignRolesRequest {
  assignments: Array<{
    userId: string;
    roleId: number;
  }>;
}

export interface BulkAssignPermissionsRequest {
  assignments: Array<{
    userId: string;
    permissionIds: number[];
  }>;
}

export class UserPermissionsService {
  private baseUrl = '/usuarios';

  // ==========================================
  // 🔵 1. CONSULTA DE DADOS
  // ==========================================

  /**
   * 1.2 Buscar Permissões Detalhadas
   * ENDPOINT NECESSÁRIO: GET /usuarios/{id}/permissions
   */
  async getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
    const response = await api.get(`${this.baseUrl}/${userId}/permissions`);
    return response.data;
  }

  /**
   * 1.3 Buscar Permissões com Detalhes Extras
   * ENDPOINT NECESSÁRIO: GET /usuarios/{id}/permissions/detailed
   */
  async getUserPermissionsDetailed(userId: string): Promise<UserPermissionsDetailedResponse> {
    const response = await api.get(`${this.baseUrl}/${userId}/permissions/detailed`);
    return response.data;
  }

  /**
   * 1.4 Buscar Resumo das Permissões
   * ENDPOINT NECESSÁRIO: GET /usuarios/{id}/permissions/summary
   */
  async getUserPermissionsSummary(userId: string): Promise<UserPermissionsSummary> {
    const response = await api.get(`${this.baseUrl}/${userId}/permissions/summary`);
    return response.data;
  }

  /**
   * 1.5 Buscar Permissões Categorizadas
   * ENDPOINT NECESSÁRIO: GET /usuarios/{id}/permissions/categorized
   */
  async getUserPermissionsCategorized(userId: string): Promise<UserPermissionsCategorized> {
    const response = await api.get(`${this.baseUrl}/${userId}/permissions/categorized`);
    return response.data;
  }

  // ==========================================
  // 🟠 2. VERIFICAÇÃO DE ACESSO
  // ==========================================

  /**
   * 2.1 Verificar Uma Permissão
   * ENDPOINT NECESSÁRIO: POST /usuarios/{id}/check-permission
   */
  async checkUserPermission(userId: string, permissionName: string): Promise<PermissionCheckResponse> {
    const response = await api.post(`${this.baseUrl}/${userId}/check-permission`, {
      permissionName
    });
    return response.data;
  }

  /**
   * 2.2 Verificar Múltiplas Permissões
   * ENDPOINT NECESSÁRIO: POST /usuarios/{id}/check-permissions
   */
  async checkUserPermissions(
    userId: string, 
    permissionNames: string[], 
    mode: 'any' | 'all' = 'any'
  ): Promise<MultiplePermissionsCheckResponse> {
    const response = await api.post(`${this.baseUrl}/${userId}/check-permissions`, {
      permissionNames,
      mode
    });
    return response.data;
  }

  // ==========================================
  // 🟢 3. GESTÃO DE ROLES
  // ==========================================

  /**
   * 3.1 Atribuir Role
   * ENDPOINT NECESSÁRIO: POST /usuarios/{id}/assign-role
   */
  async assignUserRole(userId: string, roleId: number): Promise<void> {
    await api.post(`${this.baseUrl}/${userId}/assign-role`, { roleId });
  }

  // ==========================================
  // 🔴 4. GESTÃO DE PERMISSÕES DIRETAS
  // ==========================================

  /**
   * 4.1 Adicionar Permissão Direta
   * ENDPOINT NECESSÁRIO: POST /usuarios/{id}/assign-permission
   */
  async assignUserPermission(userId: string, permissionId: number): Promise<void> {
    await api.post(`${this.baseUrl}/${userId}/assign-permission`, { permissionId });
  }

  /**
   * 4.2 Remover Permissão Direta
   * ENDPOINT NECESSÁRIO: DELETE /usuarios/{id}/remove-permission/{permissionId}
   */
  async removeUserPermission(userId: string, permissionId: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${userId}/remove-permission/${permissionId}`);
  }

  /**
   * 4.3 Sincronizar Permissões Diretas
   * ENDPOINT NECESSÁRIO: POST /usuarios/{id}/sync-permissions
   */
  async syncUserPermissions(userId: string, permissionIds: number[]): Promise<void> {
    await api.post(`${this.baseUrl}/${userId}/sync-permissions`, { permissionIds });
  }

  // ==========================================
  // 🟡 5. OPERAÇÕES EM LOTE
  // ==========================================

  /**
   * 5.1 Atribuir Roles em Lote
   * ENDPOINT NECESSÁRIO: POST /usuarios/bulk/assign-roles
   */
  async bulkAssignRoles(assignments: BulkAssignRolesRequest['assignments']): Promise<void> {
    await api.post(`${this.baseUrl}/bulk/assign-roles`, { assignments });
  }

  /**
   * 5.2 Sincronizar Permissões em Lote
   * ENDPOINT NECESSÁRIO: POST /usuarios/bulk/assign-permissions
   */
  async bulkAssignPermissions(assignments: BulkAssignPermissionsRequest['assignments']): Promise<void> {
    await api.post(`${this.baseUrl}/bulk/assign-permissions`, { assignments });
  }

  // ==========================================
  // 🔵 6. DADOS AUXILIARES
  // ==========================================

  /**
   * 6.1 Listar Roles Disponíveis
   * ENDPOINT NECESSÁRIO: GET /usuarios/available/roles
   */
  async getAvailableRoles(): Promise<UserRole[]> {
    const response = await api.get(`${this.baseUrl}/available/roles`);
    return response.data;
  }

  /**
   * 6.2 Listar Permissões Disponíveis
   * ENDPOINT NECESSÁRIO: GET /usuarios/available/permissions
   */
  async getAvailablePermissions(): Promise<UserPermission[]> {
    const response = await api.get(`${this.baseUrl}/available/permissions`);
    return response.data;
  }

  /**
   * 6.3 Listar Permissões Agrupadas
   * ENDPOINT NECESSÁRIO: GET /usuarios/available/permissions/grouped
   */
  async getAvailablePermissionsGrouped(): Promise<UserPermissionsCategorized> {
    const response = await api.get(`${this.baseUrl}/available/permissions/grouped`);
    return response.data;
  }

  // ==========================================
  // 🔧 UTILITÁRIOS E CACHE
  // ==========================================

  /**
   * Cache inteligente para verificações de permissão
   */
  private permissionCache = new Map<string, { result: boolean; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  async checkPermissionCached(userId: string, permissionName: string): Promise<boolean> {
    const cacheKey = `${userId}:${permissionName}`;
    const cached = this.permissionCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }

    try {
      const result = await this.checkUserPermission(userId, permissionName);
      this.permissionCache.set(cacheKey, {
        result: result.hasPermission,
        timestamp: Date.now()
      });
      return result.hasPermission;
    } catch (error) {
      // console.error(`Erro ao verificar permissão ${permissionName} para usuário ${userId}:`, error);
      return false; // Failsafe: negar acesso em caso de erro
    }
  }

  /**
   * Invalidar cache de um usuário
   */
  invalidateUserCache(userId: string): void {
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * Invalidar todo o cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }
}

// Instância singleton
export const userPermissionsService = new UserPermissionsService();