// src/features/programacao-os/config/actions-config.tsx

import { Eye, Edit, CheckCircle, Ban, Trash2 } from 'lucide-react';
import type { TableAction } from '@aupus/shared-pages';
import type { ProgramacaoResponse } from '@/services/programacao-os.service';

interface CreateProgramacaoOSActionsProps {
  onView: (item: ProgramacaoResponse) => void;
  onEdit: (item: ProgramacaoResponse) => void;
  onAprovar: (item: ProgramacaoResponse) => void;
  onCancelar: (item: ProgramacaoResponse) => void;
  onDelete: (item: ProgramacaoResponse) => void;
}

/**
 * Cria ações condicionais da tabela de Programação de OS baseadas no status
 * Fluxo: PENDENTE → APROVADA (gera OS) → FINALIZADA (automático via OS)
 */
export function createProgramacaoOSTableActions({
  onView,
  onEdit,
  onAprovar,
  onCancelar,
  onDelete,
}: CreateProgramacaoOSActionsProps): TableAction<ProgramacaoResponse>[] {

  const allActions: Record<string, TableAction<ProgramacaoResponse>> = {
    view: {
      key: 'view',
      label: 'Visualizar',
      icon: Eye,
      onClick: onView,
      variant: 'default',
    },

    edit: {
      key: 'edit',
      label: 'Editar',
      icon: Edit,
      onClick: onEdit,
      variant: 'default',
      condition: (item) => item.status?.toUpperCase() === 'PENDENTE',
    },

    aprovar: {
      key: 'aprovar',
      label: 'Aprovar',
      icon: CheckCircle,
      onClick: onAprovar,
      variant: 'default',
      condition: (item) => item.status?.toUpperCase() === 'PENDENTE',
    },

    cancelar: {
      key: 'cancelar',
      label: 'Cancelar',
      icon: Ban,
      onClick: onCancelar,
      variant: 'outline',
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status === 'PENDENTE' || status === 'APROVADA';
      },
    },

    delete: {
      key: 'delete',
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      condition: (item) => item.status?.toUpperCase() === 'PENDENTE',
    },
  };

  return [
    allActions.view,
    allActions.edit,
    allActions.aprovar,
    allActions.cancelar,
    allActions.delete,
  ];
}
