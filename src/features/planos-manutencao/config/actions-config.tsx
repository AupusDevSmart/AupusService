// src/features/planos-manutencao/config/actions-config.tsx
import { Edit, Eye, Plus } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

export interface PlanosTableActions {
  handleView: (plano: PlanoManutencaoApiResponse) => void;
  handleEdit: (plano: PlanoManutencaoApiResponse) => void;
  handleAdicionarTarefa: (plano: PlanoManutencaoApiResponse) => void;
}

/**
 * "Associar Equipamentos" saiu junto com a pagina de associacao em lote: o
 * vinculo agora e feito no sheet do proprio equipamento, que e onde a
 * categoria dele determina quais planos se aplicam.
 */
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
      // Expande a linha e ja abre o formulario de cadastro. O botao saiu de
      // dentro da linha expandida: adicionar tarefa e acao DO PLANO, entao
      // pertence a coluna de acoes dele.
      key: 'adicionar_tarefa',
      label: 'Adicionar tarefa',
      handler: handlers.handleAdicionarTarefa,
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const
    }
  ];
}
