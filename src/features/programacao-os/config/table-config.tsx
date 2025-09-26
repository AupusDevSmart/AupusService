// src/features/programacao-os/config/table-config.tsx
import {
  FileText,
  MapPin,
  Timer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { TableColumn } from '@/types/base';
import { ProgramacaoResponse } from '@/services/programacao-os.service';

// Função para formatar o status (cores suaves)
const formatarStatus = (status: string) => {
  const configs = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' },
    EM_ANALISE: { label: 'Em Análise', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
    APROVADA: { label: 'Aprovada', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    REJEITADA: { label: 'Rejeitada', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
    CANCELADA: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
  };
  return configs[status as keyof typeof configs] || { label: status, color: 'bg-gray-100 text-gray-700' };
};

// Função para formatar a prioridade
const formatarPrioridade = (prioridade: string) => {
  const configs = {
    BAIXA: { label: 'Baixa', color: 'text-gray-600 dark:text-gray-400' },
    MEDIA: { label: 'Média', color: 'text-gray-600 dark:text-gray-400' },
    ALTA: { label: 'Alta', color: 'text-orange-600 dark:text-orange-400' },
    CRITICA: { label: 'Crítica', color: 'text-red-600 dark:text-red-400 font-medium' }
  };
  return configs[prioridade as keyof typeof configs] || { label: prioridade, color: 'text-gray-600' };
};

// Função para obter ícone da condição
const getCondicaoIcon = (condicao: string) => {
  switch (condicao) {
    case 'PARADO':
      return <XCircle className="h-3 w-3 text-red-500" />;
    case 'FUNCIONANDO':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    default:
      return <AlertTriangle className="h-3 w-3 text-gray-400" />;
  }
};

// Função para formatar duração
const formatarDuracao = (horas: number) => {
  if (horas < 1) {
    return `${Math.round(horas * 60)}min`;
  }
  const horasInteiras = Math.floor(horas);
  const minutos = Math.round((horas - horasInteiras) * 60);
  return minutos > 0 ? `${horasInteiras}h ${minutos}min` : `${horasInteiras}h`;
};

export const programacaoOSTableColumns: TableColumn<ProgramacaoResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Programação',
    sortable: true,
    render: (prog) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="font-mono text-sm">{prog.codigo}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-48" title={prog.descricao}>
          {prog.descricao}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {getCondicaoIcon(prog.condicoes || 'FUNCIONANDO')}
          <span>
            {prog.condicoes === 'PARADO' ? 'Parado' : 'Funcionando'}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'local_ativo',
    label: 'Local',
    render: (prog) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
          <span className="text-sm truncate max-w-32" title={prog.local}>
            {prog.local}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-40" title={prog.ativo}>
          {prog.ativo}
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (prog) => {
      const statusConfig = formatarStatus(prog.status);
      
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      );
    }
  },
  {
    key: 'tipo_prioridade',
    label: 'Tipo & Prioridade',
    render: (prog) => {
      const prioridadeConfig = formatarPrioridade(prog.prioridade);
      
      const tipoLabels = {
        PREVENTIVA: 'Preventiva',
        PREDITIVA: 'Preditiva',
        CORRETIVA: 'Corretiva',
        INSPECAO: 'Inspeção'
      };
      
      return (
        <div className="space-y-1">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {tipoLabels[prog.tipo as keyof typeof tipoLabels] || prog.tipo}
          </div>
          <div className={`text-xs ${prioridadeConfig.color}`}>
            {prioridadeConfig.label}
          </div>
        </div>
      );
    }
  },
  {
    key: 'origem',
    label: 'Origem',
    render: (prog) => {
      const origemLabels = {
        ANOMALIA: 'Anomalia',
        PLANO_MANUTENCAO: 'Plano Manutenção',
        TAREFA: 'Tarefa'
      };

      const origemIcons = {
        ANOMALIA: <AlertTriangle className="h-3 w-3 text-red-500" />,
        PLANO_MANUTENCAO: <Calendar className="h-3 w-3 text-green-500" />,
        TAREFA: <FileText className="h-3 w-3 text-blue-500" />
      };

      const quantidadePlanos = prog.planos_selecionados?.length || (prog.plano_manutencao ? 1 : 0);

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {origemIcons[prog.origem as keyof typeof origemIcons]}
            <span className="text-sm">
              {origemLabels[prog.origem as keyof typeof origemLabels] || prog.origem}
            </span>
          </div>
          {prog.origem === 'PLANO_MANUTENCAO' && quantidadePlanos > 1 && (
            <div className="text-xs text-green-600 dark:text-green-400">
              {quantidadePlanos} planos
            </div>
          )}
        </div>
      );
    }
  },
  {
    key: 'duracao',
    label: 'Duração',
    hideOnTablet: true,
    render: (prog) => (
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3 text-orange-600 dark:text-orange-400" />
        <span className="text-sm">
          {formatarDuracao(prog.duracao_estimada)}
        </span>
      </div>
    )
  }
];