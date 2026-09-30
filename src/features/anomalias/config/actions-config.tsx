// src/features/anomalias/config/actions-config.tsx
import { Eye, Edit, Trash2, CalendarPlus, ExternalLink } from 'lucide-react';
import { TableAction } from '@/core';
import type { Permissao } from '@/types/dtos/usuarios-dto';
import { atalhoDaOrigem } from '@/features/programacao-os/utils/link-de-programacao';
import { Anomalia } from '../types';

interface CreateAnomaliasActionsProps {
  onView: (anomalia: Anomalia) => void;
  onEdit: (anomalia: Anomalia) => void;
  onDelete: (anomalia: Anomalia) => void;
  /** Leva à programação com a anomalia escolhida (ou à programação dela) */
  onProgramacao?: (anomalia: Anomalia) => void;
  temPermissao?: (...perms: Permissao[]) => boolean;
}

export function createAnomaliasTableActions({
  onView,
  onEdit,
  onDelete,
  onProgramacao,
  temPermissao = () => true,
}: CreateAnomaliasActionsProps): TableAction<Anomalia>[] {
  // Mesma regra do botão do sheet (atalhoDaOrigem): registrada -> Programar,
  // programada -> Ver programação, e só com a permissão correspondente.
  const podeAtalho = (anomalia: Anomalia, rotulo: string) => {
    const atalho = atalhoDaOrigem(anomalia.status);
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
      condition: (anomalia) => anomalia.status === 'REGISTRADA',
    },
    {
      key: 'programar',
      label: 'Programar',
      icon: CalendarPlus,
      onClick: (anomalia) => onProgramacao?.(anomalia),
      variant: 'default',
      condition: (anomalia) => podeAtalho(anomalia, 'Programar'),
    },
    {
      key: 'ver_programacao',
      label: 'Ver programação',
      icon: ExternalLink,
      onClick: (anomalia) => onProgramacao?.(anomalia),
      variant: 'default',
      condition: (anomalia) => podeAtalho(anomalia, 'Ver programação'),
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
