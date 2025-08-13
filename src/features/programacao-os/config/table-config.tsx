// src/features/programacao-os/config/table-config.tsx
import { 
  FileText, 
  Clock, 
  Calendar, 
  User,
  MapPin,
  Timer,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { TableColumn } from '@/types/base';
import { OrdemServico, StatusOS, PrioridadeOS } from '../types';

// Função para formatar o status (cores suaves)
const formatarStatus = (status: StatusOS) => {
  const configs = {
    PENDENTE: { label: 'Pendente', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    PLANEJADA: { label: 'Planejada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    PROGRAMADA: { label: 'Programada', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
    EM_EXECUCAO: { label: 'Em Execução', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
    FINALIZADA: { label: 'Finalizada', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' }
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
};

// Função para formatar a prioridade (apenas crítica com cor)
const formatarPrioridade = (prioridade: PrioridadeOS) => {
  const configs = {
    BAIXA: { label: 'Baixa', color: 'text-gray-600 dark:text-gray-400' },
    MEDIA: { label: 'Média', color: 'text-gray-600 dark:text-gray-400' },
    ALTA: { label: 'Alta', color: 'text-orange-600 dark:text-orange-400' },
    CRITICA: { label: 'Crítica', color: 'text-red-600 dark:text-red-400 font-medium' }
  };
  return configs[prioridade] || { label: prioridade, color: 'text-gray-600' };
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

export const programacaoOSTableColumns: TableColumn<OrdemServico>[] = [
  {
    key: 'dados_principais',
    label: 'OS',
    sortable: true,
    render: (os) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="font-mono text-sm">{os.numeroOS}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-48" title={os.descricao}>
          {os.descricao}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {getCondicaoIcon(os.condicoes)}
          <span>
            {os.condicoes === 'PARADO' ? 'Parado' : 'Funcionando'}
          </span>
        </div>
      </div>
    )
  },
  {
    key: 'local_ativo',
    label: 'Local',
    render: (os) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
          <span className="text-sm truncate max-w-32" title={os.local}>
            {os.local}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-40" title={os.ativo}>
          {os.ativo}
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (os) => {
      const statusConfig = formatarStatus(os.status);
      
      return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {statusConfig.label}
        </span>
      );
    }
  },
  {
    key: 'tipo_prioridade',
    label: 'Tipo & Prioridade',
    render: (os) => {
      const prioridadeConfig = formatarPrioridade(os.prioridade);
      
      const tipoLabels = {
        PREVENTIVA: 'Preventiva',
        PREDITIVA: 'Preditiva',
        CORRETIVA: 'Corretiva',
        INSPECAO: 'Inspeção',
        VISITA_TECNICA: 'Visita Técnica'
      };
      
      return (
        <div className="space-y-1">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {tipoLabels[os.tipo]}
          </div>
          <div className={`text-xs ${prioridadeConfig.color}`}>
            {prioridadeConfig.label}
          </div>
        </div>
      );
    }
  },
  {
    key: 'programacao',
    label: 'Programação',
    render: (os) => (
      <div className="space-y-1">
        {os.dataProgramada ? (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400" />
              <span className="text-sm">
                {new Date(os.dataProgramada).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {os.horaProgramada && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {os.horaProgramada}
                </span>
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400">Não programada</span>
        )}
      </div>
    )
  },
  {
    key: 'responsavel',
    label: 'Responsável',
    hideOnMobile: true,
    render: (os) => (
      <div className="space-y-1">
        {os.responsavel && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-sm truncate max-w-24" title={os.responsavel}>
              {os.responsavel}
            </span>
          </div>
        )}
        {os.viatura && (
          <div className="flex items-center gap-2">
            <Truck className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-24" title={String(os.viatura)}>
              VTR-{String(os.viatura || '000').padStart(3, '0')}
            </span>
          </div>
        )}
      </div>
    )
  },
  {
    key: 'duracao',
    label: 'Duração',
    hideOnTablet: true,
    render: (os) => (
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3 text-orange-600 dark:text-orange-400" />
        <span className="text-sm">
          {formatarDuracao(os.duracaoEstimada)}
        </span>
      </div>
    )
  }
];