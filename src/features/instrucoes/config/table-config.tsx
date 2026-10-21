// src/features/instrucoes/config/table-config.tsx
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableColumn } from '@/types/base';
import { InstrucaoApiResponse, StatusInstrucao } from '@/services/instrucoes.services';

const formatarStatus = (status: StatusInstrucao) => {
  const configs = {
    ATIVA: { label: 'Ativa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    INATIVA: { label: 'Inativa', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    EM_REVISAO: { label: 'Em Revisão', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
  };
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

export const instrucoesTableColumns: TableColumn<InstrucaoApiResponse>[] = [
  {
    key: 'dados_principais',
    label: 'Instrução',
    sortable: true,
    // So o nome: o codigo e um identificador interno e ocupava a linha de cima
    // da celula, deixando a coluna com duas alturas para um dado que ninguem
    // le. Quem precisa dela continua achando pela busca.
    //
    // O nome aparece INTEIRO: quebra linha em vez de cortar. Ele e o que
    // identifica a instrucao, e "Inspecao termografica do qua..." e
    // "Inspecao termografica do inve..." eram indistinguiveis. O corte antigo
    // (max-w-52, 208px) deixava metade da coluna vazia no desktop. O min-w
    // impede que a descricao espreme o nome numa coluna estreita.
    render: (instrucao) => (
      <div className="text-sm font-medium min-w-[14rem] max-w-md break-words">
        {instrucao.nome}
      </div>
    )
  },
  {
    key: 'descricao',
    label: 'Descrição',
    // A descricao continua cortada — e secundaria, e o texto inteiro esta no
    // sheet —, mas passa a usar a largura que o desktop tem.
    render: (instrucao) => (
      <div
        className="text-sm text-muted-foreground truncate max-w-64 xl:max-w-md"
        title={instrucao.descricao ?? undefined}
      >
        {instrucao.descricao}
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
