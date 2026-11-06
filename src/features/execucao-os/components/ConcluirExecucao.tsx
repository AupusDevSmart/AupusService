// src/features/execucao-os/components/ConcluirExecucao.tsx
import { useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  podeInformarValorDaHora: boolean;
  /** Outro painel de ação aberto no topo (pausar, cancelar): o botão espera, com o motivo */
  bloqueado?: string;
}

/**
 * O fim do sheet da OS em andamento (06/nov/2026): marca-se o que foi feito,
 * registra-se o que foi usado, e aqui, por último, justifica-se o que faltou e
 * conclui-se. Antes o painel do Executar abria no topo, e os motivos das tarefas
 * não feitas vinham antes de marcar as feitas.
 *
 * O painel só monta ao clicar: as horas da equipe começam no tempo efetivo de
 * quando se escolhe concluir, não de quando o sheet abriu.
 */
export function ConcluirExecucao({
  aberto,
  onAbrir,
  onFechar,
  entity,
  onConfirm,
  tarefasPendentes,
  totalDeTarefas,
  podeInformarValorDaHora,
  bloqueado,
}: ConcluirExecucaoProps) {
  // O Executar escolhido na tabela abre o sheet com o painel já aberto, no fim:
  // sem rolar, ele ficava fora da tela
  const lugar = useRef<HTMLDivElement>(null);
  const abertoAoMontar = useRef(aberto);
  useEffect(() => {
    if (abertoAoMontar.current) lugar.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, []);

  if (aberto) {
    return (
      <div ref={lugar}>
        <ActionConfirmPanel
          action="executar"
          entity={entity}
          onConfirm={onConfirm}
          onVoltar={onFechar}
          rotuloVoltar="Fechar sem concluir"
          tarefasPendentes={tarefasPendentes}
          podeInformarValorDaHora={podeInformarValorDaHora}
        />
      </div>
    );
  }

  const faltam = tarefasPendentes.length;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Concluir a execução</h3>
        <p className="text-xs text-muted-foreground">
          {totalDeTarefas === 0
            ? 'Ao concluir, informe o resultado do serviço e as horas de quem trabalhou.'
            : faltam === 0
              ? 'Todas as tarefas estão feitas. Ao concluir, informe o resultado e as horas de quem trabalhou.'
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
