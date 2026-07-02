// src/features/planos-manutencao/components/table-cells/TarefasStatsCell.tsx
import { FileText } from 'lucide-react';
import { PlanoManutencaoApiResponse } from '@/services/planos-manutencao.services';

interface TarefasStatsCellProps {
  plano: PlanoManutencaoApiResponse;
}

export function TarefasStatsCell({ plano }: TarefasStatsCellProps) {
  const tarefasAtivas = plano.tarefas_ativas || 0;
  const totalTarefas = plano.total_tarefas || 0;

  return (
    <div className="flex items-center gap-2">
      <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="text-sm">
        <span className="font-medium">{tarefasAtivas}</span>
        <span className="text-muted-foreground"> / {totalTarefas}</span>
      </span>
    </div>
  );
}
