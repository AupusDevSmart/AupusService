// src/features/programacao-os/config/table-config.tsx

import type { TableColumn } from '@/core';
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

/**
 * Celula de uma linha so.
 *
 * `truncate` sozinho nao trunca nada aqui: ele corta o que passa da largura, e
 * numa tabela de layout automatico a celula CRESCE ate caber o texto inteiro —
 * nunca ha excedente. Por isso uma descricao longa empurrava as colunas
 * seguintes para fora da tela em vez de virar reticencias.
 *
 * `limite` da o teto que faltava. Com ele a coluna para de crescer, o texto
 * ganha as reticencias e o `title` guarda o resto para quem passar o mouse.
 */
const Texto = ({ children, mono = false, fraco = false, limite = '', titulo }: {
  children: React.ReactNode;
  mono?: boolean;
  fraco?: boolean;
  limite?: string;
  titulo?: string;
}) => (
  <span
    title={titulo}
    className={`block truncate text-sm ${limite} ${mono ? 'font-mono' : ''} ${
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
  // A descricao volta, com teto.
  //
  // Local chegava a 93% dos registros, mas dizia pouco: "Múltiplos locais" nao
  // identifica servico nenhum. O problema nunca foi a descricao existir — foi
  // ela poder crescer sem limite.
  //
  // ~60 caracteres cabem o suficiente para reconhecer o servico, e o texto
  // completo fica no title.
  {
    key: 'descricao',
    label: 'Descrição',
    width: '26%',
    render: (item) =>
      item.descricao
        ? <Texto limite="max-w-[60ch]" titulo={item.descricao}>{item.descricao}</Texto>
        : <Texto fraco>Sem descrição</Texto>,
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
