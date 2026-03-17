// src/features/solicitacoes-servico/config/table-config.tsx
import { TableColumn } from '@/types/base';
import { SolicitacaoServico } from '../types';
import { StatusCell } from '../components/table-cells/StatusCell';
import { PrioridadeCell } from '../components/table-cells/PrioridadeCell';
import { SolicitacaoInfoCell } from '../components/table-cells/SolicitacaoInfoCell';

export const solicitacoesTableColumns: TableColumn<SolicitacaoServico>[] = [
  {
    key: 'dados_principais',
    label: 'Solicitação',
    sortable: true,
    render: (solicitacao) => <SolicitacaoInfoCell solicitacao={solicitacao} />,
  },
  {
    key: 'status',
    label: 'Status',
    render: (solicitacao) => <StatusCell status={solicitacao.status} />,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    hideOnMobile: true,
    render: (solicitacao) => {
      const tipoLabels: Record<string, string> = {
        INSTALACAO: 'Instalação',
        MANUTENCAO_CORRETIVA: 'Manutenção Corretiva',
        MANUTENCAO_PREVENTIVA: 'Manutenção Preventiva',
        MELHORIA: 'Melhoria',
        OUTRO: 'Outro',
      };
      return <span className="text-sm">{tipoLabels[solicitacao.tipo] || solicitacao.tipo}</span>;
    },
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    render: (solicitacao) => <PrioridadeCell prioridade={solicitacao.prioridade} />,
  },
  {
    key: 'solicitante',
    label: 'Solicitante',
    hideOnMobile: true,
    render: (solicitacao) => (
      <div className="text-sm">
        <div className="font-medium text-foreground">{solicitacao.solicitante_nome}</div>
        {solicitacao.solicitante_email && (
          <div className="text-xs text-muted-foreground">{solicitacao.solicitante_email}</div>
        )}
      </div>
    ),
  },
];
