// src/features/instrucoes/hooks/useInstrucoesFilters.ts
import { useState } from 'react';
import { instrucoesFilterConfig } from '../config/filter-config';
import { instrucoesFormFields } from '../config/form-config';
import { FilterConfig } from '@/types/base';

export function useInstrucoesFilters() {
  const [filterConfig] = useState<FilterConfig[]>(instrucoesFilterConfig);
  const [formFields] = useState(instrucoesFormFields);

  return {
    filterConfig,
    formFields
  };
}
