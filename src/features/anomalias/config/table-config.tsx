// src/features/anomalias/config/table-config.tsx
import { TableColumn } from '@/types/base';
import { Anomalia } from '../types';
import { StatusCell } from '../components/table-cells/StatusCell';
import { PrioridadeCell } from '../components/table-cells/PrioridadeCell';
import { condicaoLabels, formatarData } from './labels';

/**
 * Colunas da tabela de Anomalias.
 *
 * Uma informacao por coluna e uma linha por registro. As celulas empilhavam
 * ate tres dados (descricao + ID + condicao), e cada uma repetia um icone
 * decorativo em toda linha — o icone dizia o que o cabecalho da coluna ja diz.
 */

/** Celula de uma linha so. `truncate` precisa de `block` para valer. */
const Texto = ({ children, fraco = false }: {
  children: React.ReactNode;
  fraco?: boolean;
}) => (
  <span className={`block truncate text-sm ${fraco ? 'text-muted-foreground' : 'text-foreground'}`}>
    {children}
  </span>
);

const Vazio = () => <Texto fraco>-</Texto>;

export const anomaliasTableColumns: TableColumn<Anomalia>[] = [
  {
    key: 'descricao',
    label: 'Anomalia',
    sortable: true,
    width: '34%',
    render: (anomalia) =>
      anomalia.descricao ? <Texto>{anomalia.descricao}</Texto> : <Vazio />,
  },
  {
    key: 'condicao',
    label: 'Condição',
    hideOnTablet: true,
    width: '11%',
    render: (anomalia) =>
      anomalia.condicao
        ? <Texto>{condicaoLabels[anomalia.condicao] || anomalia.condicao}</Texto>
        : <Vazio />,
  },
  {
    key: 'local',
    label: 'Local',
    width: '13%',
    render: (anomalia) => (anomalia.local ? <Texto>{anomalia.local}</Texto> : <Vazio />),
  },
  {
    key: 'ativo',
    label: 'Ativo',
    hideOnMobile: true,
    width: '13%',
    render: (anomalia) => (anomalia.ativo ? <Texto>{anomalia.ativo}</Texto> : <Vazio />),
  },
  {
    key: 'status',
    label: 'Status',
    width: '11%',
    render: (anomalia) => <StatusCell status={anomalia.status} />,
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    width: '10%',
    render: (anomalia) => <PrioridadeCell prioridade={anomalia.prioridade} />,
  },
  {
    key: 'data',
    label: 'Data',
    sortable: true,
    width: '8%',
    render: (anomalia) => {
      const data = formatarData(anomalia.data);
      return data ? <Texto fraco>{data}</Texto> : <Vazio />;
    },
  },
];
