// src/features/instrucoes/components/InstrucoesDashboard.tsx
import { FileText, CheckCircle, FileStack } from 'lucide-react';
import { DashboardInstrucoesDto } from '@/services/instrucoes.services';
import { IndicadoresCompactos } from '@/components/common/IndicadoresCompactos';

interface InstrucoesDashboardProps {
  data: DashboardInstrucoesDto;
}

/** Os três números do topo, numa faixa só, para a lista começar logo abaixo. */
export function InstrucoesDashboard({ data }: InstrucoesDashboardProps) {
  return (
    <IndicadoresCompactos
      className="mb-4"
      itens={[
        {
          chave: 'total',
          rotulo: 'Total',
          valor: data.total_instrucoes,
          icone: FileText,
          dica: 'Total de instruções',
        },
        { chave: 'ativas', rotulo: 'Ativas', valor: data.instrucoes_ativas, icone: CheckCircle },
        {
          chave: 'tarefas',
          rotulo: 'Tarefas derivadas',
          valor: data.total_tarefas_derivadas,
          icone: FileStack,
        },
      ]}
    />
  );
}
