// src/features/reservas/config/table-config.tsx
import React from 'react';
import { Car, User, Calendar, Clock } from 'lucide-react';
import { ReservaVeiculo } from '../types';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export const reservasTableColumns: TableColumn<ReservaVeiculo>[] = [
  {
    key: 'id',
    label: 'Reserva',
    sortable: true,
    render: (reserva) => (
      <div>
        <div className="font-medium text-gray-900">{reserva.id}</div>
        <div className="text-sm text-gray-500">{reserva.solicitanteId}</div>
        <div className="text-xs text-gray-400 capitalize">
          {reserva.tipoSolicitante.replace('_', ' ')}
        </div>
      </div>
    )
  },
  {
    key: 'veiculoId',
    label: 'Veículo',
    render: (reserva) => {
      // Como não temos acesso aos dados dos veículos aqui, vamos usar o veiculoId
      return (
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">Veículo #{reserva.veiculoId}</div>
            <div className="text-sm text-gray-500">ID: {reserva.veiculoId}</div>
          </div>
        </div>
      );
    }
  },
  {
    key: 'dataInicio',
    label: 'Período',
    sortable: true,
    render: (reserva) => (
      <div>
        <div className="text-sm text-gray-900">
          {reserva.dataInicio} às {reserva.horaInicio}
        </div>
        <div className="text-sm text-gray-500">
          até {reserva.dataFim} às {reserva.horaFim}
        </div>
      </div>
    )
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    sortable: true,
    render: (reserva) => (
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-400" />
        <div>
          <div className="text-sm font-medium text-gray-900">{reserva.responsavel}</div>
          <div className="text-xs text-gray-500">{reserva.finalidade}</div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (reserva) => {
      const configs = {
        ativa: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Ativa' },
        finalizada: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Finalizada' },
        cancelada: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelada' },
        vencida: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Vencida' }
      };
      
      const config = configs[reserva.status];
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
          {config.label}
        </span>
      );
    }
  }
];