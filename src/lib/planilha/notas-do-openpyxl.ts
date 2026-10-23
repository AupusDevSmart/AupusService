/**
 * A planilha gerada pelo openpyxl (Python: é como uma IA monta a planilha a
 * partir da COMO PREENCHER) grava as notas das células onde o exceljs não as
 * procura, e ele quebra ao abrir ("Cannot read properties of undefined (reading
 * 'comments')"). Achado ao importar equipamentos em 23/out/2026 (SN-98):
 *
 *   openpyxl                          exceljs espera
 *   xl/comments/comment1.xml          xl/comments1.xml
 *   xl/drawings/commentsDrawing1.vml  xl/drawings/vmlDrawing1.vml
 *
 * Aqui as partes mudam de nome, e as relações das abas e o [Content_Types].xml
 * acompanham. O conteúdo das abas e das notas não muda.
 *
 * O JSZip entra aqui em cima, não por import(): este módulo já é baixado sob
 * demanda (`abrirLivro`), e assim a falha de download é uma só, a do módulo.
 */
import JSZip from 'jszip';

/** Tem notas no lugar do openpyxl? (Só então vale reescrever o arquivo.) */
export async function temNotasDoOpenpyxl(arquivo: ArrayBuffer): Promise<boolean> {
  const zip = await JSZip.loadAsync(arquivo);
  return Object.keys(zip.files).some((nome) => /^xl\/comments\/comment\d+\.xml$/.test(nome));
}

export async function comNotasNoLugar(arquivo: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(arquivo);

  const mover = async (de: string, para: string) => {
    const parte = zip.file(de);
    if (!parte || zip.file(para)) return false;
    zip.file(para, await parte.async('uint8array'));
    zip.remove(de);
    return true;
  };

  for (const nome of Object.keys(zip.files).filter((n) => /^xl\/worksheets\/_rels\/[^/]+\.rels$/.test(n))) {
    let xml = await zip.file(nome)!.async('string');
    const original = xml;
    for (const [alvo, n] of [...xml.matchAll(/Target="(?:\/xl\/|\.\.\/)comments\/comment(\d+)\.xml"/g)].map((m) => [m[0], m[1]] as const)) {
      if (await mover(`xl/comments/comment${n}.xml`, `xl/comments${n}.xml`)) xml = xml.replace(alvo, `Target="../comments${n}.xml"`);
    }
    for (const [alvo, n] of [...xml.matchAll(/Target="(?:\/xl\/|\.\.\/)drawings\/commentsDrawing(\d+)\.vml"/g)].map((m) => [m[0], m[1]] as const)) {
      if (await mover(`xl/drawings/commentsDrawing${n}.vml`, `xl/drawings/vmlDrawing${n}.vml`)) xml = xml.replace(alvo, `Target="../drawings/vmlDrawing${n}.vml"`);
    }
    if (xml !== original) zip.file(nome, xml);
  }

  const tipos = zip.file('[Content_Types].xml');
  if (tipos) {
    const xml = await tipos.async('string');
    zip.file('[Content_Types].xml', xml.replace(/PartName="\/xl\/comments\/comment(\d+)\.xml"/g, 'PartName="/xl/comments$1.xml"'));
  }
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
}
