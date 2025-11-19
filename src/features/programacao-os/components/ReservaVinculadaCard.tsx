// src/features/programacao-os/components/ReservaVinculadaCard.tsx
import React from 'react';
import { Car, Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ReservaVinculada {
  id: string;
  veiculo_id: string;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string;
  hora_fim: string;
  responsavel: string;
  finalidade: string;
  status: string;
  veiculo?: {
    id: string;
    nome: string;
    placa: string;
    marca?: string;
    modelo?: string;
    tipo?: string;
    capacidade_passageiros?: number;
  };
}

interface ReservaVinculadaCardProps {
  reserva?: ReservaVinculada | null;
}

export const ReservaVinculadaCard: React.FC<ReservaVinculadaCardProps> = ({
  reserva
}) => {
  if (!reserva) {
    return (
      <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900 dark:text-amber-100">
            <p className="font-medium">Reserva não encontrada</p>
            <p className="text-amber-700 dark:text-amber-300 mt-1">
              Nenhuma reserva de veículo foi encontrada para esta ordem de serviço.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determinar cor e ícone do status
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ativa':
        return {
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Ativa'
        };
      case 'finalizada':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Finalizada'
        };
      case 'cancelada':
        return {
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          icon: <XCircle className="w-5 h-5" />,
          label: 'Cancelada'
        };
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          icon: <AlertCircle className="w-5 h-5" />,
          label: status
        };
    }
  };

  const statusInfo = getStatusInfo(reserva.status);

  return (
    <div className={`border ${statusInfo.border} rounded-lg p-5 ${statusInfo.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
            <Car className={`w-6 h-6 ${statusInfo.color}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${statusInfo.color}`}>Reserva de Veículo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {reserva.id ? `Reserva #${reserva.id.slice(0, 8)}` : 'Reserva vinculada'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg} border ${statusInfo.border}`}>
          {statusInfo.icon}
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Informações do Veículo */}
      {reserva.veiculo && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {reserva.veiculo.nome}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Placa: {reserva.veiculo.placa} • Tipo: {reserva.veiculo.tipo}
              </p>
              {reserva.veiculo.capacidade_passageiros && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Capacidade: {reserva.veiculo.capacidade_passageiros} passageiros
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade de informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Período */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Período</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {new Date(reserva.data_inicio).toLocaleDateString('pt-BR')} às {reserva.hora_inicio}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">até</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {new Date(reserva.data_fim).toLocaleDateString('pt-BR')} às {reserva.hora_fim}
            </p>
          </div>
        </div>

        {/* Responsável */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Responsável</span>
          </div>
          <p className="pl-6 text-sm text-gray-900 dark:text-gray-100">
            {reserva.responsavel}
          </p>
        </div>
      </div>

      {/* Finalidade */}
      {reserva.finalidade && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Finalidade</span>
          </div>
          <p className="pl-6 text-sm text-gray-900 dark:text-gray-100">
            {reserva.finalidade}
          </p>
        </div>
      )}
    </div>
  );
};
