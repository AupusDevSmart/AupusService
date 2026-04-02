// src/features/programacao-os/config/table-config.tsx

import type { TableColumn } from '@nexon/components/common/base-table/types';
import type { ProgramacaoResponse } from '@/services/programacao-os.service';
import { ProgramacaoInfoCell } from '../components/table-cells/ProgramacaoInfoCell';
import { StatusCell } from '../components/table-cells/StatusCell';
import { TipoCell } from '../components/table-cells/TipoCell';
import { DataProgramadaCell } from '../components/table-cells/DataProgramadaCell';
import { AlertTriangle, Calendar, FileText } from 'lucide-react';

/**
 * Configuração de colunas da tabela de Programação de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 * Reduzido de 186 linhas para ~70 linhas usando células customizadas
 */
export const programacaoOSTableColumns: TableColumn<ProgramacaoResponse>[] = [
  {
    key: 'info',
    label: 'Programação',
    width: '30%',
    render: (item) => <ProgramacaoInfoCell item={item} />,
  },
  {
    key: 'tipo',
    label: 'Tipo & Prioridade',
    width: '15%',
    render: (item) => <TipoCell tipo={item.tipo} prioridade={item.prioridade} />,
  },
  {
    key: 'origem',
    label: 'Origem',
    width: '12%',
    render: (item) => {
      const origemIcons = {
        ANOMALIA: AlertTriangle,
        PLANO_MANUTENCAO: Calendar,
        TAREFA: FileText,
        SOLICITACAO_SERVICO: FileText,
      };

      const origemLabels = {
        ANOMALIA: 'Anomalia',
        PLANO_MANUTENCAO: 'Plano',
        TAREFA: 'Tarefa',
        SOLICITACAO_SERVICO: 'Solicitacao',
      };

      const Icon = origemIcons[item.origem as keyof typeof origemIcons] || FileText;
      const label = origemLabels[item.origem as keyof typeof origemLabels] || item.origem;

      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm">{label}</span>
        </div>
      );
    },
  },
  {
    key: 'status',
    label: 'Status',
    width: '13%',
    sortable: true,
    render: (item) => <StatusCell status={item.status} />,
  },
  {
    key: 'data_programada',
    label: 'Data Programada',
    width: '15%',
    sortable: true,
    render: (item) => <DataProgramadaCell data_hora_programada={item.data_hora_programada} status={item.status} />,
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    width: '15%',
    render: (item) => (
      <div className="flex flex-col gap-1">
        {item.responsavel ? (
          <span className="text-sm text-gray-900 dark:text-gray-100">{item.responsavel}</span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-600">Não atribuído</span>
        )}
        {item.time_equipe && (
          <span className="text-xs text-gray-600 dark:text-gray-400">{item.time_equipe}</span>
        )}
      </div>
    ),
  },
];
