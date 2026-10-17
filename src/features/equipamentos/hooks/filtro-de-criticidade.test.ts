import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { equipamentosApi } from '@/services/equipamentos.services';
import { useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';

vi.mock('@/services/equipamentos.services', async (original) => ({
  ...(await original<typeof import('@/services/equipamentos.services')>()),
  equipamentosApi: { findAll: vi.fn() },
}));

/** O filtro de criticidade da lista chega à API (SN-65); "toda criticidade" não vai. */
describe('filtro de criticidade da lista de equipamentos', () => {
  const findAll = vi.mocked(equipamentosApi.findAll);

  beforeEach(() => {
    findAll.mockReset();
    findAll.mockResolvedValue({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } as never);
  });

  it('o nível escolhido vai como criticidade', async () => {
    const { result } = renderHook(() => useEquipamentos());

    await act(() => result.current.fetchEquipamentos({ criticidade: '4' } as never));

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ criticidade: '4' }));
  });

  it('"toda criticidade" não filtra', async () => {
    const { result } = renderHook(() => useEquipamentos());

    await act(() => result.current.fetchEquipamentos({ criticidade: 'all' } as never));

    expect(findAll.mock.calls[0][0]).toMatchObject({ criticidade: undefined });
  });
});
