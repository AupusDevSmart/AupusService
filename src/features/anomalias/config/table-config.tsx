// src/features/anomalias/config/table-config.tsx
import { TableColumn } from '@/types/base';
import { Anomalia } from '../types';
import { AnomaliaInfoCell } from '../components/table-cells/AnomaliaInfoCell';
import { LocalAtivoCell } from '../components/table-cells/LocalAtivoCell';
import { StatusCell } from '../components/table-cells/StatusCell';
import { PrioridadeCell } from '../components/table-cells/PrioridadeCell';
import { OrigemCell } from '../components/table-cells/OrigemCell';
import { DataResponsavelCell } from '../components/table-cells/DataResponsavelCell';

export const anomaliasTableColumns: TableColumn<Anomalia>[] = [
  {
    key: 'dados_principais',
    label: 'Anomalia',
    sortable: true,
    render: (anomalia) => <AnomaliaInfoCell anomalia={anomalia} />
  },
  {
    key: 'local_ativo',
    label: 'Local & Ativo',
    render: (anomalia) => <LocalAtivoCell anomalia={anomalia} />
  },
  {
    key: 'status',
    label: 'Status',
    render: (anomalia) => <StatusCell status={anomalia.status} />
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    render: (anomalia) => <PrioridadeCell prioridade={anomalia.prioridade} />
  },
  {
    key: 'origem',
    label: 'Origem',
    hideOnMobile: true,
    render: (anomalia) => <OrigemCell origem={anomalia.origem} />
  },
  {
    key: 'data_criacao',
    label: 'Data & Responsável',
    render: (anomalia) => <DataResponsavelCell anomalia={anomalia} />
  }
];
