// src/hooks/useUserPermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  userPermissionsService, 
  UserPermissionsResponse,
  UserPermissionsSummary,
  UserPermissionsCategorized,
  UserRole,
  UserPermission
} from '@/services/user-permissions.service';

// ==========================================
// 🔵 HOOK PRINCIPAL - GESTÃO COMPLETA
// ==========================================

export interface UseUserPermissionsOptions {
  userId: string;
  autoLoad?: boolean;
  cacheEnabled?: boolean;
}

export function useUserPermissions({ userId, autoLoad = true, cacheEnabled = true }: UseUserPermissionsOptions) {
  const [permissions, setPermissions] = useState<UserPermissionsResponse | null>(null);
  const [summary, setSummary] = useState<UserPermissionsSummary | null>(null);
  const [categorized, setCategorized] = useState<UserPermissionsCategorized | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 📊 CARREGAMENTO DE DADOS
  // ==========================================

  const loadPermissions = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const [permissionsData, summaryData] = await Promise.all([
        userPermissionsService.getUserPermissions(userId),
        userPermissionsService.getUserPermissionsSummary(userId)
      ]);

      setPermissions(permissionsData);
      setSummary(summaryData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar permissões';
      setError(errorMsg);
      // console.error('Erro ao carregar permissões do usuário:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadCategorized = useCallback(async () => {
    if (!userId || categorized) return; // Lazy load

    try {
      const categorizedData = await userPermissionsService.getUserPermissionsCategorized(userId);
      setCategorized(categorizedData);
    } catch (err) {
      // console.error('Erro ao carregar permissões categorizadas:', err);
    }
  }, [userId, categorized]);

  // ==========================================
  // 🔄 GESTÃO DE ROLE
  // ==========================================

  const assignRole = useCallback(async (roleId: number) => {
    if (!userId) return;

    try {
      setLoading(true);
      await userPermissionsService.assignUserRole(userId, roleId);
      
      if (cacheEnabled) {
        userPermissionsService.invalidateUserCache(userId);
      }
      
      await loadPermissions(); // Recarregar dados
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atribuir role';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadPermissions, cacheEnabled]);

  // ==========================================
  // 🔄 GESTÃO DE PERMISSÕES
  // ==========================================

  const assignPermission = useCallback(async (permissionId: number) => {
    if (!userId) return;

    try {
      await userPermissionsService.assignUserPermission(userId, permissionId);
      
      if (cacheEnabled) {
        userPermissionsService.invalidateUserCache(userId);
      }
      
      await loadPermissions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao adicionar permissão';
      setError(errorMsg);
      throw err;
    }
  }, [userId, loadPermissions, cacheEnabled]);

  const removePermission = useCallback(async (permissionId: number) => {
    if (!userId) return;

    try {
      await userPermissionsService.removeUserPermission(userId, permissionId);
      
      if (cacheEnabled) {
        userPermissionsService.invalidateUserCache(userId);
      }
      
      await loadPermissions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao remover permissão';
      setError(errorMsg);
      throw err;
    }
  }, [userId, loadPermissions, cacheEnabled]);

  const syncPermissions = useCallback(async (permissionIds: number[]) => {
    if (!userId) return;

    try {
      setLoading(true);
      await userPermissionsService.syncUserPermissions(userId, permissionIds);
      
      if (cacheEnabled) {
        userPermissionsService.invalidateUserCache(userId);
      }
      
      await loadPermissions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao sincronizar permissões';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadPermissions, cacheEnabled]);

  // ==========================================
  // 🔍 VERIFICAÇÕES DE ACESSO
  // ==========================================

  const checkPermission = useCallback(async (permissionName: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      if (cacheEnabled) {
        return await userPermissionsService.checkPermissionCached(userId, permissionName);
      } else {
        const result = await userPermissionsService.checkUserPermission(userId, permissionName);
        return result.hasPermission;
      }
    } catch (err) {
      // console.error(`Erro ao verificar permissão ${permissionName}:`, err);
      return false;
    }
  }, [userId, cacheEnabled]);

  const checkPermissions = useCallback(async (
    permissionNames: string[], 
    mode: 'any' | 'all' = 'any'
  ): Promise<{ hasPermissions: boolean; details: Record<string, boolean> }> => {
    if (!userId) return { hasPermissions: false, details: {} };

    try {
      return await userPermissionsService.checkUserPermissions(userId, permissionNames, mode);
    } catch (err) {
      // console.error('Erro ao verificar múltiplas permissões:', err);
      return { hasPermissions: false, details: {} };
    }
  }, [userId]);

  // ==========================================
  // 🔄 EFEITOS E INICIALIZAÇÃO
  // ==========================================

  useEffect(() => {
    if (autoLoad && userId) {
      loadPermissions();
    }
  }, [autoLoad, userId, loadPermissions]);

  // ==========================================
  // 🎯 UTILITÁRIOS
  // ==========================================

  const hasPermission = useCallback((permissionName: string): boolean => {
    return permissions?.permissions?.some(p => p.name === permissionName) ?? false;
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.every(name => hasPermission(name));
  }, [hasPermission]);

  const getPermissionsByCategory = useCallback((category: string): UserPermission[] => {
    return categorized?.[category] ?? [];
  }, [categorized]);

  return {
    // Estados
    permissions,
    summary,
    categorized,
    loading,
    error,
    
    // Ações
    loadPermissions,
    loadCategorized,
    assignRole,
    assignPermission,
    removePermission,
    syncPermissions,
    
    // Verificações assíncronas
    checkPermission,
    checkPermissions,
    
    // Verificações síncronas (baseadas em dados carregados)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByCategory,
    
    // Utilitários
    clearCache: () => userPermissionsService.invalidateUserCache(userId),
    invalidateCache: () => userPermissionsService.invalidateUserCache(userId)
  };
}

// ==========================================
// 🔍 HOOK PARA VERIFICAÇÃO SIMPLES
// ==========================================

export function usePermissionCheck(userId: string, permissionName: string, autoCheck = true) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!userId || !permissionName) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await userPermissionsService.checkPermissionCached(userId, permissionName);
      setHasPermission(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao verificar permissão';
      setError(errorMsg);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, [userId, permissionName]);

  useEffect(() => {
    if (autoCheck) {
      check();
    }
  }, [autoCheck, check]);

  return {
    hasPermission,
    loading,
    error,
    check,
    recheck: check
  };
}

// ==========================================
// 🔍 HOOK PARA MÚLTIPLAS VERIFICAÇÕES
// ==========================================

export function useMultiplePermissionCheck(
  userId: string, 
  permissionNames: string[], 
  mode: 'any' | 'all' = 'any',
  autoCheck = true
) {
  const [result, setResult] = useState<{ hasPermissions: boolean; details: Record<string, boolean> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!userId || !permissionNames.length) return;

    try {
      setLoading(true);
      setError(null);
      
      const checkResult = await userPermissionsService.checkUserPermissions(userId, permissionNames, mode);
      setResult(checkResult);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao verificar permissões';
      setError(errorMsg);
      setResult({ hasPermissions: false, details: {} });
    } finally {
      setLoading(false);
    }
  }, [userId, permissionNames, mode]);

  useEffect(() => {
    if (autoCheck) {
      check();
    }
  }, [autoCheck, check]);

  return {
    result,
    hasPermissions: result?.hasPermissions ?? false,
    details: result?.details ?? {},
    loading,
    error,
    check,
    recheck: check
  };
}

// ==========================================
// 📊 HOOK PARA DADOS AUXILIARES
// ==========================================

export function useAvailableRolesAndPermissions() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<UserPermissionsCategorized | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesData, permissionsData, groupedData] = await Promise.all([
        userPermissionsService.getAvailableRoles(),
        userPermissionsService.getAvailablePermissions(),
        userPermissionsService.getAvailablePermissionsGrouped()
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData);
      setGroupedPermissions(groupedData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar dados auxiliares';
      setError(errorMsg);
      // console.error('Erro ao carregar roles e permissões disponíveis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    roles,
    permissions,
    groupedPermissions,
    loading,
    error,
    reload: load
  };
}