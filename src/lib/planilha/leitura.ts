import type { Cell, CellValue } from 'exceljs';

/**
 * Ler o que alguém (ou uma IA) escreveu numa célula.
 *
 * A planilha volta de qualquer lugar — Excel, LibreOffice, Google Planilhas,
 * um script —, então número pode chegar como número ou como texto "1.234,56",
 * SIM/NÃO como texto ou como booleano, data como data ou como "25/12/2026", e
 * o nome com link como objeto. Cada leitor aqui aceita as formas razoáveis e
 * devolve `undefined` quando não dá para entender, para quem chama dizer o que
 * esperava.
 */

/** Tira acento, caixa e espaço sobrando — a mesma chave que o servidor usa nos nomes. */
export function chave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function bruto(valor: CellValue): unknown {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'object') return valor;
  if (valor instanceof Date) return valor;
  if ('result' in valor) return bruto((valor.result ?? null) as CellValue);
  if ('richText' in valor) return valor.richText.map((parte) => parte.text).join('');
  if ('text' in valor) return bruto(valor.text as CellValue);
  if ('error' in valor) return null;
  return null;
}

/** O conteúdo da célula como texto, sem espaço sobrando; vazio vira `null`. */
export function texto(celula: Cell): string | null {
  const valor = bruto(celula.value);
  if (valor === null) return null;
  if (valor instanceof Date) return valor.toISOString();
  const t = String(valor).trim();
  return t === '' ? null : t;
}

/**
 * Número no formato que vier: 12.5, "12,5", "1.234,56", "R$ 10", "70%".
 * Texto que não é número devolve `undefined` (vazio devolve `null`).
 */
export function numero(celula: Cell): number | null | undefined {
  const valor = bruto(celula.value);
  if (valor === null) return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : undefined;
  if (typeof valor !== 'string') return undefined;

  let t = valor.replace(/R\$|%|\s/g, '');
  if (t === '') return null;

  // Com vírgula, ela é o decimal e o ponto é milhar (pt-BR); sem vírgula, o
  // ponto é o decimal.
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return undefined;

  return Number(t);
}

const VERDADEIROS = new Set(['sim', 's', 'yes', 'y', 'true', 'verdadeiro', '1', 'x']);
const FALSOS = new Set(['nao', 'n', 'no', 'false', 'falso', '0']);

export function simOuNao(celula: Cell): boolean | null | undefined {
  const valor = bruto(celula.value);
  if (valor === null) return null;
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1 ? true : valor === 0 ? false : undefined;

  const k = chave(String(valor));
  if (k === '') return null;
  if (VERDADEIROS.has(k)) return true;
  if (FALSOS.has(k)) return false;
  return undefined;
}

/**
 * Uma opção de lista fixa, pelo rótulo da tela ("Muito alta") ou pelo código
 * ("5"), sem caixa nem acento.
 */
export function opcao<T extends string>(
  celula: Cell,
  rotulos: Record<T, string>,
): T | null | undefined {
  const t = texto(celula);
  if (t === null) return null;

  const k = chave(t);
  for (const [codigo, rotulo] of Object.entries(rotulos) as [T, string][]) {
    if (chave(rotulo) === k || chave(codigo) === k || chave(codigo.replace(/_/g, ' ')) === k) {
      return codigo;
    }
  }

  return undefined;
}

export function rotulosAceitos(rotulos: Record<string, string>): string {
  return Object.values(rotulos).join(' · ');
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/**
 * Uma data de calendário (sem hora), devolvida como `AAAA-MM-DD`.
 *
 * Fuso: o Excel não guarda fuso. A data que a exportação escreve é a meia-noite
 * UTC do dia (`dataParaCelula`), e o exceljs devolve a célula de data como essa
 * mesma meia-noite UTC — por isso a leitura usa os componentes UTC. Com os
 * locais, 25/12 viraria 24/12 em Brasília.
 */
export function data(celula: Cell): string | null | undefined {
  const valor = bruto(celula.value);
  if (valor === null) return null;

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return undefined;
    return `${valor.getUTCFullYear()}-${doisDigitos(valor.getUTCMonth() + 1)}-${doisDigitos(valor.getUTCDate())}`;
  }

  const t = String(valor).trim();
  if (t === '') return null;

  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  const [ano, mes, dia] = br
    ? [Number(br[3]), Number(br[2]), Number(br[1])]
    : iso
      ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
      : [NaN, NaN, NaN];

  const conferida = new Date(Date.UTC(ano, mes - 1, dia));
  if (Number.isNaN(conferida.getTime()) || conferida.getUTCDate() !== dia || conferida.getUTCMonth() !== mes - 1) {
    return undefined;
  }

  return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`;
}

/**
 * `AAAA-MM-DD` (ou o ISO que a API devolve para um campo `@db.Date`, que é a
 * meia-noite UTC do dia) → a meia-noite UTC, que o Excel mostra como aquele
 * dia em qualquer fuso.
 */
export function dataParaCelula(valor: string): Date | null {
  const achado = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!achado) return null;
  return new Date(Date.UTC(Number(achado[1]), Number(achado[2]) - 1, Number(achado[3])));
}
