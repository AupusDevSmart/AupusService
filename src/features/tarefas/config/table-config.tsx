// src/features/tarefas/config/table-config.tsx
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Tag,
  Timer,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { StatusTarefa, CategoriaTarefa, FrequenciaTarefa } from '../types';
import { TarefaApiResponse } from '@/services/tarefas.services';
import { EquipamentoPlantaCell } from '../components/EquipamentoPlantaCell';

// Função para formatar o status
const formatarStatus = (status: StatusTarefa) => {
  const configs = {
    ATIVA: { label: 'Ativa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    INATIVA: { label: 'Inativa', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    EM_REVISAO: { label: 'Em Revisão', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};


// Função para formatar a categoria
const formatarCategoria = (categoria: CategoriaTarefa) => {
  const labels = {
    MECANICA: 'Mecânica',
    ELETRICA: 'Elétrica',
    INSTRUMENTACAO: 'Instrumentação',
    LUBRIFICACAO: 'Lubrificação',
    LIMPEZA: 'Limpeza',
    INSPECAO: 'Inspeção',
    CALIBRACAO: 'Calibração',
    OUTROS: 'Outros'
  };
  return labels[categoria] || categoria;
};

// Função para formatar a frequência
const formatarFrequencia = (frequencia: FrequenciaTarefa, frequenciaPersonalizada?: number) => {
  const labels = {
    DIARIA: 'Diária',
    SEMANAL: 'Semanal',
    QUINZENAL: 'Quinzenal',
    MENSAL: 'Mensal',
    BIMESTRAL: 'Bimestral',
    TRIMESTRAL: 'Trimestral',
    SEMESTRAL: 'Semestral',
    ANUAL: 'Anual',
    PERSONALIZADA: frequenciaPersonalizada ? `${frequenciaPersonalizada} dias` : 'Personalizada'
  };
  return labels[frequencia] || frequencia;
};

// Função para formatar criticidade
const formatarCriticidade = (criticidade: string) => {
  const configs = {
    '1': { label: 'Muito Baixa', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    '2': { label: 'Baixa', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    '3': { label: 'Média', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    '4': { label: 'Alta', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    '5': { label: 'Muito Alta', color: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100' }
  };
  return configs[criticidade as keyof typeof configs] || { label: criticidade, color: 'bg-gray-100 text-gray-800' };
};


export const tarefasTableColumns: TableColumn<TarefaApiResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Tarefa',
    sortable: true,
    render: (tarefa) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Tag className="h-4 w-4 text-gray-600" />
          <span className="font-mono text-sm">{tarefa.tag}</span>
          {/* INDICADOR CLARO: Origem da tarefa */}
          {tarefa.plano_manutencao_id ? (
            <Badge variant="outline" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Plano
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              Manual
            </Badge>
          )}
        </div>
        <div className="text-sm truncate max-w-48" title={tarefa.descricao}>
          {tarefa.descricao}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatarCategoria(tarefa.categoria)}</span>
          {/* INDICADOR CLARO: Tarefa customizada */}
          {false && ( // Desabilitado temporariamente - campo não existe na API
            <Badge variant="outline" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Customizada
            </Badge>
          )}
        </div>
      </div>
    )
  },
  {
    key: 'equipamento_local',
    label: 'Equipamento & Local',
    render: (tarefa) => (
      <EquipamentoPlantaCell
        equipamentoId={tarefa.equipamento_id}
        plantaId={tarefa.planta_id}
        unidadeId={tarefa.unidade_id}
      />
    )
  },
  {
    key: 'frequencia',
    label: 'Frequência',
    render: (tarefa) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {formatarFrequencia(tarefa.frequencia, tarefa.frequencia_personalizada)}
          </span>
        </div>
        {tarefa.data_ultima_execucao && (
          <div className="flex items-center gap-2">
            <Timer className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Última: {new Date(tarefa.data_ultima_execucao).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    )
  },
  {
    key: 'status_sincronizacao',
    label: 'Status & Sincronização',
    render: (tarefa) => {
      const statusConfig = formatarStatus(tarefa.status);

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
            {!tarefa.ativo && (
              <XCircle className="h-3 w-3 text-gray-500" />
            )}
          </div>
          {/* INDICADOR CLARO: Status de sincronização */}
          {tarefa.plano_manutencao_id && (
            <div className="flex items-center gap-1">
              {false ? ( // Desabilitado temporariamente - campo sincronizada não existe na API
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>Sincronizada</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Dessincronizada</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  },
  {
    key: 'criticidade',
    label: 'Criticidade',
    render: (tarefa) => {
      const criticidadeConfig = formatarCriticidade(String(tarefa.criticidade));

      return (
        <Badge className={`text-xs ${criticidadeConfig.color}`}>
          {criticidadeConfig.label}
        </Badge>
      );
    }
  },
  {
    key: 'execucoes',
    label: 'Execuções',
    hideOnTablet: true,
    render: (tarefa) => (
      <div className="space-y-1">
        <div className="text-sm font-medium">
          {tarefa.numero_execucoes || 0}x
        </div>
        {/* Próxima execução removida temporariamente - não existe na API */}
        {false && (
          <div className="text-xs text-muted-foreground">
            Próx: --
          </div>
        )}
      </div>
    )
  }
];