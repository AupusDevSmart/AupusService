import type { Workbook } from 'exceljs';

import type { Campo } from '@/lib/planilha/campos';
import { AZUL_CLARO, VERDE_RECURSOS } from '@/lib/planilha/estilo';
import { exportarFichas, lerFichas, secao, type PlanilhaDeFichas, type SecaoDaFicha, type SecoesLidas } from '@/lib/planilha/fichas';
import { referencia, type Referencia } from '@/lib/planilha/referencias';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import {
  instrucoesApi,
  type InstrucaoApiResponse,
  type QueryInstrucoesApiParams,
  type SubInstrucaoApiResponse,
} from '@/services/instrucoes.services';
import { CATEGORIAS_RECURSO, recursosApi } from '@/services/recursos.services';

/**
 * Instruções na planilha: uma aba por instrução, com as seções PASSOS e
 * RECURSOS. Os campos que o formulário não mostra (categoria, tipo de
 * manutenção, criticidade…) saem em cinza, só para leitura.
 */

type LinhaDeRecurso = {
  tipo: string;
  descricao: string;
  quantidade?: number | string | null;
  unidade?: string | null;
  obrigatorio: boolean;
  recurso_id?: string | null;
  recurso?: { nome: string; unidade?: string | null } | null;
};

type Instrucao = Omit<InstrucaoApiResponse, 'recursos'> & { recursos?: LinhaDeRecurso[] };

const STATUS: Record<string, string> = {
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  EM_REVISAO: 'Em revisão',
  ARQUIVADA: 'Arquivada',
};

const TIPO_DO_PASSO: Record<string, string> = {
  VERIFICACAO: 'Verificação',
  LEITURA: 'Leitura',
};

const ROTULO_DA_CATEGORIA = Object.fromEntries(CATEGORIAS_RECURSO.map((c) => [c.value, c.label]));

/** Minutos no banco, horas na tela: 90 → 1,5. Quatro casas voltam ao minuto exato. */
const emHoras = (minutos?: number | null) =>
  minutos === null || minutos === undefined ? null : Math.round((minutos / 60) * 10000) / 10000;

const informativo = (titulo: string, valor: (i: Instrucao) => unknown, explicacao: string): Campo<Instrucao> => ({
  titulo,
  tipo: 'texto',
  explicacao,
  valor,
});

const cabecalho: Campo<Instrucao>[] = [
  informativo('TAG', (i) => i.tag, 'Gerada pelo sistema na instrução nova (INST-…).'),
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    obrigatorio: 'Sim',
    explicacao: 'Nome da instrução (até 200 caracteres).',
    exemplo: 'Limpeza dos módulos fotovoltaicos',
    valor: (i) => i.nome,
  },
  {
    titulo: 'DESCRIÇÃO',
    caminho: 'descricao',
    tipo: 'texto',
    obrigatorio: 'Sim',
    explicacao: 'O que a instrução cobre. Aparece nas tarefas que nascem dela.',
    valor: (i) => i.descricao,
  },
  {
    titulo: 'STATUS',
    caminho: 'status',
    tipo: 'opcao',
    rotulos: STATUS,
    obrigatorio: 'Sim',
    explicacao: 'Só a Ativa aparece para virar tarefa. Inativa ou Arquivada tira de uso sem apagar.',
    exemplo: 'Ativa',
    valor: (i) => i.status,
  },
  informativo('CATEGORIA', (i) => i.categoria, 'O formulário não mostra este campo; a instrução nova recebe Mecânica.'),
  informativo('TIPO DE MANUTENÇÃO', (i) => i.tipo_manutencao, 'O formulário não mostra este campo; a nova recebe Preventiva.'),
  informativo('CRITICIDADE', (i) => i.criticidade, 'O formulário não mostra este campo; a nova recebe 3.'),
  informativo('CONDIÇÃO DO ATIVO', (i) => i.condicao_ativo, 'O formulário não mostra este campo; a nova recebe Parado.'),
  informativo('TAREFAS DERIVADAS', (i) => i.total_tarefas_derivadas ?? 0, 'Quantas tarefas de plano usam esta instrução.'),
];

function secoes(refs: Referencia[]): SecaoDaFicha<Instrucao, never>[] {
  const passos: SecaoDaFicha<Instrucao, SubInstrucaoApiResponse> = {
    titulo: 'PASSOS',
    cor: AZUL_CLARO,
    explicacao:
      'O passo a passo, na ordem das linhas. Vira o checklist da OS. Passo que sumiu da seção é removido; seção sem nenhuma linha remove todos.',
    itens: (i) => [...(i.sub_instrucoes ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    colunas: [
      {
        titulo: 'DESCRIÇÃO',
        caminho: 'descricao',
        tipo: 'texto',
        obrigatorio: 'Sim',
        explicacao: 'O que se faz neste passo.',
        exemplo: 'Desenergizar e aterrar o circuito',
        valor: (p) => p.descricao,
      },
      {
        titulo: 'OBRIGATÓRIO',
        caminho: 'obrigatoria',
        tipo: 'simnao',
        vazioEhPadrao: true,
        explicacao: 'SIM se a OS não fecha sem este passo. Vazio = NÃO.',
        exemplo: 'SIM',
        valor: (p) => p.obrigatoria,
      },
      {
        titulo: 'TEMPO (H)',
        caminho: 'tempo_horas',
        tipo: 'numero',
        explicacao: 'Quanto o passo leva, em horas (0,5 = 30 minutos).',
        exemplo: '1,5',
        valor: (p) => emHoras(p.tempo_estimado),
      },
      {
        titulo: 'TIPO',
        caminho: 'tipo',
        tipo: 'opcao',
        rotulos: TIPO_DO_PASSO,
        vazioEhPadrao: true,
        explicacao:
          'Verificação: a equipe marca feito. Leitura: a equipe digita o valor medido, e o valor fora da faixa pede explicação. Vazio = Verificação.',
        exemplo: 'Leitura',
        valor: (p) => p.tipo,
      },
      {
        titulo: 'UNIDADE',
        caminho: 'unidade',
        tipo: 'texto',
        explicacao: 'Só na leitura: a unidade do valor (até 20 caracteres). Na verificação, deixe vazio.',
        exemplo: 'V',
        valor: (p) => p.unidade,
      },
      {
        titulo: 'MÍNIMO',
        caminho: 'valor_minimo',
        tipo: 'numero',
        explicacao:
          'Só na leitura: o menor valor aceito (ele mesmo é aceito). Vazio = sem mínimo. Até 4 casas decimais, entre -9.999.999.999 e 9.999.999.999, e não pode passar do MÁXIMO.',
        exemplo: '580',
        valor: (p) => p.valor_minimo,
      },
      {
        titulo: 'MÁXIMO',
        caminho: 'valor_maximo',
        tipo: 'numero',
        explicacao:
          'Só na leitura: o maior valor aceito (ele mesmo é aceito). Vazio = sem máximo. Até 4 casas decimais, entre -9.999.999.999 e 9.999.999.999.',
        exemplo: '620',
        valor: (p) => p.valor_maximo,
      },
      {
        titulo: 'EXIGE FOTO',
        caminho: 'exige_foto',
        tipo: 'simnao',
        vazioEhPadrao: true,
        explicacao: 'SIM se, na OS, o item só pode ser marcado com uma foto dele. Vazio = NÃO.',
        exemplo: 'SIM',
        valor: (p) => p.exige_foto,
      },
    ],
  };

  const recursos: SecaoDaFicha<Instrucao, LinhaDeRecurso> = {
    titulo: 'RECURSOS',
    cor: VERDE_RECURSOS,
    explicacao:
      'O que a execução usa, do catálogo de Recursos. Recurso que sumiu da seção é removido; seção sem nenhuma linha remove todos.',
    itens: (i) => i.recursos ?? [],
    colunas: [
      {
        titulo: 'CATEGORIA',
        caminho: 'tipo',
        tipo: 'opcao',
        rotulos: ROTULO_DA_CATEGORIA,
        obrigatorio: 'Sim',
        explicacao: 'A categoria do recurso no catálogo.',
        exemplo: 'Técnico',
        valor: (r) => r.tipo,
      },
      {
        titulo: 'RECURSO',
        caminho: 'recurso',
        tipo: 'texto',
        lista: referencia(refs, 'recursos'),
        obrigatorio: 'Sim',
        explicacao: 'O nome do recurso, como na aba REFERÊNCIAS, dentro da categoria da linha.',
        exemplo: 'Eletricista',
        valor: (r) => r.recurso?.nome ?? r.descricao,
      },
      {
        titulo: 'QTD',
        caminho: 'quantidade',
        tipo: 'numero',
        explicacao: 'Quanto do recurso, na unidade dele.',
        exemplo: '2',
        valor: (r) => (r.quantidade === null || r.quantidade === undefined ? null : Number(r.quantidade)),
      },
      {
        titulo: 'UNIDADE',
        tipo: 'texto',
        explicacao: 'A unidade vem do cadastro do recurso.',
        valor: (r) => r.recurso?.unidade ?? r.unidade ?? null,
      },
      {
        titulo: 'OBRIGATÓRIO',
        caminho: 'obrigatorio',
        tipo: 'simnao',
        vazioEhPadrao: true,
        explicacao: 'SIM se a execução não pode ficar sem ele. Vazio = NÃO.',
        exemplo: 'NÃO',
        valor: (r) => r.obrigatorio,
      },
      {
        titulo: 'ID DO RECURSO',
        caminho: 'recurso_ref',
        tipo: 'texto',
        identificador: true,
        explicacao: 'O ID do recurso no catálogo. Resolve nomes repetidos; com o nome trocado, vale o nome. Em linha nova, deixe vazio.',
        valor: (r) => r.recurso_id?.trim() ?? null,
      },
    ],
  };

  return [secao(passos), secao(recursos)];
}

const resumo: Campo<Instrucao>[] = [
  { titulo: 'INSTRUÇÃO', caminho: 'nome', tipo: 'texto', largura: 40, explicacao: '', valor: (i) => i.nome },
  { titulo: 'TAG', tipo: 'texto', largura: 12, explicacao: '', valor: (i) => i.tag },
  { titulo: 'DESCRIÇÃO', tipo: 'texto', largura: 50, explicacao: '', valor: (i) => i.descricao },
  { titulo: 'STATUS', tipo: 'opcao', rotulos: STATUS, largura: 12, explicacao: '', valor: (i) => i.status },
  {
    titulo: 'TAREFAS DERIVADAS',
    tipo: 'inteiro',
    largura: 12,
    explicacao: '',
    valor: (i) => i.total_tarefas_derivadas ?? 0,
  },
];

/** Cabeçalho + seções → o payload do formulário; horas do passo viram minutos. */
function montar(cabecalhoLido: Record<string, unknown>, secoesLidas: SecoesLidas) {
  const dados: Record<string, unknown> = { ...cabecalhoLido };

  if (secoesLidas.PASSOS) {
    dados.sub_instrucoes = secoesLidas.PASSOS.map(({ tempo_horas, ...passo }) => ({
      ...passo,
      tempo_estimado: typeof tempo_horas === 'number' ? Math.round(tempo_horas * 60) : null,
    }));
  }
  if (secoesLidas.RECURSOS) dados.recursos = secoesLidas.RECURSOS;

  return dados;
}

function definicao(referencias: Referencia[]): PlanilhaDeFichas<Instrucao> {
  return {
    cadastro: 'Instruções',
    singular: 'instrução',
    tituloDaFicha: 'INSTRUÇÃO',
    campos: cabecalho,
    secoes: secoes(referencias),
    resumo,
    larguras: [26, 50, 14, 12, 14, 18, 16, 12],
    id: (i) => i.id.trim(),
    nome: (i) => i.nome,
    atualizadoEm: (i) => (i.updated_at ? String(i.updated_at) : null),
    comoTirarDeUso: 'escreva Inativa ou Arquivada em STATUS',
    montar,
    referencias,
    regrasDoCadastro: [
      'Os recursos já têm de existir no catálogo de Recursos (importe Recursos primeiro).',
      'Anexos da instrução não passam pela planilha: anexe pela tela.',
      'Mudar a instrução muda na hora o que as tarefas que a usam mostram; as OS já geradas guardam a cópia delas.',
    ],
  };
}

export const definicaoDeInstrucoes = definicao([]);

async function referenciaDeRecursos(): Promise<Referencia> {
  const recursos = await todasAsPaginas((page, limit) => recursosApi.listar({ page, limit }));
  return {
    chave: 'recursos',
    titulo: 'RECURSOS',
    colunas: ['NOME', 'CATEGORIA', 'UNIDADE', 'ATIVO', 'ID'],
    linhas: recursos.map((r) => [
      r.nome,
      ROTULO_DA_CATEGORIA[r.categoria] ?? r.categoria,
      r.unidade ?? null,
      r.ativo ? 'SIM' : 'NÃO',
      r.id.trim(),
    ]),
  };
}

export async function exportarInstrucoes(filtros: Omit<QueryInstrucoesApiParams, 'page' | 'limit'>) {
  const [lista, recursos] = await Promise.all([
    todasAsPaginas((page, limit) => instrucoesApi.findAll({ ...filtros, page, limit })),
    referenciaDeRecursos(),
  ]);
  // A listagem não traz passos nem recursos: o detalhe de cada uma, uma por vez.
  const instrucoes: Instrucao[] = [];
  for (const item of lista) instrucoes.push((await instrucoesApi.findOne(item.id.trim())) as Instrucao);

  await exportarFichas(definicao([recursos]), instrucoes);
}

/** A leitura não usa as referências: quem acha o nome é o servidor. */
export const lerInstrucoes = (livro: Workbook) => lerFichas(definicaoDeInstrucoes, livro);
