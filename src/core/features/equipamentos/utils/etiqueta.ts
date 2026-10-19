import type { Equipamento } from '@/core/features/equipamentos/types';
import { rotuloDaCriticidade } from '@/core/features/equipamentos/config/criticidade';
import type { EtiquetaDoEquipamento } from '@/lib/pdf/etiqueta-de-equipamento';

/**
 * O que vai na etiqueta do equipamento (SN-67), a partir do equipamento da
 * tela (camelCase) ou da listagem da API (snake_case): o sheet tem um, a lista
 * filtrada o outro.
 */
export interface DadosDaEtiqueta {
  id: string;
  nome: string;
  tag?: string | null;
  criticidade?: string | null;
  planta?: string | null;
  unidade?: string | null;
}

/** O endereço que abre o sheet do equipamento, com o escopo de quem lê. */
export const enderecoDoEquipamento = (origem: string, id: string) =>
  `${origem.replace(/\/+$/, '')}/cadastros/equipamentos?equipamento=${encodeURIComponent(id.trim())}`;

export function etiquetaDe(dados: DadosDaEtiqueta, origem: string): EtiquetaDoEquipamento {
  const lugar = [dados.planta, dados.unidade].map((v) => v?.trim()).filter(Boolean).join(' · ');
  const criticidade = dados.criticidade?.trim() ? rotuloDaCriticidade(dados.criticidade) : null;
  return {
    url: enderecoDoEquipamento(origem, dados.id),
    nome: dados.nome?.trim() || 'Equipamento',
    tag: dados.tag?.trim() || null,
    lugar: lugar || null,
    criticidade,
  };
}

/** O equipamento como o sheet o tem. O componente sem unidade própria vale pela do pai. */
export function dadosDoEquipamento(e: Equipamento, pai?: Equipamento | null): DadosDaEtiqueta {
  const unidade = e.unidade ?? pai?.unidade;
  return {
    id: e.id,
    nome: e.nome,
    tag: e.tag,
    criticidade: e.criticidade,
    planta: unidade?.planta?.nome ?? e.planta?.nome ?? pai?.planta?.nome,
    unidade: unidade?.nome,
  };
}

/** A linha da listagem da API. */
export interface EquipamentoDaListagem {
  id: string;
  nome: string;
  tag?: string | null;
  criticidade?: string | null;
  unidade?: { nome?: string | null; planta?: { nome?: string | null } | null } | null;
}

export const dadosDaListagem = (e: EquipamentoDaListagem): DadosDaEtiqueta => ({
  id: e.id,
  nome: e.nome,
  tag: e.tag,
  criticidade: e.criticidade,
  planta: e.unidade?.planta?.nome,
  unidade: e.unidade?.nome,
});
