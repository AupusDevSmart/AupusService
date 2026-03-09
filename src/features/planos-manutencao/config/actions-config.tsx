// src/features/planos-manutencao/config/actions-config.tsx
import { Edit, ExternalLink, Eye } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

export interface PlanosTableActions {
  handleView: (plano: PlanoManutencaoApiResponse) => void;
  handleEdit: (plano: PlanoManutencaoApiResponse) => void;
  handleAssociarEquipamentos: (plano: PlanoManutencaoApiResponse) => void;
}

export function createPlanosTableActions(handlers: PlanosTableActions) {
  return [
    {
      key: 'visualizar',
      label: 'Visualizar',
      handler: handlers.handleView,
      icon: <Eye className="h-4 w-4" />,
      variant: 'secondary' as const
    },
    {
      key: 'editar',
      label: 'Editar',
      handler: handlers.handleEdit,
      icon: <Edit className="h-4 w-4" />,
      variant: 'default' as const
    },
    {
      key: 'associar',
      label: 'Associar Equipamentos',
      handler: handlers.handleAssociarEquipamentos,
      icon: <ExternalLink className="h-4 w-4" />,
      variant: 'secondary' as const
    }
  ];
}
