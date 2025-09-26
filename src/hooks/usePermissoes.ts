import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/config/api';
import { Permissao } from '@/features/usuarios/types';

// Removed hardcoded categorization function - backend should provide grouped permissions

export interface PermissaoOption {
  value: Permissao;
  label: string;
  categoria: string;
  description?: string;
  isActive?: boolean;
  id?: number; // ✅ Campo do backend
  guard_name?: string; // ✅ Campo do backend
}

interface UsePermissoesReturn {
  permissoes: PermissaoOption[];
  permissoesPorCategoria: Record<string, PermissaoOption[]>;
  categorias: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePermissoes(): UsePermissoesReturn {
  const [permissoes, setPermissoes] = useState<PermissaoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Chamar API real implementada no backend
      const url = '/permissions';
      // console.log('🔍 DEBUG - Fazendo chamada para:', url);
      
      const response = await api.get(url); // Usando a instância configurada da API
      
      // console.log('🔍 DEBUG - Resposta completa da API /permissions:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        // console.error('❌ Estrutura inesperada da resposta:', response.data);
        throw new Error('Resposta da API não contém um array de permissões');
      }
      
      const permissoesData = response.data.map((permission: any) => ({
        value: permission.name,
        label: permission.name,
        categoria: permission.category || 'Sem Categoria', // Backend deve fornecer categoria
        description: `Permissão: ${permission.name}`,
        isActive: true,
        id: permission.id,
        guard_name: permission.guard_name,
      }));
      
      setPermissoes(permissoesData);
      
      // Alternativa: usar endpoint /permissions/grouped se disponível para otimização
      // const groupedResponse = await axios.get('/permissions/grouped');
      // if (groupedResponse.data) {
      //   // Processar dados já agrupados por categoria do backend
      // }
      
    } catch (error) {
      // console.error('Erro ao buscar permissões:', error);
      // console.log('🔍 DEBUG - Detalhes do erro:', error.message);
      
      setPermissoes([]);
      setError('Erro ao carregar permissões do servidor. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Agrupar permissões por categoria
  const permissoesPorCategoria = useMemo(() => {
    return permissoes.reduce((acc, permissao) => {
      const categoria = permissao.categoria;
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(permissao);
      return acc;
    }, {} as Record<string, PermissaoOption[]>);
  }, [permissoes]);

  // Lista de categorias únicas
  const categorias = useMemo(() => {
    return Object.keys(permissoesPorCategoria).sort();
  }, [permissoesPorCategoria]);

  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  return {
    permissoes,
    permissoesPorCategoria,
    categorias,
    loading,
    error,
    refetch: fetchPermissoes,
  };
}

// Hook simplificado para obter apenas as permissões como array
export function usePermissoesList() {
  const { permissoes, loading, error } = usePermissoes();
  
  return {
    permissoesList: permissoes.map(perm => ({
      value: perm.value,
      label: perm.label,
      categoria: perm.categoria
    })),
    loading,
    error,
  };
}

// Hook otimizado usando endpoint /permissions/grouped
export function usePermissoesGrouped() {
  const [permissoesPorCategoria, setPermissoesPorCategoria] = useState<Record<string, PermissaoOption[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupedPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // console.log('🔍 DEBUG - Fazendo chamada para /permissions/grouped');
      
      // Usar endpoint otimizado que já retorna dados agrupados
      const response = await api.get('/permissions/grouped');
      
      // console.log('🔍 DEBUG - Resposta /permissions/grouped:', response.data);
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Resposta da API não contém um objeto de permissões agrupadas');
      }
      
      // Converter para formato esperado pelo frontend usando dados do backend
      const groupedData: Record<string, PermissaoOption[]> = {};
      
      Object.entries(response.data).forEach(([categoria, permissions]: [string, any[]]) => {
        if (Array.isArray(permissions)) {
          groupedData[categoria] = permissions.map((permission: any) => ({
            value: permission.name,
            label: permission.name,
            categoria: categoria, // Usar categoria do backend
            description: `Permissão: ${permission.name}`,
            isActive: true,
            // Campos extras do backend se necessários
            id: permission.id,
            guard_name: permission.guard_name,
          }));
        }
      });
      
      // console.log('🔍 DEBUG - Dados processados:', Object.keys(groupedData));
      
      setPermissoesPorCategoria(groupedData);
      
    } catch (error) {
      // console.error('Erro ao buscar permissões agrupadas:', error);
      // console.log('🔍 DEBUG - Detalhes do erro:', error.message);
      
      // Sem fallback - endpoint necessário deve ser implementado
      setError('Endpoint /permissions/grouped não implementado. Necessário implementar no backend.');
      setPermissoesPorCategoria({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupedPermissions();
  }, [fetchGroupedPermissions]);

  return {
    permissoesPorCategoria,
    categorias: Object.keys(permissoesPorCategoria).sort(),
    loading,
    error,
    refetch: fetchGroupedPermissions,
  };
}