import type { Cell, Row, Workbook, Worksheet } from 'exceljs';

/**
 * O desenho das planilhas da Aupus (o mesmo das planilhas de cadastro do
 * AupusProject): cabeçalho azul-marinho com texto branco, valor em R$, total
 * em verde-claro e uma cor por seção da ficha.
 */

export const AZUL = 'FF1F4E78';
export const AZUL_CLARO = 'FFD9EAF7';
export const VERDE = 'FFD9EAD3';
export const VERDE_RECURSOS = 'FFE2F0D9';
export const SALMAO = 'FFFCE4D6';
export const AMARELO = 'FFFFF2CC';
export const CINZA = 'FFD9D9D9';
/** Fundo do que o sistema calcula e a importação ignora. */
export const CINZA_CALCULADO = 'FFEDEDED';
export const TEXTO_CALCULADO = 'FF595959';
export const BRANCO = 'FFFFFFFF';
export const MOEDA = '"R$" #,##0.00';

export function cabecalho(linha: Row) {
  linha.eachCell((celula) => {
    celula.font = { bold: true, color: { argb: BRANCO } };
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    celula.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
}

export function total(linha: Row) {
  linha.eachCell({ includeEmpty: true }, (celula) => {
    celula.font = { bold: true };
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
  });
}

export function moeda(celula: Cell) {
  celula.numFmt = MOEDA;
}

export function preencher(celula: Cell, cor: string) {
  celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cor } };
}

/** Célula que o sistema calcula: cinza, e a importação não lê. */
export function calculada(celula: Cell) {
  preencher(celula, CINZA_CALCULADO);
  celula.font = { ...celula.font, color: { argb: TEXTO_CALCULADO } };
}

export function bordaFina(ws: Worksheet, ultimaColuna: number) {
  const fina = { style: 'thin' as const, color: { argb: CINZA } };
  for (let r = 1; r <= ws.rowCount; r++) {
    for (let c = 1; c <= ultimaColuna; c++) {
      ws.getRow(r).getCell(c).border = { top: fina, left: fina, bottom: fina, right: fina };
    }
  }
}

/**
 * Trava a aba contra edição sem senha: quem precisar desfaz pelo Excel, mas
 * ninguém digita ali por engano achando que vai ser importado. Link continua
 * clicável.
 */
export async function somenteLeitura(ws: Worksheet) {
  await ws.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatColumns: true,
    formatRows: true,
  });
}

/** O nome da aba do registro: a ordem dele, com dois dígitos (três passando de 99). */
export function abaDoRegistro(ordem: number, total: number) {
  return String(ordem).padStart(total > 99 ? 3 : 2, '0');
}

/** Link interno para a célula A1 de outra aba. */
export function linkPara(aba: string) {
  return `#'${aba}'!A1`;
}

/** Cria o livro. A biblioteca só carrega aqui — fora do pacote inicial. */
export async function novoLivro(): Promise<Workbook> {
  const { default: ExcelJS } = await import('exceljs');
  const livro = new ExcelJS.Workbook();
  livro.creator = 'Aupus Service';
  livro.created = new Date();
  return livro;
}

export async function abrirLivro(arquivo: File): Promise<Workbook> {
  const { default: ExcelJS } = await import('exceljs');
  const livro = new ExcelJS.Workbook();
  await livro.xlsx.load(await arquivo.arrayBuffer());
  return livro;
}

export async function baixar(livro: Workbook, nome: string) {
  const buffer = await livro.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );

  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revogar na hora cancela o download em alguns navegadores: o clique só
  // agenda, e o arquivo ainda não foi lido do blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "Recursos 2026-10-09.xlsx" — a data no nome diz de quando é a foto. */
export function nomeDoArquivo(cadastro: string) {
  const hoje = new Date();
  const data = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, '0'),
    String(hoje.getDate()).padStart(2, '0'),
  ].join('-');

  return `${cadastro} ${data}.xlsx`;
}
