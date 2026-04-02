// src/features/anomalias/config/actions-config.tsx
import { Eye, Edit, Trash2 } from 'lucide-react';
import { TableAction } from '@nexon/components/common/base-table/types';
import { Anomalia } from '../types';

interface CreateAnomaliasActionsProps {
  onView: (anomalia: Anomalia) => void;
  onEdit: (anomalia: Anomalia) => void;
  onDelete: (anomalia: Anomalia) => void;
}

export function createAnomaliasTableActions({
  onView,
  onEdit,
  onDelete,
}: CreateAnomaliasActionsProps): TableAction<Anomalia>[] {
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
      condition: (anomalia) => anomalia.status === 'REGISTRADA',
    },
    {
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      condition: (anomalia) => anomalia.status === 'REGISTRADA',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja excluir esta anomalia?',
    },
  ];
}
