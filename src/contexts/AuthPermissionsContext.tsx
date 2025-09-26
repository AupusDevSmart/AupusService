// src/contexts/AuthPermissionsContext.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { UserPermissionsResponse, UserPermissionsSummary } from '@/services/user-permissions.service';

// Interface para o contexto
interface AuthPermissionsContextType {
  // Estados
  permissions: UserPermissionsResponse | null;
  summary: UserPermissionsSummary | null;
  loading: boolean;
  error: string | null;
  
  // Verificações síncronas (baseadas em dados já carregados)
  hasPermission: (permissionName: string) => boolean;
  hasAnyPermission: (permissionNames: string[]) => boolean;
  hasAllPermissions: (permissionNames: string[]) => boolean;
  
  // Verificações assíncronas (fazem chamada para API)
  checkPermission: (permissionName: string) => Promise<boolean>;
  
  // Dados do usuário
  userId: string | null;
  userRole: string | null;
  
  // Ações
  refreshPermissions: () => Promise<void>;
  clearCache: () => void;
}

// Context
const AuthPermissionsContext = createContext<AuthPermissionsContextType | undefined>(undefined);

// Provider Props
interface AuthPermissionsProviderProps {
  children: ReactNode;
  userId: string | null; // Vem do sistema de auth atual
}

// Provider Component
export function AuthPermissionsProvider({ children, userId }: AuthPermissionsProviderProps) {
  const {
    permissions,
    summary,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    loadPermissions,
    clearCache
  } = useUserPermissions({
    userId: userId || '',
    autoLoad: !!userId,
    cacheEnabled: true
  });

  // Refresh permissions quando userId mudar
  useEffect(() => {
    if (userId) {
      loadPermissions();
    }
  }, [userId, loadPermissions]);

  const contextValue: AuthPermissionsContextType = {
    // Estados
    permissions,
    summary,
    loading,
    error,
    
    // Verificações síncronas
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Verificações assíncronas
    checkPermission,
    
    // Dados do usuário
    userId,
    userRole: permissions?.role?.name || null,
    
    // Ações
    refreshPermissions: loadPermissions,
    clearCache
  };

  return (
    <AuthPermissionsContext.Provider value={contextValue}>
      {children}
    </AuthPermissionsContext.Provider>
  );
}

// Hook para usar o contexto
export function useAuthPermissions() {
  const context = useContext(AuthPermissionsContext);
  
  if (context === undefined) {
    throw new Error('useAuthPermissions deve ser usado dentro de um AuthPermissionsProvider');
  }
  
  return context;
}

// ==========================================
// 🛡️ HOOKS UTILITÁRIOS
// ==========================================

/**
 * Hook para verificar uma permissão específica do usuário atual
 */
export function useCurrentUserPermission(permissionName: string) {
  const { hasPermission, checkPermission, loading, error } = useAuthPermissions();
  
  return {
    hasPermission: hasPermission(permissionName),
    checkPermission: () => checkPermission(permissionName),
    loading,
    error
  };
}

/**
 * Hook para verificar múltiplas permissões do usuário atual
 */
export function useCurrentUserPermissions(permissionNames: string[], mode: 'any' | 'all' = 'any') {
  const { hasAnyPermission, hasAllPermissions, loading, error } = useAuthPermissions();
  
  const hasPermissions = mode === 'any' 
    ? hasAnyPermission(permissionNames)
    : hasAllPermissions(permissionNames);
  
  return {
    hasPermissions,
    loading,
    error
  };
}

/**
 * Hook para dados do role atual
 */
export function useCurrentUserRole() {
  const { permissions, summary, userRole, loading, error } = useAuthPermissions();
  
  return {
    role: permissions?.role || null,
    roleName: userRole,
    rolePermissions: permissions?.permissions?.filter(p => p.source === 'role') || [],
    directPermissions: permissions?.permissions?.filter(p => p.source === 'direct') || [],
    summary,
    loading,
    error
  };
}

// ==========================================
// 🛡️ COMPONENTES GUARD PARA USUÁRIO ATUAL
// ==========================================

interface CurrentUserPermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

export function CurrentUserPermissionGuard({
  permission,
  children,
  fallback,
  loading: loadingComponent
}: CurrentUserPermissionGuardProps) {
  const { hasPermission, loading, userId } = useAuthPermissions();

  if (!userId) {
    return fallback || (
      <div className="text-center p-4 text-muted-foreground">
        Usuário não autenticado
      </div>
    );
  }

  if (loading) {
    return loadingComponent || (
      <div className="text-center p-4 text-muted-foreground">
        Verificando permissões...
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return fallback || (
      <div className="text-center p-4 text-red-600">
        Acesso negado
      </div>
    );
  }

  return <>{children}</>;
}

interface CurrentUserMultiplePermissionGuardProps {
  permissions: string[];
  mode?: 'any' | 'all';
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

export function CurrentUserMultiplePermissionGuard({
  permissions,
  mode = 'any',
  children,
  fallback,
  loading: loadingComponent
}: CurrentUserMultiplePermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions, loading, userId } = useAuthPermissions();

  if (!userId) {
    return fallback || (
      <div className="text-center p-4 text-muted-foreground">
        Usuário não autenticado
      </div>
    );
  }

  if (loading) {
    return loadingComponent || (
      <div className="text-center p-4 text-muted-foreground">
        Verificando permissões...
      </div>
    );
  }

  const hasPermissions = mode === 'any' 
    ? hasAnyPermission(permissions)
    : hasAllPermissions(permissions);

  if (!hasPermissions) {
    return fallback || (
      <div className="text-center p-4 text-red-600">
        Permissões insuficientes
      </div>
    );
  }

  return <>{children}</>;
}

// ==========================================
// 🎯 HOC PARA COMPONENTES
// ==========================================

/**
 * HOC que protege componentes com verificação de permissão
 */
export function withCurrentUserPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallbackComponent?: React.ComponentType<P>
) {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission, loading } = useAuthPermissions();

    if (loading) {
      return <div>Carregando...</div>;
    }

    if (!hasPermission(permission)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      return <div>Acesso negado</div>;
    }

    return <Component {...props} />;
  };
}