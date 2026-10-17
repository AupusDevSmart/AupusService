import { describe, expect, it } from 'vitest';
import { OPCOES_DE_CRITICIDADE, rotuloDaCriticidade } from './criticidade';
import { createEquipamentosFilterConfig } from './filter-config';

/** Filtro por criticidade na lista de equipamentos (SN-65): a API já aceitava, faltava a tela. */
describe('criticidade do equipamento', () => {
  it('o rótulo com o nível e o nome; o valor antigo aparece como veio', () => {
    expect(rotuloDaCriticidade('4')).toBe('4 · Alta');
    expect(rotuloDaCriticidade(' 1 ')).toBe('1 · Muito baixa');
    // Os A/B/C de antes da escala 1–5 não somem da coluna (o SN-64 os converte)
    expect(rotuloDaCriticidade('A')).toBe('A');
    expect(rotuloDaCriticidade(null)).toBe('—');
  });

  it('as opções do filtro: "toda" primeiro, da mais alta à mais baixa', () => {
    expect(OPCOES_DE_CRITICIDADE.map((o) => o.value)).toEqual(['all', '5', '4', '3', '2', '1']);
  });

  it('a lista de equipamentos tem o filtro, antes da busca', () => {
    const chaves = createEquipamentosFilterConfig().map((f) => f.key);
    expect(chaves).toContain('criticidade');
    expect(chaves.indexOf('criticidade')).toBeLessThan(chaves.indexOf('search'));
  });
});

describe('status do equipamento', () => {
  it("'NORMAL' (da sincronização com o NexOn) e variações são Ativo; só 'inativo' é Inativo", async () => {
    const { statusDoEquipamento } = await import('@/core/features/equipamentos/utils/status-do-equipamento');
    expect(['NORMAL', 'Ativo', 'ativo ', null].map(statusDoEquipamento)).toEqual(['Ativo', 'Ativo', 'Ativo', 'Ativo']);
    expect(statusDoEquipamento(' Inativo')).toBe('Inativo');
  });
});
