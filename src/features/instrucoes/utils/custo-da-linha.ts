import { formatarHoras } from '@/utils/horas';

/**
 * O custo da linha da instrução, para o editor mostrar o total mudando enquanto
 * se digita. É o espelho da conta do servidor (`modules/instrucoes/custo-da-instrucao.ts`,
 * a BaseDeCusto do AupusProject, SN-85): o número que vale é o que a API devolve
 * em cada linha (`subtotal`), e é ele que a proposta e a planilha leem. **Mudou
 * a fórmula lá, muda aqui junto.**
 *
 * | Cobrança | Unidades                                   |
 * | -------- | ------------------------------------------ |
 * | hora     | as horas da linha                          |
 * | diária   | horas ÷ jornada, para cima (0 h = 0)       |
 * | unidade  | quantidade × (1 + perda); a quantidade não multiplica de novo |
 * | km       | a distância                                |
 * | fechado  | 1                                          |
 */

export type BaseDaLinha = 'hora' | 'diaria' | 'unidade' | 'km' | 'fechado';

/** O que a conta lê do item (recurso ou maquinário) */
export interface ItemCobravel {
  base_calculo?: string | null;
  horas_por_diaria?: number | null;
  /** O preço de UMA unidade da cobrança, apurado pelo servidor */
  preco_base?: number | null;
}

/** O que a conta lê da linha; vazio vale o padrão (quantidade 1, o resto 0) */
export interface DadosDaLinha {
  quantidade?: number | string | null;
  duracao_horas?: number | string | null;
  /** Fração: 0,10 = 10% */
  fator_perda?: number | string | null;
  fornecido_pelo_cliente?: boolean;
  distancia_km?: number | string | null;
  /** Vazio = o preço do cadastro */
  preco_proprio?: number | string | null;
}

export const numeroDaLinha = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/** Centavos, metade para longe do zero, como o servidor (o round() do PHP) */
const centavos = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;

/** A cobrança que pede duração (hora, diária), distância (km) ou perda (unidade): é o que decide os campos da linha */
export const pedeDuracao = (base?: string | null) => base === 'hora' || base === 'diaria';
export const pedeDistancia = (base?: string | null) => base === 'km';
export const pedePerda = (base?: string | null) => base === 'unidade';

export function unidadesDaLinha(item: ItemCobravel | undefined, linha: DadosDaLinha): number {
  const duracao = numeroDaLinha(linha.duracao_horas) ?? 0;
  switch (item?.base_calculo) {
    case 'hora':
      return duracao;
    case 'diaria':
      return duracao <= 0 ? 0 : Math.ceil(duracao / Math.max(item.horas_por_diaria ?? 8, 1));
    case 'unidade':
      return Math.round(((numeroDaLinha(linha.quantidade) ?? 1) * (1 + (numeroDaLinha(linha.fator_perda) ?? 0)) + Number.EPSILON) * 10_000) / 10_000;
    case 'km':
      return numeroDaLinha(linha.distancia_km) ?? 0;
    default:
      return 1;
  }
}

/** O preço que a conta usa: o próprio da linha, ou o do cadastro */
export const precoDaLinha = (item: ItemCobravel | undefined, linha: DadosDaLinha): number | null =>
  numeroDaLinha(linha.preco_proprio) ?? numeroDaLinha(item?.preco_base);

/** Nulo sem preço (nunca zero); zero no fornecido pelo cliente, que não precisa de preço */
export function subtotalDaLinha(item: ItemCobravel | undefined, linha: DadosDaLinha): number | null {
  if (linha.fornecido_pelo_cliente) return 0;
  const preco = precoDaLinha(item, linha);
  if (preco === null) return null;
  const multiplicador = item?.base_calculo === 'unidade' ? 1 : (numeroDaLinha(linha.quantidade) ?? 1);
  return centavos(multiplicador * unidadesDaLinha(item, linha) * preco);
}

/** A soma, com a regra do total: uma linha sem custo deixa a soma nula */
export function somarSubtotais(subtotais: Array<number | null>): number | null {
  let total = 0;
  for (const s of subtotais) {
    if (s === null) return null;
    total += s;
  }
  return centavos(total);
}

const decimal = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

/** O uso da linha em texto curto: "2 × 3h (2 diárias)", "40 m + 10%", "120 km", "3 ×" */
export function descreverUso(item: (ItemCobravel & { unidade?: string | null }) | undefined, linha: DadosDaLinha): string {
  const quantidade = numeroDaLinha(linha.quantidade) ?? 1;
  const vezes = quantidade === 1 ? '' : `${decimal(quantidade)} × `;
  switch (item?.base_calculo) {
    case 'hora':
      return `${vezes}${formatarHoras(numeroDaLinha(linha.duracao_horas) ?? 0)}`;
    case 'diaria': {
      const diarias = unidadesDaLinha(item, linha);
      return `${vezes}${formatarHoras(numeroDaLinha(linha.duracao_horas) ?? 0)} (${diarias} ${diarias === 1 ? 'diária' : 'diárias'})`;
    }
    case 'unidade': {
      const perda = numeroDaLinha(linha.fator_perda) ?? 0;
      return `${decimal(quantidade)}${item.unidade ? ` ${item.unidade}` : ''}${perda > 0 ? ` + ${decimal(perda * 100)}%` : ''}`;
    }
    case 'km':
      return `${vezes}${decimal(numeroDaLinha(linha.distancia_km) ?? 0)} km`;
    default:
      return quantidade === 1 ? 'valor fechado' : `${decimal(quantidade)} × valor fechado`;
  }
}
