// src/features/execucao-os/components/ExecucaoOSDashboard.tsx
import { FileText, Play, Clock, AlertTriangle } from 'lucide-react';
import { IndicadoresCompactos } from '@/components/common/IndicadoresCompactos';

interface ExecucaoOSDashboardProps {
  total: number;
  apiStats: Record<string, number>;
  loading: boolean;
  onFilterAtrasadas?: () => void;
  onFilterCriticas?: () => void;
}

/**
 * Os 4 indicadores da execucao. Atrasadas e criticas eram repetidas em avisos
 * abaixo dos cards so para oferecer o filtro; o filtro agora e o proprio
 * indicador.
 */
export function ExecucaoOSDashboard({ total, apiStats, loading, onFilterAtrasadas, onFilterCriticas }: ExecucaoOSDashboardProps) {
  return (
    <IndicadoresCompactos
      carregando={loading}
      itens={[
        { chave: 'total', rotulo: 'Total', valor: total, icone: FileText },
        {
          chave: 'em-execucao',
          rotulo: 'Em execução',
          valor: (apiStats.em_execucao || 0) + (apiStats.pausadas || 0),
          icone: Play,
        },
        {
          chave: 'atrasadas',
          rotulo: 'Atrasadas',
          valor: apiStats.atrasadas || 0,
          icone: Clock,
          tom: 'atencao',
          onClick: onFilterAtrasadas,
          dica: 'Filtrar as ordens que passaram do prazo programado',
        },
        {
          chave: 'criticas',
          rotulo: 'Críticas',
          valor: apiStats.criticas || 0,
          icone: AlertTriangle,
          tom: 'critico',
          onClick: onFilterCriticas,
          dica: 'Filtrar as ordens de prioridade crítica',
        },
      ]}
    />
  );
}
