import type { Workbook } from 'exceljs';

import { referenciaDeCategorias, referenciaDeInstrucoes } from '@/lib/planilha/catalogos';
import type { Campo } from '@/lib/planilha/campos';
import { AZUL_CLARO } from '@/lib/planilha/estilo';
import { exportarFichas, lerFichas, secao, type PlanilhaDeFichas, type SecoesLidas } from '@/lib/planilha/fichas';
import { referencia, type Referencia } from '@/lib/planilha/referencias';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import {
  planosManutencaoApi,
  type PlanoManutencaoApiResponse,
  type QueryPlanosApiParams,
} from '@/services/planos-manutencao.services';
import { tarefasApi, type TarefaApiResponse } from '@/services/tarefas.services';

/**
 * Planos de manutenção na planilha: uma aba por TEMPLATE (o plano da
 * categoria), com a seção TAREFAS. A cópia de cada equipamento não entra —
 * ela recebe o template pela propagação e se edita na ficha do equipamento.
 */

/** A tarefa com o nome da instrução já resolvido, para a coluna INSTRUÇÃO. */
type TarefaComInstrucao = TarefaApiResponse & { nomeDaInstrucao: string | null };
type Plano = PlanoManutencaoApiResponse & { tarefasDoPlano: TarefaComInstrucao[] };

const PERIODICIDADES: Record<string, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  PERSONALIZADA: 'Personalizada',
};

const CRITICIDADES: Record<string, string> = {
  '1': 'Muito Baixa',
  '2': 'Baixa',
  '3': 'Média',
  '4': 'Alta',
  '5': 'Muito Alta',
};

function cabecalho(refs: Referencia[]): Campo<Plano>[] {
  return [
    {
      titulo: 'CATEGORIA',
      caminho: 'categoria',
      tipo: 'texto',
      lista: referencia(refs, 'categorias'),
      obrigatorio: 'No plano novo',
      explicacao:
        'A categoria de equipamento do plano, pelo nome como na aba REFERÊNCIAS. Plano antigo, de antes da categoria, pode continuar sem ela.',
      exemplo: 'Transformador de Potência',
      valor: (p) => p.categoria?.nome ?? null,
    },
    {
      titulo: 'ID DA CATEGORIA',
      caminho: 'categoria_ref',
      tipo: 'texto',
      identificador: true,
      explicacao: 'O ID da categoria. Resolve nomes repetidos; com o nome trocado, vale o nome.',
      valor: (p) => p.categoria_id?.trim() ?? null,
    },
    {
      titulo: 'NOME',
      caminho: 'nome',
      tipo: 'texto',
      obrigatorio: 'Sim',
      explicacao: 'Nome do plano (até 200 caracteres).',
      exemplo: 'Plano de manutenção — Transformador',
      valor: (p) => p.nome,
    },
    {
      titulo: 'VERSÃO',
      caminho: 'versao',
      tipo: 'texto',
      vazioEhPadrao: true,
      explicacao: 'Versão do plano (até 20 caracteres). Vazio = mantém (1.0 no plano novo).',
      exemplo: '1.0',
      valor: (p) => p.versao,
    },
    {
      titulo: 'DESCRIÇÃO',
      caminho: 'descricao',
      tipo: 'texto',
      explicacao: 'Texto livre.',
      valor: (p) => p.descricao ?? null,
    },
    {
      titulo: 'EQUIPAMENTOS VINCULADOS',
      tipo: 'inteiro',
      explicacao: 'Quantos equipamentos usam este plano (recebem as mudanças pela propagação).',
      valor: (p) => p.total_equipamentos_vinculados ?? 0,
    },
  ];
}

function secaoDeTarefas(refs: Referencia[]) {
  return secao<Plano, TarefaComInstrucao>({
    titulo: 'TAREFAS',
    cor: AZUL_CLARO,
    explicacao:
      'O que o plano manda fazer. Tarefa com ID é editada; linha sem ID cria uma tarefa nova (no fim do plano). Tarefa que sumiu da seção é removida, como o Excluir da tela; seção sem nenhuma linha remove todas. A ordem das tarefas existentes não muda pela planilha.',
    itens: (p) => p.tarefasDoPlano,
    colunas: [
      {
        titulo: 'INSTRUÇÃO',
        caminho: 'instrucao',
        tipo: 'texto',
        lista: referencia(refs, 'instrucoes'),
        obrigatorio: 'Na tarefa nova',
        explicacao:
          'A instrução que a tarefa executa: o nome como na aba REFERÊNCIAS, ou a TAG (INST-…). Tarefa antiga, de antes da instrução, pode continuar sem ela.',
        exemplo: 'INST-006',
        valor: (t) => t.nomeDaInstrucao,
      },
      {
        titulo: 'NOME',
        caminho: 'nome',
        tipo: 'texto',
        explicacao: 'Nome da tarefa. Vazio = o nome da instrução.',
        valor: (t) => t.nome,
      },
      {
        titulo: 'PERIODICIDADE',
        caminho: 'frequencia',
        tipo: 'opcao',
        rotulos: PERIODICIDADES,
        obrigatorio: 'Sim',
        explicacao: 'De quanto em quanto tempo a tarefa vira OS.',
        exemplo: 'Mensal',
        valor: (t) => t.frequencia,
      },
      {
        titulo: 'DIAS',
        caminho: 'frequencia_personalizada',
        tipo: 'inteiro',
        explicacao: 'Só na periodicidade Personalizada: a cada quantos dias.',
        exemplo: '45',
        valor: (t) => t.frequencia_personalizada ?? null,
      },
      {
        titulo: 'CRITICIDADE',
        caminho: 'criticidade',
        tipo: 'opcao',
        rotulos: CRITICIDADES,
        obrigatorio: 'Sim',
        explicacao: 'De Muito Baixa (1) a Muito Alta (5).',
        exemplo: 'Média',
        valor: (t) => String(t.criticidade),
      },
      { titulo: 'TAG', tipo: 'texto', explicacao: 'Gerada pelo sistema.', valor: (t) => t.tag },
      {
        titulo: 'ID DA TAREFA',
        caminho: 'id',
        tipo: 'texto',
        identificador: true,
        explicacao: 'Identifica a tarefa. Não altere; em tarefa nova, deixe vazio.',
        valor: (t) => t.id.trim(),
      },
      {
        titulo: 'ID DA INSTRUÇÃO',
        caminho: 'instrucao_ref',
        tipo: 'texto',
        identificador: true,
        explicacao: 'O ID da instrução. Resolve nomes repetidos; com o nome trocado, vale o nome.',
        valor: (t) => t.instrucao_id?.trim() ?? null,
      },
    ],
  });
}

const resumo: Campo<Plano>[] = [
  { titulo: 'PLANO DE MANUTENÇÃO', caminho: 'nome', tipo: 'texto', largura: 44, explicacao: '', valor: (p) => p.nome },
  { titulo: 'VERSÃO', tipo: 'texto', largura: 9, explicacao: '', valor: (p) => p.versao },
  { titulo: 'CATEGORIA', tipo: 'texto', largura: 28, explicacao: '', valor: (p) => p.categoria?.nome ?? null },
  {
    titulo: 'EQUIPAMENTOS',
    tipo: 'inteiro',
    largura: 13,
    explicacao: '',
    valor: (p) => p.total_equipamentos_vinculados ?? 0,
  },
  { titulo: 'TAREFAS', tipo: 'inteiro', largura: 10, explicacao: '', valor: (p) => p.tarefasDoPlano.length },
];

function montar(cabecalhoLido: Record<string, unknown>, secoesLidas: SecoesLidas) {
  const dados: Record<string, unknown> = { ...cabecalhoLido };
  if (secoesLidas.TAREFAS) dados.tarefas = secoesLidas.TAREFAS;
  return dados;
}

function definicao(referencias: Referencia[]): PlanilhaDeFichas<Plano> {
  return {
    cadastro: 'Planos de Manutenção',
    singular: 'plano',
    tituloDaFicha: 'PLANO DE MANUTENÇÃO',
    campos: cabecalho(referencias),
    secoes: [secaoDeTarefas(referencias)],
    resumo,
    larguras: [26, 40, 22, 9, 16, 14, 30, 30],
    id: (p) => p.id.trim(),
    nome: (p) => p.nome,
    atualizadoEm: (p) => (p.updated_at ? String(p.updated_at) : null),
    comoTirarDeUso: 'remova o plano na tela de Planos de Manutenção',
    montar,
    referencias,
    regrasDoCadastro: [
      'Só os planos-modelo (um por categoria) estão aqui. O plano de cada equipamento recebe as mudanças pela propagação, que começa depois de você confirmar a importação.',
      'As instruções já têm de existir (importe Instruções primeiro).',
    ],
  };
}

export const definicaoDePlanos = definicao([]);

export async function exportarPlanos(filtros: Pick<QueryPlanosApiParams, 'search'>) {
  const [lista, categorias, instrucoes] = await Promise.all([
    todasAsPaginas((page, limit) => planosManutencaoApi.findAll({ ...filtros, page, limit })),
    referenciaDeCategorias(),
    referenciaDeInstrucoes(),
  ]);

  const nomePorId = new Map(instrucoes.linhas.map(([nome, , id]) => [String(id), String(nome)]));
  const planos: Plano[] = [];
  // A listagem não traz a periodicidade das tarefas: as de cada plano, um por vez.
  for (const plano of lista) {
    const tarefas = await tarefasApi.findByPlano(plano.id.trim());
    planos.push({
      ...plano,
      tarefasDoPlano: [...tarefas]
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((t) => ({
          ...t,
          // A instrução inativa não está na referência, mas a tarefa pode usá-la.
          nomeDaInstrucao: t.instrucao?.nome ?? (t.instrucao_id ? (nomePorId.get(t.instrucao_id.trim()) ?? null) : null),
        })),
    });
  }

  await exportarFichas(definicao([categorias, instrucoes]), planos);
}

/** A leitura não usa as referências: quem acha o nome é o servidor. */
export const lerPlanos = (livro: Workbook) => lerFichas(definicaoDePlanos, livro);
