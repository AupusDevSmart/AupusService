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
  // Local no lugar da Descricao — mesmo motivo da tabela de OP.
  //
  // Texto livre e longo numa tabela de layout automatico faz a coluna
  // reivindicar a largura do MAIOR texto da pagina, e o excedente empurra as
  // colunas seguintes para fora da tela. Uma descricao grande basta.
  //
  // Local esta preenchido em 90% das OS (46 de 51 em dev) e ja chega pelo
  // transform. Equipamento identificaria melhor, mas so existe em 63% (32 de
  // 51) — um terco da coluna sairia vazia.
  {
    key: 'local',
    label: 'Local',
    width: '18%',
    render: (item) => {
      const local = item.local || item.os?.local;
      return local
        ? <Texto>{local}</Texto>
        : <Texto fraco>Sem local</Texto>;
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
