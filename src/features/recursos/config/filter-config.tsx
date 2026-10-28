// src/features/recursos/config/filter-config.tsx
import { FilterConfig } from '@/types/base';
import { FiltroSegmentado } from '@/components/common/FiltroSegmentado';
import { CATEGORIAS_RECURSO, ROTULO_PLURAL_DA_CATEGORIA } from '@/services/recursos.services';

/**
 * Os filtros da lista de recursos, como os do AupusProject: a categoria em
 * botões, numa linha inteira (todas à vista, um clique), e a busca por nome
 * embaixo. "Todos" é o vazio: a página só manda a categoria quando há uma.
 */
export const recursosFilterConfig: FilterConfig[] = [
  {
    key: 'categoria',
    type: 'custom',
    className: 'col-span-full',
    render: ({ value, onChange }) => (
      <FiltroSegmentado
        aria="Filtrar por categoria"
        opcoes={[
          { valor: '', rotulo: 'Todos' },
          ...CATEGORIAS_RECURSO.map((c) => ({ valor: c.value as string, rotulo: ROTULO_PLURAL_DA_CATEGORIA[c.value] })),
        ]}
        valor={typeof value === 'string' && value !== 'all' ? value : ''}
        onChange={onChange}
      />
    ),
  },
  {
    key: 'search',
    type: 'search',
    placeholder: 'Buscar por nome...',
    className: 'col-span-full',
  },
];
