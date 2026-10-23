import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findOne = vi.fn();
vi.mock('@/services/equipamentos.services', () => ({ equipamentosApi: { findOne: (id: string) => findOne(id) } }));
vi.mock('@/features/equipamentos/hooks/useEquipamentos', () => ({
  transformApiToFrontend: (api: { id: string; nome: string }) => ({ id: api.id, nome: api.nome, classificacao: 'UC' }),
}));

import { useEquipamentoDaUrl } from './useEquipamentoDaUrl';

/** `?equipamento=<id>`: o endereço do QR da etiqueta (SN-67). */
describe('useEquipamentoDaUrl', () => {
  const montar = (url: string, abrir = vi.fn()) => {
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
    const hook = renderHook(() => ({ ...useEquipamentoDaUrl(abrir), local: useLocation() }), { wrapper });
    return { ...hook, abrir };
  };

  // Com chaves: devolver o mock faria o vitest chamá-lo como limpeza depois do teste
  beforeEach(() => {
    findOne.mockReset();
  });

  it('abre o equipamento do parâmetro, uma vez só, e fechar tira o parâmetro', async () => {
    findOne.mockResolvedValue({ id: 'e1', nome: 'Inversor 1' });
    const { result, abrir, rerender } = montar('/cadastros/equipamentos?plantaId=p1&equipamento=e1%20');

    await waitFor(() => expect(abrir).toHaveBeenCalledWith({ id: 'e1', nome: 'Inversor 1', classificacao: 'UC' }));
    expect(findOne).toHaveBeenCalledWith('e1');
    rerender();
    expect(findOne).toHaveBeenCalledTimes(1);

    result.current.limparDaUrl();
    await waitFor(() => expect(result.current.local.search).toBe('?plantaId=p1'));
  });

  // Fora do escopo a API diz "não encontrado" (o interceptor mostra); a lista fica como está
  it('não encontrado: não abre nada e o parâmetro sai', async () => {
    findOne.mockRejectedValue(Object.assign(new Error('404'), { isAxiosError: true }));
    const { result, abrir } = montar('/cadastros/equipamentos?equipamento=de-outra-planta');

    await waitFor(() => expect(result.current.local.search).toBe(''));
    expect(abrir).not.toHaveBeenCalled();
  });

  it('sem o parâmetro, não busca', () => {
    montar('/cadastros/equipamentos?plantaId=p1');
    expect(findOne).not.toHaveBeenCalled();
  });
});
