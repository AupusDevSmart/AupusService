// src/services/user-permissions.service.ts

import { api } from '@/config/api';

export interface Permission {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  guard_name?: string;
  source?: 'role' | 'direct';
}

export interface Role {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  guard_name?: string;
}

export interface UserPermissionsResponse {
  userId: string;
  roles: Role[];
  permissions: Permission[];
  allPermissions: Permission[];
}

export interface UserPermissionsSummary {
  userId: string;
  roleNames: string[];
  permissionNames: string[];
  totalPermissions: number;
  totalRoles: number;
}

export interface CheckPermissionResponse {
  hasPermission: boolean;
  source?: 'role' | 'direct' | 'none';
}

// Aliases de compatibilidade para hooks externos
export type UserPermission = Permission;
export type UserRole = Role;
export type UserPermissionsCategorized = Record<string, Permission[]>;

class UserPermissionsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user's cache key
   */
  private getCacheKey(userId: string, type: string): string {
    return `user_${userId}_${type}`;
  }

  /**
   * Get data from cache if still valid
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Save data to cache
   */
  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all permissions for a user (from roles and direct permissions)
   */
  async getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
    const cacheKey = this.getCacheKey(userId, 'permissions');
    const cached = this.getFromCache<UserPermissionsResponse>(cacheKey);

    if (cached) {
      console.log(`🔍 [UserPermissionsService] Usando cache para permissões do usuário ${userId}`);
      return cached;
    }

    try {
      console.log(`📡 [UserPermissionsService] Buscando permissões do usuário ${userId}`);
      const response = await api.get(`/usuarios/${userId}/permissions`);
      const data = response.data;

      const result: UserPermissionsResponse = {
        userId,
        roles: data.roles || [],
        permissions: data.permissions || [],
        allPermissions: data.all_permissions || data.allPermissions || [],
      };

      this.saveToCache(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao buscar permissões:`, error);
      // Return empty permissions if endpoint doesn't exist
      if (error.response?.status === 404) {
        return {
          userId,
          roles: [],
          permissions: [],
          allPermissions: [],
        };
      }
      throw error;
    }
  }

  /**
   * Get summary of user's permissions
   */
  async getUserPermissionsSummary(userId: string): Promise<UserPermissionsSummary> {
    const cacheKey = this.getCacheKey(userId, 'summary');
    const cached = this.getFromCache<UserPermissionsSummary>(cacheKey);

    if (cached) {
      console.log(`🔍 [UserPermissionsService] Usando cache para resumo do usuário ${userId}`);
      return cached;
    }

    try {
      console.log(`📡 [UserPermissionsService] Buscando resumo de permissões do usuário ${userId}`);
      const response = await api.get(`/usuarios/${userId}/permissions/summary`);
      const data = response.data;

      const result: UserPermissionsSummary = {
        userId,
        roleNames: data.roles || data.roleNames || [],
        permissionNames: data.permissions || data.permissionNames || [],
        totalPermissions: data.totalPermissions || data.permissions?.length || 0,
        totalRoles: data.totalRoles || data.roles?.length || 0,
      };

      this.saveToCache(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao buscar resumo:`, error);
      // Fallback: build summary from full permissions
      if (error.response?.status === 404) {
        try {
          const fullPermissions = await this.getUserPermissions(userId);
          const result: UserPermissionsSummary = {
            userId,
            roleNames: fullPermissions.roles.map((r) => r.name),
            permissionNames: fullPermissions.allPermissions.map((p) => p.name),
            totalPermissions: fullPermissions.allPermissions.length,
            totalRoles: fullPermissions.roles.length,
          };
          this.saveToCache(cacheKey, result);
          return result;
        } catch {
          return {
            userId,
            roleNames: [],
            permissionNames: [],
            totalPermissions: 0,
            totalRoles: 0,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Check if user has a specific permission
   */
  async checkUserPermission(
    userId: string,
    permissionName: string
  ): Promise<CheckPermissionResponse> {
    try {
      console.log(
        `🔍 [UserPermissionsService] Verificando permissão "${permissionName}" para usuário ${userId}`
      );

      // Try to use dedicated endpoint first
      try {
        const response = await api.get(`/usuarios/${userId}/permissions/check`, {
          params: { permission: permissionName },
        });
        return {
          hasPermission: response.data.hasPermission || response.data.has_permission || false,
          source: response.data.source,
        };
      } catch (error: any) {
        // If endpoint doesn't exist, check permissions manually
        if (error.response?.status === 404) {
          const permissions = await this.getUserPermissions(userId);
          const hasPermission = permissions.allPermissions.some(
            (p) => p.name === permissionName
          );
          return { hasPermission, source: hasPermission ? 'role' : 'none' };
        }
        throw error;
      }
    } catch (error: any) {
      console.error(
        `❌ [UserPermissionsService] Erro ao verificar permissão "${permissionName}":`,
        error
      );
      return { hasPermission: false, source: 'none' };
    }
  }

  /**
   * Assign a role to a user
   */
  async assignUserRole(userId: string, roleId: number): Promise<void> {
    try {
      console.log(`📝 [UserPermissionsService] Atribuindo role ${roleId} ao usuário ${userId}`);
      await api.post(`/usuarios/${userId}/roles`, { roleId });
      this.invalidateUserCache(userId);
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao atribuir role:`, error);
      throw error;
    }
  }

  /**
   * Sync user permissions (replace all direct permissions)
   */
  async syncUserPermissions(userId: string, permissionIds: number[]): Promise<void> {
    try {
      console.log(
        `📝 [UserPermissionsService] Sincronizando ${permissionIds.length} permissões para usuário ${userId}`
      );
      await api.post(`/usuarios/${userId}/permissions/sync`, { permissions: permissionIds });
      this.invalidateUserCache(userId);
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao sincronizar permissões:`, error);
      throw error;
    }
  }

  /**
   * Get permissions categorized by group
   */
  async getUserPermissionsCategorized(userId: string): Promise<UserPermissionsCategorized> {
    try {
      const response = await api.get(`/usuarios/${userId}/permissions/categorized`);
      return (response.data || {}) as UserPermissionsCategorized;
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao buscar permissões categorizadas:`, error);
      return {};
    }
  }

  /**
   * Assign a direct permission to a user
   */
  async assignUserPermission(userId: string, permissionId: number): Promise<void> {
    try {
      await api.post(`/usuarios/${userId}/permissions`, { permissionId });
      this.invalidateUserCache(userId);
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao atribuir permissão:`, error);
      throw error;
    }
  }

  /**
   * Remove a direct permission from a user
   */
  async removeUserPermission(userId: string, permissionId: number): Promise<void> {
    try {
      await api.delete(`/usuarios/${userId}/permissions/${permissionId}`);
      this.invalidateUserCache(userId);
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao remover permissão:`, error);
      throw error;
    }
  }

  /**
   * Check a permission using cache (boolean result)
   */
  async checkPermissionCached(userId: string, permissionName: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(userId, `check_${permissionName}`);
    const cached = this.getFromCache<boolean>(cacheKey);
    if (cached !== null) return cached;

    const result = await this.checkUserPermission(userId, permissionName);
    this.saveToCache(cacheKey, result.hasPermission);
    return result.hasPermission;
  }

  /**
   * Check multiple permissions at once
   */
  async checkUserPermissions(
    userId: string,
    permissionNames: string[],
    mode: 'any' | 'all' = 'any'
  ): Promise<{ hasPermissions: boolean; details: Record<string, boolean> }> {
    try {
      const response = await api.post(`/usuarios/${userId}/permissions/check-multiple`, {
        permissions: permissionNames,
        mode,
      });
      return {
        hasPermissions: response.data?.hasPermissions ?? false,
        details: response.data?.details ?? {},
      };
    } catch (error: any) {
      // Fallback: iterar localmente
      const details: Record<string, boolean> = {};
      for (const name of permissionNames) {
        const res = await this.checkUserPermission(userId, name);
        details[name] = res.hasPermission;
      }
      const values = Object.values(details);
      const hasPermissions = mode === 'all' ? values.every(Boolean) : values.some(Boolean);
      return { hasPermissions, details };
    }
  }

  /**
   * Get all available roles in the system
   */
  async getAvailableRoles(): Promise<Role[]> {
    try {
      const response = await api.get('/roles');
      return (response.data || []) as Role[];
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao buscar roles:`, error);
      return [];
    }
  }

  /**
   * Get all available permissions in the system
   */
  async getAvailablePermissions(): Promise<Permission[]> {
    try {
      const response = await api.get('/permissions');
      return (response.data || []) as Permission[];
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao buscar permissões:`, error);
      return [];
    }
  }

  /**
   * Get all available permissions grouped
   */
  async getAvailablePermissionsGrouped(): Promise<UserPermissionsCategorized> {
    try {
      const response = await api.get('/permissions/grouped');
      return (response.data || {}) as UserPermissionsCategorized;
    } catch (error: any) {
      console.error(`❌ [UserPermissionsService] Erro ao buscar permissões agrupadas:`, error);
      return {};
    }
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUserCache(userId: string): void {
    console.log(`🗑️ [UserPermissionsService] Invalidando cache do usuário ${userId}`);
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith(`user_${userId}_`)
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    console.log(`🗑️ [UserPermissionsService] Limpando todo o cache`);
    this.cache.clear();
  }
}

// Export singleton instance
export const userPermissionsService = new UserPermissionsService();
