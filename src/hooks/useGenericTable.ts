// src/hooks/useGenericTable.ts
import { useState, useMemo, useCallback } from 'react';
import { BaseEntity, BaseFilters, Pagination } from '@/types/base';
import { useLinhasPorPagina, LINHAS_POR_PAGINA_PADRAO } from '@/store/usePreferenciasDeTabela';

interface UseGenericTableProps<T extends BaseEntity, F extends BaseFilters> {
  data: T[];
  initialFilters: F;
  searchFields?: (keyof T)[];
  customFilters?: Record<string, (item: T, value: any) => boolean>;
  /**
   * Chave da preferencia "linhas por pagina" desta tabela. Com ela, o tamanho
   * inicial vem do que o usuario escolheu da ultima vez e `handleLimitChange`
   * passa a lembrar a escolha. Sem ela, vale o `limit` de `initialFilters`.
   */
  tabela?: string;
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
  /** Troca o tamanho da pagina e volta para a primeira. */
  handleLimitChange: (limit: number) => void;
  resetFilters: () => void;
}

export function useGenericTable<T extends BaseEntity, F extends BaseFilters>({
  data,
  initialFilters,
  searchFields = [],
  customFilters = {},
  tabela
}: UseGenericTableProps<T, F>): UseGenericTableReturn<T, F> {
  const [loading, setLoading] = useState(false);

  // Chamado sempre, com ou sem chave: hook nao pode ser condicional. Sem
  // `tabela` o valor lido e simplesmente ignorado.
  const [linhasPorPagina, setLinhasPorPagina] = useLinhasPorPagina(tabela ?? '');

  // Os filtros "de fabrica" desta tabela ja com o tamanho escolhido — e deles
  // que o estado nasce e para eles que o reset volta.
  const filtrosIniciais = useMemo<F>(
    () => (tabela ? { ...initialFilters, limit: linhasPorPagina } : initialFilters),
    [initialFilters, tabela, linhasPorPagina],
  );

  const [filters, setFilters] = useState<F>(filtrosIniciais);

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
    const page = filters.page ?? 1;
    const limit = filters.limit ?? LINHAS_POR_PAGINA_PADRAO;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, filters.page, filters.limit]);

  const pagination = useMemo<Pagination>(() => {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? LINHAS_POR_PAGINA_PADRAO;
    return {
      page,
      limit,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit)
    };
  }, [filteredData.length, filters.page, filters.limit]);

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

  // Volta para a pagina 1: na pagina 4 de 10 linhas, trocar para 100 pediria
  // um trecho que nao existe.
  const handleLimitChange = useCallback((limit: number) => {
    if (tabela) setLinhasPorPagina(limit);
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  }, [tabela, setLinhasPorPagina]);

  // Limpar os filtros nao esquece quantas linhas o usuario quer ver.
  const resetFilters = useCallback(() => {
    setFilters(filtrosIniciais);
  }, [filtrosIniciais]);

  return {
    filteredData,
    paginatedData,
    pagination,
    filters,
    loading,
    setLoading,
    handleFilterChange,
    handlePageChange,
    handleLimitChange,
    resetFilters
  };
}