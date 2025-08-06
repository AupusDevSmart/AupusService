// src/features/anomalias/config/table-config.tsx - CORES MAIS SUTIS
import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MapPin,
  Wrench
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { Anomalia, StatusAnomalia, PrioridadeAnomalia } from '../types';

// Função para formatar o status com cores mais sutis
const formatarStatus = (status: StatusAnomalia) => {
  const configs = {
    AGUARDANDO: { 
      label: 'Aguardando', 
      color: 'bg-muted text-muted-foreground border border-border' 
    },
    EM_ANALISE: { 
      label: 'Em Análise', 
      color: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' 
    },
    OS_GERADA: { 
      label: 'OS Gerada', 
      color: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50' 
    },
    CANCELADA: { 
      label: 'Cancelada', 
      color: 'bg-muted text-muted-foreground border border-border' 
    },
    RESOLVIDA: { 
      label: 'Resolvida', 
      color: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50' 
    }
  };
  return configs[status] || { label: status, color: 'bg-muted text-muted-foreground border border-border' };
};

// Função para formatar a prioridade com cores mais sutis
const formatarPrioridade = (prioridade: PrioridadeAnomalia) => {
  const configs = {
    BAIXA: { 
      label: 'Baixa', 
      color: 'bg-muted text-muted-foreground border border-border' 
    },
    MEDIA: { 
      label: 'Média', 
      color: 'bg-muted text-muted-foreground border border-border' 
    },
    ALTA: { 
      label: 'Alta', 
      color: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50' 
    },
    CRITICA: { 
      label: 'Crítica', 
      color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' 
    }
  };
  return configs[prioridade] || { label: prioridade, color: 'bg-muted text-muted-foreground border border-border' };
};

// Função para obter ícone da condição
const getCondicaoIcon = (condicao: string) => {
  switch (condicao) {
    case 'PARADO':
      return <XCircle className="h-3 w-3 text-red-500" />;
    case 'FUNCIONANDO':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'RISCO_ACIDENTE':
      return <AlertTriangle className="h-3 w-3 text-red-500" />;
    default:
      return <AlertTriangle className="h-3 w-3 text-gray-400" />;
  }
};

export const anomaliasTableColumns: TableColumn<Anomalia>[] = [
  {
    key: 'dados_principais',
    label: 'Anomalia',
    sortable: true,
    render: (anomalia) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <span className="truncate max-w-48" title={anomalia.descricao}>
            {anomalia.descricao}
          </span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          ID: {anomalia.id.slice(-8)}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {getCondicaoIcon(anomalia.condicao)}
          <span>
            {anomalia.condicao === 'PARADO' ? 'Parado' :
             anomalia.condicao === 'FUNCIONANDO' ? 'Funcionando' :
             'Risco Acidente'}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'local_ativo',
    label: 'Local & Ativo',
    render: (anomalia) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate max-w-32" title={anomalia.local}>
            {anomalia.local}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wrench className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-40" title={anomalia.ativo}>
            {anomalia.ativo}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (anomalia) => {
      const statusConfig = formatarStatus(anomalia.status);
      
      return (
        <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
          {statusConfig.label}
        </Badge>
      );
    }
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    render: (anomalia) => {
      const prioridadeConfig = formatarPrioridade(anomalia.prioridade);
      
      return (
        <Badge variant="outline" className={`text-xs ${prioridadeConfig.color}`}>
          {prioridadeConfig.label}
        </Badge>
      );
    }
  },
  {
    key: 'origem',
    label: 'Origem',
    hideOnMobile: true,
    render: (anomalia) => {
      const origemLabels = {
        SCADA: 'SCADA',
        OPERADOR: 'Operador',
        FALHA: 'Falha'
      };
      
      return (
        <div className="text-sm text-muted-foreground">
          {origemLabels[anomalia.origem]}
        </div>
      );
    }
  },
  {
    key: 'data_criacao',
    label: 'Data & Responsável',
    render: (anomalia) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {new Date(anomalia.data).toLocaleDateString('pt-BR')}
          </span>
        </div>
        {anomalia.criadoPor && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate max-w-24" title={anomalia.criadoPor}>
              {anomalia.criadoPor}
            </span>
          </div>
        )}
      </div>
    )
  },
  {
    key: 'informacoes_cadastro',
    label: 'Cadastro',
    hideOnMobile: true,
    render: (anomalia) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date(anomalia.criadoEm).toLocaleDateString('pt-BR')}
          </span>
        </div>
        {anomalia.atualizadoEm && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Atualizada
            </span>
          </div>
        )}
      </div>
    )
  }
];