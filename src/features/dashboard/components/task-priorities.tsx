// src/features/dashboard/components/task-priorities.tsx
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '../types';

interface TaskPrioritiesProps {
  tasks: Task[];
}

interface PriorityConfig {
  variant: string;
  label: string;
}

function TaskPriorities({ tasks }: TaskPrioritiesProps) {
  const priorityConfigs: Record<Task['priority'], PriorityConfig> = {
    urgent: {
      variant: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      label: "URGENTE"
    },
    high: {
      variant: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      label: "ALTA"
    },
    medium: {
      variant: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      label: "MÉDIA"
    },
    low: {
      variant: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      label: "BAIXA"
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const config = priorityConfigs[priority];
    
    return (
      <Badge variant="outline" className={config.variant}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-6 h-full">
      <h3 className="text-lg font-semibold mb-6 text-foreground">
        Prioridades de Tarefas
      </h3>
      
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma tarefa encontrada
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="flex-1 mr-3">
                <p className="text-sm text-foreground font-medium">
                  {task.title}
                </p>
                {task.status !== 'pending' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {task.status === 'in-progress' ? 'Em andamento' : 'Concluída'}
                  </p>
                )}
              </div>
              <div>
                {getPriorityBadge(task.priority)}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export { TaskPriorities };