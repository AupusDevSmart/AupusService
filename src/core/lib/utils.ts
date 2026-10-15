import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Pagination } from "@/core/types/base"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Paginacao como a API manda: nem toda resposta traz todos os campos. */
export type PaginacaoDaApi = Partial<Pagination>;

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

/**
 * Unwrap API response that may be wrapped in multiple layers:
 * - { success, data: { data: [...], pagination } } (NexOn raw)
 * - { data: [...], pagination } (after interceptor unwrap)
 * - [...] (already unwrapped array)
 *
 * Returns { data: T[], pagination } — T e o que o chamador espera da rota;
 * a funcao so desembrulha, nao valida os itens.
 */
export function unwrapApiResponse<T = unknown>(responseData: unknown): { data: T[]; pagination: PaginacaoDaApi } {
  if (!responseData) return { data: [], pagination: {} };

  // Already an array
  if (Array.isArray(responseData)) return { data: responseData, pagination: {} };

  // Valor primitivo nao tem o que desembrulhar (cairia no fallback de qualquer jeito)
  if (!ehObjeto(responseData)) return { data: [], pagination: {} };

  // { success, data: { data: [...], pagination } }
  if (responseData.success !== undefined && responseData.data) {
    return unwrapApiResponse<T>(responseData.data);
  }

  // { data: [...], pagination: {...} }
  if (Array.isArray(responseData.data)) {
    return { data: responseData.data, pagination: (responseData.pagination || {}) as PaginacaoDaApi };
  }

  // { data: { data: [...], pagination } } (double wrapped)
  if (ehObjeto(responseData.data) && responseData.data.data && Array.isArray(responseData.data.data)) {
    return { data: responseData.data.data, pagination: (responseData.data.pagination || responseData.pagination || {}) as PaginacaoDaApi };
  }

  // Fallback
  return { data: [], pagination: {} };
}
