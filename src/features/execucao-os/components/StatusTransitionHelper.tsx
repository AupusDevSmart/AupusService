// src/features/execucao-os/components/StatusTransitionHelper.tsx
import React from 'react';
import {
  ArrowRight,
  Play,
  Pause,
  CheckCircle,
  CheckCircle2,
  Shield,
  X,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface StatusTransitionHelperProps {
  currentStatus: string;
}

export function StatusTransitionHelper({ currentStatus }: StatusTransitionHelperProps) {
  const statusConfig = {
    PENDENTE: {
      label: 'Pendente',
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      nextStates: ['EM_EXECUCAO', 'CANCELADA'],
      description: 'OS criada, aguardando inicio',
    },
    EM_EXECUCAO: {
      label: 'Em Execucao',
      icon: Play,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      nextStates: ['PAUSADA', 'EXECUTADA', 'CANCELADA'],
      description: 'OS sendo executada pela equipe',
    },
    PAUSADA: {
      label: 'Pausada',
      icon: Pause,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      nextStates: ['EM_EXECUCAO', 'EXECUTADA', 'CANCELADA'],
      description: 'Execucao temporariamente pausada',
    },
    EXECUTADA: {
      label: 'Executada',
      icon: CheckCircle,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      nextStates: ['AUDITADA'],
      description: 'Execucao concluida, aguardando auditoria',
    },
    AUDITADA: {
      label: 'Auditada',
      icon: Shield,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      nextStates: ['EM_EXECUCAO', 'FINALIZADA'],
      description: 'Auditoria de qualidade realizada',
    },
    FINALIZADA: {
      label: 'Finalizada',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      nextStates: [],
      description: 'OS encerrada definitivamente',
    },
    CANCELADA: {
      label: 'Cancelada',
      icon: X,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      nextStates: [],
      description: 'OS cancelada',
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

      {/* Proximas Transicoes Possiveis */}
      {current.nextStates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Acoes Disponiveis
          </h4>
          <div className="space-y-2">
            {current.nextStates.map((nextState) => {
              const next = statusConfig[nextState as keyof typeof statusConfig];
              if (!next) return null;
              const NextIcon = next.icon;

              let actionLabel = '';
              let actionDescription = '';

              if (currentStatus === 'PENDENTE' && nextState === 'EM_EXECUCAO') {
                actionLabel = 'Iniciar';
                actionDescription = 'Comecar a execucao com equipe definida';
              } else if (currentStatus === 'EM_EXECUCAO' && nextState === 'PAUSADA') {
                actionLabel = 'Pausar';
                actionDescription = 'Interromper temporariamente';
              } else if (currentStatus === 'EM_EXECUCAO' && nextState === 'EXECUTADA') {
                actionLabel = 'Executar';
                actionDescription = 'Registrar resultados da execucao';
              } else if (currentStatus === 'PAUSADA' && nextState === 'EM_EXECUCAO') {
                actionLabel = 'Retomar';
                actionDescription = 'Continuar execucao';
              } else if (currentStatus === 'PAUSADA' && nextState === 'EXECUTADA') {
                actionLabel = 'Executar';
                actionDescription = 'Registrar resultados da execucao';
              } else if (currentStatus === 'EXECUTADA' && nextState === 'AUDITADA') {
                actionLabel = 'Auditar';
                actionDescription = 'Realizar auditoria de qualidade';
              } else if (currentStatus === 'AUDITADA' && nextState === 'EM_EXECUCAO') {
                actionLabel = 'Reabrir';
                actionDescription = 'Reabrir para nova execucao';
              } else if (currentStatus === 'AUDITADA' && nextState === 'FINALIZADA') {
                actionLabel = 'Finalizar';
                actionDescription = 'Encerrar OS definitivamente';
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
                      &rarr; {next.label}
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
            Estado final - Nenhuma acao disponivel
          </span>
        </div>
      )}
    </div>
  );
}