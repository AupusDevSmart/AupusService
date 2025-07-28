// src/hooks/useTable.ts
import { useState, useMemo } from 'react';
import { SortConfig } from '@/types/global';

interface UseTableProps<T> {
  data: T[];
  initialSort?: SortConfig<T>;
}

interface UseTableReturn<T> {
  sortedData: T[];
  sortConfig: SortConfig<T>;
  requestSort: (key: keyof T) => void;
}

export function useTable<T>({ 
  data, 
  initialSort = { key: null, direction: 'asc' } 
}: UseTableProps<T>): UseTableReturn<T> {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialSort);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return {
    sortedData,
    sortConfig,
    requestSort
  };
}