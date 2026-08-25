// src/features/solicitacoes-servico/config/table-config.tsx
import { TableColumn } from '@/types/base';
import { SolicitacaoServico } from '../types';
import { StatusCell } from '../components/table-cells/StatusCell';
import { PrioridadeCell } from '../components/table-cells/PrioridadeCell';

/**
 * Colunas da tabela de Solicitacoes.
 *
 * Uma informacao por coluna e uma linha por registro. A primeira celula
 * empilhava numero, titulo e local; com texto longo isso esticava a linha e
 * empurrava o resto da tabela.
 */

/** Celula de uma linha so. `truncate` precisa de `block` para valer. */
const Texto = ({ children, fraco = false }: {
  children: React.ReactNode;
  fraco?: boolean;
}) => (
  <span className={`block truncate text-sm ${fraco ? 'text-muted-foreground' : 'text-foreground'}`}>
    {children}
  </span>
);

const Vazio = () => <Texto fraco>-</Texto>;

const tipoLabels: Record<string, string> = {
  INSTALACAO: 'Instalação',
  MANUTENCAO_CORRETIVA: 'Corretiva',
  MANUTENCAO_PREVENTIVA: 'Preventiva',
  MELHORIA: 'Melhoria',
  OUTRO: 'Outro',
};

/** Data curta. A hora nao ajuda a decidir nada nesta tabela. */
const dataCurta = (valor?: string) => {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
};

export const solicitacoesTableColumns: TableColumn<SolicitacaoServico>[] = [
  {
    key: 'numero',
    label: 'ID',
    width: '10%',
    sortable: true,
    render: (s) => (s.numero ? <Texto>{s.numero}</Texto> : <Vazio />),
  },
  {
    key: 'titulo',
    label: 'Nome',
    width: '24%',
    sortable: true,
    primaryOnMobile: true,
    render: (s) => (s.titulo ? <Texto>{s.titulo}</Texto> : <Vazio />),
  },
  {
    key: 'instalacao',
    label: 'Instalação',
    width: '16%',
    hideOnMobile: true,
    // Vem da relacao, entao nao e ordenavel: nao ha coluna para ordenar.
    render: (s) =>
      (s as any).unidade?.nome ? <Texto>{(s as any).unidade.nome}</Texto> : <Vazio />,
  },
  {
    key: 'status',
    label: 'Status',
    width: '12%',
    sortable: true,
    render: (s) => <StatusCell status={s.status} />,
  },
  {
    key: 'tipo',
    label: 'Tipo',
    width: '12%',
    hideOnMobile: true,
    render: (s) => <Texto>{tipoLabels[s.tipo] || s.tipo}</Texto>,
  },
  {
    key: 'prioridade',
    label: 'Prioridade',
    width: '11%',
    sortable: true,
    render: (s) => <PrioridadeCell prioridade={s.prioridade} />,
  },
  {
    key: 'created_at',
    label: 'Registro',
    width: '10%',
    sortable: true,
    hideOnMobile: true,
    render: (s) => {
      const quando = dataCurta((s as any).created_at);
      return quando ? <Texto fraco>{quando}</Texto> : <Vazio />;
    },
  },
  {
    key: 'total_geral',
    label: 'Valor',
    width: '11%',
    sortable: true,
    render: (s) => {
      const total = Number((s as any).total_geral ?? 0);
      // Sem proposta montada nao ha valor. Mostrar R$ 0,00 se leria como
      // "custa zero", que e outra afirmacao.
      if (!Number.isFinite(total) || total <= 0) return <Vazio />;
      return (
        <span className="block truncate text-sm tabular-nums">
          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      );
    },
  },
];
