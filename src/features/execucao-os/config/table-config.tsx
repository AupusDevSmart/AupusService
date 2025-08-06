// src/features/execucao-os/config/table-config.tsx
import React from 'react';
import { 
  FileText, 
  Clock, 
  Calendar, 
  User,
  MapPin,
  Wrench,
  Timer,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { ExecucaoOS, StatusExecucaoOS } from '../types';

// Função para formatar o status de execução
const formatarStatusExecucao = (status: StatusExecucaoOS) => {
  const configs = {
    PROGRAMADA: { label: 'Programada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    EM_EXECUCAO: { label: 'Em Execução', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
    PAUSADA: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' },
    FINALIZADA: { label: 'Finalizada', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' }
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
};

// Função para obter ícone do status
const getStatusIcon = (status: StatusExecucaoOS) => {
  switch (status) {
    case 'PROGRAMADA':
      return <Calendar className="h-3 w-3 text-blue-500" />;
    case 'EM_EXECUCAO':
      return <PlayCircle className="h-3 w-3 text-orange-500" />;
    case 'PAUSADA':
      return <PauseCircle className="h-3 w-3 text-yellow-500" />;
    case 'FINALIZADA':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'CANCELADA':
      return <XCircle className="h-3 w-3 text-red-500" />;
    default:
      return <Clock className="h-3 w-3 text-gray-400" />;
  }
};

// Função para formatar duração em horas e minutos
const formatarTempo = (minutos?: number) => {
  if (!minutos) return '-';
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas === 0) return `${mins}min`;
  if (mins === 0) return `${horas}h`;
  return `${horas}h ${mins}min`;
};

// Função para calcular progresso do checklist
const calcularProgresso = (checklist: any[]) => {
  if (!checklist.length) return 0;
  const concluidas = checklist.filter(item => item.concluida).length;
  return Math.round((concluidas / checklist.length) * 100);
};

export const execucaoOSTableColumns: TableColumn<ExecucaoOS>[] = [
  {
    key: 'dados_os',
    label: 'Ordem de Serviço',
    sortable: true,
    render: (exec) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="font-mono text-sm">{exec.os.numeroOS}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-48" title={exec.os.descricao}>
          {exec.os.descricao}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs border-0 ${exec.os.prioridade === 'CRITICA' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {exec.os.tipo}
          </Badge>
          {exec.os.prioridade === 'CRITICA' && (
            <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0">
              Crítica
            </Badge>
          )}
        </div>
      </div>
    )
  },
  {
    key: 'local_ativo',
    label: 'Local & Ativo',
    render: (exec) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
          <span className="text-sm truncate max-w-32" title={exec.os.local}>
            {exec.os.local}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-40" title={exec.os.ativo}>
          {exec.os.ativo}
        </div>
      </div>
    )
  },
  {
    key: 'status_execucao',
    label: 'Status',
    render: (exec) => {
      const statusConfig = formatarStatusExecucao(exec.statusExecucao);
      
      return (
        <div className="flex items-center gap-2">
          {getStatusIcon(exec.statusExecucao)}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {statusConfig.label}
          </span>
        </div>
      );
    }
  },
  {
    key: 'programacao',
    label: 'Programação',
    render: (exec) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400" />
          <span className="text-sm">
            {new Date(exec.os.dataProgramada!).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {exec.os.horaProgramada}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'execucao_real',
    label: 'Execução Real',
    hideOnMobile: true,
    render: (exec) => (
      <div className="space-y-1">
        {exec.dataInicioReal ? (
          <>
            <div className="flex items-center gap-2">
              <PlayCircle className="h-3 w-3 text-green-500" />
              <span className="text-sm">
                {new Date(exec.dataInicioReal).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {exec.horaInicioReal}
              {exec.horaFimReal && ` - ${exec.horaFimReal}`}
            </div>
          </>
        ) : (
          <span className="text-xs text-gray-400">Não iniciada</span>
        )}
      </div>
    )
  },
  {
    key: 'responsavel_equipe',
    label: 'Responsável & Equipe',
    hideOnMobile: true,
    render: (exec) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-green-600 dark:text-green-400" />
          <span className="text-sm truncate max-w-24" title={exec.responsavelExecucao}>
            {exec.responsavelExecucao}
          </span>
        </div>
        {exec.equipePresente.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {exec.equipePresente.length} pessoas
            </span>
          </div>
        )}
        {exec.os.viatura && typeof exec.os.viatura === 'object' && (
          <div className="flex items-center gap-2">
            <Truck className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-20">
              {exec.os.viatura.veiculo?.placa}
            </span>
          </div>
        )}
      </div>
    )
  },
  {
    key: 'progresso',
    label: 'Progresso',
    hideOnTablet: true,
    render: (exec) => {
      const progresso = calcularProgresso(exec.checklistAtividades);
      const totalAtividades = exec.checklistAtividades.length;
      const concluidasAtividades = exec.checklistAtividades.filter(a => a.concluida).length;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {progresso}%
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {concluidasAtividades}/{totalAtividades} atividades
          </div>
        </div>
      );
    }
  },
  {
    key: 'tempo_duracao',
    label: 'Tempo',
    hideOnTablet: true,
    render: (exec) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Timer className="h-3 w-3 text-orange-600 dark:text-orange-400" />
          <span className="text-sm">
            {formatarTempo(exec.tempoTotalExecucao)}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Est: {formatarTempo(exec.os.duracaoEstimada * 60)}
        </div>
      </div>
    )
  }
];