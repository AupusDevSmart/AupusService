// src/features/tarefas/components/TarefasBreadcrumb.tsx
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TarefasBreadcrumbProps {
  planoIdFiltro?: string | null;
}

export function TarefasBreadcrumb({ planoIdFiltro }: TarefasBreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 mb-4 text-sm">
      <button
        onClick={() => navigate('/planos-manutencao')}
        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Planos de Manutenção
      </button>
      <span className="text-gray-400">/</span>
      <span className="text-gray-600 dark:text-gray-400">Tarefas</span>
      {planoIdFiltro && (
        <>
          <span className="text-gray-400">/</span>
          <span className="inline-flex items-center px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
            Plano: {planoIdFiltro}
          </span>
        </>
      )}
    </div>
  );
}
