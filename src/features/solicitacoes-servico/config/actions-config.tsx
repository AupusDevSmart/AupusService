// src/features/solicitacoes-servico/config/actions-config.tsx
import { Eye, Edit, Trash2 } from 'lucide-react';
import { TableAction } from '@nexon/components/common/base-table/types';
import { SolicitacaoServico } from '../types';

interface CreateSolicitacoesActionsProps {
  onView: (solicitacao: SolicitacaoServico) => void;
  onEdit: (solicitacao: SolicitacaoServico) => void;
  onDelete: (solicitacao: SolicitacaoServico) => void;
}

export function createSolicitacoesTableActions({
  onView,
  onEdit,
  onDelete,
}: CreateSolicitacoesActionsProps): TableAction<SolicitacaoServico>[] {
  return [
    {
      label: 'Visualizar',
      icon: Eye,
      onClick: onView,
      variant: 'default',
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: onEdit,
      variant: 'default',
      condition: (solicitacao) => solicitacao.status === 'REGISTRADA',
    },
    {
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      condition: (solicitacao) => solicitacao.status === 'REGISTRADA',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja excluir esta solicitação?',
    },
  ];
}
