// @vitest-environment node
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { planoDo } from './planilha';

/**
 * O plano de cada equipamento na exportação (26/out/2026): o 404 é "sem plano"
 * e não vai para o aviso global (cada equipamento sem plano punha um erro na
 * tela); o resto para a exportação, em vez de sair o PLANO vazio calado.
 */
const api = vi.hoisted(() => ({ findByEquipamento: vi.fn() }));
vi.mock('@/services/planos-manutencao.services', async (original) => {
  const real = await original<typeof import('@/services/planos-manutencao.services')>();
  return { ...real, planosManutencaoApi: { ...real.planosManutencaoApi, findByEquipamento: api.findByEquipamento } };
});

const erroHttp = (status: number) =>
  new AxiosError('falhou', String(status), undefined, undefined, {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('planoDo (exportação de equipamentos)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pede sem o aviso global e devolve o nome do template', async () => {
    api.findByEquipamento.mockResolvedValue({ nome: 'Nome velho da cópia', plano_origem_id: 't1 ' });

    const plano = await planoDo('e1', new Map([['t1', 'Plano do inversor']]));

    expect(api.findByEquipamento).toHaveBeenCalledWith('e1', { semAvisoGlobal: true });
    expect(plano).toEqual({ nome: 'Plano do inversor', origemId: 't1' });
  });

  it('404: o equipamento não tem plano', async () => {
    api.findByEquipamento.mockRejectedValue(erroHttp(404));

    expect(await planoDo('e1', new Map())).toBeNull();
  });

  it('outro erro para a exportação', async () => {
    api.findByEquipamento.mockRejectedValue(erroHttp(500));

    await expect(planoDo('e1', new Map())).rejects.toThrow('falhou');
  });
});
