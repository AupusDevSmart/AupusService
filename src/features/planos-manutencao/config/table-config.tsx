// src/features/planos-manutencao/config/table-config.tsx
import { TableColumn } from '@/types/base';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import { PlanoInfoCell } from '../components/table-cells/PlanoInfoCell';
import { CategoriaAplicacaoCell } from '../components/table-cells/CategoriaAplicacaoCell';
import { TarefasStatsCell } from '../components/table-cells/TarefasStatsCell';

export const planosTableColumns: TableColumn<PlanoManutencaoApiResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Plano de Manutenção',
    sortable: true,
    render: (plano) => <PlanoInfoCell plano={plano} />
  },
  {
    key: 'categoria_aplicacao',
    label: 'Categoria & Uso',
    render: (plano) => <CategoriaAplicacaoCell plano={plano} />
  },
  {
    key: 'tarefas_estatisticas',
    label: 'Tarefas',
    render: (plano) => <TarefasStatsCell plano={plano} />
  }
];