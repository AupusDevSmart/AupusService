/**
 * As tarefas da OS e o checklist de cada uma, no formato da seção "O que foi
 * feito" (docs/SPEC-EXECUCAO-DA-OS.md).
 *
 * A API manda `tarefas_os` (o vínculo da tarefa na OS, com o nome congelado) e
 * `checklist` (os itens, com `tarefa_os_id` desde 2026-09-30). Item sem
 * tarefa é o genérico de segurança das OS antigas: a seção saiu em 2026-10-01
 * e eles são ignorados. Antes a tela lia `checklist_atividades` e
 * `item.descricao` — campos que a API não manda —, e o checklist chegava vazio.
 *
 * Item de LEITURA (SN-58) conta como feito quando tem valor; fora da faixa, a
 * tarefa só fecha com a observação do item — a mesma regra da API.
 */

import { foraDaFaixa, numeroOuNulo, type TipoDePasso } from '@/utils/leitura';

export type StatusDaTarefa = 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';

export interface ItemDoChecklist {
  id: string;
  texto: string;
  obrigatoria: boolean;
  concluida: boolean;
  tarefaOsId: string | null;
  tipo: TipoDePasso;
  unidade: string | null;
  minimo: number | null;
  maximo: number | null;
  valorLido: number | null;
  observacao: string | null;
  foraDaFaixa: boolean;
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
  /** Leituras fora da faixa ainda sem observação: seguram a tarefa como os obrigatórios */
  leiturasSemExplicacao: number;
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
  observacoes?: string | null;
  tipo?: string | null;
  unidade?: string | null;
  valor_minimo?: number | string | null;
  valor_maximo?: number | string | null;
  valor_lido?: number | string | null;
}

const statusValido = (s?: string | null): StatusDaTarefa =>
  s === 'CONCLUIDA' || s === 'CANCELADA' ? s : 'PENDENTE';

const semExplicacao = (i: ItemDoChecklist) => i.foraDaFaixa && i.concluida && !i.observacao?.trim();

/** Os contadores que seguram o "Feita", refeitos a cada mudança de item. */
function comContagem(t: Omit<TarefaDaExecucao, 'obrigatoriosPendentes' | 'leiturasSemExplicacao'>): TarefaDaExecucao {
  return {
    ...t,
    obrigatoriosPendentes: t.itens.filter((i) => i.obrigatoria && !i.concluida).length,
    leiturasSemExplicacao: t.itens.filter(semExplicacao).length,
  };
}

function itemDaApi(c: ItemDaApi, tarefaOsId: string, prefixo: string): ItemDoChecklist {
  const texto = c.atividade ?? '';
  const minimo = numeroOuNulo(c.valor_minimo);
  const maximo = numeroOuNulo(c.valor_maximo);
  const valorLido = numeroOuNulo(c.valor_lido);
  const tipo: TipoDePasso = c.tipo === 'LEITURA' ? 'LEITURA' : 'VERIFICACAO';
  return {
    id: c.id,
    texto: texto.startsWith(prefixo) ? texto.slice(prefixo.length) : texto,
    obrigatoria: Boolean(c.obrigatoria),
    concluida: Boolean(c.concluida),
    tarefaOsId,
    tipo,
    unidade: c.unidade?.trim() || null,
    minimo,
    maximo,
    valorLido,
    observacao: c.observacoes?.trim() || null,
    foraDaFaixa: tipo === 'LEITURA' && foraDaFaixa(valorLido, { minimo, maximo }),
  };
}

export function montarProgresso(tarefasOs: TarefaOsDaApi[] = [], checklist: ItemDaApi[] = []): ProgressoDaExecucao {
  const ordenado = [...checklist].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const tarefas = [...tarefasOs]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((t) => {
      const id = t.id.trim();
      const nome = t.nome_snapshot || t.instrucao_nome || t.tarefa?.nome || 'Tarefa';
      // O texto guarda o prefixo "Nome: item" (útil no relatório, onde a lista
      // é corrida). Aqui o item já está debaixo da tarefa: o prefixo sobra.
      const itens = ordenado.filter((c) => c.tarefa_os_id?.trim() === id).map((c) => itemDaApi(c, id, `${nome}: `));
      const status = statusValido(t.status);
      return comContagem({
        id,
        nome,
        status,
        motivo: status === 'CANCELADA' ? t.observacoes?.trim() || null : null,
        itens,
      });
    });

  return { tarefas };
}

export type MudancaDoItem = Partial<Pick<ItemDoChecklist, 'concluida' | 'valorLido' | 'observacao'>>;

/**
 * O item depois da mudança, como a API grava: na leitura, ter valor é estar
 * feito, e desmarcar apaga o valor.
 */
function mudarItem(item: ItemDoChecklist, mudanca: MudancaDoItem): ItemDoChecklist {
  const novo = { ...item, ...mudanca };
  if (item.tipo === 'LEITURA') {
    if (mudanca.concluida === false) novo.valorLido = null;
    novo.concluida = novo.valorLido !== null;
    novo.foraDaFaixa = foraDaFaixa(novo.valorLido, { minimo: item.minimo, maximo: item.maximo });
  }
  return novo;
}

export function aplicarItem(p: ProgressoDaExecucao, itemId: string, mudanca: MudancaDoItem): ProgressoDaExecucao {
  return {
    tarefas: p.tarefas.map((t) =>
      t.itens.some((i) => i.id === itemId)
        ? comContagem({ ...t, itens: t.itens.map((i) => (i.id === itemId ? mudarItem(i, mudanca) : i)) })
        : t,
    ),
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
