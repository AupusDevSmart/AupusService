// src/features/execucao-os/utils/outros-custos.ts
import type { ItemOrcamento } from '@/features/programacao-os/types';
import type { NaturezaDoOutroCusto, OutroCustoPedido } from '@/features/execucao-os/types/custos';

/**
 * Os outros custos da OS na tela (SN-93, D2): veículo, hospedagem, alimentação,
 * instrumentos, maquinário e terceiros, conferidos no Executar com o previsto já
 * preenchido, e o não previsto lançado com descrição. Até o SN-93 eles ficavam
 * só no orçamento e o custo real era só mão de obra e material.
 *
 * A mesma lista no painel do Executar e na correção depois dele; a API recebe a
 * lista inteira (o não previsto que sai da tela sai da OS).
 */
export interface LinhaDeOutroCusto {
  /** O id do item, ou `novo:<n>` no não previsto lançado agora */
  chave: string;
  id?: string;
  descricao: string;
  natureza: NaturezaDoOutroCusto;
  /** O do orçamento; null no não previsto */
  previsto: number | null;
  /** O que custou: começa no conferido, ou no previsto */
  valor: number | null;
  naoPrevisto: boolean;
  /** O texto no campo não dá para ler: confirmar mandaria o valor anterior calado */
  ilegivel?: boolean;
}

const NATUREZAS: NaturezaDoOutroCusto[] = ['INSTRUMENTO', 'MAQUINARIO', 'VEICULO', 'TERCEIRO', 'DESPESA_CAMPO', 'OUTRO'];
const natureza = (valor: unknown): NaturezaDoOutroCusto =>
  NATUREZAS.includes(valor as NaturezaDoOutroCusto) ? (valor as NaturezaDoOutroCusto) : 'OUTRO';

export function linhasDosOutrosCustos(itens: ItemOrcamento[] = []): LinhaDeOutroCusto[] {
  return itens
    .filter((i) => i.id?.trim())
    .map((i) => ({
      chave: i.id!.trim(),
      id: i.id!.trim(),
      descricao: i.descricao,
      natureza: natureza(i.natureza),
      previsto: i.nao_previsto ? null : Number(i.valor),
      // O previsto zero ("sem preço no cadastro") começa vazio: em R$ 0, confirmar gravava "conferido R$ 0"
      // e a picape usada saía do custo sem pendência nenhuma
      valor: i.valor_real ?? (i.nao_previsto || Number(i.valor) === 0 ? null : Number(i.valor)),
      naoPrevisto: Boolean(i.nao_previsto),
    }));
}

let novos = 0;
export function linhaNaoPrevista(): LinhaDeOutroCusto {
  novos += 1;
  return { chave: `novo:${novos}`, descricao: '', natureza: 'OUTRO', previsto: null, valor: null, naoPrevisto: true };
}

/** O que impede gravar, numa frase; null quando está tudo certo */
export function pendenciaDosOutrosCustos(linhas: LinhaDeOutroCusto[]): string | null {
  const nome = (l: LinhaDeOutroCusto) => l.descricao.trim() || 'o não previsto sem descrição';
  const ilegiveis = linhas.filter((l) => l.ilegivel).map(nome);
  if (ilegiveis.length > 0) return `Corrija o valor de ${ilegiveis.join(', ')} (ex.: 1.402,50).`;
  if (linhas.some((l) => l.naoPrevisto && !l.descricao.trim())) return 'Diga o que é cada custo não previsto.';
  const semValor = linhas.filter((l) => l.valor === null).map(nome);
  if (semValor.length > 0) return `Informe quanto custou ${semValor.join(', ')} (0 se não houve).`;
  return null;
}

const emCentavos = (v: number) => Math.round(v * 100) / 100;

export function outrosCustosDoPedido(linhas: LinhaDeOutroCusto[]): OutroCustoPedido[] {
  return linhas.map((l) => ({
    ...(l.id && { id: l.id }),
    ...(l.naoPrevisto && { descricao: l.descricao.trim(), natureza: l.natureza }),
    // O campo aceita 4 casas; o custo, 2
    valor_real: emCentavos(l.valor ?? 0),
  }));
}
