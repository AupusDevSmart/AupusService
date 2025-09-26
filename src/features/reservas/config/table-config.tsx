// src/features/reservas/config/table-config.tsx
import { Car, User, Calendar } from 'lucide-react';
import { ReservaResponse } from '../types';
import { reservasUtils } from '@/services/reservas.services';

import { TableColumn } from '@/types/base';

// Status badge component com suporte a temas dark/light
const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    ativa: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
    finalizada: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    cancelada: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
    vencida: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[status as keyof typeof variants] || variants.vencida}`}>
      {reservasUtils.formatStatus(status as any)}
    </span>
  );
};

export const reservasTableColumns: TableColumn<ReservaResponse>[] = [
  {
    key: 'id',
    label: 'Reserva',
    sortable: true,
    className: 'w-48', // Largura fixa para consistência
    render: (reserva) => (
      <div className="py-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          #{reserva.id.slice(0, 8)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {reserva.solicitanteId || 'N/A'}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
          {reservasUtils.formatTipoSolicitante(reserva.tipoSolicitante)}
        </div>
      </div>
    )
  },
  {
    key: 'veiculo',
    label: 'Veículo',
    className: 'w-56', // Largura adequada para veículo
    render: (reserva) => (
      <div className="flex items-start gap-3 py-1">
        <div className="flex-shrink-0 mt-0.5">
          <Car className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {reserva.veiculo?.nome || `Veículo #${reserva.veiculoId}`}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {reserva.veiculo?.placa || `ID: ${reserva.veiculoId}`}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    sortable: true,
    className: 'w-64', // Espaço extra para nomes e finalidades
    render: (reserva) => (
      <div className="flex items-start gap-3 py-1">
        <div className="flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {reserva.responsavel}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={reserva.finalidade}>
            {reserva.finalidade}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'dataInicio',
    label: 'Período',
    sortable: true,
    className: 'w-48',
    render: (reserva) => (
      <div className="flex items-start gap-3 py-1">
        <div className="flex-shrink-0 mt-0.5">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {reservasUtils.formatDateRange(reserva.dataInicio, reserva.dataFim)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {reservasUtils.formatTimeRange(reserva.horaInicio, reserva.horaFim)}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    className: 'w-32 text-center',
    render: (reserva) => (
      <div className="flex justify-center">
        <StatusBadge status={reserva.status} />
      </div>
    )
  },
  {
    key: 'duracao',
    label: 'Duração',
    sortable: false,
    className: 'w-24 text-right',
    render: (reserva) => (
      <div className="text-right py-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {reservasUtils.calculateDuration(
            reserva.dataInicio,
            reserva.dataFim,
            reserva.horaInicio,
            reserva.horaFim
          ).toFixed(1)}h
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          duração
        </div>
      </div>
    )
  }
];