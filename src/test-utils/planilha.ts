import type { Workbook } from 'exceljs';

/**
 * Grava o livro em .xlsx e abre de novo — o caminho que a planilha faz entre
 * a exportação e a importação. Ler o livro ainda em memória esconderia o que
 * só aparece no arquivo (data virando número, link virando objeto, texto
 * virando número).
 */
export async function gravarEReabrir(livro: Workbook): Promise<Workbook> {
  const { default: ExcelJS } = await import('exceljs');
  const buffer = await livro.xlsx.writeBuffer();
  const reaberto = new ExcelJS.Workbook();
  await reaberto.xlsx.load(buffer as ArrayBuffer);
  return reaberto;
}
