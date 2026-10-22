// src/utils/leitura.ts

/**
 * Leituras no checklist da OS (SN-58): a mesma conta da API
 * (`common/helpers/leitura.ts`), para a tela marcar o fora da faixa na hora em
 * que o valor é digitado, sem esperar a volta. A API manda `fora_da_faixa`
 * pronto; esta conta só vale para o que ainda não foi salvo.
 *
 * Os limites fazem parte da faixa (10 a 20 aceita 10 e 20).
 */

export type TipoDePasso = 'VERIFICACAO' | 'LEITURA';

export interface Faixa {
  minimo: number | null;
  maximo: number | null;
  unidade?: string | null;
}

/** O Decimal pode chegar como texto de outras rotas; vazio é null. */
export function numeroOuNulo(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function foraDaFaixa(valor: number | null, { minimo, maximo }: Faixa): boolean {
  if (valor === null) return false;
  return (minimo !== null && valor < minimo) || (maximo !== null && valor > maximo);
}

/** 1234.5 -> "1.234,5" */
export const numeroBR = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 4 });

const comUnidade = (texto: string, unidade?: string | null) => (unidade?.trim() ? `${texto} ${unidade.trim()}` : texto);

/** "580 a 620 V", "no mínimo 1,5 MΩ", "no máximo 70,5 °C"; sem faixa, vazio. */
export function descreverFaixa({ minimo, maximo, unidade }: Faixa): string {
  if (minimo !== null && maximo !== null) return comUnidade(`${numeroBR(minimo)} a ${numeroBR(maximo)}`, unidade);
  if (minimo !== null) return comUnidade(`no mínimo ${numeroBR(minimo)}`, unidade);
  if (maximo !== null) return comUnidade(`no máximo ${numeroBR(maximo)}`, unidade);
  return '';
}

/** "601,25 V" */
export const formatarLeitura = (valor: number, unidade?: string | null) => comUnidade(numeroBR(valor), unidade);

/**
 * O número como volta para o campo: vírgula decimal e SEM separador de milhar.
 * Com o milhar ("1.234"), sair do campo sem mexer relia o ponto como decimal e
 * regravava 1234 como 1,234 (revisão do SN-58).
 */
export const numeroNoCampo = (n: number | null) => (n === null ? '' : String(n).replace('.', ','));

/** Até 4 casas: a coluna é Decimal(14, 4), e a API recusa mais. */
const CASAS = 4;

/**
 * O que a equipe digitou. Vazio é null (apaga); texto que não dá para ler com
 * certeza é undefined (não salva, a tela avisa). Aceita "601,25", "1.234,5" e
 * "601.25"; recusa "1.500", que tanto pode ser mil e quinhentos quanto um e
 * meio, e mais de 4 casas.
 */
export function lerNumeroDigitado(texto: string): number | null | undefined {
  const limpo = texto.trim().replace(/\s/g, '');
  if (limpo === '') return null;

  const casas = `\\d{1,${CASAS}}`;
  if (limpo.includes(',')) {
    // Com vírgula, o ponto só pode ser de milhar, em grupos de três
    if (!new RegExp(`^-?(\\d{1,3}(\\.\\d{3})+|\\d+),${casas}$`).test(limpo)) return undefined;
    return Number(limpo.replace(/\./g, '').replace(',', '.'));
  }
  // Sem vírgula, "1.500" é ambíguo: pede de novo em vez de adivinhar
  if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) return undefined;
  if (!new RegExp(`^-?\\d+(\\.${casas})?$`).test(limpo)) return undefined;
  return Number(limpo);
}

/** O aviso do campo de dinheiro (`lerDinheiroDigitado`) */
export const AVISO_DE_DINHEIRO = 'Valor com vírgula e até 2 casas (ex.: 1.402,50)';

/**
 * Dinheiro (SN-93): o número de `lerNumeroDigitado` com no máximo 2 casas. Com
 * 4, "1,005" virava 1,00 no arredondamento da tela e 1,01 no da API, e o campo
 * seguia mostrando o digitado.
 */
export function lerDinheiroDigitado(texto: string): number | null | undefined {
  const valor = lerNumeroDigitado(texto);
  if (valor === null || valor === undefined) return valor;
  return Math.round(valor * 100) / 100 === valor ? valor : undefined;
}

/** O dinheiro no campo, com as 2 casas ("181,50", "1.402,50"): o número cru mostrava "181,5" */
export const dinheiroNoCampo = (n: number | null) =>
  n === null ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
