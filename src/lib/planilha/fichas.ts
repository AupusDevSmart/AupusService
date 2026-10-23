import type { Workbook, Worksheet } from 'exceljs';

import { definir, ehCalculado, escreverCelula, lerCampo, type Campo } from '@/lib/planilha/campos';
import { abaComoPreencher, conferirCadastro, type ComoPreencher } from '@/lib/planilha/como-preencher';
import {
  AZUL,
  AZUL_CLARO,
  BRANCO,
  CINZA,
  abaDoRegistro,
  baixar,
  bordaFina,
  cabecalho,
  linkPara,
  nomeDoArquivo,
  novoLivro,
  preencher,
  somenteLeitura,
} from '@/lib/planilha/estilo';
import { chave, texto } from '@/lib/planilha/leitura';
import { abaDeReferencias, type Referencia } from '@/lib/planilha/referencias';
import {
  ABAS_RESERVADAS,
  type LeituraDaPlanilha,
  type ProblemaDaPlanilha,
  type RegistroDaPlanilha,
} from '@/lib/planilha/tipos';

/**
 * Cadastro com listas dentro (Plantas, Equipamentos, Instruções, Planos):
 * **cada registro é uma aba, e é a aba que se edita e se importa** — o
 * cabeçalho em pares rótulo/valor, depois uma seção por lista, cada uma com o
 * seu cabeçalho colorido. A aba RESUMO é só índice, com link para cada ficha.
 * Registro novo é uma cópia da aba MODELO.
 */

export type SecaoDaFicha<T, L> = {
  /** "UNIDADES" — também o que a leitura procura na coluna A. */
  titulo: string;
  cor: string;
  /** Colunas B em diante. As sem caminho são informação. */
  colunas: Campo<L>[];
  itens: (registro: T) => L[];
  /** Para a COMO PREENCHER: o que a seção guarda e o que acontece com o item que sumiu. */
  explicacao: string;
  /** Só informação: sai em cinza e a importação a ignora inteira. */
  somenteLeitura?: boolean;
  /** A nota do título da seção só de leitura, quando a importação a usa para outra coisa (TAREFAS DO PLANO, SN-98) */
  notaDeLeitura?: string;
};

/**
 * As seções de uma ficha têm itens de tipos diferentes entre si (passos,
 * recursos…), e a lista de seções não tem como dizer isso no tipo. Cada seção
 * é declarada com o tipo do seu item e entra na lista por aqui.
 */
export function secao<T, L>(s: SecaoDaFicha<T, L>): SecaoDaFicha<T, never> {
  return s as unknown as SecaoDaFicha<T, never>;
}

/** Itens lidos de uma seção; ausente quando a seção não está na aba. */
export type SecoesLidas = Record<string, Array<Record<string, unknown>> | undefined>;

export type PlanilhaDeFichas<T> = {
  cadastro: string;
  /** "planta" — para as mensagens. */
  singular: string;
  /** Célula A1 de toda ficha ("PLANTA"). */
  tituloDaFicha: string;
  /** O cabeçalho da ficha, em pares rótulo/valor. */
  campos: Campo<T>[];
  // As seções têm itens de tipos diferentes entre si.
  secoes: SecaoDaFicha<T, never>[];
  /** Colunas do RESUMO — as da tabela da tela. */
  resumo: Campo<T>[];
  /** Largura das colunas A em diante. */
  larguras: number[];
  id: (registro: T) => string;
  nome: (registro: T) => string;
  atualizadoEm: (registro: T) => string | null | undefined;
  /** Como tirar um registro de uso sem apagá-lo, para a COMO PREENCHER. */
  comoTirarDeUso: string;
  /** Cabeçalho + seções lidos → o payload do formulário. */
  montar: (cabecalho: Record<string, unknown>, secoes: SecoesLidas) => Record<string, unknown>;
  /** Problema da aba que nenhum campo sozinho acusa. */
  conferir?: (secoes: SecoesLidas) => string | null;
  /**
   * Linhas depois das seções (os subtotais da instrução, SN-85). Rótulo na
   * coluna A: a leitura as pula, como qualquer rodapé de seção.
   */
  rodape?: (ws: Worksheet, registro: T) => void;
  referencias?: Referencia[];
  regrasDoCadastro?: string[];
  excecoes?: ComoPreencher['excecoes'];
};

const ABA_RESUMO = 'RESUMO';
const ABA_MODELO = 'MODELO';
const ROTULO_ID = 'ID';
const ROTULO_ATUALIZADO = 'ATUALIZADO EM';
const FOLGA_NA_FICHA = 3;
const FOLGA_NO_MODELO = 10;

function campoId<T>(def: PlanilhaDeFichas<T>): Campo<T> {
  return {
    titulo: ROTULO_ID,
    tipo: 'texto',
    identificador: true,
    explicacao: 'Identificador do registro no sistema. Não altere; em branco (aba copiada do MODELO) cria um novo.',
    valor: def.id,
  };
}

function campoAtualizado<T>(def: PlanilhaDeFichas<T>): Campo<T> {
  return {
    titulo: ROTULO_ATUALIZADO,
    tipo: 'texto',
    identificador: true,
    explicacao: 'Quando o registro mudou pela última vez antes desta exportação. Não altere.',
    valor: (r) => def.atualizadoEm(r) ?? null,
  };
}

export async function exportarFichas<T>(def: PlanilhaDeFichas<T>, registros: T[]) {
  await baixar(await montarLivroDeFichas(def, registros), nomeDoArquivo(def.cadastro));
}

/** O livro pronto, sem baixar — a exportação e o teste de ida e volta usam. */
export async function montarLivroDeFichas<T>(def: PlanilhaDeFichas<T>, registros: T[]): Promise<Workbook> {
  const livro = await novoLivro();
  const cabecalhoDaFicha = [campoId(def), ...def.campos, campoAtualizado(def)];

  await abaComoPreencher(livro, {
    cadastro: def.cadastro,
    formato: 'fichas',
    tituloDaFicha: def.tituloDaFicha,
    comoTirarDeUso: def.comoTirarDeUso,
    temReferencias: !!def.referencias?.length,
    secoes: def.secoes.map((s) => ({ titulo: s.titulo, explicacao: s.explicacao })),
    tabelas: [
      { onde: 'Ficha — cabeçalho', campos: cabecalhoDaFicha as Campo<never>[] },
      ...def.secoes.map((s) => ({ onde: `Ficha — seção ${s.titulo}`, campos: s.colunas })),
    ],
    regrasDoCadastro: def.regrasDoCadastro,
    excecoes: def.excecoes,
  });

  await abaDoResumo(livro, def, registros);

  registros.forEach((registro, i) => {
    const ws = livro.addWorksheet(abaDoRegistro(i + 1, registros.length));
    escreverFicha(ws, def, cabecalhoDaFicha, registro, FOLGA_NA_FICHA);
  });

  escreverFicha(livro.addWorksheet(ABA_MODELO), def, cabecalhoDaFicha, null, FOLGA_NO_MODELO);

  if (def.referencias?.length) await abaDeReferencias(livro, def.referencias);

  return livro;
}

async function abaDoResumo<T>(livro: Workbook, def: PlanilhaDeFichas<T>, registros: T[]) {
  const ws = livro.addWorksheet(ABA_RESUMO);
  const colunas = def.resumo;
  ws.columns = [
    { header: 'ABA', width: 8 },
    ...colunas.map((c) => ({ header: c.titulo, width: c.largura ?? 18 })),
  ];
  cabecalho(ws.getRow(1));

  registros.forEach((registro, i) => {
    const aba = abaDoRegistro(i + 1, registros.length);
    const linha = ws.getRow(i + 2);
    linha.getCell(1).value = { text: aba, hyperlink: linkPara(aba) };
    linha.getCell(1).font = { color: { argb: AZUL }, underline: true };

    colunas.forEach((campo, c) => {
      const celula = linha.getCell(c + 2);
      escreverCelula(celula, { ...campo, caminho: undefined }, registro);
      celula.font = { color: { argb: 'FF000000' } };
      if (campo.caminho === 'nome') {
        celula.value = { text: def.nome(registro), hyperlink: linkPara(aba) };
        celula.font = { color: { argb: AZUL }, underline: true };
      }
    });
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length + 1 } };
  await somenteLeitura(ws);
}

function escreverFicha<T>(
  ws: Worksheet,
  def: PlanilhaDeFichas<T>,
  cabecalhoDaFicha: Campo<T>[],
  registro: T | null,
  folga: number,
) {
  ws.columns = def.larguras.map((width) => ({ width }));
  const ultimaColuna = Math.max(2, ...def.secoes.map((s) => s.colunas.length + 1));

  const titulo = ws.addRow([def.tituloDaFicha, { text: 'Voltar ao RESUMO', hyperlink: linkPara(ABA_RESUMO) }]);
  titulo.getCell(1).font = { bold: true, color: { argb: BRANCO } };
  preencher(titulo.getCell(1), AZUL);
  titulo.getCell(2).font = { color: { argb: AZUL }, underline: true };

  for (const campo of cabecalhoDaFicha) {
    const linha = ws.addRow([campo.titulo]);
    linha.getCell(1).font = { bold: true };
    preencher(linha.getCell(1), AZUL_CLARO);
    escreverCelula(linha.getCell(2), campo, registro);
    linha.getCell(2).alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
  }

  for (const secao of def.secoes) {
    ws.addRow([]);
    const topo = ws.addRow([secao.titulo, ...secao.colunas.map((c) => c.titulo)]);
    for (let c = 1; c <= secao.colunas.length + 1; c++) {
      preencher(topo.getCell(c), secao.somenteLeitura ? CINZA : secao.cor);
      topo.getCell(c).font = { bold: true };
      topo.getCell(c).alignment = { wrapText: true, vertical: 'middle' };
    }
    if (secao.somenteLeitura) topo.getCell(1).note = secao.notaDeLeitura ?? 'Só informação — a importação ignora esta seção.';

    const itens = registro === null ? [] : secao.itens(registro);
    for (const item of itens) {
      const linha = ws.addRow([]);
      secao.colunas.forEach((campo, c) => escreverCelula(linha.getCell(c + 2), campo, item));
    }

    if (secao.somenteLeitura) continue;
    for (let f = 0; f < folga; f++) {
      const linha = ws.addRow([]);
      secao.colunas.forEach((campo, c) => escreverCelula(linha.getCell(c + 2), campo, null));
    }
  }

  if (registro !== null && def.rodape) {
    ws.addRow([]);
    def.rodape(ws, registro);
  }

  bordaFina(ws, ultimaColuna);
}

// ---- Leitura ---------------------------------------------------------------

/**
 * `deOutroSistema`: a planilha do Smart Project (AupusProject), que não tem as
 * colunas que só este sistema tem (`soDesteSistema`) — faltar não é erro ali.
 */
export function lerFichas<T>(
  def: PlanilhaDeFichas<T>,
  livro: Workbook,
  { deOutroSistema = false }: { deOutroSistema?: boolean } = {},
): LeituraDaPlanilha {
  const erros: ProblemaDaPlanilha[] = [];
  const registros: RegistroDaPlanilha[] = [];

  const outroCadastro = conferirCadastro(livro, def.cadastro);
  if (outroCadastro) return { registros, erros: [outroCadastro] };

  const reservadas = new Set(ABAS_RESERVADAS.map(chave));

  for (const ws of livro.worksheets) {
    if (reservadas.has(chave(ws.name))) continue;

    const lida = lerFicha(def, ws, deOutroSistema);
    erros.push(...lida.erros);
    if (lida.registro) registros.push(lida.registro);
  }

  return { registros, erros };
}

type SecaoEmLeitura<T> = {
  secao: SecaoDaFicha<T, never>;
  colunas: Array<{ campo: Campo<never>; coluna: number }>;
};

function lerFicha<T>(
  def: PlanilhaDeFichas<T>,
  ws: Worksheet,
  deOutroSistema: boolean,
): { registro: RegistroDaPlanilha | null; erros: ProblemaDaPlanilha[] } {
  const aba = ws.name;
  const erros: ProblemaDaPlanilha[] = [];

  if (chave(texto(ws.getCell('A1')) ?? '') !== chave(def.tituloDaFicha)) {
    // Aba vazia (sobrou de uma cópia) não é erro; aba com conteúdo fora do
    // formato é — senão o que alguém escreveu ali sumiria sem aviso.
    if (ws.actualRowCount === 0) return { registro: null, erros };
    return {
      registro: null,
      erros: [
        {
          aba,
          linha: 1,
          mensagem: `A aba "${aba}" não está no formato da ficha: a célula A1 deve ser "${def.tituloDaFicha}". Para criar um registro, copie a aba MODELO.`,
        },
      ],
    };
  }

  const camposPorRotulo = new Map(def.campos.map((c) => [chave(c.titulo), c]));
  const secoesPorTitulo = new Map(def.secoes.map((s) => [chave(s.titulo), s]));

  let id: string | null = null;
  let atualizadoEm: string | null = null;
  const cabecalhoLido: Record<string, unknown> = {};
  const linhasDosCampos: Record<string, number> = {};
  const secoes: SecoesLidas = {};
  let secaoAtual: SecaoEmLeitura<T> | null = null;

  for (let r = 2; r <= ws.rowCount; r++) {
    const linha = ws.getRow(r);
    const rotulo = chave(texto(linha.getCell(1)) ?? '');

    const secao = secoesPorTitulo.get(rotulo);
    if (secao) {
      const porTitulo = new Map<string, number>();
      linha.eachCell((celula, coluna) => {
        const t = texto(celula);
        if (coluna > 1 && t) porTitulo.set(chave(t), coluna);
      });

      secaoAtual = {
        secao,
        colunas: secao.somenteLeitura
          ? []
          : secao.colunas
              .filter((c) => !ehCalculado(c) || c.identificador)
              .map((campo) => ({ campo, coluna: porTitulo.get(chave(campo.titulo)) ?? -1 }))
              .filter((x) => x.coluna > 0),
      };
      if (!secao.somenteLeitura) {
        secoes[secao.titulo] = [];
        // A lista da seção é trocada inteira: coluna que falta (arquivo de antes
        // da coluna existir, ou apagada) apagaria o dado dela calada. Antes era
        // descartada sem aviso — as leituras do SN-58 virariam verificação
        for (const campo of secao.colunas.filter((c) => !ehCalculado(c) && !c.identificador)) {
          if (deOutroSistema && campo.soDesteSistema) continue;
          if (!porTitulo.has(chave(campo.titulo))) {
            erros.push({
              aba,
              linha: r,
              mensagem: `A seção ${secao.titulo} está sem a coluna ${campo.titulo}. Sem ela, o que está gravado nessa coluna se perderia: exporte de novo ou copie o cabeçalho da seção da aba MODELO.`,
            });
          }
        }
      }
      continue;
    }

    if (!secaoAtual) {
      if (rotulo === chave(ROTULO_ID)) {
        id = texto(linha.getCell(2));
        continue;
      }

      if (rotulo === chave(ROTULO_ATUALIZADO)) {
        atualizadoEm = texto(linha.getCell(2));
        continue;
      }

      const campo = camposPorRotulo.get(rotulo);
      if (campo && !ehCalculado(campo)) {
        linhasDosCampos[campo.caminho!.split('.')[0]] = r;
        const lido = lerCampo(campo, linha.getCell(2));
        if (lido.erro) erros.push({ aba, linha: r, campo: campo.caminho, mensagem: lido.erro });
        else if (!(lido.valor === null && campo.vazioEhPadrao)) definir(cabecalhoLido, campo.caminho!, lido.valor);
      }
      continue;
    }

    // Dentro de uma seção: linha com rótulo na coluna A é rodapé; linha sem
    // nada nas colunas editáveis é folga.
    if (rotulo !== '') continue;
    const editaveis = secaoAtual.colunas.filter(({ campo }) => !campo.identificador);
    const preenchida = editaveis.some(({ coluna }) => texto(linha.getCell(coluna)) !== null);
    if (!preenchida) continue;

    const item: Record<string, unknown> = { _linha: r };
    for (const { campo, coluna } of secaoAtual.colunas) {
      const lido = lerCampo(campo, linha.getCell(coluna));
      if (lido.erro) {
        erros.push({ aba, linha: r, campo: campo.caminho, mensagem: lido.erro });
        continue;
      }
      if (lido.valor === null && campo.vazioEhPadrao) continue;
      definir(item, campo.caminho!, lido.valor);
    }
    secoes[secaoAtual.secao.titulo]!.push(item);
  }

  const vazia =
    id === null &&
    Object.values(cabecalhoLido).every((v) => v === null || v === undefined) &&
    Object.values(secoes).every((itens) => !itens?.length);
  if (vazia) return { registro: null, erros };

  if (erros.length) return { registro: null, erros };

  const problema = def.conferir?.(secoes);
  if (problema) return { registro: null, erros: [{ aba, linha: 1, mensagem: problema }] };

  return {
    registro: {
      id,
      aba,
      linha: 1,
      atualizado_em: atualizadoEm,
      dados: def.montar(cabecalhoLido, secoes),
      linhasDosCampos,
    },
    erros,
  };
}
