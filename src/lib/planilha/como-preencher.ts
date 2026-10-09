import type { Workbook, Worksheet } from 'exceljs';

import { ehCalculado, valoresAceitos, type Campo } from '@/lib/planilha/campos';
import { AZUL, AZUL_CLARO, BRANCO, cabecalho, preencher, somenteLeitura } from '@/lib/planilha/estilo';
import { chave, texto } from '@/lib/planilha/leitura';
import type { ProblemaDaPlanilha } from '@/lib/planilha/tipos';

/**
 * A primeira aba de toda planilha de cadastro: como preencher, escrito para ser
 * seguido ao pé da letra por uma pessoa ou por uma IA. Regra que não está aqui
 * a importação não pode cobrar.
 */

export const ABA_COMO_PREENCHER = 'COMO PREENCHER';

export type TabelaDeCampos = {
  /** Onde o campo fica: "RESUMO", "Ficha — cabeçalho", "Ficha — seção UNIDADES". */
  onde: string;
  // Os campos de cada tabela têm registros de tipos diferentes; aqui só se lê
  // a parte descritiva, que não depende dele.
  campos: Campo<never>[];
};

export type ComoPreencher = {
  /** "Recursos", como no menu. */
  cadastro: string;
  formato: 'plana' | 'fichas';
  /** O que vai na célula A1 da ficha ("INSTRUÇÃO"). Só no formato de fichas. */
  tituloDaFicha?: string;
  /** Como tirar um registro de uso sem apagá-lo: 'escreva NÃO em ATIVO'. */
  comoTirarDeUso: string;
  tabelas: TabelaDeCampos[];
  /** Só no formato de fichas: o que cada seção guarda. */
  secoes?: Array<{ titulo: string; explicacao: string }>;
  /** Regras do cadastro, depois das gerais. */
  regrasDoCadastro?: string[];
  /** Há aba REFERÊNCIAS com os nomes válidos de outros cadastros. */
  temReferencias?: boolean;
};

const marcador = (cadastro: string) => `PLANILHA DE ${cadastro.toUpperCase()}`;

function regrasGerais(c: ComoPreencher): string[] {
  const comum = [
    `Esta planilha serve para conferir e para importar. Para importar, use o botão "Importar" da tela ${c.cadastro} do Aupus Service. Antes de gravar, o sistema mostra uma prévia com o que vai ser criado e alterado; nada é gravado sem confirmação, e se houver qualquer erro nada é gravado.`,
  ];

  const onde =
    c.formato === 'plana'
      ? [
          `Edite na aba RESUMO: cada linha é um registro. As abas numeradas (01, 02…) mostram a ficha de cada registro só para leitura e são ignoradas na importação.`,
          `Para criar um registro novo, acrescente uma linha no fim da aba RESUMO com o ID em branco.`,
        ]
      : [
          `Cada aba numerada (01, 02…) é um registro: edite na própria aba. A aba RESUMO é só um índice (com link para cada aba) e é ignorada na importação.`,
          `Para criar um registro novo, copie a aba MODELO, dê a ela qualquer nome que ainda não exista (ex.: NOVO 1) e preencha. O ID fica em branco. A célula A1 tem de continuar "${c.tituloDaFicha}".`,
          'Em cada seção, cada linha abaixo do cabeçalho é um item. Para acrescentar, insira linhas logo abaixo do cabeçalho da seção. Não apague o cabeçalho da seção: sem ele a importação não mexe naquela lista. O que cada seção faz com o item que sumiu está na lista de seções abaixo.',
          'Seções em cinza são só informação: a importação as ignora.',
        ];

  return [
    ...comum,
    ...onde,
    'ID: não altere. ID preenchido edita o registro que já existe; ID em branco cria um novo.',
    `Apagar uma linha ou uma aba NÃO apaga o registro no sistema. Para tirar de uso, ${c.comoTirarDeUso}.`,
    'Células em cinza são preenchidas pelo sistema e a importação ignora as de informação. As de ID e ATUALIZADO EM identificam o registro: não altere, e em linha nova deixe vazias.',
    'Célula vazia limpa o campo — exceto onde a tabela abaixo diz "vazio = mantém".',
    'Números: só o número, sem "R$" e sem unidade. Vírgula ou ponto decimal (12,5 ou 12.5).',
    'Datas: DD/MM/AAAA (ex.: 25/12/2026), ou uma célula de data do Excel.',
    'SIM/NÃO: escreva SIM ou NÃO. Listas (categoria, status, tipo…): use exatamente um dos valores aceitos da tabela abaixo.',
    ...(c.temReferencias
      ? [
          'Itens de outros cadastros entram pelo NOME, exatamente como na aba REFERÊNCIAS — maiúsculas e acentos não importam. Nome que não existir é erro: a importação não cria o item referenciado; cadastre-o antes. A linha exportada leva também o ID do item (cinza): mantenha-o; ele resolve nomes repetidos no cadastro. Para trocar o item, troque o nome — com o nome trocado, vale o nome. Em linha nova, deixe o ID vazio.',
        ]
      : []),
    'A importação respeita as permissões e as plantas de quem importa, como a tela: o que você não pode criar ou editar na tela é erro aqui.',
    'Não renomeie as abas COMO PREENCHER, RESUMO, MODELO e REFERÊNCIAS, nem os títulos das colunas e das seções.',
    `Se alguém alterou um registro no sistema depois desta exportação, a prévia avisa; confirmar sobrescreve a alteração.`,
  ];
}

function escreverTitulo(ws: Worksheet, textoDoTitulo: string, colunas: number) {
  const linha = ws.addRow([textoDoTitulo]);
  ws.mergeCells(linha.number, 1, linha.number, colunas);
  linha.font = { bold: true, size: 13, color: { argb: BRANCO } };
  preencher(linha.getCell(1), AZUL);
  linha.height = 22;
}

function escreverSubtitulo(ws: Worksheet, textoDoSubtitulo: string, colunas: number) {
  ws.addRow([]);
  const linha = ws.addRow([textoDoSubtitulo]);
  ws.mergeCells(linha.number, 1, linha.number, colunas);
  linha.font = { bold: true };
  preencher(linha.getCell(1), AZUL_CLARO);
}

export async function abaComoPreencher(livro: Workbook, c: ComoPreencher) {
  const ws = livro.addWorksheet(ABA_COMO_PREENCHER);
  const colunas = 6;
  ws.columns = [26, 34, 16, 40, 22, 60].map((width) => ({ width }));

  escreverTitulo(ws, `${marcador(c.cadastro)} — COMO PREENCHER`, colunas);

  escreverSubtitulo(ws, 'REGRAS', colunas);
  regrasGerais(c)
    .concat(c.regrasDoCadastro ?? [])
    .forEach((regra, i) => {
      const linha = ws.addRow([`${i + 1}.`, regra]);
      ws.mergeCells(linha.number, 2, linha.number, colunas);
      linha.alignment = { vertical: 'top', wrapText: true };
      linha.getCell(1).alignment = { vertical: 'top', horizontal: 'right' };
      // Mesclada, a célula não cresce sozinha: estima a altura pelo tamanho.
      linha.height = Math.max(15, Math.ceil(regra.length / 150) * 15);
    });

  if (c.secoes?.length) {
    escreverSubtitulo(ws, 'SEÇÕES DA FICHA', colunas);
    for (const secao of c.secoes) {
      const linha = ws.addRow([secao.titulo, secao.explicacao]);
      ws.mergeCells(linha.number, 2, linha.number, colunas);
      linha.getCell(1).font = { bold: true };
      linha.alignment = { vertical: 'top', wrapText: true };
      linha.height = Math.max(15, Math.ceil(secao.explicacao.length / 150) * 15);
    }
  }

  escreverSubtitulo(ws, 'CAMPOS', colunas);
  cabecalho(ws.addRow(['ONDE', 'CAMPO', 'OBRIGATÓRIO', 'VALORES ACEITOS', 'EXEMPLO', 'O QUE É']));

  for (const tabela of c.tabelas) {
    for (const campo of tabela.campos) {
      const calculado = ehCalculado(campo) && !campo.identificador;
      const linha = ws.addRow([
        tabela.onde,
        campo.titulo,
        campo.identificador ? 'Não altere' : calculado ? 'Informação' : (campo.obrigatorio ?? 'Não'),
        campo.identificador
          ? 'Preenchido pelo sistema; em linha nova, deixe vazio'
          : calculado
            ? 'Não preencher — a importação ignora'
            : valoresAceitos(campo) + (campo.vazioEhPadrao ? ' (vazio = mantém)' : ''),
        campo.exemplo ?? '',
        campo.explicacao,
      ]);
      linha.alignment = { vertical: 'top', wrapText: true };
      if (calculado) linha.font = { color: { argb: 'FF595959' } };
    }
  }

  await somenteLeitura(ws);
  return ws;
}

/**
 * A planilha é deste cadastro? Sem a aba COMO PREENCHER não dá para saber, e
 * deixa passar — quem recusa campo errado é a validação.
 */
export function conferirCadastro(livro: Workbook, cadastro: string): ProblemaDaPlanilha | null {
  const ws = livro.worksheets.find((w) => chave(w.name) === chave(ABA_COMO_PREENCHER));
  if (!ws) return null;

  const titulo = texto(ws.getCell('A1')) ?? '';
  if (chave(titulo).startsWith(chave(marcador(cadastro)))) return null;

  const deQual = /PLANILHA DE (.+?) —/.exec(titulo)?.[1];
  return {
    aba: ABA_COMO_PREENCHER,
    linha: 1,
    mensagem: deQual
      ? `Esta planilha é de ${deQual.toLowerCase()}, não de ${cadastro.toLowerCase()}. Importe-a na tela certa.`
      : `Esta planilha não parece ser de ${cadastro.toLowerCase()}.`,
  };
}
