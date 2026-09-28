// src/features/solicitacoes-servico/components/SolicitacoesDashboard.tsx
import { FileText, ClipboardList, Calendar, CheckCircle2 } from 'lucide-react';
import { SolicitacoesStats } from '@/services/solicitacoes-servico.service';
import { IndicadoresCompactos } from '@/components/common/IndicadoresCompactos';

interface SolicitacoesDashboardProps {
  data: SolicitacoesStats;
}

/** Os quatro números numa faixa, no mesmo formato das outras listagens. */
export function SolicitacoesDashboard({ data }: SolicitacoesDashboardProps) {
  return (
    <IndicadoresCompactos
      className="mb-3 md:mb-4"
      itens={[
        { chave: 'total', rotulo: 'Total', valor: data.total, icone: FileText },
        { chave: 'registradas', rotulo: 'Registradas', valor: data.registradas, icone: ClipboardList },
        { chave: 'programadas', rotulo: 'Programadas', valor: data.programadas, icone: Calendar },
        { chave: 'finalizadas', rotulo: 'Finalizadas', valor: data.finalizadas, icone: CheckCircle2 },
      ]}
    />
  );
}
