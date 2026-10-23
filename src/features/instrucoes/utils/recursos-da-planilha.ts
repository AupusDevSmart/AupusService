import type { Cell, Workbook, Worksheet } from 'exceljs';

import { chave, numero, texto } from '@/lib/planilha/leitura';
import { ABA_REFERENCIAS } from '@/lib/planilha/referencias';
import { ABAS_RESERVADAS, type ProblemaDaPlanilha, type RecursoDaPlanilha } from '@/lib/planilha/tipos';
import { CATEGORIAS_RECURSO, ROTULO_DA_BASE } from '@/services/recursos.services';

/**
 * Os recursos que a planilha de instruções cita, para o servidor criar o que
 * não existe e acertar o cadastro do que difere (SN-98, decisão do usuário de
 * 23/out/2026):
 *
 * - de cada linha de RECURSOS e MATERIAIS, o ITEM, a COBRANÇA e o VALOR DO
 *   CADASTRO (as colunas cinza: até o SN-98 a importação não as lia);
 * - da aba REFERÊNCIAS, a categoria (e a unidade do material) — só o recurso
 *   novo precisa dela —, e a cobrança e o custo quando a linha não os diz.
 *
 * O mesmo recurso com cobrança ou preço diferente em duas linhas é erro: a
 * planilha tem de dizer um valor só. O mesmo nome com IDs DO ITEM diferentes são
 * dois recursos (o cadastro repete nome entre categorias), e a linha sem ID fica
 * com o primeiro. Maquinário fica de fora (o cadastro dele é outro, e a decisão
 * foi só sobre recursos).
 */

const TITULO_DA_FICHA = 'INSTRUÇÃO';
const SECOES = new Map([
  [chave('RECURSOS'), 'recursos' as const],
  [chave('MATERIAIS'), 'materiais' as const],
]);
const OUTRAS_SECOES = new Set([chave('PASSOS'), chave('MAQUINÁRIO')]);

const BASE_DO_ROTULO = new Map(Object.entries(ROTULO_DA_BASE).map(([base, rotulo]) => [chave(rotulo), base]));
const CATEGORIA_DO_ROTULO = new Map(CATEGORIAS_RECURSO.flatMap((c) => [[chave(c.label), c.value], [chave(c.value), c.value]]));

type DaReferencia = {
  categoria: string | null;
  base_calculo: string | null;
  preco: number | null;
  unidade: string | null;
  /** O valor que estava lá e não é da lista (o servidor só cobra se for criar o recurso) */
  naoLido: { categoria?: string; cobranca?: string; custo?: string };
};
type Lido = RecursoDaPlanilha & { cobrancaLida: string | null; naoLido: DaReferencia['naoLido'] };

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' '); // o toLocaleString separa o R$ com espaço não separável
const descrever = (r: { base_calculo: string | null; preco: number | null }) =>
  [r.base_calculo && (ROTULO_DA_BASE[r.base_calculo as keyof typeof ROTULO_DA_BASE] ?? r.base_calculo).toLowerCase(), r.preco !== null && moeda(r.preco)]
    .filter(Boolean)
    .join(', ');

export function recursosDaPlanilha(livro: Workbook): { recursos: RecursoDaPlanilha[]; erros: ProblemaDaPlanilha[] } {
  const referencias = lerReferencias(livro);
  const erros: ProblemaDaPlanilha[] = [];
  const porChave = new Map<string, Lido>();
  const reservadas = new Set(ABAS_RESERVADAS.map(chave));

  for (const ws of livro.worksheets) {
    if (reservadas.has(chave(ws.name)) || chave(texto(ws.getCell('A1')) ?? '') !== chave(TITULO_DA_FICHA)) continue;

    for (const lido of linhasDeRecurso(ws, erros)) {
      const doNome = `${lido.grupo}|${chave(lido.nome)}`;
      const primeiro = porChave.get(doNome);
      const k = lido.id && primeiro?.id && primeiro.id !== lido.id ? `${doNome}|${lido.id}` : doNome;
      const ref = (lido.id && referencias.get(chaveDoId(lido.grupo, lido.id))) || referencias.get(doNome);
      const completo: Lido = {
        ...lido,
        categoria: lido.grupo === 'materiais' ? 'MATERIAL' : (ref?.categoria ?? null),
        base_calculo: lido.base_calculo ?? ref?.base_calculo ?? null,
        preco: lido.preco ?? ref?.preco ?? null,
        unidade: lido.grupo === 'materiais' ? (ref?.unidade ?? null) : null,
        naoLido: ref?.naoLido ?? {},
      };

      const antes = porChave.get(k);
      if (!antes) {
        porChave.set(k, completo);
        continue;
      }
      const outraBase = antes.base_calculo && completo.base_calculo && antes.base_calculo !== completo.base_calculo;
      const outroPreco = antes.preco !== null && completo.preco !== null && Math.abs(antes.preco - completo.preco) >= 0.005;
      if (outraBase || outroPreco) {
        erros.push({
          aba: lido.aba,
          linha: lido.linha,
          campo: 'recursos',
          mensagem: `"${lido.nome}" aparece aqui ${descrever(completo)} e na aba ${antes.aba}, linha ${antes.linha}, ${descrever(antes)}. A importação acerta o cadastro do recurso pela planilha: deixe a COBRANÇA e o VALOR DO CADASTRO iguais em todas as linhas dele.`,
        });
        continue;
      }
      // A primeira linha que diz o valor (e o ID) vale para as que não dizem
      porChave.set(k, {
        ...antes,
        id: antes.id ?? completo.id,
        base_calculo: antes.base_calculo ?? completo.base_calculo,
        preco: antes.preco ?? completo.preco,
      });
    }
  }

  return {
    recursos: [...porChave.values()].map(({ cobrancaLida: _c, naoLido, ...r }) => ({
      ...r,
      // O valor ilegível da REFERÊNCIAS só falta se nenhuma linha disse o valor
      problemas: [r.categoria === null && naoLido.categoria, r.base_calculo === null && naoLido.cobranca, r.preco === null && naoLido.custo].filter(
        (p): p is string => !!p,
      ),
    })),
    erros,
  };
}

/** As linhas de RECURSOS e MATERIAIS de uma ficha, pelas colunas do cabeçalho de cada seção */
function linhasDeRecurso(ws: Worksheet, erros: ProblemaDaPlanilha[]): Lido[] {
  const lidas: Lido[] = [];
  let grupo: 'recursos' | 'materiais' | null = null;
  let colunas = new Map<string, number>();

  for (let r = 2; r <= ws.rowCount; r++) {
    const linha = ws.getRow(r);
    const rotulo = chave(texto(linha.getCell(1)) ?? '');

    if (SECOES.has(rotulo) || OUTRAS_SECOES.has(rotulo)) {
      grupo = SECOES.get(rotulo) ?? null;
      colunas = new Map();
      linha.eachCell((celula, coluna) => {
        const t = texto(celula);
        if (coluna > 1 && t) colunas.set(chave(t), coluna);
      });
      continue;
    }
    // Rótulo na coluna A dentro da seção é rodapé ("Subtotal recursos"); fora de seção, cabeçalho da ficha
    if (!grupo || rotulo !== '') continue;

    const celula = (titulo: string): Cell | null => {
      const coluna = colunas.get(chave(titulo));
      return coluna ? linha.getCell(coluna) : null;
    };
    const nome = celula('ITEM') && texto(celula('ITEM')!);
    if (!nome) continue;

    const cobrancaLida = grupo === 'recursos' && celula('COBRANÇA') ? texto(celula('COBRANÇA')!) : null;
    const base = cobrancaLida ? (BASE_DO_ROTULO.get(chave(cobrancaLida)) ?? null) : null;
    if (cobrancaLida && !base) {
      erros.push({
        aba: ws.name,
        linha: r,
        campo: 'recursos',
        mensagem: `COBRANÇA "${cobrancaLida}" não é uma das cobranças (${Object.values(ROTULO_DA_BASE).join(', ')}).`,
      });
      continue;
    }

    const preco = celula('VALOR DO CADASTRO') ? numero(celula('VALOR DO CADASTRO')!) : null;
    if (preco === undefined || (typeof preco === 'number' && preco < 0)) {
      erros.push({ aba: ws.name, linha: r, campo: 'recursos', mensagem: `VALOR DO CADASTRO de "${nome}" não é um preço: escreva só o número.` });
      continue;
    }

    const id = (celula('ID DO ITEM') && texto(celula('ID DO ITEM')!)) || null;
    lidas.push({ nome, id, grupo, categoria: null, base_calculo: base, preco, unidade: null, aba: ws.name, linha: r, cobrancaLida, naoLido: {}, problemas: [] });
  }
  return lidas;
}

/**
 * A aba REFERÊNCIAS: um bloco por cadastro, com o título na linha 1, o
 * cabeçalho na 2 e os itens dali para baixo (`referencias.ts`). A planilha
 * montada fora daqui pode trazer só alguns blocos, ou as colunas em outra ordem:
 * cada coluna é achada pelo título.
 */
function lerReferencias(livro: Workbook): Map<string, DaReferencia> {
  const ws = livro.worksheets.find((w) => chave(w.name) === chave(ABA_REFERENCIAS));
  const porChave = new Map<string, DaReferencia>();
  if (!ws) return porChave;

  const titulos = ws.getRow(1);
  for (let c = 1; c <= ws.columnCount; c++) {
    const bloco = SECOES.get(chave(texto(titulos.getCell(c)) ?? ''));
    if (!bloco) continue;

    // As colunas do bloco: da primeira até a coluna vazia que separa o próximo
    const colunas = new Map<string, number>();
    for (let k = c; k <= ws.columnCount; k++) {
      const t = texto(ws.getRow(2).getCell(k));
      if (!t) break;
      colunas.set(chave(t), k);
    }
    const coluna = (titulo: string) => colunas.get(chave(titulo));
    const [cNome, cCategoria, cCobranca, cCusto, cUnidade, cId] = ['NOME', 'CATEGORIA', 'COBRANÇA', 'CUSTO', 'UNIDADE', 'ID'].map(coluna);
    if (!cNome) continue;

    for (let r = 3; r <= ws.rowCount; r++) {
      const linha = ws.getRow(r);
      const nome = texto(linha.getCell(cNome));
      if (!nome) continue;
      const rotuloCategoria = cCategoria ? texto(linha.getCell(cCategoria)) : null;
      const rotuloCobranca = cCobranca ? texto(linha.getCell(cCobranca)) : null;
      const custo = cCusto ? numero(linha.getCell(cCusto)) : null;
      const categoria = rotuloCategoria ? (CATEGORIA_DO_ROTULO.get(chave(rotuloCategoria)) ?? null) : null;
      const base = rotuloCobranca ? (BASE_DO_ROTULO.get(chave(rotuloCobranca)) ?? null) : null;
      const onde = `na aba ${ABA_REFERENCIAS}, linha ${r}`;
      const id = cId ? texto(linha.getCell(cId)) : null;
      const daLinha: DaReferencia = {
        categoria,
        base_calculo: base,
        preco: typeof custo === 'number' ? custo : null,
        unidade: cUnidade ? texto(linha.getCell(cUnidade)) : null,
        naoLido: {
          ...(rotuloCategoria && !categoria && {
            categoria: `CATEGORIA "${rotuloCategoria}" ${onde} não é uma das categorias (${CATEGORIAS_RECURSO.filter((c) => c.value !== 'MATERIAL').map((c) => c.label).join(', ')}).`,
          }),
          ...(rotuloCobranca && !base && { cobranca: `COBRANÇA "${rotuloCobranca}" ${onde} não é uma das cobranças (${Object.values(ROTULO_DA_BASE).join(', ')}).` }),
          ...(custo === undefined && { custo: `CUSTO ${onde} não é um número.` }),
        },
      };
      // Pelo ID quando a REFERÊNCIAS o tem (o mesmo nome pode estar em duas categorias); pelo nome, a primeira
      if (id) porChave.set(chaveDoId(bloco, id), daLinha);
      if (!porChave.has(`${bloco}|${chave(nome)}`)) porChave.set(`${bloco}|${chave(nome)}`, daLinha);
    }
  }
  return porChave;
}

const chaveDoId = (grupo: string, id: string) => `${grupo}|id|${id.trim()}`;
