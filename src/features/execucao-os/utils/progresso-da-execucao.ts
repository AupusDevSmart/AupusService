/**
 * As tarefas da OS e o checklist de cada uma, no formato da seção "O que foi
 * feito" (docs/SPEC-EXECUCAO-DA-OS.md).
 *
 * A API manda `tarefas_os` (o vínculo da tarefa na OS, com o nome congelado) e
 * `checklist` (os itens, com `tarefa_os_id` desde 2026-09-30). Item sem
 * tarefa é o genérico de segurança das OS antigas: a seção saiu em 2026-10-01
 * e eles são ignorados. Antes a tela lia `checklist_atividades` e
 * `item.descricao` — campos que a API não manda —, e o checklist chegava vazio.
 */

export type StatusDaTarefa = 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';

export interface ItemDoChecklist {
  id: string;
  texto: string;
  obrigatoria: boolean;
  concluida: boolean;
  tarefaOsId: string | null;
}

export interface TarefaDaExecucao {
  /** Id do vínculo (tarefas_os.id) — é por ele que a API conclui/reabre */
  id: string;
  nome: string;
  status: StatusDaTarefa;
  /** Motivo registrado quando a tarefa não foi feita */
  motivo: string | null;
  itens: ItemDoChecklist[];
  obrigatoriosPendentes: number;
}

export interface ProgressoDaExecucao {
  tarefas: TarefaDaExecucao[];
}

interface TarefaOsDaApi {
  id: string;
  nome_snapshot?: string | null;
  instrucao_nome?: string | null;
  tarefa?: { nome?: string | null } | null;
  status?: string | null;
  observacoes?: string | null;
  ordem?: number | null;
}

interface ItemDaApi {
  id: string;
  atividade?: string | null;
  obrigatoria?: boolean | null;
  concluida?: boolean | null;
  tarefa_os_id?: string | null;
  ordem?: number | null;
}

const statusValido = (s?: string | null): StatusDaTarefa =>
  s === 'CONCLUIDA' || s === 'CANCELADA' ? s : 'PENDENTE';

const contarPendentes = (itens: ItemDoChecklist[]) =>
  itens.filter((i) => i.obrigatoria && !i.concluida).length;

export function montarProgresso(tarefasOs: TarefaOsDaApi[] = [], checklist: ItemDaApi[] = []): ProgressoDaExecucao {
  const ordenado = [...checklist].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const tarefas = [...tarefasOs]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((t) => {
      const id = t.id.trim();
      const nome = t.nome_snapshot || t.instrucao_nome || t.tarefa?.nome || 'Tarefa';
      // O texto guarda o prefixo "Nome: item" (útil no relatório, onde a lista
      // é corrida). Aqui o item já está debaixo da tarefa: o prefixo sobra.
      const prefixo = `${nome}: `;
      const itens: ItemDoChecklist[] = ordenado
        .filter((c) => c.tarefa_os_id?.trim() === id)
        .map((c) => {
          const texto = c.atividade ?? '';
          return {
            id: c.id,
            texto: texto.startsWith(prefixo) ? texto.slice(prefixo.length) : texto,
            obrigatoria: Boolean(c.obrigatoria),
            concluida: Boolean(c.concluida),
            tarefaOsId: id,
          };
        });
      const status = statusValido(t.status);
      return {
        id,
        nome,
        status,
        motivo: status === 'CANCELADA' ? t.observacoes?.trim() || null : null,
        itens,
        obrigatoriosPendentes: contarPendentes(itens),
      };
    });

  return { tarefas };
}

export function aplicarItem(p: ProgressoDaExecucao, itemId: string, concluida: boolean): ProgressoDaExecucao {
  const marcar = (i: ItemDoChecklist) => (i.id === itemId ? { ...i, concluida } : i);
  return {
    tarefas: p.tarefas.map((t) => {
      const itens = t.itens.map(marcar);
      return { ...t, itens, obrigatoriosPendentes: contarPendentes(itens) };
    }),
  };
}

export function aplicarStatusDaTarefa(
  p: ProgressoDaExecucao,
  tarefaId: string,
  status: StatusDaTarefa,
  motivo: string | null = null,
): ProgressoDaExecucao {
  return {
    ...p,
    tarefas: p.tarefas.map((t) =>
      t.id === tarefaId ? { ...t, status, motivo: status === 'CANCELADA' ? motivo : null } : t,
    ),
  };
}

export function tarefasPendentes(p: ProgressoDaExecucao): TarefaDaExecucao[] {
  return p.tarefas.filter((t) => t.status === 'PENDENTE');
}

