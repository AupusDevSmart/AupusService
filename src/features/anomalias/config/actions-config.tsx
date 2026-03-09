// src/features/anomalias/config/actions-config.tsx
import { Eye, Edit, Trash2, Calendar, XCircle } from 'lucide-react';
import { TableAction } from '@nexon/components/common/base-table/types';
import { Anomalia } from '../types';

interface CreateAnomaliasActionsProps {
  onView: (anomalia: Anomalia) => void;
  onEdit: (anomalia: Anomalia) => void;
  onDelete: (anomalia: Anomalia) => void;
  onGerarProgramacaoOS?: (anomalia: Anomalia) => void;
  onCancelar?: (anomalia: Anomalia) => void;
}

export function createAnomaliasTableActions({
  onView,
  onEdit,
  onDelete,
  onGerarProgramacaoOS,
  onCancelar
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
      // Só permite editar anomalias AGUARDANDO ou EM_ANALISE
      condition: (anomalia) => {
        return anomalia.status === 'AGUARDANDO' || anomalia.status === 'EM_ANALISE';
      }
    },
    ...(onGerarProgramacaoOS ? [{
      label: 'Programar OS',
      icon: Calendar,
      onClick: onGerarProgramacaoOS,
      variant: 'default' as const,
      // Só permite gerar programação para anomalias AGUARDANDO ou EM_ANALISE
      condition: (anomalia: Anomalia) => {
        return anomalia.status === 'AGUARDANDO' || anomalia.status === 'EM_ANALISE';
      }
    }] : []),
    ...(onCancelar ? [{
      label: 'Cancelar',
      icon: XCircle,
      onClick: onCancelar,
      variant: 'destructive' as const,
      // Só permite cancelar anomalias não resolvidas ou já canceladas
      condition: (anomalia: Anomalia) => {
        return anomalia.status !== 'RESOLVIDA' && anomalia.status !== 'CANCELADA';
      },
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja cancelar esta anomalia?'
    }] : []),
    {
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      // Só permite deletar anomalias AGUARDANDO ou CANCELADA
      condition: (anomalia) => {
        return anomalia.status === 'AGUARDANDO' || anomalia.status === 'CANCELADA';
      },
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja excluir esta anomalia?',
    },
  ];
}
