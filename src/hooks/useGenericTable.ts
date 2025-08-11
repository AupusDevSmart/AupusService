// src/hooks/useGenericTable.ts
import { useState, useMemo, useCallback } from 'react';
import { BaseEntity, BaseFilters, Pagination } from '@/types/base';

interface UseGenericTableProps<T extends BaseEntity, F extends BaseFilters> {
  data: T[];
  initialFilters: F;
  searchFields?: (keyof T)[];
  customFilters?: Record<string, (item: T, value: any) => boolean>;
}

interface UseGenericTableReturn<T, F> {
  filteredData: T[];
  paginatedData: T[];
  pagination: Pagination;
  filters: F;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleFilterChange: (newFilters: Partial<F>) => void;
  handlePageChange: (page: number) => void;
  resetFilters: () => void;
}

export function useGenericTable<T extends BaseEntity, F extends BaseFilters>({
  data,
  initialFilters,
  searchFields = [],
  customFilters = {}
}: UseGenericTableProps<T, F>): UseGenericTableReturn<T, F> {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<F>(initialFilters);

  // Filtrar dados
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filtro de busca genérico
      if (filters.search && searchFields.length > 0) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Aplicar filtros customizados e padrões
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'search' || key === 'page' || key === 'limit') return true;
        if (value === 'all' || value === '' || value === null || value === undefined) return true;
        
        // Verificar se existe um filtro customizado para esta chave
        if (customFilters[key]) {
          return customFilters[key](item, value);
        }
        
        // Filtro padrão
        const itemValue = (item as any)[key];
        return itemValue === value || itemValue?.toString() === value?.toString();
      });
    });
  }, [data, filters, searchFields, customFilters]);

  // Paginar dados
  const paginatedData = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, filters.page, filters.limit]);

  const pagination = useMemo<Pagination>(() => ({
    page: filters.page,
    limit: filters.limit,
    total: filteredData.length,
    totalPages: Math.ceil(filteredData.length / filters.limit)
  }), [filteredData.length, filters.page, filters.limit]);

  const handleFilterChange = useCallback((newFilters: Partial<F>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset para página 1 quando filtros mudam (exceto paginação)
      page: 'page' in newFilters ? prev.page : 1
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filteredData,
    paginatedData,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange,
    resetFilters
  };
}