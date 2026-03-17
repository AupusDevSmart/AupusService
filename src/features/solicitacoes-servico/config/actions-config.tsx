// src/features/solicitacoes-servico/config/actions-config.tsx
import { Eye, Edit, Trash2, Send, FileSearch, CheckCircle, XCircle, Ban, CheckCheck } from 'lucide-react';
import { TableAction } from '@nexon/components/common/base-table/types';
import { SolicitacaoServico } from '../types';

interface CreateSolicitacoesActionsProps {
  onView: (solicitacao: SolicitacaoServico) => void;
  onEdit: (solicitacao: SolicitacaoServico) => void;
  onDelete: (solicitacao: SolicitacaoServico) => void;
  onEnviar?: (solicitacao: SolicitacaoServico) => void;
  onAnalisar?: (solicitacao: SolicitacaoServico) => void;
  onAprovar?: (solicitacao: SolicitacaoServico) => void;
  onRejeitar?: (solicitacao: SolicitacaoServico) => void;
  onCancelar?: (solicitacao: SolicitacaoServico) => void;
  onConcluir?: (solicitacao: SolicitacaoServico) => void;
}

export function createSolicitacoesTableActions({
  onView,
  onEdit,
  onDelete,
  onEnviar,
  onAnalisar,
  onAprovar,
  onRejeitar,
  onCancelar,
  onConcluir,
}: CreateSolicitacoesActionsProps): TableAction<SolicitacaoServico>[] {
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
      condition: (solicitacao) => solicitacao.status === 'RASCUNHO',
    },
    ...(onEnviar
      ? [
          {
            label: 'Enviar para Análise',
            icon: Send,
            onClick: onEnviar,
            variant: 'default' as const,
            condition: (solicitacao: SolicitacaoServico) => solicitacao.status === 'RASCUNHO',
          },
        ]
      : []),
    ...(onAnalisar
      ? [
          {
            label: 'Iniciar Análise',
            icon: FileSearch,
            onClick: onAnalisar,
            variant: 'default' as const,
            condition: (solicitacao: SolicitacaoServico) => solicitacao.status === 'AGUARDANDO',
          },
        ]
      : []),
    ...(onAprovar
      ? [
          {
            label: 'Aprovar',
            icon: CheckCircle,
            onClick: onAprovar,
            variant: 'default' as const,
            condition: (solicitacao: SolicitacaoServico) => solicitacao.status === 'EM_ANALISE',
          },
        ]
      : []),
    ...(onRejeitar
      ? [
          {
            label: 'Rejeitar',
            icon: XCircle,
            onClick: onRejeitar,
            variant: 'destructive' as const,
            condition: (solicitacao: SolicitacaoServico) => solicitacao.status === 'EM_ANALISE',
            requiresConfirmation: true,
            confirmationMessage: 'Tem certeza que deseja rejeitar esta solicitação?',
          },
        ]
      : []),
    ...(onConcluir
      ? [
          {
            label: 'Concluir',
            icon: CheckCheck,
            onClick: onConcluir,
            variant: 'default' as const,
            condition: (solicitacao: SolicitacaoServico) =>
              solicitacao.status === 'EM_EXECUCAO',
          },
        ]
      : []),
    ...(onCancelar
      ? [
          {
            label: 'Cancelar',
            icon: Ban,
            onClick: onCancelar,
            variant: 'destructive' as const,
            condition: (solicitacao: SolicitacaoServico) =>
              solicitacao.status !== 'CONCLUIDA' && solicitacao.status !== 'CANCELADA',
            requiresConfirmation: true,
            confirmationMessage: 'Tem certeza que deseja cancelar esta solicitação?',
          },
        ]
      : []),
    {
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      condition: (solicitacao) =>
        solicitacao.status === 'RASCUNHO' || solicitacao.status === 'CANCELADA',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja excluir esta solicitação?',
    },
  ];
}
