// src/features/programacao-os/config/actions-config.tsx

import { Eye, Edit, AlertTriangle, CheckCircle, XCircle, Ban, Trash2, Play } from 'lucide-react';
import type { TableAction } from '@nexon/components/common/base-table/types';
import type { ProgramacaoResponse } from '@/services/programacao-os.service';

interface CreateProgramacaoOSActionsProps {
  onView: (item: ProgramacaoResponse) => void;
  onEdit: (item: ProgramacaoResponse) => void;
  onAnalisar: (item: ProgramacaoResponse) => void;
  onAprovar: (item: ProgramacaoResponse) => void;
  onRejeitar: (item: ProgramacaoResponse) => void;
  onCancelar: (item: ProgramacaoResponse) => void;
  onDelete: (item: ProgramacaoResponse) => void;
  onIrParaExecucao: (item: ProgramacaoResponse) => void;
}

/**
 * Cria ações condicionais da tabela de Programação de OS baseadas no status
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function createProgramacaoOSTableActions({
  onView,
  onEdit,
  onAnalisar,
  onAprovar,
  onRejeitar,
  onCancelar,
  onDelete,
  onIrParaExecucao,
}: CreateProgramacaoOSActionsProps): TableAction<ProgramacaoResponse>[] {

  const allActions: Record<string, TableAction<ProgramacaoResponse>> = {
    // Ação sempre disponível
    view: {
      label: 'Visualizar',
      icon: Eye,
      onClick: onView,
      variant: 'default',
    },

    // Editar: Apenas RASCUNHO e PENDENTE
    edit: {
      label: 'Editar',
      icon: Edit,
      onClick: onEdit,
      variant: 'default',
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status === 'RASCUNHO' || status === 'PENDENTE';
      },
    },

    // Analisar: Apenas PENDENTE → EM_ANALISE
    analisar: {
      label: 'Analisar',
      icon: AlertTriangle,
      onClick: onAnalisar,
      variant: 'default',
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status === 'PENDENTE';
      },
    },

    // Aprovar: Apenas EM_ANALISE → APROVADA (gera OS automaticamente)
    aprovar: {
      label: 'Aprovar',
      icon: CheckCircle,
      onClick: onAprovar,
      variant: 'default',
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status === 'EM_ANALISE';
      },
    },

    // Rejeitar: Apenas EM_ANALISE → REJEITADA
    rejeitar: {
      label: 'Rejeitar',
      icon: XCircle,
      onClick: onRejeitar,
      variant: 'destructive',
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status === 'EM_ANALISE';
      },
    },

    // Cancelar: Qualquer status exceto APROVADA e CANCELADA
    cancelar: {
      label: 'Cancelar',
      icon: Ban,
      onClick: onCancelar,
      variant: 'outline',
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status !== 'APROVADA' && status !== 'CANCELADA';
      },
    },

    // Deletar: Qualquer status exceto APROVADA
    delete: {
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      requiresConfirmation: false, // Já tem confirmação no handler
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status !== 'APROVADA';
      },
    },

    // Ir para Execução: Apenas APROVADA com OS gerada
    irParaExecucao: {
      label: 'Ir para Execução',
      icon: Play,
      onClick: onIrParaExecucao,
      variant: 'default',
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
      condition: (item) => {
        const status = item.status?.toUpperCase();
        return status === 'APROVADA' && !!item.ordem_servico?.id;
      },
    },
  };

  // Retornar ações na ordem desejada
  return [
    allActions.view,
    allActions.edit,
    allActions.analisar,
    allActions.aprovar,
    allActions.rejeitar,
    allActions.cancelar,
    allActions.delete,
    allActions.irParaExecucao,
  ];
}
