// src/features/programacao-os/utils/valores-das-instrucoes.ts
import type { ValorDaInstrucaoDto } from '@/services/programacao-os.service';

/**
 * O valor de cada instrução na programação (SN-93, D1): vem do cadastro no
 * vínculo e se ajusta só nesta programação, sem mexer no padrão da instrução —
 * como na proposta e no AupusProject. A linha é a da tarefa (do plano) ou a da
 * instrução avulsa; a chave diz qual, e é o que a API recebe.
 */
export interface LinhaDeValor {
  /** `tarefa:<id>` ou `instrucao:<id>` */
  chave: string;
  nome: string;
  equipamento: string | null;
  /** O valor gravado nesta programação */
  valor: number | null;
  /** O do cadastro no vínculo */
  original: number | null;
  /** A linha de antes do SN-93, sem valor congelado: o valor é o do cadastro de hoje */
  doCadastroHoje: boolean;
}

/** O ajuste digitado, pela chave da linha; null volta ao do cadastro */
export type AjustesDeValor = Record<string, number | null>;

const juntar = (...partes: (string | null | undefined)[]) => partes.map((p) => p?.trim()).filter(Boolean).join(' · ');

/** O que se lê de cada linha da programação (a resposta da API, ou a entidade aberta no sheet) */
interface ValorDaLinha {
  valor?: number | null;
  valor_original?: number | null;
  equipamento_nome?: string | null;
  do_cadastro_hoje?: boolean;
}
interface LinhaDaTarefa extends ValorDaLinha {
  tarefa_id?: string | null;
  instrucao_tag?: string | null;
  nome_snapshot?: string | null;
  tarefa?: { nome?: string | null } | null;
}
interface LinhaDaAvulsa extends ValorDaLinha {
  instrucao_id?: string | null;
  codigo?: string | null;
  nome?: string | null;
}

export function linhasDeValor(programacao?: { tarefas_programacao?: LinhaDaTarefa[]; instrucoes?: LinhaDaAvulsa[] } | null): LinhaDeValor[] {
  const tarefas = (programacao?.tarefas_programacao ?? [])
    .filter((t) => t.tarefa_id?.trim())
    .map((t) => ({
      chave: `tarefa:${t.tarefa_id!.trim()}`,
      nome: juntar(t.instrucao_tag, t.nome_snapshot || t.tarefa?.nome) || 'Tarefa',
      equipamento: t.equipamento_nome?.trim() || null,
      valor: t.valor ?? null,
      original: t.valor_original ?? null,
      doCadastroHoje: t.do_cadastro_hoje === true,
    }));
  const avulsas = (programacao?.instrucoes ?? [])
    .filter((i) => i.instrucao_id?.trim())
    .map((i) => ({
      chave: `instrucao:${i.instrucao_id!.trim()}`,
      nome: juntar(i.codigo, i.nome) || 'Instrução',
      equipamento: i.equipamento_nome?.trim() || null,
      valor: i.valor ?? null,
      original: i.valor_original ?? null,
      doCadastroHoje: i.do_cadastro_hoje === true,
    }));
  return [...tarefas, ...avulsas];
}

/** O valor que a linha mostra: o digitado agora, ou o gravado */
export const valorNaTela = (linha: LinhaDeValor, ajustes: AjustesDeValor) =>
  linha.chave in ajustes ? (ajustes[linha.chave] ?? linha.original) : linha.valor;

export function valoresDoPedido(ajustes: AjustesDeValor = {}): ValorDaInstrucaoDto[] {
  return Object.entries(ajustes).map(([chave, valor]) => {
    const [tipo, ...resto] = chave.split(':');
    const id = resto.join(':');
    // O campo aceita 4 casas; o valor, 2
    const emCentavos = valor === null ? null : Math.round(valor * 100) / 100;
    return tipo === 'tarefa' ? { tarefa_id: id, valor: emCentavos } : { instrucao_id: id, valor: emCentavos };
  });
}
