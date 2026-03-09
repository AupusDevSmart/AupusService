// src/features/execucao-os/components/StatusTransitionHelper.tsx
import React from 'react';
import {
  ArrowRight,
  Play,
  Pause,
  CheckCircle,
  X,
  Clock,
  FileText,
} from 'lucide-react';

interface StatusTransitionHelperProps {
  currentStatus: string;
}

export function StatusTransitionHelper({ currentStatus }: StatusTransitionHelperProps) {
  const statusConfig = {
    // PLANEJADA removido - OS já começam como PROGRAMADA
    PROGRAMADA: {
      label: 'Programada',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      nextStates: ['EM_EXECUCAO', 'CANCELADA'],
      description: 'OS agendada com data/hora definida',
    },
    EM_EXECUCAO: {
      label: 'Em Execução',
      icon: Play,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      nextStates: ['PAUSADA', 'FINALIZADA', 'CANCELADA'],
      description: 'OS sendo executada pela equipe',
    },
    PAUSADA: {
      label: 'Pausada',
      icon: Pause,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      nextStates: ['EM_EXECUCAO', 'FINALIZADA', 'CANCELADA'],
      description: 'Execução temporariamente pausada',
    },
    FINALIZADA: {
      label: 'Finalizada',
      icon: CheckCircle,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      nextStates: [],
      description: 'OS concluída com sucesso',
    },
    CANCELADA: {
      label: 'Cancelada',
      icon: X,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      nextStates: [],
      description: 'OS cancelada antes da conclusão',
    },
  };

  const current = statusConfig[currentStatus as keyof typeof statusConfig];
  if (!current) return null;

  const Icon = current.icon;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Status Atual */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status Atual
        </h4>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${current.bgColor}`}>
            <Icon className={`h-5 w-5 ${current.color}`} />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {current.label}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {current.description}
            </div>
          </div>
        </div>
      </div>

      {/* Próximas Transições Possíveis */}
      {current.nextStates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ações Disponíveis
          </h4>
          <div className="space-y-2">
            {current.nextStates.map((nextState) => {
              const next = statusConfig[nextState as keyof typeof statusConfig];
              if (!next) return null;
              const NextIcon = next.icon;

              // Determinar a ação baseada na transição
              let actionLabel = '';
              let actionDescription = '';

              // PLANEJADA removido - OS já começam como PROGRAMADA
              if (currentStatus === 'PROGRAMADA' && nextState === 'EM_EXECUCAO') {
                actionLabel = 'Iniciar';
                actionDescription = 'Começar a execução com equipe definida';
              } else if (currentStatus === 'EM_EXECUCAO' && nextState === 'PAUSADA') {
                actionLabel = 'Pausar';
                actionDescription = 'Interromper temporariamente';
              } else if (currentStatus === 'EM_EXECUCAO' && nextState === 'FINALIZADA') {
                actionLabel = 'Finalizar';
                actionDescription = 'Concluir com resultados';
              } else if (currentStatus === 'PAUSADA' && nextState === 'EM_EXECUCAO') {
                actionLabel = 'Retomar';
                actionDescription = 'Continuar execução';
              } else if (currentStatus === 'PAUSADA' && nextState === 'FINALIZADA') {
                actionLabel = 'Finalizar';
                actionDescription = 'Concluir diretamente';
              } else if (nextState === 'CANCELADA') {
                actionLabel = 'Cancelar';
                actionDescription = 'Cancelar com motivo';
              }

              return (
                <div
                  key={nextState}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                >
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <NextIcon className={`h-4 w-4 ${next.color}`} />
                  <div className="flex-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {actionLabel}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      → {next.label}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {actionDescription}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado Final */}
      {current.nextStates.length === 0 && (
        <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Estado final - Nenhuma ação disponível
          </span>
        </div>
      )}
    </div>
  );
}