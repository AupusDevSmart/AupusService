// src/features/programacao-os/components/table-cells/TipoCell.tsx

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
    className: 'text-gray-500 dark:text-gray-400',
  },
  MEDIA: {
    label: 'Média',
    className: 'text-gray-500 dark:text-gray-400',
  },
  ALTA: {
    label: 'Alta',
    className: 'text-gray-600 dark:text-gray-300',
  },
  CRITICA: {
    label: 'Crítica',
    className: 'text-gray-700 dark:text-gray-300',
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
