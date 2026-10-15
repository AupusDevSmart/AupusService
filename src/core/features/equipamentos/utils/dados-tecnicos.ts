import { camposDaCategoria } from '@/core/features/equipamentos/config/campos-por-categoria';

/** Um campo técnico padrão da categoria, pronto para o formulário. */
export interface CampoPadraoPreenchido {
  campo: string;
  rotulo: string;
  valor: string;
  tipo: 'text' | 'number' | 'select';
  unidade: string;
  opcoes?: string[];
  obrigatorio: boolean;
}

/**
 * Os campos técnicos de um equipamento vêm da CATEGORIA (decisão do usuário,
 * 2026-10-15, SN-42). Os padrão da categoria aparecem sempre, preenchidos com o
 * que está gravado; o gravado que não é da categoria segue como campo
 * personalizado — nada some da tela nem do próximo salvar.
 *
 * Antes havia um caminho em que o MODELO ditava os campos, lendo uma lista fixa
 * que nunca casava com os códigos reais: na edição, tudo caía em
 * "personalizados", sem os campos da categoria.
 */
export function separarDadosTecnicos<T extends { campo: string; valor?: string | null }>(
  nomeCategoria: string | null | undefined,
  gravados: T[] = [],
): { padrao: CampoPadraoPreenchido[]; personalizados: T[] } {
  const daCategoria = camposDaCategoria(nomeCategoria);
  const nomes = new Set(daCategoria.map((c) => c.campo));
  const padrao = daCategoria.map((c) => ({
    campo: c.campo,
    rotulo: c.rotulo,
    valor: gravados.find((g) => g.campo === c.campo)?.valor ?? '',
    tipo: c.tipo,
    unidade: c.unidade ?? '',
    opcoes: c.opcoes,
    obrigatorio: false,
  }));
  return { padrao, personalizados: gravados.filter((g) => !nomes.has(g.campo)) };
}
