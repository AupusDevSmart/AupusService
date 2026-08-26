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
    width: '12%',
    render: (item) => <Texto mono>{item.codigo || '-'}</Texto>,
  },
  // Local no lugar da Descricao.
  //
  // A descricao e um texto livre e longo. Numa tabela de layout automatico, a
  // coluna reivindica a largura do MAIOR texto da pagina — uma unica descricao
  // grande empurrava Tipo, Prioridade, Status e Data para fora da tela. Nao era
  // a tabela que estava larga demais: era uma coluna.
  //
  // Local identifica a linha em 93% dos registros (82 de 88 em dev) e ja vem na
  // listagem, sem tocar no backend. Equipamento seria o substituto natural — e o
  // que se fez em anomalias — mas so existe em metade das OPs (44 de 88) e nem e
  // incluido no `findAll`: metade da coluna sairia vazia.
  {
    key: 'local',
    label: 'Local',
    width: '26%',
    render: (item) =>
      item.local
        ? <Texto>{item.local}</Texto>
        : <Texto fraco>Sem local</Texto>,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    width: '12%',
    render: (item) => <Texto>{tipoLabels[item.tipo] || item.tipo}</Texto>,
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    hideOnTablet: true,
    width: '12%',
    render: (item) => (
      <Texto>{prioridadeLabels[item.prioridade] || item.prioridade}</Texto>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '14%',
    sortable: true,
    render: (item) => <StatusCell status={item.status} />,
  },
  {
    key: 'data_programada',
    label: 'Data Programada',
    width: '24%',
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
