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

/** O autor gravado no livro: é por ele que a importação reconhece a planilha de outro sistema */
export const CRIADOR_DO_LIVRO = 'Aupus Service';

/** O que a tela diz quando o leitor de planilhas não baixa: a aba é de antes do último deploy */
export const MENSAGEM_DA_PAGINA_DESATUALIZADA =
  'O sistema foi atualizado desde que esta página abriu: recarregue a página (Ctrl+F5) e tente de novo.';

/** Cria o livro. A biblioteca só carrega aqui — fora do pacote inicial. */
export async function novoLivro(): Promise<Workbook> {
  let ExcelJS: typeof import('exceljs');
  try {
    ExcelJS = (await import('exceljs')).default;
  } catch {
    throw new Error(MENSAGEM_DA_PAGINA_DESATUALIZADA);
  }
  const livro = new ExcelJS.Workbook();
  livro.creator = CRIADOR_DO_LIVRO;
  livro.created = new Date();
  return livro;
}

/**
 * Por que o arquivo não abriu, para a tela dizer o que fazer (até o SN-98 era
 * sempre "envie em .xlsx", e nas duas vezes de 23/out/2026 o arquivo era .xlsx):
 * - `pagina-desatualizada`: o leitor de planilhas é baixado sob demanda, e a aba
 *   aberta antes de um deploy pede o arquivo antigo, que não existe mais;
 * - `formato`: o leitor não entendeu o arquivo (o `detalhe` diz onde).
 */
export class ArquivoNaoAbriu extends Error {
  constructor(
    readonly motivo: 'pagina-desatualizada' | 'formato',
    readonly detalhe: string,
  ) {
    super(detalhe);
  }
}

export async function abrirLivro(arquivo: File): Promise<Workbook> {
  let ExcelJS: typeof import('exceljs');
  try {
    ExcelJS = (await import('exceljs')).default;
  } catch (erro) {
    throw new ArquivoNaoAbriu('pagina-desatualizada', erro instanceof Error ? erro.message : String(erro));
  }

  const conteudo = await arquivo.arrayBuffer();
  const livro = new ExcelJS.Workbook();
  try {
    await livro.xlsx.load(conteudo);
    return livro;
  } catch (erro) {
    // A planilha do openpyxl com notas: acerta o lugar delas e tenta de novo.
    // O módulo (com o JSZip dentro) também é baixado sob demanda: falhar aqui é a página desatualizada.
    let notas: typeof import('@/lib/planilha/notas-do-openpyxl');
    try {
      notas = await import('@/lib/planilha/notas-do-openpyxl');
    } catch (deImportar) {
      throw new ArquivoNaoAbriu('pagina-desatualizada', deImportar instanceof Error ? deImportar.message : String(deImportar));
    }
    const { temNotasDoOpenpyxl, comNotasNoLugar } = notas;
    // Não abrir como zip quer dizer que não é .xlsx: o motivo é o do exceljs
    if (!(await temNotasDoOpenpyxl(conteudo).catch(() => false))) {
      throw new ArquivoNaoAbriu('formato', erro instanceof Error ? erro.message : String(erro));
    }
    const corrigido = new ExcelJS.Workbook();
    try {
      await corrigido.xlsx.load(await comNotasNoLugar(conteudo));
      return corrigido;
    } catch (deNovo) {
      throw new ArquivoNaoAbriu('formato', deNovo instanceof Error ? deNovo.message : String(deNovo));
    }
  }
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
