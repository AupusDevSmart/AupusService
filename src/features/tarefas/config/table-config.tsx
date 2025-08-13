// src/features/tarefas/config/table-config.tsx
import { 
  Wrench, 
 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Settings,
  Tag,
  Timer,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { Tarefa, StatusTarefa, TipoManutencao, CategoriaTarefa, FrequenciaTarefa } from '../types';

// Função para formatar o status
const formatarStatus = (status: StatusTarefa) => {
  const configs = {
    ATIVA: { label: 'Ativa', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    INATIVA: { label: 'Inativa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    EM_REVISAO: { label: 'Em Revisão', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
    ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

// Função para formatar o tipo de manutenção
const formatarTipoManutencao = (tipo: TipoManutencao) => {
  const configs = {
    PREVENTIVA: { label: 'Preventiva', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    PREDITIVA: { label: 'Preditiva', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    CORRETIVA: { label: 'Corretiva', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    INSPECAO: { label: 'Inspeção', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
    VISITA_TECNICA: { label: 'Visita Técnica', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
  };
  return configs[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800' };
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
    '1': { label: 'Muito Baixa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    '2': { label: 'Baixa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    '3': { label: 'Média', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    '4': { label: 'Alta', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
    '5': { label: 'Muito Alta', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
  };
  return configs[criticidade as keyof typeof configs] || { label: criticidade, color: 'bg-gray-100 text-gray-800' };
};

// Função para formatar duração em horas e minutos
const formatarDuracao = (minutos: number) => {
  if (minutos < 60) {
    return `${minutos}min`;
  }
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  return minutosRestantes > 0 ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
};

export const tarefasTableColumns: TableColumn<Tarefa>[] = [
  {
    key: 'dados_principais',
    label: 'Tarefa',
    sortable: true,
    render: (tarefa) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Tag className="h-4 w-4 text-blue-600" />
          <span className="font-mono text-sm">{tarefa.tag}</span>
          {/* INDICADOR CLARO: Origem da tarefa */}
          {tarefa.origemPlano ? (
            <Badge variant="outline" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Plano
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-gray-50">
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
          {tarefa.customizada && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
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
    render: (tarefa) => {
      // Aqui você integraria com o hook useEquipamentos para buscar os dados
      const equipamentoNome = tarefa.equipamentoId ? `Equipamento ${tarefa.equipamentoId}` : 'N/A';
      const plantaNome = tarefa.plantaId ? `Planta ${tarefa.plantaId}` : 'N/A';
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm truncate max-w-32" title={equipamentoNome}>
              {equipamentoNome}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate max-w-32" title={plantaNome}>
              {plantaNome}
            </span>
          </div>
        </div>
      );
    }
  },
  {
    key: 'tipo_manutencao',
    label: 'Tipo',
    render: (tarefa) => {
      const tipoConfig = formatarTipoManutencao(tarefa.tipoManutencao);
      
      return (
        <Badge className={`text-xs ${tipoConfig.color}`}>
          {tipoConfig.label}
        </Badge>
      );
    }
  },
  {
    key: 'frequencia_duracao',
    label: 'Frequência & Duração',
    render: (tarefa) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {formatarFrequencia(tarefa.frequencia, tarefa.frequenciaPersonalizada)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatarDuracao(tarefa.tempoEstimado)}
          </span>
        </div>
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
            {!tarefa.ativa && (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
          </div>
          {/* INDICADOR CLARO: Status de sincronização */}
          {tarefa.origemPlano && (
            <div className="flex items-center gap-1">
              {tarefa.sincronizada ? (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Sincronizada</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-amber-600">
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
      const criticidadeConfig = formatarCriticidade(tarefa.criticidade);
      
      return (
        <Badge className={`text-xs ${criticidadeConfig.color}`}>
          {criticidadeConfig.label}
        </Badge>
      );
    }
  },
  {
    key: 'responsavel_planejador',
    label: 'Responsável',
    hideOnTablet: true,
    render: (tarefa) => (
      <div className="space-y-1">
        {tarefa.responsavel && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm truncate max-w-24" title={tarefa.responsavel}>
              {tarefa.responsavel}
            </span>
          </div>
        )}
        {tarefa.planejador && (
          <div className="flex items-center gap-2">
            <Settings className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate max-w-24" title={`Planejador: ${tarefa.planejador}`}>
              {tarefa.planejador}
            </span>
          </div>
        )}
      </div>
    )
  },
  {
    key: 'execucoes',
    label: 'Execuções',
    hideOnTablet: true,
    render: (tarefa) => (
      <div className="space-y-1">
        <div className="text-sm font-medium">
          {tarefa.totalExecucoes || 0}x
        </div>
        {tarefa.proximaExecucao && (
          <div className="text-xs text-muted-foreground">
            Próx: {new Date(tarefa.proximaExecucao).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    )
  }
];