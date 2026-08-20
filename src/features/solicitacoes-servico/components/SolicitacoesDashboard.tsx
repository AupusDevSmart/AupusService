// src/features/solicitacoes-servico/components/SolicitacoesDashboard.tsx
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
    // Numero e rotulo na mesma linha, nao empilhados.
    //
    // Cada cartao gastava tres faixas de altura — bolinha e icone em cima,
    // numero no meio, rotulo embaixo — para dizer "12 registradas". O icone
    // repetido em todos nao distinguia nada, e a bolinha colorida sozinha ja
    // faz o papel de separar as categorias. Com tudo numa linha o bloco cai
    // para cerca de um terco da altura.
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 md:mb-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${card.color}`} />
          <span className="text-base font-semibold leading-none text-foreground">{card.value}</span>
          <span className="truncate text-xs text-muted-foreground">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
