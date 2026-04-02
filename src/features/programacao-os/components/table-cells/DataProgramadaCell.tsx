// src/features/programacao-os/components/table-cells/DataProgramadaCell.tsx

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DataProgramadaCellProps {
  data_hora_programada?: string;
  status: string;
}

export function DataProgramadaCell({ data_hora_programada, status }: DataProgramadaCellProps) {
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

    // Verificar se está atrasada (data passada e status não é FINALIZADA ou CANCELADA)
    const isAtrasada = isPast(data) &&
                       !['FINALIZADA', 'CANCELADA'].includes(status) &&
                       !isToday(data);

    const isHoje = isToday(data);

    return (
      <div className="flex flex-col gap-1">
        <div className={`flex items-center gap-1 text-sm ${
          isAtrasada ? 'text-red-600 dark:text-red-400 font-semibold' :
          isHoje ? 'text-orange-600 dark:text-orange-400 font-semibold' :
          'text-gray-900 dark:text-gray-100'
        }`}>
          <Calendar className="h-3 w-3" />
          <span>{dataFormatada}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs ${
          isAtrasada ? 'text-red-500 dark:text-red-400' :
          isHoje ? 'text-orange-500 dark:text-orange-400' :
          'text-gray-600 dark:text-gray-400'
        }`}>
          <Clock className="h-3 w-3" />
          <span>{horaFormatada}</span>
        </div>
        {isAtrasada && (
          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
            ⚠️ Atrasada
          </div>
        )}
        {isHoje && !isAtrasada && (
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            📅 Hoje
          </div>
        )}
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
