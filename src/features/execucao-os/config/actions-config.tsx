// src/features/execucao-os/config/actions-config.tsx
import {
  Eye,
  Edit,
  Play,
  Pause,
  CheckCircle,
  X,
  Camera,
  FileText
} from 'lucide-react';
import type { TableAction } from '@nexon/components/common/base-table/types';
import type { ExecucaoOS } from '../types';

interface CreateExecucaoOSActionsProps {
  // onView e onEdit são passados direto no BaseTable
  onIniciar: (item: ExecucaoOS) => void;
  onPausar: (item: ExecucaoOS) => void;
  onRetomar: (item: ExecucaoOS) => void;
  onFinalizar: (item: ExecucaoOS) => void;
  onCancelar: (item: ExecucaoOS) => void;
  // onAnexos e onRelatorio removidos por enquanto
}

/**
 * Determina quais ações estão disponíveis com base no status da execução
 */
function getAvailableActionsByStatus(status: string): string[] {
  const statusMap: Record<string, string[]> = {
    // PLANEJADA removido - OS já começam como PROGRAMADA
    // view/edit passados direto no BaseTable, anexos/relatorio removidos
    'PROGRAMADA': ['iniciar', 'cancelar'],
    'EM_EXECUCAO': ['pausar', 'finalizar', 'cancelar'],
    'PAUSADA': ['retomar', 'finalizar', 'cancelar'],
    'FINALIZADA': [],
    'CANCELADA': []
  };

  return statusMap[status] || [];
}

/**
 * Cria as ações da tabela de Execução de OS baseadas no status
 */
export function createExecucaoOSTableActions({
  onIniciar,
  onPausar,
  onRetomar,
  onFinalizar,
  onCancelar,
}: CreateExecucaoOSActionsProps): TableAction<ExecucaoOS>[] {
  const allActions: Record<string, TableAction<ExecucaoOS>> = {
    // view e edit são passados como onView/onEdit direto no BaseTable
    // anexos e relatorio removidos por enquanto
    iniciar: {
      label: 'Iniciar',
      icon: Play,
      onClick: onIniciar,
      variant: 'default',
      condition: (item) => {
        const status = item.statusExecucao || item.status || item.os?.status;
        const statusUpperCase = status?.toUpperCase();
        return statusUpperCase === 'PROGRAMADA';
      },
    },
    pausar: {
      label: 'Pausar',
      icon: Pause,
      onClick: onPausar,
      variant: 'default',
      condition: (item) => {
        const status = item.statusExecucao || item.status || item.os?.status;
        const statusUpperCase = status?.toUpperCase();
        return statusUpperCase === 'EM_EXECUCAO';
      },
    },
    retomar: {
      label: 'Retomar',
      icon: Play,
      onClick: onRetomar, // Agora usa handler dedicado
      variant: 'default',
      condition: (item) => {
        const status = item.statusExecucao || item.status || item.os?.status;
        const statusUpperCase = status?.toUpperCase();
        return statusUpperCase === 'PAUSADA';
      },
    },
    finalizar: {
      label: 'Finalizar',
      icon: CheckCircle,
      onClick: onFinalizar,
      variant: 'default',
      condition: (item) => {
        const status = item.statusExecucao || item.status || item.os?.status;
        const statusUpperCase = status?.toUpperCase();
        return statusUpperCase === 'EM_EXECUCAO' || statusUpperCase === 'PAUSADA';
      },
    },
    cancelar: {
      label: 'Cancelar',
      icon: X,
      onClick: onCancelar,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja cancelar esta execução de OS?',
      condition: (item) => {
        const status = item.statusExecucao || item.status || item.os?.status;
        const statusUpperCase = status?.toUpperCase();
        return statusUpperCase !== 'FINALIZADA' && statusUpperCase !== 'CANCELADA' && statusUpperCase !== undefined;
      },
    },
  };

  // Retornar todas as ações (o BaseTable filtrará com base nas conditions)
  return Object.values(allActions);
}
