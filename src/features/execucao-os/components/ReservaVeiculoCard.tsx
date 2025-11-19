// src/features/execucao-os/components/ReservaVeiculoCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Calendar, Clock, Gauge, FileText } from 'lucide-react';

interface ReservaVeiculoCardProps {
  value?: {
    veiculo?: string;
    kmInicial?: number | string;
    dataInicioReserva?: string;
    horaInicioReserva?: string;
    dataFimReserva?: string;
    horaFimReserva?: string;
    finalidadeReserva?: string;
  };
  // Props individuais para compatibilidade (deprecated)
  veiculo?: string;
  kmInicial?: number | string;
  dataInicioReserva?: string;
  horaInicioReserva?: string;
  dataFimReserva?: string;
  horaFimReserva?: string;
  finalidadeReserva?: string;
}

export const ReservaVeiculoCard: React.FC<ReservaVeiculoCardProps> = (props) => {
  // Aceitar dados via 'value' (quando vem do BaseForm) ou props individuais
  const data = props.value || props;

  const {
    veiculo,
    kmInicial,
    dataInicioReserva,
    horaInicioReserva,
    dataFimReserva,
    horaFimReserva,
    finalidadeReserva
  } = data;

  // Se não há nenhum dado de reserva, não renderiza nada
  const temDados = veiculo || dataInicioReserva || dataFimReserva || finalidadeReserva || kmInicial;

  if (!temDados) {
    return null;
  }

  const formatDate = (date: string): string => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  };

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20">
      {/* ✅ RESPONSIVO: Header */}
      <CardHeader className="pb-2 sm:pb-3 bg-indigo-100/50 dark:bg-indigo-900/30 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 text-indigo-900 dark:text-indigo-100">
          <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="truncate">Reserva de Veículo</span>
        </CardTitle>
      </CardHeader>
      {/* ✅ RESPONSIVO: Content */}
      <CardContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
        {/* ✅ RESPONSIVO: Veículo e KM - empilhado em mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Car className="h-3 w-3 shrink-0" />
              <span className="truncate">Veículo</span>
            </span>
            <div className="flex items-center gap-2">
              {veiculo ? (
                <span className="text-sm font-bold font-mono bg-white dark:bg-gray-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded border-2 border-indigo-200 dark:border-indigo-700 truncate">
                  {veiculo}
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-muted-foreground italic bg-gray-50 dark:bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded border dark:border-gray-700 truncate">
                  Nenhum veículo reservado
                </span>
              )}
            </div>
          </div>

          {kmInicial && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Gauge className="h-3 w-3 shrink-0" />
                <span className="truncate">KM Inicial</span>
              </span>
              <span className="text-xs sm:text-sm font-semibold bg-white dark:bg-gray-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded border dark:border-gray-700 truncate">
                {Number(kmInicial).toLocaleString('pt-BR')} km
              </span>
            </div>
          )}
        </div>

        {/* ✅ RESPONSIVO: Período da Reserva */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg p-2 sm:p-3 border dark:border-gray-700">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">Período da Reserva</span>
          </div>

          {/* ✅ RESPONSIVO: Grid empilhado em mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Início */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Início</div>
              <div className="flex flex-col gap-1">
                {dataInicioReserva && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {formatDate(dataInicioReserva)}
                    </span>
                  </div>
                )}
                {horaInicioReserva && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">
                      {horaInicioReserva}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fim */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Fim</div>
              <div className="flex flex-col gap-1">
                {dataFimReserva && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-red-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {formatDate(dataFimReserva)}
                    </span>
                  </div>
                )}
                {horaFimReserva && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-red-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">
                      {horaFimReserva}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ RESPONSIVO: Finalidade */}
        {finalidadeReserva && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">Finalidade da Reserva</span>
            </span>
            <div className="text-xs sm:text-sm bg-white dark:bg-gray-800/50 p-2 sm:p-3 rounded border dark:border-gray-700 break-words">
              {finalidadeReserva}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
