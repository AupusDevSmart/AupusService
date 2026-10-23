import type { Cell, Workbook, Worksheet } from 'exceljs';

import { chave, texto } from '@/lib/planilha/leitura';
import { ABAS_RESERVADAS, type PlanoDaPlanilha, type TarefaDoPlanoDaPlanilha } from '@/lib/planilha/tipos';
import { CRITICIDADES, PERIODICIDADES } from '@/core/features/equipamentos/utils/rotulos-da-planilha';

/**
 * Os planos que a planilha de equipamentos cita na coluna PLANO, para o servidor
 * criar o que não existe antes dos equipamentos (SN-98, decisão do usuário de
 * 23/out/2026): o template da CATEGORIA da aba, com as TAREFAS DO PLANO dela.
 *
 * Uma entrada por aba, sem juntar nem julgar: é o servidor que sabe se o plano
 * existe. No que existe as tarefas da planilha não contam (são as da cópia de
 * cada equipamento, que pode ser customizada), e duas abas com tarefas
 * diferentes, ou uma linha de tarefa que não deu para ler, não podem travar a
 * importação. A linha ilegível vai em `problemas`, para o servidor cobrar só se
 * for criar o plano. Vão junto o ID da ficha e o ID DO PLANO: é por eles que o
 * servidor reconhece o plano de hoje do equipamento e o plano renomeado depois
 * da exportação (sem eles, o nome antigo criaria um plano duplicado calado).
 */

const TITULO_DA_FICHA = 'EQUIPAMENTO (UC)';
const TAREFAS = chave('TAREFAS DO PLANO');
const SECOES = new Set([chave('DADOS TÉCNICOS'), chave('COMPONENTES UAR'), TAREFAS]);

const FREQUENCIA_DO_ROTULO = new Map(Object.entries(PERIODICIDADES).flatMap(([codigo, rotulo]) => [[chave(rotulo), codigo], [chave(codigo), codigo]]));
const CRITICIDADE_DO_ROTULO = new Map(Object.entries(CRITICIDADES).flatMap(([nota, rotulo]) => [[chave(rotulo), Number(nota)], [nota, Number(nota)]]));

export function planosDaPlanilha(livro: Workbook): PlanoDaPlanilha[] {
  const reservadas = new Set(ABAS_RESERVADAS.map(chave));
  return livro.worksheets
    .filter((ws) => !reservadas.has(chave(ws.name)) && chave(texto(ws.getCell('A1')) ?? '') === chave(TITULO_DA_FICHA))
    .map(lerFicha)
    .filter((p): p is PlanoDaPlanilha => p !== null);
}

/** PLANO e CATEGORIA do cabeçalho da ficha, e as linhas da seção TAREFAS DO PLANO */
function lerFicha(ws: Worksheet): PlanoDaPlanilha | null {
  let nome: string | null = null;
  let linhaDoPlano = 1;
  let categoria: string | null = null;
  let equipamentoId: string | null = null;
  let planoRef: string | null = null;
  let secao: string | null = null;
  let linhaDasTarefas = 1;
  let colunas = new Map<string, number>();
  const tarefas: TarefaDoPlanoDaPlanilha[] = [];
  const problemas: PlanoDaPlanilha['problemas'] = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const linha = ws.getRow(r);
    const rotulo = chave(texto(linha.getCell(1)) ?? '');

    if (SECOES.has(rotulo)) {
      secao = rotulo;
      if (rotulo === TAREFAS) linhaDasTarefas = r;
      colunas = new Map();
      linha.eachCell((celula, coluna) => {
        const t = texto(celula);
        if (coluna > 1 && t) colunas.set(chave(t), coluna);
      });
      continue;
    }

    if (!secao) {
      if (rotulo === chave('PLANO')) {
        nome = texto(linha.getCell(2));
        linhaDoPlano = r;
      } else if (rotulo === chave('CATEGORIA')) {
        categoria = texto(linha.getCell(2));
      } else if (rotulo === chave('ID')) {
        equipamentoId = texto(linha.getCell(2));
      } else if (rotulo === chave('ID DO PLANO')) {
        planoRef = texto(linha.getCell(2));
      }
      continue;
    }
    if (secao !== TAREFAS || rotulo !== '') continue;

    const celula = (titulo: string): Cell | null => {
      const coluna = colunas.get(chave(titulo));
      return coluna ? linha.getCell(coluna) : null;
    };
    const valor = (titulo: string) => {
      const c = celula(titulo);
      return c ? texto(c) : null;
    };
    const instrucao = valor('INSTRUÇÃO');
    const nomeDaTarefa = valor('NOME');
    if (!instrucao && !nomeDaTarefa) continue;
    if (!instrucao) {
      problemas.push({ linha: r, mensagem: `a tarefa "${nomeDaTarefa}" está sem a INSTRUÇÃO (o código ou o nome).` });
      continue;
    }

    const periodicidade = lerPeriodicidade(valor('PERIODICIDADE'));
    if (periodicidade === undefined) {
      problemas.push({
        linha: r,
        mensagem: `PERIODICIDADE "${valor('PERIODICIDADE')}" não é uma das periodicidades (${Object.values(PERIODICIDADES).filter((p) => p !== 'Personalizada').join(', ')} ou "A cada N dias").`,
      });
      continue;
    }
    const rotuloDaCriticidade = valor('CRITICIDADE');
    const criticidade = rotuloDaCriticidade ? CRITICIDADE_DO_ROTULO.get(chave(rotuloDaCriticidade)) : null;
    if (criticidade === undefined) {
      problemas.push({ linha: r, mensagem: `CRITICIDADE "${rotuloDaCriticidade}" não é uma das criticidades (${Object.values(CRITICIDADES).join(', ')}).` });
      continue;
    }

    tarefas.push({ nome: nomeDaTarefa, instrucao, ...periodicidade, criticidade });
  }

  if (!nome) return null;
  return {
    nome,
    categoria,
    tarefas,
    aba: ws.name,
    linha: linhaDoPlano,
    linha_das_tarefas: linhaDasTarefas,
    plano_ref: planoRef,
    equipamento_id: equipamentoId,
    problemas,
  };
}

/** "Mensal" → MENSAL; "A cada 45 dias" → PERSONALIZADA de 45; vazio fica vazio (o servidor diz que falta) */
function lerPeriodicidade(rotulo: string | null): Pick<TarefaDoPlanoDaPlanilha, 'frequencia' | 'frequencia_personalizada'> | undefined {
  if (!rotulo) return { frequencia: null, frequencia_personalizada: null };
  const dias = /^a cada (\d+) dias?$/.exec(chave(rotulo));
  // "A cada 0 dias" não é periodicidade: vai em problemas como o texto fora da lista
  if (dias) return Number(dias[1]) >= 1 ? { frequencia: 'PERSONALIZADA', frequencia_personalizada: Number(dias[1]) } : undefined;
  const codigo = FREQUENCIA_DO_ROTULO.get(chave(rotulo));
  return codigo ? { frequencia: codigo, frequencia_personalizada: null } : undefined;
}
