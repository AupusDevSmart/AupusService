import type { AnexoItem, TarifasDoFormulario } from '@/core/features/concessionarias/types';
import type { ConcessionariaResponse, CreateConcessionariaDto, HorariosDaConcessionaria } from '@/services/concessionarias.services';

const HORARIOS = ['hora_inicio_ponta', 'hora_fim_ponta', 'hora_inicio_reservado', 'hora_fim_reservado'] as const;

/**
 * O formulário de concessionária: as tarifas ficam agrupadas em `tarifas`;
 * os horários são decimais (17.5 = 17:30), como o `HoraField` edita.
 */
export interface ConcessionariaDoFormulario {
  id?: string;
  nome?: string;
  estado?: string;
  numero_reh?: string;
  /** Obrigatórias no formulário (o BaseModal cobra antes do submit). */
  data_inicio: string;
  data_validade: string;
  tarifas?: TarifasDoFormulario;
  anexos?: AnexoItem[];
  hora_inicio_ponta?: number | null;
  hora_fim_ponta?: number | null;
  hora_inicio_reservado?: number | null;
  hora_fim_reservado?: number | null;
}

/**
 * A coluna não aceita vazio e o horário apagado não vai no payload: sem esta
 * regra o formulário dizia "salvo" e o horário antigo voltava. 0 é 00:00.
 */
export function horarioObrigatorio(valor: unknown): string | undefined {
  return valor === null || valor === undefined || valor === '' ? 'Informe o horário' : undefined;
}

/** O Decimal do banco chega como texto ("17.5"); vazio fica vazio. */
function horaDaApi(valor: number | string | null | undefined): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : undefined;
}

export function paraApi(data: ConcessionariaDoFormulario): CreateConcessionariaDto {
  const payload: CreateConcessionariaDto = {
    nome: (data.nome || '').trim(),
    estado: (data.estado || '').toUpperCase(),
    numero_reh: (data.numero_reh || '').trim() || undefined,
    data_inicio: data.data_inicio,
    data_validade: data.data_validade,
  };

  if (data.tarifas?.a4_verde) payload.a4_verde = data.tarifas.a4_verde;
  if (data.tarifas?.a3a_verde) payload.a3a_verde = data.tarifas.a3a_verde;
  if (data.tarifas?.b) payload.b = data.tarifas.b;

  // Horário apagado não vai: a coluna não aceita nulo e o backend mantém o que tem
  for (const campo of HORARIOS) {
    const hora = data[campo];
    if (typeof hora === 'number') payload[campo] = hora;
  }

  return payload;
}

export function doFormulario(concessionaria: ConcessionariaResponse): ConcessionariaDoFormulario & { id: string } {
  const horarios: HorariosDaConcessionaria = {};
  for (const campo of HORARIOS) horarios[campo] = horaDaApi(concessionaria[campo]);

  return {
    id: concessionaria.id,
    nome: concessionaria.nome,
    estado: concessionaria.estado || '',
    numero_reh: concessionaria.numero_reh || '',
    data_inicio: concessionaria.data_inicio.split('T')[0],
    data_validade: concessionaria.data_validade.split('T')[0],
    tarifas: {
      a4_verde: concessionaria.a4_verde,
      a3a_verde: concessionaria.a3a_verde,
      b: concessionaria.b,
    },
    anexos: concessionaria.anexos || [],
    ...horarios,
  };
}
