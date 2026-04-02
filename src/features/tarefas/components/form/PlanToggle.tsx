import { useState, useEffect } from 'react';
import { Calendar, FileX } from 'lucide-react';

interface PlanToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function PlanToggle({ value, onChange, disabled = false }: PlanToggleProps) {
  const [hasPlan, setHasPlan] = useState(value);

  useEffect(() => {
    setHasPlan(value);
  }, [value]);

  const handleToggle = (withPlan: boolean) => {
    if (disabled) return;
    setHasPlan(withPlan);
    onChange(withPlan);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tipo de Tarefa
      </label>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
        <button
          type="button"
          onClick={() => handleToggle(true)}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md
            font-medium text-sm transition-all duration-200
            ${hasPlan
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          <Calendar className="w-4 h-4" />
          <span>Com Plano</span>
        </button>

        <button
          type="button"
          onClick={() => handleToggle(false)}
          disabled={disabled}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md
            font-medium text-sm transition-all duration-200
            ${!hasPlan
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          <FileX className="w-4 h-4" />
          <span>Sem Plano</span>
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {hasPlan
          ? 'Tarefa será vinculada a um plano de manutenção'
          : 'Tarefa independente, pode ser associada a solicitações de serviço'
        }
      </p>
    </div>
  );
}