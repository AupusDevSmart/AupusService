// src/features/programacao-os/config/table-config.tsx

import type { TableColumn } from '@aupus/shared-pages';
import type { ProgramacaoResponse } from '@/services/programacao-os.service';
import { StatusCell } from '../components/table-cells/StatusCell';
import { tipoLabels, prioridadeLabels, formatarDataHora } from './labels';

/**
 * Colunas da tabela de Programacao de OS.
 *
 * Uma informacao por coluna e uma linha por registro: as celulas empilhavam
 * dois dados (codigo + descricao, tipo + prioridade, responsavel + equipe), o
 * que dobrava a altura da linha. Data e hora continuam juntas por serem a
 * mesma informacao — "quando".
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

export const programacaoOSTableColumns: TableColumn<ProgramacaoResponse>[] = [
  {
    key: 'codigo',
    label: 'Código',
    width: '10%',
    render: (item) => <Texto mono>{item.codigo || '-'}</Texto>,
  },
  {
    key: 'descricao',
    label: 'Descrição',
    width: '46%',
    render: (item) =>
      item.descricao
        ? <Texto>{item.descricao}</Texto>
        : <Texto fraco>Sem descrição</Texto>,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    width: '11%',
    render: (item) => <Texto>{tipoLabels[item.tipo] || item.tipo}</Texto>,
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    hideOnTablet: true,
    width: '9%',
    render: (item) => (
      <Texto>{prioridadeLabels[item.prioridade] || item.prioridade}</Texto>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '11%',
    sortable: true,
    render: (item) => <StatusCell status={item.status} />,
  },
  {
    key: 'data_programada',
    label: 'Data Programada',
    width: '13%',
    sortable: true,
    render: (item) => {
      // Duas colunas guardam "quando": `data_hora_programada` vem da programacao
      // detalhada (hoje comentada no formulario, so preenchida ao aprovar) e
      // `data_previsao_inicio` e o campo que o usuario preenche ao criar a OP.
      //
      // Lendo so a primeira, toda OP criada pelo formulario atual aparecia como
      // "Não programada" mesmo tendo data — o dado estava salvo, na outra coluna.
      // Mesma precedencia ja usada no detalhe da OP.
      const quando = formatarDataHora(
        item.data_hora_programada || item.data_previsao_inicio,
      );
      return quando
        ? <Texto>{quando}</Texto>
        : <Texto fraco>Não programada</Texto>;
    },
  },
];
