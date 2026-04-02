// src/features/instrucoes/config/table-config.tsx
import { Tag, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { InstrucaoApiResponse, StatusInstrucao, CategoriaTarefa, TipoManutencao } from '@/services/instrucoes.services';

const formatarStatus = (status: StatusInstrucao) => {
  const configs = {
    ATIVA: { label: 'Ativa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    INATIVA: { label: 'Inativa', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    EM_REVISAO: { label: 'Em Revisao', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

const formatarCategoria = (categoria: CategoriaTarefa) => {
  const labels: Record<string, string> = {
    MECANICA: 'Mecanica',
    ELETRICA: 'Eletrica',
    INSTRUMENTACAO: 'Instrumentacao',
    LUBRIFICACAO: 'Lubrificacao',
    LIMPEZA: 'Limpeza',
    INSPECAO: 'Inspecao',
    CALIBRACAO: 'Calibracao',
    OUTROS: 'Outros'
  };
  return labels[categoria] || categoria;
};

const formatarTipoManutencao = (tipo: TipoManutencao) => {
  const labels: Record<string, string> = {
    PREVENTIVA: 'Preventiva',
    PREDITIVA: 'Preditiva',
    CORRETIVA: 'Corretiva',
    INSPECAO: 'Inspecao',
    VISITA_TECNICA: 'Visita Tecnica'
  };
  return labels[tipo] || tipo;
};

const formatarCriticidade = (criticidade: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    '1': { label: 'Muito Baixa', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    '2': { label: 'Baixa', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    '3': { label: 'Media', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    '4': { label: 'Alta', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    '5': { label: 'Muito Alta', color: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100' }
  };
  return configs[criticidade] || { label: criticidade, color: 'bg-gray-100 text-gray-800' };
};

export const instrucoesTableColumns: TableColumn<InstrucaoApiResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Instrucao',
    sortable: true,
    render: (instrucao) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Tag className="h-4 w-4 text-gray-600" />
          <span className="font-mono text-sm">{instrucao.tag}</span>
        </div>
        <div className="text-sm font-medium truncate max-w-52" title={instrucao.nome}>
          {instrucao.nome}
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-52" title={instrucao.descricao}>
          {instrucao.descricao}
        </div>
      </div>
    )
  },
  {
    key: 'classificacao',
    label: 'Classificacao',
    render: (instrucao) => (
      <div className="space-y-1">
        <div className="text-sm">{formatarCategoria(instrucao.categoria)}</div>
        <div className="text-xs text-muted-foreground">
          {formatarTipoManutencao(instrucao.tipo_manutencao)}
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (instrucao) => {
      const statusConfig = formatarStatus(instrucao.status);
      return (
        <Badge className={`text-xs ${statusConfig.color}`}>
          {statusConfig.label}
        </Badge>
      );
    }
  },
  {
    key: 'criticidade',
    label: 'Criticidade',
    render: (instrucao) => {
      const config = formatarCriticidade(String(instrucao.criticidade));
      return (
        <Badge className={`text-xs ${config.color}`}>
          {config.label}
        </Badge>
      );
    }
  },
  {
    key: 'tarefas_derivadas',
    label: 'Tarefas Derivadas',
    render: (instrucao) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>{instrucao.total_tarefas_derivadas ?? 0}</span>
      </div>
    )
  }
];
