// src/features/execucao-os/components/ConcluirExecucao.tsx
import type { ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LinhaDeHoras } from '../utils/horas-da-equipe';
import type { LinhaDeOutroCusto } from '../utils/outros-custos';
import { ActionConfirmPanel, type DadosDaConfirmacao } from './ActionConfirmPanel';

type EntidadeDoPainel = Parameters<typeof ActionConfirmPanel>[0]['entity'];

interface ConcluirExecucaoProps {
  /** O painel aberto (o Executar escolhido aqui ou na tabela) */
  aberto: boolean;
  onAbrir: () => void;
  onFechar: () => void;
  entity: EntidadeDoPainel;
  onConfirm: (data: DadosDaConfirmacao) => Promise<void>;
  /** As tarefas ainda pendentes: cada uma pede o motivo */
  tarefasPendentes: { id: string; nome: string }[];
  totalDeTarefas: number;
  /** As horas e os outros custos digitados nas seções Equipe e Outros custos: vão no Executar */
  horas: LinhaDeHoras[];
  outros: LinhaDeOutroCusto[] | null;
  /** Outro painel de ação aberto no topo (pausar, cancelar): o botão espera, com o motivo */
  bloqueado?: string;
  /** O quadro de custos: dentro do painel, logo antes do botão */
  custos?: ReactNode;
}

/**
 * O fim do sheet da OS em andamento (06/nov/2026): marca-se o que foi feito,
 * registra-se o que foi usado (material, horas, outros custos, cada um ao lado
 * do previsto) e aqui, por último, justifica-se o que faltou e conclui-se.
 *
 * Nenhuma ação rola o sheet (pedido do usuário, 07/nov/2026): o Executar da
 * tabela abre o sheet no topo, com este painel já aberto no fim.
 */
export function ConcluirExecucao({
  aberto,
  onAbrir,
  onFechar,
  entity,
  onConfirm,
  tarefasPendentes,
  totalDeTarefas,
  horas,
  outros,
  bloqueado,
  custos,
}: ConcluirExecucaoProps) {
  if (aberto) {
    return (
      <ActionConfirmPanel
        action="executar"
        entity={entity}
        onConfirm={onConfirm}
        onVoltar={onFechar}
        rotuloVoltar="Fechar sem concluir"
        tarefasPendentes={tarefasPendentes}
        horas={horas}
        outros={outros}
        antesDoBotao={custos}
      />
    );
  }

  const faltam = tarefasPendentes.length;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Concluir a execução</h3>
        <p className="text-xs text-muted-foreground">
          {totalDeTarefas === 0
            ? 'Ao concluir, informe o resultado do serviço.'
            : faltam === 0
              ? 'Todas as tarefas estão feitas. Ao concluir, informe o resultado do serviço.'
              : `${faltam === 1 ? 'Falta 1 tarefa' : `Faltam ${faltam} tarefas`} de ${totalDeTarefas}. Se não der para fazer, ao concluir você informa o motivo, e ela volta para a agenda.`}
        </p>
      </div>
      {bloqueado && <p className="text-xs text-muted-foreground">{bloqueado}</p>}
      <Button type="button" onClick={onAbrir} disabled={!!bloqueado} className="w-full">
        <CheckCircle className="mr-1.5 h-4 w-4" />
        Concluir a execução
      </Button>
    </div>
  );
}
