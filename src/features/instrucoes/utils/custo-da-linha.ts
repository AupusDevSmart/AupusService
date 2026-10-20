// src/features/instrucoes/utils/custo-da-linha.ts
import type { BaseDeCusto } from '@/services/recursos.services';

const EM_HORAS = /^(h|hr|hrs|hs|hora|horas)$/;

/**
 * Quantas unidades da cobrança a linha consome, para o custo que o editor da
 * instrução mostra enquanto se digita. A conta que vale é a do servidor
 * (`quantidadeNaBase`, `modules/recursos/regras-do-recurso.ts`), que devolve o
 * `subtotal` de cada linha e alimenta a proposta; esta é a mesma regra, só
 * para a tela responder sem ida ao servidor a cada tecla.
 *
 * O instrumento passou a ser cobrado por diária (SN-83): a linha em horas vira
 * diárias arredondadas para cima — 2 h de megôhmetro é 1 diária, não 2.
 */
export function quantidadeNaBase(
  recurso: { base_calculo?: BaseDeCusto | string | null; horas_por_diaria?: number | null } | undefined,
  linha: { quantidade?: number | string | null; unidade?: string | null },
): number {
  const quantidade = Number(String(linha.quantidade ?? 1).replace(',', '.')) || 1;
  const emHoras = EM_HORAS.test((linha.unidade ?? '').trim().toLowerCase());
  if (recurso?.base_calculo === 'diaria' && emHoras) return Math.ceil(quantidade / Math.max(recurso.horas_por_diaria ?? 8, 1));
  return quantidade;
}
