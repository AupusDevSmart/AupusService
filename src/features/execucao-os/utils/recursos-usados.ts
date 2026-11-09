import type { FerramentaOS, MaterialOS } from '../types';

/** O que `PATCH :id/materiais` grava de cada item (só item que a OS já tem) */
export interface RegistroDeMaterial {
  id: string;
  quantidade_consumida: number;
  observacoes?: string;
}

/** O que `PATCH :id/ferramentas` grava de cada item */
export interface RegistroDeFerramenta {
  id: string;
  utilizada: boolean;
  condicao_antes?: string;
  condicao_depois?: string;
  observacoes?: string;
}

/** Material da OS como a seção "Materiais e ferramentas usados" o mostra */
export interface MaterialUsado {
  id: string;
  descricao: string;
  unidade: string;
  planejada: number;
  /** null: ninguém registrou ainda (diferente de 0, "não usei") */
  consumida: number | null;
  /** Só para o custo até agora (o cliente não recebe: a API não manda o valor) */
  custoUnitario: number | null;
  observacoes?: string;
}

export interface FerramentaUsada {
  id: string;
  descricao: string;
  unidade?: string;
  quantidade: number;
  utilizada: boolean;
  condicao_antes?: string;
  condicao_depois?: string;
  observacoes?: string;
}

/** O Decimal do Prisma chega como texto ("2.5"); vazio é zero */
const numero = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numeroOuNulo = (v: unknown) => (v === null || v === undefined || v === '' ? null : numero(v));
const texto = (v?: string | null) => (v?.trim() ? v.trim() : undefined);
/** Só o item que o servidor conhece: a rota grava item que existe, e o id volta com espaço (Char(26)) */
const doServidor = (id?: string | null): id is string => Boolean(id?.trim()) && !String(id).startsWith('temp_');

export function materiaisDaExecucao(materiais: MaterialOS[]): MaterialUsado[] {
  return materiais
    .filter((m) => doServidor(m.id))
    .map((m) => ({
      id: m.id!.trim(),
      descricao: m.descricao,
      unidade: m.unidade || 'un',
      planejada: numero(m.quantidade_planejada),
      consumida: numeroOuNulo(m.quantidade_consumida),
      custoUnitario: numeroOuNulo(m.custo_unitario),
      observacoes: texto(m.observacoes),
    }));
}

export function ferramentasDaExecucao(ferramentas: (FerramentaOS & { unidade?: string | null })[]): FerramentaUsada[] {
  return ferramentas
    .filter((f) => doServidor(f.id))
    .map((f) => ({
      id: f.id!.trim(),
      descricao: f.descricao,
      unidade: texto(f.unidade),
      quantidade: numero(f.quantidade),
      utilizada: Boolean(f.utilizada),
      condicao_antes: texto(f.condicao_antes),
      condicao_depois: texto(f.condicao_depois),
      observacoes: texto(f.observacoes),
    }));
}

/**
 * O pedido leva a observação que o item já tem: a seção não a edita, e o
 * pedido sem ela não pode passar por "apagar".
 */
export const pedidoDoMaterial = (m: MaterialUsado): RegistroDeMaterial => ({
  id: m.id,
  quantidade_consumida: m.consumida ?? 0,
  ...(m.observacoes ? { observacoes: m.observacoes } : {}),
});

export const pedidoDaFerramenta = (f: FerramentaUsada): RegistroDeFerramenta => ({
  id: f.id,
  utilizada: f.utilizada,
  ...(f.condicao_antes ? { condicao_antes: f.condicao_antes } : {}),
  ...(f.condicao_depois ? { condicao_depois: f.condicao_depois } : {}),
  ...(f.observacoes ? { observacoes: f.observacoes } : {}),
});

/**
 * O custo do material registrado até agora: consumido × custo unitário, a conta
 * do custo real da API (`resumo-do-custo.ts`). O não registrado não entra.
 */
export function custoDoMaterialUsado(materiais: MaterialUsado[]): number {
  const total = materiais.reduce((soma, m) => soma + (m.consumida ?? 0) * (m.custoUnitario ?? 0), 0);
  return Math.round(total * 100) / 100;
}

/** Troca na lista os itens de mesmo id, na ordem que estavam */
export function trocarPorId<T extends { id: string }>(lista: T[], novos: T[]): T[] {
  return lista.map((item) => novos.find((n) => n.id === item.id) ?? item);
}

/**
 * O atalho "Usei tudo como planejado": preenche o que ninguém registrou e marca
 * as ferramentas desmarcadas. O consumo já informado (usou 2 de 5) fica.
 */
export function usoComoPlanejado(materiais: MaterialUsado[], ferramentas: FerramentaUsada[]) {
  return {
    materiais: materiais.filter((m) => m.consumida === null).map((m) => ({ ...m, consumida: m.planejada })),
    ferramentas: ferramentas.filter((f) => !f.utilizada).map((f) => ({ ...f, utilizada: true })),
  };
}

/** "2,5 m", "1 un": vírgula decimal, sem casa à toa; o não registrado é um traço */
export function quantidadeLegivel(quantidade: number | null, unidade?: string): string {
  if (quantidade === null) return '—';
  const n = quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
  return unidade ? `${n} ${unidade}` : n;
}
