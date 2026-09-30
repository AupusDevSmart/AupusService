// src/features/solicitacoes-servico/config/actions-config.tsx
import { Eye, Edit, Trash2, CalendarPlus, ExternalLink } from 'lucide-react';
import type { Permissao } from '@/types/dtos/usuarios-dto';
import { atalhoDaOrigem } from '@/features/programacao-os/utils/link-de-programacao';
import { TableAction } from '@/core';
import { SolicitacaoServico } from '../types';

interface CreateSolicitacoesActionsProps {
  onView: (solicitacao: SolicitacaoServico) => void;
  onEdit: (solicitacao: SolicitacaoServico) => void;
  onDelete: (solicitacao: SolicitacaoServico) => void;
  /** Leva à programação com a solicitação escolhida (ou à programação dela) */
  onProgramacao?: (solicitacao: SolicitacaoServico) => void;
  temPermissao?: (...perms: Permissao[]) => boolean;
}

export function createSolicitacoesTableActions({
  onView,
  onEdit,
  onDelete,
  onProgramacao,
  temPermissao = () => true,
}: CreateSolicitacoesActionsProps): TableAction<SolicitacaoServico>[] {
  // Mesma regra do botão do sheet (atalhoDaOrigem)
  const podeAtalho = (solicitacao: SolicitacaoServico, rotulo: string) => {
    const atalho = atalhoDaOrigem(solicitacao.status);
    return Boolean(onProgramacao) && atalho?.rotulo === rotulo && temPermissao(atalho.permissao);
  };

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
      condition: (solicitacao) => solicitacao.status === 'REGISTRADA',
    },
    {
      key: 'programar',
      label: 'Programar',
      icon: CalendarPlus,
      onClick: (solicitacao) => onProgramacao?.(solicitacao),
      variant: 'default',
      condition: (solicitacao) => podeAtalho(solicitacao, 'Programar'),
    },
    {
      key: 'ver_programacao',
      label: 'Ver programação',
      icon: ExternalLink,
      onClick: (solicitacao) => onProgramacao?.(solicitacao),
      variant: 'default',
      condition: (solicitacao) => podeAtalho(solicitacao, 'Ver programação'),
    },
    {
      key: 'delete',
      label: 'Excluir',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      condition: (solicitacao) => solicitacao.status === 'REGISTRADA',
    },
  ];
}
