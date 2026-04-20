// src/shared-pages-adapter.tsx
// Adapter to integrate @aupus/shared-pages into the AupusService project.
// Maps Service hooks/stores to the SharedHooks/SharedStores contracts.

import React from 'react';
import { SharedPagesProvider } from '@aupus/shared-pages';
import type { SharedHooks, SharedStores } from '@aupus/shared-pages';
import { api } from '@/config/api';

// ============================================================
// LOCAL STORES
// ============================================================
import { useUserStore } from '@/store/useUserStore';
import { useConcessionariasStore } from '@/store/useConcessionariasStore';

// ============================================================
// LOCAL HOOKS - Equipamentos
// ============================================================
import { useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';
import { useEquipamentoFilters } from '@/features/equipamentos/hooks/useEquipamentoFilters';
import { useLocationCascade } from '@/features/equipamentos/hooks/useLocationCascade';
import { useSelectionData } from '@/features/equipamentos/hooks/useSelectionData';

// ============================================================
// LOCAL HOOKS - Unidades
// ============================================================
import {
  useUnidades,
  useUnidadesByPlanta,
  useUnidade,
  useUnidadeEstatisticas,
  useUnidadeEquipamentos,
} from '@/features/unidades/hooks/useUnidades';
import { usePlantas as usePlantasForUnidadesLocal } from '@/features/unidades/hooks/usePlantas';
import { useProprietarios as useProprietariosForUnidadesLocal } from '@/features/unidades/hooks/useProprietarios';

// ============================================================
// LOCAL HOOKS - Usuarios
// ============================================================
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';

// ============================================================
// LOCAL HOOKS - Plantas (feature-level)
// ============================================================
import { usePlantas as usePlantasLocal } from '@/features/plantas/hooks/usePlantas';
import { useProprietarios as useProprietariosForPlantasLocal } from '@/features/plantas/config/filter-config';

// ============================================================
// LOCAL SERVICE - Concessionarias
// ============================================================
import { ConcessionariasService } from '@/services/concessionarias.services';

// ============================================================
// LOCAL HOOKS - Permissoes & Roles
// ============================================================
import { usePermissoes, usePermissoesGrouped } from '@/hooks/usePermissoes';
import { useRoles } from '@/hooks/useRoles';
import { useUserPermissions as useUserPermissionsLocal, useAvailableRolesAndPermissions } from '@/hooks/useUserPermissions';

// ============================================================
// LOCAL HOOKS - Auxiliar
// ============================================================
import { useCategorias } from '@/hooks/useCategorias';
import { useModelos } from '@/hooks/useModelos';
import { useOrganizacoes } from '@/hooks/useOrganizacoes';

// ============================================================
// WRAPPER HOOKS
// These adapt hook signatures to match SharedHooks contracts.
// ============================================================

/**
 * usePlantasFeature - wraps local usePlantas from features/plantas
 * Contract expects: { loading, plantas, carregarPlantasSimples, obterPlanta }
 */
function usePlantasFeature() {
  return usePlantasLocal();
}

/**
 * useProprietariosForPlantas - wraps local useProprietarios from plantas/config/filter-config
 * Contract expects: { proprietarios, loading, error, refetch }
 */
function useProprietariosForPlantas() {
  return useProprietariosForPlantasLocal();
}

/**
 * usePlantasForUnidades - wraps local usePlantas from features/unidades
 * Contract expects: { plantas, loading, error, refetch }
 */
function usePlantasForUnidades() {
  return usePlantasForUnidadesLocal();
}

/**
 * useProprietariosForUnidades - wraps local useProprietarios from features/unidades
 * Contract expects: { proprietarios, loading, error }
 */
function useProprietariosForUnidades() {
  return useProprietariosForUnidadesLocal();
}

/**
 * useUserPermissionsWrapper - adapts Service's useUserPermissions (object param)
 * to match the contract signature (positional params).
 * Contract expects: (userId: string, autoFetch?: boolean) => { permissions, roles, loading, error, refetch }
 */
function useUserPermissionsWrapper(userId: string, autoFetch: boolean = true) {
  const result = useUserPermissionsLocal({ userId, autoLoad: autoFetch });
  return {
    permissions: result.permissions?.permissions || [],
    roles: result.permissions?.roles || [],
    loading: result.loading,
    error: result.error,
    refetch: result.loadPermissions,
  };
}

/**
 * useConcessionariasFeature - creates a hook that wraps the ConcessionariasService
 * to satisfy the UseConcessionariasFeatureContract.
 */
function useConcessionariasFeature() {
  const [concessionarias, setConcessionarias] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = React.useState<any>({});

  const fetchConcessionarias = React.useCallback(async (currentFilters?: any) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentFilters?.page || filters.page || 1,
        limit: currentFilters?.limit || filters.limit || 10,
        search: currentFilters?.search || filters.search || undefined,
        estado: currentFilters?.estado && currentFilters.estado !== 'all' ? currentFilters.estado : undefined,
        orderBy: 'nome',
        orderDirection: 'asc' as const,
      };
      const response = await ConcessionariasService.getAllConcessionarias(params);
      setConcessionarias(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar concessionarias');
      setConcessionarias([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createConcessionaria = React.useCallback(async (data: any) => {
    const result = await ConcessionariasService.createConcessionaria(data);
    await fetchConcessionarias();
    return result;
  }, [fetchConcessionarias]);

  const updateConcessionaria = React.useCallback(async (id: string, data: any) => {
    const result = await ConcessionariasService.updateConcessionaria(id, data);
    await fetchConcessionarias();
    return result;
  }, [fetchConcessionarias]);

  const deleteConcessionaria = React.useCallback(async (id: string) => {
    await ConcessionariasService.deleteConcessionaria(id);
    await fetchConcessionarias();
  }, [fetchConcessionarias]);

  const getConcessionaria = React.useCallback(async (id: string) => {
    return ConcessionariasService.getConcessionaria(id);
  }, []);

  const handleFilterChange = React.useCallback((newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters }));
  }, []);

  const handlePageChange = React.useCallback((page: number) => {
    setFilters((prev: any) => ({ ...prev, page }));
  }, []);

  const refetch = React.useCallback(() => {
    fetchConcessionarias(filters);
  }, [fetchConcessionarias, filters]);

  return {
    concessionarias,
    loading,
    error,
    pagination,
    filters,
    fetchConcessionarias,
    createConcessionaria,
    updateConcessionaria,
    deleteConcessionaria,
    getConcessionaria,
    handleFilterChange,
    handlePageChange,
    refetch,
  };
}

/**
 * useConcessionariasService - wraps ConcessionariasService.getAllConcessionarias
 * into a hook satisfying UseConcessionariasServiceContract.
 */
function useConcessionariasServiceHook() {
  const getAllConcessionarias = React.useCallback(async (params?: {
    limit?: number;
    estado?: string;
    orderBy?: string;
    orderDirection?: string;
  }) => {
    const response = await ConcessionariasService.getAllConcessionarias({
      limit: params?.limit,
      estado: params?.estado,
      orderBy: params?.orderBy,
      orderDirection: params?.orderDirection as any,
    });
    return { data: response.data, pagination: response.pagination };
  }, []);

  return { getAllConcessionarias };
}

// ============================================================
// SHARED HOOKS & STORES OBJECTS
// ============================================================

const sharedHooks: SharedHooks = {
  // Equipamentos (local)
  useEquipamentos,
  useEquipamentoFilters,
  useLocationCascade,
  useSelectionData: useSelectionData as any,

  // Unidades (local)
  useUnidades: useUnidades as unknown as SharedHooks['useUnidades'],
  useUnidadesByPlanta,
  useUnidade,
  useUnidadeEstatisticas,
  useUnidadeEquipamentos,
  usePlantasForUnidades,
  useProprietariosForUnidades,

  // Usuarios (local)
  useUsuarios,

  // Plantas (local)
  usePlantasFeature,
  useProprietariosForPlantas,

  // Concessionarias (built inline, using local service)
  useConcessionariasFeature,
  useConcessionariasService: useConcessionariasServiceHook as unknown as SharedHooks['useConcessionariasService'],

  // Permissoes & Roles (local)
  usePermissoes,
  usePermissoesGrouped,
  useRoles,
  useUserPermissions: useUserPermissionsWrapper,
  useAvailableRolesAndPermissions,

  // Auxiliares (local)
  useCategorias,
  useModelos,
  useOrganizacoes,
};

const sharedStores: SharedStores = {
  useUserStore: () => useUserStore() as any,
  useConcessionariasStore: () => useConcessionariasStore() as any,
};

// ============================================================
// PROVIDER COMPONENT
// ============================================================

export function ServiceSharedPagesProvider({ children }: { children: React.ReactNode }) {
  return (
    <SharedPagesProvider httpClient={api} hooks={sharedHooks} stores={sharedStores}>
      {children}
    </SharedPagesProvider>
  );
}
