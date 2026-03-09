// src/features/planos-manutencao/config/table-config.tsx
import { TableColumn } from '@/types/base';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';
import { PlanoInfoCell } from '../components/table-cells/PlanoInfoCell';
import { EquipamentoLocalCell } from '../components/table-cells/EquipamentoLocalCell';
import { TarefasStatsCell } from '../components/table-cells/TarefasStatsCell';
import { StatusCell } from '../components/table-cells/StatusCell';

export const planosTableColumns: TableColumn<PlanoManutencaoApiResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Plano de Manutenção',
    sortable: true,
    render: (plano) => <PlanoInfoCell plano={plano} />
  },
  {
    key: 'equipamento_local',
    label: 'Equipamento & Local',
    render: (plano) => <EquipamentoLocalCell plano={plano} />
  },
  {
    key: 'tarefas_estatisticas',
    label: 'Tarefas',
    render: (plano) => <TarefasStatsCell plano={plano} />
  },
  {
    key: 'status',
    label: 'Status',
    render: (plano) => <StatusCell plano={plano} />
  }
];