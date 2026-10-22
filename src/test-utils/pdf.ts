import { inflateSync } from 'node:zlib';
import { cloneElement, type ReactElement } from 'react';
import { pdf } from '@react-pdf/renderer';

/** Um texto que o react-pdf desenhou: a página e onde ele começa e termina, em pt do alto da folha */
export interface TextoDesenhado {
  pagina: number;
  texto: string;
  inicio: number;
  fim: number;
  altura: number;
}

interface NoDoLayout {
  type: string;
  box?: { top?: number; height?: number };
  children?: NoDoLayout[];
  value?: string;
}

function juntarTextos(no: NoDoLayout, topo: number, pagina: number, saida: TextoDesenhado[]) {
  const inicio = topo + (no.box?.top ?? 0);
  if (no.type === 'TEXT') {
    const altura = no.box?.height ?? 0;
    saida.push({ pagina, texto: (no.children ?? []).map((c) => c.value ?? '').join(''), inicio, fim: inicio + altura, altura });
  }
  (no.children ?? []).forEach((filho) => juntarTextos(filho, inicio, pagina, saida));
}

/**
 * O que o react-pdf desenhou, página a página: onde cada texto ficou, que o
 * PDF pronto não diz. `documento` é o `<Document>` (o componente chamado como
 * função, `DocumentoAupus({...})`); o layout sai pelo `onRender` dele, que é
 * interno da biblioteca — sumindo, o erro é aqui, e não um teste que passa vazio.
 */
export async function textosDesenhados(documento: ReactElement): Promise<TextoDesenhado[]> {
  let layout: { children: NoDoLayout[] } | undefined;
  const comLayout = cloneElement(documento as ReactElement<{ onRender?: unknown }>, {
    onRender: (r: { _INTERNAL__LAYOUT__DATA_?: { children: NoDoLayout[] } }) => {
      layout = r._INTERNAL__LAYOUT__DATA_;
    },
  });
  await pdf(comLayout as never).toBuffer();
  if (!layout) throw new Error('o react-pdf deixou de expor o layout pelo onRender (rever textosDesenhados)');
  const saida: TextoDesenhado[] = [];
  layout.children.forEach((pagina, i) => juntarTextos(pagina, 0, i + 1, saida));
  return saida;
}

/**
 * As tabelas ToUnicode de um PDF (uma por fonte embutida): o que diz ao leitor
 * qual caractere é cada glifo. Sem ela certa, o texto do PDF se vê mas não se
 * copia, não se busca e não se lê em voz alta (SN-92).
 */
export function tabelasToUnicode(pdf: Buffer): string[] {
  const texto = pdf.toString('latin1');
  const objetos = new Set([...texto.matchAll(/\/ToUnicode (\d+) 0 R/g)].map((m) => m[1]));
  return [...objetos].map((numero) => {
    const inicio = texto.indexOf(`\n${numero} 0 obj`);
    const cabecalho = texto.slice(inicio, texto.indexOf('stream', inicio));
    const comprimento = Number(/\/Length (\d+)/.exec(cabecalho)?.[1]);
    const dados = texto.indexOf('stream', inicio) + 'stream'.length;
    const corpo = pdf.subarray(dados + (texto[dados] === '\r' ? 2 : 1), dados + (texto[dados] === '\r' ? 2 : 1) + comprimento);
    return (cabecalho.includes('/FlateDecode') ? inflateSync(corpo) : corpo).toString('latin1');
  });
}

/**
 * As entradas vazias ("<>") de cada tabela: o glifo que o leitor não sabe que
 * letra é. Sem tabela nenhuma é erro, e não zero: o formato do PDF mudou e a
 * conferência passaria vazia.
 */
export function entradasVazias(pdf: Buffer): number {
  const tabelas = tabelasToUnicode(pdf);
  if (tabelas.length === 0) throw new Error('o PDF não tem tabela ToUnicode: a conferência não tem o que conferir');
  return tabelas.reduce((soma, tabela) => soma + (tabela.split('beginbfrange')[1]?.match(/<>/g)?.length ?? 0), 0);
}

/** Quantas imagens o PDF embute (a logo e a marca-d'água; as fotos, na OS) */
export function imagensEmbutidas(pdf: Buffer): number {
  return pdf.toString('latin1').match(/\/Subtype\s*\/Image\b/g)?.length ?? 0;
}
