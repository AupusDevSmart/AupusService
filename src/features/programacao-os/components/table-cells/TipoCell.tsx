// src/features/programacao-os/components/table-cells/TipoCell.tsx

import React from 'react';

interface TipoCellProps {
  tipo: string;
  prioridade: string;
}

const tipoConfig = {
  PREVENTIVA: {
    label: 'Preventiva',
  },
  PREDITIVA: {
    label: 'Preditiva',
  },
  CORRETIVA: {
    label: 'Corretiva',
  },
  INSPECAO: {
    label: 'Inspeção',
  },
};

const prioridadeConfig = {
  BAIXA: {
    label: 'Baixa',
    className: 'text-gray-600 dark:text-gray-400',
  },
  MEDIA: {
    label: 'Média',
    className: 'text-amber-600 dark:text-amber-500',
  },
  ALTA: {
    label: 'Alta',
    className: 'text-orange-600 dark:text-orange-500',
  },
  CRITICA: {
    label: 'Crítica',
    className: 'text-red-600 dark:text-red-500 font-semibold',
  },
};

export function TipoCell({ tipo, prioridade }: TipoCellProps) {
  const tipoConf = tipoConfig[tipo as keyof typeof tipoConfig] || {
    label: tipo,
  };

  const prioridadeConf = prioridadeConfig[prioridade as keyof typeof prioridadeConfig] || {
    label: prioridade,
    className: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-900 dark:text-gray-100">
        {tipoConf.label}
      </span>
      <span className={`text-xs ${prioridadeConf.className}`}>
        {prioridadeConf.label}
      </span>
    </div>
  );
}
