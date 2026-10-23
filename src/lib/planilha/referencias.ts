import type { Workbook } from 'exceljs';

import { AZUL, AZUL_CLARO, BRANCO, preencher, somenteLeitura } from '@/lib/planilha/estilo';

/**
 * A aba REFERÊNCIAS: os nomes válidos de outros cadastros (plantas,
 * instruções, recursos…), para a lista suspensa e para quem preenche saber o
 * que existe. Quem acha o nome é o servidor; a importação só a lê para o que
 * ela cria (SN-98): a categoria do recurso novo, na planilha de instruções
 * (`recursos-da-planilha.ts`).
 */

export type Referencia = {
  /** Como os campos apontam para ela (`Campo.lista = referencia(refs, 'plantas')`). */
  chave: string;
  titulo: string;
  colunas: string[];
  linhas: Array<Array<string | number | null>>;
};

export const ABA_REFERENCIAS = 'REFERÊNCIAS';

/** A fórmula da lista suspensa com os nomes (primeira coluna) de uma referência. */
export function referencia(referencias: Referencia[], qual: string): string | undefined {
  let coluna = 1;
  for (const ref of referencias) {
    if (ref.chave === qual) {
      const letra = letraDaColuna(coluna);
      return `'${ABA_REFERENCIAS}'!$${letra}$3:$${letra}$${Math.max(ref.linhas.length + 2, 3)}`;
    }
    coluna += ref.colunas.length + 1;
  }
  return undefined;
}

function letraDaColuna(n: number): string {
  let letra = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra;
}

export async function abaDeReferencias(livro: Workbook, referencias: Referencia[]) {
  const ws = livro.addWorksheet(ABA_REFERENCIAS);
  let coluna = 1;

  for (const ref of referencias) {
    const titulo = ws.getRow(1).getCell(coluna);
    titulo.value = ref.titulo;
    titulo.font = { bold: true };
    preencher(titulo, AZUL_CLARO);

    ref.colunas.forEach((nome, c) => {
      const celula = ws.getRow(2).getCell(coluna + c);
      celula.value = nome;
      celula.font = { bold: true, color: { argb: BRANCO } };
      preencher(celula, AZUL);
      ws.getColumn(coluna + c).width = c === 0 ? 46 : 18;
    });

    ref.linhas.forEach((valores, r) => {
      valores.forEach((v, c) => (ws.getRow(r + 3).getCell(coluna + c).value = v));
    });

    coluna += ref.colunas.length + 1;
  }

  ws.views = [{ state: 'frozen', ySplit: 2 }];
  await somenteLeitura(ws);
}
