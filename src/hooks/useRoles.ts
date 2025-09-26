import { useState, useEffect, useCallback } from 'react';
import { api } from '@/config/api';

// Função para formatar nomes de roles (incluindo mapeamento de constraint DB)
const formatRoleName = (name: string): string => {
  const roleNames: Record<string, string> = {
    'admin': 'Administrador',
    'consultor': 'Consultor',
    'gerente': 'Gerente',
    'vendedor': 'Vendedor',
    // Roles do sistema Spatie que podem existir mas serem mapeadas para roles válidas no DB
    'proprietario': 'Proprietário',
    'user': 'Vendedor',
  };
  return roleNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
};

export interface RoleOption {
  value: string;
  label: string;
  description?: string;
  isActive?: boolean;
  permissions?: {
    id: number;
    name: string;
    guard_name: string;
  }[];
}

interface UseRolesReturn {
  roles: RoleOption[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Chamar API real implementada no backend
      const url = '/roles';
      // console.log('🔍 DEBUG - Fazendo chamada para:', url);
      
      const response = await api.get(url); // Usando a instância configurada da API
      
      // console.log('🔍 DEBUG - Resposta completa da API /roles:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        // console.error('❌ Estrutura inesperada da resposta:', response.data);
        throw new Error('Resposta da API não contém um array de roles');
      }
      
      // console.log('🔍 DEBUG - Roles retornadas da API:', response.data.map((r: any) => r.name));
      
      // Usar todas as roles retornadas pela API
      const rolesData = response.data.map((role: any) => ({
        value: role.name,
        label: formatRoleName(role.name),
        description: `Role: ${role.name}`,
        isActive: true, // Backend roles são sempre ativas
        permissions: role.permissions || [], // ✅ Incluir permissões do backend
      }));
      
      setRoles(rolesData);
      
    } catch (error) {
      // console.error('Erro ao buscar roles:', error);
      // console.log('🔍 DEBUG - Detalhes do erro:', error.message);
      
      setRoles([]);
      setError('Erro ao carregar roles do servidor. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
  };
}

// Hook simplificado para obter apenas os roles como array
export function useRolesList() {
  const { roles, loading, error } = useRoles();
  
  return {
    rolesList: roles.map(role => ({
      value: role.value,
      label: role.label
    })),
    loading,
    error,
  };
}