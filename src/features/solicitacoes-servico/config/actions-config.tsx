// src/features/solicitacoes-servico/config/actions-config.tsx
import { Eye, Edit, Trash2 } from 'lucide-react';
import { TableAction } from '@aupus/shared-pages';
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
      key: 'view',
      label: 'Visualizar',
      icon: Eye,
      onClick: onView,
      variant: 'default',
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      onClick: onEdit,
      variant: 'default',
      condition: (solicitacao) => solicitacao.status === 'REGISTRADA',
    },
    {
      key: 'delete',
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      condition: (solicitacao) => solicitacao.status === 'REGISTRADA',
    },
  ];
}
