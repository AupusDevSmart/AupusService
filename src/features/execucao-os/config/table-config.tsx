// src/features/execucao-os/config/table-config.tsx
import type { TableColumn } from '@/types/base';
import type { ExecucaoOS } from '../types';
import { StatusCell } from '../components/table-cells/StatusCell';
import { tipoLabels, prioridadeLabels, formatarTempo, formatarData } from './labels';

/**
 * Colunas da tabela de Execucao de OS.
 *
 * Uma informacao por coluna e uma linha por registro: as celulas empilhavam
 * dois dados (numero + descricao, tipo + prioridade), o que dobrava a altura
 * da linha e fazia a tabela parecer mais densa do que o conteudo justifica.
 */

/** Celula de uma linha so. `truncate` precisa de `block` para valer. */
const Texto = ({ children, mono = false, fraco = false }: {
  children: React.ReactNode;
  mono?: boolean;
  fraco?: boolean;
}) => (
  <span
    className={`block truncate text-sm ${mono ? 'font-mono' : ''} ${
      fraco ? 'text-muted-foreground' : 'text-foreground'
    }`}
  >
    {children}
  </span>
);

export const execucaoOSTableColumns: TableColumn<ExecucaoOS>[] = [
  {
    key: 'numero_os',
    label: 'OS',
    sortable: true,
    width: '10%',
    render: (item) => <Texto mono>{item.numeroOS || item.numero_os || '-'}</Texto>,
  },
  {
    key: 'descricao',
    label: 'Descrição',
    width: '26%',
    render: (item) => {
      const descricao = item.descricao || item.os?.descricao;
      return descricao
        ? <Texto>{descricao}</Texto>
        : <Texto fraco>Sem descrição</Texto>;
    },
  },
  {
    // A origem diz de onde a OS nasceu — solicitacao, anomalia ou plano. Sem
    // ela, duas OS identicas na tabela podem ter vindo de lugares diferentes,
    // e e a origem que diz a quem prestar contas.
    key: 'origem',
    label: 'Origem',
    width: '13%',
    sortable: true,
    hideOnMobile: true,
    render: (item) => {
      const rotulos: Record<string, string> = {
        SOLICITACAO_SERVICO: 'Solicitação',
        ANOMALIA: 'Anomalia',
        PLANO_MANUTENCAO: 'Plano',
        TAREFA: 'Plano',
        MANUAL: 'Manual',
      };
      const origem = (item as any).origem || (item as any).os?.origem;
      return origem ? <Texto>{rotulos[origem] || origem}</Texto> : <Texto fraco>-</Texto>;
    },
  },
  {
    key: 'tipo',
    label: 'Tipo',
    width: '12%',
    render: (item) => {
      const tipo = item.tipo || item.os?.tipo || 'PREVENTIVA';
      return <Texto>{tipoLabels[tipo] || tipo}</Texto>;
    },
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    hideOnTablet: true,
    width: '10%',
    render: (item) => {
      const prioridade = item.prioridade || item.os?.prioridade || 'MEDIA';
      return <Texto>{prioridadeLabels[prioridade] || prioridade}</Texto>;
    },
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
    width: '15%',
    render: (item) => {
      const responsavel = item.responsavelExecucao || item.responsavel;
      return responsavel
        ? <Texto>{responsavel}</Texto>
        : <Texto fraco>Não atribuído</Texto>;
    },
  },
  {
    // A barra de progresso saiu: a porcentagem era derivada do proprio status
    // por um switch, entao a coluna Status ja dizia a mesma coisa. Sobra o
    // tempo, que e o unico dado novo que a celula trazia.
    key: 'tempo',
    label: 'Tempo',
    hideOnTablet: true,
    width: '8%',
    render: (item) => (
      <Texto fraco>
        {formatarTempo(
          (item as { tempoTotalExecucao?: number }).tempoTotalExecucao ??
            item.tempo_execucao_minutos,
        )}
      </Texto>
    ),
  },
  {
    key: 'data_programada',
    label: 'Data',
    sortable: true,
    hideOnMobile: true,
    width: '7%',
    render: (item) => <Texto fraco>{formatarData(item.os?.dataProgramada)}</Texto>,
  },
];
