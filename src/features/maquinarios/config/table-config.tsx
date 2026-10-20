// src/features/maquinarios/config/table-config.tsx
import type { TableColumn } from '@/types/base';
import type { FilterConfig } from '@/types/base';
import { formatarPreco } from '@/features/recursos/config/table-config';
import {
  ROTULO_DA_BASE_DO_MAQUINARIO,
  ROTULO_DO_TIPO_DE_MAQUINARIO,
  type MaquinarioApiResponse,
} from '@/services/maquinarios.services';

const SUFIXO: Record<string, string> = { diaria: '/diária', hora: '/h', km: '/km', fechado: '' };

export const maquinariosTableColumns: TableColumn<MaquinarioApiResponse>[] = [
  {
    key: 'nome',
    label: 'Nome',
    render: (m) => <span className="text-sm text-foreground">{m.nome}</span>,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    render: (m) => <span className="text-sm text-foreground">{ROTULO_DO_TIPO_DE_MAQUINARIO[m.tipo] ?? m.tipo}</span>,
  },
  {
    key: 'base_calculo',
    label: 'Cobrança',
    hideOnMobile: true,
    render: (m) => <span className="text-sm text-muted-foreground">{ROTULO_DA_BASE_DO_MAQUINARIO[m.base_calculo] ?? '—'}</span>,
  },
  {
    // O preço de uma unidade da cobrança, como a conta usa: no próprio por diária, pela amortização
    key: 'preco_base',
    label: 'Custo apurado',
    render: (m) => {
      const preco = formatarPreco(m.preco_base);
      if (!preco) return <span className="text-sm text-muted-foreground">Sem preço</span>;
      return (
        <span className="text-sm text-foreground">
          {preco}
          <span className="text-muted-foreground">{SUFIXO[m.base_calculo] ?? ''}</span>
        </span>
      );
    },
  },
  {
    key: 'ativo',
    label: 'Situação',
    hideOnMobile: true,
    render: (m) => <span className={`text-sm ${m.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>{m.ativo ? 'Ativo' : 'Inativo'}</span>,
  },
];

export const maquinariosFilterConfig: FilterConfig[] = [
  { key: 'search', type: 'search', placeholder: 'Buscar por nome...', className: 'flex-1 min-w-0' },
  {
    key: 'tipo',
    type: 'select',
    label: 'Tipo',
    placeholder: 'Todos os tipos',
    className: 'w-full sm:w-48',
    options: [
      { value: 'all', label: 'Todos os tipos' },
      ...Object.entries(ROTULO_DO_TIPO_DE_MAQUINARIO).map(([value, label]) => ({ value, label })),
    ],
  },
];
