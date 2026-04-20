// src/features/programacao-os/components/table-cells/DataProgramadaCell.tsx

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DataProgramadaCellProps {
  data_hora_programada?: string;
  status: string;
}

export function DataProgramadaCell({ data_hora_programada }: DataProgramadaCellProps) {
  if (!data_hora_programada) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-600">
        Não programada
      </div>
    );
  }

  try {
    const data = parseISO(data_hora_programada);
    const dataFormatada = format(data, "dd/MM/yyyy", { locale: ptBR });
    const horaFormatada = format(data, "HH:mm", { locale: ptBR });

    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {dataFormatada}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {horaFormatada}
        </span>
      </div>
    );
  } catch (error) {
    return (
      <div className="text-xs text-gray-400">
        Data inválida
      </div>
    );
  }
}
