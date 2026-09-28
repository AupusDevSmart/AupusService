// src/features/anomalias/components/AnomaliasDashboard.tsx
import { BarChart3, ClipboardList, Calendar, CheckCircle2 } from 'lucide-react';
import { AnomaliasStats } from '@/services/anomalias.service';
import { IndicadoresCompactos } from '@/components/common/IndicadoresCompactos';

interface AnomaliasDashboardProps {
  data: AnomaliasStats;
}

/** Os quatro números numa faixa, no mesmo formato das outras listagens. */
export function AnomaliasDashboard({ data }: AnomaliasDashboardProps) {
  return (
    <IndicadoresCompactos
      className="mb-3"
      itens={[
        { chave: 'total', rotulo: 'Total', valor: data.total, icone: BarChart3 },
        { chave: 'registradas', rotulo: 'Registradas', valor: data.registradas, icone: ClipboardList },
        { chave: 'programadas', rotulo: 'Programadas', valor: data.programadas, icone: Calendar },
        { chave: 'finalizadas', rotulo: 'Finalizadas', valor: data.finalizadas, icone: CheckCircle2 },
      ]}
    />
  );
}
