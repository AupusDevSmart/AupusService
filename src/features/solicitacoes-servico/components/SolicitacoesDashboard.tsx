// src/features/solicitacoes-servico/components/SolicitacoesDashboard.tsx
import { FilePenLine } from 'lucide-react';
import { SolicitacoesStats } from '@/services/solicitacoes-servico.service';

interface SolicitacoesDashboardProps {
  data: SolicitacoesStats;
}

export function SolicitacoesDashboard({ data }: SolicitacoesDashboardProps) {
  const cards = [
    { label: 'Total', value: data.total, color: 'bg-blue-500' },
    { label: 'Registradas', value: data.registradas, color: 'bg-yellow-500' },
    { label: 'Programadas', value: data.programadas, color: 'bg-purple-500' },
    { label: 'Finalizadas', value: data.finalizadas, color: 'bg-green-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-lg p-2 md:p-3 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-1">
            <div className={`w-2 h-2 rounded-full ${card.color}`} />
            <FilePenLine className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-lg md:text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground truncate">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
