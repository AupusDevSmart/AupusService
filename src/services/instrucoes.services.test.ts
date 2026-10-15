import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/config/api';
import { instrucoesApi } from '@/services/instrucoes.services';

vi.mock('@/config/api', () => ({
  api: { put: vi.fn(async () => ({ data: {} })), post: vi.fn(async () => ({ data: {} })) },
}));

/**
 * A ordem das sub-instruções é a posição na lista (SN-12). Arrastar só
 * reordenava o array, e o payload reenviava o `ordem` antigo de cada passo:
 * o backend grava `ordem` quando vem, e a ordem nova se perdia ao salvar.
 */
describe('instrucoesApi: ordem das sub-instruções', () => {
  beforeEach(() => vi.mocked(api.put).mockClear());

  const passo = (descricao: string, ordem: number) => ({ descricao, ordem, obrigatoria: false });
  const enviadas = () => vi.mocked(api.put).mock.calls[0][1] as { sub_instrucoes: { descricao: string; ordem: number }[] };

  it('a ordem enviada é a posição na lista (arrastar grava)', async () => {
    // "Desligar" foi arrastado para o topo: o array mudou, o `ordem` antigo não
    await instrucoesApi.update('i1', { sub_instrucoes: [passo('Desligar', 3), passo('Limpar', 1), passo('Religar', 2)] });

    expect(enviadas().sub_instrucoes.map((s) => [s.descricao, s.ordem])).toEqual([
      ['Desligar', 1],
      ['Limpar', 2],
      ['Religar', 3],
    ]);
  });

  it('o que o servidor gerencia não vai no payload', async () => {
    const vindaDaApi = { ...passo('Limpar', 1), id: 's1', instrucao_id: 'i1', created_at: 'x' };
    await instrucoesApi.update('i1', { sub_instrucoes: [vindaDaApi] });

    expect(enviadas().sub_instrucoes[0]).not.toHaveProperty('id');
  });
});
