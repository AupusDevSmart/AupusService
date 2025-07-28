// src/features/usuarios/config/filter-config.ts
import { Search, Filter, UserCheck } from 'lucide-react';
import { FilterConfig } from '@/types/base';

export const usuariosFilterConfig: FilterConfig[] = [
  {
    key: 'search',
    label: 'Buscar',
    type: 'text',
    placeholder: 'Pesquisar por nome, email ou telefone...',
    icon: Search
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    icon: Filter,
    options: [
      { value: 'all', label: 'Todos os status' },
      { value: 'Ativo', label: 'Ativo' },
      { value: 'Inativo', label: 'Inativo' }
    ]
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    icon: UserCheck,
    options: [
      { value: 'all', label: 'Todos os tipos' },
      { value: 'Proprietário', label: 'Proprietário' },
      { value: 'Analista', label: 'Analista' },
      { value: 'Adm', label: 'Administrador' },
      { value: 'Técnico', label: 'Técnico' },
      { value: 'Fornecedor', label: 'Fornecedor' },
      { value: 'Técnico Externo', label: 'Técnico Externo' }
    ]
  }
];