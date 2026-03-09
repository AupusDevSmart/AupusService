// src/features/tarefas/components/form/OrigemPlanoInfo.tsx
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';

interface OrigemPlanoInfoProps {
  entity?: any;
}

export function OrigemPlanoInfo({ entity }: OrigemPlanoInfoProps) {
  if (!entity?.origemPlano) return null;

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-blue-600" />
        <h4 className="font-medium text-blue-900 dark:text-blue-100">
          Informações do Plano de Origem
        </h4>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-blue-700 dark:text-blue-300">Plano ID: </span>
          <span className="font-mono">{entity.planoManutencaoId}</span>
        </div>

        {entity.versaoTemplate && (
          <div>
            <span className="text-blue-700 dark:text-blue-300">Versão do Template: </span>
            <span>{entity.versaoTemplate}</span>
          </div>
        )}

        <div>
          <span className="text-blue-700 dark:text-blue-300">Status: </span>
          <Badge className={entity.sincronizada ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            {entity.sincronizada ? 'Sincronizada' : 'Dessincronizada'}
          </Badge>
        </div>

        {entity.customizada && (
          <div>
            <span className="text-blue-700 dark:text-blue-300">Customizada: </span>
            <Badge className="bg-orange-100 text-orange-800">
              Sim
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
