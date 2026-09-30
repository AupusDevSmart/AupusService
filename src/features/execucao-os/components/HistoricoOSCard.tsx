// src/features/execucao-os/components/HistoricoOSCard.tsx
import { History } from 'lucide-react';
import type { HistoricoOS } from '../types';

/**
 * Trilha de transicoes da OS.
 *
 * A API ja devolvia `historico` e o transform-api-data ja o mapeava para o
 * modelo — mas nenhum componente o renderizava, entao o dado chegava no
 * navegador e morria ali. E ele que guarda, por exemplo, o motivo de cada
 * pausa: o painel de pausar coleta o motivo e o backend o registra aqui, nao
 * em coluna propria. Por isso o campo "Motivo das Pausas" do sheet vivia
 * vazio, e por isso ele foi removido em favor desta trilha — uma OS pode ser
 * pausada varias vezes, e uma coluna so guardaria a ultima.
 */

const acaoLabels: Record<string, string> = {
  CRIACAO: 'Criada',
  CRIACAO_AUTO: 'OS gerada',
  INICIO: 'Iniciada',
  INICIO_EXECUCAO: 'Iniciada',
  PAUSA: 'Pausada',
  RETOMADA: 'Retomada',
  EXECUCAO: 'Executada',
  AUDITORIA: 'Auditada',
  FINALIZACAO: 'Finalizada',
  CANCELAMENTO: 'Cancelada',
  REABERTURA: 'Reaberta',
  PROGRAMACAO: 'Programada',
  CONCLUSAO_TAREFA: 'Tarefa feita',
  CANCELAMENTO_TAREFA: 'Tarefa não feita',
  TAREFA_NAO_FEITA: 'Tarefa não feita',
  REABERTURA_TAREFA: 'Tarefa reaberta',
  ATUALIZACAO_CHECKLIST: 'Checklist atualizado',
  CONSUMO_MATERIAIS: 'Materiais registrados',
  USO_FERRAMENTAS: 'Ferramentas registradas',
};

// O histórico da programação chega junto, com o prefixo "[PROGRAMAÇÃO] "
const acaoDaProgramacaoLabels: Record<string, string> = {
  CRIACAO: 'Programação criada',
  APROVACAO: 'Programação aprovada',
  ANALISE: 'Programação em análise',
  ATUALIZACAO: 'Programação atualizada',
  CANCELAMENTO: 'Programação cancelada',
  FINALIZACAO: 'Programação finalizada',
  EXCLUSAO: 'Programação excluída',
  ADICAO_TAREFAS: 'Tarefas adicionadas',
  ATUALIZACAO_TAREFAS: 'Tarefas atualizadas',
  REMOCAO_TAREFA: 'Tarefa removida',
};

const legivel = (codigo: string) => {
  const texto = codigo.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/** Rótulo da ação para a pessoa: nunca o código cru ("TAREFA_NAO_FEITA"). */
export function rotuloDaAcao(acao: string): string {
  const daProgramacao = acao.match(/^\[PROGRAMA[^\]]*\]\s*(.+)$/);
  if (daProgramacao) {
    const codigo = daProgramacao[1].trim();
    return acaoDaProgramacaoLabels[codigo] || `Programação: ${legivel(codigo).toLowerCase()}`;
  }
  return acaoLabels[acao] || legivel(acao);
}

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_EXECUCAO: 'Em Execução',
  PAUSADA: 'Pausada',
  EXECUTADA: 'Executada',
  AUDITADA: 'Auditada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const formatarQuando = (data?: string) => {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

interface HistoricoOSCardProps {
  historico?: HistoricoOS[];
}

export function HistoricoOSCard({ historico = [] }: HistoricoOSCardProps) {
  if (historico.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        Sem registros ainda.
      </div>
    );
  }

  // Mais recente primeiro: o que interessa ao abrir e o ultimo movimento.
  const entradas = [...historico].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );

  return (
    <div className="border border-border rounded-md divide-y divide-border">
      {entradas.map((entrada) => {
        const quando = formatarQuando(entrada.data);
        const transicao =
          entrada.status_anterior && entrada.status_novo
            ? `${statusLabels[entrada.status_anterior] || entrada.status_anterior} → ${
                statusLabels[entrada.status_novo] || entrada.status_novo
              }`
            : null;

        return (
          <div key={entrada.id} className="px-3 py-2 space-y-0.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                {rotuloDaAcao(entrada.acao)}
              </span>
              {quando && (
                <span className="text-xs text-muted-foreground flex-shrink-0">{quando}</span>
              )}
            </div>

            <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
              {entrada.usuario && <span>{entrada.usuario}</span>}
              {entrada.usuario && transicao && <span>·</span>}
              {transicao && <span>{transicao}</span>}
            </div>

            {entrada.observacoes?.trim() && (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {entrada.observacoes.trim()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
