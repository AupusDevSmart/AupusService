// src/features/execucao-os/config/actions-config.tsx

import {
  Play,
  Pause,
  CheckCircle,
  CheckCircle2,
  Shield,
  RotateCcw,
  Undo2,
  Ban,
  type LucideIcon,
} from 'lucide-react';
import type { TableAction } from '@/core';
import type { ExecucaoOS } from '../types';
import type { PendingAction } from '../components/ActionConfirmPanel';

export interface AcaoDaOS {
  acao: PendingAction;
  label: string;
  descricao: string;
  icon: LucideIcon;
  variant: 'default' | 'destructive';
  /** Status em que o backend aceita a acao (guardas do execucao-os.service) */
  status: string[];
}

/**
 * As transicoes da OS, na ordem do fluxo. E a unica fonte: a tabela e o painel
 * de acoes do sheet leem daqui, e os status espelham as guardas do backend.
 *
 *   PENDENTE -> iniciar -> EM_EXECUCAO
 *   EM_EXECUCAO <-> pausar/retomar <-> PAUSADA
 *   EM_EXECUCAO/PAUSADA -> executar -> EXECUTADA
 *   EXECUTADA -> auditar -> AUDITADA
 *   AUDITADA -> finalizar -> FINALIZADA
 *   AUDITADA -> reabrir -> EM_EXECUCAO
 *   qualquer um (exceto FINALIZADA/CANCELADA) -> cancelar -> CANCELADA
 */
export const ACOES_DA_OS: AcaoDaOS[] = [
  { acao: 'iniciar', label: 'Iniciar', descricao: 'Começar a execução', icon: Play, variant: 'default', status: ['PENDENTE'] },
  { acao: 'pausar', label: 'Pausar', descricao: 'Interromper temporariamente', icon: Pause, variant: 'default', status: ['EM_EXECUCAO'] },
  { acao: 'retomar', label: 'Retomar', descricao: 'Continuar a execução', icon: RotateCcw, variant: 'default', status: ['PAUSADA'] },
  { acao: 'executar', label: 'Executar', descricao: 'Registrar o resultado da execução', icon: CheckCircle, variant: 'default', status: ['EM_EXECUCAO', 'PAUSADA'] },
  { acao: 'auditar', label: 'Auditar', descricao: 'Avaliar a qualidade do serviço', icon: Shield, variant: 'default', status: ['EXECUTADA'] },
  { acao: 'finalizar', label: 'Finalizar', descricao: 'Encerrar a OS definitivamente', icon: CheckCircle2, variant: 'default', status: ['AUDITADA'] },
  { acao: 'reabrir', label: 'Reabrir', descricao: 'Voltar para execução', icon: Undo2, variant: 'default', status: ['AUDITADA'] },
  {
    acao: 'cancelar',
    label: 'Cancelar',
    descricao: 'Cancelar a OS com motivo',
    icon: Ban,
    variant: 'destructive',
    status: ['PENDENTE', 'EM_EXECUCAO', 'PAUSADA', 'EXECUTADA', 'AUDITADA'],
  },
];

export function statusDaExecucao(item: Partial<ExecucaoOS> | null | undefined): string | undefined {
  return (item?.statusExecucao || item?.status || item?.os?.status)?.toUpperCase();
}

export function acoesDisponiveis(status: string | undefined): AcaoDaOS[] {
  if (!status) return [];
  return ACOES_DA_OS.filter((a) => a.status.includes(status));
}

/** Acoes da tabela de Execução de OS, filtradas pelo status de cada linha */
export function createExecucaoOSTableActions(
  onAcao: (item: ExecucaoOS, acao: PendingAction) => void,
): TableAction<ExecucaoOS>[] {
  return ACOES_DA_OS.map((a) => ({
    key: a.acao,
    label: a.label,
    icon: a.icon,
    onClick: (item: ExecucaoOS) => onAcao(item, a.acao),
    variant: a.variant,
    condition: (item: ExecucaoOS) => a.status.includes(statusDaExecucao(item) ?? ''),
  }));
}
