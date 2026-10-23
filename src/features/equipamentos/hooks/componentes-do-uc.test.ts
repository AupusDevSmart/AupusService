import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { equipamentosApi } from '@/services/equipamentos.services';
import { transformApiToFrontend, useEquipamentos } from '@/features/equipamentos/hooks/useEquipamentos';

vi.mock('@/services/equipamentos.services', async (original) => ({
  ...(await original<typeof import('@/services/equipamentos.services')>()),
  equipamentosApi: { salvarComponentesUARLote: vi.fn(), findComponentesParaGerenciar: vi.fn() },
}));

/**
 * "Salvar" da lista de componentes no sheet do UC. A lista vem da API pelo
 * transform (camelCase, sem unidade_id nem planta_id), e o transform de volta
 * remontava o objeto sem o id: o backend apagava cada componente e criava uma
 * cópia com id novo, deixando histórico de OS, anexos e plano no apagado
 * (revisão do SN-12).
 */
describe('salvarComponentesUARLote', () => {
  const salvar = vi.mocked(equipamentosApi.salvarComponentesUARLote);

  beforeEach(() => {
    salvar.mockReset();
    salvar.mockResolvedValue({ message: 'ok', componentes: [] } as never);
  });

  const enviados = () => salvar.mock.calls[0][1] as { id?: string; nome?: string }[];

  it('o componente que veio da API vai com o mesmo id', async () => {
    const daApi = transformApiToFrontend({ id: 'uar-1 ', nome: 'Ventoinha', classificacao: 'UAR', criticidade: '3', equipamento_pai_id: 'uc-1' } as never);
    const { result } = renderHook(() => useEquipamentos());

    await act(() => result.current.salvarComponentesUARLote('uc-1', [daApi]));

    expect(enviados()).toEqual([expect.objectContaining({ id: 'uar-1', nome: 'Ventoinha' })]);
  });

  it('o componente novo da lista vai com o id provisório, que o backend cria', async () => {
    const { result } = renderHook(() => useEquipamentos());

    await act(() =>
      result.current.salvarComponentesUARLote('uc-1', [{ id: 'temp_1', nome: 'Novo', classificacao: 'UAR', criticidade: '3' } as never]),
    );

    expect(enviados()).toEqual([expect.objectContaining({ id: 'temp_1', nome: 'Novo' })]);
  });
});

/**
 * Abrir o sheet do UC carrega a lista de componentes. O erro virava lista
 * vazia: "Componentes UAR (0)", sem aviso, e o UC parecia não ter nenhum. Quem
 * chama já avisa (inclusive o 403 do escopo); o hook tem de deixar o erro subir.
 */
describe('fetchComponentesParaGerenciar', () => {
  it('erro da API chega a quem chamou, não vira lista vazia', async () => {
    vi.mocked(equipamentosApi.findComponentesParaGerenciar).mockRejectedValue(new Error('403'));
    const { result } = renderHook(() => useEquipamentos());

    await expect(act(() => result.current.fetchComponentesParaGerenciar('uc-1'))).rejects.toThrow('403');
  });
});
