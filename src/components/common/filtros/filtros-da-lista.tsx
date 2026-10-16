import type { FilterConfig } from '@/types/base';
import { CampoDeDataDoFiltro, FiltroDeEquipamento } from '@/components/common/filtros/FiltrosDaLista';

/** As chaves que cada lista usa no estado dos filtros. */
export interface ChavesDosFiltros {
  planta: string;
  equipamento: string;
  inicio: string;
  fim: string;
}

interface Opcoes {
  plantas: { value: string; label: string }[];
  carregandoPlantas?: boolean;
  /** A planta escolhida: o equipamento lista só os dela. */
  plantaId?: string;
  chaves: ChavesDosFiltros;
}

/**
 * Planta, equipamento (o UC leva os componentes) e o período "de / até" (SN-55):
 * a mesma régua nas listas de Programação e de Execução. Quem troca a planta
 * limpa o equipamento (a página faz).
 */
export function filtrosDePlantaEquipamentoPeriodo({ plantas, carregandoPlantas, plantaId, chaves }: Opcoes): FilterConfig[] {
  const planta = plantaId && plantaId !== 'all' ? plantaId : undefined;
  return [
    {
      key: chaves.planta,
      type: 'combobox',
      label: 'Planta',
      placeholder: carregandoPlantas ? 'Carregando plantas...' : 'Todas as plantas',
      searchPlaceholder: 'Buscar planta...',
      options: plantas,
      className: 'min-w-48',
    },
    {
      key: chaves.equipamento,
      type: 'custom',
      label: 'Equipamento',
      className: 'min-w-56',
      render: ({ value, onChange, disabled }) => <FiltroDeEquipamento value={value} onChange={onChange} plantaId={planta} disabled={disabled} />,
    },
    {
      key: chaves.inicio,
      type: 'custom',
      label: 'De',
      className: 'min-w-40',
      render: ({ value, onChange }) => <CampoDeDataDoFiltro rotulo="De" value={value} onChange={onChange} />,
    },
    {
      key: chaves.fim,
      type: 'custom',
      label: 'Até',
      className: 'min-w-40',
      render: ({ value, onChange }) => <CampoDeDataDoFiltro rotulo="Até" value={value} onChange={onChange} />,
    },
  ];
}
