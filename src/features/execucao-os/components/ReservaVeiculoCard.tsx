// src/features/execucao-os/components/ReservaVeiculoCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';

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
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-800/50">
        <CardTitle className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Car className="h-4 w-4" />
          Reserva de Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {/* Veículo e KM - Design minimalista */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Veículo</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {veiculo || 'Não especificado'}
            </div>
          </div>
          {kmInicial && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">KM Inicial</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {Number(kmInicial).toLocaleString('pt-BR')}
              </div>
            </div>
          )}
        </div>

        {/* Período da Reserva - Simplificado */}
        {(dataInicioReserva || dataFimReserva) && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Período</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {dataInicioReserva && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Início:</span>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(dataInicioReserva)}
                    {horaInicioReserva && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        {horaInicioReserva}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {dataFimReserva && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Fim:</span>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(dataFimReserva)}
                    {horaFimReserva && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        {horaFimReserva}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finalidade - Clean design */}
        {finalidadeReserva && (
          <div className="border-t pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Finalidade</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {finalidadeReserva}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};