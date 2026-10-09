import type { Workbook } from 'exceljs';

import { daPlanilha, definir, ehCalculado, escreverCelula, type Campo } from '@/lib/planilha/campos';
import { abaComoPreencher, conferirCadastro } from '@/lib/planilha/como-preencher';
import {
  AZUL,
  AZUL_CLARO,
  BRANCO,
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
import type { LeituraDaPlanilha, ProblemaDaPlanilha, RegistroDaPlanilha } from '@/lib/planilha/tipos';

/**
 * Cadastro plano (Usuários, Recursos, Veículos, Feriados, Concessionárias):
 * tudo o que se edita cabe numa linha, então **a aba RESUMO é a que se edita
 * e a que se importa** — uma linha por registro, com todos os campos. As abas
 * numeradas são a ficha de cada registro só para leitura, com link de ida e
 * volta.
 */

export type PlanilhaPlana<T> = {
  /** "Recursos", como no menu e no nome do arquivo. */
  cadastro: string;
  /** "recurso" — título da ficha. */
  singular: string;
  /**
   * As colunas depois do ID, na ordem: primeiro as que a tabela da tela mostra,
   * depois o resto. A de caminho `nome` (ou `colunaDoLink`) ganha o link para a ficha.
   */
  campos: Campo<T>[];
  /** O caminho da coluna que leva o link para a ficha, quando não é `nome`. */
  colunaDoLink?: string;
  id: (registro: T) => string;
  nome: (registro: T) => string;
  atualizadoEm: (registro: T) => string | null | undefined;
  /** Como tirar um registro de uso sem apagá-lo, para a COMO PREENCHER. */
  comoTirarDeUso: string;
  /** Acerto do payload lido (ex.: agrupar as tarifas). */
  montar?: (dados: Record<string, unknown>) => Record<string, unknown>;
  regrasDoCadastro?: string[];
};

const ABA = 'RESUMO';
const COLUNA_ID = 'ID';
const COLUNA_ATUALIZADO = 'ATUALIZADO EM';

/** Linhas a mais com a lista suspensa, para quem acrescenta registro no fim. */
const LINHAS_DE_FOLGA = 200;

const campoId = <T>(def: PlanilhaPlana<T>): Campo<T> => ({
  titulo: COLUNA_ID,
  tipo: 'texto',
  identificador: true,
  largura: 28,
  explicacao: 'Identificador do registro no sistema. Não altere; em branco cria um novo.',
  valor: def.id,
});

const campoAtualizado = <T>(def: PlanilhaPlana<T>): Campo<T> => ({
  titulo: COLUNA_ATUALIZADO,
  tipo: 'texto',
  identificador: true,
  largura: 26,
  explicacao: 'Quando o registro mudou pela última vez antes desta exportação. Não altere.',
  valor: (r) => def.atualizadoEm(r) ?? null,
});

export async function exportarPlana<T>(def: PlanilhaPlana<T>, registros: T[]) {
  await baixar(await montarLivroPlano(def, registros), nomeDoArquivo(def.cadastro));
}

/** O livro pronto, sem baixar — a exportação e o teste de ida e volta usam. */
export async function montarLivroPlano<T>(def: PlanilhaPlana<T>, registros: T[]): Promise<Workbook> {
  const livro = await novoLivro();
  const colunas = [campoId(def), ...def.campos, campoAtualizado(def)];
  const colunaDoLink = colunas.findIndex((c) => c.caminho === (def.colunaDoLink ?? 'nome'));

  await abaComoPreencher(livro, {
    cadastro: def.cadastro,
    formato: 'plana',
    comoTirarDeUso: def.comoTirarDeUso,
    tabelas: [{ onde: ABA, campos: colunas as Campo<never>[] }],
    regrasDoCadastro: def.regrasDoCadastro,
  });

  const ws = livro.addWorksheet(ABA);
  ws.columns = colunas.map((c) => ({ header: c.titulo, width: c.largura ?? 18 }));
  cabecalho(ws.getRow(1));
  colunas.forEach((c, i) => {
    if (ehCalculado(c) && !c.identificador) {
      ws.getRow(1).getCell(i + 1).note = 'Informação do sistema — a importação ignora esta coluna.';
    }
  });

  registros.forEach((registro, i) => {
    const linha = ws.getRow(i + 2);
    colunas.forEach((campo, c) => escreverCelula(linha.getCell(c + 1), campo, registro));

    if (colunaDoLink >= 0) {
      const celula = linha.getCell(colunaDoLink + 1);
      celula.value = { text: def.nome(registro), hyperlink: linkPara(abaDoRegistro(i + 1, registros.length)) };
      celula.font = { color: { argb: AZUL }, underline: true };
    }
  });

  // A lista suspensa e o cinza também nas linhas vazias de baixo — é ali que
  // quem cria um registro novo vai escrever.
  for (let r = registros.length + 2; r < registros.length + 2 + LINHAS_DE_FOLGA; r++) {
    colunas.forEach((campo, c) => escreverCelula(ws.getRow(r).getCell(c + 1), campo, null));
  }

  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: Math.max(colunaDoLink + 1, 1) }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } };

  registros.forEach((registro, i) => fichaSomenteLeitura(livro, def, colunas, registro, i, registros.length));
  for (const ficha of livro.worksheets.slice(2)) await somenteLeitura(ficha);

  return livro;
}

function fichaSomenteLeitura<T>(
  livro: Workbook,
  def: PlanilhaPlana<T>,
  colunas: Campo<T>[],
  registro: T,
  i: number,
  total: number,
) {
  const ws = livro.addWorksheet(abaDoRegistro(i + 1, total));
  ws.columns = [{ width: 30 }, { width: 50 }];

  const titulo = ws.addRow([def.singular.toUpperCase(), def.nome(registro)]);
  titulo.font = { bold: true, color: { argb: BRANCO } };
  preencher(titulo.getCell(1), AZUL);
  preencher(titulo.getCell(2), AZUL);

  const linhaNoResumo = i + 2;
  const aviso = ws.addRow([
    {
      text: `Só leitura. Para alterar, edite a linha ${linhaNoResumo} da aba RESUMO (clique aqui).`,
      hyperlink: `#'${ABA}'!A${linhaNoResumo}`,
    },
  ]);
  ws.mergeCells(aviso.number, 1, aviso.number, 2);
  aviso.getCell(1).font = { italic: true, color: { argb: AZUL }, underline: true };
  ws.addRow([]);

  for (const campo of colunas) {
    const linha = ws.addRow([campo.titulo]);
    linha.getCell(1).font = { bold: true };
    preencher(linha.getCell(1), AZUL_CLARO);
    escreverCelula(linha.getCell(2), campo, registro, { semLista: true });
    linha.getCell(2).alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
  }

  bordaFina(ws, 2);
}

/**
 * Lê a aba RESUMO. Coluna que não está na planilha não vai no payload — e o
 * sistema mantém o valor que já tinha; coluna presente e vazia limpa o campo
 * (ou mantém, onde o campo diz).
 */
export function lerPlana<T>(def: PlanilhaPlana<T>, livro: Workbook): LeituraDaPlanilha {
  const erros: ProblemaDaPlanilha[] = [];
  const registros: RegistroDaPlanilha[] = [];

  const outroCadastro = conferirCadastro(livro, def.cadastro);
  if (outroCadastro) return { registros, erros: [outroCadastro] };

  const ws = livro.worksheets.find((w) => chave(w.name) === chave(ABA));
  if (!ws) {
    return {
      registros,
      erros: [{ aba: ABA, linha: 1, mensagem: 'A planilha não tem a aba RESUMO, que é a que se importa.' }],
    };
  }

  const porTitulo = new Map<string, number>();
  ws.getRow(1).eachCell((celula, coluna) => {
    const titulo = texto(celula);
    if (titulo) porTitulo.set(chave(titulo), coluna);
  });

  const colunaId = porTitulo.get(chave(COLUNA_ID));
  const colunaAtualizado = porTitulo.get(chave(COLUNA_ATUALIZADO));
  const editaveis = def.campos
    .filter((c) => !ehCalculado(c))
    .map((campo) => ({ campo, coluna: porTitulo.get(chave(campo.titulo)) }))
    .filter((x): x is { campo: Campo<T>; coluna: number } => x.coluna !== undefined);

  if (colunaId === undefined) {
    erros.push({ aba: ABA, linha: 1, mensagem: 'Falta a coluna ID na aba RESUMO. Não apague nem renomeie a coluna.' });
    return { registros, erros };
  }

  for (let r = 2; r <= ws.rowCount; r++) {
    const linha = ws.getRow(r);
    const id = texto(linha.getCell(colunaId));
    const vazia = editaveis.every(({ coluna }) => texto(linha.getCell(coluna)) === null);
    if (vazia && id === null) continue;

    const dados: Record<string, unknown> = {};
    let comErro = false;

    for (const { campo, coluna } of editaveis) {
      const lido = daPlanilha(campo, linha.getCell(coluna));
      if (lido.erro) {
        erros.push({ aba: ABA, linha: r, campo: campo.caminho, mensagem: lido.erro });
        comErro = true;
        continue;
      }
      if (lido.valor === null && campo.vazioEhPadrao) continue;
      definir(dados, campo.caminho!, lido.valor);
    }

    if (comErro) continue;

    registros.push({
      id,
      aba: ABA,
      linha: r,
      atualizado_em: colunaAtualizado ? texto(linha.getCell(colunaAtualizado)) : null,
      dados: def.montar ? def.montar(dados) : dados,
    });
  }

  return { registros, erros };
}
