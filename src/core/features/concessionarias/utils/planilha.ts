import type { Workbook } from 'exceljs';

import type { Campo } from '@/lib/planilha/campos';
import { exportarPlana, lerPlana, type PlanilhaPlana } from '@/lib/planilha/plana';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import {
  ConcessionariasService,
  type ConcessionariaResponse,
  type FindAllConcessionariasParams,
} from '@/services/concessionarias.services';

/**
 * Concessionárias na planilha: cadastro plano, editado na aba RESUMO. As
 * tarifas são campos fixos por subgrupo (14 colunas), não uma lista.
 *
 * Os horários de ponta e reservado saem em cinza: a tela ainda não os grava
 * (SN-11), e a planilha não pode fazer o que o formulário não faz.
 */

type ConcessionariaDaApi = ConcessionariaResponse & {
  hora_inicio_ponta?: number | string | null;
  hora_fim_ponta?: number | string | null;
  hora_inicio_reservado?: number | string | null;
  hora_fim_reservado?: number | string | null;
};

const dia = (valor: string) => valor.slice(0, 10);
const numero = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));

/** "18.5" → "18:30" — como a tela mostra o horário. */
function hora(v: unknown): string | null {
  const n = numero(v);
  if (n === null || Number.isNaN(n)) return null;
  const minutos = Math.round(n * 60);
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

/** Uma coluna de tarifa: R$/kWh ou R$/kW, com até 6 casas. */
function tarifa(
  titulo: string,
  caminho: string,
  valor: (c: ConcessionariaDaApi) => unknown,
  explicacao: string,
): Campo<ConcessionariaDaApi> {
  return {
    titulo,
    caminho,
    tipo: 'numero',
    largura: 12,
    explicacao: `${explicacao} Até 6 casas decimais. Vazio = sem tarifa.`,
    exemplo: '0,345678',
    valor: (c) => numero(valor(c)),
  };
}

const campos: Campo<ConcessionariaDaApi>[] = [
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 28,
    explicacao: 'Nome da concessionária.',
    exemplo: 'Equatorial Goiás',
    valor: (c) => c.nome,
  },
  {
    titulo: 'UF',
    caminho: 'estado',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 6,
    explicacao: 'Sigla do estado, em duas letras.',
    exemplo: 'GO',
    valor: (c) => c.estado,
  },
  {
    titulo: 'REH',
    caminho: 'numero_reh',
    tipo: 'texto',
    largura: 16,
    explicacao: 'Número da Resolução Homologatória da ANEEL (até 50 caracteres).',
    exemplo: 'REH 3.000/2026',
    valor: (c) => c.numero_reh ?? null,
  },
  {
    titulo: 'INÍCIO DA VIGÊNCIA',
    caminho: 'data_inicio',
    tipo: 'data',
    obrigatorio: 'Sim',
    largura: 12,
    explicacao: 'Primeiro dia em que as tarifas valem.',
    exemplo: '22/10/2026',
    valor: (c) => dia(c.data_inicio),
  },
  {
    titulo: 'VALIDADE',
    caminho: 'data_validade',
    tipo: 'data',
    obrigatorio: 'Sim',
    largura: 12,
    explicacao: 'Último dia de vigência. Tem de ser depois do início.',
    exemplo: '21/10/2027',
    valor: (c) => dia(c.data_validade),
  },
  tarifa('A4 VERDE TUSD D', 'a4_verde.tusd_d', (c) => c.a4_verde?.tusd_d, 'A4 Verde: TUSD de demanda (R$/kW).'),
  tarifa('A4 VERDE TUSD P', 'a4_verde.tusd_p', (c) => c.a4_verde?.tusd_p, 'A4 Verde: TUSD na ponta (R$/kWh).'),
  tarifa('A4 VERDE TUSD FP', 'a4_verde.tusd_fp', (c) => c.a4_verde?.tusd_fp, 'A4 Verde: TUSD fora da ponta (R$/kWh).'),
  tarifa('A4 VERDE TE D', 'a4_verde.te_d', (c) => c.a4_verde?.te_d, 'A4 Verde: TE de demanda.'),
  tarifa('A4 VERDE TE P', 'a4_verde.te_p', (c) => c.a4_verde?.te_p, 'A4 Verde: TE na ponta (R$/kWh).'),
  tarifa('A4 VERDE TE FP', 'a4_verde.te_fp', (c) => c.a4_verde?.te_fp, 'A4 Verde: TE fora da ponta (R$/kWh).'),
  tarifa('A3A VERDE TUSD D', 'a3a_verde.tusd_d', (c) => c.a3a_verde?.tusd_d, 'A3a Verde: TUSD de demanda (R$/kW).'),
  tarifa('A3A VERDE TUSD P', 'a3a_verde.tusd_p', (c) => c.a3a_verde?.tusd_p, 'A3a Verde: TUSD na ponta (R$/kWh).'),
  tarifa('A3A VERDE TUSD FP', 'a3a_verde.tusd_fp', (c) => c.a3a_verde?.tusd_fp, 'A3a Verde: TUSD fora da ponta (R$/kWh).'),
  tarifa('A3A VERDE TE D', 'a3a_verde.te_d', (c) => c.a3a_verde?.te_d, 'A3a Verde: TE de demanda.'),
  tarifa('A3A VERDE TE P', 'a3a_verde.te_p', (c) => c.a3a_verde?.te_p, 'A3a Verde: TE na ponta (R$/kWh).'),
  tarifa('A3A VERDE TE FP', 'a3a_verde.te_fp', (c) => c.a3a_verde?.te_fp, 'A3a Verde: TE fora da ponta (R$/kWh).'),
  tarifa('GRUPO B TUSD', 'b.tusd_valor', (c) => c.b?.tusd_valor, 'Grupo B: TUSD (R$/kWh).'),
  tarifa('GRUPO B TE', 'b.te_valor', (c) => c.b?.te_valor, 'Grupo B: TE (R$/kWh).'),
  {
    titulo: 'PONTA (INÍCIO–FIM)',
    tipo: 'texto',
    largura: 14,
    explicacao: 'O horário de ponta da concessionária. Muda pela tela, não pela planilha.',
    valor: (c) => `${hora(c.hora_inicio_ponta) ?? '—'}–${hora(c.hora_fim_ponta) ?? '—'}`,
  },
  {
    titulo: 'RESERVADO (INÍCIO–FIM)',
    tipo: 'texto',
    largura: 14,
    explicacao: 'O horário reservado da concessionária. Muda pela tela, não pela planilha.',
    valor: (c) => `${hora(c.hora_inicio_reservado) ?? '—'}–${hora(c.hora_fim_reservado) ?? '—'}`,
  },
];

/** UF em maiúsculas: o servidor só aceita duas letras maiúsculas. */
function montar(dados: Record<string, unknown>) {
  return typeof dados.estado === 'string' ? { ...dados, estado: dados.estado.toUpperCase() } : dados;
}

export const definicaoDeConcessionarias: PlanilhaPlana<ConcessionariaDaApi> = {
  cadastro: 'Concessionárias',
  singular: 'concessionária',
  campos,
  id: (c) => c.id.trim(),
  nome: (c) => c.nome,
  atualizadoEm: (c) => c.updated_at,
  comoTirarDeUso: 'exclua a concessionária na tela de Concessionárias',
  montar,
  regrasDoCadastro: ['Anexos da concessionária não passam pela planilha: anexe pela tela.'],
};

export async function exportarConcessionarias(filtros: Pick<FindAllConcessionariasParams, 'search' | 'estado'>) {
  const concessionarias = await todasAsPaginas((page, limit) =>
    ConcessionariasService.getAllConcessionarias({ ...filtros, page, limit, orderBy: 'nome', orderDirection: 'asc' }),
  );
  await exportarPlana(definicaoDeConcessionarias, concessionarias as ConcessionariaDaApi[]);
}

export const lerConcessionarias = (livro: Workbook) => lerPlana(definicaoDeConcessionarias, livro);
