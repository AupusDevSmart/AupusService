// src/features/execucao-os/config/table-config.tsx
import type { TableColumn } from '@/types/base';
import type { ExecucaoOS } from '../types';
import { OSInfoCell } from '../components/table-cells/OSInfoCell';
import { StatusCell } from '../components/table-cells/StatusCell';
import { ResponsavelCell } from '../components/table-cells/ResponsavelCell';
import { ProgressoCell } from '../components/table-cells/ProgressoCell';
import { TipoEPrioridadeCell } from '../components/table-cells/TipoEPrioridadeCell';

/**
 * Configuração das colunas da tabela de Execução de OS
 * Usa células customizadas para manter o código limpo e organizado
 */
export const execucaoOSTableColumns: TableColumn<ExecucaoOS>[] = [
  {
    key: 'os_info',
    label: 'Ordem de Serviço',
    sortable: true,
    width: '25%',
    render: (item) => <OSInfoCell item={item} />,
  },
  {
    key: 'tipo_prioridade',
    label: 'Tipo & Prioridade',
    width: '15%',
    render: (item) => <TipoEPrioridadeCell item={item} />,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: '12%',
    render: (item) => <StatusCell status={item.statusExecucao || item.status} />,
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    hideOnMobile: true,
    width: '18%',
    render: (item) => <ResponsavelCell item={item} />,
  },
  {
    key: 'progresso',
    label: 'Progresso & Tempo',
    hideOnTablet: true,
    width: '20%',
    render: (item) => <ProgressoCell item={item} />,
  },
  {
    key: 'data_programada',
    label: 'Data Programada',
    sortable: true,
    hideOnMobile: true,
    width: '10%',
    render: (item) => {
      const data = item.os?.dataProgramada;
      if (!data) return <span className="text-gray-400 text-sm">-</span>;

      return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      );
    },
  },
];