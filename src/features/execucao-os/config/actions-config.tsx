// src/features/execucao-os/config/actions-config.tsx

import {
  Play,
  Pause,
  CheckCircle,
  CheckCircle2,
  Shield,
  RotateCcw,
  Ban,
} from 'lucide-react';
import type { TableAction } from '@nexon/components/common/base-table/types';
import type { ExecucaoOS } from '../types';

interface CreateExecucaoOSActionsProps {
  onIniciar: (item: ExecucaoOS) => void;
  onPausar: (item: ExecucaoOS) => void;
  onRetomar: (item: ExecucaoOS) => void;
  onExecutar: (item: ExecucaoOS) => void;
  onAuditar: (item: ExecucaoOS) => void;
  onFinalizar: (item: ExecucaoOS) => void;
  onCancelar: (item: ExecucaoOS) => void;
}

/**
 * Cria as ações da tabela de Execução de OS baseadas no status
 *
 * Fluxo:
 *   PENDENTE -> iniciar -> EM_EXECUCAO
 *   EM_EXECUCAO <-> pausar/retomar <-> PAUSADA
 *   EM_EXECUCAO/PAUSADA -> executar -> EXECUTADA
 *   EXECUTADA -> auditar -> AUDITADA
 *   AUDITADA -> finalizar -> FINALIZADA
 *   Any (exceto FINALIZADA/CANCELADA) -> cancelar -> CANCELADA
 */
export function createExecucaoOSTableActions({
  onIniciar,
  onPausar,
  onRetomar,
  onExecutar,
  onAuditar,
  onFinalizar,
  onCancelar,
}: CreateExecucaoOSActionsProps): TableAction<ExecucaoOS>[] {
  const getStatus = (item: ExecucaoOS) =>
    (item.statusExecucao || item.status || item.os?.status)?.toUpperCase();

  const allActions: Record<string, TableAction<ExecucaoOS>> = {
    iniciar: {
      label: 'Iniciar',
      icon: Play,
      onClick: onIniciar,
      variant: 'default',
      condition: (item) => getStatus(item) === 'PENDENTE',
    },
    pausar: {
      label: 'Pausar',
      icon: Pause,
      onClick: onPausar,
      variant: 'default',
      condition: (item) => getStatus(item) === 'EM_EXECUCAO',
    },
    retomar: {
      label: 'Retomar',
      icon: RotateCcw,
      onClick: onRetomar,
      variant: 'default',
      condition: (item) => getStatus(item) === 'PAUSADA',
    },
    executar: {
      label: 'Executar',
      icon: CheckCircle,
      onClick: onExecutar,
      variant: 'default',
      condition: (item) => {
        const s = getStatus(item);
        return s === 'EM_EXECUCAO' || s === 'PAUSADA';
      },
    },
    auditar: {
      label: 'Auditar',
      icon: Shield,
      onClick: onAuditar,
      variant: 'default',
      condition: (item) => getStatus(item) === 'EXECUTADA',
    },
    finalizar: {
      label: 'Finalizar',
      icon: CheckCircle2,
      onClick: onFinalizar,
      variant: 'default',
      condition: (item) => getStatus(item) === 'AUDITADA',
    },
    cancelar: {
      label: 'Cancelar',
      icon: Ban,
      onClick: onCancelar,
      variant: 'destructive',
      condition: (item) => {
        const s = getStatus(item);
        return s !== 'FINALIZADA' && s !== 'CANCELADA' && s !== undefined;
      },
    },
  };

  return Object.values(allActions);
}
