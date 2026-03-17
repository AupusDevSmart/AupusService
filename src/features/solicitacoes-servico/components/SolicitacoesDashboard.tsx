// src/features/solicitacoes-servico/components/SolicitacoesDashboard.tsx
import { FilePenLine } from 'lucide-react';
import { SolicitacoesStats } from '@/services/solicitacoes-servico.service';

interface SolicitacoesDashboardProps {
  data: SolicitacoesStats;
}

export function SolicitacoesDashboard({ data }: SolicitacoesDashboardProps) {
  const cards = [
    { label: 'Total', value: data.total, color: 'bg-blue-500' },
    { label: 'Aguardando', value: data.aguardando, color: 'bg-yellow-500' },
    { label: 'Em Análise', value: data.emAnalise, color: 'bg-blue-500' },
    { label: 'Aprovadas', value: data.aprovadas, color: 'bg-green-500' },
    { label: 'Em Execução', value: data.emExecucao, color: 'bg-purple-500' },
    { label: 'Concluídas', value: data.concluidas, color: 'bg-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-4 md:mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-2 h-2 rounded-full ${card.color}`} />
            <FilePenLine className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-xl md:text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
