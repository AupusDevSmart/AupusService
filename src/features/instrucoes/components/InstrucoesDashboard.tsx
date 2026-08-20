// src/features/instrucoes/components/InstrucoesDashboard.tsx
import { FileText, CheckCircle, FileStack } from 'lucide-react';
import { DashboardInstrucoesDto } from '@/services/instrucoes.services';

interface InstrucoesDashboardProps {
  data: DashboardInstrucoesDto;
}

/**
 * Os três números do topo.
 *
 * No celular eles ficam lado a lado, não empilhados. Empilhados, com padding de
 * 16px e número em `text-2xl`, os três somavam mais de meia tela — a lista de
 * instruções, que é o motivo de a página existir, nascia abaixo da dobra. Lado
 * a lado cabem numa faixa e a lista começa logo em seguida.
 */
export function InstrucoesDashboard({ data }: InstrucoesDashboardProps) {
  const indicadores = [
    { icone: FileText, valor: data.total_instrucoes, rotulo: 'Total de Instruções', curto: 'Total' },
    { icone: CheckCircle, valor: data.instrucoes_ativas, rotulo: 'Ativas', curto: 'Ativas' },
    {
      icone: FileStack,
      valor: data.total_tarefas_derivadas,
      rotulo: 'Tarefas Derivadas',
      curto: 'Tarefas',
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-4 lg:grid-cols-3">
      {indicadores.map(({ icone: Icone, valor, rotulo, curto }) => (
        <div
          key={rotulo}
          className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800 sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Icone className="hidden h-5 w-5 shrink-0 text-gray-600 dark:text-gray-400 sm:block" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
                {valor}
              </p>
              {/* O rótulo curto evita quebrar em três linhas numa coluna de
                  ~110px; a partir de sm volta o nome por extenso. */}
              <p className="truncate text-xs text-gray-600 dark:text-gray-400 sm:hidden">{curto}</p>
              <p className="hidden text-sm text-gray-600 dark:text-gray-400 sm:block">{rotulo}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
