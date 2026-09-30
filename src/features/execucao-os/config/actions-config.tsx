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
import type { Permissao } from '@/types/dtos/usuarios-dto';
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
  /** Qualquer uma basta — espelha o @Permissions da rota no controller */
  permissoes: Permissao[];
}

/** Checagem de permissao; o padrao libera tudo (testes e telas sem RBAC) */
export type TemPermissao = (...perms: Permissao[]) => boolean;
const liberaTudo: TemPermissao = () => true;

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
  { acao: 'iniciar', label: 'Iniciar', descricao: 'Começar a execução', icon: Play, variant: 'default', status: ['PENDENTE'], permissoes: ['execucao_os.view'] },
  { acao: 'pausar', label: 'Pausar', descricao: 'Interromper temporariamente', icon: Pause, variant: 'default', status: ['EM_EXECUCAO'], permissoes: ['execucao_os.view'] },
  { acao: 'retomar', label: 'Retomar', descricao: 'Continuar a execução', icon: RotateCcw, variant: 'default', status: ['PAUSADA'], permissoes: ['execucao_os.view'] },
  { acao: 'executar', label: 'Executar', descricao: 'Registrar o resultado da execução', icon: CheckCircle, variant: 'default', status: ['EM_EXECUCAO', 'PAUSADA'], permissoes: ['execucao_os.manage', 'execucao_os.executar'] },
  { acao: 'auditar', label: 'Auditar', descricao: 'Avaliar a qualidade do serviço', icon: Shield, variant: 'default', status: ['EXECUTADA'], permissoes: ['execucao_os.manage'] },
  { acao: 'finalizar', label: 'Finalizar', descricao: 'Encerrar a OS definitivamente', icon: CheckCircle2, variant: 'default', status: ['AUDITADA'], permissoes: ['execucao_os.aprovar'] },
  { acao: 'reabrir', label: 'Reabrir', descricao: 'Voltar para execução', icon: Undo2, variant: 'default', status: ['AUDITADA'], permissoes: ['execucao_os.manage'] },
  {
    acao: 'cancelar',
    label: 'Cancelar',
    descricao: 'Cancelar a OS com motivo',
    icon: Ban,
    variant: 'destructive',
    status: ['PENDENTE', 'EM_EXECUCAO', 'PAUSADA', 'EXECUTADA', 'AUDITADA'],
    permissoes: ['execucao_os.cancelar'],
  },
];

export function statusDaExecucao(item: Partial<ExecucaoOS> | null | undefined): string | undefined {
  return (item?.statusExecucao || item?.status || item?.os?.status)?.toUpperCase();
}

export function acoesDisponiveis(status: string | undefined, temPermissao: TemPermissao = liberaTudo): AcaoDaOS[] {
  if (!status) return [];
  return ACOES_DA_OS.filter((a) => a.status.includes(status) && temPermissao(...a.permissoes));
}

/** Acoes da tabela de Execução de OS, filtradas pelo status de cada linha */
export function createExecucaoOSTableActions(
  onAcao: (item: ExecucaoOS, acao: PendingAction) => void,
  temPermissao: TemPermissao = liberaTudo,
): TableAction<ExecucaoOS>[] {
  return ACOES_DA_OS.filter((a) => temPermissao(...a.permissoes)).map((a) => ({
    key: a.acao,
    label: a.label,
    icon: a.icon,
    onClick: (item: ExecucaoOS) => onAcao(item, a.acao),
    variant: a.variant,
    condition: (item: ExecucaoOS) => a.status.includes(statusDaExecucao(item) ?? ''),
  }));
}
