import type { Workbook } from 'exceljs';

import { api } from '@/config/api';
import type { Campo } from '@/lib/planilha/campos';
import { AMARELO, AZUL_CLARO, VERDE_RECURSOS } from '@/lib/planilha/estilo';
import { exportarFichas, lerFichas, secao, type PlanilhaDeFichas, type SecoesLidas } from '@/lib/planilha/fichas';
import { chave } from '@/lib/planilha/leitura';
import { referencia, type Referencia } from '@/lib/planilha/referencias';
import { emParalelo, todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { equipamentosApi, type EquipamentosQueryParams } from '@/services/equipamentos.services';
import { planosManutencaoApi } from '@/services/planos-manutencao.services';
import { tarefasApi } from '@/services/tarefas.services';

/**
 * Equipamentos na planilha: uma aba por UC, com DADOS TÉCNICOS, COMPONENTES
 * UAR e, só para leitura, as TAREFAS DO PLANO. Decidido com o usuário
 * (09/out/2026): o plano entra pelo nome do template (trocar = vincular, como
 * na tela); as tarefas herdadas nunca viram customizadas pela planilha;
 * posição, pontos e MQTT ficam na tela.
 */

type DadoTecnico = { campo: string; valor: string; tipo: string; unidade?: string | null };

type ComponenteDaApi = {
  id: string;
  nome: string;
  tag?: string | null;
  tipo_equipamento_id?: string | null;
  numero_serie?: string | null;
  data_instalacao?: string | null;
  garantia_ate?: string | null;
  criticidade?: string | null;
  localizacao_especifica?: string | null;
  fornecedor?: string | null;
  centro_custo?: string | null;
  valor_imobilizado?: string | number | null;
  valor_depreciacao?: string | number | null;
  valor_contabil?: string | number | null;
  observacoes?: string | null;
  deleted_at?: string | null;
};

type TarefaDoPlano = {
  tag: string;
  nome: string;
  frequencia?: string | null;
  frequencia_personalizada?: number | null;
  criticidade: number;
  origem_status?: string | null;
  instrucao?: { nome: string } | null;
};

type EquipamentoDaApi = {
  id: string;
  nome: string;
  tag?: string | null;
  classificacao: string;
  status?: string | null;
  em_operacao?: string | null;
  criticidade?: string | null;
  numero_serie?: string | null;
  localizacao?: string | null;
  valor_contabil?: string | number | null;
  data_imobilizacao?: string | null;
  // SN-66
  data_instalacao?: string | null;
  garantia_ate?: string | null;
  fornecedor?: string | null;
  centro_custo?: string | null;
  mcpse?: boolean | null;
  tuc?: string | null;
  a1?: string | null;
  a2?: string | null;
  a3?: string | null;
  a4?: string | null;
  a5?: string | null;
  a6?: string | null;
  fabricante?: string | null;
  unidade_id?: string | null;
  updated_at?: string | null;
  unidade?: { nome: string; planta?: { nome: string } | null } | null;
  ativo_funcional?: { nome: string } | null;
  tipo_equipamento_rel?: { id: string; nome: string; codigo: string; categoria?: { nome: string } | null } | null;
  dados_tecnicos?: DadoTecnico[];
  equipamentos_filhos?: ComponenteDaApi[];
};

type Equipamento = EquipamentoDaApi & {
  plano: { nome: string; origemId: string | null } | null;
  tarefasDoPlano: TarefaDoPlano[];
  /** Nome do modelo de cada componente, pelo id (o filho não vem com o modelo). */
  modeloPorId: Map<string, string>;
};

const CRITICIDADES: Record<string, string> = {
  '1': 'Muito Baixa',
  '2': 'Baixa',
  '3': 'Média',
  '4': 'Alta',
  '5': 'Muito Alta',
};

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

const ORIGENS: Record<string, string> = {
  HERDADA: 'Herdada do plano',
  CUSTOMIZADA: 'Customizada',
  PROPRIA: 'Própria',
};

const dia = (v?: string | null) => (v ? v.slice(0, 10) : null);
const numero = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
/** Na planilha a criticidade aparece pelo rótulo; o que não é rótulo (valor antigo) segue como está. */
const rotuloDaCriticidade = (v?: string | null) => (v ? (CRITICIDADES[v] ?? v) : null);
const LISTA_DE_CRITICIDADES = `"${Object.values(CRITICIDADES).join(',')}"`;

function cabecalho(refs: Referencia[]): Campo<Equipamento>[] {
  const texto = (titulo: string, caminho: string, valor: (e: Equipamento) => unknown, explicacao: string, extra: Partial<Campo<Equipamento>> = {}): Campo<Equipamento> => ({
    titulo,
    caminho,
    tipo: 'texto',
    valor,
    explicacao,
    ...extra,
  });
  const informativo = (titulo: string, valor: (e: Equipamento) => unknown, explicacao: string): Campo<Equipamento> => ({
    titulo,
    tipo: 'texto',
    valor,
    explicacao,
  });

  return [
    texto('NOME', 'nome', (e) => e.nome, 'Nome do equipamento.', { obrigatorio: 'Sim', exemplo: 'Inversor 01' }),
    texto('TAG', 'tag', (e) => e.tag ?? null, 'Etiqueta do equipamento. Vazio = mantém (na UC nova, o sistema gera).', { vazioEhPadrao: true }),
    texto('PLANTA', 'planta', (e) => e.unidade?.planta?.nome ?? null, 'A planta da unidade, como na aba REFERÊNCIAS.', {
      obrigatorio: 'Na UC nova',
      lista: referencia(refs, 'plantas'),
    }),
    texto('UNIDADE', 'unidade', (e) => e.unidade?.nome ?? null, 'A unidade (instalação) da UC, dentro da planta. Não se troca a unidade de uma UC que já existe.', {
      obrigatorio: 'Na UC nova',
      lista: referencia(refs, 'unidades'),
    }),
    texto('MODELO', 'modelo', (e) => e.tipo_equipamento_rel?.nome ?? null, 'O modelo, pelo nome ou pelo código, como na aba REFERÊNCIAS. Define a categoria e o fabricante.', {
      obrigatorio: 'Na UC nova',
      lista: referencia(refs, 'modelos'),
    }),
    informativo('CATEGORIA', (e) => e.tipo_equipamento_rel?.categoria?.nome ?? null, 'Vem do modelo (ou da posição).'),
    informativo('FABRICANTE', (e) => e.fabricante ?? null, 'Vem do modelo.'),
    informativo('POSIÇÃO', (e) => e.ativo_funcional?.nome ?? null, 'A posição (ativo funcional) se define na tela.'),
    texto('CRITICIDADE', 'criticidade', (e) => rotuloDaCriticidade(e.criticidade), 'De Muito Baixa a Muito Alta.', {
      obrigatorio: 'Sim',
      lista: LISTA_DE_CRITICIDADES,
      exemplo: 'Média',
    }),
    texto('Nº DE SÉRIE', 'numero_serie', (e) => e.numero_serie ?? null, 'Número de série do fabricante.'),
    texto('LOCALIZAÇÃO', 'localizacao', (e) => e.localizacao ?? null, 'Onde fica, dentro da unidade.'),
    {
      titulo: 'VALOR CONTÁBIL',
      caminho: 'valor_contabil',
      tipo: 'moeda',
      explicacao: 'Em reais.',
      valor: (e) => numero(e.valor_contabil),
    },
    {
      titulo: 'DATA DE IMOBILIZAÇÃO',
      caminho: 'data_imobilizacao',
      tipo: 'data',
      explicacao: 'Data em que entrou no patrimônio.',
      valor: (e) => dia(e.data_imobilizacao),
    },
    { titulo: 'DATA DE INSTALAÇÃO', caminho: 'data_instalacao', tipo: 'data', explicacao: 'Quando foi instalado.', valor: (e) => dia(e.data_instalacao) },
    { titulo: 'GARANTIA ATÉ', caminho: 'garantia_ate', tipo: 'data', explicacao: 'Último dia da garantia.', valor: (e) => dia(e.garantia_ate) },
    texto('FORNECEDOR', 'fornecedor', (e) => e.fornecedor ?? null, 'Texto livre.'),
    texto('CENTRO DE CUSTO', 'centro_custo', (e) => e.centro_custo ?? null, 'Texto livre (ex.: CC-001).'),
    texto('STATUS', 'status', (e) => e.status ?? null, 'Ativo ou Inativo. Inativo tira de uso sem apagar. Vazio = mantém.', {
      lista: '"Ativo,Inativo"',
      vazioEhPadrao: true,
    }),
    { titulo: 'MCPSE', caminho: 'mcpse', tipo: 'simnao', vazioEhPadrao: true, explicacao: 'SIM se o ativo segue o MCPSE. Vazio = mantém.', valor: (e) => !!e.mcpse },
    texto('TUC', 'tuc', (e) => e.tuc ?? null, 'Tipo de unidade de cadastro (MCPSE).'),
    ...(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'] as const).map((a) =>
      texto(a.toUpperCase(), a, (e) => e[a] ?? null, `Atributo ${a.toUpperCase()} do MCPSE.`),
    ),
    texto(
      'PLANO',
      'plano',
      (e) => e.plano?.nome ?? null,
      'O plano da categoria (modelo), pelo nome como na aba REFERÊNCIAS. Trocar o plano faz o mesmo que vincular na tela: a cópia é refeita e as tarefas customizadas são perdidas. Vazio = mantém.',
      { lista: referencia(refs, 'planos'), vazioEhPadrao: true },
    ),
    ...(
      [
        ['ID DA UNIDADE', 'unidade_ref', (e: Equipamento) => e.unidade_id?.trim() ?? null],
        ['ID DO MODELO', 'modelo_ref', (e: Equipamento) => e.tipo_equipamento_rel?.id?.trim() ?? null],
        ['ID DO PLANO', 'plano_ref', (e: Equipamento) => e.plano?.origemId ?? null],
      ] as const
    ).map(
      ([titulo, caminho, valor]): Campo<Equipamento> => ({
        titulo,
        caminho,
        tipo: 'texto',
        identificador: true,
        explicacao: 'Resolve nomes repetidos; com o nome trocado, vale o nome.',
        valor,
      }),
    ),
  ];
}

function secoes(refs: Referencia[]) {
  const dadosTecnicos = secao<Equipamento, DadoTecnico>({
    titulo: 'DADOS TÉCNICOS',
    cor: AZUL_CLARO,
    explicacao: 'Características da UC (potência, tensão…). Dado que sumiu da seção é removido; seção sem nenhuma linha remove todos.',
    itens: (e) => e.dados_tecnicos ?? [],
    colunas: [
      { titulo: 'CAMPO', caminho: 'campo', tipo: 'texto', obrigatorio: 'Sim', explicacao: 'O nome da característica.', exemplo: 'potencia', valor: (d) => d.campo },
      { titulo: 'VALOR', caminho: 'valor', tipo: 'texto', explicacao: 'O valor, como texto.', exemplo: '75', valor: (d) => d.valor },
      { titulo: 'UNIDADE', caminho: 'unidade', tipo: 'texto', explicacao: 'A unidade do valor.', exemplo: 'kW', valor: (d) => d.unidade ?? null },
      {
        titulo: 'TIPO',
        caminho: 'tipo',
        tipo: 'texto',
        lista: '"text,number,select"',
        explicacao: 'text, number ou select. Vazio = text.',
        exemplo: 'number',
        valor: (d) => d.tipo,
      },
    ],
  });

  const componentes = secao<Equipamento, ComponenteDaApi & { modelo: string | null }>({
    titulo: 'COMPONENTES UAR',
    cor: VERDE_RECURSOS,
    explicacao:
      'As partes da UC (strings, placas…). Componente com ID é editado; linha sem ID cria um componente novo nesta UC. Componente que sumiu da seção NÃO é apagado — exclua pela tela.',
    itens: (e) =>
      (e.equipamentos_filhos ?? [])
        .filter((c) => !c.deleted_at)
        .map((c) => ({ ...c, modelo: c.tipo_equipamento_id ? (e.modeloPorId.get(c.tipo_equipamento_id.trim()) ?? null) : null })),
    colunas: [
      { titulo: 'NOME', caminho: 'nome', tipo: 'texto', obrigatorio: 'Sim', explicacao: 'Nome do componente.', valor: (c) => c.nome },
      { titulo: 'TAG', caminho: 'tag', tipo: 'texto', vazioEhPadrao: true, explicacao: 'Etiqueta. Vazio = mantém (no novo, o sistema gera).', valor: (c) => c.tag ?? null },
      { titulo: 'MODELO', caminho: 'modelo', tipo: 'texto', lista: referencia(refs, 'modelos'), vazioEhPadrao: true, explicacao: 'O modelo, pelo nome ou código. Vazio = mantém.', valor: (c) => c.modelo },
      { titulo: 'Nº DE SÉRIE', caminho: 'numero_serie', tipo: 'texto', explicacao: 'Número de série.', valor: (c) => c.numero_serie ?? null },
      { titulo: 'DATA DE INSTALAÇÃO', caminho: 'data_instalacao', tipo: 'data', explicacao: 'Quando foi instalado.', valor: (c) => dia(c.data_instalacao) },
      { titulo: 'GARANTIA ATÉ', caminho: 'garantia_ate', tipo: 'data', explicacao: 'Último dia da garantia.', valor: (c) => dia(c.garantia_ate) },
      {
        titulo: 'CRITICIDADE',
        caminho: 'criticidade',
        tipo: 'texto',
        lista: LISTA_DE_CRITICIDADES,
        vazioEhPadrao: true,
        explicacao: 'De Muito Baixa a Muito Alta. Vazio = mantém (Média no novo).',
        valor: (c) => rotuloDaCriticidade(c.criticidade),
      },
      { titulo: 'LOCALIZAÇÃO ESPECÍFICA', caminho: 'localizacao_especifica', tipo: 'texto', explicacao: 'Onde fica na UC.', valor: (c) => c.localizacao_especifica ?? null },
      { titulo: 'FORNECEDOR', caminho: 'fornecedor', tipo: 'texto', explicacao: 'Texto livre.', valor: (c) => c.fornecedor ?? null },
      { titulo: 'CENTRO DE CUSTO', caminho: 'centro_custo', tipo: 'texto', explicacao: 'Texto livre (ex.: CC-001).', valor: (c) => c.centro_custo ?? null },
      { titulo: 'VALOR IMOBILIZADO', caminho: 'valor_imobilizado', tipo: 'moeda', explicacao: 'Em reais.', valor: (c) => numero(c.valor_imobilizado) },
      { titulo: 'VALOR DE DEPRECIAÇÃO', caminho: 'valor_depreciacao', tipo: 'moeda', explicacao: 'Em reais.', valor: (c) => numero(c.valor_depreciacao) },
      { titulo: 'VALOR CONTÁBIL', caminho: 'valor_contabil', tipo: 'moeda', explicacao: 'Em reais.', valor: (c) => numero(c.valor_contabil) },
      { titulo: 'OBSERVAÇÕES', caminho: 'observacoes', tipo: 'texto', explicacao: 'Texto livre.', valor: (c) => c.observacoes ?? null },
      { titulo: 'ID DO COMPONENTE', caminho: 'id', tipo: 'texto', identificador: true, explicacao: 'Identifica o componente. Em componente novo, deixe vazio.', valor: (c) => c.id.trim() },
      {
        titulo: 'ID DO MODELO',
        caminho: 'modelo_ref',
        tipo: 'texto',
        identificador: true,
        explicacao: 'Resolve nomes repetidos; com o nome trocado, vale o nome.',
        valor: (c) => c.tipo_equipamento_id?.trim() ?? null,
      },
    ],
  });

  const tarefas = secao<Equipamento, TarefaDoPlano>({
    titulo: 'TAREFAS DO PLANO',
    cor: AMARELO,
    somenteLeitura: true,
    explicacao:
      'Só informação: as tarefas do plano deste equipamento. Elas se editam na tela (no plano da categoria ou na ficha do equipamento); a planilha nunca transforma uma tarefa herdada em customizada.',
    itens: (e) => e.tarefasDoPlano,
    colunas: [
      { titulo: 'TAG', tipo: 'texto', explicacao: '', valor: (t) => t.tag },
      { titulo: 'NOME', tipo: 'texto', explicacao: '', valor: (t) => t.nome },
      { titulo: 'INSTRUÇÃO', tipo: 'texto', explicacao: '', valor: (t) => t.instrucao?.nome ?? null },
      {
        titulo: 'PERIODICIDADE',
        tipo: 'texto',
        explicacao: '',
        valor: (t) =>
          t.frequencia === 'PERSONALIZADA'
            ? `A cada ${t.frequencia_personalizada ?? '?'} dias`
            : t.frequencia
              ? (PERIODICIDADES[t.frequencia] ?? t.frequencia)
              : null,
      },
      { titulo: 'CRITICIDADE', tipo: 'texto', explicacao: '', valor: (t) => rotuloDaCriticidade(String(t.criticidade)) },
      { titulo: 'ORIGEM', tipo: 'texto', explicacao: '', valor: (t) => (t.origem_status ? (ORIGENS[t.origem_status] ?? t.origem_status) : null) },
    ],
  });

  return [dadosTecnicos, componentes, tarefas];
}

const resumo: Campo<Equipamento>[] = [
  { titulo: 'NOME', caminho: 'nome', tipo: 'texto', largura: 32, explicacao: '', valor: (e) => e.nome },
  { titulo: 'TAG', tipo: 'texto', largura: 14, explicacao: '', valor: (e) => e.tag ?? null },
  { titulo: 'CLASSIFICAÇÃO', tipo: 'texto', largura: 12, explicacao: '', valor: (e) => e.classificacao },
  { titulo: 'STATUS', tipo: 'texto', largura: 10, explicacao: '', valor: (e) => e.status ?? null },
  { titulo: 'EM OPERAÇÃO', tipo: 'texto', largura: 11, explicacao: '', valor: (e) => e.em_operacao ?? null },
  {
    titulo: 'UNIDADE',
    tipo: 'texto',
    largura: 30,
    explicacao: '',
    valor: (e) => [e.unidade?.planta?.nome, e.unidade?.nome].filter(Boolean).join(' / ') || null,
  },
  { titulo: 'CRITICIDADE', tipo: 'texto', largura: 12, explicacao: '', valor: (e) => rotuloDaCriticidade(e.criticidade) },
  { titulo: 'FABRICANTE', tipo: 'texto', largura: 18, explicacao: '', valor: (e) => e.fabricante ?? null },
  { titulo: 'COMPONENTES', tipo: 'inteiro', largura: 12, explicacao: '', valor: (e) => (e.equipamentos_filhos ?? []).length },
  { titulo: 'PLANO', tipo: 'texto', largura: 30, explicacao: '', valor: (e) => e.plano?.nome ?? null },
];

/** O rótulo da criticidade ("Média") vira o código ("3"); o que não é rótulo segue como veio. */
function criticidadeDoRotulo(valor: unknown) {
  if (typeof valor !== 'string') return valor;
  return Object.entries(CRITICIDADES).find(([, rotulo]) => chave(rotulo) === chave(valor))?.[0] ?? valor;
}

function montar(cabecalhoLido: Record<string, unknown>, secoesLidas: SecoesLidas) {
  const dados: Record<string, unknown> = { ...cabecalhoLido };
  if ('criticidade' in dados) dados.criticidade = criticidadeDoRotulo(dados.criticidade);

  const tecnicos = secoesLidas['DADOS TÉCNICOS'];
  if (tecnicos) dados.dados_tecnicos = tecnicos.map((d) => ({ ...d, tipo: d.tipo ?? 'text', valor: d.valor ?? '' }));

  const componentes = secoesLidas['COMPONENTES UAR'];
  if (componentes) {
    dados.componentes = componentes.map((c) =>
      'criticidade' in c ? { ...c, criticidade: criticidadeDoRotulo(c.criticidade) } : c,
    );
  }

  return dados;
}

function definicao(referencias: Referencia[]): PlanilhaDeFichas<Equipamento> {
  return {
    cadastro: 'Equipamentos',
    singular: 'equipamento',
    tituloDaFicha: 'EQUIPAMENTO (UC)',
    campos: cabecalho(referencias),
    secoes: secoes(referencias),
    resumo,
    larguras: [26, 30, 16, 16, 22, 16, 16, 16, 16, 16, 16, 16, 30, 30],
    id: (e) => e.id.trim(),
    nome: (e) => e.nome,
    atualizadoEm: (e) => e.updated_at ?? null,
    comoTirarDeUso: 'escreva Inativo em STATUS',
    montar,
    referencias,
    regrasDoCadastro: [
      'Cada aba é uma UC. Os componentes (UAR) entram na seção COMPONENTES UAR da UC deles.',
      'Foto, anexos, posição (ativo funcional), pontos e MQTT não passam pela planilha: ficam na tela.',
      'Equipamento compartilhado com o NexOn: a alteração confirmada é replicada lá.',
    ],
  };
}

export const definicaoDeEquipamentos = definicao([]);

type FiltrosDeEquipamentos = Pick<EquipamentosQueryParams, 'search' | 'unidade_id' | 'planta_id' | 'proprietario_id' | 'criticidade'>;

async function referencias(): Promise<{ refs: Referencia[]; modeloPorId: Map<string, string>; templatePorId: Map<string, string> }> {
  const [unidades, modelos, templates] = await Promise.all([
    todasAsPaginas(async (page, limit) => (await api.get('/unidades', { params: { page, limit } })).data),
    api.get('/tipos-equipamentos', { params: { limit: 1000 } }).then((r) => {
      const corpo = r.data?.data ?? r.data;
      return (Array.isArray(corpo) ? corpo : []) as Array<{ id: string; nome: string; codigo: string; fabricante?: string; categoria?: { nome: string } | null }>;
    }),
    todasAsPaginas((page, limit) => planosManutencaoApi.findAll({ page, limit })),
  ]);
  const unidadesDaApi = unidades as Array<{ id: string; nome: string; planta?: { nome: string } | null }>;
  const plantas = [...new Set(unidadesDaApi.map((u) => u.planta?.nome).filter((n): n is string => !!n))].sort();

  return {
    refs: [
      { chave: 'plantas', titulo: 'PLANTAS', colunas: ['NOME'], linhas: plantas.map((p) => [p]) },
      {
        chave: 'unidades',
        titulo: 'UNIDADES',
        colunas: ['NOME', 'PLANTA', 'ID'],
        linhas: unidadesDaApi.map((u) => [u.nome, u.planta?.nome ?? null, u.id.trim()]),
      },
      {
        chave: 'modelos',
        titulo: 'MODELOS',
        colunas: ['NOME', 'CÓDIGO', 'FABRICANTE', 'CATEGORIA', 'ID'],
        linhas: modelos.map((m) => [m.nome, m.codigo, m.fabricante ?? null, m.categoria?.nome ?? null, m.id.trim()]),
      },
      {
        chave: 'planos',
        titulo: 'PLANOS',
        colunas: ['NOME', 'CATEGORIA', 'ID'],
        linhas: templates.map((p) => [p.nome, p.categoria?.nome ?? null, p.id.trim()]),
      },
    ],
    modeloPorId: new Map(modelos.map((m) => [m.id.trim(), m.nome])),
    templatePorId: new Map(templates.map((p) => [p.id.trim(), p.nome])),
  };
}

/**
 * O plano deste equipamento, se tiver (404 = sem plano), pelo nome do
 * TEMPLATE: o nome da cópia pode estar desatualizado e casar com outro template.
 */
async function planoDo(id: string, templatePorId: Map<string, string>): Promise<Equipamento['plano']> {
  try {
    const copia = await planosManutencaoApi.findByEquipamento(id);
    if (!copia?.nome) return null;
    const origemId = copia.plano_origem_id?.trim() ?? null;
    return { nome: (origemId && templatePorId.get(origemId)) || copia.nome, origemId };
  } catch {
    return null;
  }
}

export async function exportarEquipamentos(filtros: FiltrosDeEquipamentos) {
  const [lista, { refs, modeloPorId, templatePorId }] = await Promise.all([
    todasAsPaginas(async (page, limit) => {
      const resposta = await equipamentosApi.findAll({ ...filtros, classificacao: 'UC', ocultarVirtuais: true, page, limit });
      // Depois do interceptor, `data` já é o array; um embrulho a mais o deixaria em `data.data`.
      const corpo = resposta as unknown as { data: EquipamentoDaApi[] | { data: EquipamentoDaApi[] } };
      return { data: Array.isArray(corpo.data) ? corpo.data : corpo.data.data };
    }),
    referencias(),
  ]);

  // Detalhe, plano e tarefas de cada UC — várias ao mesmo tempo, sem afogar a API.
  const equipamentos = await emParalelo(lista, 6, async (item) => {
    const id = item.id.trim();
    const [detalhe, plano, tarefas] = await Promise.all([
      equipamentosApi.findOne(id),
      planoDo(id, templatePorId),
      tarefasApi.findByEquipamento(id).catch(() => []),
    ]);
    return {
      ...(detalhe as unknown as EquipamentoDaApi),
      plano,
      tarefasDoPlano: tarefas as unknown as TarefaDoPlano[],
      modeloPorId,
    };
  });

  await exportarFichas(definicao(refs), equipamentos);
}

/** A leitura não usa as referências: quem acha o nome é o servidor. */
export const lerEquipamentos = (livro: Workbook) => lerFichas(definicaoDeEquipamentos, livro);
