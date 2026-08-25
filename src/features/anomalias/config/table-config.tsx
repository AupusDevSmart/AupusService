// src/features/anomalias/config/table-config.tsx
import { TableColumn } from '@/types/base';
import { Anomalia } from '../types';
import { StatusCell } from '../components/table-cells/StatusCell';
import { PrioridadeCell } from '../components/table-cells/PrioridadeCell';
import { formatarData } from './labels';

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
    key: 'equipamento',
    label: 'Equipamento',
    width: '20%',
    primaryOnMobile: true,
    // A descricao saiu daqui: texto livre longo quebrava a linha e empurrava
    // as outras colunas. O equipamento identifica melhor e cabe.
    render: (anomalia) =>
      anomalia.equipamento?.nome ? <Texto>{anomalia.equipamento.nome}</Texto> : <Vazio />,
  },
  {
    key: 'instalacao',
    label: 'Instalação',
    width: '18%',
    hideOnMobile: true,
    // Vem do equipamento: a anomalia guarda planta e equipamento, nao unidade.
    // Por isso nao e ordenavel — nao ha coluna para ordenar.
    render: (anomalia) =>
      anomalia.equipamento?.unidade?.nome ? (
        <Texto>{anomalia.equipamento.unidade.nome}</Texto>
      ) : (
        <Vazio />
      ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '13%',
    sortable: true,
    render: (anomalia) => <StatusCell status={anomalia.status} />,
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    width: '13%',
    sortable: true,
    render: (anomalia) => <PrioridadeCell prioridade={anomalia.prioridade} />,
  },
  {
    key: 'data',
    label: 'Registro',
    width: '13%',
    sortable: true,
    hideOnMobile: true,
    render: (anomalia) => <Texto fraco>{formatarData(anomalia.data)}</Texto>,
  },
  {
    key: 'prazo',
    label: 'Prazo',
    width: '13%',
    sortable: true,
    render: (anomalia) => <PrazoCell prazo={anomalia.prazo} status={anomalia.status} />,
  },
];

/**
 * O prazo, com sinal de atraso.
 *
 * Vermelho quando venceu, ambar quando vence nos proximos tres dias. Uma data
 * sem sinal nao cobra nada de ninguem — e a cobranca e a razao do campo existir.
 *
 * Anomalia FINALIZADA nao mostra atraso: o prazo ja nao esta correndo, e pintar
 * de vermelho o que ja foi resolvido so gera ruido.
 */
function PrazoCell({ prazo, status }: { prazo?: string; status?: string }) {
  if (!prazo) return <Vazio />;

  const limite = new Date(prazo);
  if (Number.isNaN(limite.getTime())) return <Vazio />;

  const encerrada = status === 'FINALIZADA' || status === 'CANCELADA';
  const dias = (limite.getTime() - Date.now()) / 86400000;

  const cor = encerrada
    ? 'text-muted-foreground'
    : dias < 0
      ? 'text-red-600 dark:text-red-500'
      : dias <= 3
        ? 'text-amber-600 dark:text-amber-500'
        : 'text-foreground';

  return (
    <span className={`block truncate text-sm ${cor}`} title={limite.toLocaleString('pt-BR')}>
      {formatarData(prazo)}
    </span>
  );
}
