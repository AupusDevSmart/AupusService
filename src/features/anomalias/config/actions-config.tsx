// src/features/anomalias/config/actions-config.tsx
import { Eye, Edit, Trash2 } from 'lucide-react';
import { TableAction } from '@aupus/shared-pages';
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
      condition: (anomalia) => anomalia.status === 'REGISTRADA',
    },
    {
      key: 'delete',
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      condition: (anomalia) => anomalia.status === 'REGISTRADA',
    },
  ];
}
