import type { Workbook } from 'exceljs';

import type { Campo } from '@/lib/planilha/campos';
import { exportarPlana, lerPlana, type PlanilhaPlana } from '@/lib/planilha/plana';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { casarPelaChave, separarOutroSistema } from '@/lib/planilha/outro-sistema';
import { ROTULO_DA_ORIGEM, ROTULO_DA_RUBRICA } from '@/services/recursos.services';
import {
  ROTULO_DA_BASE_DO_MAQUINARIO,
  ROTULO_DO_TIPO_DE_MAQUINARIO,
  maquinariosApi,
  type MaquinarioApiResponse,
  type QueryMaquinariosParams,
} from '@/services/maquinarios.services';

/**
 * Maquinários na planilha: cadastro plano, editado na aba RESUMO. As colunas,
 * a ordem, os rótulos e o nome do cadastro ("Maquinário") são os da planilha
 * do AupusProject (SN-84: decisão do usuário, a de lá importa aqui).
 */

const numero = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? null : Number(v));
const POR: Record<string, string> = { diaria: 'diária', hora: 'h', km: 'km', fechado: '' };

const campos: Campo<MaquinarioApiResponse>[] = [
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    largura: 34,
    obrigatorio: 'Sim',
    explicacao: 'Nome da máquina. É por ele que as instruções a encontram na importação. Não pode repetir o de outra.',
    exemplo: 'Betoneira 400 L',
    valor: (m) => m.nome,
  },
  {
    titulo: 'TIPO',
    caminho: 'tipo',
    tipo: 'opcao',
    rotulos: ROTULO_DO_TIPO_DE_MAQUINARIO,
    largura: 12,
    obrigatorio: 'Sim',
    explicacao: 'Próprio (da empresa) ou Locação (alugado).',
    exemplo: 'Próprio',
    valor: (m) => m.tipo,
  },
  {
    titulo: 'CUSTO APURADO',
    tipo: 'moeda',
    largura: 16,
    explicacao: 'O preço de uma unidade da cobrança que as instruções aplicam hoje.',
    valor: (m) => m.preco_base ?? null,
  },
  {
    titulo: 'POR',
    tipo: 'texto',
    largura: 10,
    explicacao: 'A unidade do custo apurado.',
    valor: (m) => POR[m.base_calculo] || null,
  },
  {
    titulo: 'COBRANÇA',
    caminho: 'base_calculo',
    tipo: 'opcao',
    rotulos: ROTULO_DA_BASE_DO_MAQUINARIO,
    largura: 16,
    vazioEhPadrao: true,
    explicacao: 'Como a máquina é cobrada: por diária, por hora, por quilômetro ou valor fechado. Vazio = por diária.',
    exemplo: 'Por diária',
    valor: (m) => m.base_calculo,
  },
  {
    titulo: 'RUBRICA',
    caminho: 'rubrica',
    tipo: 'opcao',
    rotulos: ROTULO_DA_RUBRICA,
    largura: 20,
    vazioEhPadrao: true,
    explicacao: 'A linha do orçamento em que este custo entra. Vazio = o padrão do tipo.',
    exemplo: 'Instruções',
    valor: (m) => m.rubrica,
  },
  {
    titulo: 'PREÇO UNITÁRIO',
    caminho: 'preco_unitario',
    tipo: 'moeda',
    largura: 16,
    explicacao: 'Preço por unidade da cobrança. Na máquina própria só vale quando falta a amortização.',
    exemplo: '350,00',
    valor: (m) => numero(m.preco_unitario),
  },
  {
    titulo: 'HORAS POR DIÁRIA',
    caminho: 'horas_por_diaria',
    tipo: 'inteiro',
    largura: 12,
    vazioEhPadrao: true,
    explicacao: 'Quantas horas formam uma diária (1 a 24). Vazio = mantém (8 no cadastro novo).',
    exemplo: '8',
    valor: (m) => m.horas_por_diaria,
  },
  {
    titulo: 'VALOR DE AQUISIÇÃO',
    caminho: 'valor_aquisicao',
    tipo: 'moeda',
    largura: 16,
    explicacao: 'O investimento a amortizar.',
    exemplo: '45000,00',
    valor: (m) => numero(m.valor_aquisicao),
  },
  {
    titulo: 'PRAZO DE RETORNO (MESES)',
    caminho: 'prazo_retorno_meses',
    tipo: 'inteiro',
    largura: 14,
    explicacao: 'Em quantos meses o investimento se paga (1 a 600).',
    exemplo: '24',
    valor: (m) => m.prazo_retorno_meses ?? null,
  },
  {
    titulo: 'CUSTOS ANUAIS',
    caminho: 'custos_anuais',
    tipo: 'moeda',
    largura: 14,
    explicacao: 'Manutenção, seguro e licenças por ano.',
    exemplo: '3000,00',
    valor: (m) => numero(m.custos_anuais),
  },
  {
    titulo: 'META DE UTILIZAÇÃO (H/ANO)',
    caminho: 'meta_utilizacao_horas',
    tipo: 'numero',
    largura: 14,
    explicacao: 'Horas de uso previstas por ano.',
    exemplo: '600',
    valor: (m) => numero(m.meta_utilizacao_horas),
  },
  {
    titulo: 'DESCRIÇÃO',
    caminho: 'descricao',
    tipo: 'texto',
    largura: 30,
    explicacao: 'Observação livre.',
    valor: (m) => m.descricao ?? null,
  },
  {
    titulo: 'ATIVO',
    caminho: 'ativo',
    tipo: 'simnao',
    largura: 8,
    vazioEhPadrao: true,
    explicacao: 'NÃO tira a máquina de uso sem apagá-la. Vazio = mantém (SIM no cadastro novo).',
    exemplo: 'SIM',
    valor: (m) => m.ativo,
  },
  {
    titulo: 'CUSTO POR HORA',
    tipo: 'moeda',
    largura: 14,
    explicacao: 'A amortização por hora de uso.',
    valor: (m) => m.custo_hora ?? null,
  },
  {
    titulo: 'ORIGEM DO CUSTO',
    tipo: 'texto',
    largura: 22,
    explicacao: 'De onde saiu o custo apurado. Vazio = falta cadastro para apurar.',
    valor: (m) => (m.custo_origem ? ROTULO_DA_ORIGEM[m.custo_origem] : null),
  },
];

export const definicaoDeMaquinarios: PlanilhaPlana<MaquinarioApiResponse> = {
  cadastro: 'Maquinário',
  singular: 'maquinário',
  campos,
  id: (m) => m.id.trim(),
  nome: (m) => m.nome,
  atualizadoEm: (m) => m.updated_at,
  comoTirarDeUso: 'escreva NÃO em ATIVO',
  regrasDoCadastro: [
    'A planilha de maquinário do Smart Project também importa aqui: os IDs de lá são ignorados e cada máquina casa pelo nome.',
  ],
};

export async function exportarMaquinarios(filtros: Pick<QueryMaquinariosParams, 'tipo' | 'search'>) {
  const maquinarios = await todasAsPaginas((page, limit) => maquinariosApi.listar({ ...filtros, page, limit }));
  await exportarPlana(definicaoDeMaquinarios, maquinarios);
}

/** Lê a aba RESUMO; a planilha do Smart Project casa cada máquina pelo nome (o de mesmo nome edita, o resto cria) */
export async function lerMaquinarios(livro: Workbook) {
  const { deOutroSistema, leitura } = separarOutroSistema(livro, lerPlana(definicaoDeMaquinarios, livro));
  if (!deOutroSistema) return leitura;

  const existentes = await todasAsPaginas((page, limit) => maquinariosApi.listar({ page, limit }));
  return casarPelaChave(
    leitura,
    existentes.map((m) => ({ id: m.id, chave: m.nome, nome: m.nome })),
    (registro) => String(registro.dados.nome ?? ''),
    { singular: 'maquinário' },
  );
}
