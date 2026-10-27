// src/features/execucao-os/utils/planilha-das-os.ts
import type { Workbook } from 'exceljs';
import type { ExecucaoOSListApiResponse, OrdemServicoDaApi, QueryExecucaoOSApiParams } from '@/services/execucao-os.service';
import { prioridadeLabels, statusLabels, tipoLabels } from '@/features/execucao-os/config/labels';
import { origemLabels } from '@/features/programacao-os/config/labels';
import { FUSO_DO_DOCUMENTO } from '@/features/execucao-os/utils/documento-da-os';
import { rotuloDaInstalacao } from '@/utils/instalacao';
import { equipamentoParou } from '@/features/execucao-os/utils/equipamento-parou';
import { bordaFina, cabecalho, moeda, novoLivro } from '@/lib/planilha/estilo';

/**
 * A lista de OS exportada (SN-63): **todas** as OS do filtro da tela, não só a
 * página aberta — a API devolve até 100 por página, então as páginas são
 * lidas em série. Só exportação: OS não é cadastro, não se importa.
 */

/** Acima disto o filtro está largo demais para uma planilha só: recusa logo, pela primeira página. */
export const LIMITE_DA_EXPORTACAO = 10_000;
const POR_PAGINA = 100;

export type BuscarPagina = (params: QueryExecucaoOSApiParams) => Promise<ExecucaoOSListApiResponse>;

/** O filtro passa do teto: a pessoa refina, em vez de receber um recorte calado. */
export class FiltroGrandeDemais extends Error {
  constructor(readonly total: number) {
    super(`O filtro tem ${total} OS; a exportação vai até ${LIMITE_DA_EXPORTACAO}.`);
  }
}

/**
 * As OS do filtro, página por página. A paginação é por posição: uma OS
 * criada, iniciada ou excluída no meio da leitura muda a lista e uma OS pode
 * se repetir (fica a primeira, pelo id) ou faltar. `mudou` diz isso, para a
 * pessoa exportar de novo em vez de confiar num retrato torto.
 */
export async function todasAsOS(
  filtro: QueryExecucaoOSApiParams,
  buscar: BuscarPagina,
): Promise<{ ordens: OrdemServicoDaApi[]; total: number; mudou: boolean }> {
  const vistas = new Set<string>();
  const ordens: OrdemServicoDaApi[] = [];
  let total: number | null = null;
  let mudou = false;
  for (let page = 1; ; page++) {
    const resposta = await buscar({ ...filtro, page, limit: POR_PAGINA });
    // Sem a paginação (outro envelope), a exportação leria uma página só e diria que era tudo
    if (!resposta.pagination) throw new Error('A listagem de OS respondeu sem a paginação: a exportação não sabe quantas são.');
    if (total === null) {
      total = resposta.pagination.total;
      if (total > LIMITE_DA_EXPORTACAO) throw new FiltroGrandeDemais(total);
    } else if (resposta.pagination.total !== total) {
      mudou = true;
    }
    for (const os of resposta.data ?? []) {
      const id = os.id.trim();
      if (vistas.has(id)) {
        mudou = true;
        continue;
      }
      vistas.add(id);
      ordens.push(os);
    }
    if (page >= resposta.pagination.totalPages || (resposta.data ?? []).length === 0) break;
  }
  return { ordens, total: total ?? 0, mudou: mudou || ordens.length !== total };
}

/**
 * O instante no horário de Brasília, como a célula do Excel o guarda: o Excel
 * não tem fuso, e a data de 15:30 UTC aparecia 15:30 — três horas adiantada.
 */
export function dataNaCelula(iso?: string | null): Date | null {
  if (!iso) return null;
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return null;
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: FUSO_DO_DOCUMENTO,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  );
  return new Date(Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute));
}

const horas = (minutos?: number | null) => (minutos === null || minutos === undefined ? null : Math.round((minutos / 60) * 100) / 100);
const texto = (v?: string | null) => v?.trim() || null;

/** Se o equipamento parou (SN-60): a resposta gravada; sem horário, a coluna "Parou em" fica vazia */
function parou(os: OrdemServicoDaApi): string | null {
  const resposta = equipamentoParou(os);
  return resposta === null ? null : resposta ? 'Sim' : 'Não';
}

type Valor = string | number | Date | null;

interface Coluna {
  titulo: string;
  largura: number;
  valor: (os: OrdemServicoDaApi) => Valor;
  formato?: 'data' | 'horas' | 'moeda';
}

export const COLUNAS: Coluna[] = [
  { titulo: 'Nº da OS', largura: 16, valor: (os) => os.numero_os },
  { titulo: 'Tipo', largura: 13, valor: (os) => tipoLabels[os.tipo] ?? os.tipo },
  { titulo: 'Prioridade', largura: 11, valor: (os) => prioridadeLabels[os.prioridade] ?? os.prioridade },
  { titulo: 'Status', largura: 13, valor: (os) => statusLabels[os.status] ?? os.status },
  { titulo: 'Origem', largura: 14, valor: (os) => origemLabels[os.origem] ?? os.origem },
  { titulo: 'Planta', largura: 24, valor: (os) => texto(os.planta?.nome) },
  {
    titulo: 'Instalação',
    largura: 24,
    valor: (os) => {
      const r = rotuloDaInstalacao(os.instalacoes);
      return r.ausente ? null : r.titulo || r.texto;
    },
  },
  { titulo: 'Equipamento', largura: 24, valor: (os) => texto(os.equipamento?.nome) },
  { titulo: 'Descrição', largura: 40, valor: (os) => texto(os.descricao) },
  { titulo: 'Programada para', largura: 16, valor: (os) => dataNaCelula(os.data_hora_programada), formato: 'data' },
  { titulo: 'Início', largura: 16, valor: (os) => dataNaCelula(os.data_hora_inicio_real), formato: 'data' },
  { titulo: 'Fim', largura: 16, valor: (os) => dataNaCelula(os.data_hora_fim_real), formato: 'data' },
  { titulo: 'Finalizada em', largura: 16, valor: (os) => dataNaCelula(os.finalizada_em), formato: 'data' },
  { titulo: 'Responsável', largura: 22, valor: (os) => texto(os.responsavel) },
  { titulo: 'Tempo efetivo (h)', largura: 12, valor: (os) => horas(os.tempo_efetivo_minutos), formato: 'horas' },
  { titulo: 'HH real (h)', largura: 11, valor: (os) => os.hh_real ?? null, formato: 'horas' },
  { titulo: 'HH previsto (h)', largura: 11, valor: (os) => os.hh_estimado ?? null, formato: 'horas' },
  // ?? e não ||: custo 0 é R$ 0,00, não "sem custo" (a média do Excel pularia a linha)
  { titulo: 'Custo real', largura: 13, valor: (os) => (os.custo_real === null || os.custo_real === undefined ? null : Number(os.custo_real)), formato: 'moeda' },
  { titulo: 'Resultado', largura: 40, valor: (os) => texto(os.resultado_servico) },
  { titulo: 'Equipamento parou', largura: 11, valor: parou },
  { titulo: 'Parou em', largura: 16, valor: (os) => dataNaCelula(os.parada_inicio), formato: 'data' },
  { titulo: 'Voltou em', largura: 16, valor: (os) => dataNaCelula(os.parada_fim), formato: 'data' },
  { titulo: 'Tempo parado (h)', largura: 12, valor: (os) => horas(os.minutos_parado), formato: 'horas' },
  { titulo: 'Sintoma', largura: 32, valor: (os) => texto(os.falha_sintoma) },
  { titulo: 'Causa', largura: 32, valor: (os) => texto(os.falha_causa) },
  { titulo: 'Ação tomada', largura: 32, valor: (os) => texto(os.falha_acao) },
];

const FORMATO: Record<NonNullable<Coluna['formato']>, string> = {
  data: 'dd/mm/yyyy hh:mm',
  horas: '0.00',
  moeda: '"R$" #,##0.00',
};

export async function planilhaDasOS(
  ordens: OrdemServicoDaApi[],
  filtro: [string, string][],
  { mudou = false, exportadoEm = new Date(), comCustos = true }: { mudou?: boolean; exportadoEm?: Date; comCustos?: boolean } = {},
): Promise<Workbook> {
  const livro = await novoLivro();

  const aba = livro.addWorksheet('OS', { views: [{ state: 'frozen', ySplit: 1 }] });
  // SERV-10: o cliente não vê dinheiro (a API já manda o custo nulo): sem a coluna vazia
  const colunas = comCustos ? COLUNAS : COLUNAS.filter((c) => c.formato !== 'moeda');
  aba.columns = colunas.map((c) => ({ header: c.titulo, width: c.largura }));
  cabecalho(aba.getRow(1));
  for (const os of ordens) {
    const linha = aba.addRow(colunas.map((c) => c.valor(os)));
    colunas.forEach((c, i) => {
      if (!c.formato) return;
      const celula = linha.getCell(i + 1);
      if (c.formato === 'moeda') moeda(celula);
      else celula.numFmt = FORMATO[c.formato];
    });
  }
  aba.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } };
  bordaFina(aba, colunas.length);

  // O que foi exportado: o filtro e se a planilha traz tudo
  const sobre = livro.addWorksheet('FILTRO');
  sobre.columns = [{ width: 26 }, { width: 60 }];
  const linhas: [string, Valor][] = [
    ['Exportado em', dataNaCelula(exportadoEm.toISOString())],
    ['Horários', 'de Brasília'],
    ['OS na planilha', ordens.length],
    ['Ordem', 'da mais nova para a mais antiga (criação)'],
    ...(mudou
      ? ([['Atenção', 'A lista mudou durante a exportação (OS criada, iniciada ou excluída no meio): exporte de novo para ter o retrato exato.']] as [string, Valor][])
      : []),
    ...filtro,
  ];
  for (const [rotulo, valor] of linhas) {
    const linha = sobre.addRow([rotulo, valor]);
    linha.getCell(1).font = { bold: true };
    if (valor instanceof Date) linha.getCell(2).numFmt = FORMATO.data;
  }
  return livro;
}

/** O que o filtro da tela pede, em palavras, para a aba FILTRO */
interface FiltroDaTela {
  key: string;
  label?: string;
  options?: { value: string; label: string }[];
}

const ROTULO_DA_BUSCA = 'Busca';
const diaBR = (dia: string) => (/^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia.split('-').reverse().join('/') : dia);

/**
 * Os filtros que chegam à API sem estar nos campos da tela (o card "Atrasadas"
 * do painel, tipo e responsável): sem eles a aba FILTRO dizia "todas as OS".
 */
const ENVIADOS_FORA_DA_TELA: [keyof QueryExecucaoOSApiParams, string, (v: unknown) => string][] = [
  ['atrasadas', 'Só as atrasadas', (v) => (v ? 'Sim' : 'Não')],
  ['tipo', 'Tipo', (v) => tipoLabels[String(v)] ?? String(v)],
  ['responsavel', 'Responsável', String],
];

/**
 * Cada filtro preenchido com o rótulo da tela e o nome da opção (não o id), e
 * os que a API recebeu de outro lugar. O equipamento não tem lista de opções: o
 * nome sai das próprias OS exportadas.
 */
export function descricaoDoFiltro(
  valores: Record<string, unknown>,
  filtros: FiltroDaTela[],
  ordens: OrdemServicoDaApi[] = [],
  enviado: QueryExecucaoOSApiParams = {},
): [string, string][] {
  const daTela = filtros.flatMap((f): [string, string][] => {
    const valor = valores[f.key];
    if (valor === undefined || valor === null || valor === '' || valor === 'all') return [];
    const bruto = String(valor);
    const daOpcao = f.options?.find((o) => o.value === bruto)?.label;
    const doEquipamento = f.key === 'equipamento' ? ordens.find((o) => o.equipamento?.id?.trim() === bruto.trim())?.equipamento?.nome : undefined;
    const rotulo = f.label ?? (f.key === 'search' ? ROTULO_DA_BUSCA : f.key);
    return [[rotulo, daOpcao ?? doEquipamento ?? diaBR(bruto)]];
  });
  const jaDitos = new Set(daTela.map(([rotulo]) => rotulo));
  const deFora = ENVIADOS_FORA_DA_TELA.flatMap(([chave, rotulo, valor]): [string, string][] => {
    const v = enviado[chave];
    return v === undefined || v === null || v === '' || jaDitos.has(rotulo) ? [] : [[rotulo, valor(v)]];
  });
  return [...daTela, ...deFora];
}
