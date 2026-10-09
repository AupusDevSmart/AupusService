import type { Workbook } from 'exceljs';

import { referenciaDePlantas } from '@/lib/planilha/catalogos';
import type { Campo } from '@/lib/planilha/campos';
import { exportarPlana, lerPlana, type PlanilhaPlana } from '@/lib/planilha/plana';
import type { Referencia } from '@/lib/planilha/referencias';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { agendaService, type FeriadoResponse, type QueryFeriadosParams } from '@/services/agenda.services';

/**
 * Feriados na planilha: cadastro plano, editado na aba RESUMO. As plantas de
 * um feriado que não é geral vão numa célula só, separadas por ";".
 */

const TIPOS: Record<string, string> = {
  NACIONAL: 'Nacional',
  ESTADUAL: 'Estadual',
  MUNICIPAL: 'Municipal',
  PERSONALIZADO: 'Personalizado',
};

/** A data do feriado é de calendário: a API devolve a meia-noite UTC do dia. */
const dia = (valor: string) => valor.slice(0, 10);

const plantasDe = (f: FeriadoResponse) => (f.geral ? [] : (f.plantas ?? []));

const campos: Campo<FeriadoResponse>[] = [
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 30,
    explicacao: 'Nome do feriado (de 2 a 255 caracteres).',
    exemplo: 'Aniversário de Goiânia',
    valor: (f) => f.nome,
  },
  {
    titulo: 'DATA',
    caminho: 'data',
    tipo: 'data',
    obrigatorio: 'Sim',
    largura: 12,
    explicacao: 'O dia do feriado. Não pode haver dois feriados ativos no mesmo dia.',
    exemplo: '24/10/2026',
    valor: (f) => dia(f.data),
  },
  {
    titulo: 'TIPO',
    caminho: 'tipo',
    tipo: 'opcao',
    rotulos: TIPOS,
    obrigatorio: 'Sim',
    largura: 14,
    explicacao: 'A esfera do feriado.',
    exemplo: 'Municipal',
    valor: (f) => f.tipo,
  },
  {
    titulo: 'GERAL',
    caminho: 'geral',
    tipo: 'simnao',
    obrigatorio: 'Sim',
    largura: 8,
    explicacao: 'SIM vale para todas as plantas; NÃO vale só para as da coluna PLANTAS.',
    exemplo: 'NÃO',
    valor: (f) => f.geral,
  },
  {
    titulo: 'PLANTAS',
    caminho: 'plantas',
    tipo: 'texto',
    largura: 40,
    obrigatorio: 'Quando GERAL = NÃO',
    explicacao:
      'Só quando GERAL = NÃO: as plantas em que o feriado vale, pelo nome como na aba REFERÊNCIAS, separadas por ";". Com GERAL = SIM, fica vazia.',
    exemplo: 'Planta Goiânia; Planta Anápolis',
    valor: (f) => plantasDe(f).map((p) => p.nome).join('; ') || null,
  },
  {
    titulo: 'RECORRENTE',
    caminho: 'recorrente',
    tipo: 'simnao',
    vazioEhPadrao: true,
    largura: 11,
    explicacao: 'SIM se o feriado se repete todo ano. Vazio = mantém (NÃO no feriado novo).',
    exemplo: 'SIM',
    valor: (f) => f.recorrente,
  },
  {
    titulo: 'DESCRIÇÃO',
    caminho: 'descricao',
    tipo: 'texto',
    largura: 30,
    explicacao: 'Texto livre.',
    valor: (f) => f.descricao ?? null,
  },
  {
    titulo: 'SITUAÇÃO',
    tipo: 'texto',
    largura: 10,
    explicacao: 'Ativo ou Inativo. Muda pela tela (excluir inativa o feriado), não pela planilha.',
    valor: (f) => (f.ativo ? 'Ativo' : 'Inativo'),
  },
  {
    titulo: 'IDS DAS PLANTAS',
    caminho: 'plantas_ids',
    tipo: 'texto',
    identificador: true,
    largura: 30,
    explicacao:
      'Os IDs das plantas da coluna PLANTAS, na mesma ordem. Resolvem nomes repetidos; com o nome trocado, vale o nome. Em linha nova, deixe vazio.',
    valor: (f) => plantasDe(f).map((p) => p.id.trim()).join('; ') || null,
  },
];

function definicao(referencias: Referencia[]): PlanilhaPlana<FeriadoResponse> {
  return {
    cadastro: 'Feriados',
    singular: 'feriado',
    campos,
    id: (f) => f.id.trim(),
    nome: (f) => f.nome,
    atualizadoEm: (f) => f.updated_at,
    comoTirarDeUso: 'exclua o feriado na tela de Feriados (ele fica inativo, não some)',
    referencias,
  };
}

export const definicaoDeFeriados = definicao([]);

export async function exportarFeriados(filtros: Omit<QueryFeriadosParams, 'page' | 'limit'>) {
  const [feriados, plantas] = await Promise.all([
    todasAsPaginas((page, limit) => agendaService.getFeriados({ ...filtros, page, limit })),
    referenciaDePlantas(),
  ]);
  await exportarPlana(definicao([plantas]), feriados);
}

/** A leitura não usa as referências: quem acha o nome é o servidor. */
export const lerFeriados = (livro: Workbook) => lerPlana(definicaoDeFeriados, livro);
