import type { Workbook, Worksheet } from 'exceljs';

import type { Campo } from '@/lib/planilha/campos';
import { AMARELO, AZUL_CLARO, SALMAO, VERDE, VERDE_RECURSOS, calculada, moeda, preencher } from '@/lib/planilha/estilo';
import { exportarFichas, lerFichas, secao, type PlanilhaDeFichas, type SecaoDaFicha, type SecoesLidas } from '@/lib/planilha/fichas';
import { AUTOR_DO_SMART_PROJECT, casarPelaChave, separarOutroSistema } from '@/lib/planilha/outro-sistema';
import { referencia, type Referencia } from '@/lib/planilha/referencias';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import type { LeituraDaPlanilha } from '@/lib/planilha/tipos';
import {
  instrucoesApi,
  ROTULO_DA_DISCIPLINA,
  type InstrucaoApiResponse,
  type QueryInstrucoesApiParams,
  type SubInstrucaoApiResponse,
} from '@/services/instrucoes.services';
import { ROTULO_DA_BASE, recursosApi, rotuloCategoria, type BaseDeCusto } from '@/services/recursos.services';
import { ROTULO_DO_TIPO_DE_MAQUINARIO, maquinariosApi } from '@/services/maquinarios.services';

/**
 * Instruções na planilha, na montagem da planilha de instruções do AupusProject
 * (SN-85, decisão do usuário: a de um importa no outro). Uma aba por
 * instrução: o cabeçalho (CÓDIGO, NOME, DESCRIÇÃO, FRENTE, INÍCIO, DURAÇÃO,
 * ATIVO) e as seções PASSOS, RECURSOS, MAQUINÁRIO e MATERIAIS, com as mesmas
 * colunas de lá. O que só o Service tem vem depois: STATUS no cabeçalho e, nos
 * passos, o registro de leitura, a faixa e a foto. Na planilha de lá essas
 * colunas faltam, e isso não é erro (`soDesteSistema`).
 *
 * O VALOR PRÓPRIO sai vazio quando a linha segue o cadastro: escrever ali o
 * preço vigente transformaria toda linha em preço próprio na volta. O do
 * cadastro vai ao lado, em cinza.
 */

type Instrucao = InstrucaoApiResponse;

/** Uma linha de recurso, material ou maquinário, já com o custo do servidor */
type LinhaDaFicha = {
  id: string;
  nome: string;
  base: string | null;
  quantidade: number;
  duracao_horas: number;
  distancia_km: number | null;
  preco_proprio: number | null;
  fator_perda: number;
  fornecido_pelo_cliente: boolean;
  preco_cadastro: number | null;
  subtotal: number | null;
};

const STATUS: Record<string, string> = {
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  EM_REVISAO: 'Em revisão',
  ARQUIVADA: 'Arquivada',
};

const REGISTRO_DO_PASSO: Record<string, string> = {
  VERIFICACAO: 'Verificação',
  LEITURA: 'Leitura',
};

function recursosDa(instrucao: Instrucao, materiais: boolean): LinhaDaFicha[] {
  return (instrucao.recursos ?? [])
    .filter((r) => (r.recurso?.categoria === 'MATERIAL') === materiais)
    .map((r) => ({
      id: r.recurso_id.trim(),
      nome: r.recurso?.nome ?? '',
      base: r.recurso?.base_calculo ?? null,
      quantidade: r.quantidade,
      duracao_horas: r.duracao_horas,
      distancia_km: r.distancia_km,
      preco_proprio: r.preco_proprio,
      fator_perda: r.fator_perda,
      fornecido_pelo_cliente: r.fornecido_pelo_cliente,
      preco_cadastro: r.preco_cadastro,
      subtotal: r.subtotal,
    }));
}

function maquinariosDa(instrucao: Instrucao): LinhaDaFicha[] {
  return (instrucao.maquinarios ?? []).map((m) => ({
    id: m.maquinario_id.trim(),
    nome: m.maquinario?.nome ?? '',
    base: m.maquinario?.base_calculo ?? null,
    quantidade: m.quantidade,
    duracao_horas: m.duracao_horas,
    distancia_km: m.distancia_km,
    preco_proprio: m.preco_proprio,
    fator_perda: 0,
    fornecido_pelo_cliente: false,
    preco_cadastro: m.preco_cadastro,
    subtotal: m.subtotal,
  }));
}

// ---- As colunas de cada seção ------------------------------------------------

const ITEM = (lista: string | undefined, caminho: 'recurso' | 'maquinario', oQue: string): Campo<LinhaDaFicha> => ({
  titulo: 'ITEM',
  caminho,
  tipo: 'texto',
  lista,
  obrigatorio: 'Sim',
  explicacao: `O ${oQue}, pelo nome exato da aba REFERÊNCIAS. Cada item entra uma vez só por instrução.`,
  valor: (l) => l.nome,
});

const COBRANCA: Campo<LinhaDaFicha> = {
  titulo: 'COBRANÇA',
  tipo: 'texto',
  explicacao: 'Como o item é cobrado — vem do cadastro dele.',
  valor: (l) => (l.base ? (ROTULO_DA_BASE[l.base as BaseDeCusto] ?? l.base) : null),
};

const QNT: Campo<LinhaDaFicha> = {
  titulo: 'QNT',
  caminho: 'quantidade',
  tipo: 'numero',
  vazioEhPadrao: true,
  explicacao: 'Quantos (pessoas, equipamentos, unidades). Vazio = 1.',
  exemplo: '2',
  valor: (l) => l.quantidade,
};

const DURACAO: Campo<LinhaDaFicha> = {
  titulo: 'DURAÇÃO [H]',
  caminho: 'duracao_horas',
  tipo: 'numero',
  vazioEhPadrao: true,
  explicacao: 'Horas de uso de cada um, na cobrança por hora ou por diária (a diária arredonda para cima). Vazio = 0.',
  exemplo: '8',
  valor: (l) => l.duracao_horas,
};

const DISTANCIA: Campo<LinhaDaFicha> = {
  titulo: 'DISTÂNCIA [KM]',
  caminho: 'distancia_km',
  tipo: 'numero',
  explicacao: 'Só na cobrança por quilômetro.',
  exemplo: '120',
  valor: (l) => l.distancia_km,
};

const VALOR_PROPRIO: Campo<LinhaDaFicha> = {
  titulo: 'VALOR PRÓPRIO',
  caminho: 'preco_proprio',
  tipo: 'moeda',
  explicacao:
    'Preço por unidade da cobrança só nesta instrução. VAZIO = segue o cadastro (o normal). Só preencha para fixar um preço diferente aqui.',
  exemplo: '(vazio)',
  valor: (l) => l.preco_proprio,
};

const VALOR_DO_CADASTRO: Campo<LinhaDaFicha> = {
  titulo: 'VALOR DO CADASTRO',
  tipo: 'moeda',
  explicacao: 'O preço por unidade que o cadastro do item tem hoje.',
  valor: (l) => l.preco_cadastro,
};

const TOTAL: Campo<LinhaDaFicha> = {
  titulo: 'TOTAL',
  tipo: 'moeda',
  explicacao: 'O custo da linha numa execução (vazio: o item não tem preço).',
  valor: (l) => l.subtotal,
};

const ID_DO_ITEM = (caminho: 'recurso_ref' | 'maquinario_ref'): Campo<LinhaDaFicha> => ({
  titulo: 'ID DO ITEM',
  caminho,
  tipo: 'texto',
  identificador: true,
  explicacao: 'O ID do item no cadastro. Resolve nomes repetidos; com o nome trocado, vale o nome. Em linha nova, deixe vazio.',
  valor: (l) => l.id,
});

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
        titulo: 'TIPO',
        caminho: 'tipo',
        tipo: 'opcao',
        rotulos: ROTULO_DA_DISCIPLINA,
        explicacao: 'A disciplina do passo. Vazio = sem disciplina.',
        exemplo: 'Elétrico',
        valor: (p) => p.tipo ?? null,
      },
      {
        titulo: 'DURAÇÃO [H]',
        caminho: 'duracao_horas',
        tipo: 'numero',
        explicacao: 'Quanto o passo leva, em horas (0,5 = 30 minutos).',
        exemplo: '1,5',
        valor: (p) => p.duracao_horas ?? null,
      },
      {
        titulo: 'OBRIGATÓRIO',
        caminho: 'obrigatoria',
        tipo: 'simnao',
        vazioEhPadrao: true,
        explicacao: 'SIM se a OS não fecha sem este passo. Vazio = NÃO.',
        exemplo: 'NÃO',
        valor: (p) => p.obrigatoria,
      },
      // Daqui em diante, só do Service: na planilha do AupusProject faltam. Sem
      // `vazioEhPadrao` de propósito: no arquivo daqui a chave vai sempre (vazio =
      // nulo = o padrão), e só o de lá chega sem ela — é assim que o servidor sabe
      // que deve manter a leitura e a foto do passo daqui de mesma descrição
      {
        titulo: 'REGISTRO',
        caminho: 'registro',
        tipo: 'opcao',
        rotulos: REGISTRO_DO_PASSO,
        soDesteSistema: true,
        explicacao:
          'Verificação: a equipe marca feito. Leitura: a equipe digita o valor medido, e o valor fora da faixa pede explicação. Vazio = Verificação.',
        exemplo: 'Leitura',
        valor: (p) => p.registro ?? null,
      },
      {
        titulo: 'UNIDADE',
        caminho: 'unidade',
        tipo: 'texto',
        soDesteSistema: true,
        explicacao: 'Só na leitura: a unidade do valor (até 20 caracteres). Na verificação, deixe vazio.',
        exemplo: 'V',
        valor: (p) => p.unidade,
      },
      {
        titulo: 'MÍNIMO',
        caminho: 'valor_minimo',
        tipo: 'numero',
        soDesteSistema: true,
        explicacao:
          'Só na leitura: o menor valor aceito (ele mesmo é aceito). Vazio = sem mínimo. Até 4 casas decimais, entre -9.999.999.999 e 9.999.999.999, e não pode passar do MÁXIMO.',
        exemplo: '580',
        valor: (p) => p.valor_minimo,
      },
      {
        titulo: 'MÁXIMO',
        caminho: 'valor_maximo',
        tipo: 'numero',
        soDesteSistema: true,
        explicacao:
          'Só na leitura: o maior valor aceito (ele mesmo é aceito). Vazio = sem máximo. Até 4 casas decimais, entre -9.999.999.999 e 9.999.999.999.',
        exemplo: '620',
        valor: (p) => p.valor_maximo,
      },
      {
        titulo: 'EXIGE FOTO',
        caminho: 'exige_foto',
        tipo: 'simnao',
        soDesteSistema: true,
        explicacao: 'SIM se, na OS, o item só pode ser marcado com uma foto dele. Vazio = NÃO.',
        exemplo: 'SIM',
        valor: (p) => p.exige_foto,
      },
    ],
  };

  const recursos: SecaoDaFicha<Instrucao, LinhaDaFicha> = {
    titulo: 'RECURSOS',
    cor: VERDE_RECURSOS,
    explicacao:
      'Mão de obra, instrumentos, veículos, terceiros e despesas de campo (os recursos que não são material). Linha que sumiu é removida.',
    itens: (i) => recursosDa(i, false),
    colunas: [ITEM(referencia(refs, 'recursos'), 'recurso', 'recurso'), COBRANCA, QNT, DURACAO, DISTANCIA, VALOR_PROPRIO, VALOR_DO_CADASTRO, TOTAL, ID_DO_ITEM('recurso_ref')],
  };

  const maquinario: SecaoDaFicha<Instrucao, LinhaDaFicha> = {
    titulo: 'MAQUINÁRIO',
    cor: SALMAO,
    explicacao: 'As máquinas do cadastro de Maquinários. Linha que sumiu é removida.',
    itens: maquinariosDa,
    colunas: [ITEM(referencia(refs, 'maquinario'), 'maquinario', 'maquinário'), COBRANCA, QNT, DURACAO, DISTANCIA, VALOR_PROPRIO, VALOR_DO_CADASTRO, TOTAL, ID_DO_ITEM('maquinario_ref')],
  };

  const materiais: SecaoDaFicha<Instrucao, LinhaDaFicha> = {
    titulo: 'MATERIAIS',
    cor: AMARELO,
    explicacao:
      'Os recursos de categoria material. FD = SIM quando o cliente compra direto do fornecedor (faturamento direto): entra no escopo e fica fora do custo.',
    itens: (i) => recursosDa(i, true),
    colunas: [
      ITEM(referencia(refs, 'materiais'), 'recurso', 'material'),
      { ...QNT, explicacao: 'Quantas unidades do material (m, un, kg…). Vazio = 1.', exemplo: '120' },
      {
        titulo: 'PERDA (%)',
        caminho: 'fator_perda',
        tipo: 'percentual',
        vazioEhPadrao: true,
        explicacao: 'Sobra e perda na instalação, de 0 a 100. Vazio = 0.',
        exemplo: '10',
        valor: (l) => l.fator_perda,
      },
      {
        titulo: 'FD',
        caminho: 'fornecido_pelo_cliente',
        tipo: 'simnao',
        vazioEhPadrao: true,
        explicacao: 'SIM se o cliente compra direto (faturamento direto). Vazio = NÃO.',
        exemplo: 'NÃO',
        valor: (l) => l.fornecido_pelo_cliente,
      },
      VALOR_PROPRIO,
      VALOR_DO_CADASTRO,
      TOTAL,
      ID_DO_ITEM('recurso_ref'),
    ],
  };

  return [secao(passos), secao(recursos), secao(maquinario), secao(materiais)];
}

const cabecalho: Campo<Instrucao>[] = [
  {
    titulo: 'CÓDIGO',
    caminho: 'codigo',
    tipo: 'texto',
    vazioEhPadrao: true,
    explicacao: 'Código da instrução. Único: não pode repetir o de outra. Vazio = mantém (na nova, o sistema gera INST-…).',
    exemplo: 'INST-012',
    valor: (i) => i.codigo,
  },
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    obrigatorio: 'Sim',
    explicacao: 'Nome da instrução (até 255 caracteres).',
    exemplo: 'Limpeza dos módulos fotovoltaicos',
    valor: (i) => i.nome,
  },
  {
    titulo: 'DESCRIÇÃO',
    caminho: 'descricao',
    tipo: 'texto',
    explicacao: 'O que a instrução cobre. Aparece nas tarefas que nascem dela.',
    valor: (i) => i.descricao,
  },
  {
    titulo: 'FRENTE',
    caminho: 'frente',
    tipo: 'texto',
    explicacao: 'Frente de trabalho, para agrupar no cronograma (texto livre; repita a grafia das outras instruções).',
    exemplo: 'Elétrica',
    valor: (i) => i.frente,
  },
  {
    titulo: 'INÍCIO (D+X, DIAS)',
    caminho: 'prazo_inicio_relativo',
    tipo: 'inteiro',
    vazioEhPadrao: true,
    explicacao: 'Quantos dias depois do marco zero do projeto a instrução começa. Vazio = mantém (0 na nova).',
    exemplo: '5',
    valor: (i) => i.prazo_inicio_relativo,
  },
  {
    titulo: 'DURAÇÃO (DIAS)',
    caminho: 'duracao_dias',
    tipo: 'inteiro',
    vazioEhPadrao: true,
    explicacao: 'Quantos dias a instrução leva (mínimo 1). Vazio = mantém (1 na nova).',
    exemplo: '3',
    valor: (i) => i.duracao_dias,
  },
  {
    titulo: 'ATIVO',
    caminho: 'ativo',
    tipo: 'simnao',
    vazioEhPadrao: true,
    explicacao: 'NÃO tira a instrução de uso sem apagá-la. Tem de bater com o STATUS. Vazio = mantém (SIM na nova).',
    exemplo: 'SIM',
    valor: (i) => i.ativo,
  },
  // Só do Service
  {
    titulo: 'STATUS',
    caminho: 'status',
    tipo: 'opcao',
    rotulos: STATUS,
    vazioEhPadrao: true,
    explicacao: 'Só a Ativa aparece para virar tarefa. Inativa, Em revisão ou Arquivada tira de uso sem apagar. Vazio = mantém (Ativa na nova).',
    exemplo: 'Ativa',
    valor: (i) => i.status,
  },
  {
    titulo: 'TAREFAS DERIVADAS',
    tipo: 'inteiro',
    explicacao: 'Quantas tarefas de plano usam esta instrução.',
    valor: (i) => i.total_tarefas_derivadas ?? 0,
  },
];

const resumo: Campo<Instrucao>[] = [
  { titulo: 'CÓDIGO', tipo: 'texto', largura: 12, explicacao: '', valor: (i) => i.codigo },
  { titulo: 'NOME', caminho: 'nome', tipo: 'texto', largura: 46, explicacao: '', valor: (i) => i.nome },
  { titulo: 'FRENTE', tipo: 'texto', largura: 16, explicacao: '', valor: (i) => i.frente },
  { titulo: 'INÍCIO (D+X)', tipo: 'inteiro', largura: 10, explicacao: '', valor: (i) => i.prazo_inicio_relativo },
  { titulo: 'DURAÇÃO (DIAS)', tipo: 'inteiro', largura: 10, explicacao: '', valor: (i) => i.duracao_dias },
  { titulo: 'PASSOS', tipo: 'inteiro', largura: 9, explicacao: '', valor: (i) => i.sub_instrucoes?.length ?? i.total_sub_instrucoes ?? 0 },
  { titulo: 'RECURSOS', tipo: 'inteiro', largura: 10, explicacao: '', valor: (i) => recursosDa(i, false).length },
  { titulo: 'MAQUINÁRIO', tipo: 'inteiro', largura: 11, explicacao: '', valor: (i) => maquinariosDa(i).length },
  { titulo: 'MATERIAIS', tipo: 'inteiro', largura: 10, explicacao: '', valor: (i) => recursosDa(i, true).length },
  { titulo: 'VALOR', tipo: 'moeda', largura: 16, explicacao: '', valor: (i) => i.custo ?? null },
  { titulo: 'ATIVO', tipo: 'simnao', largura: 8, explicacao: '', valor: (i) => i.ativo },
  { titulo: 'STATUS', tipo: 'opcao', rotulos: STATUS, largura: 12, explicacao: '', valor: (i) => i.status },
  { titulo: 'TAREFAS DERIVADAS', tipo: 'inteiro', largura: 12, explicacao: '', valor: (i) => i.total_tarefas_derivadas ?? 0 },
];

/** Os subtotais e o valor da instrução, depois das seções — calculados, a leitura pula */
function rodape(ws: Worksheet, instrucao: Instrucao) {
  const linhas: Array<[string, number | null | undefined, boolean?]> = [
    ['Subtotal recursos', instrucao.custo_por_grupo?.recursos],
    ['Subtotal maquinário', instrucao.custo_por_grupo?.maquinario],
    ['Subtotal materiais', instrucao.custo_por_grupo?.materiais],
    ['VALOR DA INSTRUÇÃO', instrucao.custo, true],
  ];

  for (const [rotulo, valor, destaque] of linhas) {
    const linha = ws.addRow([rotulo, valor ?? 'indeterminado']);
    linha.getCell(1).font = { bold: !!destaque };
    if (valor !== null && valor !== undefined) moeda(linha.getCell(2));
    calculada(linha.getCell(2));
    if (destaque) {
      preencher(linha.getCell(1), VERDE);
      preencher(linha.getCell(2), VERDE);
      linha.getCell(2).font = { bold: true };
    }
  }
}

/**
 * Recursos e materiais são a mesma lista na API: com uma das duas seções
 * faltando, a importação apagaria a outra metade sem querer.
 */
function conferir(secoesLidas: SecoesLidas): string | null {
  const temRecursos = secoesLidas.RECURSOS !== undefined;
  const temMateriais = secoesLidas.MATERIAIS !== undefined;
  if (temRecursos === temMateriais) return null;
  return `A seção ${temRecursos ? 'MATERIAIS' : 'RECURSOS'} sumiu desta aba. Recursos e materiais são gravados juntos: restaure o cabeçalho da seção (copie da aba MODELO).`;
}

/** Cabeçalho + seções → o payload; a seção da linha diz ao servidor onde procurar o item pelo nome */
function montar(cabecalhoLido: Record<string, unknown>, secoesLidas: SecoesLidas) {
  const dados: Record<string, unknown> = { ...cabecalhoLido };

  if (secoesLidas.PASSOS) dados.sub_instrucoes = secoesLidas.PASSOS;
  if (secoesLidas.RECURSOS && secoesLidas.MATERIAIS) {
    dados.recursos = [
      ...secoesLidas.RECURSOS.map((l) => ({ ...l, grupo: 'recursos' })),
      ...secoesLidas.MATERIAIS.map((l) => ({ ...l, grupo: 'materiais' })),
    ];
  }
  if (secoesLidas['MAQUINÁRIO']) dados.maquinarios = secoesLidas['MAQUINÁRIO'];

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
    larguras: [24, 46, 16, 10, 12, 14, 14, 16, 14, 10],
    id: (i) => i.id.trim(),
    nome: (i) => i.nome,
    atualizadoEm: (i) => (i.updated_at ? String(i.updated_at) : null),
    comoTirarDeUso: 'escreva NÃO em ATIVO (ou Inativa, Em revisão ou Arquivada em STATUS)',
    montar,
    conferir,
    rodape,
    referencias,
    regrasDoCadastro: [
      'Antes de importar instruções, os recursos, materiais e maquinários que elas usam já têm de existir (importe Recursos e Maquinários primeiro).',
      'VALOR PRÓPRIO vazio é o normal: a linha segue o preço do cadastro. Preencher fixa um preço só nesta instrução.',
      'A planilha de instruções do Smart Project (AupusProject) importa aqui: cada instrução casa pelo CÓDIGO (sem ele, pelo nome) e cada item pelo nome.',
      'Anexos da instrução não passam pela planilha: anexe pela tela.',
      'Mudar a instrução muda na hora o que as tarefas que a usam mostram; as OS já geradas guardam a cópia delas.',
    ],
  };
}

export const definicaoDeInstrucoes = definicao([]);

async function referencias(): Promise<Referencia[]> {
  const [recursos, maquinarios] = await Promise.all([
    todasAsPaginas((page, limit) => recursosApi.listar({ page, limit })),
    todasAsPaginas((page, limit) => maquinariosApi.listar({ page, limit })),
  ]);
  const custo = (v: number | null | undefined) => (v === null || v === undefined ? null : Number(v));
  return [
    {
      chave: 'recursos',
      titulo: 'RECURSOS',
      colunas: ['NOME', 'CATEGORIA', 'COBRANÇA', 'CUSTO', 'ATIVO', 'ID'],
      linhas: recursos
        .filter((r) => r.categoria !== 'MATERIAL')
        .map((r) => [r.nome, rotuloCategoria(r.categoria), ROTULO_DA_BASE[r.base_calculo] ?? r.base_calculo, custo(r.preco_base), r.ativo ? 'SIM' : 'NÃO', r.id.trim()]),
    },
    {
      chave: 'materiais',
      titulo: 'MATERIAIS',
      colunas: ['NOME', 'UNIDADE', 'CUSTO', 'ATIVO', 'ID'],
      linhas: recursos
        .filter((r) => r.categoria === 'MATERIAL')
        .map((r) => [r.nome, r.unidade ?? null, custo(r.preco_base), r.ativo ? 'SIM' : 'NÃO', r.id.trim()]),
    },
    {
      chave: 'maquinario',
      titulo: 'MAQUINÁRIO',
      colunas: ['NOME', 'TIPO', 'COBRANÇA', 'CUSTO', 'ATIVO', 'ID'],
      linhas: maquinarios.map((m) => [
        m.nome,
        ROTULO_DO_TIPO_DE_MAQUINARIO[m.tipo] ?? m.tipo,
        ROTULO_DA_BASE[m.base_calculo as BaseDeCusto] ?? m.base_calculo,
        custo(m.preco_base),
        m.ativo ? 'SIM' : 'NÃO',
        m.id.trim(),
      ]),
    },
  ];
}

export async function exportarInstrucoes(filtros: Omit<QueryInstrucoesApiParams, 'page' | 'limit'>) {
  const [lista, refs] = await Promise.all([
    todasAsPaginas((page, limit) => instrucoesApi.findAll({ ...filtros, page, limit })),
    referencias(),
  ]);
  // A listagem não traz passos nem linhas: o detalhe de cada uma, uma por vez.
  const instrucoes: Instrucao[] = [];
  for (const item of lista) instrucoes.push(await instrucoesApi.findOne(item.id.trim()));

  await exportarFichas(definicao(refs), instrucoes);
}

/**
 * A leitura não usa as referências: quem acha o item pelo nome é o servidor.
 * A planilha do Smart Project (AupusProject) não tem as colunas só daqui e
 * traz os IDs de lá: cada instrução casa pelo código (sem ele, pelo nome) com
 * as daqui.
 */
export async function lerInstrucoes(livro: Workbook): Promise<LeituraDaPlanilha> {
  const lida = lerFichas(definicaoDeInstrucoes, livro, { deOutroSistema: livro.creator?.trim() === AUTOR_DO_SMART_PROJECT });
  const { deOutroSistema, leitura } = separarOutroSistema(livro, lida);
  if (!deOutroSistema) return leitura;

  const daqui = await todasAsPaginas((page, limit) => instrucoesApi.findAll({ page, limit }));
  const pelaChave = daqui.flatMap((i) => [
    { id: i.id, chave: `codigo ${i.codigo}`, nome: `${i.codigo} - ${i.nome}` },
    { id: i.id, chave: `nome ${i.nome}`, nome: `${i.codigo} - ${i.nome}` },
  ]);
  const chaveDo = (dados: Record<string, unknown>) => {
    const codigo = typeof dados.codigo === 'string' ? dados.codigo.trim() : '';
    return codigo ? `codigo ${codigo}` : `nome ${String(dados.nome ?? '')}`;
  };
  return casarPelaChave(leitura, pelaChave, (r) => chaveDo(r.dados), { singular: 'instrução', plural: 'instruções' });
}
