// @vitest-environment node
import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArquivoNaoAbriu, abrirLivro, novoLivro } from '@/lib/planilha/estilo';
import { comNotasNoLugar, temNotasDoOpenpyxl } from '@/lib/planilha/notas-do-openpyxl';

/**
 * SN-98: a planilha que o openpyxl grava com notas não abria ("Não foi possível
 * abrir o arquivo"). O arquivo daqui imita o do openpyxl como ele veio em
 * 23/out/2026: as notas em xl/comments/commentN.xml e o desenho em
 * xl/drawings/commentsDrawingN.vml, apontados por caminho absoluto.
 */
async function comoOOpenpyxlGrava(): Promise<ArrayBuffer> {
  const livro = await novoLivro();
  const ws = livro.addWorksheet('01');
  ws.getCell('A1').value = 'EQUIPAMENTO (UC)';
  ws.getCell('A2').value = 'PLANO';
  ws.getCell('A2').note = 'O plano da categoria';
  const zip = await JSZip.loadAsync(await livro.xlsx.writeBuffer());

  const mover = async (de: string, para: string) => {
    zip.file(para, await zip.file(de)!.async('uint8array'));
    zip.remove(de);
  };
  await mover('xl/comments1.xml', 'xl/comments/comment1.xml');
  await mover('xl/drawings/vmlDrawing1.vml', 'xl/drawings/commentsDrawing1.vml');
  const rels = 'xl/worksheets/_rels/sheet1.xml.rels';
  zip.file(
    rels,
    (await zip.file(rels)!.async('string'))
      .replace('Target="../comments1.xml"', 'Target="/xl/comments/comment1.xml"')
      .replace('Target="../drawings/vmlDrawing1.vml"', 'Target="/xl/drawings/commentsDrawing1.vml"'),
  );
  zip.file(
    '[Content_Types].xml',
    (await zip.file('[Content_Types].xml')!.async('string')).replace('PartName="/xl/comments1.xml"', 'PartName="/xl/comments/comment1.xml"'),
  );
  return zip.generateAsync({ type: 'arraybuffer' });
}

const textoDaNota = (nota: unknown) =>
  typeof nota === 'string' ? nota : ((nota as { texts?: Array<{ text: string }> })?.texts ?? []).map((t) => t.text).join('');

describe('planilha com as notas do openpyxl', { timeout: 120_000 }, () => {
  afterEach(() => {
    vi.doUnmock('exceljs');
    vi.doUnmock('@/lib/planilha/notas-do-openpyxl');
    vi.resetModules();
  });

  it('o exceljs sozinho não abre (o defeito), e abrirLivro abre com a nota no lugar', async () => {
    const arquivo = await comoOOpenpyxlGrava();
    const { default: ExcelJS } = await import('exceljs');
    await expect(new ExcelJS.Workbook().xlsx.load(arquivo)).rejects.toThrow();

    const livro = await abrirLivro(new File([arquivo], 'Equipamentos.xlsx'));

    const ws = livro.getWorksheet('01')!;
    expect(ws.getCell('A2').value).toBe('PLANO');
    expect(textoDaNota(ws.getCell('A2').note)).toBe('O plano da categoria');
  });

  it('só reescreve o arquivo do openpyxl: o daqui não tem as notas no lugar dele', async () => {
    const livro = await novoLivro();
    livro.addWorksheet('01').getCell('A1').note = 'nota';
    const daqui = (await livro.xlsx.writeBuffer()) as ArrayBuffer;

    expect(await temNotasDoOpenpyxl(daqui)).toBe(false);
    expect(await temNotasDoOpenpyxl(await comoOOpenpyxlGrava())).toBe(true);
    // E reescrever o que já está no lugar não estraga
    expect(await temNotasDoOpenpyxl(await comNotasNoLugar(await comoOOpenpyxlGrava()))).toBe(false);
  });

  it('arquivo que não é planilha: o motivo é o formato', async () => {
    const erro = await abrirLivro(new File(['não sou uma planilha'], 'x.xlsx')).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ArquivoNaoAbriu);
    expect((erro as ArquivoNaoAbriu).motivo).toBe('formato');
  });

  it('o leitor que não carrega (aba aberta antes do deploy): o motivo é a página desatualizada', async () => {
    vi.resetModules();
    vi.doMock('exceljs', () => {
      throw new TypeError('Failed to fetch dynamically imported module: /assets/exceljs.min-abc123.js');
    });
    const estilo = await import('@/lib/planilha/estilo');

    const erro = await estilo.abrirLivro(new File(['x'], 'x.xlsx')).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(estilo.ArquivoNaoAbriu);
    expect((erro as ArquivoNaoAbriu).motivo).toBe('pagina-desatualizada');
  });

  it('o módulo das notas que não carrega (o exceljs já estava na aba): também é a página desatualizada', async () => {
    vi.resetModules();
    vi.doMock('@/lib/planilha/notas-do-openpyxl', () => {
      throw new TypeError('Failed to fetch dynamically imported module: /assets/notas-do-openpyxl-abc123.js');
    });
    const estilo = await import('@/lib/planilha/estilo');

    const erro = await estilo.abrirLivro(new File(['não sou uma planilha'], 'x.xlsx')).catch((e: unknown) => e);

    expect((erro as ArquivoNaoAbriu).motivo).toBe('pagina-desatualizada');
  });

  it('a exportação com o leitor que não carrega diz para recarregar, não o erro do navegador', async () => {
    vi.resetModules();
    vi.doMock('exceljs', () => {
      throw new TypeError('Failed to fetch dynamically imported module: /assets/exceljs.min-abc123.js');
    });
    const estilo = await import('@/lib/planilha/estilo');

    await expect(estilo.novoLivro()).rejects.toThrow('recarregue a página (Ctrl+F5)');
  });
});
